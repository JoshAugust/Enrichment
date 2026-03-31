#!/usr/bin/env python3
"""
Database Cleanup Agent for Corgi Insurance Enrichment Platform
Identifies and marks non-insurance companies as Unqualified or Flagged
"""

import json
import time
import requests
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

# Known bad leads (specifically identified)
KNOWN_BAD = {
    "threatlocker": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Cybersecurity software company"),
    "horizon3.ai": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: AI-powered security/penetration testing company"),
    "horizon3": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: AI security company"),
    "billingplatform": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Billing/revenue management SaaS platform"),
    "clearspeed": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Fraud detection technology company"),
    "montway auto transport": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Auto transport/vehicle shipping company"),
    "montway": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Auto transport company"),
    "kch transportation": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Freight broker/transportation company"),
    "shipwell": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Logistics SaaS/freight management platform"),
    "atomix logistics": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Logistics/fulfillment company"),
    "televero behavioral health": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Behavioral health/mental health provider"),
    "televero": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Behavioral health provider"),
    "saferide health": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Healthcare transportation/medical transport company"),
    "monogram health": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Healthcare services company"),
    "ryse construction": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Construction company"),
    "precision construction": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Construction company"),
    "the richard group": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Advertising/marketing agency"),
    "parafin": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Fintech/merchant cash advance company"),
}

# Industry keywords that clearly indicate NOT insurance
CLEARLY_NOT_INSURANCE_KEYWORDS = {
    # Tech/SaaS
    "cybersecurity": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Cybersecurity company"),
    "saas platform": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: SaaS software company"),
    "software company": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Software company"),
    # Healthcare providers (not insurers)
    "behavioral health": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Healthcare/behavioral health provider"),
    "mental health provider": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Mental health provider"),
    "healthcare provider": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Healthcare provider"),
    "medical transport": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Medical transportation company"),
    # Construction
    "construction company": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Construction company"),
    "general contractor": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Construction/contracting company"),
    # Logistics operators (not insurance)
    "auto transport": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Auto transport/vehicle shipping company"),
    "freight broker": ("Flagged", "REVIEW: Freight broker — may need trucking insurance but is not an insurance agency"),
    "logistics provider": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Logistics/freight company"),
    "vehicle shipping": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Vehicle shipping/auto transport company"),
    # Advertising/PR
    "advertising agency": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Advertising/marketing agency"),
    "marketing agency": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Marketing/advertising agency"),
    "pr firm": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: PR firm"),
    # Fintech
    "merchant cash advance": ("Unqualified", "CLEANUP: Not an insurance agency. Actual business: Fintech/merchant cash advance"),
    "payment processing": ("Flagged", "REVIEW: Payment/fintech company — not an insurance agency"),
}

# Industry field values that indicate NOT insurance
NOT_INSURANCE_INDUSTRIES = {
    "technology", "software", "saas", "cybersecurity", "healthcare", "construction",
    "logistics", "transportation", "advertising", "marketing", "fintech", "finance",
    "retail", "manufacturing", "restaurant", "food", "real_estate",
    "behavioral_health", "medical", "freight", "auto_transport"
}

# Specialization values that clearly indicate insurance-related (keep these)
INSURANCE_SPECIALIZATIONS = {
    "trucking", "commercial auto", "transportation", "cargo", "fleet",
    "workers comp", "general liability", "commercial lines", "personal lines",
    "life", "health insurance", "property", "casualty", "surety", "bonds",
    "excess", "surplus", "wholesale", "mga", "mga/mgs", "specialty",
    "independent agent", "insurance broker", "insurance agency",
}

