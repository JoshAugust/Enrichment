#!/usr/bin/env python3
"""
Apollo Company Search - Round 2
Uses niche verticals + deeper pagination to find 200+ more companies.
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
LOG_FILE = f"{SESSION}/apollo_search_log_r2.md"

APOLLO_URL = "https://api.apollo.io/api/v1/mixed_companies/search"

with open(CONFIG_PATH) as f:
    API_KEY = json.load(f)["api_key"]

# --------------------------------------------------
# Load dedup sets (includes all prior run results)
# --------------------------------------------------
print("Loading dedup sets...", flush=True)
with open(HUBSPOT_FILE) as f:
    hubspot_domains = set(d.lower().strip() for d in json.load(f))

with open(MASTER_FILE) as f:
    master_domains = set(d.lower().strip() for d in json.load(f))

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

existing_domains = hubspot_domains | master_domains | queue_domains
print(f"  Total dedup set: {len(existing_domains):,} (including prior run)", flush=True)

# --------------------------------------------------
# Round 2: niche verticals + deeper pages on high-yield
# --------------------------------------------------
# Strategy: niche verticals have less coverage in our DB → higher yield
KEYWORDS_R2 = [
    # Niche verticals not tried yet
    "insurtech",
    "agritech",
    "cleantech",
    "regtech",
    "adtech",
    "govtech",
    "foodtech",
    "traveltech",
    "sportstech",
    "retailtech",
    "biotech",
    "medtech",
    "wealthtech",
    "insurancetech",
    "real estate tech",
    # Round 2 of high yielders with deeper pages
    "low-code",
    "B2B SaaS",
    "developer tools",
    "open source",
    "API integration",
    "data pipeline",
    "customer success",
    "revenue intelligence",
    "sales intelligence",
    "recruitment tech",
    "construction tech",
    "manufacturing software",
    "logistics software",
    "supply chain software",
    "IoT platform",
]

EMPLOYEE_RANGES = ["1,10", "11,20", "21,50"]

# For high-yield niche terms, go to page 20
def max_pages_for(kw):
    high_yield = {"insurtech","agritech","cleantech","regtech","adtech","govtech","foodtech",
                  "traveltech","sportstech","retailtech","biotech","medtech","wealthtech",
                  "low-code","B2B SaaS","developer tools","no-code"}
    return 20 if kw in high_yield else 15

EXTRA_TARGET = 250  # we need 200+ more; aim for 250

# --------------------------------------------------
# State
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
        f.write(f"# Apollo Search Log R2\n")
        f.write(f"Started: {start_time.isoformat()}\n")
        f.write(f"Last updated: {now_iso()}\n\n")
        f.write(f"## Stats\n")
        f.write(f"- Requests: {total_requests}\n")
        f.write(f"- Results fetched: {total_results_fetched}\n")
        f.write(f"- New companies this run: {len(new_companies)}\n")
        f.write(f"- Total dedup set: {len(existing_domains):,}\n\n")
        f.write(f"## New Companies\n")
        for c in new_companies[:300]:
            f.write(f"- {c['domain']} | {c['company_name']} | {c.get('employees','?')} | {c.get('state','')}\n")

def apollo_search(keyword, page):
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
            "--data", f"@{tf_path}",
            "--max-time", "30",
            "-w", "\nHTTP_STATUS:%{http_code}",
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
        raw = result.stdout

        if not raw:
            return None

        parts = raw.rsplit("\nHTTP_STATUS:", 1)
        body_text = parts[0]
        http_code = int(parts[1].strip()) if len(parts) > 1 else 0

        if http_code == 429:
            log(f"  429 — backing off 60s")
            time.sleep(60)
            return None

        if http_code != 200:
            log(f"  HTTP {http_code}: {body_text[:150]}")
            return None

        return json.loads(body_text)

    except Exception as e:
        log(f"  Error: {e}")
        return None
    finally:
        try:
            os.unlink(tf_path)
        except:
            pass

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
        employees = acc.get("num_employees") or acc.get("estimated_num_employees")
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
# Main loop
# --------------------------------------------------
log(f"Round 2: {len(KEYWORDS_R2)} keywords, target +{EXTRA_TARGET} more")

for keyword in KEYWORDS_R2:
    if len(new_companies) >= EXTRA_TARGET:
        log(f"R2 target reached ({len(new_companies)}) — stopping")
        break

    log(f"\n=== '{keyword}' ===")
    kw_new = 0
    mp = max_pages_for(keyword)

    for page in range(1, mp + 1):
        if len(new_companies) >= EXTRA_TARGET:
            break

        result = apollo_search(keyword, page)
        if result is None:
            break

        accounts = result.get("accounts", [])
        if not accounts:
            log(f"  No accounts page {page}")
            break

        found = process_accounts(accounts)
        kw_new += found

        pagination = result.get("pagination", {})
        total_pages = pagination.get("total_pages", 1)
        total_entries = pagination.get("total_entries", 0)
        log(f"  p{page} +{found} | kw:{kw_new} | run:{len(new_companies)} | API:{total_entries:,}")

        if page >= total_pages:
            break

        time.sleep(0.25)

    log(f"  '{keyword}' done: {kw_new} new")
    write_log()
    time.sleep(0.3)

# --------------------------------------------------
# Final
# --------------------------------------------------
write_log()

total_queue = sum(1 for _ in open(QUEUE_FILE)) if os.path.exists(QUEUE_FILE) else 0

log(f"\n{'='*50}")
log(f"R2 DONE — {len(new_companies)} new this run")
log(f"Queue total (all runs): {total_queue}")
log(f"Requests: {total_requests} | Results fetched: {total_results_fetched}")
