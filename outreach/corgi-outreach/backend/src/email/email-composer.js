'use strict';

/**
 * email-composer.js — Draft generation engine for Corgi Outreach
 *
 * Selects the right template for a contact, fills personalization tokens
 * from company/contact research data, and saves drafts to the database.
 * NEVER sends automatically — all output is DRAFT status.
 */

const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');
const { selectTemplate, render } = require('./template-engine');
const { convert: htmlToText } = require('html-to-text');

require('dotenv').config();

// ── Default sender ────────────────────────────────────────────────────────────
const config = require('../../config/default.json');
const DEFAULT_CALLER_NAME = config.outreach.default_from_name || 'Josh Augustine';
const DEFAULT_FROM_EMAIL  = config.outreach.default_from_email || 'josh@corgi.xyz';

// ── Pain-point library (audience-type → default if none in research) ──────────
const DEFAULT_PAIN_POINTS = {
  operator:
    'A lot of lenders still get stuck on one question: what are the GPUs worth at maturity? We solve for that.',
  lender:
    'The deal economics look great until someone asks about end-of-term hardware value. We give you a cleaner answer.',
  arranger:
    'Deals slow when no one is comfortable taking GPU residual value risk. We add the floor that gets it moving.',
};

// ── Token builder ─────────────────────────────────────────────────────────────

/**
 * Build personalization tokens for a contact + company pair.
 * Pulls data from the DB and merges with any overrides passed in.
 *
 * @param {Object} contact        — row from contacts table
 * @param {Object} company        — row from companies table
 * @param {Object} [overrides]    — any manually-set token overrides
 * @returns {Object} tokens
 */
function buildTokens(contact, company, overrides = {}) {
  const firstName = contact.name ? contact.name.split(' ')[0] : 'there';

  // Pull latest research note for specificDetail
  const research = db
    .prepare(
      `SELECT summary FROM research_notes WHERE company_id = ? ORDER BY created_at DESC LIMIT 1`
    )
    .get(company.id);

  const specificDetail =
    overrides.specificDetail ||
    (research ? _extractSpecificDetail(research.summary) : '') ||
    company.description ||
    '';

  const painPoint =
    overrides.painPoint ||
    DEFAULT_PAIN_POINTS[company.type] ||
    DEFAULT_PAIN_POINTS.operator;

  return {
    firstName,
    companyName: company.name,
    painPoint,
    specificDetail,
    callerName: overrides.callerName || DEFAULT_CALLER_NAME,
    referrerName: overrides.referrerName || '',
    previousSubject: overrides.previousSubject || '',
    isLender: company.type === 'lender',
    isArranger: company.type === 'arranger',
    isOperator: company.type === 'operator',
    trackingPixel: '', // populated later by email-sender if tracking enabled
    ...overrides,
  };
}

/**
 * Pull a short punchy detail from a research summary.
 * Tries to extract a parenthetical-style fact (funding, scale, etc.)
 * @param {string} summary
 * @returns {string}
 */
function _extractSpecificDetail(summary) {
  if (!summary) return '';
  // BUG-005 fix: strip leading URL artifacts like [https://domain.com]
  let cleaned = summary.replace(/^\[https?:\/\/[^\]]*\]\s*/gm, '').trim();
  // WARN-001 fix: strip trailing period so template doesn't produce double periods
  // Take the first sentence if it's short enough
  const firstSentence = cleaned.split(/[.\n]/)[0].trim();
  const detail = firstSentence.length <= 120 ? firstSentence : '';
  // Strip trailing period to avoid double-period when injected before template punctuation
  return detail.replace(/\.$/, '');
}

// ── Draft persistence ─────────────────────────────────────────────────────────

/**
 * Save a rendered email to the email_drafts table with status='draft'.
 *
 * @param {string} contactId
 * @param {string} subject
 * @param {string} bodyHtml
 * @param {string} bodyText
 * @param {string} templateSlug
 * @param {Object} [meta]  — extra metadata (abVariant, campaignId, sequenceDay, scheduledAt)
 * @returns {string} draft id
 */
function saveDraft(contactId, subject, bodyHtml, bodyText, templateSlug, meta = {}) {
  const id = uuidv4();

  // email_drafts schema may have been extended by campaign-manager — use a safe insert
  const body = JSON.stringify({ html: bodyHtml, text: bodyText });

  db.prepare(`
    INSERT INTO email_drafts (id, contact_id, subject, body, template_name, status)
    VALUES (?, ?, ?, ?, ?, 'draft')
  `).run(id, contactId, subject, body, templateSlug);

  // If the extended columns exist (added by campaign-manager), backfill them
  try {
    if (meta.campaignId) {
      db.prepare(`UPDATE email_drafts SET campaign_id = ? WHERE id = ?`).run(meta.campaignId, id);
    }
    if (meta.abVariant) {
      db.prepare(`UPDATE email_drafts SET ab_variant = ? WHERE id = ?`).run(meta.abVariant, id);
    }
    if (meta.sequenceDay !== undefined) {
      db.prepare(`UPDATE email_drafts SET sequence_day = ? WHERE id = ?`).run(meta.sequenceDay, id);
    }
    if (meta.scheduledAt) {
      db.prepare(`UPDATE email_drafts SET scheduled_at = ? WHERE id = ?`).run(meta.scheduledAt, id);
    }
  } catch (_) {
    // Extended columns not yet added — safe to ignore
  }

  return id;
}

// ── Compose API ───────────────────────────────────────────────────────────────

