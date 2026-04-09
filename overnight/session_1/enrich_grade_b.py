#!/usr/bin/env python3
"""
Grade B Website Enrichment Script
- Fetches websites for 232 Grade B queue_import companies
- Extracts employee counts, descriptions, locations, tech signals
- Rescores with ICP model v1
- Writes progress to enrichment_log.md and final stats to enrichment_results.json
"""

import json
import re
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# Paths
WORKSPACE = Path("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai")
DB_PATH = WORKSPACE / "pipeline" / "master.db"
LOG_PATH = WORKSPACE / "overnight" / "session_1" / "enrichment_log.md"
RESULTS_PATH = WORKSPACE / "overnight" / "session_1" / "enrichment_results.json"

# Add pipeline to sys.path for ICP model
sys.path.insert(0, str(WORKSPACE / "pipeline"))
from icp_score_v1 import compute_icp_score

# ── Fetch Config ──
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xhtml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}
TIMEOUT = 10
MAX_CHARS = 4000

# ── Regex patterns ──
EMPLOYEE_PATTERNS = [
    re.compile(r'(?:team\s+of|we\s+are|we\'re a team of|team of)\s+(\d+)', re.IGNORECASE),
    re.compile(r'(\d+)\s*(?:\+)?\s*(?:employees?|team members?|people|staff)\b', re.IGNORECASE),
    re.compile(r'(\d+)\s*(?:\+)?\s*(?:person|people)\s+team', re.IGNORECASE),
    re.compile(r'(?:over|more than|~|approximately|around)\s+(\d+)\s+(?:employees?|people)', re.IGNORECASE),
    re.compile(r'(\d+)-person\s+team', re.IGNORECASE),
]

US_STATES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
    # Common city-based lookups
    'San Francisco': 'CA', 'New York City': 'NY', 'NYC': 'NY',
    'Los Angeles': 'CA', 'Chicago': 'IL', 'Austin': 'TX', 'Seattle': 'WA',
    'Boston': 'MA', 'Denver': 'CO', 'Atlanta': 'GA', 'Miami': 'FL',
    'Portland': 'OR', 'Dallas': 'TX', 'Houston': 'TX', 'Minneapolis': 'MN',
    'Philadelphia': 'PA', 'Pittsburgh': 'PA', 'San Diego': 'CA',
    'San Jose': 'CA', 'Oakland': 'CA', 'Raleigh': 'NC', 'Nashville': 'TN',
    'Salt Lake City': 'UT', 'Phoenix': 'AZ', 'Indianapolis': 'IN',
    'Columbus': 'OH', 'Charlotte': 'NC', 'Detroit': 'MI', 'Louisville': 'KY',
    'Baltimore': 'MD', 'Milwaukee': 'WI', 'Albuquerque': 'NM',
    'Tucson': 'AZ', 'Fresno': 'CA', 'Sacramento': 'CA',
}

HIRING_PATTERNS = re.compile(
    r'(?:we\'re hiring|now hiring|join\s+(?:our|the)\s+team|open positions|'
    r'careers|jobs|job openings|open roles|we\'re looking for|work with us)',
    re.IGNORECASE
)

TECH_STACK_PATTERNS = re.compile(
    r'\b(?:react|vue|angular|node\.js|python|django|flask|fastapi|ruby on rails|'
    r'kubernetes|docker|aws|gcp|azure|terraform|graphql|rest api|postgresql|'
    r'mongodb|redis|kafka|elasticsearch|typescript|go|golang|rust|swift|kotlin|'
    r'next\.js|vercel|netlify|supabase|firebase|stripe|twilio|openai|llm)\b',
    re.IGNORECASE
)


def fetch_url(url: str, max_chars: int = MAX_CHARS) -> tuple[str | None, str | None]:
    """Fetch a URL and return (text_content, error). text_content is truncated to max_chars."""
    try:
        # Ensure URL has scheme
        if not url.startswith('http'):
            url = 'https://' + url.lstrip('/')
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Remove scripts/styles
        for tag in soup(['script', 'style', 'noscript', 'svg', 'img']):
            tag.decompose()
        text = ' '.join(soup.get_text(separator=' ').split())
        return text[:max_chars], None
    except requests.exceptions.Timeout:
        return None, 'timeout'
    except requests.exceptions.ConnectionError:
        return None, 'connection_error'
    except requests.exceptions.HTTPError as e:
        return None, f'http_{e.response.status_code}'
    except Exception as e:
        return None, f'error_{type(e).__name__}'


