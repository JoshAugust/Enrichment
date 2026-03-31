#!/usr/bin/env python3
"""
Contact Enrichment Agent - Wave 3
Systematically enriches all 674 Qualified trucking insurance leads.
"""

import requests
import json
import re
import time
import sys
from datetime import datetime
from urllib.parse import urlparse

API_BASE = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_FILE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/CONTACT_ENRICHMENT_LOG_V3.md"

HEADERS = {"X-API-Key": API_KEY}
PATCH_HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    "X-Human-Edit": "true"
}

FETCH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Known fake/placeholder phone numbers to skip
FAKE_PHONES = {
    '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
    '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
    '5005000000', '7715231245',  # 771-523-1245 appears to be a placeholder
    '1234567890', '0123456789',
}

# Stats
stats = {
    "total_processed": 0,
    "enriched": 0,
    "phone_found": 0,
    "email_found": 0,
    "contact_found": 0,
    "skipped_complete": 0,
    "failed": 0,
    "no_data_found": 0,
    "website_failed": 0,
}

log_entries = []

def log(msg):
    print(msg, flush=True)
    log_entries.append(msg)

def get_leads_batch(offset, limit=100):
    try:
        resp = requests.get(
            f"{API_BASE}/api/leads",
            params={"limit": limit, "offset": offset, "status": "Qualified"},
            headers=HEADERS,
            timeout=15
        )
        data = resp.json()
        return data.get("leads", [])
    except Exception as e:
        log(f"ERROR fetching offset {offset}: {e}")
        return []

def extract_phones(html):
    """Extract phone numbers from HTML using tel: links and text patterns."""
    phones = []
    seen_digits = set()
    
    # 1. Tel: links (most reliable)
    tel_matches = re.findall(r'tel:([+\d\s\-\(\)\.]{7,20})', html)
    for t in tel_matches:
        digits = re.sub(r'\D', '', t)
        if len(digits) == 11 and digits[0] == '1':
            digits = digits[1:]
        if len(digits) == 10 and digits not in seen_digits and digits not in FAKE_PHONES:
            # Validate: area code can't start with 0 or 1
            if digits[0] not in ('0', '1') and digits[3] not in ('0', '1'):
                seen_digits.add(digits)
                phones.append(f"({digits[:3]}) {digits[3:6]}-{digits[6:]}")
    
    # 2. Text patterns (if tel: didn't give us good results)
    patterns = [
        r'\((\d{3})\)\s*(\d{3})[-.\s](\d{4})',
        r'(\d{3})[-.](\d{3})[-.](?\d{4})',
        r'\b(\d{3})\s(\d{3})\s(\d{4})\b',
    ]
    for pattern in [r'\((\d{3})\)\s*(\d{3})[-.\s](\d{4})', r'\b(\d{3})[-.](\d{3})[.-](\d{4})\b']:
        for m in re.finditer(pattern, html):
            area, exch, num = m.group(1), m.group(2), m.group(3)
            digits = area + exch + num
            if digits not in seen_digits and digits not in FAKE_PHONES:
                if area[0] not in ('0', '1') and exch[0] not in ('0', '1'):
                    seen_digits.add(digits)
                    phones.append(f"({area}) {exch}-{num}")
    
    return phones

def extract_emails(html):
    """Extract emails, prioritizing mailto: links and filtering junk."""
    emails = []
    seen = set()
    
    bad_domains = ['example.com', 'sentry.io', 'wixpress.com', 'squarespace.com', 
                   'wordpress.com', 'schema.org', 'w3.org', 'googleapis.com',
                   'cloudflare.com', 'jquery.com', 'adobe.com', 'fontawesome.com',
                   'bootstrapcdn.com', 'jsdelivr.net', 'unpkg.com', 'cdnjs.com',
                   'gravatar.com', 'akismet.com', 'automattic.com']
    
    # Extensions that mean it's NOT an email
    bad_in_email = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.css', '.js', 
                    '.woff', '.ttf', '.eot', '.ico', '.webp', '.pdf', '.doc',
                    '\\u00', '@2x', '@3x', 'example@', 'test@', 'demo@']
    
    # 1. Mailto links (most reliable)
    mailto_matches = re.findall(r'mailto:([^\s"\'<>&?#\\\u0022\u003e]+)', html)
    for e in mailto_matches:
        # Decode HTML entities
        e = e.replace('&amp;', '&').strip()
        e_lower = e.lower()
        if '@' not in e_lower:
            continue
        # Strip query params
        if '?' in e_lower:
            e_lower = e_lower.split('?')[0]
        if e_lower in seen:
            continue
        domain = e_lower.split('@')[1] if '@' in e_lower else ''
        if any(bd in domain for bd in bad_domains):
            continue
        if any(bad in e_lower for bad in bad_in_email):
            continue
        # Valid email pattern
        if re.match(r'^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$', e_lower):
            emails.append(e_lower)
            seen.add(e_lower)
    
    # 2. Text pattern (backup)
    pattern = r'\b([A-Za-z0-9._%+\-]+)@([A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b'
    for m in re.finditer(pattern, html):
        local, domain = m.group(1).lower(), m.group(2).lower()
        e_lower = f"{local}@{domain}"
        if e_lower in seen:
            continue
        if any(bd in domain for bd in bad_domains):
            continue
        if any(bad in e_lower for bad in bad_in_email):
            continue
        # Sanity: local part shouldn't look like a filename
        if re.search(r'\.(png|jpg|gif|svg|css|js|woff|ttf|pdf)$', local):
            continue
        emails.append(e_lower)
        seen.add(e_lower)
    
    return emails

