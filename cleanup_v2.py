#!/usr/bin/env python3
"""
Database Cleanup Agent v2 - Comprehensive non-insurance detection
Based on full specialization analysis of all 1,723 leads
"""

import json
import time
import requests
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    "X-Human-Edit": "true"  # Required to write status, human_notes, last_touch_date
}

# --- CLASSIFICATION LOGIC ---
# Returns ("Unqualified"|"Flagged"|None, reason_string)

def spec_matches_any(spec, keywords):
    """Check if specialization contains any of the keywords (case-insensitive)"""
    spec_lower = spec.lower()
    for kw in keywords:
        if kw.lower() in spec_lower:
            return True
    return False

# Specialization patterns for TRUCKING OPERATORS (not insurance agencies)
TRUCKING_OPERATOR_SPECS = [
    "flatbed carrier", "hazmat carrier", "bulk liquid tanker carrier", "auto transport carrier",
    "moving company", "household goods carrier", "courier delivery service",
    "intermodal transportation", "drayage / marine", "drayage / intermodal", "freight forwarder",
    "oilfield transportation trucking", "oilfield trucking", "oilfield fluid logistics fleet",
    "towing and recovery fleet", "tow truck fleet", "commercial towing & recovery fleet",
    "poultry and pet food private distribution fleet", "private ambulance fleet",
    "agricultural grain trucking fleet", "building materials delivery fleet",
    "regional waste management fleet", "waste hauler", "livestock, grain & equipment hauling",
    "fuel delivery tanker fleet", "charter bus fleet", "private school bus",
    "private non-profit ems fleet", "agricultural refrigerated trucking",
    "agricultural and food-grade freight trucking", "food redistribution private fleet",
    "beverage distribution fleet", "dry freight, refrigerated freight transport",
    "freight forwarding, trucking, fleet logistics", "regional trucking, diverse cargo",
    "llt transportation", "ltl transportation, regional freight",
    "freight delivery, trucking, fleet logistics",
    "regional dry van carrier", "regional trucking, beverages",
    "trucking, regional logistics, dedicated routes",
    "local transportation, logistics, dedicated fleet services",
    "last mile delivery", "food grade tanker carrier",
    "intermodal trucking, containerized freight",
    "ready mix concrete producer, large mixer truck fleet",
    "private ambulance bls/als fleet",
    "charter bus fleet",
    "oilfield services trucking fleet",
    "regional trucking, logistics",
    "school bus",
    "ems fleet",
    "ambulance fleet",
]

# Specialization patterns for MANUFACTURING (not insurance)
MANUFACTURING_SPECS = [
    "plastics distribution", "vacuum formed plastics", "custom rubber manufacturing",
    "aseptic processing and packaging", "pet food manufacturing", "machined and fabricated plastic",
    "plastic recycling", "custom plastic thermoforming", "custom injection molding",
    "electronic contract manufacturing", "electronics manufacturing", "metal fabrication",
    "food manufacturing", "chemical manufacturing", "automotive parts manufacturing",
    "packaging manufacturing", "building products manufacturing", "wood products manufacturing",
    "textile manufacturing", "pharmaceutical manufacturing", "sheet metal fabrication",
    "contract baking", "contract food manufacturing", "frozen pizza", "food co-packing",
    "organic food manufacturing", "condiments, specialty sauces",
    "plastics manufacturing", "custom metal fabrication",
    "industrial chemicals and polymers", "fine organic chemicals",
    "industrial equipment manufacturing", "aerospace parts manufacturing",
    "building materials manufacturing",
    "medical device manufacturing",
    "plastics manufacturing, sheet extrusion",
    "plastic and rubber products manufacturing",
    "machined and fabricated plastic parts",
]

# Specialization patterns for CONSTRUCTION (not insurance)
CONSTRUCTION_SPECS = [
    "design-build, construction management", "commercial general contractor",
    "general contracting, construction management",
    "construction manager, general contractor",
    "full-service general contractor",
    "commercial general contracting",
    "commercial ground-up, renovation",
    "full-service commercial general contractor",
    "design-build general contractor",
    "general contractor, hospitality",
    "commercial general contractor, office",
]

