#!/usr/bin/env python3
"""GitHub domain harvester v3 - GraphQL batch org lookups for speed."""

import json
import subprocess
import time
import re
from pathlib import Path

WORKSPACE = Path("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace")
DEDUP_FILE = WORKSPACE / "jordan.ai/sourcing/shared/existing_domains.txt"
OUT_FILE = WORKSPACE / "jordan.ai/sourcing/wave1/github_domains.jsonl"
PROGRESS = WORKSPACE / "jordan.ai/sourcing/logs/github_progress.md"

# Load dedup set
print("Loading dedup set...", flush=True)
existing_domains = set()
with open(DEDUP_FILE) as f:
    for line in f:
        existing_domains.add(line.strip().lower())
print(f"  {len(existing_domains)} existing domains", flush=True)

# Load already-harvested
seen_orgs = set()
seen_domains = set()
total_new = 0
total_skipped = 0
total_no_site = 0
api_calls = 0

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
    print(f"  Resuming from {total_new} domains, {len(seen_orgs)} orgs", flush=True)

def ghapi_rest(endpoint):
    """REST API call."""
    global api_calls
    api_calls += 1
    time.sleep(1.2)
    try:
        r = subprocess.run(["gh", "api", endpoint], capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            if "rate limit" in r.stderr.lower() or "403" in r.stderr:
                print("  ⚠ Rate limited (REST), sleeping 60s...", flush=True)
                time.sleep(60)
                return ghapi_rest(endpoint)
            return {}
        return json.loads(r.stdout)
    except:
        return {}

def ghapi_graphql(query):
    """GraphQL API call."""
    global api_calls
    api_calls += 1
    time.sleep(0.5)
    try:
        r = subprocess.run(
            ["gh", "api", "graphql", "-f", f"query={query}"],
            capture_output=True, text=True, timeout=30
        )
        if r.returncode != 0:
            if "rate limit" in r.stderr.lower():
                print("  ⚠ Rate limited (GQL), sleeping 60s...", flush=True)
                time.sleep(60)
                return ghapi_graphql(query)
            return {}
        return json.loads(r.stdout)
    except:
        return {}

def clean_domain(url):
    if not url:
        return ""
    url = re.sub(r'^https?://', '', url)
    url = re.sub(r'^www\.', '', url)
    url = url.split('/')[0].split(':')[0].lower().strip()
    return url

SKIP_DOMAINS = {
    't.me', 'discord.gg', 'discord.com', 'twitter.com', 'x.com',
    'medium.com', 'dev.to', 'linkedin.com', 'youtube.com',
    'facebook.com', 'instagram.com', 'reddit.com', 'npmjs.com',
    'pypi.org', 'crates.io', 'rubygems.org', 'hackage.haskell.org',
    'docs.google.com', 'forms.gle', 'bit.ly', 'linktr.ee',
    'slack.com', 'gitter.im', 'spectrum.chat', 'meetup.com',
    'patreon.com', 'ko-fi.com', 'buymeacoffee.com', 'opencollective.com',
    'google.com', 'apple.com', 'microsoft.com', 'amazon.com',
}

def is_valid_domain(domain):
    if not domain or '.' not in domain:
        return False
    if domain.endswith('.github.io') or domain.endswith('.github.com'):
        return False
    if domain in SKIP_DOMAINS:
        return False
    # Skip very common large corp subdomains
    for skip in ['google.com', 'microsoft.com', 'amazon.com', 'apple.com']:
        if domain.endswith('.' + skip):
            return False
    return True

def log_progress(label):
    with open(PROGRESS, "a") as f:
        f.write(f"## {label}\n")
        f.write(f"- Domains: {total_new} | Skip: {total_skipped} | NoSite: {total_no_site} | API: {api_calls}\n")
        f.write(f"- Orgs checked: {len(seen_orgs)}\n")
        f.write(f"- {time.strftime('%H:%M:%S')}\n\n")

def batch_lookup_orgs(org_list):
    """Use GraphQL to fetch up to 20 org profiles in one request."""
    global total_new, total_skipped, total_no_site
    
    # Filter already seen
    to_fetch = [(login, stars, lang) for login, stars, lang in org_list if login not in seen_orgs]
    if not to_fetch:
        return
    
    # Mark all as seen
    for login, _, _ in to_fetch:
        seen_orgs.add(login)
    
    # Batch in groups of 20
    for i in range(0, len(to_fetch), 20):
        batch = to_fetch[i:i+20]
        
        # Build GraphQL query
        fragments = []
        for idx, (login, stars, lang) in enumerate(batch):
            safe = re.sub(r'[^a-zA-Z0-9]', '_', login)
            fragments.append(f'  org_{safe}_{idx}: organization(login: "{login}") {{ login name websiteUrl url repositories {{ totalCount }} }}')
        
        if not fragments:
            continue
            
        query = "{\n" + "\n".join(fragments) + "\n}"
        data = ghapi_graphql(query)
        
        if not data or "data" not in data:
            # Fall back to REST for this batch
            for login, stars, lang in batch:
                rest_data = ghapi_rest(f"/orgs/{login}")
                if not rest_data:
                    total_no_site += 1
                    continue
                blog = (rest_data.get("blog") or "").strip()
                name = (rest_data.get("name") or login).strip()
                repos = rest_data.get("public_repos", 0)
                domain = clean_domain(blog)
                _process_domain(domain, name, login, stars, lang, repos)
            continue
        
        # Process GraphQL results
        for idx, (login, stars, lang) in enumerate(batch):
            safe = re.sub(r'[^a-zA-Z0-9]', '_', login)
            key = f"org_{safe}_{idx}"
            org = data["data"].get(key)
            if not org:
                total_no_site += 1
                continue
            
            website = (org.get("websiteUrl") or "").strip()
            name = (org.get("name") or org.get("login") or login).strip()
            repos_data = org.get("repositories") or {}
            repos = repos_data.get("totalCount", 0) if isinstance(repos_data, dict) else 0
            
            domain = clean_domain(website)
            _process_domain(domain, name, login, stars, lang, repos)

def _process_domain(domain, name, login, stars, lang, repos):
    global total_new, total_skipped, total_no_site
    
    if not is_valid_domain(domain):
        total_no_site += 1
        return
    
    if domain in seen_domains:
        return
    
    if domain in existing_domains:
        total_skipped += 1
        seen_domains.add(domain)
        return
    
    record = {
        "domain": domain,
        "name": name,
        "source": "github",
        "category": "developer-tools",
        "metadata": {
            "stars": stars,
            "language": lang,
            "repos": repos,
            "github_org": login
        }
    }
    with open(OUT_FILE, "a") as f:
        f.write(json.dumps(record) + "\n")
    seen_domains.add(domain)
    total_new += 1
    print(f"  ✓ {domain} ({name}) - {stars}★  [{total_new}]", flush=True)

def search_repos(query_str, lang_label, max_pages=3):
    """Search repos, collect orgs, batch-lookup."""
    all_orgs = []
    
    for page in range(1, max_pages + 1):
        endpoint = f"/search/repositories?q={query_str}&sort=stars&per_page=100&page={page}"
        data = ghapi_rest(endpoint)
        
        items = data.get("items", [])
        total = data.get("total_count", 0)
        
        if page == 1:
            print(f"  {total} repos", flush=True)
        
        if not items:
            break
        
        for item in items:
            owner = item.get("owner", {})
            login = owner.get("login", "")
            otype = owner.get("type", "")
            stars = item.get("stargazers_count", 0)
            if otype == "Organization" and login:
                all_orgs.append((login, stars, lang_label))
        
        if total <= page * 100:
            break
    
    # Batch lookup all orgs from this search
    if all_orgs:
        batch_lookup_orgs(all_orgs)

# === MAIN ===

with open(PROGRESS, "w") as f:
    f.write(f"# GitHub Harvest v3 (GraphQL)\n")
    f.write(f"Started: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    f.write(f"Resuming from: {total_new} domains\n\n")

# Phase 1: Language + star range combos
LANGUAGES = [
    "javascript", "typescript", "python", "go", "rust", "ruby",
    "java", "kotlin", "swift", "cpp", "csharp", "php",
    "scala", "elixir", "haskell", "dart", "zig", "lua", "r",
    "shell", "perl", "clojure", "erlang", "julia", "ocaml",
    "vue", "svelte", "terraform", "dockerfile"
]

STAR_RANGES = ["50..150", "150..300", "300..600", "600..1200", "1200..2500", "2500..5000", "5000..20000"]

print("\n=== Phase 1: Repo search by language ===", flush=True)
for lang in LANGUAGES:
    for sr in STAR_RANGES:
        label = f"{lang} stars:{sr}"
        print(f"\n--- {label} ---", flush=True)
        log_progress(label)
        # Use 2 date ranges to get more unique results
        for date in ["2025-01-01", "2023-01-01"]:
            search_repos(f"stars:{sr}+language:{lang}+pushed:>{date}", lang, max_pages=3)
        print(f"  Total: {total_new}", flush=True)

# Phase 2: Topic searches
TOPICS = [
    "saas", "developer-tools", "devops", "api", "sdk", "cli",
    "monitoring", "observability", "analytics", "database",
    "authentication", "payments", "messaging", "infrastructure",
    "cloud-native", "kubernetes", "serverless", "microservices",
    "machine-learning", "data-pipeline", "etl", "workflow",
    "low-code", "no-code", "headless-cms", "fintech",
    "cybersecurity", "blockchain", "web3", "open-source",
    "self-hosted", "privacy", "testing", "deployment",
    "automation", "integration", "visualization", "search-engine",
    "real-time", "streaming", "iot", "edge-computing",
    "nlp", "computer-vision", "robotics", "simulation",
    "game-engine", "audio", "video", "image-processing",
    "geospatial", "mapping", "cms", "ecommerce", "crm",
    "erp", "hr", "project-management", "collaboration"
]

print("\n=== Phase 2: Topic search ===", flush=True)
for topic in TOPICS:
    for sr in ["50..500", "500..2000", "2000..10000"]:
        label = f"topic:{topic} stars:{sr}"
        print(f"\n--- {label} ---", flush=True)
        log_progress(label)
        search_repos(f"topic:{topic}+stars:{sr}", topic, max_pages=3)
        print(f"  Total: {total_new}", flush=True)

# Phase 3: Direct org search by location
print("\n=== Phase 3: Org by location ===", flush=True)
LOCATIONS = [
    "san francisco", "new york", "london", "berlin", "paris",
    "singapore", "tel aviv", "tokyo", "bangalore", "toronto",
    "amsterdam", "sydney", "seattle", "austin", "boston",
    "chicago", "stockholm", "zurich", "shenzhen", "beijing",
    "seoul", "dublin", "lisbon", "barcelona", "munich",
    "denver", "portland", "miami", "atlanta", "los angeles",
    "vancouver", "montreal", "copenhagen", "oslo", "helsinki",
    "warsaw", "prague", "vienna", "milan", "cape town",
    "nairobi", "sao paulo", "buenos aires", "mexico city",
    "jakarta", "kuala lumpur", "bangkok", "ho chi minh",
    "taipei", "hong kong", "hangzhou", "chengdu"
]

for loc in LOCATIONS:
    label = f"orgs in {loc}"
    print(f"\n--- {label} ---", flush=True)
    log_progress(label)
    
    all_orgs = []
    loc_encoded = loc.replace(" ", "+")
    for page in range(1, 6):
        data = ghapi_rest(f"/search/users?q=type:org+location:{loc_encoded}+repos:>3&per_page=100&page={page}")
        items = data.get("items", [])
        if not items:
            break
        for item in items:
            all_orgs.append((item["login"], 0, "mixed"))
        if data.get("total_count", 0) <= page * 100:
            break
    
    if all_orgs:
        print(f"  {len(all_orgs)} orgs found", flush=True)
        batch_lookup_orgs(all_orgs)
    print(f"  Total: {total_new}", flush=True)

# Phase 4: keyword-based org search
print("\n=== Phase 4: Keyword org search ===", flush=True)
ORG_KEYWORDS = [
    "labs", "io", "tech", "dev", "hq", "app", "cloud",
    "data", "ai", "ml", "platform", "systems", "software",
    "digital", "studio", "works", "solutions", "tools",
    "engineering", "analytics", "security", "infra",
    "open", "code", "api", "sdk", "framework"
]

for kw in ORG_KEYWORDS:
    label = f"org keyword: {kw}"
    print(f"\n--- {label} ---", flush=True)
    log_progress(label)
    
    all_orgs = []
    for page in range(1, 4):
        data = ghapi_rest(f"/search/users?q=type:org+{kw}+repos:>5&per_page=100&page={page}")
        items = data.get("items", [])
        if not items:
            break
        for item in items:
            all_orgs.append((item["login"], 0, "mixed"))
        if data.get("total_count", 0) <= page * 100:
            break
    
    if all_orgs:
        print(f"  {len(all_orgs)} orgs", flush=True)
        batch_lookup_orgs(all_orgs)
    print(f"  Total: {total_new}", flush=True)

# Final
log_progress("FINAL")
print(f"""
=== COMPLETE ===
New domains: {total_new}
Skipped: {total_skipped}
No website: {total_no_site}
API calls: {api_calls}
Orgs checked: {len(seen_orgs)}
""", flush=True)
