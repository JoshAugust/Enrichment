#!/usr/bin/env python3
"""
Batch PATCH script for Contact Name Hunter - Batch B (v2 - verified IDs only)
"""
import json
import urllib.request
import urllib.error
import time

BASE_URL = "https://corgi-enrichment-production.up.railway.app"
API_KEY = "corgi-enrichment-2026"

# All confirmed names with VERIFIED lead IDs from actual API responses
# Format: (lead_id, company_name, contact_name, title)
CONFIRMED_NAMES = [
    # === OFFSET 400 area ===
    ("21ae0c38-0996-40cf-8fb1-259d2419dde5", "Professionals Insurance Agency Louisville", "John M. DeWeese", "President"),
    # === OFFSET 500 area ===
    ("b7de99d5-64fa-498d-9bfa-434c7d3326c5", "Guardian Insurance Group Memphis", "Kelly Hines", "Owner/Agent"),
    ("3c8499c4-395c-4464-b789-b51f374a74a2", "Central States Insurance Brokers", "Anthony Harangozo", "Owner"),
    ("45ad30ce-b0b3-4b63-8a21-664fe77224b8", "Loy Insurance", "DJ Loy", "Owner"),
    ("bd9325d2-b0b3-457f-abfb-d0a0b149084d", "Barold Barragan Insurance Sacramento", "Oscar Barragan", "Owner"),
    ("6274b039-8346-4c1d-a135-00cde73fd8fa", "Crosswinds Insurance Agency", "Renado Robinson", "Owner"),
    ("db71f535-d47f-497e-81ce-ab2ac12089e3", "Mackley Insurance Philadelphia", "Joseph Mackley", "Owner/Founder"),
    ("9160516e-f5d3-49d1-83e7-f036ee3ff015", "RightWay Insurance Knoxville", "Ryan McGrew", "Agency Owner"),
    ("161a9623-95b0-4804-a51f-076766190d3b", "Ables Insurance Agency", "Bryan Ables", "Owner"),
    ("ff5acd12-f451-4991-bd39-32663c41737d", "Conexus Insurance Agency", "Alex Pedersen", "Co-founder"),
    ("70c12b70-3dd5-4408-8f39-a0b2782ac5fe", "Movers Choice Insurance", "Clayton Ciavarella", "Director"),
    ("8b32ba39-edbb-4c85-b2a6-c8564b8e9e6c", "Gennock Insurance Agency", "Justin Gennock", "Owner"),
    ("ff9a566d-54ee-4acf-9537-6b43e7131824", "Garcia and Associates Insurance Bakersfield", "Robert Garcia", "Owner/Founder"),
    ("dcb3e2ab-0c44-49ec-9384-96dbe008bbb6", "Desert West Insurance Agency", "Paul LaVelle", "Owner/Founder"),
    ("58e68ab9-7380-40b6-abf6-d1ba38975349", "ASAP Insurance Agency El Paso", "Johnny A. Hernandez", "Owner"),
    ("f932de67-f592-45c2-a18a-014f24427038", "Stevens Insurance Associates Chattanooga", "Chuck Stevens", "Owner"),
    ("5a8e765a-a393-44b1-aaab-708a739a99cf", "GO Insurance Texas El Paso", "Gustavo Ortiz", "Agency Owner"),
    ("a8f83407-6820-40e7-812e-b2922a763315", "Brown-McNerney-Johnson Insurance Agency", "Daryl R. Johnson", "President"),
    ("bd6582a6-ac67-4584-85d7-f3525ac935f4", "Insurance Solutions of Omaha", "Chris Janke", "Owner/Partner"),
    ("fbe520a4-5dc0-4223-8911-645b760a7254", "MG Insurance Brokers Inc Chicago", "Rafal Gancarczyk", "Owner/Principal"),
    ("f1e2dd72-1afa-4a8b-8eff-fe94732eeda5", "Cresco Insurance Agency Chicago", "Paula Jimenez", "President/Owner"),
    ("3bbd71e9-0336-4d74-8ced-115caf0878e3", "Pikes Peak Insurance Agency Colorado Springs", "Chris Wood", "Owner"),
    # === OFFSET 600 area ===
    ("b9bcd79e-5708-4e03-b0fb-bb660856b67c", "Endres Insurance Agency Wausau", "Mike Endres", "Owner"),
    ("f8ae76aa-51f5-4b21-86a0-89107aac50de", "Cover Me Insurance Lexington", "Michael J. Poller", "Founder"),
    ("4efce5db-c11f-4b4b-b4a5-31cad7972a0b", "Northern States Agency Sioux Falls", "Shaun T. Olsson", "President"),
    ("eb24d986-6891-42c3-af03-00fe2a7fefa7", "Insurance Consultants of Pittsburgh", "Matt Straley", "Agency Manager"),
    ("03318576-8a22-4312-bc5a-d594ca37796d", "Flatland Expeditions Trucking Insurance", "Zachary Kramer", "Principal/Owner"),
    ("06601a5f-709e-4422-afee-9f72eff7d69e", "Hercor Insurance Group Tucson", "Luis Hernandez", "Principal"),
    ("09edcc9c-3adc-4397-b088-a5539a6ca552", "Insurance Brokers of Arizona Phoenix", "Cameron Brown", "Agency Owner"),
    ("7d3bf34f-9e73-4e8b-98bd-eccae4624ffb", "FleetGuard USA Atlanta", "Jamie McVay", "Owner"),
    ("f48a4afc-999e-4c29-8b0e-c56f65cb0dab", "The RDG Agency Denver", "Jose Rios", "Owner/Agent"),
    ("613bd461-79e6-4dc1-af81-7fc8689e42c2", "Paulin Insurance Associates LLC Metairie", "Christopher Paulin", "President"),
    ("aa65debc-673d-4124-b8c1-a8e1121da6b9", "Mayflower Insurance Greenwood IN", "Patricia Silva", "Owner"),
    ("6b5490ec-e967-406a-bdd1-59ceb15f322c", "The Insurance Group Knoxville", "Josh Witt", "Agency President"),
    ("f2b4ee84-b889-455e-acd6-30fca270c59f", "Historic Square Agency Erie PA", "Ted Grassi", "Partner"),
    ("8e525f26-6d0b-4a81-8c29-b593b2ae8505", "National Livestock Insurance Amarillo", "Brandon Latham", "Owner/Agent"),
    ("958d83df-e131-44cd-9d76-13d4c9c6ed43", "Sharp Insurance Agency Knoxville", "Wess Sharp", "Owner"),
    ("fbecbe78-756f-45a3-9f70-ccf5871b2abb", "TranStar Insurance Brokers Oklahoma City", "Ken Palmer", "President"),
    ("873a05df-3ef4-48f7-aa32-9611590337ef", "Marketers General Insurance Agency Oklahoma City", "Rae Garrett", "President"),
    ("267a6839-17c1-4404-a5b8-51c4967bf847", "Blackwell Insurance Agency", "Leigh Blackwell-Zellmer", "Owner"),
    ("279f2575-b4a2-4024-90b1-b838b64c343d", "Paramount Exclusive Insurance Chicago", "Shawn Kohen", "President"),
    ("3d0646b1-ad2f-4b5c-923f-f5c0c0c7ea61", "Sierra Oak Insurance Agency Sacramento", "Josh Brock", "Owner"),
    ("dff4e1f4-d40c-432c-a68d-62cb4368ec6f", "Kincaid Insurance Group Indianapolis", "Dan Kincaid", "Founder"),
    ("514fd405-f21f-4429-9314-899bc826d144", "Hamler-Gingrich Insurance Agency Cincinnati", "Matt Gingrich", "CEO/President"),
    ("b14d90f8-851c-4eb4-ab13-d67c28a49e9f", "Daylight Insurance Ohio Columbus", "Sean Myers", "Owner"),
    ("b5cdad7f-3a5b-433a-a76a-1635c6eb7f84", "Spectrum Insurance Group Eau Claire", "Darrel Zaleski", "Owner"),
    ("a778c398-ccfd-4498-85e5-7b51d7877050", "Ellinger Riggs Insurance Noblesville IN", "Rob Ellinger", "President"),
    ("183235ed-d85d-4667-abba-7d7fb136e213", "Tulsa Insurance Guy", "Rebecca Eubanks", "Owner/Principal Agent"),
    ("3bcf44e2-4883-40f4-a0db-c9a5815f530d", "IDEAL Solutions Insurance Services Rexburg ID", "Steven Welker", "President"),
    ("9a6b4e32-313a-4d68-956e-5bc05781ff3f", "Eagle National Truck Insurance Dallas", "Michael Bilbao", "Principal"),
    ("48c5ff72-73c0-493e-b11f-857a8d5e80fb", "RoadMasters Insurance McAllen TX", "Homero Garcia", "CEO"),
    # === OFFSET 700 area ===
    ("39569002-87bd-4c1d-9565-e3dba24a0a66", "Titan Risk Solutions Albuquerque", "Tim Smith", "President"),
    ("8f01d38f-eb95-47c1-9e61-552cc8dc5a8c", "Superior Insurance Agency Fargo ND", "Jorin Johnson", "Owner"),
    ("7180bed0-d1b7-4d31-b8c3-6227071fbd21", "McNair and Associates Fayetteville AR", "Mark McNair", "Owner"),
    ("85bdba5a-aa0d-4024-abf6-6937c120f24b", "Insurefit RM Nashville", "Mel Evans", "Principal Agent/Founder"),
    ("bc05fd97-e54f-4e29-9e6f-5db355c7a1b6", "Exceed Insurance Las Vegas", "Randeep Chawla", "Founder/President"),
    ("f2899d25-ba34-4cb0-9fe9-006ef4c5614d", "Gold River Insurance Sacramento", "Samuel Ashkenazi", "CEO"),
    ("afb83f66-572e-467b-aacf-c6fcea7633b1", "Colonial Insurance Services Jacksonville FL", "Teo Balev", "Managing Partner"),
    ("cd001b7c-4ea6-4ba8-8a85-c57d145a44bf", "The Truckers Insurance Atlanta GA", "Elisha Petite", "Owner/Founder"),
    ("d530bb0f-3b09-4ddc-a7b7-95cd368099e1", "Savannah Insurance Advisors Savannah GA", "John Smyre", "Founder/CEO"),
    ("f93bf4af-0dba-46ef-86d3-47806c8ad6c9", "Hudson Trucking Insurance Atlanta", "Todd Kohout", "CEO"),
    ("d7117f5f-a691-44ed-b32d-beb5bba7c5a5", "Padgett Insurance Agency Savannah", "Troy Padgett", "President"),
    ("54d8e9aa-555b-4650-b0eb-28bb1792f070", "3G Truckin Insurance Alpharetta GA", "Ed Gillman", "Owner"),
    ("1ad9eb7d-3d0f-4104-ae40-cb33c84f4420", "Lightship Insurance Denver CO", "John Klaassen", "Founder/President"),
    ("a2f01ac4-dc9f-4951-a37f-1dbf44e05198", "Vatic Insurance Louisville KY", "Harry Sidhu", "CEO"),
    ("f3b7cff7-2b18-4c33-92e1-68d6150963c4", "VOS Insurance Houston TX", "Derrick Agueros", "Owner"),
    ("11a926b1-fac1-4568-be39-c3087cfdfc61", "Covenant Insurance Services Oklahoma City", "Dakota Coffman", "President/Founder"),
    ("f02a6619-0c02-4201-8da8-7916ae648e1d", "McInnis Insurance Services Baton Rouge LA", "Charles McInnis Jr.", "President"),
]

