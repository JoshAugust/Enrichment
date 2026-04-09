#!/usr/bin/env python3
"""Overnight website scraper — extracts hiring, GitHub, tech stack, funding signals from homepages.
Uses only free HTTP requests. Checkpoints every 500 companies."""

import sqlite3, json, re, os, time, sys
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from concurrent.futures import ThreadPoolExecutor, as_completed

WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace'
DB_PATH = f'{WORKSPACE}/jordan.ai/pipeline/master.db'
CHECKPOINT = f'{WORKSPACE}/jordan.ai/pipeline/overnight_scrape_checkpoint.json'
OUTPUT = f'{WORKSPACE}/jordan.ai/pipeline/overnight_scrape_results.json'
TIMEOUT = 5
DELAY = 0.2

# Load checkpoint
checkpoint = {'processed': 0, 'results': {}}
if os.path.exists(CHECKPOINT):
    with open(CHECKPOINT) as f:
        checkpoint = json.load(f)
    print(f"Resuming: {checkpoint['processed']} processed, {len(checkpoint['results'])} results")

# Get domains to scrape
db = sqlite3.connect(DB_PATH)
db.row_factory = sqlite3.Row
rows = db.execute("""
    SELECT domain, company_name, vibe_score, blueprint_score, grade
    FROM companies 
    WHERE domain IS NOT NULL AND domain != ''
    AND (dq_reason IS NULL OR dq_reason = '')
    AND vibe_score IS NOT NULL AND vibe_score > 0
    AND blueprint_score IS NOT NULL AND blueprint_score >= 50
    ORDER BY blueprint_score DESC
""").fetchall()
db.close()

print(f"Qualified companies to scrape: {len(rows)}")

def fetch_page(domain):
    url = f'https://{domain}'
    req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)'})
    try:
        with urlopen(req, timeout=TIMEOUT) as r:
            return r.read(50000).decode('utf-8', errors='ignore')
    except:
        try:
            url2 = f'http://{domain}'
            req2 = Request(url2, headers={'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)'})
            with urlopen(req2, timeout=TIMEOUT) as r:
                return r.read(50000).decode('utf-8', errors='ignore')
        except:
            return None

def extract_signals(html, domain):
    if not html:
        return {'scraped': True, 'has_content': False}
    
    lower = html.lower()
    signals = {'scraped': True, 'has_content': True}
    
    # Emails — extract personal emails from page (skip generic)
    generic_prefixes = {'info','sales','support','contact','hello','admin','help','office','team',
                        'marketing','billing','press','media','legal','hr','jobs','careers','noreply',
                        'no-reply','webmaster','postmaster','abuse','privacy','security','compliance'}
    email_pattern = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html)
    personal_emails = []
    seen = set()
    for e in email_pattern:
        e_lower = e.lower()
        prefix = e_lower.split('@')[0]
        e_domain = e_lower.split('@')[1] if '@' in e_lower else ''
        # Skip generic prefixes, image files, CSS, example domains
        if prefix in generic_prefixes:
            continue
        if any(e_lower.endswith(x) for x in ['.png','.jpg','.gif','.svg','.css','.js']):
            continue
        if 'example.com' in e_lower or 'sentry.io' in e_lower or 'email.com' in e_lower:
            continue
        if e_lower not in seen:
            seen.add(e_lower)
            personal_emails.append(e)
    if personal_emails:
        signals['emails'] = personal_emails[:5]  # cap at 5
    
    # Also try /contact and /about pages for more emails
    # (done in a second pass below)
    
    # Hiring
    job_kw = ["careers", "we're hiring", "join our team", "open positions", 
              "job openings", "work with us", "apply now", "view openings"]
    hits = [k for k in job_kw if k in lower]
    if hits:
        signals['hiring'] = True
        signals['hiring_count'] = len(hits)
    
    # GitHub
    gh = re.search(r'github\.com/([a-zA-Z0-9_-]+)', html)
    if gh and gh.group(1).lower() not in ('topics','features','pricing','about','login','signup','join','search'):
        signals['github'] = f'https://github.com/{gh.group(1)}'
    
    # Twitter/X
    tw = re.search(r'(?:twitter\.com|x\.com)/([a-zA-Z0-9_]+)', html)
    if tw and tw.group(1).lower() not in ('share','intent','home','login','signup','i'):
        signals['twitter'] = tw.group(1)
    
    # Tech stack
    tech = []
    checks = [
        ('React', ['react', 'next.js', 'nextjs', '__next']),
        ('Vue', ['vue', 'nuxt']),
        ('Angular', ['angular']),
        ('Stripe', ['stripe']),
        ('Intercom', ['intercom']),
        ('HubSpot', ['hubspot']),
        ('Segment', ['segment.com', 'analytics.js']),
        ('Mixpanel', ['mixpanel']),
        ('Amplitude', ['amplitude']),
        ('Sentry', ['sentry']),
        ('Datadog', ['datadog']),
        ('AWS', ['amazonaws.com']),
        ('GCP', ['googleapis.com', 'google cloud']),
        ('Cloudflare', ['cloudflare']),
        ('AI/ML', ['tensorflow', 'pytorch', 'openai', 'machine learning', 'artificial intelligence']),
        ('Vercel', ['vercel']),
        ('Netlify', ['netlify']),
    ]
    for name, keywords in checks:
        if any(k in lower for k in keywords):
            tech.append(name)
    if tech:
        signals['tech_stack'] = tech
    
    # Team size hint
    team = re.search(r'(\d+)\+?\s*(?:team members|employees|people|engineers|staff)', lower)
    if team:
        signals['team_size_hint'] = int(team.group(1))
    
    # Funding
    if re.search(r'(?:raised|funding|series\s*[a-f]|seed\s*round|\$[\d.]+[mkb]\s*(?:funding|round))', lower):
        signals['has_funding'] = True
    
    # Product signals
    if '/pricing' in lower or '"pricing"' in lower:
        signals['has_pricing'] = True
    if '/blog' in lower or 'blog.' in lower:
        signals['has_blog'] = True
    if '/docs' in lower or '/documentation' in lower or 'developer' in lower:
        signals['has_docs'] = True
    if '/api' in lower or 'api reference' in lower:
        signals['has_api'] = True
    
    return signals

