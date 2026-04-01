/**
 * voice-engine.js — Voice synthesis engine for Corgi Outreach
 *
 * Priority chain:
 *   1. ElevenLabs REST API (if ELEVENLABS_API_KEY is set)
 *   2. Edge-TTS (free, no API key, high quality neural voices)  ← DEFAULT
 *   3. Piper TTS (open-source, fully local)
 *   4. Mock mode (silent placeholder WAV)
 *
 * All audio saved to data/audio/ directory.
 * Supports SSML-like markup for pauses and emphasis.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { Writable } = require('stream');
require('dotenv').config();

const edgeTts = require('./edge-tts-engine');
const chatterbox = require('./chatterbox-engine');
const config = require('../../config/default.json');

// ── Constants ────────────────────────────────────────────────────────────────

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Well-known ElevenLabs voice IDs (free tier available)
const VOICE_PRESETS = {
  // Warm professional male
  adam: {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    gender: 'male',
    description: 'Warm, professional male — good for outreach calls',
  },
  // Warm professional female
  rachel: {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    description: 'Calm, warm female — natural and approachable',
  },
  // Additional options
  josh: {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    gender: 'male',
    description: 'Confident male voice',
  },
  elli: {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    gender: 'female',
    description: 'Expressive, natural female',
  },
};

// ── Config resolution ────────────────────────────────────────────────────────

const voiceConfig = config.voice || {};
const ELEVENLABS_API_KEY =
  process.env.ELEVENLABS_API_KEY || voiceConfig?.elevenlabs?.apiKey || '';
const DEFAULT_VOICE_NAME = voiceConfig?.elevenlabs?.defaultVoice || 'rachel';
const DEFAULT_MODEL = voiceConfig?.elevenlabs?.model || 'eleven_turbo_v2_5';

// Resolve audio output directory relative to the backend root
const AUDIO_DIR = path.resolve(
  __dirname,
  '../../..',
  voiceConfig?.audioDir || './data/audio'
);

// ── SSML-like pre-processing ─────────────────────────────────────────────────

/**
 * Convert lightweight markup into a plain string suitable for TTS.
 * Supported tags:
 *   <pause ms="500"/>        — inserts silence hint (stripped for EL, converted for Piper)
 *   <emphasis>text</emphasis>— ElevenLabs handles emphasis naturally; we uppercase for mock
 *
 * For ElevenLabs we strip tags but use them to inject natural ellipses / commas.
 *
 * @param {string} text
 * @returns {string}
 */
function preprocessSSML(text) {
  // Replace pause tags with an ellipsis + space to hint prosody
  let processed = text.replace(/<pause[^/]*\/>/gi, '... ');
  // Strip emphasis tags but keep content
  processed = processed.replace(/<emphasis>(.*?)<\/emphasis>/gi, '$1');
  // Remove any other XML-like tags
  processed = processed.replace(/<[^>]+>/g, '');
  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim();
  return processed;
}

// ── Core synthesis ───────────────────────────────────────────────────────────

/**
 * Synthesize text to audio using ElevenLabs.
 *
 * @param {Object} opts
 * @param {string} opts.text          - Text (or SSML-like markup) to synthesize
 * @param {string} [opts.voice]       - Voice preset name or ElevenLabs voice ID
 * @param {string} [opts.model]       - ElevenLabs model ID
 * @param {string} [opts.outputPath]  - Absolute path to write MP3 to; auto-generated if omitted
 * @param {boolean} [opts.stream]     - If true, returns a readable stream instead of writing file
 * @returns {Promise<{filePath: string, durationEstimate: number, mock: boolean}>}
 */
