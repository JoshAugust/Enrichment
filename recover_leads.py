#!/usr/bin/env python3
"""
Lead Recovery Script
Recovers Unqualified and Flagged leads that are real companies.
"""

import json
import time
import sys
import urllib.request
import urllib.error
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_PATH = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/RECOVERY_LOG.md"

# Industry keyword detection
INSURANCE_AGENCY_KEYWORDS = [
    "insurance agency", "insurance broker", "insurance company", "insurenemt",
    "nemt insurance", "nonemergency transportation insurance", "non emergency transportation insurance",
    "commercial insurance", "auto insurance", "truck insurance", "trucking insurance",
    "liability insurance", "workers comp insurance", "freight insurance",
    "fleet insurance", "cargo insurance", "motor carrier insurance",
    "transportation insurance", "insurance group", "insurance services",
    "insurance solutions", "insurance advisors", "insurance consultants",
    "insurance partners", "insurance specialists", "insurance professionals",
    "insure", "coverage solutions", "risk management", "underwriting",
    "surplus lines", "mga ", "managing general", "wholesale insurance",
    "brokerage", "claims management", "actuarial"
]

# These specializations indicate insurance agencies (not companies needing insurance)
INSURANCE_AGENCY_SPECIALIZATIONS = [
    "trucking / commercial auto",
    "nemt / medical transport",
    "commercial lines",
    "personal lines",
    "surplus lines",
    "workers compensation",
    "general liability",
]

TECH_KEYWORDS = [
    "tech", "software", "saas", "platform", "digital", "ai ", "ml ", "cloud",
    "cyber", "data", "analytics", "fintech", "healthtech", "proptech", "edtech",
    "legaltech", "insurtech", "robotics", "automation", "iot", "blockchain",
    "startup", "app", "mobile", "web", "api", "devops", "security", "network",
    "information technology", "it services", "computer", "semiconductor",
    "microchip", "telecom", "telecommunications", "media", "gaming", "esports",
    "drone", "aerospace", "satellite", "cleantech", "greentech", "agtech",
    "biotech", "medtech", "nanotech", "wearable", "ar ", "vr ", "xr ",
    "marketplace", "ecommerce", "e-commerce", "payment", "lending", "banking",
    "crypto", "nft", "defi", "solutions", "systems", "labs", "laboratory",
    "intelligence", "machine learning", "deep learning"
]

HEALTHCARE_KEYWORDS = [
    "health", "medical", "hospital", "clinic", "pharma", "biotech", "bio",
    "therapeutics", "diagnostics", "dental", "vision", "mental health",
    "behavioral health", "telehealth", "telemedicine", "wellness", "nutrition",
    "fitness", "rehab", "rehabilitation", "surgery", "surgical", "oncology",
    "cardiology", "orthopedic", "dermatology", "pediatric", "geriatric",
    "nursing", "care", "patient", "physician", "doctor", "nurse", "therapy",
    "pharmaceutical", "drug", "medicine", "genomics", "genetics", "dna",
    "vaccine", "clinical", "imaging", "radiology", "laboratory", "lab",
    "specimen", "pathology", "dispensary", "cannabis", "hemp", "cbd"
]

CONSTRUCTION_KEYWORDS = [
    "construction", "building", "contractor", "builders", "developer",
    "infrastructure", "engineering", "civil", "structural", "mechanical",
    "electrical", "plumbing", "hvac", "roofing", "flooring", "concrete",
    "steel", "lumber", "demolition", "excavation", "grading", "paving",
    "landscaping", "architecture", "architect", "design build", "general contractor",
    "subcontractor", "renovation", "remodel", "restoration", "waterproofing",
    "foundation", "framing", "masonry", "painting", "welding", "fabrication"
]

