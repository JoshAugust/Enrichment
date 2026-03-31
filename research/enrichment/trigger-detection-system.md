# Trigger Detection System — Practical Implementation Research
*Research Date: 2026-03-29*

---

## 1. ImportGenius — Trade Data Intelligence

### Pricing Plans (2026)
| Plan | Price | Key Limits |
|------|-------|-----------|
| **Starter/Basic** | ~$149/mo | 25 searches/day, 1,000 downloads/mo, last 12 months US data only |
| **Business/Plus** | ~$319/mo | 50 searches/day, 1,000 downloads/mo, full history from 2006 |
| **Enterprise/Pro** | ~$399/mo+ (annual) | Unlimited searches, custom downloads, 25+ countries, AI HS codes |

- Plans billed annually; monthly pricing is higher
- **New in 2025/2026:** Global Pro, American Pro, North American Pro annual tiers
- Free trial available
- Global data (Asia, Europe, Latin America) is an optional add-on on lower tiers; included in Enterprise

### HS Codes for GPU Hardware
- **8473.30 / 8473.30.20** — Parts and accessories for computers (graphics cards, GPU boards) — PRIMARY
- **8471.50** — Processing units for ADP machines — used for compute systems
- **8542.31** — Electronic integrated circuits (bare die GPUs)
- ImportGenius AI now enriches ~70% of 2024–2025 US import records with HS codes at HS2–HS8 precision
- HS code search available on Business and Enterprise annual plans only
- ML confidence threshold: 80%+ before showing results

### Sample Import Record Fields (US Bill of Lading)
Typical fields available:
- Consignee name + address
- Shipper/supplier name + country
- Vessel name, voyage number, port of arrival
- Bill of Lading number
- Number of containers/pieces, weight
- Product description (text from manifest)
- HS code (AI-enriched on newer records)
- Arrival date

### Data Delay
- **US imports:** Updated daily — records typically available within **24–72 hours** of customs filing
- **Other countries:** Monthly refresh cycle
- Data sourced via direct relationships with customs authorities and data vendors
- Much faster signal than quarterly earnings reports

### Automated Alerts
- **YES — alerts are available:** Users can set up email alerts triggered when a monitored company has new shipments
- Described as: "notified as soon as shipments of interest clear customs"
- Alert setup: monitor specific companies (consignees/shippers) or search terms
- **Gap:** No confirmed HS code-specific alert (company-level only confirmed)
- Alerts are available on Business plans and above

### Practical Use for GPU Intelligence
1. Monitor known GPU hyperscale importers (CoreWeave, Lambda, Together AI) by company name
2. Search HS 8473.30 + keyword "GPU" or "H100" or "NVIDIA" for new unknown buyers
3. Set company alerts on suspected target accounts
4. Cross-reference supplier names (Foxconn, Quanta, Wistron) shipping to new US consignees

---

## 2. UCC Filing Monitoring

### Delaware ICIS — Critical Caveat
Delaware's ICIS (Integrated Corporation Information System) **does NOT have a public search interface**. Unlike most states, Delaware requires all UCC searches be performed by a **Delaware Authorized Searcher** — a certified third party.

- Direct URL for filing: https://icis.corp.delaware.gov/ecorp/ucc.aspx (filing only, not searching)
- Authorized searcher list: https://corp.delaware.gov/uccauthsrch/
- Cost: $25 certification fee + $25 mandatory 24-hour expedited fee = **$50/search**
- Contact: (302) 739-3073

### Search Logic — Important Limitations
Delaware is **name-based only**, not collateral-based:
- You CANNOT search by "GPU" or "H100" as collateral keywords in bulk
- You MUST search by debtor name (the borrowing company)
- No name variations — exact words only, so you need every variation you can think of
- Search types: "Name Search" (active UCCs only) or "Name Search w/ Lapsed" (includes expired up to 1 year)

### Practical Search Terms for GPU Companies
Since it's name-based, build a target list of known GPU borrowers:
- CoreWeave, Inc.
- Lambda Labs, Inc.
- Crusoe Energy Systems
- Together AI
- Coreweave (spelling variations)
- Any portfolio/prospect company names

### Known GPU-Backed UCC Deals (Real Examples)
- **CoreWeave** — ~$8B in GPU-backed debt by end 2024; H100 chips as collateral
- **Lambda Labs** — $500M loan backed by Nvidia chips
- **Crusoe Energy** — $200M from Upper90, H100 TensorCore GPUs as collateral
- UCC-1 filings list GPU serial numbers down to individual chip level

### UCC Monitoring Services (For Automated Alerts)

| Service | Key Features | Best For |
|---------|-------------|----------|
| **FiCoso (First Corporate Solutions)** | Monitors UCC1, UCC3, tax liens, judgment liens; alerts on new junior creditors, fraudulent terminations | Lenders, factors |
| **Wolters Kluwer iLien** | Daily monitoring, debtor name change alerts, merger/dissolution alerts, auto-continuation | Enterprise lenders |
| **CSC (Corporate Service Company)** | Email alerts on new filings, 6-month expiry warnings, corporate change alerts | Mid-market lenders |
| **CT Corporation / IntelliChart** | SaaS lien management, filing + search + tracking | Large firms |

### Implementation Strategy
1. Build a target list of known/suspected GPU fleet companies
2. Run quarterly FiCoso or CSC searches on each debtor name — cost is ~$50/search via Delaware
3. For other states (California, Texas, Virginia), state UCC databases ARE publicly searchable — free
4. Search California SOS (bizfileonline.sos.ca.gov) for GPU collateral by keyword — much easier
5. **Collateral language to search:** "graphics processing unit", "GPU", "NVIDIA", "H100", "A100", "computer equipment", "data center equipment"

---

## 3. Job Posting Monitoring

*[Research in progress — writing after completion]*

---

## 4. Capital Event Monitoring

*[Research in progress — writing after completion]*

---

## 5. Grid Interconnection Queues

*[Research in progress — writing after completion]*

---

## 6. 2026 Conference Calendar

*[Research in progress — writing after completion]*
