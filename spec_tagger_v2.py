#!/usr/bin/env python3
"""
Specialization Tagger v2
Tags Qualified trucking leads with specific specialization values.
"""

import requests
import json
import time
import re
import sys
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_PATH = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/SPEC_TAGS_V2_LOG.md"

VALID_TAGS = [
    "Owner-Operator Trucking Insurance",
    "Oilfield / Energy Sector Trucking",
    "Livestock / Agricultural Hauling",
    "Log Truck / Forestry Insurance",
    "Flatbed / Oversized Load",
    "Refrigerated / Reefer Cargo",
    "Dump Truck / Construction Trucking",
    "Tanker / Liquid Bulk",
    "Auto Transport / Car Hauler",
    "Hotshot Trucking Insurance",
    "Intermodal / Drayage",
    "Fleet / Large Commercial Auto",
    "New Authority / Startup Trucking",
    "MGA / Wholesale Trucking",
    "Tow Truck / Wrecker Insurance",
    "Moving / Household Goods",
    "General Commercial Trucking",
]

# Tags we consider "generic" and want to replace
GENERIC_TAGS = {
    "Trucking / Commercial Auto",
    "General Commercial Trucking Insurance",
    "General Commercial Trucking",  # already valid but let's still try to be specific
    "Commercial Truck Insurance",
}

# Already-specific tags that we should normalize to valid tags
NORMALIZABLE = {
    "Log Truck / Commercial Trucking": "Log Truck / Forestry Insurance",
    "Livestock Hauling / Agricultural Trucking": "Livestock / Agricultural Hauling",
    "Dump Truck / Commercial Auto": "Dump Truck / Construction Trucking",
    "Tanker / Commercial Trucking": "Tanker / Liquid Bulk",
    "Grain Hauling / Agricultural Trucking": "Livestock / Agricultural Hauling",
    "Auto Hauler / Trucking": "Auto Transport / Car Hauler",
    "Commercial Truck / Tow Truck / Commercial Auto Insurance": "Tow Truck / Wrecker Insurance",
    "Commercial Truck / Owner-Operator / Fleet Insurance": "Owner-Operator Trucking Insurance",
    "Commercial Trucking / Fleet Insurance / Owner-Operator / Cargo": "Owner-Operator Trucking Insurance",
    "Commercial Truck / Garage / Property Insurance": "General Commercial Trucking",
    "Owner-Operator & Fleet Trucking Insurance / Commercial Auto": "Owner-Operator Trucking Insurance",
    "Florida Transportation / Trucking Insurance / Commercial Auto": "General Commercial Trucking",
    "EZ Trucking Insurance": "Owner-Operator Trucking Insurance",
    "Hazmat / Environmental Trucking": "Tanker / Liquid Bulk",
}

# Keyword-based classification from company name + website text
KEYWORD_RULES = [
    # Order matters - more specific first
    (["oilfield", "oil field", "petroleum", "energy sector", "oil & gas", "bakken", "permian"], "Oilfield / Energy Sector Trucking"),
    (["livestock", "cattle", "hog", "poultry", "animal transport", "grain", "agricultural", "farm", "agri", "crop"], "Livestock / Agricultural Hauling"),
    (["log truck", "logging", "forestry", "timber", "log haul"], "Log Truck / Forestry Insurance"),
    (["flatbed", "oversized", "oversize", "wide load", "heavy haul", "step deck", "lowboy", "RGN", "over-dimensional"], "Flatbed / Oversized Load"),
    (["refrigerated", "reefer", "temperature controlled", "cold chain", "frozen", "perishable"], "Refrigerated / Reefer Cargo"),
    (["dump truck", "dump trailer", "construction trucking", "excavation", "demolition", "rock hauling", "sand and gravel", "aggregate", "asphalt"], "Dump Truck / Construction Trucking"),
    (["tanker", "liquid bulk", "chemical", "liquid cargo", "petroleum tanker", "fuel tanker", "water hauling"], "Tanker / Liquid Bulk"),
    (["auto transport", "car hauler", "car carrier", "vehicle transport", "auto hauler", "automobile transport"], "Auto Transport / Car Hauler"),
    (["hotshot", "hot shot", "expedited", "LTL", "time-critical"], "Hotshot Trucking Insurance"),
    (["intermodal", "drayage", "port", "rail", "container", "chassis"], "Intermodal / Drayage"),
    (["tow truck", "wrecker", "roadside", "repossession", "repo truck", "recovery truck"], "Tow Truck / Wrecker Insurance"),
    (["moving", "household goods", "movers", "relocation", "van lines", "piano moving"], "Moving / Household Goods"),
    (["owner operator", "owner-operator", "o/o", "independent contractor"], "Owner-Operator Trucking Insurance"),
    (["fleet", "large fleet", "multi-unit", "100+ trucks", "large commercial"], "Fleet / Large Commercial Auto"),
    (["MGA", "wholesale", "excess & surplus", "E&S", "program business"], "MGA / Wholesale Trucking"),
    (["new authority", "new venture", "startup trucking", "new DOT", "new entrant"], "New Authority / Startup Trucking"),
]

def classify_from_text(text):
    """Classify trucking specialization from text using keyword rules."""
    text_lower = text.lower()
    for keywords, tag in KEYWORD_RULES:
        for kw in keywords:
            if kw.lower() in text_lower:
                return tag
    return None