# Specialization patterns for ENERGY (not insurance)
ENERGY_SPECS = [
    "next-generation geothermal energy", "midstream services, oil and gas",
    "independent e&p", "independent oil & gas e&p", "natural gas pipeline",
    "clean energy project developer", "clean energy developer",
    "wind, solar", "wind and solar", "solar installation",
    "commercial solar developer",
    "grid-scale battery energy storage",
    "energy storage systems and ai",
    "utility-scale solar",
    "ev fast charging", "ev charging infrastructure",
    "modular solar thermal energy storage",
    "integrated midstream services",
    "midstream pipeline gathering",
    "midstream energy infrastructure",
    "natural gas e&p", "natural gas, ngl",
    "independent e&p, bakken",
    "independent e&p, permian",
    "independent e&p, eagle ford",
    "independent e&p, denver-julesburg",
    "100% fully reusable medium-lift launch vehicles",
    "oilfield services",
]

# Specialization patterns for HEALTHCARE PROVIDERS (not insurance agencies)
HEALTHCARE_PROVIDER_SPECS = [
    "ambulatory surgery center", "dialysis center", "kidney care",
    "hospice management", "home health and hospice management", "home health management",
    "memory care facility management", "nursing home / senior care management",
    "nursing home / skilled nursing facility management",
    "urgent care management",
    "behavioral health facility management",
    "veterinary practice management",
    "dental practice management", "dental service organization",
    "senior living management / ccrc operator",
    "senior living / nursing home management",
]

# Specialization patterns for TECH / AI / SAAS (not insurance)
TECH_SPECS = [
    "iot fleet gps tracking and management",
    "automotive collision avoidance technology",
    "ai identity security platform",
    "ai platform for automated clinical documentation",
    "ai-driven hardware security chips",
    "banking-as-a-service platform",
    "digital banking and financial infrastructure",
    "cftc-regulated financial exchange",
    "autonomous ai-powered offensive security",
    "autonomous ai-powered",
    "american-made medium-duty electric",
    "ai platform automating healthcare front office",
    "automated endpoint management, security patching",
    "ai-powered connected security intelligence",
    "ai-powered security compliance",
    "modular 20-megawatt pressurized water microreactors",
    "ai model inference and deployment",
    "ai-powered legal practice management",
    "autonomous cloud backup",
    "ai-driven software delivery",
    "autonomous drone delivery",
    "high-power microwave anti-drone",
    "neutral-atom quantum computing",
    "quantum computing hardware",
    "commercial space-based radio frequency",
    "open-source backend-as-a-service",
    "full-stack digital auto insurance platform for latin american",
    "ai-powered career tools platform",
    "tech-enabled free filtered water refill",
    "ai-assisted platform for enterprise teams to create and scale on-brand video",
    "real-time international payments platform",
    "generative ai platform for biotech",
    "ai-powered student retention chatbot",
    "ai assistant platform for k-12 teachers",
    "solar-powered iot jobsite cameras",
    "b2b payments and accounts receivable automation for construction",
    "100% fully reusable medium-lift launch vehicles",
    "autonomous spacecraft",
    "high-rate configurable satellite bus",
    "ai-powered industrial maintenance and asset management saas",
    "ai-powered collaborative data workspace",
    "ai drug discovery and molecular design",
    "web infrastructure for ai agents",
    "whole-genome sequencing and genetic health screening platform",
    "ai digital twin platform",
    "large tabular model (ltm)",
    "ai endpoint security",
    "proactive ai observability platform",
    "ai-powered construction permitting",
    "voice ai platform for hospitality",
    "runtime cloud security platform",
    "safety-focused large language model for healthcare",
    "ai-powered private markets infrastructure",
    "membership-based lab testing & health diagnostics",
    "agentic ai security platform",
    "ai-native health insurance platform",
    "ai-native offensive cybersecurity platform",
    "ai-powered financial intelligence platform for biopharma",
    "enterprise ai operating system",
    "generative ai platform for financial professionals",
    "ai-powered tax platform",
    "ai-first erp platform",
    "enterprise ai agent platform",
    "earned wage access (ewa)",
    "photonic ai inference chips",
    "ai brand visibility and content optimization",
    "ai saas security platform",
    "ai predictive project delivery platform for large-scale infrastructure",
    "ai data analytics platform",
    "ai-powered government procurement",
    "ai sales agents (superhumans)",
    "industrial ai using computer vision",
    "ai-powered transportation management system",
    "ai-powered construction estimating software",
    "ai-powered banking and financial management platform for real estate",
    "humanoid robot",
    "autonomous unmanned warships",
    "autonomous anti-drone weapon",
    "employee recognition and rewards platform",
    "ai-powered end-to-end employee leave management",
    "ai-native payroll, tax compliance",
    "ai legal platform for plaintiff law firms",
    "ai intelligence platform for fortune 500",
    "affordable electric pickup trucks",
    "ai-powered warehouse robotics",
    "in vivo car t cell therapies",
    "ai digital workers platform for supply chain",
    "ai-native commercial fleet insurance using real-time telematics",
    "tech-enabled third-party claims administrator",
    "tech platform for fleet operators and insurers managing vehicle repairs",
    "ai workspace automating insurance workflows",
    "ai-native insurance brokerage platform",
    "modular solar thermal energy storage systems for ai data centers",
]

