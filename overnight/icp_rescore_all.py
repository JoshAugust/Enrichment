#!/usr/bin/env python3
"""
Batch ICP v1 rescore of all companies in master.db.
Adds icp_score and icp_grade columns, runs heuristic scoring on everything.
"""
import sqlite3
import sys
import os
import json
import time

# Add pipeline dir to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'pipeline'))
from icp_score_v1 import compute_icp_score

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'pipeline', 'master.db')
HUBSPOT_DOMAINS_PATH = os.path.join(os.path.dirname(__file__), 'shared', 'hubspot_domains_current.json')
LOG_PATH = os.path.join(os.path.dirname(__file__), 'session_1', 'rescore_log.md')
PROGRESS_PATH = os.path.join(os.path.dirname(__file__), 'session_1', 'rescore_progress.json')

def load_hubspot_domains():
    """Load HubSpot domains for dedup."""
    if os.path.exists(HUBSPOT_DOMAINS_PATH):
        with open(HUBSPOT_DOMAINS_PATH) as f:
            return set(json.load(f))
    # Fall back to older file
    fallback = os.path.join(os.path.dirname(__file__), '..', 'data', 'hubspot_domains_fresh.json')
    if os.path.exists(fallback):
        with open(fallback) as f:
            return set(json.load(f))
    return set()

