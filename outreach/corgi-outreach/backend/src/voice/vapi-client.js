/**
 * vapi-client.js — Vapi AI REST API wrapper
 *
 * Wraps the Vapi API for outbound calls. Falls back to dry-run mode
 * if VAPI_API_KEY is not configured.
 *
 * Endpoints:
 *   POST https://api.vapi.ai/call/phone   — create outbound call
 *   GET  https://api.vapi.ai/call/:id     — get call status
 *   GET  https://api.vapi.ai/call/:id     — transcript is embedded in call object
 *   GET  https://api.vapi.ai/call         — list calls
 */

'use strict';

const axios = require('axios');

// ── Config ────────────────────────────────────────────────────────────────────

const VAPI_API_KEY        = process.env.VAPI_API_KEY;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;
const BASE_URL            = 'https://api.vapi.ai';
const DRY_RUN             = !VAPI_API_KEY;

if (DRY_RUN) {
  console.warn('[vapi-client] VAPI_API_KEY not set — running in DRY RUN mode (calls will be logged but not dialed)');
}

// ── Axios instance ─────────────────────────────────────────────────────────────

function makeClient() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${VAPI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Create an outbound phone call via Vapi.
 *
 * @param {string} phoneNumber        - E.164 format e.g. "+14155551234"
 * @param {Object} assistantConfig    - Inline Vapi assistant definition
 * @param {Object} [options]
 * @param {string} [options.webhookUrl] - Override webhook URL for this call
 * @returns {Promise<Object>}         - Vapi call object { id, status, ... }
 */
async function createCall(phoneNumber, assistantConfig, options = {}) {
  const phoneNumberId = VAPI_PHONE_NUMBER_ID;

  const payload = {
    phoneNumberId,
    customer: { number: phoneNumber },
    assistant: assistantConfig,
  };

  // Attach webhook URL if provided
  if (options.webhookUrl) {
    payload.serverUrl = options.webhookUrl;
  } else if (process.env.WEBHOOK_BASE_URL) {
    payload.serverUrl = `${process.env.WEBHOOK_BASE_URL}/api/vapi/webhook`;
  }

  if (DRY_RUN) {
    console.log('[vapi-client] DRY RUN — createCall payload:', JSON.stringify({
      phoneNumber,
      assistantModel: assistantConfig?.model?.model,
      firstMessage: assistantConfig?.firstMessage?.slice(0, 80),
      webhookUrl: payload.serverUrl,
    }, null, 2));
    return {
      id: `dry-run-${Date.now()}`,
      status: 'dry-run',
      phoneNumber,
      isDryRun: true,
    };
  }

  if (!phoneNumberId) {
    throw new Error('VAPI_PHONE_NUMBER_ID is not set — cannot place call');
  }

  try {
    const client = makeClient();
    const { data } = await client.post('/call/phone', payload);
    console.log(`[vapi-client] Call created: ${data.id} → ${phoneNumber}`);
    return data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`[vapi-client] createCall failed: ${msg}`);
    throw new Error(`Vapi createCall error: ${msg}`);
  }
}

/**
 * Get call status and details by Vapi call ID.
 *
 * @param {string} callId
 * @returns {Promise<Object>} Vapi call object
 */
async function getCall(callId) {
  if (DRY_RUN || callId.startsWith('dry-run-')) {
    return { id: callId, status: 'dry-run', isDryRun: true };
  }

  try {
    const client = makeClient();
    const { data } = await client.get(`/call/${callId}`);
    return data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`[vapi-client] getCall(${callId}) failed: ${msg}`);
    throw new Error(`Vapi getCall error: ${msg}`);
  }
}

/**
 * Get the transcript for a completed call.
 * Vapi embeds the transcript array in the call object under `transcript`.
 *
 * @param {string} callId
 * @returns {Promise<Object>} { transcript: string, messages: Array }
 */
async function getCallTranscript(callId) {
  if (DRY_RUN || callId.startsWith('dry-run-')) {
    return { transcript: '[DRY RUN — no transcript]', messages: [], isDryRun: true };
  }

  try {
    const call = await getCall(callId);
    const messages = call.transcript || [];

    // Build a readable transcript string from the messages array
    const transcriptText = Array.isArray(messages)
      ? messages
          .filter(m => m.role && m.content)
          .map(m => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n')
      : (typeof messages === 'string' ? messages : '');

    return {
      transcript: transcriptText,
      messages,
      recordingUrl: call.recordingUrl || null,
      summary: call.summary || null,
      endedReason: call.endedReason || null,
    };
  } catch (err) {
    const msg = err.message;
    console.error(`[vapi-client] getCallTranscript(${callId}) failed: ${msg}`);
    throw new Error(`Vapi getCallTranscript error: ${msg}`);
  }
}

/**
 * List recent calls with optional filters.
 *
 * @param {Object} [filters]
 * @param {number} [filters.limit]          - Max results (default 20)
 * @param {string} [filters.createdAtGt]    - ISO date string: only calls after this date
 * @param {string} [filters.status]         - Filter by status
 * @returns {Promise<Array>} Array of Vapi call objects
 */
async function listCalls(filters = {}) {
  if (DRY_RUN) {
    console.log('[vapi-client] DRY RUN — listCalls called with filters:', filters);
    return [];
  }

  try {
    const client = makeClient();
    const params = {};
    if (filters.limit)       params.limit        = filters.limit;
    if (filters.createdAtGt) params.createdAtGt  = filters.createdAtGt;
    if (filters.status)      params.status       = filters.status;

    const { data } = await client.get('/call', { params });
    return Array.isArray(data) ? data : (data.calls || []);
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    console.error(`[vapi-client] listCalls failed: ${msg}`);
    throw new Error(`Vapi listCalls error: ${msg}`);
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  createCall,
  getCall,
  getCallTranscript,
  listCalls,
  isDryRun: DRY_RUN,
};
