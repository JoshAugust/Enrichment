/**
 * post-call-actions.js — Auto-email and retry scheduling after every call
 *
 * After a call result is finalized (via Vapi webhook), this module:
 *   1. Selects the right email template based on outcome + company type
 *   2. Composes and sends the email (respects DRY_RUN)
 *   3. Logs the send to post_call_emails
 *   4. Schedules or cancels retries based on outcome
 *
 * Intended delay per outcome (v1 sends immediately; delay intent is noted):
 *   voicemail_left      → cold intro     (immediately)
 *   interested          → follow_up_1    (intended: 30-min delay — sent immediately in v1)
 *   meeting_booked      → confirmation   (immediately)
 *   callback_requested  → follow_up_1    (immediately)
 *   not_interested      → no email
 *   no_answer           → cold intro     (intended: 2-hour delay — sent immediately in v1)
 *   failed              → no email
 *
 * Exports:
 *   handlePostCallActions(callResult) — main entry point, call after DB update
 */

'use strict';

const { v4: uuidv4 }      = require('uuid');
const { db }              = require('../db');
const { composeDraft }    = require('../email/email-composer');
const { sendDraft, DRY_RUN } = require('../email/email-sender');
const { scheduleRetry, cancelRetries } = require('./retry-scheduler');

// ── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS post_call_emails (
    id              TEXT PRIMARY KEY,
    call_result_id  TEXT NOT NULL,
    contact_id      TEXT,
    template_used   TEXT,
    subject         TEXT,
    status          TEXT DEFAULT 'pending'
      CHECK(status IN ('pending','sent','failed','skipped')),
    scheduled_for   TEXT,
    sent_at         TEXT,
    created_at      TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_post_call_emails_call_result ON post_call_emails(call_result_id);
  CREATE INDEX IF NOT EXISTS idx_post_call_emails_contact     ON post_call_emails(contact_id);
  CREATE INDEX IF NOT EXISTS idx_post_call_emails_status      ON post_call_emails(status);
`);

console.log('[post-call-actions] Schema ready');

// ── Email routing table ───────────────────────────────────────────────────────

/**
 * Map call outcome → template slug (relative to company type where needed).
 * Returns null if no email should be sent.
 *
 * @param {string} outcome      — e.g. 'voicemail_left', 'interested'
 * @param {string} companyType  — 'operator' | 'lender' | 'arranger'
 * @returns {string|null} template slug
 */
function selectPostCallTemplate(outcome, companyType) {
  const type = (companyType || 'operator').toLowerCase();

  switch (outcome) {
    case 'voicemail_left':
      // cold intro matching audience type
      return `cold_intro_${type === 'arranger' ? 'arranger' : type === 'lender' ? 'lender' : 'operator'}`;

    case 'no_answer':
      // same cold intro — intended delay: 2 hours (sent immediately in v1)
      return `cold_intro_${type === 'arranger' ? 'arranger' : type === 'lender' ? 'lender' : 'operator'}`;

    case 'interested':
      // follow-up with details — intended delay: 30 minutes (sent immediately in v1)
      return 'follow_up_1';

    case 'meeting_booked':
      return 'meeting_confirmation';

    case 'callback_requested':
      // "looking forward to reconnecting"
      return 'follow_up_1';

    case 'not_interested':
    case 'failed':
    default:
      return null; // no email
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

function _getContact(contactId) {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId) || null;
}

function _getCompany(companyId) {
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(companyId) || null;
}

function _logPostCallEmail(data) {
  const id  = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO post_call_emails
      (id, call_result_id, contact_id, template_used, subject, status, scheduled_for, sent_at, created_at)
    VALUES
      (@id, @call_result_id, @contact_id, @template_used, @subject, @status, @scheduled_for, @sent_at, @created_at)
  `).run({
    id,
    call_result_id: data.call_result_id,
    contact_id:     data.contact_id     || null,
    template_used:  data.template_used  || null,
    subject:        data.subject        || null,
    status:         data.status         || 'pending',
    scheduled_for:  data.scheduled_for  || null,
    sent_at:        data.sent_at        || null,
    created_at:     now,
  });
  return id;
}

// ── handlePostCallActions ─────────────────────────────────────────────────────

/**
 * Main entry point — call this after every call_results update.
 *
 * @param {Object} callResult — row from call_results (must include id, outcome, contact_id, company_id)
 * @returns {Promise<{ emailSent: boolean, retryScheduled: boolean, logId: string|null }>}
 */
