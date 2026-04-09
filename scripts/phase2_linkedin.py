#!/usr/bin/env python3
"""Phase 2: LinkedIn employee count + software engineer detection via DuckDuckGo HTML scraping."""
import asyncio
import aiohttp
import csv
import json
import os
import re
import time
import random
from pathlib import Path
from urllib.parse import quote_plus

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
CSV_PATH = f"{WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv"
OUTPUT_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_linkedin.json"
CHECKPOINT_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_linkedin_checkpoint.json"
TOTAL = 4000
CONCURRENCY = 8
DELAY_BETWEEN = 3.0  # seconds between DDG requests
CHECKPOINT_EVERY = 200

# DDG HTML search
DDG_URL = "https://html.duckduckgo.com/html/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

def load_csv():
    records = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= TOTAL:
                break
            records.append(row)
    return records

def load_checkpoint():
    if os.path.exists(CHECKPOINT_PATH):
        with open(CHECKPOINT_PATH, "r") as f:
            return json.load(f)
    return {}

def save_checkpoint(results):
    with open(CHECKPOINT_PATH, "w") as f:
        json.dump(results, f, indent=2)

def save_results(results):
    with open(OUTPUT_PATH, "w") as f:
        json.dump(results, f, indent=2)

# Rate limiter
class RateLimiter:
    def __init__(self, delay):
        self.delay = delay
        self.lock = asyncio.Lock()
        self.last_request = 0
    
    async def wait(self):
        async with self.lock:
            now = time.time()
            wait_time = self.delay - (now - self.last_request)
            if wait_time > 0:
                await asyncio.sleep(wait_time + random.uniform(0.5, 1.5))
            self.last_request = time.time()

rate_limiter = RateLimiter(DELAY_BETWEEN)

async def ddg_search(session, query, retries=3):
    """Search DDG HTML endpoint and return raw HTML."""
    for attempt in range(retries):
        await rate_limiter.wait()
        try:
            data = {"q": query, "b": ""}
            async with session.post(DDG_URL, data=data, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status == 429 or resp.status == 202:
                    wait = (attempt + 1) * 10
                    print(f"  Rate limited ({resp.status}), waiting {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                if resp.status == 200:
                    return await resp.text()
                print(f"  DDG returned {resp.status}")
                return ""
        except Exception as e:
            if attempt < retries - 1:
                await asyncio.sleep(5)
            else:
                print(f"  DDG error: {str(e)[:100]}")
    return ""

def parse_employee_count(html):
    """Extract employee count from LinkedIn company snippet."""
    patterns = [
        r'([\d,]+)\s*(?:employees?\s+on\s+LinkedIn|employees)',
        r'Company size:\s*([\d,]+(?:\s*-\s*[\d,]+)?)',
        r'([\d,]+)\s*(?:associated members|followers)',
    ]
    for p in patterns:
        m = re.search(p, html, re.I)
        if m:
            num_str = m.group(1).replace(",", "").split("-")[0].strip()
            try:
                return int(num_str)
            except:
                pass
    return None

def parse_linkedin_url(html):
    """Extract LinkedIn company URL from results."""
    m = re.search(r'https?://(?:www\.)?linkedin\.com/company/[a-zA-Z0-9_-]+', html)
    return m.group(0) if m else None

def parse_engineer_names(html):
    """Extract names/titles from LinkedIn profile results."""
    names = []
    # Pattern: "Name - Title at Company" or "Name | Title"
    pattern = r'(?:class="result__a"[^>]*>|<a[^>]*>)\s*([A-Z][a-z]+ [A-Z][a-z]+)\s*[-–|]\s*((?:software|developer|engineer|full.?stack|frontend|backend)[^<]{0,60})'
    for m in re.finditer(pattern, html, re.I):
        names.append({"name": m.group(1).strip(), "title": m.group(2).strip()})
        if len(names) >= 5:
            break
    return names

def has_sw_engineer_signals(html):
    """Check if search results suggest software engineers work here."""
    keywords = ["software engineer", "developer", "full stack", "frontend engineer", 
                "backend engineer", "software development", "engineering team"]
    text = html.lower()
    return any(kw in text for kw in keywords)

async def process_company(session, company, results):
    domain = company["Domain"]
    if domain in results:
        return
    
    name = company["Company Name"]
    state = company.get("State", "")
    
    result = {
        "linkedin_employees": None,
        "has_software_engineer": False,
        "engineer_names": [],
        "linkedin_url": None,
        "industry": None,
    }
    
    # Search 1: Company LinkedIn profile
    query1 = f'"{name}" site:linkedin.com/company'
    html1 = await ddg_search(session, query1)
    if html1:
        result["linkedin_employees"] = parse_employee_count(html1)
        result["linkedin_url"] = parse_linkedin_url(html1)
    
    # Search 2: Software engineers at company
    query2 = f'"{name}" "software engineer" OR "developer" OR "full stack" OR "frontend" OR "backend" site:linkedin.com/in'
    html2 = await ddg_search(session, query2)
    if html2:
        result["has_software_engineer"] = has_sw_engineer_signals(html2)
        result["engineer_names"] = parse_engineer_names(html2)
    
    results[domain] = result

async def main():
    records = load_csv()
    results = load_checkpoint()
    print(f"Loaded {len(records)} companies, {len(results)} already done")
    
    connector = aiohttp.TCPConnector(limit=CONCURRENCY, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        sem = asyncio.Semaphore(CONCURRENCY)
        
        async def limited_process(company):
            async with sem:
                await process_company(session, company, results)
        
        # Process in batches of CHECKPOINT_EVERY
        for batch_start in range(0, len(records), CHECKPOINT_EVERY):
            batch = records[batch_start:batch_start + CHECKPOINT_EVERY]
            tasks = [limited_process(c) for c in batch if c["Domain"] not in results]
            
            if tasks:
                await asyncio.gather(*tasks)
            
            save_checkpoint(results)
            done = min(batch_start + CHECKPOINT_EVERY, len(records))
            emp_hits = sum(1 for r in results.values() if r.get("linkedin_employees"))
            sw_flags = sum(1 for r in results.values() if r.get("has_software_engineer"))
            print(f"[{done}/{TOTAL}] Employee hits: {emp_hits}, SW engineer flags: {sw_flags}")
    
    save_results(results)
    save_checkpoint(results)
    
    emp_hits = sum(1 for r in results.values() if r.get("linkedin_employees"))
    sw_flags = sum(1 for r in results.values() if r.get("has_software_engineer"))
    url_hits = sum(1 for r in results.values() if r.get("linkedin_url"))
    print(f"\n=== PHASE 2 COMPLETE ===")
    print(f"Total processed: {len(results)}")
    print(f"Employee count hits: {emp_hits}")
    print(f"Software engineer flags: {sw_flags}")
    print(f"LinkedIn URL hits: {url_hits}")

if __name__ == "__main__":
    asyncio.run(main())
