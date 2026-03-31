#!/usr/bin/env python3
"""
Bulk enrichment runner - optimized for slow enrichment endpoints.
batch_size=5, timeout=600s, MAX_TOTAL=600
"""
import json
import urllib.request
import urllib.error
import time
import sys

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
BATCH_SIZE = 5     # smaller batches = less likely to timeout
TIMEOUT = 600      # 10 min timeout per request  
PAGE_LIMIT = 50
MAX_TOTAL = 600    # process up to 600 per run

def get_unenriched_leads(limit=50):
    url = f"{BASE_URL}/api/leads?enriched=false&limit={limit}"
    req = urllib.request.Request(url, headers={"X-API-Key": API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  [ERROR] fetch leads: {e}", flush=True)
        return None

def enrich_batch(lead_ids):
    url = f"{BASE_URL}/api/enrichment/batch"
    payload = json.dumps({"leadIds": lead_ids}).encode()
    req = urllib.request.Request(
        url, data=payload,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  [HTTP ERROR] {e.code}: {body[:200]}", flush=True)
        return None
    except Exception as e:
        print(f"  [ERROR] enrich batch: {e}", flush=True)
        return None

def main():
    total_submitted = 0
    total_succeeded = 0
    total_failed = 0
    page = 0
    
    print(f"=== Enrichment Runner v4 ===", flush=True)
    print(f"batch_size={BATCH_SIZE}, timeout={TIMEOUT}s, max={MAX_TOTAL}", flush=True)
    
    while total_submitted < MAX_TOTAL:
        data = get_unenriched_leads(limit=PAGE_LIMIT)
        if not data:
            print("Failed to fetch leads, stopping.", flush=True)
            break
        
        leads = data.get("leads", [])
        total_unenriched = data.get("total", 0)
        
        print(f"\n--- Page {page+1}: {len(leads)} leads | {total_unenriched} unenriched remaining ---", flush=True)
        
        if not leads:
            print("No more unenriched leads. DONE!", flush=True)
            break
        
        ids = [l["id"] for l in leads]
        batches = [ids[i:i+BATCH_SIZE] for i in range(0, len(ids), BATCH_SIZE)]
        
        for i, batch in enumerate(batches):
            t0 = time.time()
            print(f"  [{total_submitted+1}-{total_submitted+len(batch)}] Batch {i+1}/{len(batches)} ({len(batch)} leads)...", end=" ", flush=True)
            result = enrich_batch(batch)
            elapsed = time.time() - t0
            
            if result:
                succeeded = result.get("succeeded", 0)
                failed = result.get("failed", 0)
                print(f"✓ {elapsed:.0f}s — {succeeded} ok, {failed} fail", flush=True)
                total_succeeded += succeeded
                total_failed += failed
            else:
                print(f"✗ FAILED after {elapsed:.0f}s", flush=True)
            
            total_submitted += len(batch)
            
            if total_submitted >= MAX_TOTAL:
                print(f"\nReached MAX_TOTAL ({MAX_TOTAL}). Stopping.", flush=True)
                break
            
            time.sleep(0.5)
        
        page += 1
        print(f"  >>> Running totals: submitted={total_submitted}, ok={total_succeeded}, fail={total_failed}", flush=True)
        
        if len(leads) < PAGE_LIMIT:
            print(f"Partial page. Nearing end...", flush=True)
            if len(leads) < 3:
                print("Nearly exhausted. All done!", flush=True)
                break
        
        time.sleep(1)
    
    print(f"\n=== COMPLETE ===", flush=True)
    print(f"submitted={total_submitted} | ok={total_succeeded} | failed={total_failed}", flush=True)

if __name__ == "__main__":
    main()
