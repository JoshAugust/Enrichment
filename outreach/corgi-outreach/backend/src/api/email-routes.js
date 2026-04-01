'use strict';

/**
 * email-routes.js — Express API routes for the Corgi email pipeline
 *
 * All write operations produce DRAFTS only. Nothing sends without
 * explicit campaign approval + DRY_RUN=false.
 *
 * Routes:
 *   GET  /api/email/templates
 *   GET  /api/email/templates/:slug
 *   POST /api/email/compose/:contactId
 *   POST /api/email/compose-batch
 *   GET  /api/email/drafts
 *   GET  /api/email/drafts/:id
 *   PATCH /api/email/drafts/:id
 *   POST /api/email/campaigns
 *   GET  /api/email/campaigns
 *   GET  /api/email/campaigns/:id
 *   GET  /api/email/campaigns/:id/report
 *   POST /api/email/campaigns/:id/approve
 *   POST /api/email/campaigns/:id/pause
 *   POST /api/email/campaigns/:id/generate-drafts
 *   GET  /api/email/contacts/discover/:companyId
 *   POST /api/email/send/dry-run/:draftId
 *   GET  /api/email/track/open/:draftId    (tracking pixel)
 *   GET  /api/email/track/click/:draftId   (click redirect)
 */

const express = require('express');
const router  = express.Router();

const { listTemplates, getTemplateMeta, render, selectTemplate } = require('../email/template-engine');
const { composeDraft, composeBatch, listDrafts }                  = require('../email/email-composer');
const { sendDraft, DRY_RUN }                                       = require('../email/email-sender');
const { discoverContacts }                                         = require('../email/contact-finder');
const {
  createCampaign,
  getCampaign,
  listCampaigns,
  generateDrafts,
  approveCampaign,
  pauseCampaign,
  campaignReport,
} = require('../email/campaign-manager');
const { db } = require('../db');

// ── Helper ────────────────────────────────────────────────────────────────────
function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}
function err(res, message, status = 400) {
  return res.status(status).json({ ok: false, error: message });
}
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// ── Templates ─────────────────────────────────────────────────────────────────

/**
 * GET /api/email/templates
 * List all available email templates.
 */
router.get('/templates', (req, res) => {
  ok(res, listTemplates());
});

/**
 * GET /api/email/templates/:slug
 * Get metadata + preview for a specific template.
 */
router.get('/templates/:slug', (req, res) => {
  try {
    const meta = getTemplateMeta(req.params.slug);

    // Optionally render a preview with sample tokens
    const preview = req.query.preview === 'true';
    let rendered = null;

    if (preview) {
      const sampleTokens = {
        firstName: 'Alex',
        companyName: req.query.company || 'Voltage Park',
        painPoint: 'Lenders get stuck on what the GPUs are worth at maturity — we solve that.',
        specificDetail: req.query.detail || '',
        callerName: 'Josh Augustine',
        referrerName: 'a mutual contact',
        previousSubject: 'GPU financing — a quick thought',
        isLender: false,
        isArranger: false,
        isOperator: true,
      };
      rendered = render(req.params.slug, sampleTokens, req.query.ab || 'a');
    }

    ok(res, { ...meta, rendered });
  } catch (e) {
    err(res, e.message, 404);
  }
});

// ── Compose ───────────────────────────────────────────────────────────────────

/**
 * POST /api/email/compose/:contactId
 * Generate a draft email for a single contact.
 *
 * Body: {
 *   templateSlug?: string,
 *   abVariant?: 'a' | 'b',
 *   sequenceDay?: 0 | 3 | 7 | 14,
 *   isWarm?: boolean,
 *   campaignId?: string,
 *   tokenOverrides?: { painPoint?, specificDetail?, callerName?, referrerName? }
 * }
 */
router.post('/compose/:contactId', asyncHandler(async (req, res) => {
  const draft = composeDraft(req.params.contactId, req.body || {});
  ok(res, draft, 201);
}));

/**
 * POST /api/email/compose-batch
 * Generate drafts for all contacts matching filters.
 *
 * Body: {
 *   companyType?: 'operator' | 'lender' | 'arranger',
 *   priority?: 'A' | 'B' | 'C',
 *   campaignId?: string,
 *   abVariant?: 'a' | 'b',
 *   skipExisting?: boolean
 * }
 */
