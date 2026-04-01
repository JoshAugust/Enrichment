/**
 * edge-tts-engine.js — Free voice synthesis via Microsoft Edge TTS
 *
 * No API key required. No usage limits. High quality neural voices.
 * Requires: pip install edge-tts
 *
 * Used as the primary TTS engine for Corgi Outreach (replacing ElevenLabs).
 */

'use strict';

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Voice presets mapped to Edge TTS voices ──────────────────────────────────

const EDGE_VOICE_PRESETS = {
  // Warm professional male — good match for outreach calls
  adam: {
    edgeVoice: 'en-US-AndrewNeural',
    name: 'Andrew',
    gender: 'male',
    description: 'Warm, confident, authentic — great for outreach calls',
  },
  // Calm professional female
  rachel: {
    edgeVoice: 'en-US-AvaNeural',
    name: 'Ava',
    gender: 'female',
    description: 'Expressive, caring, pleasant — natural and approachable',
  },
  // Confident male
  josh: {
    edgeVoice: 'en-US-BrianNeural',
    name: 'Brian',
    gender: 'male',
    description: 'Approachable, casual, sincere',
  },
  // Expressive female
  elli: {
    edgeVoice: 'en-US-EmmaMultilingualNeural',
    name: 'Emma',
    gender: 'female',
    description: 'Cheerful, clear, conversational',
  },
  // Authority male — good for follow-ups
  chris: {
    edgeVoice: 'en-US-ChristopherNeural',
    name: 'Christopher',
    gender: 'male',
    description: 'Reliable, authoritative',
  },
};

/**
 * Synthesize text to MP3 using edge-tts CLI.
 *
 * @param {Object} opts
 * @param {string} opts.text         - Text to synthesize
 * @param {string} [opts.voice]      - Voice preset name (adam, rachel, josh, elli, chris)
 * @param {string} [opts.outputPath] - Absolute path to write MP3 to
 * @param {string} [opts.rate]       - Speed adjustment (e.g. '+10%', '-5%')
 * @param {string} [opts.pitch]      - Pitch adjustment (e.g. '+5Hz', '-2Hz')
 * @returns {Promise<{filePath: string, durationEstimate: number, mock: false, engine: 'edge-tts'}>}
 */
function synthesize({ text, voice = 'rachel', outputPath, rate, pitch }) {
  return new Promise((resolve, reject) => {
    if (!text || !text.trim()) {
      return reject(new Error('[edge-tts] synthesize(): text is required'));
    }

    const preset = EDGE_VOICE_PRESETS[voice] || EDGE_VOICE_PRESETS.rachel;
    const edgeVoice = preset.edgeVoice;

    // Ensure output directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const args = [
      '--voice', edgeVoice,
      '--text', text,
      '--write-media', outputPath,
    ];

    if (rate) args.push('--rate', rate);
    if (pitch) args.push('--pitch', pitch);

    execFile('edge-tts', args, { timeout: 30000 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(`[edge-tts] Synthesis failed: ${err.message}`));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error(`[edge-tts] Output file not created: ${outputPath}`));
      }

      const stats = fs.statSync(outputPath);
      // Rough estimate: MP3 at ~48kbps ≈ 6KB/s (edge-tts uses lower bitrate)
      const durationEstimate = Math.round(stats.size / 6000);

      console.log(
        `[edge-tts] Synthesized ${stats.size} bytes → ${outputPath} (~${durationEstimate}s) [voice: ${preset.name}]`
      );

      resolve({
        filePath: outputPath,
        durationEstimate,
        mock: false,
        engine: 'edge-tts',
        voice: preset.name,
      });
    });
  });
}

/**
 * Check if edge-tts CLI is available.
 * @returns {Promise<boolean>}
 */
function isAvailable() {
  return new Promise((resolve) => {
    execFile('edge-tts', ['--version'], { timeout: 5000 }, (err) => {
      resolve(!err);
    });
  });
}

module.exports = {
  synthesize,
  isAvailable,
  EDGE_VOICE_PRESETS,
};
