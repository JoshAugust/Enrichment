'use strict';

/**
 * campaign-manager.js — Email campaign orchestration for Corgi Outreach
 *
 * A campaign = a sequence of emails to a list of contacts.
 * Status lifecycle: draft → approved → scheduled → sent → replied
 *
 * Adds campaign-aware columns to email_drafts via a safe migration on load.
 */

const { v4: uuidv4 } = require('uuid');
const { db } = require('../db');

// ── Schema extension ──────────────────────────────────────────────────────────
// Run on module load — idempotent migrations to extend existing schema.

function initCampaignSchema() {
  db.exec(`
    -- Campaign table
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      description     TEXT,
      status          TEXT NOT NULL DEFAULT 'draft'
                      CHECK(status IN ('draft', 'approved', 'scheduled', 'sending', 'sent', 'paused')),
      audience_type   TEXT CHECK(audience_type IN ('operator', 'lender', 'arranger', 'all')),
      priority_filter TEXT,         -- 'A', 'B', 'C', or NULL for all
      ab_variant      TEXT DEFAULT 'a' CHECK(ab_variant IN ('a', 'b')),
      ab_test_enabled INTEGER DEFAULT 0,   -- 1 = split 50/50 a/b
      total_contacts  INTEGER DEFAULT 0,
      total_drafted   INTEGER DEFAULT 0,
      total_sent      INTEGER DEFAULT 0,
      total_opened    INTEGER DEFAULT 0,
      total_clicked   INTEGER DEFAULT 0,
      total_replied   INTEGER DEFAULT 0,
      approved_by     TEXT,
      approved_at     TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Junction: which contacts belong to a campaign
    CREATE TABLE IF NOT EXISTS campaign_contacts (
      campaign_id TEXT NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
      contact_id  TEXT NOT NULL REFERENCES contacts(id)         ON DELETE CASCADE,
      status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending', 'drafted', 'sent', 'replied', 'unsubscribed')),
      added_at    TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (campaign_id, contact_id)
    );

    CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
  `);

  // Extend email_drafts with campaign-aware columns (safe — ADD COLUMN is idempotent-ish)
  const existingCols = db.pragma(`table_info(email_drafts)`).map(r => r.name);

  const extensions = [
    { col: 'campaign_id',   def: 'TEXT' },
    { col: 'ab_variant',    def: "TEXT DEFAULT 'a'" },
    { col: 'sequence_day',  def: 'INTEGER DEFAULT 0' },
    { col: 'scheduled_at',  def: 'TEXT' },
    { col: 'sent_at',       def: 'TEXT' },
    { col: 'opened_at',     def: 'TEXT' },
    { col: 'clicked_at',    def: 'TEXT' },
    { col: 'from_email',    def: 'TEXT' },
    { col: 'to_email',      def: 'TEXT' },
  ];

  for (const { col, def } of extensions) {
    if (!existingCols.includes(col)) {
      db.exec(`ALTER TABLE email_drafts ADD COLUMN ${col} ${def}`);
    }
  }

  // Add indexes if they don't exist
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_email_drafts_campaign ON email_drafts(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_email_drafts_status   ON email_drafts(status);
    CREATE INDEX IF NOT EXISTS idx_email_drafts_sched    ON email_drafts(scheduled_at);
  `);

  console.log('[campaign-manager] Schema ready');
}

// Run immediately
initCampaignSchema();

// ── Campaign CRUD ─────────────────────────────────────────────────────────────

/**
 * Create a new campaign.
 *
 * @param {Object} params
 * @param {string}  params.name
 * @param {string}  [params.description]
 * @param {string}  [params.audienceType]    — 'operator' | 'lender' | 'arranger' | 'all'
 * @param {string}  [params.priorityFilter]  — 'A' | 'B' | 'C' | null
 * @param {string}  [params.abVariant]       — 'a' | 'b'
 * @param {boolean} [params.abTestEnabled]   — split a/b 50/50
 * @returns {Object} campaign record
 */
function createCampaign(params) {
  const {
    name,
    description = '',
    audienceType = 'all',
    priorityFilter = null,
    abVariant = 'a',
    abTestEnabled = false,
  } = params;

  if (!name) throw new Error('Campaign name is required');

  const id = uuidv4();

  db.prepare(`
    INSERT INTO email_campaigns (id, name, description, audience_type, priority_filter, ab_variant, ab_test_enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, description, audienceType, priorityFilter, abVariant, abTestEnabled ? 1 : 0);

  // Auto-enroll matching contacts
  const contacts = _queryTargetContacts(audienceType, priorityFilter);

  const enroll = db.prepare(`
    INSERT OR IGNORE INTO campaign_contacts (campaign_id, contact_id) VALUES (?, ?)
  `);

  const tx = db.transaction(() => {
    for (const c of contacts) enroll.run(id, c.id);
  });
  tx();

  db.prepare(`UPDATE email_campaigns SET total_contacts = ? WHERE id = ?`).run(contacts.length, id);

  console.log(`[campaign-manager] Created campaign "${name}" (${id}) with ${contacts.length} contacts`);

  return getCampaign(id);
}

/**
 * Fetch contacts matching a campaign's filters.
 * @param {string} audienceType
 * @param {string|null} priorityFilter
 * @returns {Array}
 */
function _queryTargetContacts(audienceType, priorityFilter) {
  let q = `SELECT c.id FROM contacts c JOIN companies co ON c.company_id = co.id WHERE 1=1`;
  const params = [];

  if (audienceType && audienceType !== 'all') {
    q += ` AND co.type = ?`;
    params.push(audienceType);
  }
  if (priorityFilter) {
    q += ` AND co.priority = ?`;
    params.push(priorityFilter);
  }

  return db.prepare(q).all(...params);
}

/**
 * Fetch a campaign by ID, including stats.
 * @param {string} id
 * @returns {Object}
 */
function getCampaign(id) {
  const campaign = db.prepare(`SELECT * FROM email_campaigns WHERE id = ?`).get(id);
  if (!campaign) throw new Error(`Campaign not found: ${id}`);

  // Refresh live stats from drafts
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END)     as sent,
      SUM(CASE WHEN sent_at IS NOT NULL THEN 1 ELSE 0 END)  as sent_confirmed,
      SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
      SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked
    FROM email_drafts WHERE campaign_id = ?
  `).get(id);

  return {
    ...campaign,
    abTestEnabled: campaign.ab_test_enabled === 1,
    liveDraftCount: stats ? stats.total : 0,
    liveSentCount: stats ? stats.sent : 0,
    liveOpenedCount: stats ? stats.opened : 0,
    liveClickedCount: stats ? stats.clicked : 0,
  };
}

/**
 * List all campaigns.
 * @param {Object} [filters]
 * @param {string}  [filters.status]
 * @returns {Array}
 */
function listCampaigns(filters = {}) {
  const { status } = filters;
  let q = `SELECT * FROM email_campaigns WHERE 1=1`;
  const params = [];

  if (status) { q += ` AND status = ?`; params.push(status); }
  q += ` ORDER BY created_at DESC`;

  return db.prepare(q).all(...params);
}

// ── Campaign lifecycle ────────────────────────────────────────────────────────

/**
 * Generate all drafts for a campaign.
 * Calls composeBatch under the hood.
 *
 * @param {string} campaignId
 * @returns {Object} batch result
 */
function generateDrafts(campaignId) {
  const { composeBatch } = require('./email-composer');

  const campaign = getCampaign(campaignId);

  const result = composeBatch({
    companyType: campaign.audience_type === 'all' ? undefined : campaign.audience_type,
    priority: campaign.priority_filter,
    campaignId,
    abVariant: campaign.ab_variant,
    skipExisting: true,
  });

  db.prepare(`
    UPDATE email_campaigns SET total_drafted = ?, updated_at = datetime('now') WHERE id = ?
  `).run(result.drafted, campaignId);

  return result;
}

/**
 * Approve a campaign for sending.
 * Transitions status from 'draft' → 'approved'.
 * Requires explicit call — nothing is auto-approved.
 *
 * @param {string} campaignId
 * @param {string} [approvedBy]
 * @returns {Object} updated campaign
 */
function approveCampaign(campaignId, approvedBy = 'manual') {
  const campaign = getCampaign(campaignId);

  if (!['draft', 'scheduled'].includes(campaign.status)) {
    throw new Error(`Campaign ${campaignId} is in status "${campaign.status}" — cannot approve`);
  }

  // Also approve all draft emails in this campaign
  db.prepare(`
    UPDATE email_drafts SET status = 'approved'
    WHERE campaign_id = ? AND status = 'draft'
  `).run(campaignId);

  db.prepare(`
    UPDATE email_campaigns
    SET status = 'approved', approved_by = ?, approved_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).run(approvedBy, campaignId);

  console.log(`[campaign-manager] Campaign ${campaignId} approved by ${approvedBy}`);
  return getCampaign(campaignId);
}

