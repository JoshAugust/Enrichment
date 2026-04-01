/**
 * api/dashboard.js — Summary stats for the Corgi Outreach dashboard
 */

'use strict';

const express = require('express');
const { db } = require('../db');

const router = express.Router();

// ── GET /api/dashboard/stats ──────────────────────────────────────────────────
router.get('/stats', (req, res) => {
  try {
    const stats = {
      companies: {
        total:    db.prepare('SELECT COUNT(*) as n FROM companies').get().n,
        by_priority: db.prepare(`
          SELECT priority, COUNT(*) as count
          FROM companies GROUP BY priority ORDER BY priority
        `).all(),
        by_type: db.prepare(`
          SELECT type, COUNT(*) as count
          FROM companies GROUP BY type
        `).all(),
        avg_score: db.prepare('SELECT ROUND(AVG(qualification_score), 1) as avg FROM companies').get().avg || 0,
        top_companies: db.prepare(`
          SELECT id, name, type, priority, qualification_score
          FROM companies
          ORDER BY qualification_score DESC
          LIMIT 5
        `).all(),
      },
      contacts: {
        total:    db.prepare('SELECT COUNT(*) as n FROM contacts').get().n,
        verified: db.prepare('SELECT COUNT(*) as n FROM contacts WHERE verified = 1').get().n,
      },
      outreach: {
        total:     db.prepare('SELECT COUNT(*) as n FROM outreach_log').get().n,
        by_status: db.prepare(`
          SELECT status, COUNT(*) as count
          FROM outreach_log GROUP BY status
        `).all(),
        by_channel: db.prepare(`
          SELECT channel, COUNT(*) as count
          FROM outreach_log GROUP BY channel
        `).all(),
        recent: db.prepare(`
          SELECT ol.*, c.name as contact_name, co.name as company_name
          FROM outreach_log ol
          JOIN contacts c ON c.id = ol.contact_id
          JOIN companies co ON co.id = c.company_id
          ORDER BY ol.created_at DESC LIMIT 5
        `).all(),
      },
      email_drafts: {
        total:  db.prepare('SELECT COUNT(*) as n FROM email_drafts').get().n,
        sent:   db.prepare("SELECT COUNT(*) as n FROM email_drafts WHERE status = 'sent'").get().n,
        draft:  db.prepare("SELECT COUNT(*) as n FROM email_drafts WHERE status = 'draft'").get().n,
      },
      call_scripts: {
        total:       db.prepare('SELECT COUNT(*) as n FROM call_scripts').get().n,
        by_version:  db.prepare(`
          SELECT script_version, COUNT(*) as count
          FROM call_scripts GROUP BY script_version ORDER BY script_version
        `).all(),
      },
      research: {
        total_notes: db.prepare('SELECT COUNT(*) as n FROM research_notes').get().n,
        companies_researched: db.prepare(`
          SELECT COUNT(DISTINCT company_id) as n FROM research_notes
        `).get().n,
      },
      generated_at: new Date().toISOString(),
    };

    res.json({ data: stats });
  } catch (err) {
    console.error('[dashboard] stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
