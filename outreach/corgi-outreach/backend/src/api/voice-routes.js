/**
 * voice-routes.js — Express API routes for the Corgi Outreach voice engine
 *
 * Mounts at /api/voice
 *
 * Routes:
 *   GET  /api/voice/status                    — voice system health & config
 *   GET  /api/voice/previews                  — list all generated preview clips
 *   POST /api/voice/preview                   — generate a voice preview for a script version
 *   POST /api/voice/call-plan/:companyId       — generate a call plan for a company
 *   POST /api/voice/dry-run/:companyId         — full dry-run simulation (audio + plan)
 *
 * TwiML webhook routes (for live Twilio calls):
 *   POST /api/voice/twiml/gather               — gather callback (speech recognition)
 *   POST /api/voice/webhook/status             — call status callback
 *   POST /api/voice/webhook/recording          — recording ready callback
 *
 * Audio serving:
 *   GET  /audio/:planId/:nodeId.mp3            — serve generated call audio
 */

'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { db } = require('../db');
const { synthesize, AUDIO_DIR, VOICE_PRESETS, ensureDir } = require('../voice/voice-engine');
const { generateCallPlan, SCRIPTS, selectScript } = require('../voice/call-flow');
const { executeCall, handleStatusCallback, handleRecordingCallback, handleGatherCallback, DRY_RUN } = require('../voice/call-manager');
const { generatePreview, generateAllPreviews, listPreviews, loadManifest } = require('../voice/voice-preview');

const router = express.Router();

// ── GET /api/voice/status ─────────────────────────────────────────────────────

router.get('/status', (req, res) => {
  const config = require('../../config/default.json');
  const voiceConfig = config.voice || {};

  const twilioConfigured = !!(
    (process.env.TWILIO_ACCOUNT_SID || voiceConfig?.twilio?.accountSid) &&
    (process.env.TWILIO_AUTH_TOKEN || voiceConfig?.twilio?.authToken) &&
    (process.env.TWILIO_FROM_NUMBER || voiceConfig?.twilio?.fromNumber)
  );

  const previewManifest = loadManifest();
  const activeEngine = process.env.VOICE_ENGINE || voiceConfig.provider || 'edge-tts';

  res.json({
    status: 'ok',
    dryRun: DRY_RUN,
    provider: activeEngine,
    engines: {
      'edge-tts': { available: true, cost: 'Free', note: 'Default — fast, no API key' },
      'chatterbox': { available: true, cost: 'Free (local GPU)', note: 'Best quality — beat ElevenLabs in blind tests' },
    },
    twilio: {
      configured: twilioConfigured,
    },
    voices: VOICE_PRESETS,
    scriptVersions: Object.keys(SCRIPTS).map((v) => ({
      version: v,
      name: SCRIPTS[v].name,
      targetTypes: SCRIPTS[v].targetTypes,
    })),
    audioDir: AUDIO_DIR,
    previews: {
      count: previewManifest?.totalPreviews || 0,
      lastGenerated: previewManifest?.generatedAt || null,
    },
  });
});

// ── GET /api/voice/previews ───────────────────────────────────────────────────

