#!/usr/bin/env python3
"""
Import + ICP Score runner for overnight sourcing queue.
Imports new_companies_queue.jsonl into master.db, then scores all new imports.
"""

import json
import sqlite3
import sys
import os
from datetime import datetime

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai"
QUEUE_FILE = f"{WORKSPACE}/overnight/shared/new_companies_queue.jsonl"
DB_FILE = f"{WORKSPACE}/pipeline/master.db"
HUBSPOT_FILE = f"{WORKSPACE}/overnight/shared/hubspot_domains_current.json"
RESULTS_FILE = f"{WORKSPACE}/overnight/session_1/import_score_results.json"
REPORT_FILE = f"{WORKSPACE}/overnight/session_1/import_score_report.md"

# Add pipeline to path for icp_score_v1
sys.path.insert(0, f"{WORKSPACE}/pipeline")
from icp_score_v1 import compute_icp_score

CHUNK_SIZE = 500

def get_connection():
    conn = sqlite3.connect(DB_FILE, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    conn.row_factory = sqlite3.Row
    return conn

def load_queue():
    companies = []
    with open(QUEUE_FILE, 'r') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    companies.append(json.loads(line))
                except json.JSONDecodeError as e:
                    print(f"[WARN] Bad JSON line: {e}")
    return companies

def load_hubspot_domains():
    with open(HUBSPOT_FILE, 'r') as f:
        data = json.load(f)
    # Could be a list of domains or a dict with a domains key
    if isinstance(data, list):
        return set(d.lower().strip() for d in data if d)
    elif isinstance(data, dict):
        # Try common keys
        for key in ['domains', 'data', 'companies']:
            if key in data:
                val = data[key]
                if isinstance(val, list):
                    return set(d.lower().strip() for d in val if d)
        # Fallback: collect all string values
        domains = set()
        for v in data.values():
            if isinstance(v, str):
                domains.add(v.lower().strip())
            elif isinstance(v, list):
                for item in v:
                    if isinstance(item, str):
                        domains.add(item.lower().strip())
        return domains
    return set()

def get_existing_domains(conn):
    cursor = conn.execute("SELECT domain FROM companies WHERE domain IS NOT NULL")
    return set(row[0].lower().strip() for row in cursor.fetchall())

def import_chunk(conn, chunk, existing_domains):
    """Insert a chunk of companies. Returns (imported, skipped) counts."""
    imported = 0
    skipped = 0
    
    rows_to_insert = []
    for company in chunk:
        domain = (company.get('domain') or '').lower().strip()
        if not domain:
            skipped += 1
            continue
        if domain in existing_domains:
            skipped += 1
            continue
        
        # Map employees field
        emp = company.get('employees')
        bvd_employees = None
        linkedin_employees = None
        if emp is not None:
            try:
                emp_int = int(emp)
                # Can't tell source, store in bvd_employees as default
                bvd_employees = emp_int
            except (ValueError, TypeError):
                pass
        
        rows_to_insert.append((
            domain,
            company.get('company_name'),
            company.get('description'),
            company.get('source'),  # original_source
            company.get('state'),
            bvd_employees,
            linkedin_employees,
            'queue_import',
            datetime.utcnow().isoformat(),
        ))
        existing_domains.add(domain)
        imported += 1
    
    if rows_to_insert:
        conn.executemany("""
            INSERT INTO companies 
                (domain, company_name, description, original_source, state, 
                 bvd_employees, linkedin_employees, enrichment_status, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, rows_to_insert)
        conn.commit()
    
    return imported, skipped

def score_new_companies(conn, hubspot_domains, new_domains):
    """Score all newly imported companies. Returns grade stats dict."""
    stats = {'A': 0, 'B': 0, 'C': 0, 'DQ': 0, 'errors': 0}
    
    # Process in chunks of CHUNK_SIZE
    new_domain_list = list(new_domains)
    total = len(new_domain_list)
    processed = 0
    
    for chunk_start in range(0, total, CHUNK_SIZE):
        chunk_domains = new_domain_list[chunk_start:chunk_start + CHUNK_SIZE]
        
        # Fetch all in chunk
        placeholders = ','.join(['?' for _ in chunk_domains])
        cursor = conn.execute(
            f"SELECT * FROM companies WHERE domain IN ({placeholders})",
            chunk_domains
        )
        rows = cursor.fetchall()
        
        updates = []
        for row in rows:
            try:
                row_dict = dict(row)
                domain = row_dict.get('domain', '')
                
                # Build record for compute_icp_score
                emp = row_dict.get('bvd_employees') or row_dict.get('linkedin_employees')
                
                record = {
                    'company_name': row_dict.get('company_name', ''),
                    'domain': domain,
                    'description': row_dict.get('description', '') or '',
                    'products': '',
                    'employees': emp,
                    'revenue_th': row_dict.get('revenue_th_usd'),
                    'state': row_dict.get('state'),
                    'sic_code': None,
                    'vibe': {},
                    'dm_email': row_dict.get('dm_email'),
                    'dm_name': row_dict.get('dm_name'),
                    'accelerator_backed': bool(row_dict.get('accelerator')),
                    'recently_funded': False,
                    'is_hiring': False,
                    'is_nonprofit': False,
                    'is_crypto': False,
                }
                
                # Check HubSpot membership
                if domain.lower() in hubspot_domains:
                    score_result = {
                        'icp_score': 0,
                        'grade': 'DQ',
                        'dq_reason': 'in_hubspot',
                        'signals': ['hubspot_existing'],
                    }
                else:
                    score_result = compute_icp_score(record)
                
                icp_score = score_result.get('icp_score', 0)
                icp_grade = score_result.get('grade', 'DQ')
                icp_dq_reason = score_result.get('dq_reason')
                icp_signals = json.dumps(score_result.get('signals', []) + score_result.get('flags', []))
                
                updates.append((icp_score, icp_grade, icp_dq_reason, icp_signals, domain))
                
                grade_key = icp_grade if icp_grade in ('A', 'B', 'C') else 'DQ'
                stats[grade_key] += 1
                
            except Exception as e:
                stats['errors'] += 1
                print(f"[ERROR] Scoring {row_dict.get('domain', '?')}: {e}")
        
        # Batch update
        if updates:
            conn.executemany("""
                UPDATE companies 
                SET icp_score=?, icp_grade=?, icp_dq_reason=?, icp_signals=?
                WHERE domain=?
            """, updates)
            conn.commit()
        
        processed += len(chunk_domains)
        if processed % 1000 == 0 or processed == total:
            print(f"[SCORE] Progress: {processed}/{total} scored")
    
    return stats

def main():
    print(f"[START] {datetime.utcnow().isoformat()}")
    
    # Load input data
    print("[LOAD] Reading queue...")
    queue = load_queue()
    print(f"[LOAD] {len(queue)} companies in queue")
    
    print("[LOAD] Reading HubSpot domains...")
    hubspot_domains = load_hubspot_domains()
    print(f"[LOAD] {len(hubspot_domains)} HubSpot domains loaded")
    
    # Import phase
    conn = get_connection()
    
    print("[IMPORT] Fetching existing domains from DB...")
    existing_domains = get_existing_domains(conn)
    print(f"[IMPORT] {len(existing_domains)} domains already in DB")
    
    total_imported = 0
    total_skipped = 0
    newly_imported_domains = set()
    
    for chunk_start in range(0, len(queue), CHUNK_SIZE):
        chunk = queue[chunk_start:chunk_start + CHUNK_SIZE]
        imported, skipped = import_chunk(conn, chunk, existing_domains)
        
        # Track newly imported domains for scoring
        for c in chunk:
            d = (c.get('domain') or '').lower().strip()
            if d and d in existing_domains:
                # Check if it was newly added (imported in this run, not pre-existing)
                pass
        
        total_imported += imported
        total_skipped += skipped
        
        if (chunk_start + CHUNK_SIZE) % 1000 < CHUNK_SIZE:
            print(f"[IMPORT] Progress: {chunk_start + len(chunk)}/{len(queue)} processed | imported={total_imported} skipped={total_skipped}")
    
    # Re-fetch newly imported domains (those with enrichment_status = 'queue_import' and no icp_grade)
    print("[SCORE] Identifying newly imported companies to score...")
    cursor = conn.execute(
        "SELECT domain FROM companies WHERE enrichment_status = 'queue_import' AND (icp_grade IS NULL OR icp_grade = '')"
    )
    newly_imported_domains = set(row[0] for row in cursor.fetchall() if row[0])
    print(f"[SCORE] {len(newly_imported_domains)} companies need scoring")
    
    # Score phase
    grade_stats = score_new_companies(conn, hubspot_domains, newly_imported_domains)
    
    conn.close()
    
    # Summary stats
    results = {
        "imported": total_imported,
        "skipped_existing": total_skipped,
        "grade_a": grade_stats['A'],
        "grade_b": grade_stats['B'],
        "grade_c": grade_stats['C'],
        "dq": grade_stats['DQ'],
        "errors": grade_stats['errors'],
        "timestamp": datetime.utcnow().isoformat(),
    }
    
    with open(RESULTS_FILE, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"[DONE] Results written to {RESULTS_FILE}")
    
    # Human report
    total_scored = results['grade_a'] + results['grade_b'] + results['grade_c'] + results['dq']
    report = f"""# ICP Import & Score Report
**Run:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

## Import Summary
| Metric | Count |
|--------|-------|
| Queue size | {len(queue)} |
| Imported (new) | {results['imported']} |
| Skipped (existing) | {results['skipped_existing']} |

## ICP Scoring Summary
| Grade | Count | % of scored |
|-------|-------|-------------|
| A (75+) | {results['grade_a']} | {results['grade_a']/max(total_scored,1)*100:.1f}% |
| B (50-74) | {results['grade_b']} | {results['grade_b']/max(total_scored,1)*100:.1f}% |
| C (25-49) | {results['grade_c']} | {results['grade_c']/max(total_scored,1)*100:.1f}% |
| DQ (<25 or disqualified) | {results['dq']} | {results['dq']/max(total_scored,1)*100:.1f}% |
| Errors | {results['errors']} | — |
| **Total scored** | **{total_scored}** | |

## Notes
- Data sparsity is expected: most queue imports have no employee or revenue data
- Companies with no tech signal score lower or are DQ'd
- HubSpot dedup applied: existing customers excluded from scoring
- All newly imported companies have `enrichment_status = 'queue_import'`
"""
    
    with open(REPORT_FILE, 'w') as f:
        f.write(report)
    print(f"[DONE] Report written to {REPORT_FILE}")
    
    print("\n=== FINAL RESULTS ===")
    print(json.dumps(results, indent=2))
    
    return results

if __name__ == '__main__':
    main()
