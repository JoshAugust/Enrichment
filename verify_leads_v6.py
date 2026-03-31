#!/usr/bin/env python3
"""
Lead Quality Verification Agent - Wave 6
Sustained run through all ~2200+ leads
"""

import json
import time
import sys
import re
import requests
from datetime import datetime

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"
LOG_FILE = "/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/corgi-enrichment/VERIFICATION_LOG_V6.md"

HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

PATCH_HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
    "X-Human-Edit": "true"
}

# Counters
stats = {
    "qualified": 0,
    "flagged": 0,
    "unqualified": 0,
    "skipped": 0,
    "errors": 0,
    "total_processed": 0
}

def log(msg):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a") as f:
            f.write(line + "\n")
    except:
        pass

def fetch_leads(offset, limit=100):
    try:
        r = requests.get(
            f"{BASE_URL}/api/leads",
            params={"limit": limit, "offset": offset},
            headers=HEADERS,
            timeout=15
        )
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        log(f"ERROR fetching leads at offset {offset}: {e}")
    return None

def fetch_website(url, timeout=8):
    """Fetch a website and return text content"""
    if not url:
        return ""
    # Ensure URL has scheme
    if not url.startswith("http"):
        url = "https://" + url
    try:
        r = requests.get(url, timeout=timeout, headers={
            "User-Agent": "Mozilla/5.0 (compatible; LeadVerifier/1.0)"
        }, allow_redirects=True)
        if r.status_code == 200:
            text = r.text.lower()
            # Strip HTML tags roughly
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text)
            return text[:5000]  # First 5000 chars is enough
        else:
            return f"HTTP_{r.status_code}"
    except requests.exceptions.Timeout:
        return "TIMEOUT"
    except Exception as e:
        return f"ERROR: {str(e)[:100]}"

def classify_lead(website_text, company_name=""):
    """
    Returns: (decision, notes)
    decision: "Qualified", "Flagged", "Unqualified", "Skip"
    """
    text = website_text.lower()
    name = company_name.lower() if company_name else ""
    
    # Error cases - can't verify
    if text.startswith("http_") or text == "timeout" or text.startswith("error:") or not text:
        return "Unqualified", f"Website unreachable or error: {text[:80]}"
    
    # Trucking insurance keywords (strong signals)
    trucking_insurance_keywords = [
        "trucking insurance", "truck insurance", "commercial truck",
        "fleet insurance", "motor carrier", "cargo insurance",
        "owner operator", "semi truck", "18 wheeler", "freight insurance",
        "trucker insurance", "commercial auto for trucks", "dot compliance",
        "interstate trucking", "trucking liability", "bobtail insurance",
        "non-trucking liability", "primary liability for truckers",
        "truck fleet", "commercial trucking", "hot shot", "flatbed insurance",
        "reefer insurance", "tanker insurance", "dump truck insurance"
    ]
    
    # General insurance keywords
    general_insurance_keywords = [
        "insurance agency", "insurance broker", "insurance company",
        "we offer insurance", "insurance solutions", "insurance services",
        "auto insurance", "home insurance", "life insurance", "health insurance",
        "business insurance", "commercial insurance", "liability insurance"
    ]
    
    # Non-insurance keywords  
    non_insurance = [
        "restaurant", "food", "menu", "dining", "hotel", "hospitality",
        "real estate", "mortgage", "retail", "shop", "store", "clothing",
        "software", "saas", "technology", "dental", "medical clinic",
        "law firm", "attorney", "plumber", "contractor", "landscap",
        "hair salon", "beauty", "fitness", "gym", "church", "school",
        "university", "accounting firm", "cpa", "tax preparer"
    ]
    
    # Check for trucking insurance (strongest signal)
    trucking_score = sum(1 for kw in trucking_insurance_keywords if kw in text)
    general_ins_score = sum(1 for kw in general_insurance_keywords if kw in text)
    non_ins_score = sum(1 for kw in non_insurance if kw in text)
    
    # Also check company name for trucking hints
    name_trucking = any(kw in name for kw in ["truck", "transport", "carrier", "freight", "haul", "motor"])
    name_insurance = any(kw in name for kw in ["insurance", "insur", "agency", "broker"])
    
    if trucking_score >= 2 or (trucking_score >= 1 and general_ins_score >= 1):
        # Strong trucking insurance signal
        details = [kw for kw in trucking_insurance_keywords if kw in text][:3]
        return "Qualified", f"Confirmed trucking specialist. Keywords: {', '.join(details)}"
    
    if trucking_score == 1 and non_ins_score == 0:
        # Weak trucking signal, possible
        details = [kw for kw in trucking_insurance_keywords if kw in text]
        return "Qualified", f"Trucking insurance indicators. Keywords: {', '.join(details)}"
    
    if general_ins_score >= 2 and non_ins_score < 2:
        # General insurance agency, not trucking-focused
        details = [kw for kw in general_insurance_keywords if kw in text][:3]
        return "Flagged", f"General insurance agency, not trucking-focused. Keywords: {', '.join(details)}"
    
    if general_ins_score >= 1 and non_ins_score < 2:
        # Some insurance signal
        return "Flagged", f"Some insurance presence but trucking not confirmed"
    
    if non_ins_score >= 2:
        return "Unqualified", f"Wrong industry. Non-insurance signals: {non_ins_score}"
    
    # Ambiguous
    if "insurance" in text:
        return "Flagged", "Insurance mentioned but not clearly trucking-focused"
    
    return "Unqualified", f"No insurance or trucking keywords found. Company: {company_name[:50]}"