def extract_meta_description(url: str) -> str | None:
    """Extract meta description from page."""
    try:
        if not url.startswith('http'):
            url = 'https://' + url.lstrip('/')
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        soup = BeautifulSoup(resp.text, 'html.parser')
        meta = soup.find('meta', attrs={'name': 'description'}) or \
               soup.find('meta', attrs={'property': 'og:description'})
        if meta:
            content = meta.get('content', '').strip()
            if len(content) > 20:
                return content[:500]
    except:
        pass
    return None


def extract_employee_count(text: str) -> int | None:
    """Extract employee count from text."""
    if not text:
        return None
    for pattern in EMPLOYEE_PATTERNS:
        match = pattern.search(text)
        if match:
            try:
                count = int(match.group(1))
                # Sanity check — must be reasonable
                if 1 <= count <= 500:
                    return count
            except (ValueError, IndexError):
                pass
    return None


def extract_state(text: str) -> str | None:
    """Extract US state abbreviation from text."""
    if not text:
        return None
    # Try state abbreviations like ", CA" or "CA, USA"
    abbrev_pattern = re.compile(
        r'\b(' + '|'.join(US_STATES.values()) + r')\b'
        r'(?:\s*,\s*(?:US|USA|United States))?',
        re.IGNORECASE
    )
    # First try full state names
    for name, abbrev in US_STATES.items():
        if re.search(r'\b' + re.escape(name) + r'\b', text, re.IGNORECASE):
            return abbrev
    # Then try abbreviations in address-like context
    addr_pattern = re.compile(
        r',\s*([A-Z]{2})\s*(?:\d{5})?(?:\s*,\s*(?:US|USA))?',
    )
    match = addr_pattern.search(text)
    if match:
        abbrev = match.group(1)
        if abbrev in set(US_STATES.values()):
            return abbrev
    return None


def extract_tech_stack(text: str) -> list[str]:
    """Extract tech stack mentions."""
    if not text:
        return []
    matches = TECH_STACK_PATTERNS.findall(text)
    # Deduplicate preserving order
    seen = set()
    result = []
    for m in matches:
        m_lower = m.lower()
        if m_lower not in seen:
            seen.add(m_lower)
            result.append(m_lower)
    return result[:15]  # Cap at 15


def extract_signals(text: str) -> dict:
    """Extract structured signals from page text."""
    signals = {}
    
    # Employee count
    emp = extract_employee_count(text)
    if emp:
        signals['employees_from_site'] = emp
    
    # State
    state = extract_state(text)
    if state:
        signals['state_from_site'] = state
    
    # Hiring
    is_hiring = bool(HIRING_PATTERNS.search(text)) if text else False
    signals['is_hiring'] = is_hiring
    
    # Tech stack
    tech = extract_tech_stack(text)
    if tech:
        signals['tech_stack_from_site'] = tech
    
    # API/dev signals
    has_api_docs = bool(re.search(r'\b(?:api docs?|developer docs?|api reference|engineering blog)\b', text or '', re.IGNORECASE))
    signals['has_api_docs'] = has_api_docs
    
    return signals


def enrich_company(domain: str, existing_description: str) -> dict:
    """
    Fetch website and extract enrichment data.
    Returns dict with enrichment results.
    """
    result = {
        'domain': domain,
        'employees': None,
        'description': None,
        'state': None,
        'is_hiring': False,
        'tech_stack': [],
        'has_api_docs': False,
        'fetch_status': 'ok',
        'pages_tried': [],
    }
    
    # Step 1: Fetch main page
    main_url = f'https://{domain}'
    text, err = fetch_url(main_url)
    
    if err:
        # Try www prefix
        www_url = f'https://www.{domain}'
        text, err2 = fetch_url(www_url)
        if err2:
            result['fetch_status'] = err
            return result
    
    result['pages_tried'].append(main_url)
    
    # Extract meta description as better description
    meta_desc = extract_meta_description(main_url)
    if meta_desc and (not existing_description or len(meta_desc) > len(existing_description or '')):
        result['description'] = meta_desc
    
    # Extract signals from main page
    signals = extract_signals(text)
    result.update({
        'employees': signals.get('employees_from_site'),
        'state': signals.get('state_from_site'),
        'is_hiring': signals.get('is_hiring', False),
        'tech_stack': signals.get('tech_stack_from_site', []),
        'has_api_docs': signals.get('has_api_docs', False),
    })
    
    # Step 2: If no employee count, try /about or /team pages
    if not result['employees']:
        for path in ['/about', '/about-us', '/team', '/company']:
            about_url = f'https://{domain}{path}'
            about_text, about_err = fetch_url(about_url)
            if not about_err and about_text:
                result['pages_tried'].append(about_url)
                about_signals = extract_signals(about_text)
                emp = about_signals.get('employees_from_site')
                if emp:
                    result['employees'] = emp
                    break
                # Also get state from about page if missing
                if not result['state'] and about_signals.get('state_from_site'):
                    result['state'] = about_signals['state_from_site']
                # Tech stack
                if not result['tech_stack'] and about_signals.get('tech_stack_from_site'):
                    result['tech_stack'] = about_signals['tech_stack_from_site']
            time.sleep(0.3)  # polite crawl delay
    
    # Step 3: Try /careers or /jobs if not marked hiring
    if not result['is_hiring']:
        for path in ['/careers', '/jobs']:
            careers_url = f'https://{domain}{path}'
            careers_text, careers_err = fetch_url(careers_url)
            if not careers_err and careers_text and len(careers_text) > 200:
                result['is_hiring'] = True
                result['pages_tried'].append(careers_url)
                break
            time.sleep(0.2)
    
    return result


