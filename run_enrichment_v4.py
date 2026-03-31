#!/usr/bin/env python3
"""
Enrichment Batch Runner v4
- 30s HTTP timeout (fire-and-forget if server busy)
- 90s wait between batches (server processes ~15 leads in parallel, ~30-90s each)
- Periodic full scan to catch any misses
- Adaptive: if server responds quickly, shorten wait
"""

import json
import time
import socket
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_FILE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG.md"
IDS_DIR = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment"
BATCH_SIZE = 15
WAIT_BETWEEN_BATCHES = 90    # seconds
SCORE_EVERY_N_BATCHES = 5
SUBMIT_TIMEOUT = 35

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def api_get(path, timeout=30):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"X-API-Key": API_KEY})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())

def api_post(path, data, timeout=SUBMIT_TIMEOUT):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())

def submit_batch(batch, force=False):
    try:
        t0 = time.time()
        result = api_post("/api/enrichment/batch", {
            "leadIds": batch,
            "maxCount": BATCH_SIZE,
            "force": force
        })
        elapsed = time.time() - t0
        succeeded = result.get("succeeded", result.get("success", 0))
        failed = result.get("failed", result.get("errors", 0))
        if isinstance(succeeded, list): succeeded = len(succeeded)
        if isinstance(failed, list): failed = len(failed)
        if not isinstance(succeeded, int): succeeded = len(batch)
        if not isinstance(failed, int): failed = 0
        return "ok", succeeded, failed, elapsed
    except (socket.timeout, urllib.error.URLError) as e:
        if "timed out" in str(e).lower() or "timeout" in str(e).lower():
            return "timeout", len(batch), 0, SUBMIT_TIMEOUT
        return "error", 0, len(batch), 0
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:150]
        log(f"    HTTP {e.code}: {body}")
        return "http_error", 0, len(batch), 0
    except Exception as e:
        log(f"    Exception: {type(e).__name__}: {e}")
        return "error", 0, len(batch), 0

def trigger_scoring():
    try:
        result = api_post("/api/scoring", {}, timeout=60)
        log(f"  [Scoring] ✓ {str(result)[:100]}")
    except Exception as e:
        log(f"  [Scoring] ✗ {e}")

def full_scan():
    log("  [Scan] Full scan starting...")
    all_leads = []
    offset = 0
    while True:
        try:
            data = api_get(f"/api/leads?limit=100&offset={offset}", timeout=30)
            leads = data.get("leads", [])
            if not leads: break
            all_leads.extend(leads)
            if len(leads) < 100: break
            offset += 100
            time.sleep(0.3)
        except Exception as e:
            log(f"  [Scan] Error at offset {offset}: {e}")
            break
    unenriched = [l for l in all_leads if not l.get("last_enriched_at")]
    enriched = [l for l in all_leads if l.get("last_enriched_at")]
    avg = sum(l.get("enrichment_completeness", 0) for l in enriched) / max(len(enriched), 1)
    log(f"  [Scan] Total={len(all_leads)}, unenriched={len(unenriched)}, enriched={len(enriched)}, avg={avg:.1f}%")
    return [l["id"] for l in unenriched], [l["id"] for l in sorted(enriched, key=lambda x: x.get("enrichment_completeness",0))[:200]], avg

def run_batches(lead_ids, force=False, phase_label=""):
    total = len(lead_ids)
    est_min = (total / BATCH_SIZE) * (WAIT_BETWEEN_BATCHES + 30) / 60
    log(f"\n{'='*60}")
    log(f"{phase_label}: {total} leads | batch={BATCH_SIZE} | wait={WAIT_BETWEEN_BATCHES}s | est={est_min:.0f}min")
    log(f"{'='*60}")

    batch_num = 0
    ok_total = 0
    faf_total = 0
    failed_total = 0

    for i in range(0, total, BATCH_SIZE):
        batch = lead_ids[i:i+BATCH_SIZE]
        batch_num += 1
        pct = (i / total) * 100
        log(f"  Batch {batch_num} ({i+1}-{min(i+BATCH_SIZE, total)}/{total} = {pct:.0f}%): {len(batch)} leads...")

        status, succ, fail, elapsed = submit_batch(batch, force=force)

        if status == "ok":
            ok_total += succ
            failed_total += fail
            log(f"    ✓ {succ} succeeded, {fail} failed ({elapsed:.1f}s)")
        elif status == "timeout":
            faf_total += len(batch)
            log(f"    ⚡ Fire-and-forget (server processing in bg, {elapsed:.0f}s)")
        else:
            failed_total += fail
            log(f"    ✗ Error ({status})")

        if batch_num % SCORE_EVERY_N_BATCHES == 0:
            trigger_scoring()

        if i + BATCH_SIZE < total:
            log(f"  Waiting {WAIT_BETWEEN_BATCHES}s... [ok={ok_total}, faf={faf_total}, fail={failed_total}]")
            time.sleep(WAIT_BETWEEN_BATCHES)

    log(f"\n  {phase_label} DONE: ok={ok_total}, faf={faf_total}, failed={failed_total}")

def main():
    log("\n" + "="*60)
    log("ENRICHMENT BATCH RUNNER v4 STARTED")
    log(f"Config: batch={BATCH_SIZE}, wait={WAIT_BETWEEN_BATCHES}s, timeout={SUBMIT_TIMEOUT}s")
    log("="*60)

    unenriched_ids = json.load(open(f"{IDS_DIR}/unenriched_ids.json"))
    low_comp_ids = json.load(open(f"{IDS_DIR}/low_completeness_ids.json"))
    log(f"Pre-loaded: {len(unenriched_ids)} unenriched, {len(low_comp_ids)} low-completeness")

    # Phase 2: Enrich unenriched
    run_batches(unenriched_ids, force=False, phase_label="PHASE 2: Enrich Unenriched")

    # Wait for server to settle, then re-scan
    log("\nWaiting 3 min for server to settle before re-scan...")
    time.sleep(180)

    remaining, fresh_low_comp, avg1 = full_scan()
    if remaining:
        log(f"  Mop-up: {len(remaining)} leads still unenriched after Phase 2")
        run_batches(remaining, force=False, phase_label="PHASE 2b: Mop-up")
        time.sleep(120)
    else:
        log("  No mop-up needed — all leads enriched!")

    # Phase 3: Re-enrich low-completeness (use fresh list from re-scan)
    target_ids = fresh_low_comp if fresh_low_comp else low_comp_ids
    log(f"\nPhase 3 targets: {len(target_ids)} low-completeness leads")
    run_batches(target_ids, force=True, phase_label="PHASE 3: Re-enrich Low Completeness")

    # Final scoring
    log("\n=== FINAL SCORING ===")
    trigger_scoring()

    # Final stats
    log("\n=== FINAL STATS ===")
    time.sleep(60)
    _, _, final_avg = full_scan()

    log("\n" + "="*60)
    log(f"ALL DONE. Final avg completeness: {final_avg:.1f}%")
    log("="*60)

if __name__ == "__main__":
    main()
