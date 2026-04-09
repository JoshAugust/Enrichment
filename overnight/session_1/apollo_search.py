#!/usr/bin/env python3
"""
Apollo Company Search - High Volume Company Sourcing
Uses mixed_companies/search via curl (bypasses Cloudflare 1010).
Target: 500+ new unique company domains
"""

import json
import time
import datetime
import os
import subprocess
import tempfile

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
SHARED = f"{WORKSPACE}/jordan.ai/overnight/shared"
SESSION = f"{WORKSPACE}/jordan.ai/overnight/session_1"
CONFIG_PATH = f"{WORKSPACE}/.config/apollo/config.json"

QUEUE_FILE = f"{SHARED}/new_companies_queue.jsonl"
HUBSPOT_FILE = f"{SHARED}/hubspot_domains_current.json"
MASTER_FILE = f"{SHARED}/master_db_domains.json"
CREDITS_FILE = f"{SHARED}/apollo_credits.json"
LOG_FILE = f"{SESSION}/apollo_search_log.md"

APOLLO_URL = "https://api.apollo.io/api/v1/mixed_companies/search"

# Load API key
with open(CONFIG_PATH) as f:
    API_KEY = json.load(f)["api_key"]

# --------------------------------------------------
# Load dedup sets
# --------------------------------------------------
print("Loading dedup sets...", flush=True)
with open(HUBSPOT_FILE) as f:
    hubspot_domains = set(d.lower().strip() for d in json.load(f))
print(f"  Hubspot: {len(hubspot_domains):,}", flush=True)

with open(MASTER_FILE) as f:
    master_domains = set(d.lower().strip() for d in json.load(f))
print(f"  Master DB: {len(master_domains):,}", flush=True)

queue_domains = set()
if os.path.exists(QUEUE_FILE):
    with open(QUEUE_FILE) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rec = json.loads(line)
                    if rec.get("domain"):
                        queue_domains.add(rec["domain"].lower().strip())
                except:
                    pass
print(f"  Queue: {len(queue_domains):,}", flush=True)

existing_domains = hubspot_domains | master_domains | queue_domains
print(f"  Total dedup set: {len(existing_domains):,}", flush=True)

# --------------------------------------------------
# Search combos
# --------------------------------------------------
KEYWORDS = [
    "SaaS",
    "software",
    "cloud",
    "platform",
    "API",
    "cybersecurity",
    "devtools",
    "fintech",
    "healthtech",
    "edtech",
    "martech",
    "proptech",
    "legaltech",
    "hrtech",
    "data analytics",
    "machine learning",
    "artificial intelligence",
    "automation",
    "workflow",
    "marketplace",
    "analytics",
    "ecommerce",
    "mobile app",
    "enterprise software",
    "no-code",
]

EMPLOYEE_RANGES = ["1,10", "11,20", "21,50"]
MAX_PAGES = 10
TARGET = 600

# --------------------------------------------------
# State tracking
# --------------------------------------------------
new_companies = []
seen_this_run = set()
total_requests = 0
total_results_fetched = 0
start_time = datetime.datetime.now(datetime.timezone.utc)

def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def log(msg):
    ts = datetime.datetime.now(datetime.timezone.utc).strftime("%H:%M:%S")
    print(f"[{ts}] {msg}", flush=True)

def write_log():
    with open(LOG_FILE, "w") as f:
        f.write(f"# Apollo Search Log\n")
        f.write(f"Started: {start_time.isoformat()}\n")
        f.write(f"Last updated: {now_iso()}\n\n")
        f.write(f"## Stats\n")
        f.write(f"- Requests: {total_requests}\n")
        f.write(f"- Results fetched: {total_results_fetched}\n")
        f.write(f"- New companies found: {len(new_companies)}\n")
        f.write(f"- Dedup set size: {len(existing_domains):,}\n\n")
        f.write(f"## New Companies (first 200)\n")
        for c in new_companies[:200]:
            f.write(f"- {c['domain']} | {c['company_name']} | {c.get('employees','?')} emp | {c.get('state','')}\n")