def main():
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    
    print(f"Loading HubSpot domains...")
    hs_domains = load_hubspot_domains()
    print(f"Loaded {len(hs_domains)} HubSpot domains")
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    
    # Add ICP columns if they don't exist
    existing_cols = [row[1] for row in conn.execute("PRAGMA table_info(companies)").fetchall()]
    if 'icp_score' not in existing_cols:
        conn.execute("ALTER TABLE companies ADD COLUMN icp_score INTEGER")
        print("Added icp_score column")
    if 'icp_grade' not in existing_cols:
        conn.execute("ALTER TABLE companies ADD COLUMN icp_grade TEXT")
        print("Added icp_grade column")
    if 'icp_dq_reason' not in existing_cols:
        conn.execute("ALTER TABLE companies ADD COLUMN icp_dq_reason TEXT")
        print("Added icp_dq_reason column")
    if 'icp_signals' not in existing_cols:
        conn.execute("ALTER TABLE companies ADD COLUMN icp_signals TEXT")
        print("Added icp_signals column")
    conn.commit()
    
    # Count total
    total = conn.execute("SELECT COUNT(*) FROM companies").fetchone()[0]
    print(f"Total companies to score: {total}")
    
    # Process in batches
    batch_size = 500
    offset = 0
    stats = {
        'total': total,
        'processed': 0,
        'grade_a': 0,
        'grade_b': 0,
        'grade_c': 0,
        'grade_d': 0,
        'dq': 0,
        'dq_reasons': {},
        'hubspot_skip': 0,
        'errors': 0,
        'start_time': time.time(),
    }
    
    while offset < total:
        rows = conn.execute("""
            SELECT domain, company_name, website, state, entity_type, sic_code,
                   date_of_incorporation, bvd_employees, linkedin_employees,
                   revenue_th_usd, vibe_score, vibe_signals_cached,
                   description, dm_name, dm_email, dm_phone,
                   accelerator, has_software_engineer, signals,
                   hiring_signal, tech_stack, recent_news
            FROM companies
            LIMIT ? OFFSET ?
        """, (batch_size, offset)).fetchall()
        
        if not rows:
            break
        
        updates = []
        for row in rows:
            domain = row[0]
            
            # Skip if in HubSpot
            if domain and domain.lower() in hs_domains:
                stats['hubspot_skip'] += 1
                updates.append(('DQ', 0, 'in_hubspot', '', domain))
                continue
            
            # Build record dict
            emp = row[8] or row[7]  # prefer linkedin, fall back to bvd
            rev = row[9]
            vibe_score = row[10] or 0
            vibe_signals = row[11] or ''
            
            # Parse vibe signals for parked/coming-soon
            is_parked = 'parked' in vibe_signals.lower() if vibe_signals else False
            is_coming_soon = 'coming_soon' in vibe_signals.lower() if vibe_signals else False
            
            record = {
                'company_name': row[1] or '',
                'domain': domain or '',
                'website': row[2] or '',
                'state': row[3] or '',
                'entity_type': row[4] or '',
                'sic_code': int(row[5]) if row[5] else None,
                'date_of_incorporation': row[6] or '',
                'employees': int(emp) if emp else None,
                'revenue_th': float(rev) if rev else None,
                'description': row[12] or '',
                'products': '',
                'dm_name': row[13] or '',
                'dm_email': row[14] or '',
                'dm_phone': row[15] or '',
                'vibe': {
                    'score': vibe_score,
                    'is_parked': is_parked,
                    'is_coming_soon': is_coming_soon,
                },
                'accelerator_backed': bool(row[16]),
                'recently_funded': False,
                'is_hiring': bool(row[19]),
                'is_nonprofit': False,
                'is_crypto': False,
                'is_gov_tech': False,
            }
            
            # Check for gov tech signals in description
            desc_lower = (record['description']).lower()
            if any(kw in desc_lower for kw in ['government contract', 'federal agency', 'gov tech', 'govtech', 'municipality']):
                record['is_gov_tech'] = True
            
            # Check for nonprofit
            if any(kw in desc_lower for kw in ['non-profit', 'nonprofit', '501(c)', 'charitable']):
                record['is_nonprofit'] = True
            
            # Check for crypto
            if any(kw in desc_lower for kw in ['blockchain', 'cryptocurrency', 'web3', 'defi', 'nft', 'smart contract']):
                record['is_crypto'] = True
            
            try:
                result = compute_icp_score(record)
                grade = result['grade']
                score = result['icp_score']
                dq_reason = result.get('dq_reason', '') or ''
                signals = json.dumps(result.get('signals', []))
                
                updates.append((grade, score, dq_reason, signals, domain))
                
                if grade == 'DQ':
                    stats['dq'] += 1
                    reason = dq_reason or 'unknown'
                    stats['dq_reasons'][reason] = stats['dq_reasons'].get(reason, 0) + 1
                elif grade == 'A':
                    stats['grade_a'] += 1
                elif grade == 'B':
                    stats['grade_b'] += 1
                elif grade == 'C':
                    stats['grade_c'] += 1
                else:
                    stats['grade_d'] += 1
                    
            except Exception as e:
                stats['errors'] += 1
                updates.append(('ERR', 0, str(e)[:100], '', domain))
        
        # Batch update
        conn.executemany("""
            UPDATE companies 
            SET icp_grade = ?, icp_score = ?, icp_dq_reason = ?, icp_signals = ?
            WHERE domain = ?
        """, updates)
        conn.commit()
        
        offset += batch_size
        stats['processed'] = offset
        
        if offset % 5000 == 0:
            elapsed = time.time() - stats['start_time']
            rate = offset / elapsed if elapsed > 0 else 0
            eta = (total - offset) / rate if rate > 0 else 0
            print(f"Progress: {offset}/{total} ({offset*100//total}%) | "
                  f"A:{stats['grade_a']} B:{stats['grade_b']} DQ:{stats['dq']} | "
                  f"ETA: {eta/60:.1f}min")
            
            # Save progress
            with open(PROGRESS_PATH, 'w') as f:
                json.dump(stats, f, indent=2)
    
    conn.close()
    
    # Final stats
    elapsed = time.time() - stats['start_time']
    stats['elapsed_seconds'] = elapsed
    stats['processed'] = total
    
    print(f"\n{'='*60}")
    print(f"ICP RESCORE COMPLETE")
    print(f"{'='*60}")
    print(f"Total processed: {total}")
    print(f"Time: {elapsed/60:.1f} minutes")
    print(f"")
    print(f"Grade A: {stats['grade_a']}")
    print(f"Grade B: {stats['grade_b']}")
    print(f"Grade C: {stats['grade_c']}")
    print(f"Grade D: {stats['grade_d']}")
    print(f"DQ: {stats['dq']}")
    print(f"HubSpot skip: {stats['hubspot_skip']}")
    print(f"Errors: {stats['errors']}")
    print(f"")
    print(f"Top DQ reasons:")
    for reason, count in sorted(stats['dq_reasons'].items(), key=lambda x: -x[1])[:10]:
        print(f"  {reason}: {count}")
    
    # Save final stats
    with open(PROGRESS_PATH, 'w') as f:
        json.dump(stats, f, indent=2)
    
    # Write log
    with open(LOG_PATH, 'w') as f:
        f.write(f"# Session 1 Rescore Log\n\n")
        f.write(f"## ICP v1 Rescore of {total} companies\n")
        f.write(f"- Time: {elapsed/60:.1f} minutes\n")
        f.write(f"- Grade A: {stats['grade_a']}\n")
        f.write(f"- Grade B: {stats['grade_b']}\n")
        f.write(f"- Grade C: {stats['grade_c']}\n")
        f.write(f"- Grade D: {stats['grade_d']}\n")
        f.write(f"- DQ: {stats['dq']}\n")
        f.write(f"- HubSpot dedup: {stats['hubspot_skip']}\n")
        f.write(f"- Errors: {stats['errors']}\n\n")
        f.write(f"## Top DQ Reasons\n")
        for reason, count in sorted(stats['dq_reasons'].items(), key=lambda x: -x[1])[:15]:
            f.write(f"- {reason}: {count}\n")

if __name__ == '__main__':
    main()
