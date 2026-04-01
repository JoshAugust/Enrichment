/**
 * voice-preview.js — Preview audio generation for Corgi Outreach
 *
 * Generates preview audio clips for each script version (A–E),
 * saves them as MP3/WAV files in data/audio/previews/,
 * and maintains a manifest.json listing all previews.
 *
 * Supports both live ElevenLabs generation and mock mode.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { synthesize, AUDIO_DIR, VOICE_PRESETS, ensureDir } = require('./voice-engine');
const { SCRIPTS } = require('./call-flow');

// ── Constants ────────────────────────────────────────────────────────────────

const PREVIEW_DIR = path.join(AUDIO_DIR, 'previews');
const MANIFEST_PATH = path.join(PREVIEW_DIR, 'manifest.json');

// Preview voices — one male, one female
const PREVIEW_VOICES = ['rachel', 'adam'];

// ── Generate a single preview ────────────────────────────────────────────────

/**
 * Generate a preview audio clip for a single script version.
 * The preview uses the first 2 lines of the script as a representative sample.
 *
 * @param {Object} opts
 * @param {string} opts.version       - Script version: 'A'|'B'|'C'|'D'|'E'
 * @param {string} [opts.voice]       - Voice preset name (defaults to 'rachel')
 * @param {boolean} [opts.force]      - Regenerate even if file already exists
 * @returns {Promise<Object>}         - Preview metadata entry
 */
async function generatePreview({ version, voice = 'rachel', force = false }) {
  const script = SCRIPTS[version];
  if (!script) throw new Error(`[voice-preview] Unknown script version: ${version}`);

  ensureDir(PREVIEW_DIR);

  const safeVoice = voice.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const fileName = `preview_v${version}_${safeVoice}`;
  // We'll determine the extension after synthesis (mp3 for live, wav for mock)
  const mp3Path = path.join(PREVIEW_DIR, `${fileName}.mp3`);
  const wavPath = path.join(PREVIEW_DIR, `${fileName}.wav`);

  // Check if already exists
  if (!force && (fs.existsSync(mp3Path) || fs.existsSync(wavPath))) {
    const existingPath = fs.existsSync(mp3Path) ? mp3Path : wavPath;
    console.log(`[voice-preview] Already exists, skipping: ${existingPath}`);
    return buildPreviewMeta(version, voice, existingPath, script);
  }

  // Use first 2 lines as the preview sample
  const previewText = script.lines.slice(0, 2).join(' ');

  console.log(`[voice-preview] Generating preview for Version ${version} (${script.name}) with voice="${voice}"...`);

  const result = await synthesize({
    text: previewText,
    voice,
    outputPath: mp3Path,
  });

  return buildPreviewMeta(version, voice, result.filePath, script, result.mock);
}

/**
 * Build a preview metadata object.
 * @private
 */
function buildPreviewMeta(version, voice, filePath, script, mock = false) {
  const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

  return {
    version,
    scriptName: script.name,
    targetTypes: script.targetTypes,
    voice,
    voiceDescription: VOICE_PRESETS[voice]?.description || voice,
    filePath,
    fileName: path.basename(filePath),
    fileSizeBytes: stats ? stats.size : 0,
    previewText: script.lines.slice(0, 2).join(' '),
    fullScript: script.lines,
    cta: script.cta,
    mock,
    generatedAt: new Date().toISOString(),
  };
}

// ── Generate all previews ─────────────────────────────────────────────────────

/**
 * Generate preview audio for all 5 script versions (A–E),
 * for each configured preview voice.
 * Updates manifest.json after generation.
 *
 * @param {Object} [opts]
 * @param {string[]} [opts.voices]    - Voice presets to generate (default: PREVIEW_VOICES)
 * @param {string[]} [opts.versions]  - Script versions to generate (default: all)
 * @param {boolean} [opts.force]      - Regenerate existing files
 * @returns {Promise<Object>}         - Full manifest
 */
async function generateAllPreviews({ voices = PREVIEW_VOICES, versions = Object.keys(SCRIPTS), force = false } = {}) {
  ensureDir(PREVIEW_DIR);

  const previews = [];
  const errors = [];

  for (const version of versions) {
    for (const voice of voices) {
      try {
        const meta = await generatePreview({ version, voice, force });
        previews.push(meta);
      } catch (err) {
        console.error(`[voice-preview] Failed: version=${version}, voice=${voice}: ${err.message}`);
        errors.push({ version, voice, error: err.message });
      }
    }
  }

  const manifest = buildManifest(previews, errors);
  saveManifest(manifest);

  console.log(
    `[voice-preview] Done. ${previews.length} previews generated, ${errors.length} errors.`
  );
  console.log(`[voice-preview] Manifest: ${MANIFEST_PATH}`);

  return manifest;
}

// ── Manifest ─────────────────────────────────────────────────────────────────

/**
 * Build the manifest object.
 * @private
 */
function buildManifest(previews, errors = []) {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    previewDir: PREVIEW_DIR,
    totalPreviews: previews.length,
    voices: [...new Set(previews.map((p) => p.voice))],
    scriptVersions: [...new Set(previews.map((p) => p.version))],
    previews,
    errors,
  };
}

/**
 * Write manifest to disk.
 * @param {Object} manifest
 */
function saveManifest(manifest) {
  ensureDir(PREVIEW_DIR);
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

/**
 * Load the current manifest from disk (returns null if not found).
 * @returns {Object|null}
 */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (e) {
    console.error(`[voice-preview] Failed to parse manifest: ${e.message}`);
    return null;
  }
}

/**
 * List all preview files currently on disk (with metadata from manifest).
 * Falls back to scanning the directory if no manifest exists.
 *
 * @returns {Array<Object>}
 */
function listPreviews() {
  const manifest = loadManifest();

  if (manifest) {
    return manifest.previews.filter((p) => fs.existsSync(p.filePath));
  }

  // Fallback: scan directory
  if (!fs.existsSync(PREVIEW_DIR)) return [];

  return fs
    .readdirSync(PREVIEW_DIR)
    .filter((f) => f.endsWith('.mp3') || f.endsWith('.wav'))
    .map((f) => {
      const filePath = path.join(PREVIEW_DIR, f);
      const stats = fs.statSync(filePath);
      return {
        fileName: f,
        filePath,
        fileSizeBytes: stats.size,
        generatedAt: stats.mtime.toISOString(),
      };
    });
}

// ── Regenerate a single preview and refresh manifest ─────────────────────────

/**
 * Regenerate a specific preview and update the manifest.
 *
 * @param {string} version
 * @param {string} voice
 * @returns {Promise<Object>}
 */
async function refreshPreview(version, voice = 'rachel') {
  const meta = await generatePreview({ version, voice, force: true });

  // Update manifest
  const existing = loadManifest() || buildManifest([]);
  const idx = existing.previews.findIndex(
    (p) => p.version === version && p.voice === voice
  );
  if (idx >= 0) {
    existing.previews[idx] = meta;
  } else {
    existing.previews.push(meta);
  }
  existing.generatedAt = new Date().toISOString();
  saveManifest(existing);

  return meta;
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  generatePreview,
  generateAllPreviews,
  listPreviews,
  loadManifest,
  saveManifest,
  refreshPreview,
  PREVIEW_DIR,
  MANIFEST_PATH,
};