router.get('/previews', (req, res) => {
  try {
    const previews = listPreviews();
    const manifest = loadManifest();

    res.json({
      success: true,
      count: previews.length,
      previews,
      manifest: manifest
        ? {
            generatedAt: manifest.generatedAt,
            voices: manifest.voices,
            scriptVersions: manifest.scriptVersions,
          }
        : null,
    });
  } catch (err) {
    console.error('[voice-routes] /previews error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/voice/preview ───────────────────────────────────────────────────

/**
 * Generate a voice preview for a script version.
 *
 * Body:
 *   { version: 'A', voice: 'rachel', force: false }
 *
 * Or generate all:
 *   { all: true, voices: ['rachel', 'adam'], force: false }
 */
router.post('/preview', async (req, res) => {
  const { version, voice = 'rachel', force = false, all = false, voices } = req.body || {};

  try {
    if (all) {
      const voiceList = voices || ['rachel', 'adam'];
      const versionList = Object.keys(SCRIPTS);
      console.log(`[voice-routes] Generating all previews: versions=${versionList}, voices=${voiceList}`);
      const manifest = await generateAllPreviews({ voices: voiceList, versions: versionList, force });
      return res.json({
        success: true,
        message: `Generated ${manifest.totalPreviews} previews`,
        manifest,
      });
    }

    if (!version) {
      return res.status(400).json({ success: false, error: 'version is required (A|B|C|D|E), or set all:true' });
    }

    const meta = await generatePreview({ version: version.toUpperCase(), voice, force });
    res.json({ success: true, preview: meta });
  } catch (err) {
    console.error('[voice-routes] /preview error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/voice/call-plan/:companyId ──────────────────────────────────────

/**
 * Generate a structured call plan for a company (no audio, no call).
 *
 * Body:
 *   { contactName?, contactTitle?, scriptVersion? }
 */
router.post('/call-plan/:companyId', (req, res) => {
  const { companyId } = req.params;
  const { contactName, contactTitle, scriptVersion } = req.body || {};

  try {
    // Look up company from DB
    const company = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: `Company not found: ${companyId}` });
    }

    const callPlan = generateCallPlan({
      companyId,
      companyName: company.name,
      companyType: company.type,
      contactName,
      contactTitle,
      scriptVersion: scriptVersion ? scriptVersion.toUpperCase() : null,
    });

    res.json({ success: true, callPlan });
  } catch (err) {
    console.error('[voice-routes] /call-plan error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/voice/dry-run/:companyId ────────────────────────────────────────

/**
 * Run a full dry-run simulation for a company:
 *   - Generates call plan
 *   - Pre-generates all audio
 *   - Saves to database
 *   - Returns full simulation result
 *
 * Body:
 *   { contactId?, contactName?, contactTitle?, contactPhone?, scriptVersion?, voice? }
 */
router.post('/dry-run/:companyId', async (req, res) => {
  const { companyId } = req.params;
  const {
    contactId,
    contactName,
    contactTitle,
    contactPhone,
    scriptVersion,
    voice = 'rachel',
  } = req.body || {};

  try {
    const company = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(companyId);
    if (!company) {
      return res.status(404).json({ success: false, error: `Company not found: ${companyId}` });
    }

    const result = await executeCall({
      companyId,
      companyName: company.name,
      companyType: company.type,
      contactId,
      contactName,
      contactTitle,
      contactPhone,
      scriptVersion: scriptVersion ? scriptVersion.toUpperCase() : null,
      voice,
      dryRun: true, // Always dry-run via this endpoint
    });

    res.json({ success: true, result });
  } catch (err) {
    console.error('[voice-routes] /dry-run error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/voice/twiml/gather ──────────────────────────────────────────────

/**
 * Twilio Gather webhook — receives speech recognition result,
 * returns TwiML for the next call step.
 */
router.post('/twiml/gather', (req, res) => {
  const { planId, node } = req.query;
  const payload = { ...req.body, planId, node };

  const twiml = handleGatherCallback(payload);

  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

// ── POST /api/voice/webhook/status ────────────────────────────────────────────

router.post('/webhook/status', (req, res) => {
  const { planId } = req.query;
  handleStatusCallback({ ...req.body, planId });
  res.sendStatus(204);
});

// ── POST /api/voice/webhook/recording ────────────────────────────────────────

router.post('/webhook/recording', (req, res) => {
  const { planId } = req.query;
  handleRecordingCallback({ ...req.body, planId });
  res.sendStatus(204);
});

// ── GET /audio/:planId/:file — serve pre-generated audio ─────────────────────

/**
 * Static audio serving for call audio files.
 * Mount this on the main Express app (not the router), e.g.:
 *   app.use('/audio', require('./api/voice-routes').audioMiddleware);
 */
function audioMiddleware(req, res) {
  const { planId, file } = req.params;
  if (!planId || !file) return res.status(400).send('Bad request');

  // Sanitize: planId must be a UUID, file must be alphanumeric + underscore + dot
  if (!/^[a-f0-9-]{36}$/.test(planId)) return res.status(400).send('Invalid planId');
  if (!/^[a-z0-9_.-]+\.(mp3|wav)$/.test(file)) return res.status(400).send('Invalid file');

  const filePath = path.join(AUDIO_DIR, 'calls', planId, file);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Audio file not found');
  }

  const ext = path.extname(file).toLowerCase();
  res.set('Content-Type', ext === '.mp3' ? 'audio/mpeg' : 'audio/wav');
  fs.createReadStream(filePath).pipe(res);
}

// ── GET /api/voice/call-plans — list recent call plans ───────────────────────

router.get('/call-plans', (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || null;

    let query = `SELECT id, company_id, script_version, status, dry_run, twilio_call_sid, created_at FROM call_plans`;
    const params = [];

    if (status) {
      query += ` WHERE status = ?`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(limit);

    const plans = db.prepare(query).all(...params);
    res.json({ success: true, count: plans.length, callPlans: plans });
  } catch (err) {
    console.error('[voice-routes] /call-plans error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/voice/call-plans/:planId — get single call plan ─────────────────

router.get('/call-plans/:planId', (req, res) => {
  try {
    const plan = db
      .prepare(`SELECT * FROM call_plans WHERE id = ?`)
      .get(req.params.planId);

    if (!plan) {
      return res.status(404).json({ success: false, error: 'Call plan not found' });
    }

    res.json({
      success: true,
      callPlan: {
        ...plan,
        call_plan_json: JSON.parse(plan.call_plan_json || '{}'),
        audio_files: JSON.parse(plan.audio_files || '{}'),
      },
    });
  } catch (err) {
    console.error('[voice-routes] /call-plans/:planId error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/voice/compare ───────────────────────────────────────────────────

/**
 * Generate the same text with multiple engines for A/B comparison.
 *
 * Body:
 *   {
 *     text: "Hi, I'm Josh from Corgi...",
 *     engines: ["edge-tts", "chatterbox"],  // optional, defaults to both
 *     voice: "rachel"                        // optional
 *   }
 *
 * Returns an array of results with file paths for each engine.
 */
router.post('/compare', async (req, res) => {
  const { text, engines = ['edge-tts', 'chatterbox'], voice = 'rachel' } = req.body;

  if (!text) {
    return res.status(400).json({ success: false, error: 'text is required' });
  }

  const edgeTtsEngine = require('../voice/edge-tts-engine');
  const chatterboxEngine = require('../voice/chatterbox-engine');

  const compareId = uuidv4().slice(0, 8);
  const compareDir = path.join(AUDIO_DIR, 'compare', compareId);
  ensureDir(compareDir);

  const results = [];

  for (const engine of engines) {
    try {
      let result;
      if (engine === 'edge-tts') {
        const outPath = path.join(compareDir, `edge-tts_${voice}.mp3`);
        result = await edgeTtsEngine.synthesize({ text, voice, outputPath: outPath });
      } else if (engine === 'chatterbox') {
        const outPath = path.join(compareDir, `chatterbox_${voice}.wav`);
        result = await chatterboxEngine.synthesize({ text, voice, outputPath: outPath });
      } else {
        results.push({ engine, error: `Unknown engine: ${engine}` });
        continue;
      }
      results.push({ engine, ...result });
    } catch (err) {
      results.push({ engine, error: err.message });
    }
  }

  res.json({
    success: true,
    compareId,
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    voice,
    results,
  });
});

// ── GET /api/voice/engines ────────────────────────────────────────────────────

/**
 * List available TTS engines and their status.
 */
router.get('/engines', async (req, res) => {
  const edgeTtsEngine = require('../voice/edge-tts-engine');
  const chatterboxEngine = require('../voice/chatterbox-engine');

  const [edgeOk, chatterboxOk] = await Promise.all([
    edgeTtsEngine.isAvailable(),
    chatterboxEngine.isAvailable(),
  ]);

  res.json({
    engines: [
      {
        id: 'edge-tts',
        name: 'Edge TTS (Microsoft)',
        available: edgeOk,
        cost: 'Free',
        quality: '4/5',
        speed: 'Fast (~2s)',
        notes: 'No API key needed. Good for testing and volume.',
        voices: Object.keys(edgeTtsEngine.EDGE_VOICE_PRESETS),
      },
      {
        id: 'chatterbox',
        name: 'Chatterbox (Resemble AI)',
        available: chatterboxOk,
        cost: 'Free (local)',
        quality: '5/5',
        speed: 'Moderate (~5-15s, faster with server mode)',
        notes: 'Beat ElevenLabs in blind tests (63.75% preference). Emotion control. Voice cloning.',
        voices: Object.keys(chatterboxEngine.CHATTERBOX_VOICE_PRESETS),
      },
    ],
    preferred: process.env.VOICE_ENGINE || 'edge-tts',
  });
});

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = router;
module.exports.audioMiddleware = audioMiddleware;
