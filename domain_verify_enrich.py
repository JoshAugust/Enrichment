#!/usr/bin/env python3
"""
Domain Verification + Re-enrichment Pipeline

For every company missing data after Apollo pass:
1. Follow HTTP redirects to find the canonical domain
2. If domain differs, re-query Apollo with the canonical domain
3. Update master.db with results + store canonical_domain for future use

Also catches: parked domains, dead sites, for-sale pages → marks as DQ candidates.
"""
import sqlite3
import requests
import json
import time
import sys
import os
from urllib.parse import urlparse

DB = "jordan.ai/pipeline/master.db"
APOLLO_KEY = "0P_stg_vxXj5xNdrCrRXbA"
LOG = "jordan.ai/domain_verify_log.jsonl"
PROGRESS = "jordan.ai/domain_verify_progress.json"

SKIP_TLDS = {'.vercel.app', '.framer.app', '.streamlit.app', '.netlify.app', '.herokuapp.com', '.webflow.io'}
DEAD_SIGNALS = ['domain is for sale', 'buy this domain', 'parked domain', 'godaddy', 'dan.com', 
                'sedo.com', 'afternic', 'hugedomains', 'this domain', 'coming soon', 'under construction',
                'squarespace', 'wix.com/site-not-found']

def follow_redirects(domain, timeout=8):
    """Follow redirects and return canonical domain + status."""
    for scheme in ['https', 'http']:
        try:
            r = requests.head(f"{scheme}://{domain}", timeout=timeout, allow_redirects=True, 
                            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
            final_url = r.url
            final_domain = urlparse(final_url).netloc.replace('www.', '').lower()
            return {
                'status': r.status_code,
                'final_domain': final_domain,
                'redirected': final_domain != domain.replace('www.', '').lower(),
                'final_url': final_url
            }
        except requests.exceptions.SSLError:
            continue
        except requests.exceptions.ConnectionError:
            return {'status': 0, 'final_domain': domain, 'redirected': False, 'error': 'connection_refused'}
        except requests.exceptions.Timeout:
            return {'status': 0, 'final_domain': domain, 'redirected': False, 'error': 'timeout'}
        except Exception as e:
            return {'status': 0, 'final_domain': domain, 'redirected': False, 'error': str(e)[:100]}
    return {'status': 0, 'final_domain': domain, 'redirected': False, 'error': 'all_schemes_failed'}

def check_dead_site(domain, timeout=8):
    """Quick check if site is parked/dead/for-sale."""
    try:
        r = requests.get(f"https://{domain}", timeout=timeout, 
                        headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'},
                        allow_redirects=True)
        text = r.text[:5000].lower()
        for signal in DEAD_SIGNALS:
            if signal in text:
                return signal
    except:
        pass
    return None

def apollo_enrich(domain):
    """Get Apollo org data for a domain."""
    r = requests.get("https://api.apollo.io/api/v1/organizations/enrich",
                    headers={"X-Api-Key": APOLLO_KEY},
                    params={"domain": domain})
    if r.status_code == 200:
        return r.json().get("organization") or {}
    return {}

def main():
    conn = sqlite3.connect(DB, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    cur = conn.cursor()
    
    # Get target companies: Grade A+B, missing employee data, already attempted by Apollo
    grade = sys.argv[1] if len(sys.argv) > 1 else 'A'
    cur.execute(f"""SELECT domain, company_name FROM companies 
        WHERE icp_grade = ? 
        AND (linkedin_employees IS NULL OR linkedin_employees = '')
        ORDER BY icp_score DESC""", (grade,))
    rows = cur.fetchall()
    
    # Filter out platform domains
    companies = [(d, n) for d, n in rows if not any(d.endswith(s) for s in SKIP_TLDS)]
    
    # Load progress
    progress = {'completed': 0, 'enriched': 0, 'redirected': 0, 'dead': 0, 'errors': 0, 'done': []}
    if os.path.exists(PROGRESS):
        try:
            saved = json.load(open(PROGRESS))
            progress.update(saved)
        except:
            pass
    done_set = set(progress.get('done', []))
    companies = [(d, n) for d, n in companies if d not in done_set]
    
    print(f"=== Domain Verify + Re-enrich: Grade {grade} ===")
    print(f"Resuming from {len(done_set)}. {len(companies)} remaining.\n")
    
    for i, (domain, name) in enumerate(companies):
        entry = {'domain': domain, 'name': name, 'ts': time.strftime('%Y-%m-%dT%H:%M:%S')}
        
        # Step 1: Follow redirects
        redir = follow_redirects(domain)
        entry['redirect'] = redir
        
        if redir.get('error') == 'connection_refused' or redir.get('status') == 0:
            # Site might be dead — quick content check
            dead = check_dead_site(domain)
            if dead or redir.get('error') == 'connection_refused':
                entry['dead_signal'] = dead or redir.get('error')
                entry['action'] = 'dead_candidate'
                progress['dead'] += 1
        
        # Step 2: If redirected, try Apollo with canonical domain
        enriched = False
        if redir.get('redirected') and redir['final_domain'] != domain:
            canonical = redir['final_domain']
            entry['canonical_domain'] = canonical
            progress['redirected'] += 1
            
            data = apollo_enrich(canonical)
            if data and data.get('estimated_num_employees'):
                entry['apollo_data'] = {
                    'emp': data['estimated_num_employees'],
                    'rev': data.get('annual_revenue_printed'),
                    'year': data.get('founded_year'),
                    'industry': data.get('industry'),
                    'city': data.get('city'),
                    'state': data.get('state'),
                    'source_domain': canonical
                }
                enriched = True
                
                # Update DB
                updates = [f"linkedin_employees = {data['estimated_num_employees']}"]
                if data.get('annual_revenue') and data['annual_revenue'] > 0:
                    rev_th = data['annual_revenue'] / 1000
                    updates.append(f"revenue_th_usd = CASE WHEN revenue_th_usd IS NULL THEN {rev_th} ELSE revenue_th_usd END")
                if data.get('founded_year'):
                    updates.append(f"date_of_incorporation = CASE WHEN date_of_incorporation IS NULL OR date_of_incorporation = '' THEN '{data['founded_year']}' ELSE date_of_incorporation END")
                if data.get('industry'):
                    updates.append(f"apollo_industry = CASE WHEN apollo_industry IS NULL OR apollo_industry = '' THEN '{data['industry'].replace(chr(39), chr(39)*2)}' ELSE apollo_industry END")
                
                updates.append(f"enrichment_sources = COALESCE(enrichment_sources,'') || ',apollo_redirect'")
                cur.execute(f"UPDATE companies SET {', '.join(updates)} WHERE domain = ?", (domain,))
                conn.commit()
        
        # Step 3: Even without redirect, retry Apollo (might have been a transient failure)
        if not enriched and not redir.get('redirected'):
            data = apollo_enrich(domain)
            if data and data.get('estimated_num_employees'):
                entry['apollo_retry'] = {
                    'emp': data['estimated_num_employees'],
                    'rev': data.get('annual_revenue_printed'),
                    'year': data.get('founded_year'),
                }
                enriched = True
                
                updates = [f"linkedin_employees = {data['estimated_num_employees']}"]
                if data.get('annual_revenue') and data['annual_revenue'] > 0:
                    rev_th = data['annual_revenue'] / 1000
                    updates.append(f"revenue_th_usd = CASE WHEN revenue_th_usd IS NULL THEN {rev_th} ELSE revenue_th_usd END")
                if data.get('founded_year'):
                    updates.append(f"date_of_incorporation = CASE WHEN date_of_incorporation IS NULL OR date_of_incorporation = '' THEN '{data['founded_year']}' ELSE date_of_incorporation END")
                if data.get('industry'):
                    updates.append(f"apollo_industry = CASE WHEN apollo_industry IS NULL OR apollo_industry = '' THEN '{data['industry'].replace(chr(39), chr(39)*2)}' ELSE apollo_industry END")
                
                updates.append(f"enrichment_sources = COALESCE(enrichment_sources,'') || ',apollo_retry'")
                cur.execute(f"UPDATE companies SET {', '.join(updates)} WHERE domain = ?", (domain,))
                conn.commit()
        
        if enriched:
            progress['enriched'] += 1
            entry['action'] = 'enriched'
        
        # Log
        with open(LOG, 'a') as f:
            f.write(json.dumps(entry) + '\n')
        
        progress['completed'] += 1
        progress['done'].append(domain)
        progress['last_domain'] = domain
        progress['last_update'] = time.strftime('%Y-%m-%dT%H:%M:%S')
        
        if progress['completed'] % 25 == 0:
            json.dump(progress, open(PROGRESS, 'w'), indent=2)
            pct = progress['enriched'] / progress['completed'] * 100 if progress['completed'] else 0
            print(f"[{progress['completed']}] ✅{progress['enriched']} 🔄{progress['redirected']} 💀{progress['dead']} | {pct:.0f}% enriched | last: {domain}")
        
        # Rate limit: 300ms between calls
        time.sleep(0.3)
    
    json.dump(progress, open(PROGRESS, 'w'), indent=2)
    print(f"\n=== DONE === Processed:{progress['completed']} Enriched:{progress['enriched']} Redirected:{progress['redirected']} Dead:{progress['dead']}")
    conn.close()

if __name__ == '__main__':
    main()
