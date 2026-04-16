#!/usr/bin/env python3
"""Bulk insert sourced domains into master.db with source tracking."""
import sqlite3, json, os, glob

DB = "jordan.ai/pipeline/master.db"
WAVE_DIRS = ["jordan.ai/sourcing/wave1", "jordan.ai/sourcing/wave2"]

def main():
    conn = sqlite3.connect(DB, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=5000")
    
    # Get existing domains
    existing = set(r[0] for r in conn.execute("SELECT domain FROM companies").fetchall())
    print(f"Existing domains in DB: {len(existing)}")
    
    inserted = 0
    dupes = 0
    by_source = {}
    
    for wave_dir in WAVE_DIRS:
        for fpath in sorted(glob.glob(os.path.join(wave_dir, "*.jsonl"))):
            file_count = 0
            with open(fpath) as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        d = json.loads(line)
                        domain = d.get("domain", "").lower().strip()
                        if not domain or domain in existing:
                            dupes += 1
                            continue
                        
                        name = d.get("name", "")
                        source = d.get("source", "sourcing_unknown")
                        category = d.get("category", "")
                        meta = d.get("metadata", {})
                        
                        # Build original_source with full provenance
                        original_source = f"sourcing_{source}"
                        if category:
                            original_source += f"_{category}"
                        
                        conn.execute(
                            """INSERT INTO companies (domain, company_name, source, original_source, description)
                               VALUES (?, ?, ?, ?, ?)""",
                            (domain, name, f"sourcing_{source}", original_source, 
                             json.dumps(meta) if meta else None)
                        )
                        existing.add(domain)
                        inserted += 1
                        file_count += 1
                        
                        src_key = source
                        by_source[src_key] = by_source.get(src_key, 0) + 1
                        
                    except json.JSONDecodeError:
                        continue
                    except sqlite3.IntegrityError:
                        dupes += 1
                        continue
            
            print(f"  {os.path.basename(fpath)}: +{file_count} inserted")
    
    conn.commit()
    conn.close()
    
    print(f"\n=== SUMMARY ===")
    print(f"Inserted: {inserted}")
    print(f"Duplicates skipped: {dupes}")
    print(f"\nBy source:")
    for s, c in sorted(by_source.items(), key=lambda x: -x[1]):
        print(f"  {s}: {c}")
    
    # Write summary for agents
    with open("jordan.ai/sourcing/insert_summary.json", "w") as f:
        json.dump({"inserted": inserted, "dupes": dupes, "by_source": by_source}, f, indent=2)

if __name__ == "__main__":
    main()
