'use strict';

/**
 * verification-routes.js — REST endpoints for the verification scoring system
 *
 * Mounted at /api/verification in server.js
 *
 * Routes:
 *   GET  /api/verification/summary         — aggregate counts + avg score
 *   POST /api/verification/company/:id     — verify one company
 *   POST /api/verification/batch           — verify all companies (body: { limit })
 *   GET  /api/companies/:id/verification   — get all checks for a company
 *     (Note: the last route is mounted separately in server.js under /api/companies)
 */

const express = require('express');
const { db } = require('../db');
const { verifyCompany, verifyAll, getVerificationSummary } = require('../research/verification-engine');

const router = express.Router();

// ── GET /api/verification/summary ────────────────────────────────────────────
router.get('/summary', (_req, res) => {
  try {
    const summary = getVerificationSummary();
    res.json(summary);
  } catch (err) {
    console.error('[verification] summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/verification/company/:id ───────────────────────────────────────
router.post('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await verifyCompany(id);
    res.json({
      success: true,
      companyId: result.companyId,
      name:      result.name,
      score:     result.score,
      status:    result.status,
      checksRun: result.checks.length,
    });
  } catch (err) {
    console.error('[verification] company error:', err);
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/verification/batch ─────────────────────────────────────────────
router.post('/batch', async (req, res) => {
  try {
    const limit = parseInt(req.body?.limit ?? 50, 10);
    if (isNaN(limit) || limit < 1 || limit > 10000) {
      return res.status(400).json({ error: 'limit must be an integer 1–10000' });
    }

    // Run async but respond immediately with a progress endpoint if needed
    // For now: run synchronously (it'll block until done — OK for internal use)
    const summary = await verifyAll(limit);
    res.json({ success: true, ...summary });
  } catch (err) {
    console.error('[verification] batch error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/verification/company/:id/checks ─────────────────────────────────
// Convenience alias: returns all verification_checks for a company
router.get('/company/:id/checks', (req, res) => {
  try {
    const { id } = req.params;
    const company = db.prepare('SELECT id, name, verification_score, verification_status, verification_notes, verified_at FROM companies WHERE id = ?').get(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const checks = db.prepare(
      'SELECT * FROM verification_checks WHERE company_id = ? ORDER BY checked_at DESC'
    ).all(id);

    res.json({ company, checks });
  } catch (err) {
    console.error('[verification] checks error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ── Separate router for /api/companies/:id/verification ──────────────────────
// Mounted under /api/companies in server.js
const companyVerificationRouter = express.Router({ mergeParams: true });

companyVerificationRouter.get('/:id/verification', (req, res) => {
  try {
    const { id } = req.params;
    const company = db.prepare(
      'SELECT id, name, verification_score, verification_status, verification_notes, verified_at FROM companies WHERE id = ?'
    ).get(id);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const checks = db.prepare(
      'SELECT * FROM verification_checks WHERE company_id = ? ORDER BY checked_at DESC'
    ).all(id);

    res.json({ company, checks });
  } catch (err) {
    console.error('[verification] company detail error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports.companyVerificationRouter = companyVerificationRouter;
