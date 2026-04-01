/**
 * call-orchestrator.js — Outbound call orchestrator for Vapi AI
 *
 * Ties together: DB lookup → assistant config → Vapi call creation → call_results record.
 * Also handles inbound Vapi webhooks: updates call status, transcript, outcome.
 *
 * Exports:
 *   initiateCall(companyId, contactId, options)   — initiate an outbound call
 *   handleCallWebhook(webhookData)                — process Vapi webhook payload
 */

'use strict';

const { db }               = require('../db');
const { createCall }       = require('./vapi-client');
const { buildAssistantConfig } = require('./vapi-assistant');
const {
  createCallResult,
  updateCallResult,
  getCallResultById,
} = require('./call-results-db');
const { handlePostCallActions } = require('./post-call-actions');

// ── DB helpers ────────────────────────────────────────────────────────────────

function getCompanyById(id) {
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(id) || null;
}

function getContactById(id) {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) || null;
}

function getFirstContactForCompany(companyId) {
  return db.prepare(
    'SELECT * FROM contacts WHERE company_id = ? ORDER BY verified DESC, created_at ASC LIMIT 1'
  ).get(companyId) || null;
}

// ── Outcome detection (simple keyword matching) ───────────────────────────────

/**
 * Determine a call outcome from a transcript string using keyword matching.
 *
 * @param {string} transcript
 * @param {boolean} [isVoicemail]
 * @returns {string} outcome key
 */
function detectOutcome(transcript, isVoicemail = false) {
  if (isVoicemail) return 'voicemail_left';
  if (!transcript)  return null;

  const t = transcript.toLowerCase();

  // Priority order matters — check most positive signals first
  if (/\b(book|schedule|calendar|next week|set up a call|introductory call|connect with josh|connect with isaac)\b/.test(t)) {
    return 'meeting_booked';
  }
  // Email captured = strong interest signal
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t) && /\b(email|send|share|forward)\b/.test(t)) {
    return 'meeting_booked';
  }
  if (/\b(interested|tell me more|send (me|the|that|info|details)|want to know|sounds good|learn more|share the|yeah sure|definitely|absolutely)\b/.test(t)) {
    return 'interested';
  }
  if (/\b(call back|call me back|busy right now|bad time|not a good time|try me again|reach me later)\b/.test(t)) {
    return 'callback_requested';
  }
  if (/\b(not interested|no thanks|no thank you|not for us|don't need|remove|unsubscribe|take me off|don't call)\b/.test(t)) {
    return 'not_interested';
  }

  return null; // Unknown — leave for manual review
}

// ── initiateCall ──────────────────────────────────────────────────────────────

/**
 * Initiate an outbound Vapi call for a company/contact.
 *
 * @param {string} companyId
 * @param {string} [contactId]   - If omitted, uses first contact for company
 * @param {Object} [options]
 * @param {string} [options.voiceId]            - Override voice (default: "alloy")
 * @param {number} [options.maxDurationSeconds] - Override max call duration
 * @returns {Promise<{ callId: string, callResultId: string, status: string, isDryRun: boolean }>}
 */
async function initiateCall(companyId, contactId, options = {}) {
  // 1. Fetch company
  const company = getCompanyById(companyId);
  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // 2. Fetch contact
  let contact = null;
  if (contactId) {
    contact = getContactById(contactId);
    if (!contact) throw new Error(`Contact not found: ${contactId}`);
  } else {
    contact = getFirstContactForCompany(companyId);
  }

  // 3. Verify phone number
  if (!contact?.phone) {
    const who = contact ? `${contact.name} (${contact.id})` : `company ${companyId}`;
    throw new Error(`No phone number on record for ${who}`);
  }

  console.log(`[call-orchestrator] Initiating call → ${company.name} / ${contact.name} (${contact.phone})`);

  // 4. Build assistant config
  const assistantConfig = buildAssistantConfig(company, contact, options);

  // 5. Place call via Vapi
  const vapiCall = await createCall(contact.phone, assistantConfig, options);

  // 6. Create call_results record
  const callResult = createCallResult({
    company_id:       companyId,
    contact_id:       contact.id,
    call_provider:    'vapi',
    call_provider_id: vapiCall.id,
    status:           vapiCall.isDryRun ? 'initiated' : 'ringing',
    notes: vapiCall.isDryRun
      ? `DRY RUN — call plan logged but not dialed. Phone: ${contact.phone}`
      : `Vapi call ID: ${vapiCall.id}`,
  });

  console.log(`[call-orchestrator] Call result record created: ${callResult.id}`);

  return {
    callId:       vapiCall.id,
    callResultId: callResult.id,
    status:       callResult.status,
    isDryRun:     !!vapiCall.isDryRun,
    company:      { id: company.id, name: company.name },
    contact:      { id: contact.id, name: contact.name, phone: contact.phone },
  };
}