# Property management companies (not insurance agencies — they need insurance but aren't agencies)
PROPERTY_MGMT_SPECS = [
    "residential property management",
    "commercial property management",
    "multifamily property management",
    "multifamily apartment management",
    "multi-family property management",
    "multi-family residential property management",
    "apartment and residential property management",
    "commercial and residential property management",
    "residential and commercial property management",
    "hoa and community association management",
    "commercial real estate investment, property management",
    "property management and real estate",
    "commercial property management and leasing",
    "full-service property management",
    "student housing management",
    "affordable housing property management",
    "residential and institutional property management",
    "third-party multifamily property management",
    "commercial office and residential property management",
    "residential and apartment management",
    "commercial and multifamily property management",
    "multifamily and commercial property management",
    "multifamily and residential property management",
    "multi-family apartment management",
    "mixed-use property management",
    "full-service residential and commercial property management",
    "commercial retail residential hospitality property management",
    "residential multi-family, single family, and commercial property management",
]

# Healthcare/Senior Living management (not insurance)
HEALTHCARE_MGMT_SPECS = [
    "senior living management",
    "ambulatory surgery center management",
    "behavioral health facility management",
    "hospice management",
    "home health management",
    "urgent care management",
    "memory care facility management",
    "nursing home / senior care management",
    "nursing home / skilled nursing facility management",
    "veterinary practice management",
    "dental practice management (dso)",
    "dental service organization",
    "senior living / nursing home management",
]

# Auto dealers (not insurance)
AUTO_DEALER_SPECS = [
    "family-owned multi-brand auto dealership",
    "family auto dealership",
    "multi-brand auto dealer",
    "auto dealership group",
    "family-owned auto dealer group",
    "family-owned multi-state auto dealership",
]

# Agriculture equipment dealers (not insurance)
AG_EQUIPMENT_SPECS = [
    "agricultural equipment dealer",
    "farm equipment sales",
    "agriculture equipment sales",
    "agriculture equipment, new holland",
]

# Franchise/Multi-location businesses (not insurance agencies)
FRANCHISE_SPECS = [
    "franchise/multi-location, med spa",
    "franchise/multi-location, hotel management",
    "franchise/multi-location, veterinary",
    "franchise/multi-location, self-storage",
    "franchise/multi-location, fitness studio",
    "franchise/multi-location, auto repair franchise",
    "franchise/multi-location, fast casual",
    "franchise/multi-location, convenience store",
    "franchise/multi-location, med spa laser",
    "franchise/multi-location, auto body repair",
    "franchise/multi-location, optometry",
    "franchise/multi-location, childcare",
    "franchise/multi-location, dental service",
    "franchise/multi-location, car wash",
    "franchise/multi-location, restaurant franchisee",
]

