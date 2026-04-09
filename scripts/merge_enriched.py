#!/usr/bin/env python3
"""Merge all enrichment phases into final CSV + summary JSON."""
import csv
import json
import os

WORKSPACE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace"
CSV_PATH = f"{WORKSPACE}/jordan.ai/pipeline/blueprint_v3_qualified.csv"
GMAPS_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_gmaps.json"
LINKEDIN_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_linkedin.json"
SIGNALS_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_signals.json"
APOLLO_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_apollo.json"
OUTPUT_CSV = f"{WORKSPACE}/jordan.ai/pipeline/top4k_enriched.csv"
SUMMARY_PATH = f"{WORKSPACE}/jordan.ai/pipeline/top4k_enrichment_summary.json"
CREDIT_LOG = f"{WORKSPACE}/jordan.ai/pipeline/apollo_credit_log.json"
TOTAL = 4000

def load_json(path):
    if os.path.exists(path):
        with open(path, "r") as f:
            return json.load(f)
    return {}

def load_csv():
    records = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= TOTAL:
                break
            records.append(row)
    return records

def main():
    records = load_csv()
    gmaps = load_json(GMAPS_PATH)
    linkedin = load_json(LINKEDIN_PATH)
    signals = load_json(SIGNALS_PATH)
    apollo = load_json(APOLLO_PATH)
    credit_log = load_json(CREDIT_LOG)
    
    print(f"Loaded: {len(records)} companies")
    print(f"GMaps: {len(gmaps)} | LinkedIn: {len(linkedin)} | Signals: {len(signals)} | Apollo: {len(apollo)}")
    
    # Stats
    stats = {
        "total_companies": len(records),
        "gmaps_phone_hits": 0,
        "linkedin_employee_hits": 0,
        "linkedin_sw_engineer_flags": 0,
        "news_hits": 0,
        "hiring_signal_hits": 0,
        "tech_stack_hits": 0,
        "social_hits": 0,
        "apollo_credits_used": credit_log.get("credits_used", 0),
        "apollo_emails_found": credit_log.get("emails_found", 0),
        "apollo_phones_found": credit_log.get("phones_found", 0),
        "final_email_coverage": 0,
        "final_phone_coverage": 0,
        "final_has_sw_engineer": 0,
    }
    
    OUTPUT_COLUMNS = [
        "Company Name", "Website", "Domain", "State", "Employees", "Revenue (th USD)", "Description",
        "Blueprint Score", "Grade", "Vibe Score", "Tech Score", "Non-Tech Score", "Signals",
        "DM Name", "DM Title", "DM Email", "DM Phone", "DM LinkedIn",
        "Contact 2 Name", "Contact 2 Title", "Contact 2 Email", "Contact 2 Phone", "Contact 2 LinkedIn",
        "Contact 3 Name", "Contact 3 Title", "Contact 3 Email", "Contact 3 Phone", "Contact 3 LinkedIn",
        "Company Phone", "LinkedIn Employees", "Has Software Engineer",
        "Recent News", "Hiring Signal", "Tech Stack", "Twitter", "GitHub",
        "Source", "Entity Type", "SIC Code", "Date of Incorporation",
        "Enrichment Sources",
    ]
    
    rows = []
    email_count = 0
    phone_count = 0
    sw_eng_count = 0
    
    for rec in records:
        domain = rec["Domain"]
        g = gmaps.get(domain, {})
        l = linkedin.get(domain, {})
        s = signals.get(domain, {})
        a = apollo.get(domain, {})
        
        enrichment_sources = []
        
        # Company phone: prefer GMaps, fallback Apollo
        company_phone = g.get("phone") or ""
        if company_phone:
            stats["gmaps_phone_hits"] += 1
            enrichment_sources.append("gmaps")
        
        # LinkedIn data
        li_employees = l.get("linkedin_employees") or ""
        has_sw = l.get("has_software_engineer", False)
        if li_employees:
            stats["linkedin_employee_hits"] += 1
            enrichment_sources.append("linkedin")
        if has_sw:
            stats["linkedin_sw_engineer_flags"] += 1
            sw_eng_count += 1
        
        # Signals
        news = s.get("news", [])
        hiring = s.get("hiring", {})
        tech_stack = s.get("tech_stack", [])
        social = s.get("social", {})
        
        if news:
            stats["news_hits"] += 1
            enrichment_sources.append("news")
        if hiring.get("open_roles", 0) > 0:
            stats["hiring_signal_hits"] += 1
            enrichment_sources.append("hiring")
        if tech_stack:
            stats["tech_stack_hits"] += 1
            enrichment_sources.append("tech")
        if social.get("twitter") or social.get("github"):
            stats["social_hits"] += 1
            enrichment_sources.append("social")
        
        # Contacts: start with DM from CSV, then Apollo
        dm_name = rec.get("DM Name", "")
        dm_title = rec.get("DM Title", "")
        dm_email = rec.get("DM Email", "")
        dm_phone = ""
        dm_linkedin = ""
        
        contacts_2 = {"name": "", "title": "", "email": "", "phone": "", "linkedin": ""}
        contacts_3 = {"name": "", "title": "", "email": "", "phone": "", "linkedin": ""}
        
        apollo_contacts = a.get("contacts", [])
        if apollo_contacts:
            enrichment_sources.append("apollo")
            
            # If DM has no email, try to fill from Apollo
            if not dm_email and apollo_contacts:
                c = apollo_contacts[0]
                if c.get("email"):
                    dm_email = c["email"]
                if c.get("phone"):
                    dm_phone = c["phone"]
                if c.get("linkedin"):
                    dm_linkedin = c["linkedin"]
                # If Apollo found a better contact, use their name/title
                if c.get("name") and not dm_name:
                    dm_name = c["name"]
                    dm_title = c.get("title", "")
                apollo_contacts = apollo_contacts[1:]
            
            if len(apollo_contacts) >= 1:
                c = apollo_contacts[0]
                contacts_2 = {
                    "name": c.get("name", ""),
                    "title": c.get("title", ""),
                    "email": c.get("email", ""),
                    "phone": c.get("phone", ""),
                    "linkedin": c.get("linkedin", ""),
                }
            if len(apollo_contacts) >= 2:
                c = apollo_contacts[1]
                contacts_3 = {
                    "name": c.get("name", ""),
                    "title": c.get("title", ""),
                    "email": c.get("email", ""),
                    "phone": c.get("phone", ""),
                    "linkedin": c.get("linkedin", ""),
                }
        
        # Track coverage
        any_email = dm_email or contacts_2["email"] or contacts_3["email"]
        any_phone = company_phone or dm_phone or contacts_2["phone"] or contacts_3["phone"]
        if any_email:
            email_count += 1
        if any_phone:
            phone_count += 1
        
        row = {
            "Company Name": rec.get("Company Name", ""),
            "Website": rec.get("Website", ""),
            "Domain": domain,
            "State": rec.get("State", ""),
            "Employees": rec.get("Employees", ""),
            "Revenue (th USD)": rec.get("Revenue (th USD)", ""),
            "Description": rec.get("Description", ""),
            "Blueprint Score": rec.get("Blueprint Score", ""),
            "Grade": rec.get("Grade", ""),
            "Vibe Score": rec.get("Vibe Score", ""),
            "Tech Score": rec.get("Tech Score", ""),
            "Non-Tech Score": rec.get("Non-Tech Score", ""),
            "Signals": rec.get("Signals", ""),
            "DM Name": dm_name,
            "DM Title": dm_title,
            "DM Email": dm_email,
            "DM Phone": dm_phone,
            "DM LinkedIn": dm_linkedin,
            "Contact 2 Name": contacts_2["name"],
            "Contact 2 Title": contacts_2["title"],
            "Contact 2 Email": contacts_2["email"],
            "Contact 2 Phone": contacts_2["phone"],
            "Contact 2 LinkedIn": contacts_2["linkedin"],
            "Contact 3 Name": contacts_3["name"],
            "Contact 3 Title": contacts_3["title"],
            "Contact 3 Email": contacts_3["email"],
            "Contact 3 Phone": contacts_3["phone"],
            "Contact 3 LinkedIn": contacts_3["linkedin"],
            "Company Phone": company_phone,
            "LinkedIn Employees": str(li_employees) if li_employees else "",
            "Has Software Engineer": "TRUE" if has_sw else "FALSE",
            "Recent News": "; ".join(news[:5]),
            "Hiring Signal": str(hiring.get("open_roles", 0)),
            "Tech Stack": ", ".join(tech_stack),
            "Twitter": social.get("twitter", "") or "",
            "GitHub": social.get("github", "") or "",
            "Source": rec.get("Source", ""),
            "Entity Type": rec.get("Entity Type", ""),
            "SIC Code": rec.get("SIC Code", ""),
            "Date of Incorporation": rec.get("Date of Incorporation", ""),
            "Enrichment Sources": ",".join(enrichment_sources),
        }
        rows.append(row)
    
    # Sort by Blueprint Score descending
    rows.sort(key=lambda r: int(r.get("Blueprint Score", 0) or 0), reverse=True)
    
    # Write CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    
    # Summary
    stats["final_email_coverage"] = f"{email_count}/{len(records)} ({email_count*100//len(records)}%)"
    stats["final_phone_coverage"] = f"{phone_count}/{len(records)} ({phone_count*100//len(records)}%)"
    stats["final_has_sw_engineer"] = f"{sw_eng_count}/{len(records)} ({sw_eng_count*100//len(records)}%)"
    
    with open(SUMMARY_PATH, "w") as f:
        json.dump(stats, f, indent=2)
    
    print(f"\n=== MERGE COMPLETE ===")
    print(f"Output: {OUTPUT_CSV}")
    print(f"Summary: {SUMMARY_PATH}")
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    main()