// ── handleCallWebhook ─────────────────────────────────────────────────────────

/**
 * Process an inbound Vapi webhook and update the call_results record.
 *
 * Vapi webhook event types:
 *   - "call-started"       → status: ringing/in_progress
 *   - "speech-update"      → in-flight transcript update (partial)
 *   - "transcript"         → full/partial transcript chunk
 *   - "end-of-call-report" → final call data (status, recording, full transcript)
 *   - "hang"               → call ended
 *   - "voicemail"          → voicemail detected
 *
 * @param {Object} webhookData — Vapi webhook payload
 * @returns {Promise<Object|null>} updated call_results record or null if not found
 */
async function handleCallWebhook(webhookData) {
  const eventType = webhookData.message?.type || webhookData.type;
  const call      = webhookData.message?.call || webhookData.call || {};
  const callId    = call.id || webhookData.callId;

  if (!callId) {
    console.warn('[call-orchestrator] Webhook received without callId — ignoring');
    return null;
  }

  console.log(`[call-orchestrator] Webhook: type=${eventType} callId=${callId}`);

  // Find the call_results record by Vapi call ID — or create one if it doesn't exist
  // (handles calls initiated directly via Vapi API, not through our orchestrator)
  let existing = db.prepare(
    'SELECT * FROM call_results WHERE call_provider_id = ?'
  ).get(callId);

  if (!existing) {
    console.log(`[call-orchestrator] No call_results record for Vapi callId=${callId} — creating one from webhook`);

    // Extract metadata from the call object
    const metadata = call.assistant?.metadata || call.metadata || {};
    const companyId = metadata.companyId || null;
    const contactId = metadata.contactId || null;
    const companyName = metadata.companyName || call.customer?.number || 'Unknown';

    const record = createCallResult({
      company_id:       companyId || 'direct-api-call',
      contact_id:       contactId,
      call_provider:    'vapi',
      call_provider_id: callId,
      status:           'in_progress',
      notes:            `Auto-created from webhook. Customer: ${call.customer?.number || '?'}. Company: ${companyName}`,
    });
    existing = record;
    console.log(`[call-orchestrator] Auto-created call_results ${record.id} for callId=${callId}`);
  }

  const updates = {};

  switch (eventType) {
    case 'call-started':
    case 'assistant-request':
      updates.status = 'in_progress';
      break;

    case 'voicemail':
      updates.status  = 'voicemail';
      updates.outcome = 'voicemail_left';
      break;

    case 'end-of-call-report':
    case 'hang': {
      const report = webhookData.message || webhookData;

      // Status
      updates.status = 'completed';

      // Duration
      if (call.startedAt && call.endedAt) {
        const started = new Date(call.startedAt).getTime();
        const ended   = new Date(call.endedAt).getTime();
        if (!isNaN(started) && !isNaN(ended)) {
          updates.duration_seconds = Math.round((ended - started) / 1000);
        }
      } else if (call.duration) {
        updates.duration_seconds = Math.round(call.duration);
      }

      // Recording
      if (call.recordingUrl || report.recordingUrl) {
        updates.recording_url = call.recordingUrl || report.recordingUrl;
      }

      // Transcript — Vapi provides an array of { role, message } objects
      const transcriptArr = report.transcript || call.transcript || [];
      let transcriptText = '';

      if (Array.isArray(transcriptArr) && transcriptArr.length > 0) {
        transcriptText = transcriptArr
          .filter(m => m.role && (m.message || m.content))
          .map(m => `${m.role.toUpperCase()}: ${m.message || m.content}`)
          .join('\n');
      } else if (typeof transcriptArr === 'string') {
        transcriptText = transcriptArr;
      }

      if (transcriptText) updates.transcript = transcriptText;

      // Summary — use Vapi's if provided, otherwise generate our own
      if (report.summary) updates.summary = report.summary;

      // Extract email address if prospect gave one during the call
      if (transcriptText) {
        const emailMatch = transcriptText.match(/[\w.+-]+@[\w-]+\.[\w.]+/i);
        if (emailMatch) {
          updates.prospect_email = emailMatch[0].toLowerCase();
        }
        // Extract preferred meeting times if mentioned
        const timePatterns = transcriptText.match(/(?:monday|tuesday|wednesday|thursday|friday|morning|afternoon|next week|this week|after \d|before \d|\d{1,2}(?::\d{2})?\s*(?:am|pm)|end of (?:the )?week)[^.!?\n]*/gi);
        if (timePatterns && timePatterns.length > 0) {
          updates.preferred_times = timePatterns.join('; ');
        }
      }

      // Cost
      if (call.cost) updates.call_cost = call.cost;

      // Outcome — detect from transcript or ended reason
      const isVoicemail = call.endedReason === 'voicemail' ||
                          eventType === 'voicemail';

      updates.outcome = detectOutcome(transcriptText, isVoicemail);

      // Handle no-answer / failed scenarios
      if (!updates.outcome) {
        const endedReason = (call.endedReason || '').toLowerCase();
        if (endedReason.includes('no-answer') || endedReason.includes('busy')) {
          updates.outcome = 'no_answer';
          updates.status  = 'no_answer';
        } else if (endedReason.includes('error') || endedReason.includes('fail')) {
          updates.outcome = 'failed';
          updates.status  = 'failed';
        }
      }

      break;
    }

    case 'speech-update':
    case 'transcript':
      // Partial transcript update — accumulate if we have one
      // Don't overwrite a complete transcript with a partial one
      if (existing.status !== 'completed') {
        const partial = webhookData.message?.transcript || webhookData.transcript;
        if (partial && typeof partial === 'string') {
          updates.transcript = partial;
        }
      }
      break;

    default:
      console.log(`[call-orchestrator] Unhandled webhook event type: ${eventType}`);
      return existing;
  }

  if (Object.keys(updates).length === 0) return existing;

  const updated = updateCallResult(existing.id, updates);
  console.log(`[call-orchestrator] call_results ${existing.id} updated: status=${updated.status} outcome=${updated.outcome || 'pending'}`);

  // Trigger post-call actions (email + retry scheduling) when a call reaches a terminal outcome.
  // Run async — don't block the webhook response.
  if (updated.outcome) {
    handlePostCallActions(updated).catch(err => {
      console.error('[call-orchestrator] handlePostCallActions error:', err.message);
    });
  }

  return updated;
}

