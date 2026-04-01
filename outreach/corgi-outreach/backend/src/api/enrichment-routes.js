/**
 * enrichment-routes.js — Express API routes for the enrichment pipeline
 *
 * Mounts at /api/enrichment
 *
 * Routes:
 *   POST /api/enrichment/company/:id     — enrich a single company
 *   POST /api/enrichment/contact/:id     — enrich a single contact
 *   POST /api/enrichment/batch           — batch enrich all companies/contacts
 *   GET  /api/enrichment/log             — view enrichment history
 *   GET  /api/enrichment/status          — pipeline health & source availability
 *   POST /api/enrichment/company/:id/news — fetch latest news for a company
 */

'use strict';

const express = require('express');
const { db } = require('../db');
const pipeline = require('../research/enrichment-pipeline');

const router = express.Router();

// ── POST /api/enrichment/company/:id ──────────────────────────────────────────

router.post('/company/:id', async (req, res) => {
  try {
    const { sourcesToRun } = req.body || {};
    const result = await pipeline.enrichCompany(req.params.id, { sourcesToRun });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[enrichment-routes] /company/:id error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: err.message,
    });
  }
});

// ── POST /api/enrichment/contact/:id ──────────────────────────────────────────

router.post('/contact/:id', async (req, res) => {
  try {
    const { sourcesToRun } = req.body || {};
    const result = await pipeline.enrichContact(req.params.id, { sourcesToRun });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[enrichment-routes] /contact/:id error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: err.message,
    });
  }
});

// ── POST /api/enrichment/batch ────────────────────────────────────────────────

router.post('/batch', async (req, res) => {
  const { includeContacts, limit, priority } = req.body || {};

  // Return immediately with a job ID, run enrichment in background
  const jobId = require('uuid').v4();

  res.json({
    success: true,
    jobId,
    message: 'Batch enrichment started in background',
    params: { includeContacts, limit, priority },
  });

  // Run in background (don't await in the request handler)
  pipeline.enrichAll({ includeContacts, limit, priority })
    .then(result => {
      console.log(`[enrichment-routes] Batch job ${jobId} complete:`, result.summary);
    })
    .catch(err => {
      console.error(`[enrichment-routes] Batch job ${jobId} failed:`, err.message);
    });
});

// ── GET /api/enrichment/log ───────────────────────────────────────────────────

router.get('/log', (req, res) => {
  const { entity_type, entity_id, source, limit = 100, offset = 0 } = req.query;

  let query = 'SELECT * FROM enrichment_log WHERE 1=1';
  const params = [];

  if (entity_type) {
    query += ' AND entity_type = ?';
    params.push(entity_type);
  }
  if (entity_id) {
    query += ' AND entity_id = ?';
    params.push(entity_id);
  }
  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  try {
    const rows = db.prepare(query).all(...params);
    const total = db.prepare(
      'SELECT COUNT(*) as n FROM enrichment_log' +
      (entity_type ? ' WHERE entity_type = ?' : '')
    ).get(...(entity_type ? [entity_type] : [])).n;

    // Parse data_found JSON for each row
    const parsed = rows.map(row => ({
      ...row,
      data_found: row.data_found ? JSON.parse(row.data_found) : null,
    }));

    res.json({ success: true, total, count: parsed.length, log: parsed });
  } catch (err) {
    console.error('[enrichment-routes] /log error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/enrichment/status ────────────────────────────────────────────────

router.get('/status', (_req, res) => {
  try {
    const status = pipeline.getPipelineStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    console.error('[enrichment-routes] /status error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/enrichment/company/:id/news ─────────────────────────────────────

router.post('/company/:id/news', async (req, res) => {
  try {
    const { days = 90 } = req.body || {};
    const result = await pipeline.fetchCompanyNews(req.params.id, { days });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[enrichment-routes] /company/:id/news error:', err.message);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;
