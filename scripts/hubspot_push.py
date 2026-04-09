#!/usr/bin/env python3
"""Push 3,200 leads to HubSpot as companies, assign to Taslim."""

import json, csv, time, sys, os
from urllib.request import urlopen, Request
from urllib.error import HTTPError

WORKSPACE = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace'
CONFIG = json.load(open(f'{WORKSPACE}/.config/hubspot/config.json'))
TOKEN = CONFIG['access_token']
CSV_PATH = f'{WORKSPACE}/jordan.ai/pipeline/top_leads_3200.csv'
CHECKPOINT = f'{WORKSPACE}/jordan.ai/pipeline/hubspot_push_v2_checkpoint.json'
OUTPUT = f'{WORKSPACE}/jordan.ai/pipeline/hubspot_push_results_v2.json'

TASLIM_ID = '163487374'
BATCH_SIZE = 100
DELAY = 1.5

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
        body = e.read().decode()[:500]
        return {'error': body}, e.code

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
    
    # Revenue: thousands → millions
    rev = clean_val(row.get('Revenue (th USD)', ''))
    if rev:
        try:
            rev_m = float(rev) / 1000
            if rev_m > 0:
                props['annual_revenue_usd_m'] = str(round(rev_m, 3))
        except: pass
    
    # LinkedIn employees
    emp = clean_val(row.get('LinkedIn Employees', ''))
    if emp:
        try:
            props['employee_estimate'] = str(int(float(emp)))
        except: pass
    
    return props

# Load checkpoint
state = {'processed': 0, 'created': 0, 'updated': 0, 'errors': 0, 'error_details': []}
if os.path.exists(CHECKPOINT):
    state = json.load(open(CHECKPOINT))
    print(f"Resuming from {state['processed']}")

# Load CSV
rows = list(csv.DictReader(open(CSV_PATH)))
print(f"Total rows: {len(rows)}")

start = state['processed']
remaining = rows[start:]
print(f"Starting from {start}, {len(remaining)} to go")

for i in range(0, len(remaining), BATCH_SIZE):
    batch = remaining[i:i+BATCH_SIZE]
    inputs = []
    for row in batch:
        domain = clean_val(row.get('Domain', ''))
        if not domain:
            continue
        props = map_company(row)
        inputs.append({
            'idProperty': 'domain',
            'id': domain,
            'properties': props
        })
    
    if not inputs:
        continue
    
    resp, status = api_call('POST', '/crm/v3/objects/companies/batch/upsert', {'inputs': inputs})
    
    if status == 200:
        results = resp.get('results', [])
        for r in results:
            if r.get('new', False) or r.get('createdAt') == r.get('updatedAt'):
                state['created'] += 1
            else:
                state['updated'] += 1
    elif status == 207:
        # partial success
        for r in resp.get('results', []):
            state['updated'] += 1
        for e in resp.get('errors', []):
            state['errors'] += 1
            state['error_details'].append(str(e)[:200])
    else:
        state['errors'] += len(inputs)
        state['error_details'].append(f"Batch {start+i}: {status} {str(resp)[:300]}")
        print(f"ERROR batch {start+i}: {status}")
    
    state['processed'] = start + i + len(batch)
    
    if state['processed'] % 500 == 0 or state['processed'] >= len(rows):
        with open(CHECKPOINT, 'w') as f:
            json.dump(state, f)
        print(f"{state['processed']}/{len(rows)} | created:{state['created']} updated:{state['updated']} errors:{state['errors']}")
        sys.stdout.flush()
    
    time.sleep(DELAY)

# Final save
with open(CHECKPOINT, 'w') as f:
    json.dump(state, f)

results = {
    'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'portal_id': '244821378',
    'owner': f'Taslim Ahmed ({TASLIM_ID})',
    'total_processed': state['processed'],
    'created': state['created'],
    'updated': state['updated'],
    'errors': state['errors'],
    'total_assigned_to_taslim': state['created'] + state['updated'],
    'error_details': state['error_details'][:10]
}
with open(OUTPUT, 'w') as f:
    json.dump(results, f, indent=2)

print(f"\n=== DONE ===")
print(f"Processed: {state['processed']}")
print(f"Created: {state['created']}")
print(f"Updated: {state['updated']}")  
print(f"Errors: {state['errors']}")
print(f"Total assigned to Taslim: {state['created'] + state['updated']}")
