#!/usr/bin/env python3
"""Email hunter script - finds emails for leads missing them"""

import json
import re
import subprocess
import time
import urllib.request
import urllib.error
from urllib.parse import urljoin, urlparse

LEADS_FILE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/missing_emails.json'
LOG_FILE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/EMAIL_HUNTER_LOG.md'
PROGRESS_FILE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/hunt_progress.json'
API_BASE = 'https://corgi-enrichment-production.up.railway.app'
API_KEY = 'corgi-enrichment-2026'

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')

# Emails to skip (generic/invalid)
SKIP_PATTERNS = [
    'example.com', 'test.com', 'domain.com', 'yourdomain', 'email.com',
    'sentry', 'wixpress', 'squarespace', 'wordpress', 'schema.org',
    'w3.org', 'googleapis', 'cloudflare', 'jquery', 'bootstrap',
    'png', 'jpg', 'gif', 'svg', 'webp', 'css', 'js',
    'privacy@', 'noreply@', 'no-reply@', 'donotreply@',
]

def is_valid_email(email, domain=None):
    """Check if email looks valid and relevant"""
    email_lower = email.lower()
    for skip in SKIP_PATTERNS:
        if skip in email_lower:
            return False
    # Must have a real TLD
    parts = email.split('@')
    if len(parts) != 2:
        return False
    local, host = parts
    if len(local) < 1 or len(host) < 4:
        return False
    if '.' not in host:
        return False
    return True

def score_email(email, domain=None):
    """Score email relevance (higher = better)"""
    email_lower = email.lower()
    score = 0
    
    # If it matches the company domain, very good
    if domain and domain.lower() in email_lower:
        score += 100
    
    # Preferred prefixes
    good_prefixes = ['info', 'contact', 'agent', 'insurance', 'office', 'admin', 'mail', 'hello', 'team', 'support']
    for prefix in good_prefixes:
        if email_lower.startswith(prefix + '@'):
            score += 50
            break
    
    return score

def fetch_url(url, timeout=10):
    """Fetch URL content, return text or None"""
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,*/*',
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content = resp.read(100000)  # Max 100KB
            try:
                return content.decode('utf-8', errors='ignore')
            except:
                return content.decode('latin-1', errors='ignore')
    except Exception as e:
        return None

def find_emails_in_text(text, domain=None):
    """Extract valid emails from text"""
    if not text:
        return []
    emails = EMAIL_RE.findall(text)
    valid = [e for e in emails if is_valid_email(e, domain)]
    # Remove duplicates, sort by score
    seen = set()
    unique = []
    for e in valid:
        el = e.lower()
        if el not in seen:
            seen.add(el)
            unique.append(e)
    unique.sort(key=lambda e: -score_email(e, domain))
    return unique

def find_email_for_lead(lead):
    """Try multiple methods to find email for a lead. Returns (email, method) or (None, None)"""
    website = lead.get('website') or ''
    domain = lead.get('domain') or ''
    company = lead.get('company_name', '')
    city = lead.get('city', '')
    state = lead.get('state', '')
    
    # Clean up website
    if website and not website.startswith('http'):
        website = 'https://' + website
    
    # If no website, try to construct from domain
    if not website and domain:
        website = 'https://' + domain
    
    if website:
        # Try main page
        text = fetch_url(website)
        emails = find_emails_in_text(text, domain)
        if emails:
            return emails[0], 'website_main'
        
        # Try /contact
        contact_url = website.rstrip('/') + '/contact'
        text = fetch_url(contact_url)
        emails = find_emails_in_text(text, domain)
        if emails:
            return emails[0], 'website_contact'
        
        # Try /contact-us
        contact_url2 = website.rstrip('/') + '/contact-us'
        text = fetch_url(contact_url2)
        emails = find_emails_in_text(text, domain)
        if emails:
            return emails[0], 'website_contact_us'
        
        # Try /about
        about_url = website.rstrip('/') + '/about'
        text = fetch_url(about_url)
        emails = find_emails_in_text(text, domain)
        if emails:
            return emails[0], 'website_about'
    
    return None, None

def update_lead_email(lead_id, email):
    """PATCH the lead with found email"""
    result = subprocess.run([
        'curl', '-s', '-X', 'PATCH',
        f'{API_BASE}/api/leads/{lead_id}',
        '-H', 'Content-Type: application/json',
        '-H', f'X-API-Key: {API_KEY}',
        '-H', 'X-Human-Edit: true',
        '-d', json.dumps({'email': email})
    ], capture_output=True, text=True)
    return result.stdout

def main():
    with open(LEADS_FILE) as f:
        leads = json.load(f)
    
    # Load progress if exists
    try:
        with open(PROGRESS_FILE) as f:
            progress = json.load(f)
    except:
        progress = {'done_ids': [], 'found': [], 'not_found': []}
    
    done_ids = set(progress['done_ids'])
    found = progress['found']
    not_found = progress['not_found']
    
    remaining = [l for l in leads if l['id'] not in done_ids]
    print(f"Total: {len(leads)}, Done: {len(done_ids)}, Remaining: {len(remaining)}")
    print(f"Found so far: {len(found)}")
    
    for i, lead in enumerate(remaining):
        lid = lead['id']
        company = lead.get('company_name', 'Unknown')
        website = lead.get('website', '')
        
        print(f"\n[{i+1}/{len(remaining)}] {company} | {website}")
        
        try:
            email, method = find_email_for_lead(lead)
        except Exception as e:
            print(f"  ERROR: {e}")
            email, method = None, None
        
        if email:
            print(f"  FOUND: {email} ({method})")
            # Update via API
            resp = update_lead_email(lid, email)
            found.append({
                'id': lid,
                'company': company,
                'email': email,
                'method': method,
                'website': website
            })
        else:
            print(f"  not found")
            not_found.append({'id': lid, 'company': company, 'website': website})
        
        done_ids.add(lid)
        progress['done_ids'] = list(done_ids)
        progress['found'] = found
        progress['not_found'] = not_found
        
        # Save progress every 10 leads
        if (i + 1) % 10 == 0:
            with open(PROGRESS_FILE, 'w') as f:
                json.dump(progress, f, indent=2)
            print(f"  === Progress saved: {len(found)} found so far ===")
        
        time.sleep(0.3)  # Rate limiting
    
    # Final save
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f, indent=2)
    
    print(f"\n=== COMPLETE ===")
    print(f"Found: {len(found)}")
    print(f"Not found: {len(not_found)}")
    
    # Write log
    write_log(found, not_found)

def write_log(found, not_found):
    lines = [
        "# Email Hunter Log\n",
        f"**Run completed**\n",
        f"- Emails found & updated: **{len(found)}**\n",
        f"- Could not find: {len(not_found)}\n\n",
        "## Found Emails\n\n",
        "| Company | Email | Method | Website |\n",
        "|---------|-------|--------|--------|\n",
    ]
    for r in found:
        lines.append(f"| {r['company']} | {r['email']} | {r['method']} | {r.get('website','')} |\n")
    
    lines.append("\n## Not Found\n\n")
    for r in not_found[:50]:  # First 50
        lines.append(f"- {r['company']} ({r.get('website','')})\n")
    
    with open(LOG_FILE, 'w') as f:
        f.writelines(lines)
    
    print(f"Log written to {LOG_FILE}")

if __name__ == '__main__':
    main()
