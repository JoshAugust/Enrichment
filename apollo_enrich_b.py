#!/usr/bin/env python3
"""
Apollo Enrichment Agent — Grade B batch
Enriches Grade B companies missing employee data via Apollo FREE org enrichment API.
"""

import sqlite3
import requests
import json
import time
import os
import sys
from datetime import datetime

# ── Config ──────────────────────────────────────────────────────────────────
API_KEY = "0P_stg_vxXj5xNdrCrRXbA"
API_URL = "https://api.apollo.io/api/v1/organizations/enrich"
DB_PATH = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/pipeline/master.db"
LOG_PATH = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/apollo_enrichment_b_log.jsonl"
PROGRESS_PATH = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/apollo_enrichment_b_progress.json"

EXCLUDED_SUFFIXES = [
    ".vercel.app", ".framer.app", ".streamlit.app",
    ".netlify.app", ".herokuapp.com", ".webflow.io"
]

DELAY_BETWEEN = 0.4       # 400ms between calls
PAUSE_EVERY = 100         # pause every N calls
PAUSE_DURATION = 10       # 10s pause
RETRY_429_WAIT = 60       # 60s backoff on 429
TELEGRAM_EVERY = 500      # progress update every N companies

# Telegram config
TELEGRAM_TOKEN = None
TELEGRAM_CHAT_ID = None

def load_telegram_config():
    """Try to load telegram token from eragon config."""
    config_path = "/Users/corgi12/.eragon-joshua_augustine/eragon.json"
    try:
        with open(config_path) as f:
            cfg = json.load(f)
        # Look for telegram bot token
        token = cfg.get("telegram", {}).get("bot_token") or cfg.get("telegram_bot_token")
        chat_id = cfg.get("telegram", {}).get("chat_id") or cfg.get("telegram_chat_id")
        return token, chat_id
    except Exception:
        return None, None

def send_telegram(msg):
    """Send a Telegram message if configured."""
    global TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": msg, "parse_mode": "Markdown"},
            timeout=10
        )
    except Exception as e:
        print(f"[telegram] Failed to send: {e}")

def log_entry(entry: dict):
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")

def save_progress(data: dict):
    with open(PROGRESS_PATH, "w") as f:
        json.dump(data, f, indent=2)

def load_progress() -> dict:
    if os.path.exists(PROGRESS_PATH):
        try:
            with open(PROGRESS_PATH) as f:
                return json.load(f)
        except Exception:
            pass
    return {"processed": 0, "enriched": 0, "no_data": 0, "errors": 0, "last_domain": None, "started_at": datetime.utcnow().isoformat()}

def get_domains(conn) -> list:
    """Fetch all Grade B domains needing enrichment, excluding noise domains."""
    cur = conn.cursor()
    # Build exclusion clause
    excl = " AND ".join([f"domain NOT LIKE '%{s}'" for s in EXCLUDED_SUFFIXES])
    query = f"""
        SELECT domain FROM companies
        WHERE grade = 'B'
        AND (linkedin_employees IS NULL OR linkedin_employees = '' OR CAST(linkedin_employees AS TEXT) = '')
        AND {excl}
        AND domain IS NOT NULL AND domain != ''
        ORDER BY domain
    """
    cur.execute(query)
    return [row[0] for row in cur.fetchall()]

def apollo_enrich(domain: str) -> dict | None:
    """Call Apollo org enrichment API. Returns org dict or None."""
    headers = {"X-Api-Key": API_KEY, "Content-Type": "application/json"}
    params = {"domain": domain}
    
    for attempt in range(3):
        try:
            resp = requests.get(API_URL, headers=headers, params=params, timeout=15)
            if resp.status_code == 429:
                print(f"  [429] Rate limited. Backing off {RETRY_429_WAIT}s...")
                time.sleep(RETRY_429_WAIT)
                continue
            if resp.status_code == 200:
                data = resp.json()
                return data.get("organization") or data.get("Organization")
            if resp.status_code == 404:
                return None
            print(f"  [HTTP {resp.status_code}] {domain}: {resp.text[:200]}")
            return None
        except requests.exceptions.Timeout:
            print(f"  [timeout] {domain} attempt {attempt+1}")
            time.sleep(2)
        except Exception as e:
            print(f"  [error] {domain}: {e}")
            return None
    return None

def annual_revenue_to_th_usd(annual_revenue) -> float | None:
    """Convert Apollo annual_revenue (already in USD) to thousands USD."""
    if annual_revenue is None:
        return None
    try:
        val = float(annual_revenue)
        return round(val / 1000, 2)
    except Exception:
        return None

