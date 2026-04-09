#!/usr/bin/env python3
"""HubSpot dedup check for Session 5 - Grade A and Grade B companies."""
import json
import sqlite3
import os

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
DB_PATH = os.path.join(WORKSPACE, "jordan.ai/pipeline/master.db")
HUBSPOT_PATH = os.path.join(WORKSPACE, "jordan.ai/overnight/shared/hubspot_domains_current.json")
RESULTS_PATH = os.path.join(WORKSPACE, "jordan.ai/overnight/session_5/hubspot_dedup_results.json")
SUMMARY_PATH = os.path.join(WORKSPACE, "jordan.ai/overnight/session_5/hubspot_dedup_summary.md")

def normalize_domain(d):
    """Strip www., lowercase, strip trailing dots/slashes."""
    if not d:
        return ""
    d = d.lower().strip().rstrip("/").rstrip(".")
    if d.startswith("www."):
        d = d[4:]
    return d

def get_base_domain(d):
    """Get domain without TLD for fuzzy matching."""
    parts = d.split(".")
    if len(parts) >= 2:
        return parts[0]  # just the name part
    return d

# Load HubSpot domains
with open(HUBSPOT_PATH) as f:
    hubspot_raw = json.load(f)

hubspot_normalized = set()
hubspot_bases = set()
for d in hubspot_raw:
    nd = normalize_domain(d)
    if nd:
        hubspot_normalized.add(nd)
        hubspot_bases.add(get_base_domain(nd))

print(f"HubSpot domains loaded: {len(hubspot_raw)} raw, {len(hubspot_normalized)} normalized unique")

# Connect to DB
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Grade A check
cur.execute("SELECT domain, company_name FROM companies WHERE icp_grade = 'A'")
grade_a_rows = cur.fetchall()

grade_a_dupes = []
grade_a_fuzzy = []

for row in grade_a_rows:
    domain = row["domain"]
    name = row["company_name"] or domain
    nd = normalize_domain(domain)
    
    if nd in hubspot_normalized:
        grade_a_dupes.append({"domain": domain, "company_name": name, "match_type": "exact"})
    elif get_base_domain(nd) in hubspot_bases and nd not in hubspot_normalized:
        # Fuzzy match - base domain matches but full domain doesn't
        grade_a_fuzzy.append({"domain": domain, "company_name": name, "match_type": "fuzzy_base"})

print(f"\nGrade A: {len(grade_a_rows)} total")
print(f"  Exact matches: {len(grade_a_dupes)}")
print(f"  Fuzzy matches (base domain): {len(grade_a_fuzzy)}")

# Grade B check
cur.execute("SELECT domain, company_name FROM companies WHERE icp_score >= 70 AND icp_grade = 'B'")
grade_b_rows = cur.fetchall()

grade_b_dupes = []
grade_b_fuzzy = []

for row in grade_b_rows:
    domain = row["domain"]
    name = row["company_name"] or domain
    nd = normalize_domain(domain)
    
    if nd in hubspot_normalized:
        grade_b_dupes.append({"domain": domain, "company_name": name, "match_type": "exact"})
    elif get_base_domain(nd) in hubspot_bases and nd not in hubspot_normalized:
        grade_b_fuzzy.append({"domain": domain, "company_name": name, "match_type": "fuzzy_base"})

print(f"\nGrade B (score >= 70): {len(grade_b_rows)} total")
print(f"  Exact matches: {len(grade_b_dupes)}")
print(f"  Fuzzy matches (base domain): {len(grade_b_fuzzy)}")

# DQ exact matches in DB
dq_count = 0
for item in grade_a_dupes + grade_b_dupes:
    cur.execute("""
        UPDATE companies 
        SET in_hubspot = 1, icp_grade = 'DQ', icp_dq_reason = 'in_hubspot' 
        WHERE domain = ?
    """, (item["domain"],))
    dq_count += cur.rowcount

conn.commit()
print(f"\nDQ'd {dq_count} companies (exact matches only)")

# Write results JSON
results = {
    "grade_a_dupes": grade_a_dupes,
    "grade_a_fuzzy": grade_a_fuzzy,
    "grade_b_dupes": grade_b_dupes,
    "grade_b_fuzzy": grade_b_fuzzy,
    "total_removed": dq_count,
    "summary": {
        "grade_a_total": len(grade_a_rows),
        "grade_a_exact_matches": len(grade_a_dupes),
        "grade_a_fuzzy_matches": len(grade_a_fuzzy),
        "grade_b_total": len(grade_b_rows),
        "grade_b_exact_matches": len(grade_b_dupes),
        "grade_b_fuzzy_matches": len(grade_b_fuzzy),
        "hubspot_domains_count": len(hubspot_normalized)
    }
}

with open(RESULTS_PATH, "w") as f:
    json.dump(results, f, indent=2)

# Write summary markdown
summary_lines = [
    "# HubSpot Dedup Check — Session 5",
    "",
    "## Summary",
    "",
    f"- **HubSpot domains loaded:** {len(hubspot_normalized):,}",
    f"- **Grade A companies checked:** {len(grade_a_rows):,}",
    f"- **Grade B (score ≥ 70) checked:** {len(grade_b_rows):,}",
    "",
    "## Results",
    "",
    f"| Category | Exact Matches | Fuzzy Matches | DQ'd |",
    f"|----------|--------------|---------------|------|",
    f"| Grade A  | {len(grade_a_dupes)} | {len(grade_a_fuzzy)} | {len(grade_a_dupes)} |",
    f"| Grade B  | {len(grade_b_dupes)} | {len(grade_b_fuzzy)} | {len(grade_b_dupes)} |",
    f"| **Total** | **{len(grade_a_dupes) + len(grade_b_dupes)}** | **{len(grade_a_fuzzy) + len(grade_b_fuzzy)}** | **{dq_count}** |",
    "",
    "## Action Taken",
    "",
    f"- **{dq_count} companies DQ'd** (exact domain matches set to `icp_grade='DQ'`, `icp_dq_reason='in_hubspot'`, `in_hubspot=1`)",
    "- Fuzzy matches logged but NOT auto-DQ'd (require manual review)",
    "",
]

if grade_a_dupes:
    summary_lines.append("## Grade A Exact Duplicates (DQ'd)")
    summary_lines.append("")
    summary_lines.append("| Domain | Company |")
    summary_lines.append("|--------|---------|")
    for item in grade_a_dupes:
        summary_lines.append(f"| {item['domain']} | {item['company_name']} |")
    summary_lines.append("")

if grade_a_fuzzy:
    summary_lines.append("## Grade A Fuzzy Matches (Review Needed)")
    summary_lines.append("")
    summary_lines.append("| Domain | Company |")
    summary_lines.append("|--------|---------|")
    for item in grade_a_fuzzy[:20]:  # cap at 20 for readability
        summary_lines.append(f"| {item['domain']} | {item['company_name']} |")
    if len(grade_a_fuzzy) > 20:
        summary_lines.append(f"| ... | *({len(grade_a_fuzzy) - 20} more)* |")
    summary_lines.append("")

if grade_b_dupes:
    summary_lines.append("## Grade B Exact Duplicates (DQ'd)")
    summary_lines.append("")
    summary_lines.append("| Domain | Company |")
    summary_lines.append("|--------|---------|")
    for item in grade_b_dupes:
        summary_lines.append(f"| {item['domain']} | {item['company_name']} |")
    summary_lines.append("")

with open(SUMMARY_PATH, "w") as f:
    f.write("\n".join(summary_lines))

print(f"\nResults written to: {RESULTS_PATH}")
print(f"Summary written to: {SUMMARY_PATH}")

conn.close()
