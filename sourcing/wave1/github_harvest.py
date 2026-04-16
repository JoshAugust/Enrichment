#!/usr/bin/env python3
"""GitHub domain harvester using authenticated gh CLI."""

import json
import subprocess
import time
import re
import os
from pathlib import Path

WORKSPACE = Path("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace")
DEDUP_FILE = WORKSPACE / "jordan.ai/sourcing/shared/existing_domains.txt"
OUT_FILE = WORKSPACE / "jordan.ai/sourcing/wave1/github_domains.jsonl"
PROGRESS = WORKSPACE / "jordan.ai/sourcing/logs/github_progress.md"
SEEN_ORGS_FILE = WORKSPACE / "jordan.ai/sourcing/wave1/.seen_orgs.txt"
SEEN_DOMAINS_FILE = WORKSPACE / "jordan.ai/sourcing/wave1/.seen_domains.txt"

# Load dedup set
print("Loading dedup set...")
existing_domains = set()
with open(DEDUP_FILE) as f:
    for line in f:
        existing_domains.add(line.strip().lower())
print(f"  Loaded {len(existing_domains)} existing domains")

# Load already-harvested results
seen_orgs = set()
seen_domains = set()
total_new = 0

if OUT_FILE.exists():
    with open(OUT_FILE) as f:
        for line in f:
            try:
                d = json.loads(line)
                seen_domains.add(d["domain"])
                seen_orgs.add(d["metadata"]["github_org"])
                total_new += 1
            except:
                pass
    print(f"  Resuming: {total_new} domains already harvested, {len(seen_orgs)} orgs seen")

total_skipped = 0
total_no_site = 0
api_calls = 0
last_call_time = 0

def ghapi(endpoint):
    """Call GitHub API via gh CLI (authenticated)."""
    global api_calls, last_call_time
    # Rate limit: ~2s between calls (safe for 5000/hr)
    elapsed = time.time() - last_call_time
    if elapsed < 1.5:
        time.sleep(1.5 - elapsed)
    
    api_calls += 1
    last_call_time = time.time()
    
    try:
        result = subprocess.run(
            ["gh", "api", endpoint],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            if "rate limit" in result.stderr.lower() or "403" in result.stderr:
                print("  ⚠ Rate limited, sleeping 60s...")
                log_progress("RATE LIMITED")
                time.sleep(60)
                return ghapi(endpoint)  # Retry
            return {}
        return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError):
        return {}

def clean_domain(url):
    """Extract clean domain from URL."""
    if not url:
        return ""
    url = re.sub(r'^https?://', '', url)
    url = re.sub(r'^www\.', '', url)
    url = url.split('/')[0].split(':')[0].lower().strip()
    return url

def is_valid_domain(domain):
    """Check if domain is usable."""
    if not domain or '.' not in domain:
        return False
    if domain.endswith('.github.io') or domain.endswith('.github.com'):
        return False
    if domain in ('t.me', 'discord.gg', 'discord.com', 'twitter.com', 'x.com',
                   'medium.com', 'dev.to', 'linkedin.com', 'youtube.com',
                   'facebook.com', 'instagram.com', 'reddit.com', 'npmjs.com',
                   'pypi.org', 'crates.io', 'rubygems.org', 'hackage.haskell.org'):
        return False
    return True

def log_progress(label):
    with open(PROGRESS, "a") as f:
        f.write(f"## {label}\n")
        f.write(f"- New domains: {total_new} | Skipped: {total_skipped} | No site: {total_no_site} | API calls: {api_calls}\n")
        f.write(f"- Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n\n")