def pick_best_email(emails):
    """Pick the best contact email from a list."""
    if not emails:
        return None
    
    priority_prefixes = ['info@', 'contact@', 'hello@', 'office@', 'insurance@', 
                         'agency@', 'quotes@', 'quote@', 'truck@', 'commercial@',
                         'sales@', 'team@', 'admin@', 'support@', 'help@',
                         'service@', 'mail@', 'inquiry@', 'inquiries@', 'get@']
    
    skip_prefixes = ['noreply@', 'no-reply@', 'donotreply@', 'bounce@', 'mailer@',
                     'notifications@', 'alerts@', 'newsletter@', 'subscribe@', 
                     'unsubscribe@', 'privacy@', 'legal@', 'abuse@', 'spam@', 
                     'postmaster@', 'webmaster@', 'press@', 'media@']
    
    for prefix in priority_prefixes:
        for e in emails:
            if e.startswith(prefix):
                return e
    
    for e in emails:
        if not any(e.startswith(p) for p in skip_prefixes):
            return e
    
    return emails[0] if emails else None

def strip_html(html):
    """Strip HTML tags and return readable text."""
    # Remove script and style blocks entirely
    text = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html, flags=re.DOTALL | re.IGNORECASE)
    # Remove HTML comments
    text = re.sub(r'<!--.*?-->', ' ', text, flags=re.DOTALL)
    # Remove remaining tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode common HTML entities
    text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&nbsp;', ' ').replace('&#8211;', '-').replace('&#8212;', '-')
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text

def extract_contact_names(html):
    """
    Try to find owner/president/agent names from page text.
    Very strict — only returns clearly human names.
    """
    text = strip_html(html)
    
    # Patterns looking for title THEN name
    title_first_patterns = [
        r'(?:Owner|President|Principal Agent|CEO|Founder|Agency Owner|Broker-Owner|Principal Broker|Licensed Agent in Charge)[:\s,]+([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?)',
        r'(?:Hi,?\s+I\'?m|Hello,?\s+I\'?m|My name is)\s+([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15})',
        r'Founded\s+by\s+([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15})',
        r'(?:Meet|About)\s+([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}),\s+(?:Owner|President|Principal|CEO|Founder)',
    ]
    
    # Patterns looking for name THEN title
    name_first_patterns = [
        r'([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?)\s*[,\-–]\s*(?:Owner|President|Principal|CEO|Founder|Agency Owner|Broker)',
        r'([A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15})\s+is\s+the\s+(?:owner|president|founder|principal)',
    ]
    
    all_patterns = title_first_patterns + name_first_patterns
    
    # Common English words that look like names (false positives)
    common_words = {
        'insurance', 'agency', 'agent', 'truck', 'trucking', 'commercial', 'auto',
        'coverage', 'policy', 'claim', 'quote', 'fleet', 'cargo', 'liability',
        'contact', 'about', 'home', 'service', 'portal', 'login', 'logout',
        'menu', 'search', 'cookie', 'privacy', 'terms', 'rights', 'reserved',
        'north', 'south', 'east', 'west', 'coast', 'plains', 'mountain',
        'america', 'united', 'states', 'national', 'federal', 'state',
        'progressive', 'great', 'canal', 'travelers', 'northland', 'liberty',
        'mutual', 'allstate', 'nationwide', 'farmers', 'general', 'american',
        'western', 'eastern', 'central', 'pacific', 'atlantic',
        'client', 'customer', 'partner', 'member', 'staff', 'team',
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        'january', 'february', 'march', 'april', 'june', 'july', 'august',
        'september', 'october', 'november', 'december',
        'read', 'learn', 'click', 'view', 'find', 'call', 'visit', 'send',
        'submit', 'sign', 'login', 'register', 'apply', 'start', 'get',
        'back', 'next', 'previous', 'skip', 'close', 'open', 'show', 'hide',
        'need', 'help', 'want', 'have', 'make', 'take', 'give', 'keep',
        'free', 'fast', 'easy', 'new', 'old', 'big', 'small', 'good', 'best',
        'your', 'their', 'this', 'that', 'what', 'when', 'where', 'why', 'how',
        'more', 'less', 'much', 'many', 'most', 'some', 'any', 'all', 'none',
        'today', 'now', 'here', 'there', 'every', 'each', 'both', 'same',
        'other', 'another', 'such', 'sure', 'safe', 'real', 'true', 'just',
        'please', 'thank', 'welcome', 'hello', 'goodbye', 'dear', 'sir',
        'permit', 'permits', 'registration', 'filing', 'compliance', 'authority',
        'dispatch', 'freight', 'load', 'haul', 'route', 'driver', 'carrier',
        'dot', 'fmcsa', 'usdot', 'mc', 'cdl', 'ifta', 'irp',
        'speak', 'trained', 'transport', 'business', 'entity', 'enrollment',
        'dir', 'mgr', 'vp', 'sr', 'jr', 'dr', 'mr', 'ms', 'mrs', 'esq',
        'inc', 'llc', 'ltd', 'corp', 'co', 'ext', 'fax', 'tel', 'ph',
        'risk', 'program', 'programs', 'solutions', 'group', 'services',
        'experts', 'specialists', 'professionals', 'associates', 'partners',
        'agents', 'brokers', 'underwriters', 'carriers', 'markets',
    }
    
    for pattern in all_patterns:
        matches = re.findall(pattern, text)
        for name in matches:
            name = name.strip()
            parts = name.split()
            
            if len(parts) < 2 or len(parts) > 3:
                continue
            if len(name) > 45:
                continue
            
            # All parts must be title-case alphabetic, min 3 chars
            if not all(re.match(r'^[A-Z][a-z]{2,15}$', p) for p in parts):
                continue
            
            # No common words
            parts_lower = [p.lower() for p in parts]
            if any(p in common_words for p in parts_lower):
                continue
            
            # Looks like a real name!
            return name
    
    return None

