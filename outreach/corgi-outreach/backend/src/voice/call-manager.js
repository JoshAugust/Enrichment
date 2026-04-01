/**
 * call-manager.js — Telephony integration for Corgi Outreach
 *
 * Integrates with Twilio Voice API to place outbound calls.
 * Generates TwiML for the full call flow:
 *   1. Play intro greeting (pre-synthesized audio)
 *   2. Wait for response (speech recognition)
 *   3. Navigate script branches based on response
 *   4. Handle objections with prepared responses
 *   5. End with CTA → book founder call
 *
 * CRITICAL: DRY_RUN=true by default — no actual calls are made.
 *   In dry-run mode: generates audio, builds call plan, logs intent, saves to DB.
 */

'use strict';

const path = require('path');
const fs = require('fs');
require('dotenv').config();

const config = require('../../config/default.json');
const { db } = require('../db');
const { synthesize, AUDIO_DIR, ensureDir } = require('./voice-engine');
const { generateCallPlan, matchBranch } = require('./call-flow');

// ── Config ───────────────────────────────────────────────────────────────────

const voiceConfig = config.voice || {};
// WARN-007 fix: standardized DRY_RUN check — true unless explicitly set to 'false'
const DRY_RUN = process.env.DRY_RUN !== 'false';

const TWILIO_ACCOUNT_SID =
  process.env.TWILIO_ACCOUNT_SID || voiceConfig?.twilio?.accountSid || '';
const TWILIO_AUTH_TOKEN =
  process.env.TWILIO_AUTH_TOKEN || voiceConfig?.twilio?.authToken || '';
const TWILIO_FROM_NUMBER =
  process.env.TWILIO_FROM_NUMBER || voiceConfig?.twilio?.fromNumber || '';

// Public base URL for TwiML webhooks (must be accessible by Twilio)
const WEBHOOK_BASE_URL =
  process.env.WEBHOOK_BASE_URL || 'https://placeholder.ngrok.io';

// ── Schema: call_plans table ─────────────────────────────────────────────────
// Ensure the call_plans table exists (extends the existing schema)

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS call_plans (
      id              TEXT PRIMARY KEY,
      company_id      TEXT NOT NULL,
      contact_id      TEXT,
      script_version  TEXT NOT NULL,
      call_plan_json  TEXT NOT NULL,
      audio_files     TEXT,           -- JSON array of generated audio paths
      status          TEXT NOT NULL DEFAULT 'draft'
                        CHECK(status IN ('draft', 'dry_run', 'queued', 'in_progress', 'completed', 'failed')),
      dry_run         INTEGER NOT NULL DEFAULT 1,
      twilio_call_sid TEXT,
      call_recording_url TEXT,
      notes           TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_call_plans_company ON call_plans(company_id);
    CREATE INDEX IF NOT EXISTS idx_call_plans_status  ON call_plans(status);
  `);
} catch (e) {
  // Table already exists or minor schema divergence — safe to continue
  console.warn('[call-manager] Schema note:', e.message);
}

// ── Twilio client (lazy-initialized) ────────────────────────────────────────

let _twilioClient = null;

function getTwilioClient() {
  if (_twilioClient) return _twilioClient;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error(
      '[call-manager] Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.'
    );
  }

  const twilio = require('twilio');
  _twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  return _twilioClient;
}

// ── TwiML Generation ─────────────────────────────────────────────────────────

/**
 * Generate TwiML for the intro + first listen stage.
 *
 * @param {Object} opts
 * @param {string} opts.audioUrl         - Publicly accessible URL for intro audio
 * @param {string} opts.callPlanId       - Call plan ID for webhook routing
 * @param {string} opts.currentNodeId    - Starting node ID in decision tree
 * @returns {string}                     - TwiML XML string
 */
function generateIntroTwiML({ audioUrl, callPlanId, currentNodeId = 'intro' }) {
  const gatherWebhook = `${WEBHOOK_BASE_URL}/api/voice/twiml/gather?planId=${callPlanId}&node=${currentNodeId}`;
  const statusWebhook = `${WEBHOOK_BASE_URL}/api/voice/webhook/status?planId=${callPlanId}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="${gatherWebhook}"
    method="POST"
    speechTimeout="auto"
    timeout="8"
    speechModel="phone_call"
    enhanced="true">
    <Play>${audioUrl}</Play>
  </Gather>
  <Redirect>${statusWebhook}</Redirect>
</Response>`.trim();
}

/**
 * Generate TwiML for a branch response (play audio, then gather next response).
 *
 * @param {Object} opts
 * @param {string} opts.audioUrl
 * @param {string} opts.callPlanId
 * @param {string} opts.nodeId
 * @param {boolean} [opts.isEnd]     - If true, end the call after playing
 * @returns {string}                 - TwiML XML string
 */
function generateResponseTwiML({ audioUrl, callPlanId, nodeId, isEnd = false }) {
  if (isEnd) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Hangup/>
</Response>`.trim();
  }

  const gatherWebhook = `${WEBHOOK_BASE_URL}/api/voice/twiml/gather?planId=${callPlanId}&node=${nodeId}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather
    input="speech"
    action="${gatherWebhook}"
    method="POST"
    speechTimeout="auto"
    timeout="8"
    speechModel="phone_call"
    enhanced="true">
    <Play>${audioUrl}</Play>
  </Gather>
</Response>`.trim();
}