async function synthesize(opts = {}) {
  const {
    text,
    voice = DEFAULT_VOICE_NAME,
    model = DEFAULT_MODEL,
    outputPath,
    stream = false,
  } = opts;

  if (!text || !text.trim()) {
    throw new Error('[voice-engine] synthesize(): text is required');
  }

  const cleanText = preprocessSSML(text);
  const voiceId = resolveVoiceId(voice);
  const destPath = outputPath || generateAudioPath('synth');

  // Ensure output directory exists
  ensureDir(path.dirname(destPath));

  // ── Priority 1: ElevenLabs (if API key provided) ──
  if (ELEVENLABS_API_KEY) {
    try {
      const result = await elevenLabsSynthesize({
        text: cleanText,
        voiceId,
        model,
        destPath,
        stream,
      });
      return result;
    } catch (err) {
      console.error(`[voice-engine] ElevenLabs error: ${err.message} — trying edge-tts`);
    }
  }

  // ── Priority 2: Chatterbox (free, local, beats ElevenLabs in blind tests) ──
  //    Set VOICE_ENGINE=chatterbox to prefer this, or it's tried after Edge-TTS
  const preferChatterbox = (process.env.VOICE_ENGINE || '').toLowerCase() === 'chatterbox'
    || (voiceConfig.provider || '').toLowerCase() === 'chatterbox';

  if (preferChatterbox) {
    try {
      const cbAvailable = await chatterbox.isAvailable();
      if (cbAvailable) {
        console.log('[voice-engine] Using Chatterbox (free, local, MIT licensed)');
        return await chatterbox.synthesize({
          text: cleanText,
          voice,
          outputPath: destPath,
        });
      }
    } catch (err) {
      console.error(`[voice-engine] Chatterbox error: ${err.message} — trying edge-tts`);
    }
  }

  // ── Priority 3: Edge-TTS (free, no API key needed, fast) ──
  try {
    const edgeAvailable = await edgeTts.isAvailable();
    if (edgeAvailable) {
      console.log('[voice-engine] Using Edge-TTS (free, no API key required)');
      return await edgeTts.synthesize({
        text: cleanText,
        voice,
        outputPath: destPath,
      });
    }
  } catch (err) {
    console.error(`[voice-engine] Edge-TTS error: ${err.message} — trying chatterbox`);
  }

  // ── Priority 4: Chatterbox fallback (if not already tried) ──
  if (!preferChatterbox) {
    try {
      const cbAvailable = await chatterbox.isAvailable();
      if (cbAvailable) {
        console.log('[voice-engine] Using Chatterbox as fallback');
        return await chatterbox.synthesize({
          text: cleanText,
          voice,
          outputPath: destPath,
        });
      }
    } catch (err) {
      console.error(`[voice-engine] Chatterbox fallback error: ${err.message}`);
    }
  }

  // ── Priority 5: Mock mode (placeholder audio) ──
  console.warn('[voice-engine] No TTS engine available — running in mock mode');
  return await mockSynthesize({ text: cleanText, voice, destPath });
}

// ── ElevenLabs implementation ────────────────────────────────────────────────

/**
 * Call ElevenLabs /text-to-speech REST endpoint.
 * Returns a stream or writes to file.
 *
 * @param {Object} opts
 * @returns {Promise<{filePath: string, durationEstimate: number, mock: boolean}>}
 */
function elevenLabsSynthesize({ text, voiceId, model, destPath, stream }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    });

    const options = {
      method: 'POST',
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', (c) => (errBody += c));
        res.on('end', () =>
          reject(new Error(`ElevenLabs API error ${res.statusCode}: ${errBody}`))
        );
        return;
      }

      if (stream) {
        // Caller wants the raw stream
        resolve({ stream: res, filePath: null, mock: false });
        return;
      }

      const fileStream = fs.createWriteStream(destPath);
      let bytesWritten = 0;

      res.on('data', (chunk) => {
        bytesWritten += chunk.length;
        fileStream.write(chunk);
      });

      res.on('end', () => {
        fileStream.end();
        // Rough estimate: MP3 at 128kbps ≈ 16KB/s
        const durationEstimate = Math.round(bytesWritten / 16000);
        console.log(
          `[voice-engine] Synthesized ${bytesWritten} bytes → ${destPath} (~${durationEstimate}s)`
        );
        resolve({ filePath: destPath, durationEstimate, mock: false });
      });

      res.on('error', reject);
      fileStream.on('error', reject);
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Mock mode ────────────────────────────────────────────────────────────────

/**
 * Mock synthesis — generates a placeholder WAV file (silence + header) and
 * logs what would be synthesized. Allows the full system to run without API keys.
 *
 * @param {Object} opts
 * @returns {Promise<{filePath: string, durationEstimate: number, mock: boolean}>}
 */
async function mockSynthesize({ text, voice, destPath }) {
  // BUG-003 fix: write to the requested path (honour .mp3 or .wav extension)
  // WAV data written to .mp3 is fine — Twilio reads the audio headers, not the extension
  const wavPath = destPath; // keep requested extension/path as-is
  const sampleRate = 8000;
  const numSeconds = Math.min(30, Math.max(1, Math.ceil(text.length / 12)));
  const numSamples = sampleRate * numSeconds;
  const dataSize = numSamples * 2; // 16-bit PCM
  const buffer = Buffer.alloc(44 + dataSize, 0);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);           // subchunk1 size
  buffer.writeUInt16LE(1, 20);            // PCM
  buffer.writeUInt16LE(1, 22);            // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);            // block align
  buffer.writeUInt16LE(16, 34);           // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  fs.writeFileSync(wavPath, buffer);

  console.log(`[voice-engine][MOCK] Would synthesize with voice="${voice}":`);
  console.log(`[voice-engine][MOCK] "${text.substring(0, 120)}${text.length > 120 ? '...' : ''}"`);
  console.log(`[voice-engine][MOCK] Placeholder audio written → ${wavPath} (~${numSeconds}s)`);

  return { filePath: wavPath, durationEstimate: numSeconds, mock: true };
}

