#!/usr/bin/env python3
"""
chatterbox-tts.py — Chatterbox TTS synthesis server/CLI for Corgi Outreach

Runs as a subprocess called from Node.js. Accepts JSON on stdin, writes audio file,
outputs JSON result on stdout.

Usage:
  echo '{"text":"Hello","output":"/tmp/out.wav","voice":"neutral"}' | python3 chatterbox-tts.py

Or run as a simple HTTP server for persistent model loading:
  python3 chatterbox-tts.py --serve --port 9877

Requires: pip install chatterbox-tts (in .venv-tts)
"""

import sys
import json
import os
import time
import argparse
import warnings

warnings.filterwarnings("ignore")

# ── Model cache (loaded once) ───────────────────────────────────────────────

_model = None
_device = None

def get_model():
    global _model, _device
    if _model is not None:
        return _model, _device

    import torch
    from chatterbox.tts import ChatterboxTTS

    # Use MPS (Apple Silicon GPU) if available, else CPU
    if torch.backends.mps.is_available():
        _device = "mps"
    elif torch.cuda.is_available():
        _device = "cuda"
    else:
        _device = "cpu"

    t0 = time.time()
    _model = ChatterboxTTS.from_pretrained(device=_device)
    elapsed = time.time() - t0
    print(f"[chatterbox] Model loaded on {_device} in {elapsed:.1f}s", file=sys.stderr)

    return _model, _device


# ── Emotion presets ──────────────────────────────────────────────────────────

EMOTION_PRESETS = {
    "neutral":    0.3,   # Professional, measured
    "warm":       0.5,   # Friendly, approachable — good for intros
    "confident":  0.4,   # Assertive but not aggressive
    "empathetic": 0.6,   # Understanding, caring — good for objection handling
    "excited":    0.8,   # High energy — use sparingly
}


def synthesize(text, output_path, voice="neutral", exaggeration=None, reference_audio=None):
    """
    Synthesize text to audio using Chatterbox.

    Args:
        text: Text to speak
        output_path: Where to save the WAV file
        voice: Emotion preset name or float (0.0-1.0)
        exaggeration: Override emotion exaggeration (0.0=monotone, 1.0=dramatic)
        reference_audio: Path to reference audio for voice cloning (optional)
    """
    model, device = get_model()
    import torchaudio

    # Resolve emotion level
    if exaggeration is not None:
        exag = float(exaggeration)
    elif voice in EMOTION_PRESETS:
        exag = EMOTION_PRESETS[voice]
    else:
        try:
            exag = float(voice)
        except (ValueError, TypeError):
            exag = 0.3

    t0 = time.time()

    # Generate audio
    wav = model.generate(
        text,
        audio_prompt_path=reference_audio,
        exaggeration=exag,
    )

    # Save
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    torchaudio.save(output_path, wav, model.sr)

    elapsed = time.time() - t0
    file_size = os.path.getsize(output_path)
    duration_est = wav.shape[1] / model.sr

    return {
        "filePath": output_path,
        "durationEstimate": round(duration_est, 1),
        "engine": "chatterbox",
        "device": device,
        "emotion": voice if voice in EMOTION_PRESETS else "custom",
        "exaggeration": exag,
        "synthesisTime": round(elapsed, 2),
        "fileSize": file_size,
        "mock": False,
    }


# ── CLI mode ─────────────────────────────────────────────────────────────────

def cli_mode():
    """Read JSON from stdin, synthesize, print JSON result to stdout."""
    raw = sys.stdin.read()
    params = json.loads(raw)

    result = synthesize(
        text=params["text"],
        output_path=params["output"],
        voice=params.get("voice", "neutral"),
        exaggeration=params.get("exaggeration"),
        reference_audio=params.get("reference_audio"),
    )

    print(json.dumps(result))


# ── HTTP server mode ─────────────────────────────────────────────────────────

def serve_mode(port=9877):
    """Run as a tiny HTTP server for persistent model loading."""
    from http.server import HTTPServer, BaseHTTPRequestHandler

    # Pre-load model
    get_model()
    print(f"[chatterbox] Server ready on http://localhost:{port}", file=sys.stderr)

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            params = json.loads(body)

            try:
                result = synthesize(
                    text=params["text"],
                    output_path=params["output"],
                    voice=params.get("voice", "neutral"),
                    exaggeration=params.get("exaggeration"),
                    reference_audio=params.get("reference_audio"),
                )
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        def do_GET(self):
            if self.path == "/health":
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "engine": "chatterbox"}).encode())
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format, *args):
            print(f"[chatterbox-server] {args[0]}", file=sys.stderr)

    HTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--serve", action="store_true", help="Run as HTTP server")
    parser.add_argument("--port", type=int, default=9877, help="Server port")
    args = parser.parse_args()

    if args.serve:
        serve_mode(args.port)
    else:
        cli_mode()
