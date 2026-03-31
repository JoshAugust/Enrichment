#!/usr/bin/env python3
"""Merge all Orange Slice enrichment into DealScope v3."""
import json, openpyxl

INPUT = '/Users/corgi12/.eragon-joshua_augustine/media/inbound/DealScope_Enriched_v2---05dd34c5-7497-4f48-b7de-d013dd65535e.xlsx'
OUTPUT = '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/DealScope_Enriched_v3.xlsx'

with open('sweep-final-results.json') as f:
    data = json.load(f)

phones_data = data['phones']
contacts_data = data['contactsLI']

# Build lookups
company_phone_lookup = {}
for name, info in phones_data.items():
    if info.get('found') and info.get('phone'):
        company_phone_lookup[name.upper().strip()] = info['phone']

# Also include Phase 1 results from earlier run
with open('enrich-results.json') as f:
    earlier = json.load(f)
for name, info in earlier.get('phoneResults', {}).items():
    if info.get('phone'):
        company_phone_lookup[name.upper().strip()] = info['phone']

contact_lookup = {}
for name, info in contacts_data.items():
    if info.get('found'):
        contact_lookup[name.strip()] = {
            'emails': info.get('emails', []),
            'phones': info.get('phones', []),
        }

print(f"Company phones to merge: {len(company_phone_lookup)}")
print(f"Contact enrichments to merge: {len(contact_lookup)}")

wb = openpyxl.load_workbook(INPUT)

# === ENRICHED LEADS ===
ws = wb['Enriched Leads']
headers = [ws.cell(row=1, column=c).value for c in range(1, ws.max_column+1)]
coname_col = headers.index('Company Name') + 1
cname_col = headers.index('Contact Name') + 1
phone_col = headers.index('Direct Phone') + 1
phone_src_col = headers.index('Phone Source') + 1
email_col = headers.index('Email Address') + 1
email_type_col = headers.index('Email Type') + 1
email_src_col = headers.index('Email Source') + 1

phones_added = 0
emails_added = 0

for r in range(2, ws.max_row+1):
    company = str(ws.cell(row=r, column=coname_col).value or '').upper().strip()
    contact = str(ws.cell(row=r, column=cname_col).value or '').strip()
    current_phone = ws.cell(row=r, column=phone_col).value
    current_email_type = ws.cell(row=r, column=email_type_col).value
    
    # Merge company phone if no phone exists
    if not current_phone and company in company_phone_lookup:
        ws.cell(row=r, column=phone_col, value=company_phone_lookup[company])
        ws.cell(row=r, column=phone_src_col, value='Google Maps via Orange Slice (2026)')
        phones_added += 1
    
    # Merge contact enrichment
    if contact in contact_lookup:
        ci = contact_lookup[contact]
        
        # Add personal phone if we don't have one yet (prefer personal over company)
        if ci['phones'] and not current_phone:
            ws.cell(row=r, column=phone_col, value=ci['phones'][0])
            ws.cell(row=r, column=phone_src_col, value='Orange Slice person.contact (2026)')
            phones_added += 1
        elif ci['phones'] and current_phone:
            # We have a company phone but now have a personal one - upgrade
            ws.cell(row=r, column=phone_col, value=ci['phones'][0])
            ws.cell(row=r, column=phone_src_col, value='Orange Slice person.contact (2026)')
        
        # Add personal email if we only had company fallback
        if ci['emails'] and current_email_type != 'Personal':
            ws.cell(row=r, column=email_col, value=ci['emails'][0])
            ws.cell(row=r, column=email_type_col, value='Personal')
            ws.cell(row=r, column=email_src_col, value='Orange Slice verified (2026)')
            emails_added += 1

print(f"Enriched Leads: +{phones_added} phones, +{emails_added} personal emails")

# === COMPANY SUMMARY ===
ws2 = wb['Company Summary']
h2 = [ws2.cell(row=1, column=c).value for c in range(1, ws2.max_column+1)]
cn2 = h2.index('Company Name') + 1
ap2 = h2.index('All Phones') + 1 if 'All Phones' in h2 else None

summary_phones = 0
if ap2:
    for r in range(2, ws2.max_row+1):
        company = str(ws2.cell(row=r, column=cn2).value or '').upper().strip()
        current = ws2.cell(row=r, column=ap2).value
        if (not current or current == 'None') and company in company_phone_lookup:
            ws2.cell(row=r, column=ap2, value=company_phone_lookup[company])
            summary_phones += 1

print(f"Company Summary: +{summary_phones} phones")

wb.save(OUTPUT)

# Final stats
total = ws.max_row - 1
has_phone = sum(1 for r in range(2, ws.max_row+1) if ws.cell(row=r, column=phone_col).value)
has_personal_email = sum(1 for r in range(2, ws.max_row+1) if ws.cell(row=r, column=email_type_col).value == 'Personal')
print(f"\n{'='*50}")
print(f"FINAL v3 STATS")
print(f"{'='*50}")
print(f"Total contacts: {total}")
print(f"Phone coverage: {has_phone}/{total} ({has_phone*100//total}%)")
print(f"Personal email: {has_personal_email}/{total} ({has_personal_email*100//total}%)")
print(f"\nSaved to {OUTPUT}")
