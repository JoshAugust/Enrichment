#!/usr/bin/env python3
"""Wave 2 Enrichment Runner - fetches unenriched leads and submits batches."""

import json
import time
import sys
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_FILE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/ENRICHMENT_BATCH_LOG_V2.md"
BATCH_SIZE = 20
PAGE_SIZE = 100

def log(msg):
    print(msg, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")

def api_get(path):
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"X-API-Key": API_KEY})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())

def api_post(path, data):
    url = f"{BASE_URL}{path}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        url, data=body,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())

def get_all_leads_paged():
    """Fetch all leads across pages."""
    leads = []
    offset = 0
    total = None
    while total is None or offset < total:
        data = api_get(f"/api/leads?limit={PAGE_SIZE}&offset={offset}")
        total = data.get("total", 0)
        page = data.get("leads", [])
        leads.extend(page)
        offset += PAGE_SIZE
        if offset % 500 == 0:
            print(f"  ... fetched {offset}/{total}", flush=True)
        time.sleep(0.5)
    return leads

def phase1_enrich_unenriched():
    log(f"\n## Phase 1 (Resumed) — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("Fetching all leads...", flush=True)
    all_leads = get_all_leads_paged()
    
    unenriched = [l["id"] for l in all_leads if l.get("last_enriched_at") is None]
    print(f"Total leads: {len(all_leads)}, Unenriched: {len(unenriched)}", flush=True)
    log(f"### Phase 1: {len(unenriched)} unenriched leads to process\n")
    
    total_succeeded = 0
    total_failed = 0
    batch_num = 0
    
    for i in range(0, len(unenriched), BATCH_SIZE):
        batch = unenriched[i:i+BATCH_SIZE]
        batch_num += 1
        
        try:
            resp = api_post("/api/enrichment/batch", {"leadIds": batch, "force": False})
            succeeded = resp.get("succeeded", 0)
            failed = resp.get("failed", 0)
            total_succeeded += succeeded
            total_failed += failed
            msg = f"- Batch {batch_num} (i={i}): {len(batch)} leads — succeeded={succeeded} failed={failed}"
            log(msg)
            print(f"  {msg}", flush=True)
        except Exception as e:
            msg = f"- Batch {batch_num} (i={i}): ERROR — {e}"
            log(msg)
            print(f"  {msg}", flush=True)
        
        time.sleep(3)
    
    log(f"\n### Phase 1 Complete: {batch_num} batches, {total_succeeded} succeeded, {total_failed} failed")
    return total_succeeded

def phase2_force_reenrich():
    log(f"\n## Phase 2 — Force re-enrich (<30% completeness) — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("Fetching all leads for Phase 2...", flush=True)
    all_leads = get_all_leads_paged()
    
    low = [l["id"] for l in all_leads 
           if l.get("enrichment_completeness") is not None 
           and 0 < l["enrichment_completeness"] < 30]
    print(f"Low-completeness leads (<30%): {len(low)}", flush=True)
    log(f"### Phase 2: {len(low)} low-completeness leads\n")
    
    total_succeeded = 0
    batch_num = 0
    
    for i in range(0, len(low), BATCH_SIZE):
        batch = low[i:i+BATCH_SIZE]
        batch_num += 1
        
        try:
            resp = api_post("/api/enrichment/batch", {"leadIds": batch, "force": True})
            succeeded = resp.get("succeeded", 0)
            failed = resp.get("failed", 0)
            total_succeeded += succeeded
            msg = f"- Force-batch {batch_num} (i={i}): {len(batch)} leads — succeeded={succeeded} failed={failed}"
            log(msg)
            print(f"  {msg}", flush=True)
        except Exception as e:
            msg = f"- Force-batch {batch_num} (i={i}): ERROR — {e}"
            log(msg)
            print(f"  {msg}", flush=True)
        
        time.sleep(3)
    
    log(f"\n### Phase 2 Complete: {batch_num} batches, {total_succeeded} succeeded")
    return total_succeeded

def phase3_scoring():
    log(f"\n## Phase 3 — Final Scoring — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        resp = api_post("/api/scoring", {})
        log(f"- Scoring response: {resp}")
        print(f"Scoring: {resp}", flush=True)
    except Exception as e:
        log(f"- Scoring ERROR: {e}")
        print(f"Scoring error: {e}", flush=True)
    
    time.sleep(5)
    stats = api_get("/api/leads/stats")
    avg = stats["enrichment"]["avgCompleteness"]
    enriched = stats["enrichment"]["enrichedCount"]
    unenriched = stats["enrichment"]["unenrichedCount"]
    
    log(f"\n## Final Stats")
    log(f"| Metric | Before Wave 2 | After Wave 2 |")
    log(f"|--------|--------------|--------------|")
    log(f"| Avg completeness | 26% | {avg}% |")
    log(f"| Enriched count | 936 | {enriched} |")
    log(f"| Unenriched count | 838 | {unenriched} |")
    log(f"\n**Wave 2 complete. {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}**")
    
    print(f"\nFINAL: avg={avg}% enriched={enriched} unenriched={unenriched}", flush=True)
    return avg, enriched, unenriched

if __name__ == "__main__":
    phase = sys.argv[1] if len(sys.argv) > 1 else "all"
    
    if phase in ("all", "phase1"):
        p1_count = phase1_enrich_unenriched()
        print(f"Phase 1 complete: {p1_count} leads enriched", flush=True)
        
        if phase == "all":
            print("Waiting 30s before Phase 2...", flush=True)
            time.sleep(30)
    
    if phase in ("all", "phase2"):
        p2_count = phase2_force_reenrich()
        print(f"Phase 2 complete: {p2_count} leads re-enriched", flush=True)
    
    if phase in ("all", "scoring"):
        avg, enriched, unenriched = phase3_scoring()