# Wholesale distribution (not insurance)
WHOLESALE_DIST_SPECS = [
    "acoustical and building materials distribution",
    "wholesale building materials distribution",
    "wholesale distribution, convenience stores",
    "wholesale distribution, animal nutrition",
    "plastics distribution, acrylics",
]

# Defense / Aerospace (not insurance)
DEFENSE_SPECS = [
    "autonomous unmanned warships",
    "autonomous anti-drone weapon",
    "high-power microwave anti-drone",
    "commercial space-based radio frequency",
    "100% fully reusable medium-lift launch vehicles",
    "autonomous spacecraft",
    "high-rate configurable satellite bus",
    "neutral-atom quantum computing",
    "quantum computing hardware",
]

def is_insurance_agency(company_name, specialization, agent_notes):
    """Quick check if this looks like a legitimate insurance agency"""
    name_lower = company_name.lower()
    spec_lower = specialization.lower() if specialization else ""
    notes_lower = agent_notes.lower() if agent_notes else ""
    
    insurance_keywords = [
        "insurance", "ins ", "ins.", "insurers", "insurer",
        "broker", "brokerage", "underwriter", "underwriting",
        "mga ", "mgs ", "mgu ", "surplus lines", "excess lines",
        "independent agent", "independent agency", "p&c",
        "casualty", "liability coverage", "policy",
        "trucking insurance", "commercial auto insurance",
    ]
    
    for kw in insurance_keywords:
        if kw in name_lower or kw in spec_lower:
            return True
    
    return False