// ── Voice cloning ────────────────────────────────────────────────────────────

/**
 * Create a cloned voice on ElevenLabs from one or more audio samples.
 * Requires a paid ElevenLabs account.
 *
 * @param {Object} opts
 * @param {string} opts.name           - Name for the cloned voice
 * @param {string[]} opts.samplePaths  - Paths to WAV/MP3 sample files (3-30 recommended)
 * @param {string} [opts.description]  - Description for the voice
 * @returns {Promise<{voiceId: string, name: string}>}
 */
async function cloneVoice({ name, samplePaths, description = '' }) {
  if (!ELEVENLABS_API_KEY) {
    console.warn('[voice-engine] cloneVoice(): No API key — returning mock voice ID');
    return { voiceId: 'mock-cloned-voice-id', name, mock: true };
  }

  // ElevenLabs voice cloning uses multipart/form-data
  const FormData = require('form-data');
  const fetch = require('node-fetch');

  const form = new FormData();
  form.append('name', name);
  form.append('description', description);

  for (const samplePath of samplePaths) {
    form.append('files', fs.createReadStream(samplePath));
  }

  const res = await fetch(`${ELEVENLABS_API_BASE}/voices/add`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      ...form.getHeaders(),
    },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[voice-engine] Voice cloning failed: ${res.status} ${errText}`);
  }

  const data = await res.json();
  console.log(`[voice-engine] Voice cloned: ${data.voice_id} (${name})`);
  return { voiceId: data.voice_id, name };
}

// ── Piper TTS fallback hook ──────────────────────────────────────────────────

/**
 * Synthesize using Piper TTS (open-source, runs locally).
 * Requires `piper` binary in PATH and a model file.
 *
 * @param {Object} opts
 * @param {string} opts.text
 * @param {string} [opts.model]       - Path to Piper .onnx model file
 * @param {string} [opts.outputPath]
 * @returns {Promise<{filePath: string, durationEstimate: number, mock: boolean}>}
 */
async function piperSynthesize({ text, model, outputPath }) {
  const { execFile } = require('child_process');
  const destPath = outputPath || generateAudioPath('piper', 'wav');
  ensureDir(path.dirname(destPath));

  const cleanText = preprocessSSML(text);
  const piperModel = model || process.env.PIPER_MODEL_PATH;

  if (!piperModel) {
    throw new Error('[voice-engine] piperSynthesize(): PIPER_MODEL_PATH not set');
  }

  return new Promise((resolve, reject) => {
    const args = ['--model', piperModel, '--output_file', destPath];
    const child = execFile('piper', args, (err) => {
      if (err) return reject(new Error(`[voice-engine] Piper error: ${err.message}`));
      const numSeconds = Math.ceil(cleanText.length / 12);
      console.log(`[voice-engine][Piper] Audio written → ${destPath} (~${numSeconds}s)`);
      resolve({ filePath: destPath, durationEstimate: numSeconds, mock: false });
    });
    // Pipe text to stdin
    child.stdin.write(cleanText);
    child.stdin.end();
  });
}

// ── Utilities ────────────────────────────────────────────────────────────────

/**
 * Resolve a voice name to an ElevenLabs voice ID.
 * Accepts preset names ('rachel', 'adam', etc.) or raw IDs.
 *
 * @param {string} voice
 * @returns {string} ElevenLabs voice ID
 */
function resolveVoiceId(voice) {
  if (VOICE_PRESETS[voice]) return VOICE_PRESETS[voice].id;
  // Assume it's already a raw ID (26-char alphanumeric)
  return voice;
}

/**
 * Generate a unique output path inside AUDIO_DIR.
 *
 * @param {string} prefix
 * @param {string} [ext='mp3']
 * @returns {string}
 */
function generateAudioPath(prefix = 'audio', ext = 'mp3') {
  const ts = Date.now();
  return path.join(AUDIO_DIR, `${prefix}_${ts}.${ext}`);
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 * @param {string} dir
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  synthesize,
  cloneVoice,
  piperSynthesize,
  preprocessSSML,
  resolveVoiceId,
  generateAudioPath,
  ensureDir,
  VOICE_PRESETS,
  AUDIO_DIR,
};