def build_icp_record(row: dict, enrichment: dict) -> dict:
    """Build a record dict for compute_icp_score from DB row + enrichment."""
    employees = enrichment.get('employees') or row.get('linkedin_employees') or row.get('bvd_employees')
    description = enrichment.get('description') or row.get('description') or ''
    
    return {
        'company_name': row.get('company_name', ''),
        'domain': row.get('domain', ''),
        'website': row.get('website', ''),
        'description': description,
        'products': '',
        'employees': employees,
        'revenue_th': row.get('revenue_th_usd'),
        'state': enrichment.get('state') or row.get('state'),
        'sic_code': _safe_int(row.get('sic_code')),
        'entity_type': row.get('entity_type', ''),
        'date_of_inc': row.get('date_of_incorporation', ''),
        'accelerator_backed': bool(row.get('accelerator')),
        'recently_funded': False,
        'is_hiring': enrichment.get('is_hiring', False),
        'is_nonprofit': False,
        'is_crypto': False,
        'dm_email': row.get('dm_email', ''),
        'dm_name': row.get('dm_name', ''),
        'vibe': {'score': 30, 'is_parked': False, 'is_coming_soon': False},
    }


def _safe_int(val) -> int | None:
    try:
        return int(val) if val is not None else None
    except (ValueError, TypeError):
        return None


def log(f_log, message: str):
    """Write to log file and print."""
    print(message)
    f_log.write(message + '\n')
    f_log.flush()