/**
 * Generate TwiML for call recording setup (wraps the intro).
 *
 * @param {Object} opts
 * @returns {string}
 */
function generateRecordingTwiML({ callPlanId }) {
  const recordingWebhook = `${WEBHOOK_BASE_URL}/api/voice/webhook/recording?planId=${callPlanId}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Record
    recordingStatusCallback="${recordingWebhook}"
    recordingStatusCallbackMethod="POST"
    transcribe="true"
    maxLength="300"
    playBeep="false"
    trim="trim-silence"/>
</Response>`.trim();
}

// ── Audio Pre-generation ─────────────────────────────────────────────────────

/**
 * Pre-generate all audio files for every speak-node in a call plan's decision tree.
 * Returns a map of { nodeId → filePath }.
 *
 * @param {Object} callPlan   - Full call plan from generateCallPlan()
 * @param {string} [voice]    - ElevenLabs voice preset name
 * @returns {Promise<Object>} - { nodeId: filePath }
 */
async function pregenerateCallAudio(callPlan, voice = 'rachel', planId = null) {
  const { nodes } = callPlan.decisionTree;
  const audioMap = {};
  // BUG-002 fix: store under planId (not companyId) so TwiML URLs match
  const dirKey = planId || callPlan.target.companyId;
  const audioDir = path.join(AUDIO_DIR, 'calls', dirKey);
  ensureDir(audioDir);

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.type !== 'speak' && node.type !== 'end') continue;
    if (!node.text) continue;

    const outputPath = path.join(audioDir, `${nodeId}.mp3`);

    try {
      const result = await synthesize({
        text: node.text,
        voice,
        outputPath,
      });
      audioMap[nodeId] = result.filePath;
      console.log(`[call-manager] Audio ready: ${nodeId} → ${result.filePath}`);
    } catch (err) {
      console.error(`[call-manager] Audio generation failed for node "${nodeId}": ${err.message}`);
    }
  }

  return audioMap;
}

// ── Core: Execute or Simulate a Call ────────────────────────────────────────

