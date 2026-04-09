#!/usr/bin/env python3
"""
Dedup helper for session 1 sourcing.
Usage: echo '{"domain":...}' | python3 dedup_helper.py
Or: python3 dedup_helper.py --check domain.com
"""
import json, sys, sqlite3, os
from datetime import datetime, timezone

WS = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai"
HUBSPOT_FILE = f"{WS}/overnight/shared/hubspot_domains_current.json"
DB_FILE = f"{WS}/pipeline/master.db"
QUEUE_FILE = f"{WS}/overnight/shared/new_companies_queue.jsonl"

# Load HubSpot domains into a set
with open(HUBSPOT_FILE) as f:
    hubspot_domains = set(json.load(f))

# Load DB domains
conn = sqlite3.connect(DB_FILE)
db_domains = set(row[0].lower().strip() for row in conn.execute("SELECT domain FROM companies WHERE domain IS NOT NULL"))
conn.close()

# Combined existing set
existing = hubspot_domains | db_domains

def is_new(domain):
    d = normalize(domain)
    return d not in existing and d not in hubspot_domains

def normalize(domain):
    d = domain.lower().strip().rstrip("/")
    if d.startswith("www."):
        d = d[4:]
    return d

def append_company(rec):
    domain = normalize(rec.get("domain", ""))
    if not domain or not is_new(domain):
        return False
    # Mark as seen to avoid duplicates within session
    existing.add(domain)
    rec["domain"] = domain
    if not rec.get("timestamp"):
        rec["timestamp"] = datetime.now(timezone.utc).isoformat()
    with open(QUEUE_FILE, "a") as f:
        f.write(json.dumps(rec) + "\n")
    return True

def count_queue():
    try:
        with open(QUEUE_FILE) as f:
            return sum(1 for _ in f)
    except:
        return 0

if __name__ == "__main__":
    if "--check" in sys.argv:
        d = sys.argv[sys.argv.index("--check") + 1]
        print("NEW" if is_new(d) else "EXISTS")
    else:
        # Read JSON lines from stdin
        added = 0
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                if append_company(rec):
                    added += 1
            except Exception as e:
                print(f"Error: {e}: {line[:80]}", file=sys.stderr)
        print(f"Added {added} new companies. Queue total: {count_queue()}")