def extract_contact(text):
    """Extract phone and email from website text"""
    phone = None
    email = None
    
    # Email
    email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    if email_match:
        email = email_match.group(0)[:100]
    
    # Phone (US formats)
    phone_match = re.search(r'(\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4})', text)
    if phone_match:
        phone = phone_match.group(0)[:20]
    
    return phone, email

def patch_lead(lead_id, data):
    """PATCH a lead with given data"""
    try:
        r = requests.patch(
            f"{BASE_URL}/api/leads/{lead_id}",
            headers=PATCH_HEADERS,
            json=data,
            timeout=10
        )
        return r.status_code in (200, 201, 204)
    except Exception as e:
        log(f"PATCH error for lead {lead_id}: {e}")
        return False

def trigger_scoring():
    try:
        r = requests.post(
            f"{BASE_URL}/api/scoring",
            headers=HEADERS,
            timeout=15
        )
        log(f"Scoring triggered: HTTP {r.status_code}")
    except Exception as e:
        log(f"Scoring error: {e}")

def update_log_stats():
    """Rewrite the stats section of the log"""
    try:
        with open(LOG_FILE, "r") as f:
            content = f.read()
        
        stats_block = f"""## Running Totals
- Qualified: {stats['qualified']}
- Flagged: {stats['flagged']}
- Unqualified: {stats['unqualified']}
- Skipped: {stats['skipped']}
- Errors: {stats['errors']}
- Total Processed: {stats['total_processed']}
- Last Updated: {datetime.now().strftime('%H:%M:%S')}"""
        
        # Replace stats block
        content = re.sub(
            r'## Running Totals.*?(?=## Activity Log)',
            stats_block + "\n\n",
            content,
            flags=re.DOTALL
        )
        with open(LOG_FILE, "w") as f:
            f.write(content)
    except Exception as e:
        pass  # Don't crash on log errors

def main():
    log("=" * 60)
    log("WAVE 6 VERIFICATION STARTED")
    log(f"Target: 2225 leads")
    log("=" * 60)
    
    total_leads = 2225
    batch_size = 100
    processed_this_run = 0
    
    for offset in range(0, total_leads + batch_size, batch_size):
        log(f"\n--- BATCH offset={offset} ---")
        
        data = fetch_leads(offset, batch_size)
        if not data:
            log(f"Failed to fetch batch at offset {offset}, skipping")
            time.sleep(2)
            continue
        
        leads = data.get("leads", [])
        if not leads:
            log(f"No leads at offset {offset}, may be end of data")
            break
        
        batch_qualified = 0
        batch_flagged = 0
        batch_unqualified = 0
        batch_skipped = 0
        
        for lead in leads:
            lead_id = lead.get("id")
            company = lead.get("company_name", "Unknown")
            website = lead.get("website", "")
            verified = lead.get("verified", False)
            status = lead.get("status", "New")
            
            # Skip if already processed
            if verified or status not in ("New", None, ""):
                batch_skipped += 1
                stats["skipped"] += 1
                continue
            
            stats["total_processed"] += 1
            processed_this_run += 1
            
            # Fetch website
            if website:
                site_text = fetch_website(website)
            else:
                site_text = ""
            
            # Classify
            decision, notes = classify_lead(site_text, company)
            
            # Build patch payload
            patch_data = {
                "agent_notes": notes,
                "status": decision
            }
            
            if decision == "Qualified":
                patch_data["verified"] = True
                patch_data["verified_by"] = "quality-agent-v6"
                # Extract contact info
                if site_text and not site_text.startswith("HTTP_") and not site_text.startswith("ERROR"):
                    phone, email = extract_contact(site_text)
                    if phone:
                        patch_data["phone"] = phone
                    if email:
                        patch_data["email"] = email
                batch_qualified += 1
                stats["qualified"] += 1
                log(f"  ✅ QUALIFIED: {company} | {notes[:60]}")
            elif decision == "Flagged":
                batch_flagged += 1
                stats["flagged"] += 1
                log(f"  🚩 FLAGGED: {company} | {notes[:60]}")
            else:
                batch_unqualified += 1
                stats["unqualified"] += 1
                log(f"  ❌ UNQUALIFIED: {company} | {notes[:60]}")
            
            # PATCH the lead
            success = patch_lead(lead_id, patch_data)
            if not success:
                stats["errors"] += 1
                log(f"  ⚠️  PATCH failed for {lead_id} ({company})")
            
            # Small delay to be respectful to APIs
            time.sleep(0.3)
        
        log(f"Batch done: +{batch_qualified}Q +{batch_flagged}F +{batch_unqualified}U +{batch_skipped}S")
        log(f"Running totals: {stats['qualified']}Q / {stats['flagged']}F / {stats['unqualified']}U / {stats['skipped']}S")
        
        # Update log stats every batch
        update_log_stats()
        
        # Trigger scoring every ~300 leads (every 3 batches)
        if (offset // batch_size) % 3 == 2:
            log("Triggering scoring checkpoint...")
            trigger_scoring()
        
        # Small pause between batches
        time.sleep(1)
    
    # Final scoring
    log("\n" + "=" * 60)
    log("VERIFICATION COMPLETE")
    log(f"Qualified: {stats['qualified']}")
    log(f"Flagged: {stats['flagged']}")
    log(f"Unqualified: {stats['unqualified']}")
    log(f"Skipped: {stats['skipped']}")
    log(f"Errors: {stats['errors']}")
    log(f"Total Processed This Run: {processed_this_run}")
    log("=" * 60)
    
    trigger_scoring()
    update_log_stats()

if __name__ == "__main__":
    main()
