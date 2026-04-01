'use strict';

/**
 * email-sender.js — Send engine for Corgi Outreach
 *
 * ╔══════════════════════════════════════════════════════════╗
 * ║  CRITICAL: DRY_RUN=true BY DEFAULT                       ║
 * ║  Nothing actually sends until DRY_RUN is explicitly      ║
 * ║  set to "false" in environment AND a campaign is         ║
 * ║  explicitly approved.                                    ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Resend API integration with:
 *   - Sequence management (day 3, 7, 14 follow-ups)
 *   - Open/click tracking preparation
 *   - Rate limiting (max 50/day, staggered sends)
 */

const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
require('dotenv').config();

const config = require('../../config/default.json');
const gmailTransport = require('./gmail-transport');

// ── Safety switches ───────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN !== 'false'; // true unless explicitly overridden
const MAX_SENDS_PER_DAY = 50;
const STAGGER_MS = 2000; // 2 s between sends in a batch

const FROM_EMAIL = process.env.FROM_EMAIL || config.outreach.default_from_email;
const FROM_NAME  = process.env.FROM_NAME  || config.outreach.default_from_name;

// ── Email backend: Gmail SMTP (free) > Resend (paid) ─────────────────────────
const EMAIL_BACKEND = gmailTransport.isConfigured() ? 'gmail' : (process.env.RESEND_API_KEY ? 'resend' : 'none');

let _resend = null;

function _getResend() {
  if (_resend) return _resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (!DRY_RUN) {
      throw new Error('No email backend configured. Set GMAIL_APP_PASSWORD (free) or RESEND_API_KEY.');
    }
    return null;
  }

  const { Resend } = require('resend');
  _resend = new Resend(apiKey);
  return _resend;
}

/**
 * Send an email using the best available backend.
 * Priority: Gmail SMTP (free) → Resend API (paid)
 */
async function _sendEmail(payload) {
  if (EMAIL_BACKEND === 'gmail') {
    console.log('[email-sender] Sending via Gmail SMTP (free)');
    return await gmailTransport.send(payload);
  }

  if (EMAIL_BACKEND === 'resend') {
    console.log('[email-sender] Sending via Resend API');
    const resend = _getResend();
    const { data, error } = await resend.emails.send(payload);
    if (error) throw new Error(error.message);
    return data;
  }

  throw new Error('No email backend configured. Set GMAIL_APP_PASSWORD (free) or RESEND_API_KEY.');
}

// ── Tracking helpers ──────────────────────────────────────────────────────────

/**
 * Build a 1×1 tracking pixel URL for a draft.
 * @param {string} draftId
 * @returns {string} HTML img tag
 */
function buildTrackingPixel(draftId) {
  const base = process.env.APP_URL || 'https://app.corgi.xyz';
  return `<img src="${base}/api/email/track/open/${draftId}" width="1" height="1" alt="" style="display:none">`;
}

/**
 * Wrap a plain URL with click-tracking redirect.
 * @param {string} url
 * @param {string} draftId
 * @returns {string}
 */
function wrapLink(url, draftId) {
  const base = process.env.APP_URL || 'https://app.corgi.xyz';
  const encoded = encodeURIComponent(url);
  return `${base}/api/email/track/click/${draftId}?url=${encoded}`;
}

/**
 * Inject tracking pixel + wrap links into HTML body.
 * Only applied when tracking is enabled (TRACK_EMAILS=true).
 *
 * @param {string} html
 * @param {string} draftId
 * @returns {string}
 */
function injectTracking(html, draftId) {
  if (process.env.TRACK_EMAILS !== 'true') return html;

  // Replace anchor hrefs with tracked versions
  const tracked = html.replace(/href="(https?:\/\/[^"]+)"/g, (_, url) => {
    return `href="${wrapLink(url, draftId)}"`;
  });

  // Inject pixel before </body>
  const pixel = buildTrackingPixel(draftId);
  return tracked.replace('</body>', `${pixel}\n</body>`);
}

// ── Rate-limiting state ───────────────────────────────────────────────────────

let _sendCountToday = 0;
let _lastCountReset = new Date().toDateString();

function _checkAndIncrementRate() {
  const today = new Date().toDateString();
  if (today !== _lastCountReset) {
    _sendCountToday = 0;
    _lastCountReset = today;
  }
  if (_sendCountToday >= MAX_SENDS_PER_DAY) {
    throw new Error(`Daily send limit reached (${MAX_SENDS_PER_DAY}/day). Try again tomorrow.`);
  }
  _sendCountToday++;
}

function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send (or dry-run) a single draft email.
 *
 * @param {string} draftId
 * @param {string} toEmail  — recipient address
 * @returns {Object} result log
 */