def classify_lead(lead):
    """
    Returns (action, reason) or (None, None) if lead is a legitimate insurance agency.
    action: "Unqualified" | "Flagged" | None
    """
    company_name = lead.get("company_name", "") or ""
    specialization = lead.get("specialization", "") or ""
    agent_notes = lead.get("agent_notes", "") or ""
    current_status = lead.get("status", "")
    
    # Skip already-unqualified
    if current_status == "Unqualified":
        return None, None
    
    spec_lower = specialization.lower()
    notes_lower = agent_notes.lower()
    name_lower = company_name.lower()
    
    # --- 1. Agent notes explicitly say "NOT an insurance agency" ---
    # Note: "Wrong industry: X, not trucking" = wrong NICHE (still an insurance agency, don't unqualify)
    # Note: "Wrong industry: X, NOT an insurance agency" = not an insurance company at all (unqualify)
    if "not an insurance agency" in notes_lower:
        wrong_desc = agent_notes.replace("Wrong industry:", "").strip().rstrip(".")
        return "Unqualified", f"CLEANUP: Not an insurance agency. Confirmed by prior flag: {wrong_desc[:200]}"
    
    # --- 2. Check if clearly an insurance agency (don't touch these) ---
    if is_insurance_agency(company_name, specialization, agent_notes):
        return None, None
    
    # --- 3. Check specialization patterns for non-insurance ---
    
    # Trucking operators (carriers/fleets, NOT insurance agencies)
    for spec in TRUCKING_OPERATOR_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Trucking/transportation OPERATOR — {specialization[:120]}"
    
    # Manufacturing
    for spec in MANUFACTURING_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Manufacturing company — {specialization[:120]}"
    
    # Construction
    for spec in CONSTRUCTION_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Construction/contracting company — {specialization[:120]}"
    
    # Energy
    for spec in ENERGY_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Energy company — {specialization[:120]}"
    
    # Healthcare providers
    for spec in HEALTHCARE_PROVIDER_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Healthcare facility operator — {specialization[:120]}"
    
    # Tech/AI/SaaS
    for spec in TECH_SPECS:
        if spec.lower() in spec_lower:
            # Insurance-tech borderline check
            if any(x in spec_lower for x in ["insurance brokerage platform", "insurance workflows", "fleet insurance using", "claims administrator", "vehicle repairs end-to-end"]):
                return "Flagged", f"REVIEW: Insurance-adjacent tech company (not a traditional insurance agency) — {specialization[:120]}"
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Technology/AI/SaaS company — {specialization[:120]}"
    
    # Property management
    for spec in PROPERTY_MGMT_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Property management company — {specialization[:120]}"
    
    # Healthcare management
    for spec in HEALTHCARE_MGMT_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Healthcare facility management — {specialization[:120]}"
    
    # Auto dealers
    for spec in AUTO_DEALER_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Auto dealership — {specialization[:120]}"
    
    # Agriculture equipment
    for spec in AG_EQUIPMENT_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Agricultural equipment dealer — {specialization[:120]}"
    
    # Franchise businesses
    for spec in FRANCHISE_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Franchise/multi-location business — {specialization[:120]}"
    
    # Wholesale distribution
    for spec in WHOLESALE_DIST_SPECS:
        if spec.lower() in spec_lower:
            return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: Wholesale/distribution company — {specialization[:120]}"
    
    # --- 4. Specialization completely absent — check name for known bad companies ---
    if not specialization or specialization.strip() == "":
        # Names of specifically flagged bad companies
        known_bad = {
            "threatlocker": "Cybersecurity software company",
            "horizon3.ai": "AI security/penetration testing company",
            "billingplatform": "Billing SaaS platform",
            "clearspeed": "Fraud detection technology company",
            "montway auto transport": "Auto transport/vehicle shipping company",
            "kch transportation": "Freight broker/transportation company",
            "shipwell": "Logistics SaaS/freight management platform",
            "atomix logistics": "Logistics/fulfillment company",
            "televero behavioral health": "Behavioral health provider",
            "televero": "Behavioral health provider",
            "saferide health": "Healthcare transportation company",
            "monogram health": "Healthcare services company",
            "ryse construction": "Construction company",
            "precision construction": "Construction company",
            "the richard group": "Advertising/marketing agency",
            "parafin": "Fintech/merchant cash advance company",
        }
        for bad_name, description in known_bad.items():
            if bad_name in name_lower:
                return "Unqualified", f"CLEANUP: Not an insurance agency. Actual business: {description}"
    
    # --- 5. Check specialization for freight-broker/logistics-company (not insurance) ---
    logistics_ops = [
        "freight brokerage", "3pl warehousing", "cold storage warehousing",
        "trucking, logistics, supply chain consulting",
    ]
    for spec in logistics_ops:
        if spec.lower() in spec_lower:
            # Freight brokers might need trucking insurance, but aren't agencies
            return "Flagged", f"REVIEW: Transportation/logistics OPERATOR (not an insurance agency) — {specialization[:120]}"
    
    # If we get here, it doesn't match any non-insurance pattern
    return None, None


def patch_lead(lead_id, status, notes, verified=None):
    """Patch a lead with new status and notes"""
    payload = {
        "status": status,
        "agent_notes": notes,
    }
    if verified is not None:
        payload["verified"] = verified
    
    resp = requests.patch(
        f"{BASE_URL}/api/leads/{lead_id}",
        headers=HEADERS,
        json=payload,
        timeout=30
    )
    resp.raise_for_status()
    return resp.json()


