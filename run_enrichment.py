#!/usr/bin/env python3
"""
Enrichment Batch Runner
Fetches all unenriched leads, enriches them in batches, then re-enriches low-completeness leads.
"""

import json
import time
import sys
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_FILE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG.md"
BATCH_SIZE = 15
WAIT_BETWEEN_BATCHES = 70  # seconds
SCORE_EVERY_N_BATCHES = 5

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def api_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"X-API-Key": API_KEY})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())

def api_post(path, data):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(url, data=body, headers={
        "X-API-Key": API_KEY,
        "Content-Type": "application/json"
    }, method="POST")
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())

def fetch_all_leads():
    """Page through all leads, collecting unenriched IDs and low-completeness IDs."""
    log("=== PHASE 1: Scanning all leads ===")
    all_leads = []
    offset = 0
    limit = 100
    while True:
        try:
            data = api_get(f"/api/leads?limit={limit}&offset={offset}")
        except Exception as e:
            log(f"  ERROR fetching leads at offset {offset}: {e}")
            time.sleep(5)
            continue
        leads = data.get("leads", [])
        if not leads:
            break
        all_leads.extend(leads)
        log(f"  Fetched {len(all_leads)} leads so far (offset={offset})")
        if len(leads) < limit:
            break
        offset += limit
        time.sleep(1)
    
    log(f"  Total leads fetched: {len(all_leads)}")
    unenriched = [l for l in all_leads if not l.get("last_enriched_at")]
    enriched = [l for l in all_leads if l.get("last_enriched_at")]
    log(f"  Unenriched: {len(unenriched)}")
    log(f"  Enriched: {len(enriched)}")
    
    # Sort enriched by completeness (ascending) for re-enrichment
    low_completeness = sorted(enriched, key=lambda x: x.get("enrichment_completeness", 0))[:200]
    avg = sum(l.get("enrichment_completeness", 0) for l in enriched) / max(len(enriched), 1)
    log(f"  Avg completeness (enriched): {avg:.1f}%")
    log(f"  Lowest completeness lead: {low_completeness[0]['company_name'] if low_completeness else 'N/A'} = {low_completeness[0].get('enrichment_completeness',0) if low_completeness else 0}%")
    
    return [l["id"] for l in unenriched], [l["id"] for l in low_completeness]

def run_batches(lead_ids, force=False, phase_label=""):
    """Submit lead IDs in batches, waiting between each."""
    total = len(lead_ids)
    log(f"\n=== {phase_label}: {total} leads, force={force} ===")
    
    batch_num = 0
    succeeded_total = 0
    failed_total = 0
    
    for i in range(0, total, BATCH_SIZE):
        batch = lead_ids[i:i+BATCH_SIZE]
        batch_num += 1
        log(f"  Batch {batch_num} ({i+1}-{min(i+BATCH_SIZE, total)}/{total}): submitting {len(batch)} leads...")
        
        try:
            result = api_post("/api/enrichment/batch", {
                "leadIds": batch,
                "maxCount": BATCH_SIZE,
                "force": force
            })
            succeeded = result.get("succeeded", result.get("success", len(batch)))
            failed = result.get("failed", result.get("errors", 0))
            if isinstance(succeeded, list):
                succeeded = len(succeeded)
            if isinstance(failed, list):
                failed = len(failed)
            succeeded_total += succeeded if isinstance(succeeded, int) else 0
            failed_total += failed if isinstance(failed, int) else 0
            log(f"    → succeeded={succeeded}, failed={failed} | result keys: {list(result.keys())[:6]}")
        except Exception as e:
            log(f"    ERROR: {e}")
            failed_total += len(batch)
        
        # Trigger scoring every 5 batches
        if batch_num % SCORE_EVERY_N_BATCHES == 0:
            log(f"  [Scoring] Triggering scoring after batch {batch_num}...")
            try:
                score_result = api_post("/api/scoring", {})
                log(f"  [Scoring] Done: {list(score_result.keys())[:4]}")
            except Exception as e:
                log(f"  [Scoring] ERROR: {e}")
        
        if i + BATCH_SIZE < total:
            log(f"  Waiting {WAIT_BETWEEN_BATCHES}s before next batch...")
            time.sleep(WAIT_BETWEEN_BATCHES)
    
    log(f"  {phase_label} complete: succeeded≈{succeeded_total}, failed≈{failed_total}")
    return succeeded_total, failed_total

def final_scoring():
    log("\n=== FINAL: Triggering scoring ===")
    try:
        result = api_post("/api/scoring", {})
        log(f"  Scoring result: {json.dumps(result)[:200]}")
    except Exception as e:
        log(f"  ERROR: {e}")

def final_stats():
    log("\n=== FINAL STATS ===")
    try:
        data = api_get("/api/leads?limit=1")
        total = data.get("total", "?")
        log(f"  Total leads: {total}")
    except Exception as e:
        log(f"  ERROR fetching stats: {e}")
    
    # Sample check
    try:
        data = api_get("/api/leads?limit=100&offset=0")
        leads = data.get("leads", [])
        unenriched = [l for l in leads if not l.get("last_enriched_at")]
        enriched = [l for l in leads if l.get("last_enriched_at")]
        avg = sum(l.get("enrichment_completeness", 0) for l in enriched) / max(len(enriched), 1)
        log(f"  Sample (first 100): {len(unenriched)} unenriched, avg completeness={avg:.1f}%")
    except Exception as e:
        log(f"  ERROR: {e}")

def main():
    log("\n" + "="*60)
    log("ENRICHMENT BATCH RUNNER STARTED")
    log("="*60)
    
    # Phase 1: Collect all leads
    unenriched_ids, low_completeness_ids = fetch_all_leads()
    
    # Phase 2: Enrich unenriched leads
    if unenriched_ids:
        run_batches(unenriched_ids, force=False, phase_label="PHASE 2: Enrich Unenriched")
        log("\nWaiting 60s after unenriched phase before re-enrichment...")
        time.sleep(60)
    else:
        log("No unenriched leads found — skipping Phase 2")
    
    # Phase 3: Re-enrich low-completeness leads
    if low_completeness_ids:
        run_batches(low_completeness_ids, force=True, phase_label="PHASE 3: Re-enrich Low Completeness")
    else:
        log("No low-completeness leads to re-enrich")
    
    # Final scoring
    final_scoring()
    final_stats()
    
    log("\n" + "="*60)
    log("ENRICHMENT BATCH RUNNER COMPLETE")
    log("="*60)

if __name__ == "__main__":
    main()
