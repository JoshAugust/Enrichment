#!/usr/bin/env python3
"""
Website enrichment script — scrapes company websites to extract employee count.
Reads domains from stdin (one per line), writes results to stdout as JSON.
"""
import sys
import json
import re
import urllib.request
import urllib.error
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

TEAM_PATTERNS = [
    # "X employees" or "X team members" or "team of X"
    re.compile(r'(\d{1,3})\s*(?:\+\s*)?(?:employees?|team\s*members?|people|engineers?|staff)', re.I),
    re.compile(r'team\s+of\s+(\d{1,3})', re.I),
    # LinkedIn-style "1-10 employees"
    re.compile(r'(\d{1,3})\s*[-–]\s*(\d{1,3})\s*employees?', re.I),
]

ABOUT_PATHS = ['', '/about', '/about-us', '/team', '/company', '/about/team']

def fetch_page(domain, path=''):
    url = f'https://{domain}{path}'
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    })
    try:
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            return resp.read().decode('utf-8', errors='replace')[:100000]
    except:
        return None

def extract_employee_count(html):
    if not html:
        return None, None
    
    for pattern in TEAM_PATTERNS:
        match = pattern.search(html)
        if match:
            groups = match.groups()
            if len(groups) == 2:  # Range like "1-10"
                low, high = int(groups[0]), int(groups[1])
                return (low + high) // 2, match.group(0)
            else:
                count = int(groups[0])
                if 1 <= count <= 500:  # Sanity check
                    return count, match.group(0)
    
    # Count team member photos/cards on /team or /about
    team_indicators = len(re.findall(r'class=["\'][^"\']*(?:team-member|staff-card|employee|people-card)', html, re.I))
    if team_indicators >= 2:
        return team_indicators, f"{team_indicators} team cards found"
    
    return None, None

def process_domain(domain):
    domain = domain.strip()
    if not domain:
        return None
    
    result = {'domain': domain, 'employees_found': None, 'evidence': None, 'pages_checked': []}
    
    for path in ABOUT_PATHS:
        html = fetch_page(domain, path)
        if html:
            result['pages_checked'].append(path or '/')
            count, evidence = extract_employee_count(html)
            if count is not None:
                result['employees_found'] = count
                result['evidence'] = evidence
                result['source_path'] = path or '/'
                break
    
    return result

if __name__ == '__main__':
    domains = [line.strip() for line in sys.stdin if line.strip()]
    results = []
    for i, domain in enumerate(domains):
        r = process_domain(domain)
        if r:
            results.append(r)
            found = r['employees_found']
            status = f"found:{found}" if found else "no_data"
            print(f"[{i+1}/{len(domains)}] {domain}: {status}", file=sys.stderr, flush=True)
    
    json.dump(results, sys.stdout, indent=2)