def update_company(conn, domain: str, org: dict, progress: dict):
    """Update the companies row with Apollo data."""
    cur = conn.cursor()
    
    # Extract fields
    employees = org.get("estimated_num_employees")
    annual_revenue = org.get("annual_revenue")
    founded_year = org.get("founded_year")
    industry = org.get("industry")
    city = org.get("city")
    state_val = org.get("state")
    country = org.get("country")
    short_desc = org.get("short_description") or org.get("description")
    phone = org.get("phone")
    linkedin_url = org.get("linkedin_url")
    apollo_name = org.get("name")
    
    # Revenue conversion
    revenue_th = annual_revenue_to_th_usd(annual_revenue)
    
    # Fetch current row
    cur.execute("SELECT description, company_phone, revenue_th_usd, enrichment_sources FROM companies WHERE domain = ?", (domain,))
    row = cur.fetchone()
    if not row:
        return
    
    cur_desc, cur_phone, cur_rev, cur_sources = row
    
    # Only set description if currently empty
    new_desc = cur_desc
    if not cur_desc and short_desc:
        new_desc = short_desc
    
    # Only set company_phone if currently empty
    new_phone = cur_phone
    if not cur_phone and phone:
        new_phone = phone
    
    # Only set revenue if currently NULL
    new_rev = cur_rev
    if cur_rev is None and revenue_th is not None:
        new_rev = revenue_th
    
    # Append ',apollo' to enrichment_sources
    sources = cur_sources or ""
    if "apollo" not in sources:
        sources = sources.rstrip(",") + ",apollo" if sources else "apollo"
    
    cur.execute("""
        UPDATE companies SET
            linkedin_employees = COALESCE(linkedin_employees, ?),
            apollo_industry = COALESCE(apollo_industry, ?),
            description = ?,
            apollo_phone = COALESCE(apollo_phone, ?),
            company_phone = ?,
            revenue_th_usd = ?,
            enrichment_sources = ?,
            apollo_name = COALESCE(apollo_name, ?),
            last_updated = ?
        WHERE domain = ?
    """, (
        employees, industry, new_desc,
        phone, new_phone, new_rev,
        sources, apollo_name,
        datetime.utcnow().isoformat(), domain
    ))
    conn.commit()

def main():
    global TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
    TELEGRAM_TOKEN, TELEGRAM_CHAT_ID = load_telegram_config()
    
    print(f"[{datetime.utcnow().isoformat()}] Apollo Enrichment Agent — Grade B starting")
    print(f"  DB: {DB_PATH}")
    print(f"  Log: {LOG_PATH}")
    
    progress = load_progress()
    if "started_at" not in progress:
        progress["started_at"] = datetime.utcnow().isoformat()
    
    conn = sqlite3.connect(DB_PATH)
    domains = get_domains(conn)
    total = len(domains)
    
    print(f"  Found {total} Grade B domains needing enrichment")
    
    # Resume from last position if progress exists
    last_domain = progress.get("last_domain")
    start_idx = 0
    if last_domain and last_domain in domains:
        idx = domains.index(last_domain)
        start_idx = idx + 1
        print(f"  Resuming from index {start_idx} (after {last_domain})")
    
    call_count = 0
    enriched_this_run = 0
    
    for i, domain in enumerate(domains[start_idx:], start=start_idx):
        print(f"  [{i+1}/{total}] {domain}", end=" ... ", flush=True)
        
        org = apollo_enrich(domain)
        call_count += 1
        
        log_rec = {
            "ts": datetime.utcnow().isoformat(),
            "domain": domain,
            "index": i,
            "has_data": org is not None
        }
        
        if org:
            update_company(conn, domain, org, progress)
            progress["enriched"] = progress.get("enriched", 0) + 1
            enriched_this_run += 1
            employees = org.get("estimated_num_employees")
            industry = org.get("industry")
            print(f"✓ ({employees} emp, {industry})")
            log_rec["employees"] = employees
            log_rec["industry"] = industry
        else:
            progress["no_data"] = progress.get("no_data", 0) + 1
            print("✗ no data")
        
        progress["processed"] = progress.get("processed", 0) + 1
        progress["last_domain"] = domain
        log_entry(log_rec)
        
        # Save progress periodically
        if call_count % 50 == 0:
            save_progress(progress)
        
        # Telegram updates every 500
        processed_total = progress["processed"]
        if processed_total % TELEGRAM_EVERY == 0:
            elapsed_s = (datetime.utcnow() - datetime.fromisoformat(progress["started_at"])).total_seconds()
            rate = processed_total / elapsed_s * 60 if elapsed_s > 0 else 0
            eta_min = (total - (i+1)) / (rate if rate > 0 else 1)
            msg = (
                f"🚀 *Apollo Enrichment — Grade B*\n"
                f"Processed: {processed_total:,} / {total:,}\n"
                f"Enriched: {progress['enriched']:,} | No data: {progress['no_data']:,}\n"
                f"Rate: {rate:.0f}/min | ETA: {eta_min:.0f}min\n"
                f"Last: `{domain}`"
            )
            send_telegram(msg)
            print(f"\n[PROGRESS] {msg}\n")
        
        # Rate limiting
        if call_count % PAUSE_EVERY == 0:
            print(f"  [pause] {PAUSE_DURATION}s after {call_count} calls...")
            save_progress(progress)
            time.sleep(PAUSE_DURATION)
        else:
            time.sleep(DELAY_BETWEEN)
    
    conn.close()
    
    # Final save
    progress["completed_at"] = datetime.utcnow().isoformat()
    save_progress(progress)
    
    summary = (
        f"✅ *Apollo Enrichment — Grade B COMPLETE*\n"
        f"Total processed: {progress['processed']:,}\n"
        f"Enriched: {progress['enriched']:,}\n"
        f"No data: {progress['no_data']:,}\n"
        f"Errors: {progress.get('errors', 0):,}"
    )
    send_telegram(summary)
    print(f"\n{summary}")

if __name__ == "__main__":
    main()