def fetch_all_leads():
    """Fetch all leads from the API, paginating through all results"""
    all_leads = []
    offset = 0
    limit = 100
    total = None
    
    print(f"Fetching all leads...")
    while True:
        resp = requests.get(
            f"{BASE_URL}/api/leads",
            headers=HEADERS,
            params={"limit": limit, "offset": offset},
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        
        if total is None:
            total = data.get("total", 0)
            print(f"Total leads: {total}")
        
        leads = data.get("leads", [])
        if not leads:
            break
        
        all_leads.extend(leads)
        offset += limit
        print(f"  Fetched {len(all_leads)}/{total}...")
        
        if len(all_leads) >= total:
            break
        
        time.sleep(0.1)  # Be nice to the API
    
    print(f"Total fetched: {len(all_leads)}")
    return all_leads

def normalize(text):
    """Normalize text for matching"""
    if not text:
        return ""
    return text.lower().strip()

def classify_lead(lead):
    """
    Returns (action, reason) or None if lead looks like an insurance company.
    action: "Unqualified" | "Flagged" | None
    """
    name = normalize(lead.get("company_name", ""))
    name_normalized = normalize(lead.get("name_normalized", ""))
    specialization = normalize(lead.get("specialization", "") or "")
    industry = normalize(lead.get("industry", "") or "")
    agent_notes = normalize(lead.get("agent_notes", "") or "")
    website = normalize(lead.get("website", "") or "")
    domain = normalize(lead.get("domain", "") or "")
    
    # Already unqualified? Skip.
    current_status = lead.get("status", "")
    if current_status in ("Unqualified",):
        return None, None
    
    # Check known bad leads first
    for bad_name, (action, reason) in KNOWN_BAD.items():
        if bad_name in name or bad_name in name_normalized:
            return action, reason
    
    # Check industry field
    for not_ins_ind in NOT_INSURANCE_INDUSTRIES:
        if not_ins_ind in industry and "insurance" not in industry:
            return "Flagged", f"REVIEW: Industry field is '{industry}' — not a standard insurance industry. Verify this is a trucking insurance agency."
    
    # Check agent notes for non-insurance indicators
    for keyword, (action, reason) in CLEARLY_NOT_INSURANCE_KEYWORDS.items():
        if keyword in agent_notes:
            return action, reason
    
    # Check company name for obvious non-insurance indicators
    non_insurance_name_indicators = [
        ("construction", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Construction company"),
        (" logistics", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Logistics company"),
        ("auto transport", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Auto transport/vehicle shipping company"),
        ("freight carrier", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Freight carrier/trucking operator"),
        ("trucking company", "Flagged", "REVIEW: May be a trucking OPERATOR not a trucking INSURANCE agency"),
        ("behavioral health", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Behavioral health provider"),
        ("cyber security", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Cybersecurity company"),
        ("software inc", "Flagged", "REVIEW: Appears to be a software company, not an insurance agency"),
        ("software llc", "Flagged", "REVIEW: Appears to be a software company, not an insurance agency"),
        ("software corp", "Flagged", "REVIEW: Appears to be a software company, not an insurance agency"),
        ("tech inc", "Flagged", "REVIEW: Appears to be a tech company, not an insurance agency"),
        ("technologies inc", "Flagged", "REVIEW: Appears to be a tech company, not an insurance agency"),
        ("technologies llc", "Flagged", "REVIEW: Appears to be a tech company, not an insurance agency"),
        ("advertising", "Unqualified", "CLEANUP: Not an insurance agency. Actual business: Advertising/marketing company"),
    ]
    
    for indicator, action, reason in non_insurance_name_indicators:
        if indicator in name:
            # But make sure "insurance" isn't also in the name (e.g., "XYZ Tech Insurance Agency")
            if "insurance" not in name and "ins " not in name and not name.endswith(" ins"):
                return action, reason
    
    # If specialization mentions insurance or trucking-related, it's likely fine
    # No action needed
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

def trigger_rescoring():
    """Trigger rescoring after cleanup"""
    resp = requests.post(
        f"{BASE_URL}/api/scoring",
        headers=HEADERS,
        timeout=60
    )
    resp.raise_for_status()
    return resp.json()

def write_log(log_entries, summary):
    """Write cleanup log to file"""
    log_path = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/CLEANUP_LOG.md"
    
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    lines = [
        f"# Database Cleanup Log",
        f"",
        f"**Run at:** {now}",
        f"",
        f"## Summary",
        f"",
        f"- **Total leads scanned:** {summary['total_scanned']}",
        f"- **Unqualified:** {summary['unqualified_count']}",
        f"- **Flagged:** {summary['flagged_count']}",
        f"- **Already Unqualified (skipped):** {summary['already_unqualified']}",
        f"- **Errors:** {summary['errors']}",
        f"",
        f"### Industries Found (Contamination)",
        f"",
    ]
    
    for industry, count in sorted(summary['industries'].items(), key=lambda x: -x[1]):
        lines.append(f"- {industry}: {count}")
    
    lines.extend([
        f"",
        f"## Detailed Changes",
        f"",
        f"| Lead ID | Company Name | Action | Reason |",
        f"|---------|-------------|--------|--------|",
    ])
    
    for entry in log_entries:
        reason_short = entry['reason'][:80].replace("|", "/") + ("..." if len(entry['reason']) > 80 else "")
        lines.append(f"| {entry['id'][:8]}... | {entry['company_name']} | {entry['action']} | {reason_short} |")
    
    lines.extend([
        f"",
        f"## Full Change Details",
        f"",
    ])
    
    for entry in log_entries:
        lines.extend([
            f"### {entry['company_name']}",
            f"- **ID:** {entry['id']}",
            f"- **Action:** {entry['action']}",
            f"- **Reason:** {entry['reason']}",
            f"- **Previous Status:** {entry.get('prev_status', 'Unknown')}",
            f"",
        ])
    
    with open(log_path, "w") as f:
        f.write("\n".join(lines))
    
    print(f"\nLog written to: {log_path}")

def main():
    print("=== CORGI DATABASE CLEANUP AGENT ===")
    print(f"Started at: {datetime.now()}")
    print()
    
    # Fetch all leads
    all_leads = fetch_all_leads()
    
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
    
    # Show what we're about to unqualify
    print("\n--- LEADS TO UNQUALIFY ---")
    for lead, reason in to_unqualify:
        print(f"  [{lead['id'][:8]}] {lead['company_name']} | {reason[:60]}")
    
    print("\n--- LEADS TO FLAG ---")
    for lead, reason in to_flag:
        print(f"  [{lead['id'][:8]}] {lead['company_name']} | {reason[:60]}")
    
    # Apply changes
    log_entries = []
    errors = 0
    industry_counts = {}
    
    print("\n\nApplying changes...")
    
    # Unqualify
    for lead, reason in to_unqualify:
        try:
            patch_lead(lead["id"], "Unqualified", reason, verified=False)
            log_entries.append({
                "id": lead["id"],
                "company_name": lead["company_name"],
                "action": "Unqualified",
                "reason": reason,
                "prev_status": lead.get("status")
            })
            
            # Track industry
            industry_key = "Unknown"
            if "tech" in reason.lower() or "software" in reason.lower() or "saas" in reason.lower() or "cyber" in reason.lower():
                industry_key = "Technology/SaaS"
            elif "logistics" in reason.lower() or "transport" in reason.lower() or "freight" in reason.lower() or "shipping" in reason.lower():
                industry_key = "Logistics/Transportation"
            elif "health" in reason.lower() or "medical" in reason.lower() or "behavioral" in reason.lower():
                industry_key = "Healthcare"
            elif "construction" in reason.lower() or "contractor" in reason.lower():
                industry_key = "Construction"
            elif "advertising" in reason.lower() or "marketing" in reason.lower():
                industry_key = "Advertising/Marketing"
            elif "fintech" in reason.lower() or "payment" in reason.lower() or "cash advance" in reason.lower():
                industry_key = "Fintech"
            industry_counts[industry_key] = industry_counts.get(industry_key, 0) + 1
            
            print(f"  ✓ UNQUALIFIED: {lead['company_name']}")
            time.sleep(0.1)
        except Exception as e:
            errors += 1
            print(f"  ✗ ERROR unqualifying {lead['company_name']}: {e}")
    
    # Flag
    for lead, reason in to_flag:
        try:
            # Only flag if not already flagged
            if lead.get("status") != "Flagged":
                patch_lead(lead["id"], "Flagged", reason)
                log_entries.append({
                    "id": lead["id"],
                    "company_name": lead["company_name"],
                    "action": "Flagged",
                    "reason": reason,
                    "prev_status": lead.get("status")
                })
                industry_counts["Borderline/Flagged"] = industry_counts.get("Borderline/Flagged", 0) + 1
                print(f"  ⚑ FLAGGED: {lead['company_name']}")
                time.sleep(0.1)
        except Exception as e:
            errors += 1
            print(f"  ✗ ERROR flagging {lead['company_name']}: {e}")
    
    # Write log
    summary = {
        "total_scanned": len(all_leads),
        "unqualified_count": len(to_unqualify),
        "flagged_count": len(to_flag),
        "already_unqualified": already_unqualified,
        "errors": errors,
        "industries": industry_counts
    }
    write_log(log_entries, summary)
    
    # Trigger rescoring
    print("\nTriggering rescoring...")
    try:
        rescore_result = trigger_rescoring()
        print(f"Rescoring result: {rescore_result}")
    except Exception as e:
        print(f"Rescoring error (non-fatal): {e}")
    
    print("\n=== CLEANUP COMPLETE ===")
    print(f"  Unqualified: {len(to_unqualify)}")
    print(f"  Flagged: {len(to_flag)}")
    print(f"  Errors: {errors}")
    print(f"  Finished at: {datetime.now()}")
    
    return summary, log_entries

if __name__ == "__main__":
    main()