def main():
    # Setup log file
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Connect DB
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.row_factory = sqlite3.Row
    
    # Query companies
    rows = conn.execute("""
        SELECT domain, company_name, description, icp_score, icp_grade, icp_signals,
               linkedin_employees, bvd_employees, revenue_th_usd, state, sic_code,
               entity_type, date_of_incorporation, accelerator, dm_email, dm_name,
               tech_stack, website_signals, website
        FROM companies
        WHERE enrichment_status = 'queue_import' AND icp_grade = 'B'
        ORDER BY icp_score DESC
    """).fetchall()
    
    total = len(rows)
    
    with open(LOG_PATH, 'w') as f_log:
        log(f_log, f"# Grade B Enrichment Log")
        log(f_log, f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        log(f_log, f"Total companies: {total}")
        log(f_log, "")
        
        stats = {
            'total': total,
            'enriched': 0,
            'promoted_to_a': 0,
            'still_b': 0,
            'demoted': 0,
            'failed_fetch': 0,
        }
        
        BATCH_SIZE = 20
        
        for batch_start in range(0, total, BATCH_SIZE):
            batch = rows[batch_start:batch_start + BATCH_SIZE]
            batch_num = batch_start // BATCH_SIZE + 1
            log(f_log, f"## Batch {batch_num} ({batch_start+1}–{min(batch_start+BATCH_SIZE, total)} of {total})")
            
            for i, row in enumerate(batch):
                domain = row['domain']
                company_name = row['company_name']
                existing_desc = row['description'] or ''
                
                log(f_log, f"  [{batch_start+i+1}/{total}] {company_name} ({domain})")
                
                # Enrich
                try:
                    enrichment = enrich_company(domain, existing_desc)
                except Exception as e:
                    log(f_log, f"    ⚠ Exception: {e}")
                    enrichment = {'domain': domain, 'fetch_status': f'exception_{e}', 'employees': None,
                                  'description': None, 'state': None, 'is_hiring': False,
                                  'tech_stack': [], 'has_api_docs': False, 'pages_tried': []}
                
                fetch_ok = enrichment['fetch_status'] == 'ok'
                
                if not fetch_ok:
                    log(f_log, f"    ✗ Fetch failed: {enrichment['fetch_status']}")
                    stats['failed_fetch'] += 1
                    # Still mark as website_enriched (tried, failed)
                    conn.execute("""
                        UPDATE companies SET enrichment_status = 'website_enriched', last_updated = ?
                        WHERE domain = ?
                    """, (datetime.now().isoformat(), domain))
                    conn.commit()
                    continue
                
                # Build update values - only overwrite if we have better data
                update_fields = {}
                
                emp = enrichment.get('employees')
                if emp and emp > 0:
                    update_fields['linkedin_employees'] = emp
                
                new_desc = enrichment.get('description')
                if new_desc and (not existing_desc or len(new_desc) > len(existing_desc)):
                    update_fields['description'] = new_desc
                
                new_state = enrichment.get('state')
                if new_state and not row['state']:
                    update_fields['state'] = new_state
                
                # Build website_signals JSON
                ws_signals = {
                    'is_hiring': enrichment.get('is_hiring', False),
                    'has_api_docs': enrichment.get('has_api_docs', False),
                    'pages_tried': enrichment.get('pages_tried', []),
                    'tech_stack': enrichment.get('tech_stack', []),
                }
                update_fields['website_signals'] = json.dumps(ws_signals)
                update_fields['enrichment_status'] = 'website_enriched'
                update_fields['last_updated'] = datetime.now().isoformat()
                
                # Also update tech_stack if found and empty
                if enrichment.get('tech_stack') and not row['tech_stack']:
                    update_fields['tech_stack'] = json.dumps(enrichment['tech_stack'])
                
                # Update hiring signal
                if enrichment.get('is_hiring'):
                    update_fields['hiring_signal'] = 'yes'
                
                # Build SET clause
                set_clause = ', '.join(f'{k} = ?' for k in update_fields)
                values = list(update_fields.values()) + [domain]
                conn.execute(f"UPDATE companies SET {set_clause} WHERE domain = ?", values)
                conn.commit()
                
                # Rescore with ICP model
                # Re-read the row with updated values for accurate scoring
                updated_row = dict(row)
                if 'linkedin_employees' in update_fields:
                    updated_row['linkedin_employees'] = update_fields['linkedin_employees']
                if 'description' in update_fields:
                    updated_row['description'] = update_fields['description']
                if 'state' in update_fields:
                    updated_row['state'] = update_fields['state']
                
                icp_record = build_icp_record(updated_row, enrichment)
                icp_result = compute_icp_score(icp_record)
                
                new_score = icp_result['icp_score']
                new_grade = icp_result['grade']
                new_signals = json.dumps(icp_result['signals'])
                dq_reason = icp_result.get('dq_reason')
                
                # If DQ, grade becomes 'DQ'
                if dq_reason:
                    new_grade = 'DQ'
                
                conn.execute("""
                    UPDATE companies SET icp_score = ?, icp_grade = ?, icp_signals = ?, icp_dq_reason = ?
                    WHERE domain = ?
                """, (new_score, new_grade, new_signals, dq_reason, domain))
                conn.commit()
                
                # Track stats
                stats['enriched'] += 1
                old_grade = 'B'
                if new_grade == 'A':
                    stats['promoted_to_a'] += 1
                    log(f_log, f"    ⬆ PROMOTED to A! score={new_score}, emp={emp}")
                elif new_grade == 'B':
                    stats['still_b'] += 1
                    log(f_log, f"    ✓ Still B, score={new_score}, emp={emp or '?'}, hiring={enrichment.get('is_hiring')}")
                elif new_grade == 'DQ':
                    stats['demoted'] += 1
                    log(f_log, f"    ✗ DQ: {dq_reason}")
                else:
                    stats['demoted'] += 1
                    log(f_log, f"    ↓ Demoted to {new_grade}, score={new_score}")
                
                # Small delay between fetches to be polite
                time.sleep(0.5)
            
            log(f_log, f"\n  Batch {batch_num} complete. Running totals: enriched={stats['enriched']}, promoted={stats['promoted_to_a']}, failed={stats['failed_fetch']}")
            log(f_log, "")
            
            # Brief pause between batches
            time.sleep(2)
        
        # Final summary
        log(f_log, "## Final Results")
        log(f_log, f"Total: {stats['total']}")
        log(f_log, f"Enriched: {stats['enriched']}")
        log(f_log, f"Promoted to A: {stats['promoted_to_a']}")
        log(f_log, f"Still B: {stats['still_b']}")
        log(f_log, f"Demoted: {stats['demoted']}")
        log(f_log, f"Failed fetch: {stats['failed_fetch']}")
        log(f_log, f"Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Write results JSON
    with open(RESULTS_PATH, 'w') as f:
        json.dump(stats, f, indent=2)
    
    print(f"\n✅ Done. Results written to {RESULTS_PATH}")
    conn.close()


if __name__ == '__main__':
    main()
