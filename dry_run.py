#!/usr/bin/env python3
"""Dry run - classify without patching"""
import json, sys
sys.path.insert(0, '.')

# Import classification functions from cleanup_v2
import importlib.util
spec = importlib.util.spec_from_file_location("cleanup_v2", "cleanup_v2.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

classify_lead = mod.classify_lead
categorize_industry = mod.categorize_industry

with open('all_leads.json') as f:
    all_leads = json.load(f)

to_unqualify = []
to_flag = []
already_unqualified = 0
clean = []

for lead in all_leads:
    if lead.get('status') == 'Unqualified':
        already_unqualified += 1
        continue
    action, reason = classify_lead(lead)
    if action == 'Unqualified':
        to_unqualify.append((lead, reason))
    elif action == 'Flagged':
        to_flag.append((lead, reason))
    else:
        clean.append(lead)

print(f'Total leads: {len(all_leads)}')
print(f'Would Unqualify: {len(to_unqualify)}')
print(f'Would Flag: {len(to_flag)}')
print(f'Clean (insurance agencies): {len(clean)}')
print(f'Already Unqualified: {already_unqualified}')
print()

# Industry breakdown
industry_counts = {}
for lead, reason in to_unqualify:
    cat = categorize_industry(reason)
    industry_counts[cat] = industry_counts.get(cat, 0) + 1

print('=== CONTAMINATION BREAKDOWN (to Unqualify) ===')
for cat, cnt in sorted(industry_counts.items(), key=lambda x: -x[1]):
    print(f'  {cat}: {cnt}')

print()
print('=== TO FLAG (borderline) ===')
for lead, reason in to_flag:
    print(f'  [{lead["id"][:8]}] {lead["company_name"]} — {reason[:80]}')

print()
print('=== SAMPLE UNQUALIFY (first 40) ===')
for lead, reason in to_unqualify[:40]:
    print(f'  [{lead["id"][:8]}] {lead["company_name"]} | {reason[:80]}')

print()
print('=== SAMPLE CLEAN LEADS (first 20) ===')
for lead in clean[:20]:
    spec = lead.get('specialization', '') or ''
    print(f'  [{lead["id"][:8]}] {lead["company_name"]} | {spec[:60]}')
