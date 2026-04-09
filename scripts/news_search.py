#!/usr/bin/env python3
"""Search DuckDuckGo for company news/insights. Free, no API key, unlimited.
Checkpoints every 50 companies. Resumes from checkpoint."""

import json, re, os, time, sys
from urllib.request import urlopen, Request
from urllib.parse import quote_plus
from html.parser import HTMLParser

WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace'
INPUT = f'{WORKSPACE}/jordan.ai/pipeline/top_leads_3200.csv'
CHECKPOINT = f'{WORKSPACE}/jordan.ai/pipeline/news_search_checkpoint.json'
OUTPUT = f'{WORKSPACE}/jordan.ai/pipeline/news_search_results.json'
DELAY = 2.0  # be polite to DDG
TIMEOUT = 10

class DDGParser(HTMLParser):
    """Extract result snippets from DuckDuckGo HTML."""
    def __init__(self):
        super().__init__()
        self.results = []
        self.current = None
        self.in_result = False
        self.in_snippet = False
        self.depth = 0
    
    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        cls = attrs_dict.get('class', '')
        if 'result__snippet' in cls:
            self.in_snippet = True
            self.current = ''
        if 'result__a' in cls:
            self.in_result = True
            self.current = ''
    
    def handle_data(self, data):
        if self.in_snippet or self.in_result:
            self.current += data
    
    def handle_endtag(self, tag):
        if self.in_snippet:
            self.in_snippet = False
            if self.current:
                self.results.append(self.current.strip())
            self.current = None
        if self.in_result:
            self.in_result = False
            self.current = None

def search_ddg(query):
    """Search DuckDuckGo HTML and extract snippets."""
    url = f'https://html.duckduckgo.com/html/?q={quote_plus(query)}'
    req = Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })
    try:
        with urlopen(req, timeout=TIMEOUT) as r:
            html = r.read(100000).decode('utf-8', errors='ignore')
        
        parser = DDGParser()
        parser.feed(html)
        return parser.results[:5]  # top 5 snippets
    except Exception as e:
        return []

def search_company_news(company_name, domain):
    """Search for recent news about a company."""
    # Try multiple queries for best coverage
    queries = [
        f'"{company_name}" news 2025 2026',
        f'site:{domain} OR "{company_name}" funding OR partnership OR launch OR acquisition',
    ]
    
    all_snippets = []
    for q in queries:
        snippets = search_ddg(q)
        all_snippets.extend(snippets)
        time.sleep(DELAY)
    
    # Deduplicate and clean
    seen = set()
    unique = []
    for s in all_snippets:
        clean = s.strip()
        if clean and clean not in seen and len(clean) > 20:
            seen.add(clean)
            unique.append(clean)
    
    # Extract key signals
    signals = {}
    combined = ' '.join(unique).lower()
    
    # Funding detection
    funding_match = re.search(r'\$[\d.]+\s*[mkb](?:illion)?(?:\s*(?:series\s*[a-f]|seed|funding|round|raise))?', combined)
    if funding_match:
        signals['funding'] = funding_match.group(0)
    
    # Partnership/customer wins
    if any(w in combined for w in ['partner', 'collaboration', 'integrat', 'teams up']):
        signals['partnership'] = True
    
    # Product launches
    if any(w in combined for w in ['launch', 'release', 'announce', 'unveil', 'introduce']):
        signals['product_launch'] = True
    
    # Acquisition
    if any(w in combined for w in ['acquir', 'bought by', 'merged with', 'acquisition']):
        signals['acquisition'] = True
    
    # Awards/recognition
    if any(w in combined for w in ['award', 'recognized', 'named', 'top ', 'best ', 'winner']):
        signals['recognition'] = True
    
    return {
        'snippets': unique[:3],  # top 3 unique snippets
        'signals': signals,
        'query_count': len(queries)
    }

# Load checkpoint
checkpoint = {'processed': 0, 'results': {}}
if os.path.exists(CHECKPOINT):
    with open(CHECKPOINT) as f:
        checkpoint = json.load(f)
    print(f"Resuming: {checkpoint['processed']} processed, {len(checkpoint['results'])} results")

# Load companies
import csv
rows = list(csv.DictReader(open(INPUT)))
print(f"Companies to search: {len(rows)}")

# Main loop
start_idx = checkpoint['processed']
remaining = rows[start_idx:]
print(f"Starting from {start_idx}, {len(remaining)} to go")

for i, row in enumerate(remaining):
    domain = (row.get('Domain', '') or '').strip().lower()
    name = (row.get('Company Name', '') or '').strip()
    
    if not name or domain in checkpoint['results']:
        checkpoint['processed'] = start_idx + i + 1
        continue
    
    result = search_company_news(name, domain)
    checkpoint['results'][domain] = result
    checkpoint['processed'] = start_idx + i + 1
    
    idx = start_idx + i + 1
    if idx % 50 == 0:
        with open(CHECKPOINT, 'w') as f:
            json.dump(checkpoint, f)
        
        r = checkpoint['results']
        has_snippets = sum(1 for v in r.values() if v.get('snippets'))
        has_funding = sum(1 for v in r.values() if v.get('signals', {}).get('funding'))
        has_launch = sum(1 for v in r.values() if v.get('signals', {}).get('product_launch'))
        has_partner = sum(1 for v in r.values() if v.get('signals', {}).get('partnership'))
        has_acq = sum(1 for v in r.values() if v.get('signals', {}).get('acquisition'))
        print(f"{idx}/{len(rows)} | news:{has_snippets} funding:{has_funding} launches:{has_launch} partners:{has_partner} acquisitions:{has_acq}")
        sys.stdout.flush()

# Final save
with open(CHECKPOINT, 'w') as f:
    json.dump(checkpoint, f)
with open(OUTPUT, 'w') as f:
    json.dump(checkpoint['results'], f, indent=2)

r = checkpoint['results']
print(f"\n=== DONE ===")
print(f"Searched: {len(r)}")
print(f"Has news snippets: {sum(1 for v in r.values() if v.get('snippets'))}")
print(f"Funding detected: {sum(1 for v in r.values() if v.get('signals', {}).get('funding'))}")
print(f"Product launches: {sum(1 for v in r.values() if v.get('signals', {}).get('product_launch'))}")
print(f"Partnerships: {sum(1 for v in r.values() if v.get('signals', {}).get('partnership'))}")
print(f"Acquisitions: {sum(1 for v in r.values() if v.get('signals', {}).get('acquisition'))}")
print(f"Recognition: {sum(1 for v in r.values() if v.get('signals', {}).get('recognition'))}")
