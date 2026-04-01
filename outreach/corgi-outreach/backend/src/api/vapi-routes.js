/**
 * vapi-routes.js — Vapi AI call management API
 *
 * Mounts at /api/vapi
 *
 * Routes:
 *   GET  /api/vapi/status      — check if Vapi is configured
 *   POST /api/vapi/call        — initiate an outbound call
 *   POST /api/vapi/webhook     — receive Vapi webhooks (call events)
 */

'use strict';

const express = require('express');
const { initiateCall, initiateTestCall, handleCallWebhook } = require('../voice/call-orchestrator');
const {
  getDueRetries,
  cancelRetry,
  getRetryStatus,
  markRetryCompleted,
} = require('../voice/retry-scheduler');
const { db } = require('../db');

const router = express.Router();

// ── GET /status ────────────────────────────────────────────────────────────────
// Returns Vapi configuration status — useful for the frontend to check whether
// Vapi is live or in dry-run mode.

router.get('/status', (_req, res) => {
  const hasApiKey    = !!process.env.VAPI_API_KEY;
  const hasPhoneId   = !!process.env.VAPI_PHONE_NUMBER_ID;
  const hasWebhook   = !!process.env.WEBHOOK_BASE_URL;

  res.json({
    configured: hasApiKey && hasPhoneId,
    dry_run:    !hasApiKey,
    api_key:    hasApiKey ? '✓ set' : '✗ missing (VAPI_API_KEY)',
    phone_id:   hasPhoneId ? '✓ set' : '✗ missing (VAPI_PHONE_NUMBER_ID)',
    webhook_url: hasWebhook
      ? `${process.env.WEBHOOK_BASE_URL}/api/vapi/webhook`
      : '✗ missing (WEBHOOK_BASE_URL) — webhooks will not arrive',
  });
});

// ── POST /call ─────────────────────────────────────────────────────────────────
// Initiate an outbound call. Returns immediately — the call is async.
//
// Body: { companyId, contactId? }

router.post('/call', async (req, res) => {
  try {
    const { companyId, contactId } = req.body;

    if (!companyId) {
      return res.status(400).json({ success: false, error: 'companyId is required' });
    }

    const result = await initiateCall(companyId, contactId || null, {
      voiceId: req.body.voiceId,
      maxDurationSeconds: req.body.maxDurationSeconds,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('[vapi-routes] POST /call error:', err.message);

    // Surface friendly error messages for common failure modes
    if (err.message.includes('No phone number')) {
      return res.status(422).json({ success: false, error: err.message, code: 'NO_PHONE_NUMBER' });
    }
    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /test-call ────────────────────────────────────────────────────────────
// Initiate a test call to YOUR phone number using a specific company's AI context.
// Lets you hear how the AI sounds before calling real targets.
//
// Body: { companyId, contactId?, testPhoneNumber }

router.post('/test-call', async (req, res) => {
  try {
    const { companyId, contactId, testPhoneNumber } = req.body;

    if (!companyId) {
      return res.status(400).json({ success: false, error: 'companyId is required' });
    }
    if (!testPhoneNumber) {
      return res.status(400).json({ success: false, error: 'testPhoneNumber is required' });
    }

    // Basic E.164 sanity check
    if (!/^\+?[\d\s\-().]{7,20}$/.test(testPhoneNumber)) {
      return res.status(400).json({ success: false, error: 'testPhoneNumber does not look like a valid phone number' });
    }

    const result = await initiateTestCall(
      companyId,
      contactId || null,
      testPhoneNumber,
      {
        voiceId: req.body.voiceId,
        maxDurationSeconds: req.body.maxDurationSeconds,
      }
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error('[vapi-routes] POST /test-call error:', err.message);

    if (err.message.includes('not found')) {
      return res.status(404).json({ success: false, error: err.message });
    }

    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /webhook ──────────────────────────────────────────────────────────────
// Vapi sends call lifecycle events here.
// Vapi signs webhooks if you configure a secret, but we accept all for now.
// Always respond 200 fast — Vapi retries on non-2xx.

router.post('/webhook', async (req, res) => {
  // Acknowledge immediately — Vapi expects a fast 200
  res.status(200).json({ received: true });

  try {
    const result = await handleCallWebhook(req.body);
    if (result) {
      console.log(`[vapi-routes] Webhook processed: callResultId=${result.id} status=${result.status} outcome=${result.outcome || 'pending'}`);
    }
  } catch (err) {
    // Log but don't re-throw — response already sent
    console.error('[vapi-routes] Webhook processing error:', err.message);
  }
});

// ── Retry routes — mounted at /api/calls/retries ─────────────────────────────
// NOTE: These are added to the vapi router but the server mounts /api/calls
//       via call-results-routes.js. We export a separate retryRouter here so
//       server.js can mount it at /api/calls.

const retryRouter = express.Router();

// GET /api/calls/retries — list all retries (with optional status filter)
retryRouter.get('/', (req, res) => {
  try {
    const { status, contact_id } = req.query;
    let query = `
      SELECT r.*, co.name AS company_name, ct.name AS contact_name, ct.phone AS contact_phone
      FROM call_retries r
      LEFT JOIN companies co ON co.id = r.company_id
      LEFT JOIN contacts  ct ON ct.id = r.contact_id
      WHERE 1=1
    `;
    const params = [];

    if (status)     { query += ` AND r.status = ?`;     params.push(status); }
    if (contact_id) { query += ` AND r.contact_id = ?`; params.push(contact_id); }

    query += ` ORDER BY r.scheduled_for ASC LIMIT 200`;

    const rows = db.prepare(query).all(...params);
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('[vapi-routes] GET /retries error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/calls/retries/due — retries whose scheduled_for has passed
retryRouter.get('/due', (_req, res) => {
  try {
    const rows = getDueRetries();
    res.json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    console.error('[vapi-routes] GET /retries/due error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/calls/retries/:id/execute — execute a scheduled retry
retryRouter.post('/:id/execute', async (req, res) => {
  try {
    const retry = db.prepare(`SELECT * FROM call_retries WHERE id = ?`).get(req.params.id);
    if (!retry) {
      return res.status(404).json({ success: false, error: 'Retry not found' });
    }
    if (retry.status !== 'scheduled') {
      return res.status(409).json({ success: false, error: `Retry is already ${retry.status}` });
    }

    // Initiate the call
    const callResult = await initiateCall(retry.company_id, retry.contact_id);

    // Mark retry as completed
    const updated = markRetryCompleted(retry.id);

    res.status(201).json({
      success:    true,
      data:       { retry: updated, call: callResult },
    });
  } catch (err) {
    console.error('[vapi-routes] POST /retries/:id/execute error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/calls/retries/:id — cancel a specific retry
retryRouter.delete('/:id', (req, res) => {
  try {
    const cancelled = cancelRetry(req.params.id);
    if (!cancelled) {
      return res.status(404).json({ success: false, error: 'Retry not found or already completed/cancelled' });
    }
    res.json({ success: true, message: `Retry ${req.params.id} cancelled` });
  } catch (err) {
    console.error('[vapi-routes] DELETE /retries/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.retryRouter = retryRouter;
