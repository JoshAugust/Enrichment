/**
 * browser-call-routes.js — Browser-based direct calling via Twilio Client SDK
 *
 * Enables the user to make phone calls directly from the browser (WebRTC)
 * without using the AI voice agent. The browser acts as a regular phone.
 *
 * Mounts at /api/browser-call
 *
 * Routes:
 *   GET  /api/browser-call/token          — Get Twilio Client access token
 *   POST /api/browser-call/twiml/outbound — TwiML for outbound calls (Twilio webhook)
 *   GET  /api/browser-call/status         — Check if browser calling is configured
 */

'use strict';

const express = require('express');
const router = express.Router();

// Twilio sends form-encoded POST bodies to TwiML webhooks
router.use(express.urlencoded({ extended: false }));

// ── Config ────────────────────────────────────────────────────────────────────

function getTwilioConfig() {
  const config = require('../../config/default.json');
  const vc = config.voice?.twilio || {};
  return {
    accountSid:  process.env.TWILIO_ACCOUNT_SID  || vc.accountSid  || '',
    authToken:   process.env.TWILIO_AUTH_TOKEN   || vc.authToken   || '',
    fromNumber:  process.env.TWILIO_FROM_NUMBER  || vc.fromNumber  || '',
    twimlAppSid: process.env.TWILIO_TWIML_APP_SID || vc.twimlAppSid || '',
  };
}

function isConfigured() {
  const c = getTwilioConfig();
  return !!(c.accountSid && c.authToken && c.fromNumber && c.twimlAppSid &&
            !c.accountSid.startsWith('${') && !c.authToken.startsWith('${'));
}

// ── GET /api/browser-call/status ──────────────────────────────────────────────

router.get('/status', (_req, res) => {
  const configured = isConfigured();
  const c = getTwilioConfig();
  res.json({
    configured,
    hasAccountSid:  !!(c.accountSid && !c.accountSid.startsWith('${')),
    hasAuthToken:   !!(c.authToken && !c.authToken.startsWith('${')),
    hasFromNumber:  !!(c.fromNumber && !c.fromNumber.startsWith('${')),
    hasTwimlAppSid: !!(c.twimlAppSid && !c.twimlAppSid.startsWith('${')),
  });
});

// ── GET /api/browser-call/token ───────────────────────────────────────────────

router.get('/token', (req, res) => {
  const config = getTwilioConfig();

  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Browser calling not configured',
      details: 'Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, and TWILIO_TWIML_APP_SID',
    });
  }

  try {
    const twilio = require('twilio');
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

    if (!apiKeySid || !apiKeySecret) {
      return res.status(503).json({
        error: 'Browser calling API key not configured',
        details: 'Set TWILIO_API_KEY_SID and TWILIO_API_KEY_SECRET',
      });
    }

    const identity = 'corgi-outreach-user';

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: config.twimlAppSid,
      incomingAllow: false,
    });

    const token = new AccessToken(
      config.accountSid,
      apiKeySid,
      apiKeySecret,
      { identity, ttl: 3600 }
    );

    token.addGrant(voiceGrant);

    console.log(`[browser-call] Token generated for identity: ${identity}`);

    res.json({
      token: token.toJwt(),
      identity,
      expiresIn: 3600,
    });
  } catch (err) {
    console.error('[browser-call] Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token', details: err.message });
  }
});

// ── POST /api/browser-call/twiml/outbound ─────────────────────────────────────

/**
 * TwiML webhook called by Twilio when the browser Device makes an outbound call.
 * Bridges the WebRTC connection to the PSTN phone number.
 *
 * Twilio sends: AccountSid, ApiVersion, ApplicationSid, CallSid, CallStatus,
 *   Called, Caller, Direction, From, To, etc. as form-encoded POST body.
 */
