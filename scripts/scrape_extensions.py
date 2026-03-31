#!/usr/bin/env python3
"""
Extension and direct phone scraper for company team/contact pages.
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
import sys
from urllib.parse import urlparse, urljoin

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

PAGE_PATHS = [
    '/team',
    '/our-team',
    '/staff',
    '/leadership',
    '/about/team',
    '/about-us',
    '/people',
    '/contact',
    '/contact-us',
    '/about/contact',
    '/about',
    '/meet-the-team',
    '/meet-our-team',
]

EXT_PATTERNS = [
    r'ext\.?\s*#?\s*(\d{2,6})',
    r'\bx\.?\s*(\d{2,6})\b',
    r'extension\s*:?\s*(\d{2,6})',
    r'Ext\s*\.?\s*(\d{2,6})',
]

DIRECT_PHONE_RE = r'(?:\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}'
EMAIL_RE = r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'


def normalize_url(website):
    """Ensure website has a scheme."""
    if not website:
        return None
    if not website.startswith('http'):
        website = 'https://' + website
    return website.rstrip('/')


def fetch_page(url, session):
    """Fetch a page and return BeautifulSoup object or None."""
    try:
        resp = session.get(url, timeout=8, allow_redirects=True, headers=HEADERS)
        if resp.status_code == 200:
            return BeautifulSoup(resp.text, 'html.parser'), url
        else:
            return None, url
    except Exception as e:
        return None, url


def extract_text_blocks(soup):
    """Extract text blocks from soup, preserving some structure."""
    # Remove script/style
    for tag in soup(['script', 'style', 'noscript']):
        tag.decompose()
    return soup.get_text(separator='\n', strip=True)


def find_phones_near_name(soup, target_names, page_url):
    """
    Try to find phone numbers/extensions near specific person names in the page.
    Returns list of contact dicts.
    """
    results = []
    text = extract_text_blocks(soup)
    lines = text.split('\n')
    lines = [l.strip() for l in lines if l.strip()]

    # Build a flat text for pattern scanning
    full_text = ' '.join(lines)

    # For each target name, look for proximity to phone numbers
    for name_raw in target_names:
        # Clean the name (remove titles like Mr/Ms/Mrs/Dr)
        name = re.sub(r'^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?|Prof\.?)\s+', '', name_raw, flags=re.IGNORECASE).strip()
        # Also try last name only
        name_parts = name.split()
        last_name = name_parts[-1] if name_parts else name
        first_name = name_parts[0] if len(name_parts) > 1 else name

        contact = {
            'name': name_raw,
            'extension': None,
            'direct_phone': None,
            'email': None,
            'source_page': page_url
        }

        # Search in lines for name proximity
        found_name_idx = None
        for i, line in enumerate(lines):
            if (name.lower() in line.lower() or 
                (last_name and last_name.lower() in line.lower() and len(last_name) > 3)):
                found_name_idx = i
                break

        if found_name_idx is not None:
            # Look in nearby lines (window of ±10 lines)
            window_start = max(0, found_name_idx - 5)
            window_end = min(len(lines), found_name_idx + 10)
            window_text = ' '.join(lines[window_start:window_end])

            # Look for extensions
            for pat in EXT_PATTERNS:
                m = re.search(pat, window_text, re.IGNORECASE)
                if m:
                    contact['extension'] = f"ext. {m.group(1)}"
                    break

            # Look for direct phone
            phones = re.findall(DIRECT_PHONE_RE, window_text)
            # Filter out obviously fake/placeholder numbers
            valid_phones = [p for p in phones if not re.search(r'0000000|1234567|6666666', p)]
            if valid_phones:
                contact['direct_phone'] = valid_phones[0].strip()

            # Look for email
            emails = re.findall(EMAIL_RE, window_text)
            valid_emails = [e for e in emails if not e.endswith(('.png', '.jpg', '.gif', '.svg', '.css', '.js'))]
            if valid_emails:
                contact['email'] = valid_emails[0]

        results.append(contact)

    return results


def find_all_phones_on_page(soup, page_url):
    """Find all phone numbers/extensions on a page (for companies with no named contacts)."""
    text = extract_text_blocks(soup)

    # Extensions
    extensions = []
    for pat in EXT_PATTERNS:
        extensions.extend(re.findall(pat, text, re.IGNORECASE))

    # Direct phones
    phones = re.findall(DIRECT_PHONE_RE, text)
    valid_phones = list(set([p.strip() for p in phones if not re.search(r'0000000|1234567|6666666', p)]))

    # Emails
    emails = re.findall(EMAIL_RE, text)
    valid_emails = list(set([e for e in emails if not e.endswith(('.png', '.jpg', '.gif', '.svg', '.css', '.js'))]))

    return extensions, valid_phones, valid_emails


def scan_json_ld(soup, target_names, page_url):
    """Check JSON-LD structured data for person telephone info."""
    results = []
    scripts = soup.find_all('script', type='application/ld+json')
    for script in scripts:
        try:
            data = json.loads(script.string)
            # Handle both single objects and arrays
            items = data if isinstance(data, list) else [data]
            for item in items:
                # Flatten nested @graph
                if '@graph' in item:
                    items.extend(item['@graph'])
                
                item_type = item.get('@type', '')
                if isinstance(item_type, list):
                    item_type = ' '.join(item_type)
                
                # Look for Person type
                if 'Person' in item_type or 'Employee' in item_type:
                    person_name = item.get('name', '')
                    telephone = item.get('telephone', None)
                    email = item.get('email', None)
                    
                    # Match to target names
                    for name_raw in target_names:
                        name_clean = re.sub(r'^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+', '', name_raw, flags=re.IGNORECASE).strip()
                        name_parts = name_clean.split()
                        last_name = name_parts[-1] if name_parts else name_clean
                        
                        if (name_clean.lower() in person_name.lower() or 
                            (last_name and last_name.lower() in person_name.lower() and len(last_name) > 3)):
                            contact = {
                                'name': name_raw,
                                'extension': None,
                                'direct_phone': telephone,
                                'email': email,
                                'source_page': page_url
                            }
                            results.append(contact)
                
                # Also check Organization telephone as fallback
                if ('Organization' in item_type or 'LocalBusiness' in item_type) and not results:
                    pass  # Skip org-level phones
        except:
            pass
    return results


def check_tel_links(soup, target_names, page_url):
    """Find tel: links near person names."""
    results = []
    
    # Find all tel links
    tel_links = soup.find_all('a', href=re.compile(r'^tel:'))
    
    for link in tel_links:
        phone = link.get('href', '').replace('tel:', '').strip()
        if not phone or re.search(r'0000000|1234567|6666666', phone):
            continue
            
        # Look at surrounding context (parent elements)
        context_text = ''
        parent = link.parent
        for _ in range(5):  # Walk up 5 levels
            if parent:
                context_text = parent.get_text(separator=' ', strip=True)
                if len(context_text) > 20:
                    break
                parent = parent.parent
        
        # Check if any target name is in context
        for name_raw in target_names:
            name_clean = re.sub(r'^(Mr\.?|Ms\.?|Mrs\.?|Dr\.?)\s+', '', name_raw, flags=re.IGNORECASE).strip()
            name_parts = name_clean.split()
            last_name = name_parts[-1] if name_parts else name_clean
            
            if (name_clean.lower() in context_text.lower() or
                (last_name and last_name.lower() in context_text.lower() and len(last_name) > 3)):
                contact = {
                    'name': name_raw,
                    'extension': None,
                    'direct_phone': phone,
                    'email': None,
                    'source_page': page_url
                }
                # Look for ext in link text or nearby text
                for pat in EXT_PATTERNS:
                    m = re.search(pat, context_text, re.IGNORECASE)
                    if m:
                        contact['extension'] = f"ext. {m.group(1)}"
                        break
                results.append(contact)
    
    return results


def merge_contacts(existing, new_contacts):
    """Merge new contact finds into existing, updating where we find better info."""
    if not new_contacts:
        return existing
    
    existing_by_name = {c['name']: c for c in existing}
    
    for nc in new_contacts:
        name = nc['name']
        if name in existing_by_name:
            ec = existing_by_name[name]
            if nc['extension'] and not ec['extension']:
                ec['extension'] = nc['extension']
            if nc['direct_phone'] and not ec['direct_phone']:
                ec['direct_phone'] = nc['direct_phone']
            if nc['email'] and not ec['email']:
                ec['email'] = nc['email']
            if nc['source_page'] and not ec.get('source_page'):
                ec['source_page'] = nc['source_page']
        else:
            existing_by_name[name] = nc
    
    return list(existing_by_name.values())


def scrape_company(company, session):
    """Scrape all pages for a company and return result dict."""
    name = company['company_name']
    website = normalize_url(company.get('website'))
    contact_names = [c['name'] for c in company.get('contacts', []) if c.get('name')]
    
    result = {
        'company_name': name,
        'website': website,
        'page_scraped': None,
        'contacts_found': [],
        'notes': ''
    }
    
    if not website:
        result['notes'] = 'No website provided'
        return result
    
    pages_tried = []
    pages_succeeded = []
    all_contacts = []
    best_page = None

    # Initialize contacts from input names
    if contact_names:
        all_contacts = [{'name': n, 'extension': None, 'direct_phone': None, 'email': None, 'source_page': None} 
                       for n in contact_names]

    for path in PAGE_PATHS:
        url = website + path
        soup, fetched_url = fetch_page(url, session)
        pages_tried.append(url)
        time.sleep(0.5)
        
        if soup is None:
            continue
        
        pages_succeeded.append(url)
        if best_page is None:
            best_page = url

        if contact_names:
            # Try JSON-LD first
            jld_contacts = scan_json_ld(soup, contact_names, url)
            if jld_contacts:
                all_contacts = merge_contacts(all_contacts, jld_contacts)
            
            # Try tel links
            tel_contacts = check_tel_links(soup, contact_names, url)
            if tel_contacts:
                all_contacts = merge_contacts(all_contacts, tel_contacts)
            
            # Try text proximity
            text_contacts = find_phones_near_name(soup, contact_names, url)
            if text_contacts:
                all_contacts = merge_contacts(all_contacts, text_contacts)
        else:
            # No specific names — just grab all phones/extensions
            exts, phones, emails = find_all_phones_on_page(soup, url)
            if exts or phones:
                result['notes'] += f"Page {url}: exts={exts[:3]}, phones={phones[:3]}. "

    result['page_scraped'] = best_page or (pages_tried[0] if pages_tried else None)
    result['contacts_found'] = all_contacts

    # Filter contacts: only keep those with something found
    # Actually keep all, but note which have data
    contacts_with_data = [c for c in all_contacts if c['extension'] or c['direct_phone'] or c['email']]
    
    if not contacts_with_data and not all_contacts:
        result['notes'] += f"No contacts found. Pages tried: {len(pages_tried)}, succeeded: {len(pages_succeeded)}."
    elif not contacts_with_data:
        result['notes'] += f"No extensions/phones found for named contacts. Pages tried: {len(pages_tried)}, succeeded: {len(pages_succeeded)}."
    else:
        result['notes'] += f"Found data for {len(contacts_with_data)} contacts. Pages tried: {len(pages_tried)}, succeeded: {len(pages_succeeded)}."

    # Only write contacts that actually have something useful
    result['contacts_found'] = contacts_with_data if contacts_with_data else all_contacts

    return result


def main():
    input_path = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/db_phones.json'
    output_path = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/extensions_found.json'
    
    with open(input_path) as f:
        companies = json.load(f)
    
    print(f"Loaded {len(companies)} companies to scrape.")
    
    # Load existing results to support resume
    results = []
    already_done = set()
    try:
        with open(output_path) as f:
            results = json.load(f)
        already_done = {r['company_name'] for r in results}
        print(f"Resuming: {len(already_done)} already done.")
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    
    session = requests.Session()
    session.headers.update(HEADERS)
    
    for i, company in enumerate(companies):
        name = company['company_name']
        if name in already_done:
            print(f"[{i+1}/{len(companies)}] SKIP (already done): {name}")
            continue
        print(f"[{i+1}/{len(companies)}] Scraping: {name} ({company.get('website', 'no website')})")
        sys.stdout.flush()
        
        try:
            result = scrape_company(company, session)
        except Exception as e:
            result = {
                'company_name': name,
                'website': company.get('website'),
                'page_scraped': None,
                'contacts_found': [],
                'notes': f'Error: {str(e)}'
            }
        
        results.append(result)
        
        # Save progress every 10 companies
        if (i + 1) % 10 == 0:
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2)
            print(f"  -> Progress saved ({i+1} done)")
    
    # Final save
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Summary
    total_with_data = sum(1 for r in results if r['contacts_found'] and any(
        c.get('extension') or c.get('direct_phone') or c.get('email') 
        for c in r['contacts_found']
    ))
    print(f"\nDone. {len(results)} companies processed, {total_with_data} had contact data found.")
    print(f"Output written to: {output_path}")


if __name__ == '__main__':
    main()