/**
 * Compose a single draft email for a contact.
 *
 * @param {string} contactId
 * @param {Object} [options]
 * @param {string}  [options.templateSlug]  — override auto-selection
 * @param {string}  [options.abVariant]     — 'a' or 'b'
 * @param {number}  [options.sequenceDay]   — 0 | 3 | 7 | 14
 * @param {boolean} [options.isWarm]        — warm intro (referral)
 * @param {Object}  [options.tokenOverrides]— manual token overrides
 * @param {string}  [options.campaignId]
 * @returns {Object} draft record
 */
function composeDraft(contactId, options = {}) {
  const {
    templateSlug: forcedSlug,
    abVariant = 'a',
    sequenceDay = 0,
    isWarm = false,
    tokenOverrides = {},
    campaignId,
  } = options;

  // Load contact + company
  const contact = db.prepare(`SELECT * FROM contacts WHERE id = ?`).get(contactId);
  if (!contact) throw new Error(`Contact not found: ${contactId}`);

  const company = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(contact.company_id);
  if (!company) throw new Error(`Company not found for contact: ${contactId}`);

  // Select template
  const slug = forcedSlug || selectTemplate(company.type, sequenceDay, isWarm);

  // Build tokens
  const tokens = buildTokens(contact, company, tokenOverrides);

  // Render
  const { subject, html, text } = render(slug, tokens, abVariant);

  // Compute scheduled_at (relative to now)
  let scheduledAt = null;
  if (sequenceDay > 0) {
    const d = new Date();
    d.setDate(d.getDate() + sequenceDay);
    scheduledAt = d.toISOString();
  }

  // Persist as draft
  const draftId = saveDraft(contact.id, subject, html, text, slug, {
    campaignId,
    abVariant,
    sequenceDay,
    scheduledAt,
  });

  return {
    id: draftId,
    contactId: contact.id,
    contactName: contact.name,
    companyName: company.name,
    templateSlug: slug,
    abVariant,
    sequenceDay,
    subject,
    html,
    text,
    scheduledAt,
    status: 'draft',
  };
}

/**
 * Batch-compose drafts for ALL contacts (or a filtered subset).
 *
 * @param {Object} [filters]
 * @param {string}  [filters.companyType]   — 'operator' | 'lender' | 'arranger'
 * @param {string}  [filters.priority]      — 'A' | 'B' | 'C'
 * @param {string}  [filters.campaignId]
 * @param {string}  [filters.abVariant]     — 'a' | 'b'
 * @param {boolean} [filters.skipExisting]  — skip contacts who already have a draft (default: true)
 * @returns {{ drafted: number, skipped: number, errors: Array, drafts: Array }}
 */
function composeBatch(filters = {}) {
  const {
    companyType,
    priority,
    campaignId,
    abVariant = 'a',
    skipExisting = true,
    contactIds,       // WARN-006 fix: support filtering by specific contact IDs
  } = filters;

  // Build query
  let query = `
    SELECT c.id, c.company_id FROM contacts c
    JOIN companies co ON c.company_id = co.id
    WHERE 1=1
  `;
  const params = [];

  if (companyType) { query += ` AND co.type = ?`; params.push(companyType); }
  if (priority)    { query += ` AND co.priority = ?`; params.push(priority); }
  // WARN-006 fix: filter by contactIds if provided
  if (Array.isArray(contactIds) && contactIds.length > 0) {
    query += ` AND c.id IN (${contactIds.map(() => '?').join(',')})`;
    params.push(...contactIds);
  }

  const contacts = db.prepare(query).all(...params);

  const results = { drafted: 0, skipped: 0, errors: [], drafts: [] };

  for (const row of contacts) {
    try {
      if (skipExisting) {
        const existing = db
          .prepare(`SELECT id FROM email_drafts WHERE contact_id = ? AND status = 'draft' LIMIT 1`)
          .get(row.id);
        if (existing) {
          results.skipped++;
          continue;
        }
      }

      const draft = composeDraft(row.id, { abVariant, campaignId });
      results.drafts.push(draft);
      results.drafted++;
    } catch (err) {
      results.errors.push({ contactId: row.id, error: err.message });
    }
  }

  console.log(
    `[composer] Batch complete — drafted: ${results.drafted}, skipped: ${results.skipped}, errors: ${results.errors.length}`
  );

  return results;
}

/**
 * List drafts from the database.
 * @param {Object} [filters]
 * @param {string}  [filters.contactId]
 * @param {string}  [filters.status]     — 'draft' | 'approved' | 'sent'
 * @param {string}  [filters.campaignId]
 * @param {number}  [filters.limit]
 * @returns {Array}
 */
function listDrafts(filters = {}) {
  const { contactId, status, campaignId, limit = 100 } = filters;

  let query = `
    SELECT d.*, c.name as contact_name, co.name as company_name
    FROM email_drafts d
    JOIN contacts c ON d.contact_id = c.id
    JOIN companies co ON c.company_id = co.id
    WHERE 1=1
  `;
  const params = [];

  if (contactId) { query += ` AND d.contact_id = ?`; params.push(contactId); }
  if (status)    { query += ` AND d.status = ?`; params.push(status); }

  try {
    if (campaignId) { query += ` AND d.campaign_id = ?`; params.push(campaignId); }
  } catch (_) {}

  query += ` ORDER BY d.created_at DESC LIMIT ?`;
  params.push(limit);

  return db.prepare(query).all(...params).map(row => ({
    ...row,
    body: safeParseBody(row.body),
  }));
}

function safeParseBody(bodyStr) {
  try { return JSON.parse(bodyStr); } catch (_) { return { html: bodyStr, text: bodyStr }; }
}

module.exports = {
  buildTokens,
  composeDraft,
  composeBatch,
  saveDraft,
  listDrafts,
};