// ── initiateTestCall ──────────────────────────────────────────────────────────

/**
 * Initiate a test outbound call to a custom phone number using a specific
 * company's assistant context. Lets users hear how the AI sounds before
 * calling real targets.
 *
 * @param {string} companyId
 * @param {string|null} contactId   - Optional. Uses first contact if omitted.
 * @param {string} testPhoneNumber  - The phone number to actually dial.
 * @param {Object} [options]
 * @returns {Promise<{ callId: string, callResultId: string, status: string, isDryRun: boolean }>}
 */
async function initiateTestCall(companyId, contactId, testPhoneNumber, options = {}) {
  if (!testPhoneNumber) {
    throw new Error('testPhoneNumber is required for test calls');
  }

  // 1. Fetch company
  const company = getCompanyById(companyId);
  if (!company) {
    throw new Error(`Company not found: ${companyId}`);
  }

  // 2. Fetch contact (for context only — we won't call their number)
  let contact = null;
  if (contactId) {
    contact = getContactById(contactId);
    if (!contact) throw new Error(`Contact not found: ${contactId}`);
  } else {
    contact = getFirstContactForCompany(companyId);
    // Contact is optional for test calls — we just use company context
  }

  console.log(
    `[call-orchestrator] TEST CALL → ${company.name} context / dialing ${testPhoneNumber}` +
    (contact ? ` (contact context: ${contact.name})` : ' (no contact context)')
  );

  // 3. Build assistant config using the company/contact context
  const assistantConfig = buildAssistantConfig(company, contact, options);

  // 4. Place call via Vapi to testPhoneNumber (not contact.phone)
  const vapiCall = await createCall(testPhoneNumber, assistantConfig, options);

  // 5. Create call_results record — flagged as test call in notes
  const callResult = createCallResult({
    company_id:       companyId,
    contact_id:       contact?.id || null,
    call_provider:    'vapi',
    call_provider_id: vapiCall.id,
    status:           vapiCall.isDryRun ? 'initiated' : 'ringing',
    notes: vapiCall.isDryRun
      ? `[TEST CALL — DRY RUN] Context: ${company.name}. Dialed: ${testPhoneNumber}`
      : `[TEST CALL] Context: ${company.name}. Dialed: ${testPhoneNumber}. Vapi call ID: ${vapiCall.id}`,
  });

  console.log(`[call-orchestrator] Test call result record created: ${callResult.id}`);

  return {
    callId:       vapiCall.id,
    callResultId: callResult.id,
    status:       callResult.status,
    isDryRun:     !!vapiCall.isDryRun,
    isTestCall:   true,
    testPhoneNumber,
    company:      { id: company.id, name: company.name },
    contact:      contact ? { id: contact.id, name: contact.name } : null,
  };
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  initiateCall,
  initiateTestCall,
  handleCallWebhook,
  detectOutcome,
};