def fetch_url(url, timeout=12):
    """Fetch a URL and return HTML text."""
    try:
        if not url.startswith('http'):
            url = 'https://' + url
        resp = requests.get(url, headers=FETCH_HEADERS, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            return resp.text
        return None
    except:
        return None

def enrich_from_html(html):
    """Extract all contact info from HTML."""
    result = {}
    
    phones = extract_phones(html)
    emails = extract_emails(html)
    contact = extract_contact_names(html)
    
    if phones:
        result['phone'] = phones[0]
    
    best_email = pick_best_email(emails)
    if best_email:
        result['email'] = best_email
    
    if contact:
        result['contact_name'] = contact
    
    return result

def enrich_lead(lead):
    """Attempt to enrich a single lead. Returns (dict of found data, website_ok bool)."""
    website = lead.get('website', '') or ''
    company = lead.get('company_name', 'Unknown')
    city = lead.get('city', 'Unknown')
    state = lead.get('state', 'Unknown')
    
    found = {}
    website_ok = False
    
    # 1. Try main website
    if website:
        html = fetch_url(website)
        if html:
            website_ok = True
            found = enrich_from_html(html)
        
        # 2. If missing phone or email, try contact/about page
        if not found.get('phone') or not found.get('email'):
            parsed = urlparse(website if website.startswith('http') else 'https://' + website)
            base = f"{parsed.scheme}://{parsed.netloc}"
            
            for path in ['/contact', '/contact-us', '/about', '/about-us']:
                contact_html = fetch_url(base + path, timeout=8)
                if contact_html:
                    contact_found = enrich_from_html(contact_html)
                    for k, v in contact_found.items():
                        if k not in found:
                            found[k] = v
                    if found.get('phone') and found.get('email'):
                        break
                    time.sleep(0.2)
    
    # 3. If still completely empty, try DuckDuckGo instant answer
    if not found.get('phone') and not found.get('email'):
        try:
            if city and city != 'Unknown':
                query = f'"{company}" {city} {state} insurance phone'
            else:
                query = f'"{company}" insurance phone number'
            
            ddg_resp = requests.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "skip_disambig": 1},
                timeout=10,
                headers={'User-Agent': 'Mozilla/5.0'}
            )
            ddg_data = ddg_resp.json()
            ddg_text = ddg_data.get('AbstractText', '') + ' ' + ddg_data.get('Answer', '')
            for r in ddg_data.get('RelatedTopics', [])[:3]:
                if isinstance(r, dict):
                    ddg_text += ' ' + r.get('Text', '')
            
            ddg_phones = extract_phones(ddg_text)
            ddg_emails = extract_emails(ddg_text)
            
            if ddg_phones and not found.get('phone'):
                found['phone'] = ddg_phones[0]
            if ddg_emails and not found.get('email'):
                best = pick_best_email(ddg_emails)
                if best:
                    found['email'] = best
        except:
            pass
    
    return found, website_ok