def write_domain(domain, name, org_login, stars, lang, repos):
    """Write a single domain to JSONL."""
    global total_new
    # Sanitize name for JSON
    record = {
        "domain": domain,
        "name": name,
        "source": "github",
        "category": "developer-tools",
        "metadata": {
            "stars": stars,
            "language": lang,
            "repos": repos,
            "github_org": org_login
        }
    }
    with open(OUT_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")
    seen_domains.add(domain)
    total_new += 1
    print(f"  ✓ {domain} ({name}) - {stars}★  [total: {total_new}]")

def process_org(org_login, stars, lang):
    """Fetch org profile and extract domain."""
    global total_skipped, total_no_site
    
    if org_login in seen_orgs:
        return
    seen_orgs.add(org_login)
    
    data = ghapi(f"/orgs/{org_login}")
    if not data:
        total_no_site += 1
        return
    
    blog = (data.get("blog") or "").strip()
    name = (data.get("name") or data.get("login") or org_login).strip()
    repos = data.get("public_repos", 0)
    
    domain = clean_domain(blog)
    if not is_valid_domain(domain):
        total_no_site += 1
        return
    
    if domain in seen_domains:
        return
    
    if domain in existing_domains:
        total_skipped += 1
        seen_domains.add(domain)
        return
    
    write_domain(domain, name, org_login, stars, lang, repos)

def search_repos(lang, star_range, date_cutoff, max_pages=3):
    """Search repos and extract org domains."""
    q = f"stars:{star_range}+language:{lang}+pushed:>{date_cutoff}"
    
    for page in range(1, max_pages + 1):
        endpoint = f"/search/repositories?q={q}&sort=stars&per_page=100&page={page}"
        data = ghapi(endpoint)
        
        items = data.get("items", [])
        total = data.get("total_count", 0)
        
        if page == 1:
            print(f"  {total} repos found")
        
        if not items:
            break
        
        # Extract unique orgs from this page
        page_orgs = {}
        for item in items:
            owner = item.get("owner", {})
            login = owner.get("login", "")
            otype = owner.get("type", "")
            stars = item.get("stargazers_count", 0)
            if otype == "Organization" and login and login not in page_orgs:
                page_orgs[login] = stars
        
        for org_login, stars in page_orgs.items():
            process_org(org_login, stars, lang)
        
        # Stop if we've exhausted results
        if total <= page * 100:
            break

def search_orgs_direct(query, max_pages=5):
    """Search org profiles directly."""
    for page in range(1, max_pages + 1):
        endpoint = f"/search/users?q={query}&per_page=100&page={page}"
        data = ghapi(endpoint)
        
        items = data.get("items", [])
        if not items:
            break
        
        for item in items:
            login = item.get("login", "")
            if login:
                process_org(login, 0, "mixed")

# === MAIN ===

# Init progress
with open(PROGRESS, "w") as f:
    f.write("# GitHub Domain Harvest v2 (Authenticated)\n")
    f.write(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    f.write(f"Resuming from: {total_new} domains\n\n")

# Phase 1: Repository search across languages and star ranges
LANGUAGES = [
    "javascript", "typescript", "python", "go", "rust", "ruby",
    "java", "kotlin", "swift", "cpp", "csharp", "php",
    "scala", "elixir", "haskell", "dart", "zig", "lua", "r",
    "shell", "perl", "clojure", "erlang", "julia", "ocaml",
    "vue", "svelte", "terraform", "dockerfile"
]

STAR_RANGES = ["50..150", "150..300", "300..500", "500..1000", "1000..2000", "2000..5000"]
DATE_CUTOFFS = ["2025-01-01", "2024-01-01", "2023-01-01"]

print("\n=== Phase 1: Repository search ===")
for lang in LANGUAGES:
    for star_range in STAR_RANGES:
        for date_cutoff in DATE_CUTOFFS:
            label = f"{lang} | stars:{star_range} | pushed>{date_cutoff}"
            print(f"\n--- {label} ---")
            log_progress(label)
            search_repos(lang, star_range, date_cutoff, max_pages=3)
            print(f"  Running total: {total_new}")

# Phase 2: Direct org search
print("\n=== Phase 2: Direct org search ===")
ORG_QUERIES = [
    "type:org+repos:>10+followers:>50",
    "type:org+repos:>20+followers:>20",
    "type:org+repos:>5+followers:>100",
    "type:org+created:>2023-01-01+repos:>3+followers:>10",
    "type:org+created:>2024-01-01+repos:>2",
    "type:org+location:san+francisco+repos:>5",
    "type:org+location:new+york+repos:>5",
    "type:org+location:london+repos:>5",
    "type:org+location:berlin+repos:>5",
    "type:org+location:paris+repos:>5",
    "type:org+location:singapore+repos:>3",
    "type:org+location:tel+aviv+repos:>3",
    "type:org+location:tokyo+repos:>5",
    "type:org+location:bangalore+repos:>5",
    "type:org+location:toronto+repos:>5",
    "type:org+location:amsterdam+repos:>3",
    "type:org+location:sydney+repos:>3",
    "type:org+location:seattle+repos:>5",
    "type:org+location:austin+repos:>5",
    "type:org+location:denver+repos:>3",
    "type:org+location:boston+repos:>5",
    "type:org+location:chicago+repos:>5",
    "type:org+location:stockholm+repos:>3",
    "type:org+location:zurich+repos:>3",
    "type:org+location:shenzhen+repos:>3",
    "type:org+location:beijing+repos:>5",
    "type:org+location:seoul+repos:>3",
]

for query in ORG_QUERIES:
    print(f"\n--- Org: {query} ---")
    log_progress(f"Org: {query}")
    search_orgs_direct(query, max_pages=5)
    print(f"  Running total: {total_new}")

# Phase 3: Topic-based repo search
print("\n=== Phase 3: Topic-based search ===")
TOPICS = [
    "saas", "developer-tools", "devops", "api", "sdk", "cli",
    "monitoring", "observability", "analytics", "database",
    "authentication", "payments", "messaging", "infrastructure",
    "cloud-native", "kubernetes", "serverless", "microservices",
    "machine-learning", "data-pipeline", "etl", "workflow",
    "low-code", "no-code", "headless-cms", "jamstack",
    "fintech", "healthtech", "edtech", "proptech", "legaltech",
    "cybersecurity", "blockchain", "web3", "defi",
    "open-source", "self-hosted", "privacy"
]

for topic in TOPICS:
    for star_range in ["50..500", "500..5000"]:
        label = f"topic:{topic} | stars:{star_range}"
        print(f"\n--- {label} ---")
        log_progress(label)
        q = f"topic:{topic}+stars:{star_range}"
        for page in range(1, 4):
            endpoint = f"/search/repositories?q={q}&sort=stars&per_page=100&page={page}"
            data = ghapi(endpoint)
            items = data.get("items", [])
            if not items:
                break
            page_orgs = {}
            for item in items:
                owner = item.get("owner", {})
                login = owner.get("login", "")
                otype = owner.get("type", "")
                stars = item.get("stargazers_count", 0)
                if otype == "Organization" and login and login not in page_orgs:
                    page_orgs[login] = stars
            for org_login, stars in page_orgs.items():
                process_org(org_login, stars, topic)
        print(f"  Running total: {total_new}")

# Save seen files for potential resume
with open(SEEN_ORGS_FILE, "w") as f:
    f.write("\n".join(seen_orgs) + "\n")
with open(SEEN_DOMAINS_FILE, "w") as f:
    f.write("\n".join(seen_domains) + "\n")

# Final progress
log_progress("FINAL RESULTS")
print(f"""
=== COMPLETE ===
New unique domains: {total_new}
Skipped (already in DB): {total_skipped}
No website found: {total_no_site}
Total API calls: {api_calls}
Unique orgs checked: {len(seen_orgs)}
Output: {OUT_FILE}
""")
