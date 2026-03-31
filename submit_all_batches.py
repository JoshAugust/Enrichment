#!/usr/bin/env python3
"""
Submit all batches quickly with short timeout.
The server processes enrichment even after client-side timeout.
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

# Short timeout — we know the server processes even after client timeout
CLIENT_TIMEOUT = 45

force = "--force" in sys.argv
ids_file = f"{WS}/unenriched_ids.txt"
label = "Phase1-FireAndForget"
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
    try:
        with urllib.request.urlopen(req, timeout=CLIENT_TIMEOUT) as r:
            return json.loads(r.read()), "success"
    except Exception as e:
        return None, str(e)

with open(ids_file) as f:
    ids = [line.strip() for line in f if line.strip()]

total = len(ids)
log(f"\n## {label} — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
log(f"### Submitting {total} IDs in batches of {BATCH_SIZE} (force={force}, timeout={CLIENT_TIMEOUT}s)\n")
print(f"Submitting {total} leads in {(total+BATCH_SIZE-1)//BATCH_SIZE} batches...", flush=True)

batch_num = 0
submitted = 0
successes = 0
timeouts = 0

for i in range(0, total, BATCH_SIZE):
    batch = ids[i:i+BATCH_SIZE]
    batch_num += 1
    pct = round(i / total * 100)
    
    result, status = submit_batch(batch, force=force)
    submitted += len(batch)
    
    if result:
        successes += result.get("succeeded", 0)
        msg = f"- Batch {batch_num} ({pct}%, i={i}): {len(batch)} → succeeded={result.get('succeeded',0)}"
    elif "timed out" in status.lower() or "timeout" in status.lower():
        timeouts += 1
        msg = f"- Batch {batch_num} ({pct}%, i={i}): {len(batch)} → TIMEOUT (server still processing)"
    else:
        msg = f"- Batch {batch_num} ({pct}%, i={i}): {len(batch)} → {status}"
    
    log(msg)
    time.sleep(2)  # small gap between submissions

log(f"\n### {label} Complete: {batch_num} batches submitted, {successes} confirmed, {timeouts} timeouts (server processing)")
print(f"\nDone: {batch_num} batches submitted. {successes} confirmed, {timeouts} timed out (server still processes them)", flush=True)