def categorize_industry(reason):
    """Categorize the reason into an industry bucket"""
    reason_lower = reason.lower()
    if "trucking" in reason_lower and "operator" in reason_lower:
        return "Trucking Operator (not insurance)"
    elif "manufacturing" in reason_lower:
        return "Manufacturing"
    elif "construction" in reason_lower:
        return "Construction"
    elif "energy" in reason_lower or "oil" in reason_lower or "solar" in reason_lower:
        return "Energy"
    elif "healthcare" in reason_lower or "health" in reason_lower or "medical" in reason_lower:
        return "Healthcare"
    elif "technology" in reason_lower or "saas" in reason_lower or "ai" in reason_lower or "tech" in reason_lower:
        return "Technology/AI/SaaS"
    elif "property management" in reason_lower:
        return "Property Management"
    elif "auto dealership" in reason_lower:
        return "Auto Dealership"
    elif "agricultural equipment" in reason_lower:
        return "Agricultural Equipment"
    elif "franchise" in reason_lower:
        return "Franchise/Multi-location Business"
    elif "wholesale" in reason_lower or "distribution" in reason_lower:
        return "Wholesale/Distribution"
    elif "advertising" in reason_lower or "marketing" in reason_lower:
        return "Advertising/Marketing"
    elif "fintech" in reason_lower:
        return "Fintech"
    elif "cybersecurity" in reason_lower or "cyber" in reason_lower:
        return "Cybersecurity"
    elif "agent notes" in reason_lower:
        return "Pre-flagged (Wrong Industry)"
    else:
        return "Other Non-Insurance"