router.post('/compose-batch', asyncHandler(async (req, res) => {
  const result = composeBatch(req.body || {});
  ok(res, result, 201);
}));

// ── Drafts ────────────────────────────────────────────────────────────────────

/**
 * GET /api/email/drafts
 * List drafts with optional filters.
 * Query: ?contactId=&status=&campaignId=&limit=
 */
router.get('/drafts', (req, res) => {
  const { contactId, status, campaignId, limit } = req.query;
  const drafts = listDrafts({ contactId, status, campaignId, limit: limit ? parseInt(limit) : 100 });
  ok(res, drafts);
});

/**
 * GET /api/email/drafts/:id
 * Get a single draft by ID.
 */
router.get('/drafts/:id', (req, res) => {
  const draft = db.prepare(`
    SELECT d.*, c.name as contact_name, co.name as company_name, c.email as contact_email
    FROM email_drafts d
    JOIN contacts c ON d.contact_id = c.id
    JOIN companies co ON c.company_id = co.id
    WHERE d.id = ?
  `).get(req.params.id);

  if (!draft) return err(res, 'Draft not found', 404);

  // Parse body JSON
  try { draft.body = JSON.parse(draft.body); } catch (_) {}

  ok(res, draft);
});

/**
 * PATCH /api/email/drafts/:id
 * Update a draft (subject or body overrides, or status transition to 'approved').
 *
 * Body: { subject?, bodyHtml?, bodyText?, status? }
 */
router.patch('/drafts/:id', (req, res) => {
  const { subject, bodyHtml, bodyText, status } = req.body || {};
  const draft = db.prepare(`SELECT * FROM email_drafts WHERE id = ?`).get(req.params.id);
  if (!draft) return err(res, 'Draft not found', 404);

  if (status && !['draft', 'approved'].includes(status)) {
    return err(res, 'Only "draft" or "approved" transitions are allowed via this endpoint');
  }

  if (subject) db.prepare(`UPDATE email_drafts SET subject = ? WHERE id = ?`).run(subject, draft.id);

  if (bodyHtml || bodyText) {
    let existing;
    try { existing = JSON.parse(draft.body); } catch (_) { existing = { html: draft.body, text: '' }; }
    const newBody = JSON.stringify({
      html: bodyHtml || existing.html,
      text: bodyText || existing.text,
    });
    db.prepare(`UPDATE email_drafts SET body = ? WHERE id = ?`).run(newBody, draft.id);
  }

  if (status) db.prepare(`UPDATE email_drafts SET status = ? WHERE id = ?`).run(status, draft.id);

  const updated = db.prepare(`SELECT * FROM email_drafts WHERE id = ?`).get(draft.id);
  try { updated.body = JSON.parse(updated.body); } catch (_) {}
  ok(res, updated);
});

// ── Campaigns ─────────────────────────────────────────────────────────────────

/**
 * POST /api/email/campaigns
 * Create a new campaign.
 *
 * Body: {
 *   name: string,
 *   description?: string,
 *   audienceType?: 'operator' | 'lender' | 'arranger' | 'all',
 *   priorityFilter?: 'A' | 'B' | 'C',
 *   abVariant?: 'a' | 'b',
 *   abTestEnabled?: boolean
 * }
 */
router.post('/campaigns', asyncHandler(async (req, res) => {
  const campaign = createCampaign(req.body || {});
  ok(res, campaign, 201);
}));

/**
 * GET /api/email/campaigns
 * List all campaigns.
 * Query: ?status=
 */
router.get('/campaigns', (req, res) => {
  ok(res, listCampaigns({ status: req.query.status }));
});

/**
 * GET /api/email/campaigns/:id
 * Get campaign details.
 */
router.get('/campaigns/:id', (req, res) => {
  try {
    ok(res, getCampaign(req.params.id));
  } catch (e) {
    err(res, e.message, 404);
  }
});

/**
 * GET /api/email/campaigns/:id/report
 * Campaign performance report.
 */
router.get('/campaigns/:id/report', (req, res) => {
  try {
    ok(res, campaignReport(req.params.id));
  } catch (e) {
    err(res, e.message, 404);
  }
});