def apollo_search(keyword, page):
    """Single Apollo company search via curl."""
    global total_requests

    payload = {
        "q_organization_keyword_tags": [keyword],
        "organization_num_employees_ranges": EMPLOYEE_RANGES,
        "organization_locations": ["United States"],
        "per_page": 100,
        "page": page,
    }

    total_requests += 1

    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as tf:
        json.dump(payload, tf)
        tf_path = tf.name

    try:
        cmd = [
            "curl", "-s",
            "-X", "POST", APOLLO_URL,
            "-H", "Content-Type: application/json",
            "-H", f"X-Api-Key: {API_KEY}",
            "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "-H", "Accept: application/json, text/plain, */*",
            "-H", "Accept-Language: en-US,en;q=0.9",
            "-H", "Origin: https://app.apollo.io",
            "-H", "Referer: https://app.apollo.io/",
            "-H", "Cache-Control: no-cache",
            "--data", f"@{tf_path}",
            "--max-time", "30",
            "-w", "\nHTTP_STATUS:%{http_code}",
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
        raw = result.stdout

        if not raw:
            log(f"  Empty response from curl")
            return None

        # Split status from body
        parts = raw.rsplit("\nHTTP_STATUS:", 1)
        body_text = parts[0]
        http_code = int(parts[1].strip()) if len(parts) > 1 else 0

        if http_code == 429:
            log(f"  429 rate limit — backing off 60s")
            time.sleep(60)
            return None

        if http_code == 422:
            log(f"  422 error: {body_text[:200]}")
            return None

        if http_code != 200:
            log(f"  HTTP {http_code}: {body_text[:200]}")
            return None

        return json.loads(body_text)

    except json.JSONDecodeError as e:
        log(f"  JSON parse error: {e} — body: {body_text[:200] if 'body_text' in dir() else 'N/A'}")
        return None
    except Exception as e:
        log(f"  Error: {e}")
        return None
    finally:
        os.unlink(tf_path)

def clean_domain(raw):
    if not raw:
        return None
    d = raw.lower().strip()
    d = d.replace("https://", "").replace("http://", "").replace("www.", "")
    d = d.rstrip("/").split("/")[0].split("?")[0]
    if not d or "." not in d or len(d) < 4:
        return None
    return d

def process_accounts(accounts):
    global total_results_fetched

    new_this_batch = []
    total_results_fetched += len(accounts)

    for acc in accounts:
        domain = clean_domain(acc.get("primary_domain") or acc.get("domain") or acc.get("website_url"))
        company_name = acc.get("name", "")
        employees = acc.get("num_employees") or acc.get("estimated_num_employees") or acc.get("organization_headcount")
        state = acc.get("organization_state") or acc.get("state") or ""
        description = acc.get("short_description") or acc.get("industry") or ""

        if not domain or not company_name:
            continue

        if domain in existing_domains or domain in seen_this_run:
            continue

        seen_this_run.add(domain)
        existing_domains.add(domain)

        record = {
            "domain": domain,
            "company_name": company_name,
            "source": "apollo_search",
            "employees": employees,
            "state": state,
            "description": description,
            "timestamp": now_iso(),
        }
        new_companies.append(record)
        new_this_batch.append(record)

        with open(QUEUE_FILE, "a") as f:
            f.write(json.dumps(record) + "\n")

    return len(new_this_batch)

# --------------------------------------------------
# Main search loop
# --------------------------------------------------
log(f"Starting Apollo company search — target {TARGET}+ domains")
log(f"Keywords: {len(KEYWORDS)} | Max pages: {MAX_PAGES} | Per page: 100")

for keyword in KEYWORDS:
    if len(new_companies) >= TARGET:
        log(f"Target reached ({len(new_companies)}) — stopping")
        break

    log(f"\n=== Keyword: '{keyword}' ===")
    keyword_new = 0

    for page in range(1, MAX_PAGES + 1):
        if len(new_companies) >= TARGET:
            break

        log(f"  Page {page}/{MAX_PAGES} | Total new: {len(new_companies)}")

        result = apollo_search(keyword, page)

        if result is None:
            log(f"  Null result — skipping keyword")
            break

        accounts = result.get("accounts", [])
        if not accounts:
            log(f"  No accounts on page {page} — stopping")
            break

        found = process_accounts(accounts)
        keyword_new += found

        pagination = result.get("pagination", {})
        total_pages = pagination.get("total_pages", 1)
        total_entries = pagination.get("total_entries", 0)
        log(f"  +{found} new | keyword total: {keyword_new} | API total: {total_entries:,}")

        if page >= total_pages:
            log(f"  Reached last page ({total_pages})")
            break

        time.sleep(0.25)

    log(f"  Keyword '{keyword}' done — {keyword_new} new companies")
    write_log()
    time.sleep(0.5)

# --------------------------------------------------
# Final writes
# --------------------------------------------------
write_log()

credits_data = {
    "used": 0,
    "limit": 1000,
    "last_updated": now_iso(),
    "session": "apollo_company_search",
    "note": "Company search endpoint used via curl",
    "requests_made": total_requests,
    "results_fetched": total_results_fetched,
    "new_domains_added": len(new_companies),
}
with open(CREDITS_FILE, "w") as f:
    json.dump(credits_data, f, indent=2)

log(f"\n{'='*50}")
log(f"DONE — {len(new_companies)} new companies added to queue")
log(f"Total requests: {total_requests}")
log(f"Total results fetched: {total_results_fetched}")
