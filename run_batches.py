#!/usr/bin/env python3
"""
Wave 2 Enrichment Batch Runner
Reads IDs from file, submits batches to the enrichment API.
Usage: python3 run_batches.py [--force] [--ids-file <path>] [--label <name>]
"""

import json
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
WS = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment"
LOG_FILE = f"{WS}/ENRICHMENT_BATCH_LOG_V2.md"
BATCH_SIZE = 20
TIMEOUT = 600  # 10 min per batch

# Parse args
force = "--force" in sys.argv
ids_file = f"{WS}/unenriched_ids.txt"
label = "Phase1"
for i, arg in enumerate(sys.argv):
    if arg == "--ids-file" and i+1 < len(sys.argv):
        ids_file = sys.argv[i+1]
    if arg == "--label" and i+1 < len(sys.argv):
        label = sys.argv[i+1]

def log(msg):
    print(msg, flush=True)
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")

def submit_batch(ids, force=False):
    body = json.dumps({"leadIds": ids, "force": force}).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/enrichment/batch",
        data=body,
        headers={"X-API-Key": API_KEY, "Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())

# Read IDs
with open(ids_file) as f:
    ids = [line.strip() for line in f if line.strip()]

total = len(ids)
log(f"\n## {label} — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log(f"### Processing {total} IDs (force={force})\n")
print(f"Starting {label}: {total} leads, batch_size={BATCH_SIZE}, force={force}", flush=True)

total_succeeded = 0
total_failed = 0
batch_num = 0
errors = 0

for i in range(0, total, BATCH_SIZE):
    batch = ids[i:i+BATCH_SIZE]
    batch_num += 1
    pct = round(i / total * 100)
    
    try:
        resp = submit_batch(batch, force=force)
        succeeded = resp.get("succeeded", 0)
        failed = resp.get("failed", 0)
        total_succeeded += succeeded
        total_failed += failed
        
        msg = f"- Batch {batch_num} ({pct}%, i={i}): {len(batch)} leads → succeeded={succeeded} failed={failed}"
        log(msg)
        
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200]
        msg = f"- Batch {batch_num} ({pct}%, i={i}): HTTP {e.code} — {body}"
        log(msg)
        errors += 1
        
    except Exception as e:
        msg = f"- Batch {batch_num} ({pct}%, i={i}): ERROR — {type(e).__name__}: {e}"
        log(msg)
        errors += 1
    
    time.sleep(3)

log(f"\n### {label} Complete: {batch_num} batches, {total_succeeded} succeeded, {total_failed} failed, {errors} errors")
print(f"\n{label} DONE: {total_succeeded} succeeded, {total_failed} failed, {errors} errors", flush=True)