/**
 * POST /api/email/campaigns/:id/approve
 * Approve a campaign for sending.
 * Body: { approvedBy?: string }
 *
 * NOTE: This only sets status='approved'. Actual sending requires
 * DRY_RUN=false in environment AND a manual trigger of processDueEmails().
 */
router.post('/campaigns/:id/approve', asyncHandler(async (req, res) => {
  try {
    const { approvedBy } = req.body || {};
    const campaign = approveCampaign(req.params.id, approvedBy);
    ok(res, {
      campaign,
      warning: DRY_RUN
        ? 'DRY_RUN=true — emails are approved but will only log, not actually send. Set DRY_RUN=false to send.'
        : 'Campaign approved. Emails will send when processDueEmails() is triggered.',
    });
  } catch (e) {
    err(res, e.message);
  }
}));

/**
 * POST /api/email/campaigns/:id/pause
 * Pause an active campaign.
 */
router.post('/campaigns/:id/pause', asyncHandler(async (req, res) => {
  try {
    ok(res, pauseCampaign(req.params.id));
  } catch (e) {
    err(res, e.message);
  }
}));

/**
 * POST /api/email/campaigns/:id/generate-drafts
 * Generate drafts for all contacts enrolled in this campaign.
 */
router.post('/campaigns/:id/generate-drafts', asyncHandler(async (req, res) => {
  try {
    const result = generateDrafts(req.params.id);
    ok(res, result, 201);
  } catch (e) {
    err(res, e.message);
  }
}));

// ── Contact discovery ─────────────────────────────────────────────────────────

/**
 * GET /api/email/contacts/discover/:companyId
 * Discover contacts for a company.
 * Query: ?saveToDb=false&scrapeWebsite=true
 */
router.get('/contacts/discover/:companyId', asyncHandler(async (req, res) => {
  const { saveToDb, scrapeWebsite } = req.query;
  const results = await discoverContacts(req.params.companyId, {
    saveToDb: saveToDb === 'true',
    scrapeWebsite: scrapeWebsite !== 'false',
  });
  ok(res, results);
}));

// ── Send (dry-run safe) ───────────────────────────────────────────────────────

/**
 * POST /api/email/send/dry-run/:draftId
 * Trigger a dry-run send of a specific draft.
 * Body: { toEmail: string }
 *
 * Even with DRY_RUN=false, this endpoint always dry-runs.
 * Use processDueEmails() for real sends.
 */
router.post('/send/dry-run/:draftId', asyncHandler(async (req, res) => {
  const { toEmail } = req.body || {};
  if (!toEmail) return err(res, 'toEmail is required');

  // Force dry-run by temporarily patching the env (read-only for this request)
  const original = process.env.DRY_RUN;
  process.env.DRY_RUN = 'true';

  try {
    const result = await sendDraft(req.params.draftId, toEmail);
    ok(res, result);
  } finally {
    process.env.DRY_RUN = original;
  }
}));

// ── Tracking endpoints (webhook stubs) ────────────────────────────────────────

/**
 * GET /api/email/track/open/:draftId
 * Returns a 1×1 transparent GIF and records open event.
 */
router.get('/track/open/:draftId', (req, res) => {
  const { draftId } = req.params;

  // Record open
  try {
    db.prepare(`
      UPDATE email_drafts SET opened_at = datetime('now') WHERE id = ? AND opened_at IS NULL
    `).run(draftId);
  } catch (_) {}

  // Return 1×1 GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.end(pixel);
});

/**
 * GET /api/email/track/click/:draftId?url=<encoded>
 * Records click event and redirects to target URL.
 */
router.get('/track/click/:draftId', (req, res) => {
  const { draftId } = req.params;
  const targetUrl = req.query.url ? decodeURIComponent(req.query.url) : 'https://corgi.xyz';

  try {
    db.prepare(`
      UPDATE email_drafts SET clicked_at = datetime('now') WHERE id = ? AND clicked_at IS NULL
    `).run(draftId);
  } catch (_) {}

  res.redirect(302, targetUrl);
});

// ── Error handler ─────────────────────────────────────────────────────────────
router.use((error, req, res, _next) => {
  console.error('[email-routes] Error:', error.message);
  err(res, error.message, 500);
});

module.exports = router;
