/**
 * chatterbox-engine.js — Node.js wrapper for Chatterbox TTS (Python)
 *
 * Calls the Python chatterbox-tts.py script via subprocess or HTTP server.
 * Chatterbox beat ElevenLabs in blind tests (63.75% preference). Free, MIT licensed.
 *
 * Two modes:
 *   1. CLI mode (default): spawns Python per synthesis — simple, slower (model loads each time)
 *   2. Server mode: persistent Python HTTP server — fast after first load (~3s warmup)
 *
 * Requires: .venv-tts with chatterbox-tts installed (Python 3.11)
 */

'use strict';

const { execFile } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// ── Paths ────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const VENV_PYTHON = path.join(PROJECT_ROOT, '.venv-tts', 'bin', 'python3');
const CHATTERBOX_SCRIPT = path.join(__dirname, 'chatterbox-tts.py');
const SERVER_PORT = 9877;

// ── Voice presets (mapped to emotion levels) ─────────────────────────────────

const CHATTERBOX_VOICE_PRESETS = {
  adam:    { emotion: 'confident',  description: 'Confident, assertive — good for outreach' },
  rachel: { emotion: 'warm',       description: 'Warm, approachable — natural intro voice' },
  josh:   { emotion: 'neutral',    description: 'Professional, measured' },
  elli:   { emotion: 'empathetic', description: 'Empathetic, caring — good for follow-ups' },
};

// ── Server management ────────────────────────────────────────────────────────

let _serverProcess = null;
let _serverReady = false;

/**
 * Start the Chatterbox HTTP server for fast repeated synthesis.
 * Model loads once (~15-30s first time, ~3s cached), then synthesis is fast.
 *
 * @returns {Promise<void>}
 */
function startServer() {
  return new Promise((resolve, reject) => {
    if (_serverReady) return resolve();

    console.log('[chatterbox] Starting TTS server (model loading may take 15-30s first time)...');

    _serverProcess = spawn(VENV_PYTHON, [CHATTERBOX_SCRIPT, '--serve', '--port', String(SERVER_PORT)], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PYTORCH_ENABLE_MPS_FALLBACK: '1' },
    });

    _serverProcess.stderr.on('data', (data) => {
      const msg = data.toString().trim();
      console.log(`[chatterbox] ${msg}`);
      if (msg.includes('Server ready')) {
        _serverReady = true;
        resolve();
      }
    });

    _serverProcess.on('error', (err) => {
      console.error('[chatterbox] Server failed to start:', err.message);
      reject(err);
    });

    _serverProcess.on('exit', (code) => {
      _serverReady = false;
      _serverProcess = null;
      if (code !== 0 && code !== null) {
        console.error(`[chatterbox] Server exited with code ${code}`);
      }
    });

    // Timeout after 120s (model download can be slow first time)
    setTimeout(() => {
      if (!_serverReady) reject(new Error('[chatterbox] Server startup timeout (120s)'));
    }, 120000);
  });
}

/**
 * Stop the Chatterbox server.
 */
function stopServer() {
  if (_serverProcess) {
    _serverProcess.kill();
    _serverProcess = null;
    _serverReady = false;
    console.log('[chatterbox] Server stopped');
  }
}

// ── Synthesis via HTTP server ────────────────────────────────────────────────

/**
 * Synthesize via the running Chatterbox HTTP server.
 */
function synthesizeViaServer({ text, voice, outputPath, exaggeration, referenceAudio }) {
  return new Promise((resolve, reject) => {
    const preset = CHATTERBOX_VOICE_PRESETS[voice];
    const body = JSON.stringify({
      text,
      output: outputPath,
      voice: preset ? preset.emotion : (voice || 'neutral'),
      exaggeration,
      reference_audio: referenceAudio,
    });

    const req = http.request({
      method: 'POST',
      hostname: '127.0.0.1',
      port: SERVER_PORT,
      path: '/',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`[chatterbox] Server error: ${result.error || data}`));
          } else {
            resolve(result);
          }
        } catch (e) {
          reject(new Error(`[chatterbox] Invalid server response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('[chatterbox] Request timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Synthesis via CLI (subprocess) ───────────────────────────────────────────

/**
 * Synthesize via spawning a Python subprocess.
 * Slower (loads model each time) but simpler — no server to manage.
 */
function synthesizeViaCLI({ text, voice, outputPath, exaggeration, referenceAudio }) {
  return new Promise((resolve, reject) => {
    const preset = CHATTERBOX_VOICE_PRESETS[voice];
    const input = JSON.stringify({
      text,
      output: outputPath,
      voice: preset ? preset.emotion : (voice || 'neutral'),
      exaggeration,
      reference_audio: referenceAudio,
    });

    const child = spawn(VENV_PYTHON, [CHATTERBOX_SCRIPT], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTORCH_ENABLE_MPS_FALLBACK: '1' },
      timeout: 120000,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => stdout += data);
    child.stderr.on('data', (data) => {
      stderr += data;
      // Log model loading progress
      const msg = data.toString().trim();
      if (msg) console.log(`[chatterbox] ${msg}`);
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`[chatterbox] CLI exited with code ${code}: ${stderr}`));
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        reject(new Error(`[chatterbox] Invalid CLI output: ${stdout}`));
      }
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Synthesize text to audio using Chatterbox.
 * Automatically uses server mode if running, falls back to CLI.
 *
 * @param {Object} opts
 * @param {string} opts.text         - Text to synthesize
 * @param {string} [opts.voice]      - Voice preset (adam, rachel, josh, elli) or emotion name
 * @param {string} [opts.outputPath] - Where to write the WAV file
 * @param {number} [opts.exaggeration] - Emotion level override (0.0=monotone, 1.0=dramatic)
 * @param {string} [opts.referenceAudio] - Path to reference audio for voice cloning
 * @returns {Promise<Object>}
 */
async function synthesize(opts) {
  const { text, voice = 'rachel', outputPath, exaggeration, referenceAudio } = opts;

  if (!text || !text.trim()) {
    throw new Error('[chatterbox] synthesize(): text is required');
  }

  // Ensure output directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Use server if running, else CLI
  if (_serverReady) {
    return synthesizeViaServer({ text, voice, outputPath, exaggeration, referenceAudio });
  }
  return synthesizeViaCLI({ text, voice, outputPath, exaggeration, referenceAudio });
}

/**
 * Check if Chatterbox is available (venv exists with correct Python).
 * @returns {Promise<boolean>}
 */
function isAvailable() {
  return new Promise((resolve) => {
    if (!fs.existsSync(VENV_PYTHON)) {
      resolve(false);
      return;
    }
    execFile(VENV_PYTHON, ['-c', 'from chatterbox.tts import ChatterboxTTS; print("ok")'], {
      timeout: 15000,
      env: { ...process.env },
    }, (err, stdout) => {
      resolve(!err && stdout.trim() === 'ok');
    });
  });
}

module.exports = {
  synthesize,
  isAvailable,
  startServer,
  stopServer,
  CHATTERBOX_VOICE_PRESETS,
};
