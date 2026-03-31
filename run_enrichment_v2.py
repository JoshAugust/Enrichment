#!/usr/bin/env python3
"""
Enrichment Batch Runner v2
- Uses long HTTP timeout (600s) so we actually get responses
- Fire-and-forget fallback: if timeout hit, server still processes
- Logs all progress
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
WAIT_BETWEEN_BATCHES = 90   # seconds - give server time to fully process
SCORE_EVERY_N_BATCHES = 5
HTTP_TIMEOUT = 600           # 10 minutes - batches can take a while

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

def api_post(path, data, timeout=HTTP_TIMEOUT):
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

def run_batches(lead_ids, force=False, phase_label=""):
    total = len(lead_ids)
    log(f"\n{'='*60}")
    log(f"{phase_label}: {total} leads, force={force}")
    log(f"{'='*60}")
    
    batch_num = 0
    succeeded_total = 0
    failed_total = 0
    timeout_total = 0

    for i in range(0, total, BATCH_SIZE):
        batch = lead_ids[i:i+BATCH_SIZE]
        batch_num += 1
        pct = (i / total) * 100
        log(f"  Batch {batch_num} ({i+1}-{min(i+BATCH_SIZE, total)}/{total} = {pct:.0f}%): {len(batch)} leads, force={force}")
        
        try:
            result = api_post("/api/enrichment/batch", {
                "leadIds": batch,
                "maxCount": BATCH_SIZE,
                "force": force
            }, timeout=HTTP_TIMEOUT)
            
            # Parse result - handle different response shapes
            succeeded = result.get("succeeded", result.get("success", 0))
            failed = result.get("failed", result.get("errors", 0))
            if isinstance(succeeded, list): succeeded = len(succeeded)
            if isinstance(failed, list): failed = len(failed)
            if not isinstance(succeeded, int): succeeded = 0
            if not isinstance(failed, int): failed = 0
            
            succeeded_total += succeeded
            failed_total += failed
            log(f"    ✓ succeeded={succeeded}, failed={failed}")
            
            # Log extra info if available
            if "message" in result:
                log(f"    msg: {result['message'][:100]}")
                
        except socket.timeout:
            log(f"    ⚠ HTTP timeout after {HTTP_TIMEOUT}s — server likely still processing, counting as submitted")
            timeout_total += len(batch)
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:200]
            log(f"    ✗ HTTP {e.code}: {body}")
            failed_total += len(batch)
        except Exception as e:
            log(f"    ✗ ERROR: {type(e).__name__}: {e}")
            failed_total += len(batch)
        
        # Trigger scoring every N batches
        if batch_num % SCORE_EVERY_N_BATCHES == 0:
            log(f"  [Scoring] Triggering after batch {batch_num}...")
            try:
                score_result = api_post("/api/scoring", {}, timeout=60)
                log(f"  [Scoring] ✓ {str(score_result)[:100]}")
            except Exception as e:
                log(f"  [Scoring] ✗ {e}")
        
        # Wait between batches (not after last one)
        if i + BATCH_SIZE < total:
            log(f"  Waiting {WAIT_BETWEEN_BATCHES}s before next batch... (completed≈{succeeded_total}, timeout≈{timeout_total}, failed={failed_total})")
            time.sleep(WAIT_BETWEEN_BATCHES)
    
    log(f"\n  {phase_label} DONE: succeeded≈{succeeded_total}, timeout≈{timeout_total}, failed={failed_total}")
    return succeeded_total, failed_total

def get_current_stats():
    log("\n=== CURRENT STATS ===")
    try:
        all_leads = []
        offset = 0
        while True:
            data = api_get(f"/api/leads?limit=100&offset={offset}", timeout=30)
            leads = data.get("leads", [])
            if not leads: break
            all_leads.extend(leads)
            if len(leads) < 100: break
            offset += 100
            time.sleep(0.3)
        
        unenriched = [l for l in all_leads if not l.get("last_enriched_at")]
        enriched = [l for l in all_leads if l.get("last_enriched_at")]
        avg = sum(l.get("enrichment_completeness", 0) for l in enriched) / max(len(enriched), 1)
        log(f"  Total: {len(all_leads)} | Unenriched: {len(unenriched)} | Enriched: {len(enriched)} | Avg completeness: {avg:.1f}%")
        return len(unenriched), avg
    except Exception as e:
        log(f"  ERROR getting stats: {e}")
        return -1, -1

def main():
    log("\n" + "="*60)
    log("ENRICHMENT BATCH RUNNER v2 STARTED")
    log("="*60)
    
    # Load pre-fetched IDs
    unenriched_ids_path = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/unenriched_ids.json"
    low_completeness_ids_path = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/low_completeness_ids.json"
    
    unenriched_ids = load_ids(unenriched_ids_path)
    low_completeness_ids = load_ids(low_completeness_ids_path)
    
    log(f"Loaded {len(unenriched_ids)} unenriched IDs")
    log(f"Loaded {len(low_completeness_ids)} low-completeness IDs for re-enrichment")
    
    # Phase 2: Enrich unenriched leads
    if unenriched_ids:
        run_batches(unenriched_ids, force=False, phase_label="PHASE 2: Enrich Unenriched")
        log("\nWaiting 120s before starting Phase 3...")
        time.sleep(120)
    
    # Phase 3: Re-enrich low-completeness leads
    if low_completeness_ids:
        run_batches(low_completeness_ids, force=True, phase_label="PHASE 3: Re-enrich Low Completeness")
    
    # Final scoring
    log("\n=== FINAL SCORING ===")
    try:
        result = api_post("/api/scoring", {}, timeout=60)
        log(f"  ✓ {str(result)[:200]}")
    except Exception as e:
        log(f"  ✗ {e}")
    
    # Final stats
    get_current_stats()
    
    log("\n" + "="*60)
    log("ENRICHMENT BATCH RUNNER v2 COMPLETE")
    log("="*60)

if __name__ == "__main__":
    main()
