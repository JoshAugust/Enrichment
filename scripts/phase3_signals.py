#!/usr/bin/env python3
"""Phase 3: News, Hiring, Tech Stack, Social signals via DDG + website fetching."""
import asyncio
import aiohttp
import csv
import json
import os
import re
import time
import random
from pathlib import Path
from urllib.parse import quote_plus, urlparse

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
CSV_PATH = f"{WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv"
OUTPUT_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_signals.json"
CHECKPOINT_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_signals_checkpoint.json"
TOTAL = 4000
DDG_CONCURRENCY = 5
WEB_CONCURRENCY = 10
DDG_DELAY = 3.0
CHECKPOINT_EVERY = 200

DDG_URL = "https://html.duckduckgo.com/html/"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}

# Tech stack detection patterns
TECH_PATTERNS = {
    "React": [r'react[.\-/]', r'__NEXT_DATA__', r'_next/static'],
    "Next.js": [r'_next/', r'__NEXT_DATA__'],
    "Angular": [r'angular[.\-/]', r'ng-version'],
    "Vue.js": [r'vue[.\-/]', r'__VUE__', r'vue-app'],
    "Nuxt": [r'nuxt', r'__NUXT__'],
    "Gatsby": [r'gatsby', r'/static/.*chunk'],
    "WordPress": [r'wp-content', r'wp-includes', r'wordpress'],
    "Webflow": [r'webflow\.com', r'wf-page'],
    "Shopify": [r'shopify', r'cdn\.shopify\.com'],
    "Squarespace": [r'squarespace', r'static1\.squarespace'],
    "Wix": [r'wix\.com', r'wixstatic'],
    "Google Analytics": [r'google-analytics\.com', r'googletagmanager', r'gtag'],
    "Segment": [r'segment\.com/analytics', r'cdn\.segment\.com'],
    "HubSpot": [r'hubspot', r'hs-scripts\.com', r'hbspt'],
    "Intercom": [r'intercom', r'widget\.intercom\.io'],
    "Stripe": [r'stripe\.com', r'js\.stripe\.com'],
    "Tailwind": [r'tailwindcss', r'tailwind'],
    "Bootstrap": [r'bootstrap[.\-/]'],
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

def save_data(data, path):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

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
                await asyncio.sleep(wait_time + random.uniform(0.3, 1.0))
            self.last_request = time.time()

ddg_limiter = RateLimiter(DDG_DELAY)

async def ddg_search(session, query, retries=3):
    for attempt in range(retries):
        await ddg_limiter.wait()
        try:
            data = {"q": query, "b": ""}
            async with session.post(DDG_URL, data=data, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=15)) as resp:
                if resp.status in (429, 202):
                    wait = (attempt + 1) * 10
                    await asyncio.sleep(wait)
                    continue
                if resp.status == 200:
                    return await resp.text()
                return ""
        except:
            if attempt < retries - 1:
                await asyncio.sleep(5)
    return ""

async def fetch_page(session, url, timeout=10):
    """Fetch a web page, return HTML or empty string."""
    try:
        async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=timeout), 
                              allow_redirects=True, ssl=False) as resp:
            if resp.status == 200:
                content_type = resp.headers.get("Content-Type", "")
                if "text/html" in content_type or "text/plain" in content_type:
                    return await resp.text(errors="ignore")
            return ""
    except:
        return ""

def extract_news(html):
    """Extract news headlines from DDG results."""
    headlines = []
    # Look for result snippets mentioning funding/launch/etc.
    snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</[^>]+>', html, re.I | re.S)
    for s in snippets[:5]:
        clean = re.sub(r'<[^>]+>', '', s).strip()
        if clean and len(clean) > 20:
            headlines.append(clean[:200])
    return headlines

def detect_tech_stack(html):
    """Detect technologies from HTML source."""
    techs = []
    html_lower = html.lower()
    for tech, patterns in TECH_PATTERNS.items():
        for p in patterns:
            if re.search(p, html_lower):
                techs.append(tech)
                break
    
    # Check meta generator
    gen = re.search(r'<meta[^>]*name=["\']generator["\'][^>]*content=["\']([^"\']+)', html, re.I)
    if gen:
        techs.append(f"Generator:{gen.group(1).strip()[:50]}")
    
    return list(set(techs))

def count_job_listings(html):
    """Try to count job openings from a careers page."""
    if not html:
        return 0
    patterns = [
        r'<a[^>]*href=[^>]*(?:job|position|opening|career)[^>]*>',
        r'class="[^"]*job[^"]*"',
        r'data-job',
    ]
    count = 0
    for p in patterns:
        count += len(re.findall(p, html, re.I))
    return min(count, 200)  # cap