def patch_lead(lead_id, data, original_notes=""):
    """Patch a lead with found data."""
    if not data:
        return False
    
    payload = {}
    
    if data.get('phone'):
        payload['phone'] = data['phone']
    if data.get('email'):
        payload['email'] = data['email']
    if data.get('contact_name'):
        payload['contact_name'] = data['contact_name']
    
    # Build notes
    notes_parts = []
    if data.get('contact_name'):
        notes_parts.append(f"Contact: {data['contact_name']}")
    if data.get('phone'):
        notes_parts.append(f"Ph: {data['phone']}")
    if data.get('email'):
        notes_parts.append(f"Em: {data['email']}")
    
    if notes_parts:
        wave_note = "Wave3: " + ", ".join(notes_parts)
        existing = (original_notes or "").strip()
        payload['agent_notes'] = (existing + " | " + wave_note).strip(" |")
    
    if not payload:
        return False
    
    try:
        resp = requests.patch(
            f"{API_BASE}/api/leads/{lead_id}",
            headers=PATCH_HEADERS,
            json=payload,
            timeout=15
        )
        return resp.status_code in [200, 201, 204]
    except Exception as e:
        log(f"  PATCH error: {e}")
        return False

def process_batch(leads):
    """Process a batch of leads."""
    for lead in leads:
        lead_id = lead['id']
        company = lead.get('company_name', 'Unknown')
        website = lead.get('website', '')
        
        # Check if already has phone AND email - skip
        has_phone = bool(lead.get('phone_hq') or lead.get('mobile_phone') or lead.get('phone'))
        has_email = bool(lead.get('email'))
        
        if has_phone and has_email:
            stats['skipped_complete'] += 1
            continue
        
        stats['total_processed'] += 1
        
        log(f"\n[{stats['total_processed']}] {company}")
        if website:
            log(f"  URL: {website}")
        
        # Enrich
        found, website_ok = enrich_lead(lead)
        
        if not website_ok and website:
            stats['website_failed'] += 1
        
        if not found:
            stats['no_data_found'] += 1
            log(f"  → No data found")
            time.sleep(0.3)
            continue
        
        success = patch_lead(lead_id, found, lead.get('agent_notes', ''))
        
        if success:
            stats['enriched'] += 1
            if found.get('phone'):
                stats['phone_found'] += 1
                log(f"  ✓ Phone: {found['phone']}")
            if found.get('email'):
                stats['email_found'] += 1
                log(f"  ✓ Email: {found['email']}")
            if found.get('contact_name'):
                stats['contact_found'] += 1
                log(f"  ✓ Contact: {found['contact_name']}")
        else:
            stats['failed'] += 1
            log(f"  ✗ PATCH failed")
        
        time.sleep(0.4)

def main():
    log(f"# Contact Enrichment Wave 3")
    log(f"# Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"# Target: 674 Qualified trucking insurance leads\n")
    
    total_leads = 674
    
    for offset in range(0, total_leads + 100, 100):
        log(f"\n{'='*60}")
        log(f"BATCH offset={offset} | Stats: enriched={stats['enriched']}, phone={stats['phone_found']}, email={stats['email_found']}")
        log(f"{'='*60}")
        
        leads = get_leads_batch(offset)
        if not leads:
            log(f"No leads at offset {offset}, done.")
            break
        
        log(f"Fetched {len(leads)} leads")
        process_batch(leads)
        
        log(f"\n--- CHECKPOINT: Enriched={stats['enriched']}, Phone={stats['phone_found']}, Email={stats['email_found']}, Contact={stats['contact_found']} ---")
        
        # Write intermediate log
        with open(LOG_FILE, 'w') as f:
            f.write('\n'.join(log_entries))
        
        time.sleep(1)
    
    # Final report
    log(f"\n{'='*60}")
    log(f"FINAL REPORT - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"{'='*60}")
    log(f"Total Processed:    {stats['total_processed']}")
    log(f"Leads Enriched:     {stats['enriched']}")
    log(f"Phone Found:        {stats['phone_found']}")
    log(f"Email Found:        {stats['email_found']}")
    log(f"Contact Name Found: {stats['contact_found']}")
    log(f"Skipped (complete): {stats['skipped_complete']}")
    log(f"No Data Found:      {stats['no_data_found']}")
    log(f"Website Failed:     {stats['website_failed']}")
    log(f"Failed PATCH:       {stats['failed']}")
    
    # Write final log
    with open(LOG_FILE, 'w') as f:
        f.write('\n'.join(log_entries))
    
    print(f"\nLog written to {LOG_FILE}", flush=True)
    return stats

if __name__ == '__main__':
    main()