# Main loop
start_idx = checkpoint['processed']
remaining = rows[start_idx:]
print(f"Starting from {start_idx}, {len(remaining)} to go")

for i, row in enumerate(remaining):
    domain = row['domain']
    
    if domain in checkpoint['results']:
        checkpoint['processed'] = start_idx + i + 1
        continue
    
    html = fetch_page(domain)
    signals = extract_signals(html, domain)
    
    # Second pass: if no emails found on homepage, try /contact and /about
    if not signals.get('emails'):
        for subpage in ['/contact', '/contact-us']:
            sub_html = fetch_page(f"{domain}{subpage}")
            if sub_html:
                sub_signals = extract_signals(sub_html, domain)
                if sub_signals.get('emails'):
                    signals['emails'] = sub_signals['emails']
                    signals['email_source'] = subpage
                    break
            time.sleep(0.2)
    
    checkpoint['results'][domain] = signals
    checkpoint['processed'] = start_idx + i + 1
    
    idx = start_idx + i + 1
    if idx % 100 == 0:
        with open(CHECKPOINT, 'w') as f:
            json.dump(checkpoint, f)
        
        r = checkpoint['results']
        total = len(r)
        hiring = sum(1 for v in r.values() if v.get('hiring'))
        github = sum(1 for v in r.values() if v.get('github'))
        funding = sum(1 for v in r.values() if v.get('has_funding'))
        tech = sum(1 for v in r.values() if v.get('tech_stack'))
        pricing = sum(1 for v in r.values() if v.get('has_pricing'))
        content = sum(1 for v in r.values() if v.get('has_content'))
        emails = sum(1 for v in r.values() if v.get('emails'))
        print(f"{idx}/{len(rows)} | content:{content} emails:{emails} hiring:{hiring} github:{github} funding:{funding} tech:{tech} pricing:{pricing}")
        sys.stdout.flush()
    
    time.sleep(DELAY)

# Final save
with open(CHECKPOINT, 'w') as f:
    json.dump(checkpoint, f)
with open(OUTPUT, 'w') as f:
    json.dump(checkpoint['results'], f, indent=2)

r = checkpoint['results']
print(f"\n=== DONE ===")
print(f"Scraped: {len(r)}")
print(f"Has content: {sum(1 for v in r.values() if v.get('has_content'))}")
print(f"Hiring signals: {sum(1 for v in r.values() if v.get('hiring'))}")
print(f"GitHub links: {sum(1 for v in r.values() if v.get('github'))}")
print(f"Funding mentions: {sum(1 for v in r.values() if v.get('has_funding'))}")
print(f"Tech stack: {sum(1 for v in r.values() if v.get('tech_stack'))}")
print(f"Has pricing: {sum(1 for v in r.values() if v.get('has_pricing'))}")
print(f"Has blog: {sum(1 for v in r.values() if v.get('has_blog'))}")
print(f"Has docs/API: {sum(1 for v in r.values() if v.get('has_docs') or v.get('has_api'))}")
emails_found = sum(1 for v in r.values() if v.get('emails'))
total_emails = sum(len(v.get('emails', [])) for v in r.values())
print(f"Companies with emails: {emails_found}")
print(f"Total email addresses: {total_emails}")