/**
 * Pause a live campaign.
 * @param {string} campaignId
 */
function pauseCampaign(campaignId) {
  db.prepare(`
    UPDATE email_campaigns SET status = 'paused', updated_at = datetime('now') WHERE id = ?
  `).run(campaignId);
  return getCampaign(campaignId);
}

// ── Reporting ─────────────────────────────────────────────────────────────────

/**
 * Generate a campaign report.
 * Open/click/reply rates are placeholders until real tracking events flow in.
 *
 * @param {string} campaignId
 * @returns {Object}
 */
function campaignReport(campaignId) {
  const campaign = getCampaign(campaignId);

  const draftStats = db.prepare(`
    SELECT
      COUNT(*)                                                     as total_drafts,
      SUM(CASE WHEN status = 'draft'    THEN 1 ELSE 0 END)        as pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)        as approved,
      SUM(CASE WHEN status = 'sent'     THEN 1 ELSE 0 END)        as sent,
      SUM(CASE WHEN opened_at IS NOT NULL  THEN 1 ELSE 0 END)     as opened,
      SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END)     as clicked,
      COUNT(DISTINCT contact_id)                                   as unique_contacts
    FROM email_drafts WHERE campaign_id = ?
  `).get(campaignId) || {};

  const abStats = db.prepare(`
    SELECT ab_variant,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
      SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened
    FROM email_drafts WHERE campaign_id = ?
    GROUP BY ab_variant
  `).all(campaignId);

  const sent       = draftStats.sent       || 0;
  const opened     = draftStats.opened     || 0;
  const clicked    = draftStats.clicked    || 0;
  const replied    = campaign.total_replied || 0;

  return {
    campaignId,
    name: campaign.name,
    status: campaign.status,
    audienceType: campaign.audience_type,
    createdAt: campaign.created_at,
    approvedAt: campaign.approved_at,
    approvedBy: campaign.approved_by,

    contacts: {
      enrolled:   campaign.total_contacts,
      unique:     draftStats.unique_contacts || 0,
    },

    emails: {
      totalDrafts: draftStats.total_drafts || 0,
      pending:     draftStats.pending      || 0,
      approved:    draftStats.approved     || 0,
      sent,
    },

    funnel: {
      sent,
      opened,
      clicked,
      replied,  // placeholder — would come from reply tracking webhook
      openRate:   sent > 0 ? `${((opened  / sent) * 100).toFixed(1)}%` : 'N/A',
      clickRate:  sent > 0 ? `${((clicked / sent) * 100).toFixed(1)}%` : 'N/A',
      replyRate:  sent > 0 ? `${((replied / sent) * 100).toFixed(1)}%` : 'N/A',
    },

    abTest: campaign.ab_test_enabled
      ? {
          enabled: true,
          variants: abStats,
        }
      : { enabled: false },

    note: 'Open/click/reply rates are live once email tracking events are received via /api/email/track webhooks.',
  };
}

module.exports = {
  createCampaign,
  getCampaign,
  listCampaigns,
  generateDrafts,
  approveCampaign,
  pauseCampaign,
  campaignReport,
};
