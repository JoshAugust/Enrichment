#!/usr/bin/env python3
"""Push 3,200 leads to HubSpot. Search by domain first, then create or update."""

import json, csv, time, sys, os
from urllib.request import urlopen, Request
from urllib.error import HTTPError

WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace'
CONFIG = json.load(open(f'{WORKSPACE}/.config/hubspot/config.json'))
TOKEN = CONFIG['access_token']
CSV_PATH = f'{WORKSPACE}/jordan.ai/pipeline/top_leads_3200.csv'
CHECKPOINT = f'{WORKSPACE}/jordan.ai/pipeline/hubspot_push_v3_checkpoint.json'
OUTPUT = f'{WORKSPACE}/jordan.ai/pipeline/hubspot_push_results_v2.json'

TASLIM_ID = '163487374'
DELAY = 0.15  # 100 req/10s = 10 req/s, so 0.1s minimum

def api_call(method, path, body=None):
    url = f'https://api.hubapi.com{path}'
    data = json.dumps(body).encode() if body else None
    req = Request(url, data=data, method=method, headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json'
    })
    try:
        with urlopen(req, timeout=30) as r:
            return json.loads(r.read()), r.status
    except HTTPError as e:
        err_body = e.read().decode()[:500]
        if e.code == 429:
            retry = int(e.headers.get('Retry-After', '10'))
            print(f"Rate limited, sleeping {retry}s")
            time.sleep(retry)
            return api_call(method, path, body)  # retry
        return {'error': err_body}, e.code

def clean_val(val):
    if not val or val.strip() in ('None', '', '0', 'N/A'):
        return None
    return val.strip()

def map_company(row):
    props = {'hubspot_owner_id': TASLIM_ID, 'lead_source': 'Jordan.ai Pipeline'}
    
    mappings = {
        'Company Name': 'name',
        'Domain': 'domain',
        'Website': 'website',
        'Company Phone': 'phone',
        'State': 'hq_state',
        'Description': 'company_description_long',
        'Blueprint Score': 'blueprint_score',
        'Grade': 'grade',
        'Vibe Score': 'vibe_score',
        'Tech Score': 'tech_score',
        'Non-Tech Score': 'non_tech_score',
        'Signals': 'signals',
        'SIC Code': 'sic_code',
        'Date of Incorporation': 'date_of_incorporation',
        'DM Name': 'lead_contact_name',
        'Hiring Signal': 'hiring_signals',
    }
    
    for csv_col, hs_prop in mappings.items():
        val = clean_val(row.get(csv_col, ''))
        if val:
            props[hs_prop] = val
    
    rev = clean_val(row.get('Revenue (th USD)', ''))
    if rev:
        try:
            rev_m = float(rev) / 1000
            if rev_m > 0:
                props['annual_revenue_usd_m'] = str(round(rev_m, 3))
        except: pass
    
    emp = clean_val(row.get('LinkedIn Employees', ''))
    if emp:
        try:
            props['employee_estimate'] = str(int(float(emp)))
        except: pass
    
    return props

def search_domain(domain):
    """Search HubSpot for a company by domain. Returns company ID or None."""
    body = {
        "filterGroups": [{"filters": [{"propertyName": "domain", "operator": "EQ", "value": domain}]}],
        "properties": ["domain", "name"],
        "limit": 1
    }
    resp, status = api_call('POST', '/crm/v3/objects/companies/search', body)
    if status == 200 and resp.get('total', 0) > 0:
        return resp['results'][0]['id']
    return None

# Load checkpoint
state = {'processed': 0, 'created': 0, 'updated': 0, 'skipped': 0, 'errors': 0, 'error_details': []}
if os.path.exists(CHECKPOINT):
    state = json.load(open(CHECKPOINT))
    print(f"Resuming from {state['processed']}")

rows = list(csv.DictReader(open(CSV_PATH)))
print(f"Total rows: {len(rows)}")

start = state['processed']
remaining = rows[start:]
print(f"Starting from {start}, {len(remaining)} to go")

for i, row in enumerate(remaining):
    domain = clean_val(row.get('Domain', ''))
    if not domain:
        state['skipped'] += 1
        state['processed'] = start + i + 1
        continue
    
    props = map_company(row)
    
    # Search for existing company
    existing_id = search_domain(domain)
    time.sleep(DELAY)
    
    if existing_id:
        # Update existing
        resp, status = api_call('PATCH', f'/crm/v3/objects/companies/{existing_id}', {'properties': props})
        if status == 200:
            state['updated'] += 1
        else:
            state['errors'] += 1
            if len(state['error_details']) < 20:
                state['error_details'].append(f"Update {domain}: {status} {str(resp)[:200]}")
    else:
        # Create new
        resp, status = api_call('POST', '/crm/v3/objects/companies', {'properties': props})
        if status in (200, 201):
            state['created'] += 1
        else:
            state['errors'] += 1
            if len(state['error_details']) < 20:
                state['error_details'].append(f"Create {domain}: {status} {str(resp)[:200]}")
    
    time.sleep(DELAY)
    state['processed'] = start + i + 1
    
    idx = state['processed']
    if idx % 100 == 0:
        with open(CHECKPOINT, 'w') as f:
            json.dump(state, f)
        print(f"{idx}/{len(rows)} | created:{state['created']} updated:{state['updated']} errors:{state['errors']}")
        sys.stdout.flush()

# Final
with open(CHECKPOINT, 'w') as f:
    json.dump(state, f)

results = {
    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'portal_id': '244821378',
    'owner': f'Taslim Ahmed ({TASLIM_ID})',
    'total_processed': state['processed'],
    'created': state['created'],
    'updated': state['updated'],
    'skipped': state['skipped'],
    'errors': state['errors'],
    'total_assigned_to_taslim': state['created'] + state['updated'],
    'error_details': state['error_details']
}
with open(OUTPUT, 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n=== DONE ===")
print(f"Created: {state['created']}")
print(f"Updated: {state['updated']}")
print(f"Errors: {state['errors']}")
print(f"Total assigned to Taslim: {state['created'] + state['updated']}")
