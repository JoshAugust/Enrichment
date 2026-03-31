#!/usr/bin/env python3
"""
Enrichment Batch Runner v3
Strategy: Fire-and-forget batches (short HTTP timeout), server processes in background.
The server has shown it processes leads even when client disconnects.
- 20s HTTP timeout per batch (just enough to initiate)  
- 5 minute wait between batches (let server chew through previous batch)
- Periodically verify progress by counting unenriched leads
"""

import json
import time
import sys
import socket
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_FILE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG.md"
BATCH_SIZE = 15
WAIT_BETWEEN_BATCHES = 300   # 5 minutes between batches
SCORE_EVERY_N_BATCHES = 5
SUBMIT_TIMEOUT = 30          # Short: fire-and-forget

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

def load_ids(path):
    with open(path) as f:
        return json.load(f)

def submit_batch(batch, force=False):
    """Submit a batch — returns (status, succeeded, failed)."""
    try:
        result = api_post("/api/enrichment/batch", {
            "leadIds": batch,
            "maxCount": BATCH_SIZE,
            "force": force
        }, timeout=SUBMIT_TIMEOUT)
        succeeded = result.get("succeeded", result.get("success", 0))
        failed = result.get("failed", result.get("errors", 0))
        if isinstance(succeeded, list): succeeded = len(succeeded)
        if isinstance(failed, list): failed = len(failed)
        if not isinstance(succeeded, int): succeeded = len(batch)
        if not isinstance(failed, int): failed = 0
        return "ok", succeeded, failed
    except (socket.timeout, urllib.error.URLError) as e:
        if "timed out" in str(e).lower() or "timeout" in str(e).lower():
            return "timeout", len(batch), 0  # Server still processes it
        return "error", 0, len(batch)
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:100]
        log(f"    HTTP {e.code}: {body}")
        return "http_error", 0, len(batch)
    except Exception as e:
        log(f"    Exception: {type(e).__name__}: {e}")
        return "error", 0, len(batch)

def trigger_scoring():
    try:
        result = api_post("/api/scoring", {}, timeout=60)
        log(f"  [Scoring] ✓ {str(result)[:100]}")
    except Exception as e:
        log(f"  [Scoring] ✗ {e}")

def count_unenriched_sample():
    """Quick sample check at a few offsets."""
    try:
        total_unenriched = 0
        for offset in [400, 600, 800, 1000, 1200, 1400]:
            data = api_get(f"/api/leads?limit=100&offset={offset}", timeout=20)
            leads = data.get("leads", [])
            u = sum(1 for l in leads if not l.get("last_enriched_at"))
            total_unenriched += u
        log(f"  Quick sample (offsets 400-1500): ~{total_unenriched} unenriched")
        return total_unenriched
    except Exception as e:
        log(f"  Sample check error: {e}")
        return -1

def full_unenriched_count():
    """Full scan to count remaining unenriched leads."""
    log("  Full scan for remaining unenriched leads...")
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
            log(f"  Scan error at offset {offset}: {e}")
            break
    unenriched = [l for l in all_leads if not l.get("last_enriched_at")]
    enriched = [l for l in all_leads if l.get("last_enriched_at")]
    avg = sum(l.get("enrichment_completeness", 0) for l in enriched) / max(len(enriched), 1)
    log(f"  Full scan: {len(all_leads)} total, {len(unenriched)} unenriched, {len(enriched)} enriched, avg={avg:.1f}%")
    return [l["id"] for l in unenriched], avg

def run_batches(lead_ids, force=False, phase_label=""):
    total = len(lead_ids)
    log(f"\n{'='*60}")
    log(f"{phase_label}: {total} leads, force={force}, batch_size={BATCH_SIZE}")
    log(f"Estimated time: ~{total * WAIT_BETWEEN_BATCHES / BATCH_SIZE / 60:.0f} min")
    log(f"{'='*60}")
    
    batch_num = 0
    ok_total = 0
    timeout_total = 0
    failed_total = 0

    for i in range(0, total, BATCH_SIZE):
        batch = lead_ids[i:i+BATCH_SIZE]
        batch_num += 1
        pct = (i / total) * 100
        log(f"  Batch {batch_num} ({i+1}-{min(i+BATCH_SIZE, total)}/{total} = {pct:.0f}%): submitting {len(batch)} leads...")
        
        status, succ, fail = submit_batch(batch, force=force)
        
        if status == "ok":
            ok_total += succ
            failed_total += fail
            log(f"    ✓ Response received: succeeded={succ}, failed={fail}")
        elif status == "timeout":
            timeout_total += len(batch)
            log(f"    ⚡ Fire-and-forget (server processing in background)")
        else:
            failed_total += fail
            log(f"    ✗ Error ({status})")
        
        # Trigger scoring every N batches
        if batch_num % SCORE_EVERY_N_BATCHES == 0:
            log(f"  --- Triggering scoring after batch {batch_num} ---")
            trigger_scoring()
        
        # Progress check every 10 batches
        if batch_num % 10 == 0:
            count_unenriched_sample()
        
        # Wait between batches
        if i + BATCH_SIZE < total:
            log(f"  Waiting {WAIT_BETWEEN_BATCHES}s before next batch... [ok={ok_total}, faf={timeout_total}, fail={failed_total}]")
            time.sleep(WAIT_BETWEEN_BATCHES)
    
    log(f"\n  {phase_label} SUBMITTED: ok={ok_total}, fire-and-forget={timeout_total}, failed={failed_total}")
    log(f"  Waiting 5 min for server to finish processing remaining queue...")
    time.sleep(300)

def main():
    log("\n" + "="*60)
    log("ENRICHMENT BATCH RUNNER v3 STARTED")
    log("="*60)
    
    unenriched_ids = load_ids("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/unenriched_ids.json")
    low_completeness_ids = load_ids("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/low_completeness_ids.json")
    
    log(f"Loaded {len(unenriched_ids)} unenriched IDs")
    log(f"Loaded {len(low_completeness_ids)} low-completeness IDs")
    
    # Phase 2: Enrich unenriched leads
    if unenriched_ids:
        run_batches(unenriched_ids, force=False, phase_label="PHASE 2: Enrich Unenriched")
    
    # Re-scan to get fresh unenriched list (some may have been missed)
    log("\n--- Re-scanning to catch any still-unenriched leads ---")
    remaining_unenriched, avg_completeness = full_unenriched_count()
    if remaining_unenriched:
        log(f"  Found {len(remaining_unenriched)} still unenriched — running mop-up batches")
        run_batches(remaining_unenriched, force=False, phase_label="PHASE 2b: Mop-up")
    
    # Phase 3: Re-enrich low-completeness leads
    if low_completeness_ids:
        run_batches(low_completeness_ids, force=True, phase_label="PHASE 3: Re-enrich Low Completeness")
    
    # Final scoring
    log("\n=== FINAL SCORING ===")
    trigger_scoring()
    
    # Final stats
    _, final_avg = full_unenriched_count()
    
    log("\n" + "="*60)
    log(f"ENRICHMENT BATCH RUNNER v3 COMPLETE | Final avg completeness: {final_avg:.1f}%")
    log("="*60)

if __name__ == "__main__":
    main()