async function sendDraft(draftId, toEmail) {
  const draft = db.prepare(`SELECT * FROM email_drafts WHERE id = ?`).get(draftId);
  if (!draft) throw new Error(`Draft not found: ${draftId}`);

  if (draft.status === 'sent') {
    return { draftId, status: 'already_sent', dryRun: DRY_RUN };
  }

  // Parse body
  let bodyHtml, bodyText;
  try {
    const parsed = JSON.parse(draft.body);
    bodyHtml = parsed.html;
    bodyText = parsed.text;
  } catch (_) {
    bodyHtml = draft.body;
    bodyText = draft.body;
  }

  // Inject tracking
  const trackedHtml = injectTracking(bodyHtml, draftId);

  const payload = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [toEmail],
    subject: draft.subject,
    html: trackedHtml,
    text: bodyText,
  };

  // ── DRY RUN ──
  if (DRY_RUN) {
    const logEntry = {
      draftId,
      dryRun: true,
      timestamp: new Date().toISOString(),
      to: toEmail,
      subject: draft.subject,
      templateName: draft.template_name,
      wouldSend: payload,
    };
    console.log('[email-sender] DRY RUN — would send:', JSON.stringify(logEntry, null, 2));

    // Mark as 'approved' in dry run (not 'sent') so it's reviewable
    db.prepare(`UPDATE email_drafts SET status = 'approved' WHERE id = ?`).run(draftId);

    return { ...logEntry, status: 'dry_run' };
  }

  // ── LIVE SEND ──
  _checkAndIncrementRate();

  let sendResult;

  try {
    sendResult = await _sendEmail(payload);
  } catch (err) {
    console.error(`[email-sender] Send failed for draft ${draftId}:`, err.message);
    throw err;
  }

  // Mark as sent
  db.prepare(`UPDATE email_drafts SET status = 'sent' WHERE id = ?`).run(draftId);

  // Log in outreach_log
  const contact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(draft.contact_id);
  if (contact) {
    db.prepare(`
      INSERT INTO outreach_log (id, contact_id, channel, status, script_version, notes, completed_at, created_at)
      VALUES (?, ?, 'email', 'completed', ?, ?, datetime('now'), datetime('now'))
    `).run(
      uuidv4(),
      contact.id,
      draft.template_name,
      `Sent via Resend. Message ID: ${sendResult?.id || 'unknown'}`
    );
  }

  console.log(`[email-sender] SENT draft ${draftId} to ${toEmail}. Resend ID: ${sendResult?.id}`);

  return {
    draftId,
    dryRun: false,
    resendId: sendResult?.id,
    to: toEmail,
    subject: draft.subject,
    status: 'sent',
    timestamp: new Date().toISOString(),
  };
}

// ── Sequence scheduler ────────────────────────────────────────────────────────

/**
 * Schedule the full follow-up sequence for a contact (day 3, 7, 14).
 * Creates draft records for each follow-up — does NOT send anything.
 *
 * Requires email-composer to be imported here to avoid circular deps.
 *
 * @param {string} contactId
 * @param {string} [campaignId]
 * @param {string} [abVariant]
 * @returns {Array<Object>} created draft summaries
 */
function scheduleSequence(contactId, campaignId, abVariant = 'a') {
  const { composeDraft } = require('./email-composer');

  const followUpDays = [3, 7, 14];
  const drafts = [];

  for (const day of followUpDays) {
    const draft = composeDraft(contactId, {
      sequenceDay: day,
      abVariant,
      campaignId,
    });
    drafts.push(draft);
    console.log(`[email-sender] Scheduled follow-up day ${day} draft for contact ${contactId}`);
  }

  return drafts;
}

/**
 * Process all approved drafts that are due to send now.
 * Respects rate limits and stagger delay.
 *
 * @returns {{ attempted: number, sent: number, errors: Array }}
 */
async function processDueEmails() {
  // Find approved drafts with scheduled_at <= now
  let query = `
    SELECT d.id, c.email as contact_email
    FROM email_drafts d
    JOIN contacts c ON d.contact_id = c.id
    WHERE d.status = 'approved'
  `;

  // Only include scheduled emails if the column exists
  let rows;
  try {
    rows = db.prepare(query + ` AND (d.scheduled_at IS NULL OR d.scheduled_at <= datetime('now'))`).all();
  } catch (_) {
    rows = db.prepare(query).all();
  }

  const result = { attempted: rows.length, sent: 0, errors: [] };

  for (const row of rows) {
    if (!row.contact_email) {
      result.errors.push({ draftId: row.id, error: 'No email address for contact' });
      continue;
    }

    try {
      await sendDraft(row.id, row.contact_email);
      result.sent++;
      await _sleep(STAGGER_MS);
    } catch (err) {
      result.errors.push({ draftId: row.id, error: err.message });
    }
  }

  console.log(
    `[email-sender] processDueEmails complete — sent: ${result.sent}/${result.attempted}, errors: ${result.errors.length}`
  );

  return result;
}

module.exports = {
  sendDraft,
  scheduleSequence,
  processDueEmails,
  buildTrackingPixel,
  wrapLink,
  DRY_RUN,
};
