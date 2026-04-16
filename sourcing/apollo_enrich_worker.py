#!/usr/bin/env python3
"""
Apollo enrichment worker for sourced domains.
Usage: python3 apollo_enrich_worker.py <worker_id> <total_workers>
Splits the unenriched sourced domains evenly across workers.
"""
import sqlite3, requests, json, time, sys, os

WORKER_ID = int(sys.argv[1]) if len(sys.argv) > 1 else 0
TOTAL_WORKERS = int(sys.argv[2]) if len(sys.argv) > 2 else 1

DB = "jordan.ai/pipeline/master.db"
API_KEY = "0P_stg_vxXj5xNdrCrRXbA"
HEADERS = {"X-Api-Key": API_KEY}
ENRICH_URL = "https://api.apollo.io/api/v1/organizations/enrich"
PROGRESS_FILE = f"jordan.ai/sourcing/logs/apollo_worker_{WORKER_ID}_progress.json"

SKIP_TLDS = ('.vercel.app', '.framer.app', '.streamlit.app', '.netlify.app', '.herokuapp.com', '.webflow.io', '.github.io', '.gitlab.io', '.pages.dev')

def main():
    conn = sqlite3.connect(DB, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    
    # Get all unenriched sourced domains
    rows = conn.execute(
        """SELECT rowid, domain FROM companies 
           WHERE source LIKE 'sourcing_%' 
           AND apollo_name IS NULL 
           AND linkedin_employees IS NULL
           ORDER BY rowid"""
    ).fetchall()
    
    # Split by worker
    my_rows = [(rid, dom) for i, (rid, dom) in enumerate(rows) if i % TOTAL_WORKERS == WORKER_ID]
    
    skip_count = sum(1 for _, d in my_rows if any(d.endswith(t) for t in SKIP_TLDS))
    work_rows = [(rid, dom) for rid, dom in my_rows if not any(dom.endswith(t) for t in SKIP_TLDS)]
    
    total = len(work_rows)
    print(f"Worker {WORKER_ID}/{TOTAL_WORKERS}: {total} domains to enrich (skipping {skip_count} platform TLDs)")
    
    processed = 0
    enriched = 0
    no_data = 0
    errors = 0
    
    for i, (rowid, domain) in enumerate(work_rows):
        try:
            r = requests.get(ENRICH_URL, headers=HEADERS, params={"domain": domain}, timeout=10)
            
            if r.status_code == 429:
                print(f"  Rate limited at {i}, backing off 60s...")
                time.sleep(60)
                r = requests.get(ENRICH_URL, headers=HEADERS, params={"domain": domain}, timeout=10)
            
            if r.status_code == 200:
                org = r.json().get("organization") or {}
                if org:
                    emp = org.get("estimated_num_employees")
                    rev = org.get("annual_revenue")
                    year = org.get("founded_year")
                    industry = org.get("industry")
                    city = org.get("city")
                    state = org.get("state")
                    phone = org.get("phone")
                    name = org.get("name")
                    desc = org.get("short_description") or org.get("description")
                    linkedin = org.get("linkedin_url")
                    
                    conn.execute("""UPDATE companies SET 
                        linkedin_employees=?, revenue_th_usd=?, date_of_incorporation=?,
                        apollo_industry=?, state=?, apollo_phone=?, apollo_name=?,
                        description=COALESCE(?, description)
                        WHERE rowid=?""",
                        (emp, (rev/1000 if rev else None), str(year) if year else None,
                         industry, f"{city}, {state}" if city and state else (state or city),
                         phone, name, desc, rowid))
                    enriched += 1
                else:
                    no_data += 1
            else:
                errors += 1
            
            processed += 1
            
            # Commit every 100
            if processed % 100 == 0:
                conn.commit()
                progress = {"worker": WORKER_ID, "total": total, "processed": processed, 
                           "enriched": enriched, "no_data": no_data, "errors": errors,
                           "pct": round(processed/total*100, 1)}
                with open(PROGRESS_FILE, "w") as f:
                    json.dump(progress, f)
                print(f"  Worker {WORKER_ID}: {processed}/{total} ({progress['pct']}%) — {enriched} enriched")
            
            # Rate limit: ~170/min across all workers, so ~42/min per worker with 4 workers
            time.sleep(0.35)
            
        except Exception as e:
            errors += 1
            if processed % 100 == 0:
                print(f"  Error on {domain}: {e}")
    
    conn.commit()
    conn.close()
    
    final = {"worker": WORKER_ID, "total": total, "processed": processed,
             "enriched": enriched, "no_data": no_data, "errors": errors, "status": "complete"}
    with open(PROGRESS_FILE, "w") as f:
        json.dump(final, f)
    
    print(f"\nWorker {WORKER_ID} COMPLETE: {enriched}/{total} enriched ({no_data} no data, {errors} errors)")

if __name__ == "__main__":
    main()
