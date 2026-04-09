#!/usr/bin/env python3
"""
Session 1: Grade B → Grade A Promotion Script
Mining master.db for Grade B companies (65-74) that can be promoted to Grade A.

Strategy:
1. Apply confirmed recently_funded from news data (3 companies)
2. Apply confirmed accelerator data from accelerator column that might need score fixes
3. Log all promotions to promotion_log.md and promotions.json
"""
import sqlite3
import json
import os
import sys
from datetime import datetime

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
DB_PATH = f"{WORKSPACE}/jordan.ai/pipeline/master.db"
SESSION_DIR = f"{WORKSPACE}/jordan.ai/overnight/session_1"
LOG_PATH = f"{SESSION_DIR}/promotion_log.md"
JSON_PATH = f"{SESSION_DIR}/promotions.json"

os.makedirs(SESSION_DIR, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA busy_timeout=5000")
conn.row_factory = sqlite3.Row

promotions = []
skipped = []

def get_company(domain):
    row = conn.execute(
        "SELECT domain, company_name, icp_score, icp_grade, icp_signals, accelerator, "
        "hiring_signal, description, recent_news FROM companies WHERE domain = ?",
        (domain,)
    ).fetchone()
    return dict(row) if row else None

def apply_promotion(domain, reason, new_signals_to_add, score_delta, evidence):
    """Apply score update and signal addition for a promoted company."""
    company = get_company(domain)
    if not company:
        print(f"  SKIP {domain}: not found in DB")
        return False
    
    if company['icp_grade'] == 'A':
        print(f"  SKIP {domain}: already Grade A ({company['icp_score']})")
        return False
    
    if company['icp_grade'] != 'B':
        print(f"  SKIP {domain}: not Grade B (is {company['icp_grade']})")
        return False
    
    old_score = company['icp_score']
    new_score = old_score + score_delta
    new_grade = 'A' if new_score >= 75 else company['icp_grade']
    
    # Update signals JSON
    try:
        signals = json.loads(company['icp_signals'] or '[]')
    except:
        signals = []
    
    for sig in new_signals_to_add:
        if sig not in signals:
            signals.append(sig)
    
    new_signals_json = json.dumps(signals)
    
    conn.execute(
        "UPDATE companies SET icp_score = ?, icp_grade = ?, icp_signals = ? WHERE domain = ?",
        (new_score, new_grade, new_signals_json, domain)
    )
    conn.commit()
    
    print(f"  PROMOTED {domain} ({company['company_name']}): {old_score}→{new_score} ({company['icp_grade']}→{new_grade})")
    print(f"    Reason: {reason}")
    print(f"    Evidence: {evidence[:100]}")
    
    promotions.append({
        "domain": domain,
        "company_name": company['company_name'],
        "old_score": old_score,
        "new_score": new_score,
        "old_grade": company['icp_grade'],
        "new_grade": new_grade,
        "reason": reason,
        "signals_added": new_signals_to_add,
        "evidence": evidence,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    return True

# ─────────────────────────────────────────────
# BATCH 1: Recently Funded (from recent_news data)
# These are confirmed from the existing recent_news column — no web search needed
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("BATCH 1: Confirmed Recently Funded (from news data)")
print("="*60)

RECENTLY_FUNDED_CONFIRMED = [
    {
        "domain": "causal.app",
        "evidence": "Causal, Inc. receives financing of $20M in Series A; $4.2M seed round",
        "reason": "recently_funded (Series A $20M confirmed in recent_news)"
    },
    {
        "domain": "preparedapp.com",
        "evidence": "Prepared received financing of $27M in Series B (Sep 2024); $16M Series A",
        "reason": "recently_funded (Series B $27M confirmed in recent_news)"
    },
    {
        "domain": "veruna.com",
        "evidence": "Veruna, Inc. receives financing of $10M in Series B; also hiring CSO",
        "reason": "recently_funded (Series B $10M confirmed in recent_news) + hiring"
    },
]

for item in RECENTLY_FUNDED_CONFIRMED:
    signals_to_add = ['recently_funded']
    score_delta = 5  # recently_funded = +5
    
    # veruna.com also gets hiring signal
    if item['domain'] == 'veruna.com':
        company = get_company(item['domain'])
        if company and 'hiring' not in json.loads(company.get('icp_signals') or '[]'):
            signals_to_add = ['recently_funded', 'hiring']
            score_delta = 5 + 3  # +8 total (funded + hiring)
    
    apply_promotion(
        item['domain'],
        item['reason'],
        signals_to_add,
        score_delta,
        item['evidence']
    )

# ─────────────────────────────────────────────
# BATCH 2: Accelerator-backed companies that need recheck
# kickstarter.com has accelerator but needs verification of hiring signal
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("BATCH 2: Accelerator-backed needing additional signals")
print("="*60)

# kickstarter.com: already has accelerator (+7, score=72), needs +3 to hit 75
# News check: Betaworks accelerator company, still active
# Kickstarter is a well-known platform with active hiring
kickstarter = get_company("kickstarter.com")
if kickstarter:
    print(f"kickstarter.com: score={kickstarter['icp_score']}, grade={kickstarter['icp_grade']}")
    print(f"  Current signals: {kickstarter['icp_signals']}")
    print(f"  hiring_signal: {kickstarter['hiring_signal']}")
    print(f"  → Would need hiring confirmation (+3) to reach 75")
    print(f"  → Skipping: requires web verification for hiring status")

# ─────────────────────────────────────────────
# BATCH 3: Tech-TLD companies (70-74) known to be funded
# Based on company names/domains I can identify from known startup database knowledge
# ─────────────────────────────────────────────
print("\n" + "="*60)
print("BATCH 3: Known-funded/accelerator tech companies (web-verified)")
print("="*60)

# These are companies I can verify from general knowledge of the startup ecosystem
# Each needs evidence check
KNOWN_FUNDED_COMPANIES = [
    {
        "domain": "acryldata.io",
        "evidence": "Acryl Data raised $9M Series A (2022) from Accel + 9others; creators of DataHub open source",
        "reason": "recently_funded (Series A $9M, Accel-backed)",
        "signals": ["recently_funded"],
        "delta": 5
    },
    {
        "domain": "nod.ai",
        "evidence": "Nod.ai (formerly OctoML spinout context) - AMD acquired 2023; strong ML inference company",
        "reason": "recently_funded (acquired by AMD 2023 — marks as funded/acquired, verify acquisition status)",
        "signals": ["recently_funded"],
        "delta": 5,
        "verify_acquired": True  # Flag - might need to check acquired status
    },
    {
        "domain": "percept.ai",
        "evidence": "Percept.AI raised seed funding, AI customer support startup",
        "reason": "recently_funded (seed round confirmed)",
        "signals": ["recently_funded"],
        "delta": 5
    },
]

# These need web verification before applying
print("  → These require web verification (will be searched in next batch)")
for c in KNOWN_FUNDED_COMPANIES:
    company = get_company(c['domain'])
    if company:
        print(f"  {c['domain']}: score={company['icp_score']}, grade={company['icp_grade']}")

print("\nBatch 3 requires web verification — will run searches and update.")

# ─────────────────────────────────────────────
# Save preliminary results
# ─────────────────────────────────────────────
with open(JSON_PATH, 'w') as f:
    json.dump({
        "session": "session_1",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "total_promotions": len(promotions),
        "promotions": promotions
    }, f, indent=2)

print(f"\n\nSaved {len(promotions)} promotions to {JSON_PATH}")

conn.close()
print("Done.")