LOGISTICS_KEYWORDS = [
    "logistics", "freight", "shipping", "transport", "trucking", "fleet",
    "delivery", "courier", "supply chain", "warehouse", "distribution",
    "fulfillment", "last mile", "3pl", "4pl", "intermodal", "rail", "port",
    "customs", "brokerage", "expedite", "forwarding", "cargo", "charter",
    "moving", "relocation", "import", "export", "trade", "procurement",
    "cold chain", "refrigerated", "hazmat", "bulk", "tanker", "flatbed",
    "drayage", "ltl", "ftl", "truckload", "parcel", "air freight", "ocean freight"
]

MANUFACTURING_KEYWORDS = [
    "manufacturing", "manufacturer", "factory", "production", "assembly",
    "industrial", "machinery", "equipment", "tools", "components", "parts",
    "automotive", "aerospace", "defense", "military", "weapons", "chemical",
    "polymer", "plastic", "rubber", "textile", "apparel", "clothing", "fashion",
    "food processing", "beverage", "packaging", "printing", "electronics",
    "semiconductor", "circuit", "battery", "solar", "wind", "power", "energy",
    "oil", "gas", "mining", "metals", "aluminum", "copper", "steel mill",
    "paper", "wood", "furniture", "glass", "ceramic", "composite", "3d print"
]

REAL_ESTATE_KEYWORDS = [
    "real estate", "realty", "property", "homes", "housing", "apartments",
    "reit", "commercial real estate", "cre", "multifamily", "residential",
    "office space", "retail space", "industrial space", "self storage",
    "data center", "hospitality", "hotel", "motel", "resort", "vacation",
    "airbnb", "short term rental", "mortgage", "title", "escrow", "appraisal",
    "property management", "hoa", "condo", "townhome", "single family"
]

ENERGY_KEYWORDS = [
    "energy", "solar", "wind", "renewable", "power", "utility", "electric",
    "grid", "battery storage", "fuel cell", "hydrogen", "nuclear", "natural gas",
    "oil", "petroleum", "refinery", "pipeline", "drilling", "exploration",
    "mining", "coal", "hydroelectric", "geothermal", "biomass", "biofuel",
    "ev charging", "electric vehicle"
]

FINANCIAL_KEYWORDS = [
    "financial", "finance", "bank", "credit", "lending", "loan", "mortgage",
    "investment", "venture", "private equity", "hedge fund", "asset management",
    "wealth management", "advisory", "accounting", "cpa", "tax", "audit",
    "payroll", "bookkeeping", "treasury", "payment", "fintech", "trading",
    "brokerage", "securities", "fund", "capital", "equity", "debt"
]

def is_likely_insurance_agency(lead):
    """Returns True if this looks like an insurance agency (not a company that buys insurance)."""
    name = (lead.get("company_name") or "").lower()
    domain = (lead.get("domain") or "").lower()
    spec = (lead.get("specialization") or "").lower()
    agent_notes = (lead.get("agent_notes") or "").lower()
    industry = (lead.get("industry") or "").lower()
    
    # Check for obvious insurance agency keywords in name/domain
    for kw in INSURANCE_AGENCY_KEYWORDS:
        if kw in name or kw in domain:
            # But if it also has strong tech/other industry signals, might be insurtech
            if "tech" in name and ("insur" in name or "insure" in name):
                return False  # insurtech company
            return True
    
    # Check agent notes for "WRONG INDUSTRY" about being an insurance agency
    if "wrong industry" in agent_notes and ("insurance" in agent_notes or "broker" in agent_notes or "agency" in agent_notes):
        # But only if not a real company that happens to sell insurance products
        if "insurance" in name.split() or "insure" in name or "broker" in name:
            return True
    
    return False