def extract_social(html, platform):
    """Extract social media URL from DDG results."""
    if platform == "twitter":
        m = re.search(r'https?://(?:www\.)?(?:twitter|x)\.com/[a-zA-Z0-9_]+', html)
    elif platform == "github":
        m = re.search(r'https?://github\.com/[a-zA-Z0-9_-]+', html)
    else:
        return None
    return m.group(0) if m else None

async def process_company(session, company, results, ddg_sem, web_sem):
    domain = company["Domain"]
    if domain in results:
        return
    
    name = company["Company Name"]
    website = company.get("Website", "")
    if website and not website.startswith("http"):
        website = f"https://{website}"
    
    result = {
        "news": [],
        "hiring": {"open_roles": 0, "careers_url": None},
        "tech_stack": [],
        "social": {"twitter": None, "github": None},
    }
    
    # 1. News search
    async with ddg_sem:
        news_html = await ddg_search(session, f'"{name}" funding OR launch OR partnership OR acquisition 2025 2026')
    if news_html:
        result["news"] = extract_news(news_html)
    
    # 2. Hiring signals
    if website:
        careers_urls = [f"{website}/careers", f"{website}/jobs", f"{website}/hiring"]
        for curl in careers_urls:
            async with web_sem:
                page = await fetch_page(session, curl)
            if page and len(page) > 500:
                roles = count_job_listings(page)
                if roles > 0:
                    result["hiring"]["open_roles"] = roles
                    result["hiring"]["careers_url"] = curl
                    break
    
    async with ddg_sem:
        hire_html = await ddg_search(session, f'"{name}" hiring OR "open positions" OR careers')
    if hire_html and result["hiring"]["open_roles"] == 0:
        # Check if there are hiring signals in results
        if re.search(r'hiring|open position|careers|join our team', hire_html, re.I):
            result["hiring"]["open_roles"] = 1  # signal exists but count unknown
    
    # 3. Tech stack from website
    if website:
        async with web_sem:
            homepage = await fetch_page(session, website)
        if homepage:
            result["tech_stack"] = detect_tech_stack(homepage)
    
    # 4. Social media
    async with ddg_sem:
        tw_html = await ddg_search(session, f'"{name}" site:twitter.com OR site:x.com')
    if tw_html:
        result["social"]["twitter"] = extract_social(tw_html, "twitter")
    
    async with ddg_sem:
        gh_html = await ddg_search(session, f'"{name}" site:github.com')
    if gh_html:
        result["social"]["github"] = extract_social(gh_html, "github")
    
    results[domain] = result

async def main():
    records = load_csv()
    results = load_checkpoint()
    print(f"Phase 3: {len(records)} companies, {len(results)} already done")
    
    connector = aiohttp.TCPConnector(limit=WEB_CONCURRENCY + DDG_CONCURRENCY, ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        ddg_sem = asyncio.Semaphore(DDG_CONCURRENCY)
        web_sem = asyncio.Semaphore(WEB_CONCURRENCY)
        
        for batch_start in range(0, len(records), CHECKPOINT_EVERY):
            batch = records[batch_start:batch_start + CHECKPOINT_EVERY]
            tasks = [process_company(session, c, results, ddg_sem, web_sem) 
                     for c in batch if c["Domain"] not in results]
            
            if tasks:
                await asyncio.gather(*tasks, return_exceptions=True)
            
            save_data(results, CHECKPOINT_PATH)
            done = min(batch_start + CHECKPOINT_EVERY, len(records))
            news = sum(1 for r in results.values() if r.get("news"))
            hiring = sum(1 for r in results.values() if r.get("hiring", {}).get("open_roles", 0) > 0)
            tech = sum(1 for r in results.values() if r.get("tech_stack"))
            social = sum(1 for r in results.values() if r.get("social", {}).get("twitter") or r.get("social", {}).get("github"))
            print(f"[{done}/{TOTAL}] News: {news} | Hiring: {hiring} | Tech: {tech} | Social: {social}")
    
    save_data(results, OUTPUT_PATH)
    save_data(results, CHECKPOINT_PATH)
    
    news = sum(1 for r in results.values() if r.get("news"))
    hiring = sum(1 for r in results.values() if r.get("hiring", {}).get("open_roles", 0) > 0)
    tech = sum(1 for r in results.values() if r.get("tech_stack"))
    social = sum(1 for r in results.values() if r.get("social", {}).get("twitter") or r.get("social", {}).get("github"))
    print(f"\n=== PHASE 3 COMPLETE ===")
    print(f"Total: {len(results)}")
    print(f"News hits: {news}")
    print(f"Hiring signals: {hiring}")
    print(f"Tech stack hits: {tech}")
    print(f"Social hits: {social}")

if __name__ == "__main__":
    asyncio.run(main())
