#!/usr/bin/env python3
import json, os
from urllib.parse import urlparse

EXISTING = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/shared/existing_domains.txt"
OUTPUT = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/sourcing/wave2/jobboard_domains.jsonl"

with open(EXISTING) as f:
    existing = set(line.strip().lower() for line in f if line.strip())
written = set()
if os.path.exists(OUTPUT):
    with open(OUTPUT) as f:
        for line in f:
            try: written.add(json.loads(line)['domain'].lower())
            except: pass

added = 0
def add(domain, name, source="topstartups", category="saas", metadata=None):
    global added
    d = domain.lower().strip()
    if d.startswith('www.'): d = d[4:]
    d = d.split('/')[0].split('?')[0]
    if not d or d in existing or d in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": d, "name": name, "source": source, "category": category, "metadata": metadata or {}}) + '\n')
    written.add(d)
    added += 1
    print(f"ADDED: {d}")

# Enterprise Software pages 3-6 (new ones only)
for d, n in [
    ("forwardnetworks.com", "Forward Networks"),
    ("patch.io", "Patch"),
    ("hibob.com", "HiBob"),
    ("tecton.ai", "Tecton"),
    ("pave.com", "Pave"),
    ("go1.com", "GO1"),
    ("devo.com", "Devo"),
    ("imply.io", "Imply"),
    ("acuitymd.com", "AcuityMD"),
    ("lilt.com", "Lilt"),
    ("ironcladapp.com", "Ironclad"),
    ("labelbox.com", "Labelbox"),
    ("mixhalo.com", "Mixhalo"),
    ("planetscale.com", "PlanetScale"),
    ("podium.com", "Podium"),
    ("density.io", "Density"),
    ("letsdeel.com", "Deel"),
    # Developer Tools page 1 (new)
    ("adaptivesecurity.com", "Adaptive Security"),
    ("temporal.io", "Temporal"),
    ("appliedintuition.com", "Applied Intuition"),
    ("cortex.io", "Cortex"),
    # Healthcare (new)
    ("sprinterhealth.com", "Sprinter Health"),
    # Cybersecurity (new)
    ("doppel.com", "Doppel"),
]:
    add(d, n)

print(f"\nBatch 3 total: {added}")