def detect_industry(lead):
    """Detect the primary industry of a lead."""
    name = (lead.get("company_name") or "").lower()
    domain = (lead.get("domain") or "").lower()
    spec = (lead.get("specialization") or "").lower()
    website = (lead.get("website") or "").lower()
    
    text = f"{name} {domain} {spec}"
    
    # Order matters - more specific first
    for kw in TECH_KEYWORDS:
        if kw in text:
            return "Tech/SaaS"
    for kw in HEALTHCARE_KEYWORDS:
        if kw in text:
            return "Healthcare"
    for kw in CONSTRUCTION_KEYWORDS:
        if kw in text:
            return "Construction"
    for kw in MANUFACTURING_KEYWORDS:
        if kw in text:
            return "Manufacturing"
    for kw in LOGISTICS_KEYWORDS:
        if kw in text:
            return "Logistics/Freight"
    for kw in REAL_ESTATE_KEYWORDS:
        if kw in text:
            return "Real Estate"
    for kw in ENERGY_KEYWORDS:
        if kw in text:
            return "Energy"
    for kw in FINANCIAL_KEYWORDS:
        if kw in text:
            return "Financial Services"
    
    return "Other/General"

def get_insurance_needs(industry):
    """Return relevant insurance products for an industry."""
    needs = {
        "Tech/SaaS": "cyber, E&O, D&O, GL, workers comp",
        "Healthcare": "malpractice, GL, workers comp, cyber, D&O",
        "Construction": "GL, workers comp, commercial auto, builder's risk, surety bonds",
        "Manufacturing": "product liability, workers comp, GL, commercial property, commercial auto",
        "Logistics/Freight": "cargo, commercial auto, GL, workers comp, cyber",
        "Real Estate": "E&O, GL, commercial property, D&O, cyber",
        "Energy": "environmental, GL, workers comp, commercial auto, property",
        "Financial Services": "E&O, D&O, cyber, GL, fidelity bonds",
        "Other/General": "GL, workers comp, commercial property, cyber, D&O",
    }
    return needs.get(industry, "GL, workers comp, commercial property, cyber, D&O")

def get_specialization_label(industry):
    """Return a clean specialization label."""
    labels = {
        "Tech/SaaS": "Technology / SaaS",
        "Healthcare": "Healthcare / Medical",
        "Construction": "Construction / Contracting",
        "Manufacturing": "Manufacturing / Industrial",
        "Logistics/Freight": "Logistics / Supply Chain",
        "Real Estate": "Real Estate / Property",
        "Energy": "Energy / Utilities",
        "Financial Services": "Financial Services",
        "Other/General": "General Commercial",
    }
    return labels.get(industry, "General Commercial")

def api_get(path):
    """Make a GET request to the API."""
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"X-API-Key": API_KEY})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  GET error {path}: {e}")
        return None

def api_patch(lead_id, data, retries=3):
    """Make a PATCH request to recover a lead."""
    url = f"{BASE_URL}/api/leads/{lead_id}"
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        url, data=body, method="PATCH",
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
            "X-Human-Edit": "true",
        }
    )
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            print(f"  PATCH error {lead_id}: HTTP {e.code} - {e.read()[:200]}")
            if e.code == 429:
                time.sleep(5)
                continue
            return None
        except Exception as e:
            print(f"  PATCH error {lead_id}: {e}")
            if attempt < retries - 1:
                time.sleep(2)
    return None

def fetch_all_leads(status):
    """Fetch all leads with a given status."""
    all_leads = []
    offset = 0
    limit = 100
    
    while True:
        print(f"  Fetching {status} leads offset={offset}...")
        result = api_get(f"/api/leads?limit={limit}&offset={offset}&status={status}")
        if not result:
            break
        
        leads = result.get("leads", [])
        if not leads:
            break
        
        all_leads.extend(leads)
        total = result.get("total", 0)
        print(f"  Got {len(leads)} leads (total so far: {len(all_leads)}/{total})")
        
        if len(all_leads) >= total:
            break
        
        offset += limit
        time.sleep(0.2)  # Be nice to the API
    
    return all_leads