def patch_lead(lead_id, company_name, contact_name, title):
    url = f"{BASE_URL}/api/leads/{lead_id}"
    agent_notes = f"Contact: {contact_name} ({title}). Found via web research."
    payload = json.dumps({
        "contact_name": contact_name,
        "agent_notes": agent_notes
    }).encode()
    
    req = urllib.request.Request(url, data=payload, method='PATCH')
    req.add_header('Content-Type', 'application/json')
    req.add_header('X-API-Key', API_KEY)
    req.add_header('X-Human-Edit', 'true')
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
            cn = result.get('lead', {}).get('contact_name', '?') if isinstance(result, dict) else '?'
            return True, cn
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()[:200]
        return False, f"HTTP {e.code}: {error_body}"
    except Exception as e:
        return False, str(e)

results = []
success_count = 0
fail_count = 0

print(f"Starting PATCH for {len(CONFIRMED_NAMES)} leads...")
for lead_id, company, contact, title in CONFIRMED_NAMES:
    ok, resp = patch_lead(lead_id, company, contact, title)
    if ok:
        success_count += 1
        status = f"✓ {company[:40]} → {contact}"
    else:
        fail_count += 1
        status = f"✗ {company[:40]} ({lead_id[:8]}): {resp}"
    print(status)
    results.append(status)
    time.sleep(0.15)

print(f"\n{'='*60}")
print(f"DONE: {success_count} patched, {fail_count} failed out of {len(CONFIRMED_NAMES)} total")