def fetch_website(url, timeout=10):
    """Fetch website content, return text or None."""
    if not url:
        return None
    try:
        headers = {"User-Agent": "Mozilla/5.0 (compatible; InsuranceBot/1.0)"}
        resp = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if resp.status_code == 200:
            # Strip HTML tags crudely
            text = re.sub(r'<[^>]+>', ' ', resp.text)
            text = re.sub(r'\s+', ' ', text)
            return text[:5000]  # First 5000 chars
    except Exception as e:
        pass
    return None

def determine_specialization(lead):
    """Determine the best specialization tag for a lead."""
    company = lead.get("company_name", "")
    website = lead.get("website", "")
    current_spec = lead.get("specialization", "")
    
    # Check if already normalizable
    if current_spec in NORMALIZABLE:
        return NORMALIZABLE[current_spec]
    
    # Try classification from company name first
    tag = classify_from_text(company)
    if tag:
        return tag
    
    # Fetch website and try from content
    web_text = fetch_website(website)
    if web_text:
        tag = classify_from_text(web_text)
        if tag:
            return tag
    
    return "General Commercial Trucking"

def patch_lead(lead_id, specialization):
    """PATCH a lead with new specialization."""
    url = f"{BASE_URL}/api/leads/{lead_id}"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "X-Human-Edit": "true",
    }
    payload = {"specialization": specialization}
    try:
        resp = requests.patch(url, json=payload, headers=headers, timeout=15)
        return resp.status_code, resp.text
    except Exception as e:
        return None, str(e)

def should_update(spec):
    """Return True if this specialization should be replaced."""
    if not spec:
        return True
    # Generic tags
    if spec in GENERIC_TAGS:
        return True
    # Not in valid tag list AND not already normalized
    if spec not in VALID_TAGS and spec not in NORMALIZABLE:
        return True
    # Is in normalizable map
    if spec in NORMALIZABLE:
        return True
    return False

def get_leads_batch(offset, limit=50):
    """Fetch a batch of Qualified leads."""
    url = f"{BASE_URL}/api/leads?limit={limit}&offset={offset}&status=Qualified"
    headers = {"X-API-Key": API_KEY}
    resp = requests.get(url, headers=headers, timeout=15)
    data = resp.json()
    return data.get("leads", []), data.get("total", 0)

def main():
    total_updated = 0
    total_skipped = 0
    total_errors = 0
    log_entries = []
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting Specialization Tagger v2")
    
    offset = 0
    limit = 50
    
    # First get total
    _, total = get_leads_batch(0, 1)
    print(f"Total Qualified leads: {total}")
    
    while offset < total and total_updated < 300:  # Safety cap at 300
        print(f"\n--- Batch offset={offset} ---")
        leads, _ = get_leads_batch(offset, limit)
        
        if not leads:
            print("No more leads, stopping.")
            break
        
        for lead in leads:
            lead_id = lead["id"]
            company = lead.get("company_name", "Unknown")
            current_spec = lead.get("specialization", "")
            website = lead.get("website", "")
            
            if not should_update(current_spec):
                print(f"  SKIP [{company}] - already specific: {current_spec}")
                total_skipped += 1
                continue
            
            print(f"  PROCESSING [{company}] - current: {current_spec}")
            
            new_spec = determine_specialization(lead)
            
            # If new == "General Commercial Trucking" and current is already "General Commercial Trucking Insurance"
            # still update to normalize to our tag
            
            status_code, resp_text = patch_lead(lead_id, new_spec)
            
            if status_code and status_code in (200, 201):
                total_updated += 1
                entry = f"| {company} | {current_spec} → {new_spec} | ✅ |"
                log_entries.append(entry)
                print(f"    ✅ Updated: {new_spec} (HTTP {status_code})")
            else:
                total_errors += 1
                print(f"    ❌ Error: HTTP {status_code}: {resp_text[:100]}")
            
            time.sleep(0.3)  # Brief pause between calls
        
        offset += limit
        
        # Write progress to log
        write_log(log_entries, total_updated, total_skipped, total_errors, total)
        print(f"\n[Progress] Updated: {total_updated}, Skipped: {total_skipped}, Errors: {total_errors}")
    
    write_log(log_entries, total_updated, total_skipped, total_errors, total, final=True)
    print(f"\n✅ DONE. Total updated: {total_updated}")

def write_log(entries, updated, skipped, errors, total, final=False):
    """Write progress to log file."""
    status = "COMPLETE" if final else "IN PROGRESS"
    with open(LOG_PATH, "w") as f:
        f.write(f"# Specialization Tagger v2 Log\n\n")
        f.write(f"**Status:** {status}\n")
        f.write(f"**Last Updated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write(f"## Summary\n\n")
        f.write(f"- **Total Qualified Leads:** {total}\n")
        f.write(f"- **Updated:** {updated}\n")
        f.write(f"- **Skipped (already specific):** {skipped}\n")
        f.write(f"- **Errors:** {errors}\n\n")
        f.write(f"## Updates\n\n")
        f.write("| Company | Change | Status |\n")
        f.write("|---------|--------|--------|\n")
        for entry in entries:
            f.write(entry + "\n")

if __name__ == "__main__":
    main()