def should_recover(lead):
    """
    Determine if a lead should be recovered.
    Returns (bool, reason) tuple.
    """
    name = (lead.get("company_name") or "").lower()
    domain = (lead.get("domain") or "").lower()
    agent_notes = (lead.get("agent_notes") or "").lower()
    
    # Definitely skip fake/non-existent companies
    if not name or name in ["unknown", "n/a", "none", ""]:
        return False, "No company name"
    
    if not domain or domain in ["unknown", "n/a", "none", ""]:
        # Still might be real if we have a name
        pass
    
    # Check for clearly fake indicators
    if any(kw in agent_notes for kw in ["hallucinated", "fake company", "does not exist", "no website found", "domain not found"]):
        # Even then, be generous - if there's a website, probably real
        if lead.get("website"):
            return True, "Has website despite notes"
        return False, "Likely fake/hallucinated company"
    
    # Check if it's an insurance agency (they still need insurance though!)
    # Actually per task: "be GENEROUS" - insurance agencies need E&O, cyber, D&O
    # So we recover them too, just with appropriate notes
    
    # The only real exclusions are:
    # 1. Fake companies
    # 2. Personal blogs/hobby sites
    # 3. Dead companies
    
    # Check for personal blogs
    blog_indicators = ["blog", "personal website", "hobby", "wordpress.com", "blogspot", "tumblr"]
    if any(kw in domain or kw in name for kw in blog_indicators):
        return False, "Personal blog/hobby site"
    
    # If it has a quality score > 0 and was discovered by an agent, it's real
    quality_score = lead.get("quality_score", 0) or 0
    if quality_score > 0:
        return True, "Has quality score - real company"
    
    # If it has a phone number or email, it's real
    if lead.get("phone_hq") or lead.get("mobile_phone") or lead.get("email"):
        return True, "Has contact info - real company"
    
    # If it has a website domain, probably real
    if domain and "." in domain and len(domain) > 4:
        return True, "Has domain - likely real company"
    
    # Default: if we have a company name, recover it
    if name and len(name) > 2:
        return True, "Has company name"
    
    return False, "Insufficient data to confirm real company"

def process_leads(leads, stats):
    """Process a list of leads and recover eligible ones."""
    recovered = 0
    skipped = 0
    errors = 0
    
    for i, lead in enumerate(leads):
        lead_id = lead["id"]
        company_name = lead.get("company_name", "Unknown")
        
        recover, reason = should_recover(lead)
        
        if not recover:
            skipped += 1
            stats["skipped"].append({
                "id": lead_id,
                "name": company_name,
                "reason": reason
            })
            print(f"  [{i+1}/{len(leads)}] SKIP: {company_name} — {reason}")
            continue
        
        # Detect industry
        industry = detect_industry(lead)
        insurance_needs = get_insurance_needs(industry)
        spec_label = get_specialization_label(industry)
        
        # Check if it's an insurance agency - still recover but note appropriately
        is_ins_agency = is_likely_insurance_agency(lead)
        if is_ins_agency:
            industry = "Insurance Agency"
            insurance_needs = "E&O, cyber, D&O, GL, fidelity bonds"
            spec_label = "Insurance / Risk Services"
        
        agent_notes = f"RECOVERED: {industry} company — potential insurance customer. Needs: {insurance_needs}"
        
        # Determine if we should update specialization
        current_spec = lead.get("specialization") or ""
        update_spec = current_spec.lower() in [s.lower() for s in INSURANCE_AGENCY_SPECIALIZATIONS] or not current_spec
        
        patch_data = {
            "status": "New",
            "agent_notes": agent_notes
        }
        
        if update_spec:
            patch_data["specialization"] = spec_label
        
        result = api_patch(lead_id, patch_data)
        
        if result:
            recovered += 1
            stats["recovered"].append({
                "id": lead_id,
                "name": company_name,
                "industry": industry,
                "insurance_needs": insurance_needs
            })
            stats["by_industry"][industry] = stats["by_industry"].get(industry, 0) + 1
            print(f"  [{i+1}/{len(leads)}] RECOVERED: {company_name} → {industry}")
        else:
            errors += 1
            stats["errors"].append({"id": lead_id, "name": company_name})
            print(f"  [{i+1}/{len(leads)}] ERROR: {company_name}")
        
        # Rate limiting - small delay every 10 requests
        if (i + 1) % 10 == 0:
            time.sleep(0.5)
    
    return recovered, skipped, errors

