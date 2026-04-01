/**
 * call-results-routes.js — Call results, recordings & transcripts API
 *
 * Mounts at /api/calls
 *
 * Routes:
 *   GET  /api/calls/results                        — list results (paginated, filtered)
 *   GET  /api/calls/results/company/:companyId     — all calls for a company
 *   GET  /api/calls/results/:id                    — single result with full transcript
 *   POST /api/calls/results                        — create (on call initiation)
 *   PATCH /api/calls/results/:id                   — update (webhook on call completion)
 *   GET  /api/calls/stats                          — summary stats
 */

'use strict';

const express = require('express');
const { db } = require('../db');
const {
  createCallResult,
  updateCallResult,
  getCallResults,
  getCallResultById,
  getCallResultsByCompany,
} = require('../voice/call-results-db');

const router = express.Router();

// ── GET /results ──────────────────────────────────────────────────────────────
// List call results with optional filters: company_id, status, outcome, limit, offset

router.get('/results', (req, res) => {
  try {
    const { company_id, status, outcome, limit, offset } = req.query;
    const results = getCallResults({ company_id, status, outcome, limit, offset });
    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    console.error('[call-results-routes] GET /results error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /results/company/:companyId ───────────────────────────────────────────
// Must be defined BEFORE /results/:id to prevent route shadowing

router.get('/results/company/:companyId', (req, res) => {
  try {
    const results = getCallResultsByCompany(req.params.companyId);
    res.json({ success: true, data: results, count: results.length });
  } catch (err) {
    console.error('[call-results-routes] GET /results/company/:companyId error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /results/:id ──────────────────────────────────────────────────────────

router.get('/results/:id', (req, res) => {
  try {
    const result = getCallResultById(req.params.id);
    if (!result) return res.status(404).json({ success: false, error: 'Call result not found' });
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[call-results-routes] GET /results/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /results ─────────────────────────────────────────────────────────────
// Create a new call result record (called when a call is initiated)

router.post('/results', (req, res) => {
  try {
    const { company_id } = req.body;
    if (!company_id) {
      return res.status(400).json({ success: false, error: 'company_id is required' });
    }
    const record = createCallResult(req.body);
    res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error('[call-results-routes] POST /results error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /results/:id ────────────────────────────────────────────────────────
// Update an existing call result (used by Vapi / Twilio webhook on call completion)

router.patch('/results/:id', (req, res) => {
  try {
    const existing = getCallResultById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Call result not found' });

    const updated = updateCallResult(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[call-results-routes] PATCH /results/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /stats ────────────────────────────────────────────────────────────────
// Summary stats across all call results

router.get('/stats', (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT
        COUNT(*)                                                   AS total_calls,
        COUNT(CASE WHEN outcome = 'meeting_booked'      THEN 1 END) AS meetings_booked,
        COUNT(CASE WHEN outcome = 'interested'          THEN 1 END) AS interested,
        COUNT(CASE WHEN outcome = 'callback_requested'  THEN 1 END) AS callbacks_requested,
        COUNT(CASE WHEN outcome = 'voicemail_left'      THEN 1 END) AS voicemails_left,
        COUNT(CASE WHEN outcome = 'not_interested'      THEN 1 END) AS not_interested,
        COUNT(CASE WHEN outcome = 'no_answer'           THEN 1 END) AS no_answer,
        COUNT(CASE WHEN outcome = 'failed'              THEN 1 END) AS failed,
        COUNT(CASE WHEN status  = 'completed'           THEN 1 END) AS completed_calls,
        COUNT(CASE WHEN recording_url IS NOT NULL       THEN 1 END) AS calls_with_recording,
        COUNT(CASE WHEN transcript   IS NOT NULL        THEN 1 END) AS calls_with_transcript,
        ROUND(AVG(CASE WHEN duration_seconds > 0 THEN duration_seconds END), 0) AS avg_duration_seconds,
        ROUND(SUM(call_cost), 4)                                   AS total_call_cost
      FROM call_results
    `).get();

    // Conversion rate (meetings booked / total completed calls)
    const conversionRate = stats.completed_calls > 0
      ? Math.round((stats.meetings_booked / stats.completed_calls) * 100)
      : 0;

    res.json({
      success: true,
      data: { ...stats, conversion_rate_pct: conversionRate },
    });
  } catch (err) {
    console.error('[call-results-routes] GET /stats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