async function handlePostCallActions(callResult) {
  const { id: callResultId, outcome, contact_id, company_id } = callResult;

  if (!outcome) {
    // Outcome not yet determined (e.g. partial webhook events) — skip
    return { emailSent: false, retryScheduled: false, logId: null };
  }

  console.log(`[post-call-actions] Processing outcome="${outcome}" for callResult=${callResultId}`);

  // ── 1. Load contact and company ───────────────────────────────────────────

  const contact = contact_id ? _getContact(contact_id) : null;
  const company = company_id ? _getCompany(company_id) : null;

  if (!contact) {
    console.warn(`[post-call-actions] No contact found for callResult=${callResultId} — skipping email`);
    // Still handle retries even without a contact record
    await _handleRetryLogic(outcome, callResult, contact_id);
    return { emailSent: false, retryScheduled: false, logId: null };
  }

  if (!contact.email) {
    console.warn(`[post-call-actions] Contact ${contact.id} has no email address — skipping email`);
    const logId = _logPostCallEmail({
      call_result_id: callResultId,
      contact_id:     contact.id,
      template_used:  null,
      status:         'skipped',
    });
    await _handleRetryLogic(outcome, callResult, contact.id);
    return { emailSent: false, retryScheduled: false, logId };
  }

  const companyType = company?.type || 'operator';

  // ── 2. Select template ────────────────────────────────────────────────────

  const templateSlug = selectPostCallTemplate(outcome, companyType);

  if (!templateSlug) {
    console.log(`[post-call-actions] No email for outcome="${outcome}" — skipping`);
    const logId = _logPostCallEmail({
      call_result_id: callResultId,
      contact_id:     contact.id,
      template_used:  null,
      status:         'skipped',
    });
    await _handleRetryLogic(outcome, callResult, contact.id);
    return { emailSent: false, retryScheduled: false, logId };
  }

  // ── 3. Compose the email ──────────────────────────────────────────────────

  let draft;
  try {
    // calendarLink token for meeting_confirmation template
    const tokenOverrides = {};
    if (templateSlug === 'meeting_confirmation') {
      tokenOverrides.calendarLink = process.env.CORGI_CALENDAR_LINK || 'https://calendly.com/corgi-insurance/intro';
    }

    draft = composeDraft(contact.id, {
      templateSlug,
      tokenOverrides,
    });
  } catch (err) {
    console.error(`[post-call-actions] composeDraft failed for template "${templateSlug}":`, err.message);
    const logId = _logPostCallEmail({
      call_result_id: callResultId,
      contact_id:     contact.id,
      template_used:  templateSlug,
      status:         'failed',
    });
    await _handleRetryLogic(outcome, callResult, contact.id);
    return { emailSent: false, retryScheduled: false, logId };
  }

  // ── 4. Send (respects DRY_RUN) ────────────────────────────────────────────

  let sendStatus = 'pending';
  let sentAt     = null;

  // v1: send immediately for all outcomes.
  // Intended delays (TODO: implement via a job queue / cron for production):
  //   - no_answer:  +2 hours
  //   - interested: +30 minutes
  try {
    const result = await sendDraft(draft.id, contact.email);
    sendStatus   = result.dryRun ? 'sent' : 'sent'; // 'sent' in both modes for logging clarity
    sentAt       = new Date().toISOString();

    console.log(
      `[post-call-actions] Email ${DRY_RUN ? '(DRY RUN) ' : ''}sent` +
      ` template="${templateSlug}" to ${contact.email} for outcome="${outcome}"`
    );
  } catch (err) {
    console.error(`[post-call-actions] sendDraft failed:`, err.message);
    sendStatus = 'failed';
  }

  // ── 5. Log to post_call_emails ────────────────────────────────────────────

  const logId = _logPostCallEmail({
    call_result_id: callResultId,
    contact_id:     contact.id,
    template_used:  templateSlug,
    subject:        draft.subject,
    status:         sendStatus,
    sent_at:        sentAt,
  });

  // ── 6. Retry logic ────────────────────────────────────────────────────────

  const retryScheduled = await _handleRetryLogic(outcome, callResult, contact.id);

  return {
    emailSent:       sendStatus === 'sent',
    templateUsed:    templateSlug,
    retryScheduled,
    logId,
  };
}

// ── _handleRetryLogic ─────────────────────────────────────────────────────────

/**
 * Schedule or cancel retries based on outcome.
 * @param {string} outcome
 * @param {Object} callResult
 * @param {string} contactId
 * @returns {boolean} whether a retry was scheduled
 */
async function _handleRetryLogic(outcome, callResult, contactId) {
  try {
    if (outcome === 'no_answer' || outcome === 'failed') {
      const retry = scheduleRetry(callResult);
      return !!retry;
    }

    if (
      outcome === 'meeting_booked' ||
      outcome === 'interested'     ||
      outcome === 'not_interested'
    ) {
      if (contactId) cancelRetries(contactId);
    }
  } catch (err) {
    console.error('[post-call-actions] Retry logic error:', err.message);
  }
  return false;
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  handlePostCallActions,
  selectPostCallTemplate,
};
