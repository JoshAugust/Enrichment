#!/usr/bin/env python3
"""Batch 2: Enterprise, DevTools, FinTech, Cybersecurity, Healthcare."""
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

def clean_domain(url):
    url = url.strip()
    if not url.startswith('http'): url = 'https://' + url
    try:
        parsed = urlparse(url)
        domain = (parsed.netloc or parsed.path).lower().strip()
        if domain.startswith('www.'): domain = domain[4:]
        return domain.split('/')[0].split(':')[0].split('?')[0]
    except: return None

added = 0
def add(domain, name, source, category="saas", metadata=None):
    global added
    domain = clean_domain(domain)
    if not domain or domain in existing or domain in written: return
    with open(OUTPUT, 'a') as f:
        f.write(json.dumps({"domain": domain, "name": name, "source": source, "category": category, "metadata": metadata or {}}) + '\n')
    written.add(domain)
    added += 1
    print(f"ADDED: {domain}")

# Enterprise Software (new ones not in SaaS pages)
for d, n in [
    ("adaptivesecurity.com", "Adaptive Security"),
    ("opal.dev", "Opal"),
    ("joyfulhealth.com", "Joyful Health"),
    ("omnea.co", "Omnea"),
    ("listenlabs.ai", "Listen Labs"),
    ("temporal.io", "Temporal"),
    ("appliedintuition.com", "Applied Intuition"),
    ("cyera.io", "Cyera"),
    ("cresta.com", "Cresta"),
    ("decagon.ai", "Decagon"),
    ("cortex.io", "Cortex"),
    ("ema.co", "Ema"),
    ("watershedclimate.com", "Watershed"),
    ("rasa.com", "Rasa"),
    ("squint.ai", "Squint"),
]:
    add(d, n, "topstartups", "enterprise_software")

# Developer Tools (new)
for d, n in [
    ("joinpogo.com", "Pogo"),
    ("doppel.com", "Doppel"),
    ("joinblossomhealth.com", "Blossom Health"),
    ("rivan.com", "Rivan Industries"),
    ("traba.work", "Traba"),
    ("ambiencehealthcare.com", "Ambience Healthcare"),
    ("vanta.com", "Vanta"),
]:
    add(d, n, "topstartups", "saas")

# FinTech
for d, n in [
    ("kalshi.com", "Kalshi"),
    ("camber.health", "Camber Health"),
    ("pomelo.com", "Pomelo"),
    ("moov.io", "Moov"),
    ("truv.com", "Truv"),
    ("tryjeeves.com", "Jeeves"),
    ("roofstock.com", "Roofstock"),
    ("mos.com", "Mos"),
    ("cointracker.io", "CoinTracker"),
    ("anchorage.com", "Anchorage"),
    ("capital.xyz", "Capital"),
    ("starkware.co", "StarkWare"),
]:
    add(d, n, "topstartups", "fintech")

# Healthcare
for d, n in [
    ("vivodyne.com", "Vivodyne"),
    ("newlimit.com", "NewLimit"),
    ("sprinterhealth.com", "Sprinter Health"),
    ("radai.com", "Rad AI"),
    ("qventus.com", "Qventus"),
    ("formation.bio", "Formation Bio"),
    ("freenome.com", "Freenome"),
]:
    add(d, n, "topstartups", "healthcare_saas")

print(f"\nBatch 2 total: {added}")