/**
 * Execute a call (or simulate in dry-run mode) for a given company + contact.
 *
 * @param {Object} opts
 * @param {string} opts.companyId
 * @param {string} opts.companyName
 * @param {string} opts.companyType       - 'operator' | 'lender' | 'arranger'
 * @param {string} [opts.contactId]
 * @param {string} [opts.contactName]
 * @param {string} [opts.contactTitle]
 * @param {string} [opts.contactPhone]    - E.164 format, e.g. '+14155551234'
 * @param {string} [opts.scriptVersion]   - Force A-E
 * @param {string} [opts.voice]           - Voice preset name
 * @param {boolean} [opts.dryRun]         - Override global DRY_RUN setting
 * @returns {Promise<Object>}             - Call result / dry-run summary
 */
async function executeCall(opts = {}) {
  const {
    companyId,
    companyName,
    companyType,
    contactId = null,
    contactName = null,
    contactTitle = null,
    contactPhone = null,
    scriptVersion = null,
    voice = 'rachel',
    dryRun = DRY_RUN,
  } = opts;

  if (!companyId || !companyType) {
    throw new Error('[call-manager] executeCall(): companyId and companyType are required');
  }

  console.log(`\n[call-manager] ${dryRun ? '[DRY RUN] ' : ''}Preparing call for ${companyName || companyId}...`);

  // 1. Generate call plan
  const callPlan = generateCallPlan({
    companyId,
    companyName,
    companyType,
    contactName,
    contactTitle,
    scriptVersion,
  });

  console.log(`[call-manager] Script version selected: ${callPlan.script.version} (${callPlan.script.name})`);

  // 3. Generate planId first so audio is stored under it (BUG-002 fix)
  const planId = require('uuid').v4();

  // 2. Pre-generate all audio for speak nodes
  console.log('[call-manager] Pre-generating audio files...');
  const audioMap = await pregenerateCallAudio(callPlan, voice, planId);
  db.prepare(`
    INSERT INTO call_plans
      (id, company_id, contact_id, script_version, call_plan_json, audio_files, status, dry_run)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    planId,
    companyId,
    contactId,
    callPlan.script.version,
    JSON.stringify(callPlan),
    JSON.stringify(audioMap),
    dryRun ? 'dry_run' : 'queued',
    dryRun ? 1 : 0
  );

  console.log(`[call-manager] Call plan saved: ${planId}`);

  if (dryRun) {
    return await _executeDryRun({ planId, callPlan, audioMap, contactPhone });
  } else {
    return await _executeLiveCall({ planId, callPlan, audioMap, contactPhone, voice });
  }
}

// ── Dry Run Simulation ───────────────────────────────────────────────────────

async function _executeDryRun({ planId, callPlan, audioMap, contactPhone }) {
  const { nodes, startNode } = callPlan.decisionTree;

  console.log('\n[call-manager][DRY RUN] ═══════════════════════════════════════════');
  console.log(`[call-manager][DRY RUN] Target: ${callPlan.target.companyName}`);
  console.log(`[call-manager][DRY RUN] Type: ${callPlan.target.companyType}`);
  console.log(`[call-manager][DRY RUN] Script: Version ${callPlan.script.version} — "${callPlan.script.name}"`);
  if (contactPhone) {
    console.log(`[call-manager][DRY RUN] Would dial: ${contactPhone} (NOT dialing — dry run)`);
  }
  console.log('[call-manager][DRY RUN] ─────────────────────────────────────────────');

  // Walk the happy-path through the tree for the dry-run transcript
  const transcript = [];
  let currentNodeId = startNode;
  const visited = new Set();

  while (currentNodeId && !visited.has(currentNodeId)) {
    visited.add(currentNodeId);
    const node = nodes[currentNodeId];
    if (!node) break;

    switch (node.type) {
      case 'speak':
        console.log(`[call-manager][DRY RUN] SPEAK [${node.id}]: "${node.text}"`);
        if (audioMap[node.id]) {
          console.log(`[call-manager][DRY RUN]   ↳ Audio: ${audioMap[node.id]}`);
        }
        transcript.push({ role: 'agent', nodeId: node.id, text: node.text, audio: audioMap[node.id] || null });
        currentNodeId = node.defaultNext;
        break;

      case 'listen':
        console.log(`[call-manager][DRY RUN] LISTEN [${node.id}]: (waiting for prospect response)`);
        transcript.push({ role: 'listen', nodeId: node.id, text: '(awaiting prospect response)' });
        // In dry run, simulate a positive response
        currentNodeId = node.branches?.[0]?.nextNodeId || node.defaultNext;
        break;

      case 'branch':
        console.log(`[call-manager][DRY RUN] BRANCH [${node.id}]: routing to default`);
        currentNodeId = node.defaultNext;
        break;

      case 'end':
        console.log(`[call-manager][DRY RUN] END [${node.id}]: "${node.text}"`);
        transcript.push({ role: 'agent', nodeId: node.id, text: node.text, audio: audioMap[node.id] || null });
        currentNodeId = null;
        break;

      default:
        currentNodeId = node.defaultNext;
    }
  }

  console.log('[call-manager][DRY RUN] ═══════════════════════════════════════════\n');

  // Update DB status
  db.prepare(`UPDATE call_plans SET status = 'dry_run', updated_at = datetime('now') WHERE id = ?`).run(planId);

  return {
    planId,
    dryRun: true,
    status: 'dry_run',
    scriptVersion: callPlan.script.version,
    scriptName: callPlan.script.name,
    target: callPlan.target,
    audioFiles: audioMap,
    transcript,
    twiml: {
      intro: generateIntroTwiML({
        audioUrl: `${WEBHOOK_BASE_URL}/audio/${planId}/intro.mp3`,
        callPlanId: planId,
        currentNodeId: 'intro',
      }),
    },
    callPlan,
  };
}

// ── Live Call Execution ──────────────────────────────────────────────────────

async function _executeLiveCall({ planId, callPlan, audioMap, contactPhone, voice }) {
  if (!contactPhone) {
    throw new Error('[call-manager] Live call requires contactPhone in E.164 format');
  }
  if (!TWILIO_FROM_NUMBER) {
    throw new Error('[call-manager] TWILIO_FROM_NUMBER not configured');
  }

  const client = getTwilioClient();
  const introTwiML = generateIntroTwiML({
    audioUrl: `${WEBHOOK_BASE_URL}/audio/${planId}/intro.mp3`,
    callPlanId: planId,
    currentNodeId: 'intro',
  });

  console.log(`[call-manager] Dialing ${contactPhone} from ${TWILIO_FROM_NUMBER}...`);

  const call = await client.calls.create({
    to: contactPhone,
    from: TWILIO_FROM_NUMBER,
    twiml: introTwiML,
    statusCallback: `${WEBHOOK_BASE_URL}/api/voice/webhook/status?planId=${planId}`,
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    record: true,
    recordingStatusCallback: `${WEBHOOK_BASE_URL}/api/voice/webhook/recording?planId=${planId}`,
    recordingStatusCallbackMethod: 'POST',
    machineDetection: 'Enable',
  });

  console.log(`[call-manager] Call initiated: SID=${call.sid}, Status=${call.status}`);

  // Update DB with Twilio SID
  db.prepare(
    `UPDATE call_plans SET twilio_call_sid = ?, status = 'in_progress', updated_at = datetime('now') WHERE id = ?`
  ).run(call.sid, planId);

  return {
    planId,
    dryRun: false,
    status: 'in_progress',
    twilioCallSid: call.sid,
    scriptVersion: callPlan.script.version,
    target: callPlan.target,
    audioFiles: audioMap,
    callPlan,
  };
}

// ── Webhook Handlers ─────────────────────────────────────────────────────────

/**
 * Handle Twilio status callback webhook.
 * Updates call plan status in the database.
 *
 * @param {Object} twilioPayload  - Twilio webhook POST body
 */
function handleStatusCallback(twilioPayload) {
  const { CallSid, CallStatus, planId } = twilioPayload;
  const statusMap = {
    initiated: 'in_progress',
    ringing: 'in_progress',
    answered: 'in_progress',
    completed: 'completed',
    failed: 'failed',
    busy: 'failed',
    'no-answer': 'failed',
    canceled: 'failed',
  };

  const newStatus = statusMap[CallStatus] || 'in_progress';
  const updateQuery = planId
    ? db.prepare(`UPDATE call_plans SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    : db.prepare(`UPDATE call_plans SET status = ?, updated_at = datetime('now') WHERE twilio_call_sid = ?`);

  updateQuery.run(newStatus, planId || CallSid);
  console.log(`[call-manager] Status callback: CallSid=${CallSid}, Status=${CallStatus} → ${newStatus}`);
}

/**
 * Handle Twilio recording callback webhook.
 * Saves recording URL to the call plan.
 *
 * @param {Object} twilioPayload
 */
function handleRecordingCallback(twilioPayload) {
  const { CallSid, RecordingUrl, RecordingStatus, planId } = twilioPayload;
  if (RecordingStatus !== 'completed') return;

  const url = planId
    ? db.prepare(`SELECT id FROM call_plans WHERE id = ?`).get(planId)
    : null;

  const updateQuery = planId
    ? db.prepare(`UPDATE call_plans SET call_recording_url = ?, updated_at = datetime('now') WHERE id = ?`)
    : db.prepare(`UPDATE call_plans SET call_recording_url = ?, updated_at = datetime('now') WHERE twilio_call_sid = ?`);

  updateQuery.run(RecordingUrl, planId || CallSid);
  console.log(`[call-manager] Recording saved: ${RecordingUrl}`);
}

/**
 * Handle Twilio Gather callback (speech recognition response).
 * Determines next call flow node based on spoken text.
 *
 * @param {Object} twilioPayload  - Includes SpeechResult, planId, node
 * @returns {string}              - TwiML to send back to Twilio
 */
function handleGatherCallback(twilioPayload) {
  const { SpeechResult, planId, node: currentNodeId } = twilioPayload;

  if (!planId) {
    console.error('[call-manager] handleGatherCallback(): missing planId');
    return '<Response><Hangup/></Response>';
  }

  const row = db.prepare(`SELECT call_plan_json, audio_files FROM call_plans WHERE id = ?`).get(planId);
  if (!row) {
    console.error(`[call-manager] Call plan not found: ${planId}`);
    return '<Response><Hangup/></Response>';
  }

  const callPlan = JSON.parse(row.call_plan_json);
  const audioMap = JSON.parse(row.audio_files || '{}');
  const { nodes } = callPlan.decisionTree;

  const listenNode = nodes[currentNodeId];
  if (!listenNode) {
    console.error(`[call-manager] Node not found: ${currentNodeId}`);
    return '<Response><Hangup/></Response>';
  }

  const nextNodeId = matchBranch(SpeechResult || '', listenNode);
  const nextNode = nodes[nextNodeId];

  console.log(
    `[call-manager] Gather: heard="${SpeechResult}", node=${currentNodeId} → ${nextNodeId}`
  );

  if (!nextNode || nextNode.type === 'end') {
    const endAudio = audioMap['end'] || '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${endAudio ? `<Play>${WEBHOOK_BASE_URL}/audio/${planId}/end.mp3</Play>` : ''}
  <Hangup/>
</Response>`.trim();
  }

  const audioUrl = `${WEBHOOK_BASE_URL}/audio/${planId}/${nextNodeId}.mp3`;
  const isEnd = nextNode.type === 'end' || nextNode.defaultNext === 'end';

  return generateResponseTwiML({ audioUrl, callPlanId: planId, nodeId: nextNodeId, isEnd });
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  executeCall,
  generateIntroTwiML,
  generateResponseTwiML,
  generateRecordingTwiML,
  pregenerateCallAudio,
  handleStatusCallback,
  handleRecordingCallback,
  handleGatherCallback,
  DRY_RUN,
};