router.post('/twiml/outbound', (req, res) => {
  console.log('[browser-call] TwiML webhook hit. Body:', JSON.stringify(req.body));

  const config = getTwilioConfig();
  const toNumber = req.body.To || req.body.to || req.query.To;

  if (!toNumber) {
    console.error('[browser-call] No To number in request');
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="alice">No phone number was provided for this call.</Say><Hangup/></Response>`;
    res.type('text/xml').send(twiml);
    return;
  }

  const callerId = config.fromNumber;
  console.log(`[browser-call] Outbound call: ${toNumber} from ${callerId}`);

  // Clean TwiML — no recording (avoids issues on trial), generous timeout
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${callerId}" timeout="60" answerOnBridge="true">
    <Number statusCallbackEvent="initiated ringing answered completed"
            statusCallback="/api/browser-call/webhook/call-status"
            statusCallbackMethod="POST">${toNumber}</Number>
  </Dial>
</Response>`;

  res.type('text/xml').send(twiml);
});

// ── POST /api/browser-call/webhook/call-status ────────────────────────────────

router.post('/webhook/call-status', (req, res) => {
  const { CallSid, CallStatus, To, From, CallDuration } = req.body;
  console.log('[browser-call] Call status update:', { callSid: CallSid, callStatus: CallStatus, to: To, from: From, duration: CallDuration });

  // Persist completed calls to call_results DB
  if (CallStatus === 'completed' || CallStatus === 'busy' || CallStatus === 'no-answer' || CallStatus === 'failed' || CallStatus === 'canceled') {
    try {
      const { db } = require('../db');
      const { v4: uuid } = require('uuid');

      // Find the company by phone number
      const cleanTo = (To || '').replace(/\D/g, '');
      let company = null;
      if (cleanTo) {
        company = db.prepare(`SELECT id, name FROM companies WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE '%' || ? || '%'`).get(cleanTo.slice(-10));
      }

      // Find matching contact
      let contact = null;
      if (cleanTo) {
        contact = db.prepare(`SELECT id, name FROM contacts WHERE REPLACE(REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '(', ''), ')', '') LIKE '%' || ? || '%'`).get(cleanTo.slice(-10));
      }

      const outcome = CallStatus === 'completed' ? (parseInt(CallDuration || '0') > 10 ? 'connected' : 'brief') 
                     : CallStatus === 'busy' ? 'busy'
                     : CallStatus === 'no-answer' ? 'no_answer'
                     : CallStatus === 'failed' ? 'failed'
                     : 'canceled';

      db.prepare(`INSERT INTO call_results (id, company_id, contact_id, call_provider, call_provider_id, status, outcome, duration_seconds, notes, created_at, updated_at)
        VALUES (?, ?, ?, 'twilio', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`).run(
        uuid(),
        company?.id || null,
        contact?.id || null,
        CallSid,
        CallStatus,
        outcome,
        parseInt(CallDuration || '0'),
        `Called ${To} from browser. ${company ? 'Company: ' + company.name : 'Unknown company'}`
      );

      // Mark company as called
      if (company) {
        db.prepare('UPDATE companies SET manual_call_made = 1, updated_at = datetime(?) WHERE id = ?')
          .run(new Date().toISOString(), company.id);
      }

      console.log(`[browser-call] ✅ Call logged: ${CallSid} → ${To} (${outcome}, ${CallDuration || 0}s)${company ? ' — ' + company.name : ''}`);
    } catch (err) {
      console.error('[browser-call] Failed to log call result:', err.message);
    }
  }

  res.sendStatus(204);
});

// ── POST /api/browser-call/log ────────────────────────────────────────────────
// Manual call log — for when the user calls from their own phone (not browser)

router.post('/log', (req, res) => {
  try {
    const db = require('../db').db;
    const { v4: uuid } = require('uuid');
    const { companyId, contactId, phone, outcome, duration, notes } = req.body;

    if (!companyId && !phone) {
      return res.status(400).json({ error: 'companyId or phone required' });
    }

    let company = null;
    if (companyId) {
      company = db.prepare('SELECT id, name FROM companies WHERE id = ?').get(companyId);
    }

    db.prepare(`INSERT INTO call_results (id, company_id, contact_id, call_provider, status, outcome, duration_seconds, notes, created_at, updated_at)
      VALUES (?, ?, ?, 'manual', 'completed', ?, ?, ?, datetime('now'), datetime('now'))`).run(
      uuid(),
      companyId || null,
      contactId || null,
      outcome || 'connected',
      duration || 0,
      notes || `Manual call to ${phone || 'unknown'}`
    );

    if (companyId) {
      db.prepare('UPDATE companies SET manual_call_made = 1, updated_at = datetime(?) WHERE id = ?')
        .run(new Date().toISOString(), companyId);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[browser-call] Manual log error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/browser-call/history/:companyId ──────────────────────────────────
// Get call history for a company

router.get('/history/:companyId', (req, res) => {
  try {
    const db = require('../db').db;
    const rows = db.prepare(`SELECT cr.*, c.name as contact_name 
      FROM call_results cr 
      LEFT JOIN contacts c ON cr.contact_id = c.id
      WHERE cr.company_id = ?
      ORDER BY cr.created_at DESC`).all(req.params.companyId);
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/browser-call/history ─────────────────────────────────────────────
// Get all call history

router.get('/history', (_req, res) => {
  try {
    const db = require('../db').db;
    const rows = db.prepare(`SELECT cr.*, co.name as company_name, c.name as contact_name 
      FROM call_results cr 
      LEFT JOIN companies co ON cr.company_id = co.id
      LEFT JOIN contacts c ON cr.contact_id = c.id
      ORDER BY cr.created_at DESC
      LIMIT 200`).all();
    res.json({ data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