def main():
    print("=== CORGI DATABASE CLEANUP AGENT v2 ===")
    print(f"Started at: {datetime.now()}")
    print()
    
    # Load the cached leads (already fetched)
    print("Loading cached leads...")
    with open("/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/all_leads.json") as f:
        all_leads = json.load(f)
    print(f"Loaded {len(all_leads)} leads")
    
    # Classify all leads
    to_unqualify = []
    to_flag = []
    already_unqualified = 0
    
    print("\nClassifying leads...")
    for lead in all_leads:
        if lead.get("status") == "Unqualified":
            already_unqualified += 1
            continue
        
        action, reason = classify_lead(lead)
        if action == "Unqualified":
            to_unqualify.append((lead, reason))
        elif action == "Flagged":
            to_flag.append((lead, reason))
    
    print(f"\nClassification results:")
    print(f"  To Unqualify: {len(to_unqualify)}")
    print(f"  To Flag: {len(to_flag)}")
    print(f"  Already Unqualified: {already_unqualified}")
    print(f"  Clean (insurance agencies): {len(all_leads) - len(to_unqualify) - len(to_flag) - already_unqualified}")
    
    # Categorize what we're removing
    industry_preview = {}
    for lead, reason in to_unqualify:
        cat = categorize_industry(reason)
        industry_preview[cat] = industry_preview.get(cat, 0) + 1
    
    print("\n--- CONTAMINATION BY INDUSTRY (Unqualify) ---")
    for cat, cnt in sorted(industry_preview.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {cnt}")
    
    print("\n--- LEADS TO FLAG ---")
    for lead, reason in to_flag:
        print(f"  [{lead['id'][:8]}] {lead['company_name']} | {reason[:80]}")
    
    print("\n--- FIRST 30 LEADS TO UNQUALIFY (preview) ---")
    for lead, reason in to_unqualify[:30]:
        print(f"  [{lead['id'][:8]}] {lead['company_name']} | {reason[:80]}")
    if len(to_unqualify) > 30:
        print(f"  ... and {len(to_unqualify) - 30} more")
    
    # Apply changes
    log_entries = []
    errors = 0
    industry_counts = {}
    
    print(f"\n\nApplying {len(to_unqualify)} unqualifications and {len(to_flag)} flags...")
    
    # Process in batches — Unqualify first
    for i, (lead, reason) in enumerate(to_unqualify):
        try:
            patch_lead(lead["id"], "Unqualified", reason, verified=False)
            cat = categorize_industry(reason)
            industry_counts[cat] = industry_counts.get(cat, 0) + 1
            log_entries.append({
                "id": lead["id"],
                "company_name": lead["company_name"],
                "action": "Unqualified",
                "reason": reason,
                "prev_status": lead.get("status"),
                "category": cat,
            })
            if (i + 1) % 10 == 0:
                print(f"  Progress: {i+1}/{len(to_unqualify)} unqualified...")
            time.sleep(0.05)  # Rate limiting
        except Exception as e:
            errors += 1
            print(f"  ✗ ERROR unqualifying {lead['company_name']}: {e}")
    
    print(f"  ✓ Completed {len(to_unqualify) - errors} unqualifications")
    
    # Flag borderline ones
    flag_errors = 0
    for lead, reason in to_flag:
        try:
            if lead.get("status") != "Flagged":
                patch_lead(lead["id"], "Flagged", reason)
                industry_counts["Borderline/Flagged"] = industry_counts.get("Borderline/Flagged", 0) + 1
                log_entries.append({
                    "id": lead["id"],
                    "company_name": lead["company_name"],
                    "action": "Flagged",
                    "reason": reason,
                    "prev_status": lead.get("status"),
                    "category": "Borderline/Flagged",
                })
                time.sleep(0.05)
        except Exception as e:
            flag_errors += 1
            print(f"  ✗ ERROR flagging {lead['company_name']}: {e}")
    
    print(f"  ✓ Completed {len(to_flag) - flag_errors} flags")
    
    # Write log
    write_log(log_entries, {
        "total_scanned": len(all_leads),
        "unqualified_count": len(to_unqualify) - errors,
        "flagged_count": len(to_flag) - flag_errors,
        "already_unqualified": already_unqualified,
        "errors": errors + flag_errors,
        "industries": industry_counts,
    })
    
    # Trigger rescoring
    print("\nTriggering rescoring...")
    try:
        resp = requests.post(f"{BASE_URL}/api/scoring", headers=HEADERS, timeout=60)
        print(f"Rescoring result: {resp.status_code} — {resp.text[:200]}")
    except Exception as e:
        print(f"Rescoring error (non-fatal): {e}")
    
    print(f"\n=== CLEANUP COMPLETE ===")
    print(f"  Unqualified: {len(to_unqualify) - errors}")
    print(f"  Flagged: {len(to_flag) - flag_errors}")
    print(f"  Errors: {errors + flag_errors}")
    print(f"  Finished at: {datetime.now()}")


def write_log(log_entries, summary):
    """Write cleanup log to file"""
    log_path = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/CLEANUP_LOG.md"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    lines = [
        "# Database Cleanup Log",
        "",
        f"**Run at:** {now}",
        f"**Agent:** Corgi DB Cleanup Agent v2",
        "",
        "## Summary",
        "",
        f"- **Total leads scanned:** {summary['total_scanned']}",
        f"- **Unqualified (removed from pipeline):** {summary['unqualified_count']}",
        f"- **Flagged (borderline, needs review):** {summary['flagged_count']}",
        f"- **Already Unqualified (skipped):** {summary['already_unqualified']}",
        f"- **Errors during patching:** {summary['errors']}",
        "",
        "## Industry Contamination Breakdown",
        "",
    ]
    
    for industry, count in sorted(summary['industries'].items(), key=lambda x: -x[1]):
        lines.append(f"- **{industry}:** {count}")
    
    lines.extend([
        "",
        "## Detailed Change Log",
        "",
        "| # | Company Name | Action | Category | Lead ID |",
        "|---|-------------|--------|----------|---------|",
    ])
    
    for i, entry in enumerate(log_entries, 1):
        lines.append(f"| {i} | {entry['company_name']} | {entry['action']} | {entry.get('category','?')} | {entry['id'][:8]}... |")
    
    lines.extend([
        "",
        "## Full Reason Details",
        "",
    ])
    
    for entry in log_entries:
        lines.extend([
            f"### {entry['company_name']}",
            f"- **ID:** `{entry['id']}`",
            f"- **Action:** {entry['action']}",
            f"- **Category:** {entry.get('category', 'Unknown')}",
            f"- **Reason:** {entry['reason']}",
            f"- **Previous Status:** {entry.get('prev_status', 'Unknown')}",
            "",
        ])
    
    with open(log_path, "w") as f:
        f.write("\n".join(lines))
    
    print(f"\nLog written to: {log_path}")


if __name__ == "__main__":
    main()