def write_log(stats):
    """Write the recovery log."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    lines = [
        "# Lead Recovery Log",
        f"",
        f"**Run Date:** {now}",
        f"",
        f"## Summary",
        f"",
        f"| Metric | Count |",
        f"|--------|-------|",
        f"| Total Processed | {stats['total_processed']} |",
        f"| Recovered | {stats['total_recovered']} |",
        f"| Skipped (kept unqualified) | {stats['total_skipped']} |",
        f"| Errors | {stats['total_errors']} |",
        f"",
        f"## Recovered by Industry",
        f"",
        f"| Industry | Count |",
        f"|----------|-------|",
    ]
    
    for industry, count in sorted(stats["by_industry"].items(), key=lambda x: -x[1]):
        lines.append(f"| {industry} | {count} |")
    
    lines.extend([
        f"",
        f"## Kept Unqualified ({len(stats['skipped'])} leads)",
        f"",
        f"These leads were determined to be fake, personal blogs, or had insufficient data:",
        f"",
    ])
    
    for s in stats["skipped"][:50]:  # First 50
        lines.append(f"- **{s['name']}** (`{s['id'][:8]}`) — {s['reason']}")
    
    if len(stats["skipped"]) > 50:
        lines.append(f"- _...and {len(stats['skipped']) - 50} more_")
    
    if stats["errors"]:
        lines.extend([
            f"",
            f"## Errors ({len(stats['errors'])} leads)",
            f"",
        ])
        for e in stats["errors"]:
            lines.append(f"- **{e['name']}** (`{e['id'][:8]}`)")
    
    with open(LOG_PATH, "w") as f:
        f.write("\n".join(lines))
    
    print(f"\nLog written to {LOG_PATH}")

def main():
    print("=" * 60)
    print("LEAD RECOVERY AGENT")
    print("=" * 60)
    
    stats = {
        "total_processed": 0,
        "total_recovered": 0,
        "total_skipped": 0,
        "total_errors": 0,
        "by_industry": {},
        "recovered": [],
        "skipped": [],
        "errors": [],
    }
    
    # Process Unqualified leads
    print("\n[1/2] Fetching Unqualified leads...")
    unqualified_leads = fetch_all_leads("Unqualified")
    print(f"  Total Unqualified leads: {len(unqualified_leads)}")
    
    print(f"\nProcessing {len(unqualified_leads)} Unqualified leads...")
    rec, skip, err = process_leads(unqualified_leads, stats)
    stats["total_processed"] += len(unqualified_leads)
    stats["total_recovered"] += rec
    stats["total_skipped"] += skip
    stats["total_errors"] += err
    
    print(f"\n  Unqualified batch done: {rec} recovered, {skip} skipped, {err} errors")
    
    # Process Flagged leads
    print("\n[2/2] Fetching Flagged leads...")
    flagged_leads = fetch_all_leads("Flagged")
    print(f"  Total Flagged leads: {len(flagged_leads)}")
    
    print(f"\nProcessing {len(flagged_leads)} Flagged leads...")
    rec, skip, err = process_leads(flagged_leads, stats)
    stats["total_processed"] += len(flagged_leads)
    stats["total_recovered"] += rec
    stats["total_skipped"] += skip
    stats["total_errors"] += err
    
    print(f"\n  Flagged batch done: {rec} recovered, {skip} skipped, {err} errors")
    
    # Write log
    write_log(stats)
    
    # Final summary
    print("\n" + "=" * 60)
    print("RECOVERY COMPLETE")
    print("=" * 60)
    print(f"Total Processed: {stats['total_processed']}")
    print(f"Total Recovered: {stats['total_recovered']}")
    print(f"Total Skipped:   {stats['total_skipped']}")
    print(f"Total Errors:    {stats['total_errors']}")
    print("\nBy Industry:")
    for industry, count in sorted(stats["by_industry"].items(), key=lambda x: -x[1]):
        print(f"  {industry}: {count}")

if __name__ == "__main__":
    main()
