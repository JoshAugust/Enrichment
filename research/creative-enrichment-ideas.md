# 🧠 Creative & Unconventional Data Enrichment Ideas
## GPU Infrastructure, AI Computing, Data Centers & Equipment Finance

*Written by a creative strategist. Validated against real tools and real examples.*
*Last updated: March 2026*

---

> **The obvious stuff (LinkedIn, Crunchbase, SEC filings) is being covered.
> Everything in this document is the weird stuff. The angles nobody thinks of.
> Each idea includes: methodology, data yielded, implementation, difficulty, value rating, and real-world proof it works.**

---

## TABLE OF CONTENTS

1. [Reverse Engineering](#1-reverse-engineering)
2. [Financial Forensics](#2-financial-forensics)
3. [Infrastructure Intelligence](#3-infrastructure-intelligence)
4. [Supply Chain Intelligence](#4-supply-chain-intelligence)
5. [Social Graph & Community Intelligence](#5-social-graph--community-intelligence)
6. [Job Market Intelligence](#6-job-market-intelligence)
7. [Government & Public Records](#7-government--public-records)
8. [Content & Research Intelligence](#8-content--research-intelligence)
9. [Competitive Intelligence](#9-competitive-intelligence)
10. [Meta-Intelligence (The Truly Wild Stuff)](#10-meta-intelligence-the-truly-wild-stuff)
11. [Prioritized Hit List](#11-prioritized-hit-list)

---

## 1. REVERSE ENGINEERING

---

### 1.1 — Carbon/ESG Reports → GPU Fleet Size Estimation

**The Method:**
Companies publishing ESG/sustainability reports disclose their electricity consumption in MWh or kWh. GPU servers have predictable power draw: an H100 DGX H100 cluster (8 GPUs) draws ~10.2kW. If a company's ESG report shows a data center power jump of, say, 50MW year-over-year, you can back-calculate roughly how many H100s were installed.

**Formula:**
- 1 H100 ≈ 700W TDP
- 1 MW = ~1,428 H100s at full utilization
- A 100MW AI facility ≈ 142,800 H100 equivalents

**Data Yielded:**
- Approximate GPU fleet size
- YoY fleet growth rate
- Which companies are SCALING vs. steady-state
- Timing of major GPU deployments (match to earnings calls)

**Implementation:**
1. Scrape ESG/sustainability PDFs from company IR pages (use `pdfminer` or `PyMuPDF`)
2. Extract electricity consumption tables (look for "Scope 2 emissions," "energy consumption," "data center energy")
3. Normalize to per-facility if broken out
4. Apply GPU-watt formula above
5. Cross-reference with known GPU purchase announcements to calibrate

**Difficulty:** Medium
**Value:** High

**Real-World Proof:** Epoch AI does exactly this — they estimate data center compute capacity by counting cooling fans in satellite imagery (fans → cooling capacity → power → GPUs). The methodology is validated and published at epoch.ai/data/data-centers.

---

### 1.2 — Satellite Imagery + Cooling Infrastructure Counting

**The Method:**
Modern GPU data centers have distinctive rooftop signatures: rows of cooling towers, chillers, and CRAC units visible from above. Epoch AI literally counts these fans to estimate power consumption. You can do the same using commercially available satellite imagery.

**The Specific Signal:**
- Liquid cooling systems (CDUs) for H100/B200 densities look different from air-cooled facilities
- New data center construction follows a recognizable timeline: land clearing → foundation → steel → roof → cooling equipment → commissioning
- Roof cooling unit density correlates with GPU density

**Data Yielded:**
- New data centers under construction (6-18 months of lead time)
- Approximate capacity of existing facilities
- Company identity (cross-reference building permits/land records)
- Construction timeline/commissioning date estimates

**Implementation:**
1. **Free tier:** Google Earth Pro (download historical imagery), Copernicus Sentinel-2 (free, 10m resolution)
2. **Paid tier:** SkyFi (~$10-50/image), Planet Labs API ($500+/month), Maxar WorldView ($300+/image)
3. **The actual hack:** Epoch AI published their methodology and CSV data at epoch.ai/data/data-centers — **download it for free** and use it as a starting list of known data centers to enrich
4. Use Google Maps "date" slider on satellite view for change detection (free)
5. Cross-reference coordinates with building permits (see Section 7.2)

**Difficulty:** Hard (manual) / Medium (if using Epoch AI's free CSV)
**Value:** Game-Changer for identifying pre-announcement prospects

**Real-World Proof:** Epoch AI's Frontier Data Centers Hub. Published. Open. Free CSV download. This is not theoretical.

---

### 1.3 — Import/Export Trade Data (The "Who Bought What" Database)

**The Method:**
US Customs and Border Protection collects bill-of-lading data for every import shipment. This data is commercially available through services like Panjiva (S&P Global), ImportGenius, and Volza. You can search for companies that imported NVIDIA GPU servers, DGX systems, or Supermicro GPU chassis.

**Specific HS Codes to Target:**
- `8471.50` — Processing units (servers including GPU servers)
- `8543.70` — Other electrical machines (covers some GPU accelerator cards)
- `8473.30` — Parts and accessories for machines of 8471 (GPU cards, HBM)

**Data Yielded:**
- Company names (importers/receivers)
- Shipment volumes and estimated values
- Country of origin (Vietnam, Taiwan for Supermicro/NVIDIA)
- Frequency of shipments (indicates fleet build vs. one-off)
- Supplier identity (reveals OEM relationships)

**Implementation:**
1. Sign up for Panjiva or ImportGenius (both have trials, full access ~$300-1,500/month)
2. Search by: (a) shipper = "NVIDIA" or "Supermicro" or "Foxconn" or "Quanta", (b) HS code 8471.50, (c) consignee country = USA
3. Export CSV, filter for data center keywords in description fields
4. Cross-reference company names with your CRM

**Difficulty:** Easy (pay for access, run searches)
**Value:** Game-Changer — this is real, structured, actionable purchase data

**Real-World Proof:** Panjiva covers 2B+ shipment records from 22 customs sources. Volza (volza.com/p/nvidia/import/) shows NVIDIA imports in real time. Vietnam leads global NVIDIA imports with 5,824 shipments — this data is LIVE.

---

### 1.4 — BGP Announcements & IP Allocation Forensics

**The Method:**
Companies that build large GPU clusters need lots of IP addresses. They often register new Autonomous System Numbers (ASNs) or announce new BGP prefixes. By monitoring BGP routing table changes, you can identify when a company suddenly starts announcing large IP blocks — a signal they're building out network infrastructure.

Additionally, when companies register IP space with ARIN (the North American RIR), the WHOIS record shows their organization, address, and abuse contact — often revealing previously unknown entities.

**Specific Signals:**
- A startup announcing a /16 or larger IP block (65,535+ IPs) is unusual — indicates serious infrastructure
- New ASN registrations from non-traditional network operators (AI companies, GPU cloud startups)
- BGP communities and peering relationships reveal data center locations

**Data Yielded:**
- Companies building large-scale network infrastructure
- Their physical locations (via peering at IXPs)
- Network size / scale indicator
- Contact info from WHOIS

**Implementation:**
1. **BGPView API** (free): bgpview.io/api — search organization names, see ASN assignments and IP prefixes
2. **ARIN WHOIS** (free): search.arin.net — filter recent registrations by keyword ("AI," "computing," "inference")
3. **RIPEstat** (free): stat.ripe.net — BGP routing tables, prefix announcements, historical data
4. **Shodan** ($99/month): Search `asn:ASxxx` to find all exposed services in a company's IP range — reveals what software they're running (Kubernetes, SLURM job scheduler, etc.)
5. **Censys** (~$150/month): SSL certificate mapping to organizations reveals all their infrastructure

**Difficulty:** Hard (requires network knowledge)
**Value:** High for finding companies BEFORE they announce

**Real-World Proof:** Security researchers and competitive intelligence firms do this routinely. Censys and Shodan are mainstream B2B intel tools. PeeringDB (peeringdb.com) is free and publicly documents which companies peer at which IXPs — revealing their data center footprint.

---

### 1.5 — DNS Records & Subdomain Archaeology

**The Method:**
Companies with GPU infrastructure often create telling DNS subdomains: `gpu01.company.com`, `training-cluster.company.com`, `h100-prod.company.com`, `mlops.company.com`, `slurm.company.com`. These subdomains are often publicly resolvable.

Even better: SSL certificate transparency logs (crt.sh) log every SSL certificate issued — including internal infrastructure subdomains that companies accidentally expose.

**Data Yielded:**
- Confirmation a company has GPU infrastructure
- Infrastructure scale (number of nodes in DNS)
- Technology stack (SLURM vs Kubernetes vs Ray)
- Whether they're GPU cloud customers vs. on-prem

**Implementation:**
1. **crt.sh** (free): Search `%.company.com` in SSL cert transparency logs — reveals ALL subdomains ever issued a certificate
2. **SecurityTrails** (~$50/month): Full historical DNS data and subdomain enumeration
3. **Shodan** + `ssl.cert.subject.cn:*.company.com`: Find all certificates for a company
4. **DNSdumpster** (free): Quick subdomain mapping
5. Look for: `gpu`, `cluster`, `ml`, `training`, `inference`, `cuda`, `hpc`, `slurm`, `ray`, `k8s`, `kubeflow`

**Difficulty:** Easy-Medium
**Value:** Medium — great for confirmation/qualification, not discovery

**Real-World Proof:** OSINT practitioners routinely use crt.sh for recon. It's a free tool that's standard in security research.

---

---

## 2. FINANCIAL FORENSICS

---

### 2.1 — UCC-1 Filings: The Goldmine That Nobody Mines

**The Method:**
When a company finances GPU hardware (leases, equipment loans, ABL facilities), the lender files a UCC-1 financing statement with the Secretary of State in the borrower's state of incorporation. This filing is **public record**, searchable by anyone, and describes the collateral — which often explicitly says "NVIDIA GPU servers," "DGX H100 systems," "GPU computing hardware," etc.

This is arguably the single highest-value public record for equipment finance prospecting that almost nobody uses systematically.

**Data Yielded:**
- Company name, address, state of incorporation
- Lender identity (who's already financing their GPUs — your competition)
- Collateral description (exact GPU model, quantity sometimes)
- Filing date (when they bought)
- Secured party contact info
- Whether they have existing liens (credit risk signal)

**Implementation:**
1. **State-by-state search** (free): Each Secretary of State has a UCC search portal
   - Delaware (where most corps are formed): corp.delaware.gov
   - California: bizfileonline.sos.ca.gov/search/ucc
   - New York: appext20.dos.ny.gov/pls/ucc_public
   - For all states: alogent.com/innovation-hub/ucc lists every state portal
2. **Wolters Kluwer** (~$200+/search): Commercial service for nationwide UCC search
3. **CSC Global** or **CT Corporation**: Enterprise UCC search services
4. **The Automation Play**: Use UCC search APIs (some states have them) to pull all filings with keywords "GPU," "NVIDIA," "computing," "data center" in collateral descriptions
5. **Weekly monitoring**: Set up alerts for new filings mentioning GPU/AI hardware keywords

**Difficulty:** Medium (manual state-by-state) / Hard (building automated pipeline)
**Value:** Game-Changer — literally shows you who just financed GPU equipment and who their lender is

**Real-World Proof:** This is standard practice for commercial lenders doing due diligence. Equipment finance companies like GreatAmerica, DLL, and Amur routinely search UCC filings on prospects. It's under-used for prospecting because it requires state-by-state work.

---

### 2.2 — Lender Portfolio Reverse-Engineering

**The Method:**
Equipment finance companies that have done GPU-backed lending sometimes disclose their portfolios in:
- Their own SEC filings (if publicly traded)
- Press releases about securitization deals
- Case studies on their websites
- Investor presentations

By analyzing these, you can identify (a) who their borrowers are and (b) build a list of companies already in the GPU equipment finance ecosystem.

**Specific Targets:**
- Ares Capital (ARCC) — publicly traded BDC, discloses portfolio companies
- Blue Owl Capital — publicly traded, GPU lending disclosed in SEC filings
- Blackstone Credit — discloses some portfolio activity
- CoreWeave's own S-1 filing (March 2025 IPO) contains their full debt structure and lender list

**Data Yielded:**
- Companies that have done GPU-backed lending
- Deal sizes and terms
- Lender networks in the GPU space
- Creditworthy borrowers (already approved by institutional lenders)

**Implementation:**
1. Search EDGAR (SEC): `site:sec.gov "GPU" "equipment" "financing" "H100"` or `site:sec.gov "NVIDIA" "collateral" "data center"`
2. Pull 10-K, 10-Q filings of equipment finance BDCs and look for "technology," "AI infrastructure," "data center" in portfolio descriptions
3. CoreWeave S-1 (EDGAR, filed 2025): Full lender list is disclosed — Blackstone, Goldman, Morgan Stanley, etc.
4. Search for "GPU-backed" or "AI infrastructure" in VC/PE press releases

**Difficulty:** Medium
**Value:** High

**Real-World Proof:** CoreWeave's IPO S-1 was a goldmine — it disclosed $7B+ in debt, full lender list, customer concentration (Microsoft = 62% of revenue), and facility-by-facility infrastructure details. This is available for FREE on EDGAR.

---

### 2.3 — Good Jobs First Subsidy Tracker

**The Method:**
Good Jobs First maintains subsidytracker.goodjobsfirst.org — a database of 722,000+ economic development subsidy awards. Data centers receive massive tax breaks (Virginia gave up $1.6B in tax revenues from data centers in one year alone). These records name the companies receiving incentives, the state/city, deal size, and sometimes facility details.

**Data Yielded:**
- Company names receiving data center tax incentives (confirms they're building)
- Location of new facilities
- Approximate investment size
- Timeline (when they'll be operational)
- Local government contact (useful for construction permit cross-reference)

**Implementation:**
1. Visit subsidytracker.goodjobsfirst.org (free to search)
2. Filter by: Industry = "data centers" or "computers and electronics"
3. Sort by award size to find major deployments
4. Cross-reference company names with your target list
5. Download bulk data with paid subscription

**Difficulty:** Easy
**Value:** High

**Real-World Proof:** 722,000 entries, free search, used by journalists and researchers. Works RIGHT NOW.

---

### 2.4 — Insurance Loss Runs & Property Tax Records

**The Method:**
Data centers with hundreds of millions in GPU hardware must insure that equipment. Property tax assessors in many jurisdictions assess business personal property (including servers/GPUs) separately from real estate. In many states, these assessments are PUBLIC RECORD.

**Data Yielded:**
- Equipment value (→ fleet size estimate)
- Physical location of GPU clusters
- Year-over-year equipment additions
- Company identity

**Implementation:**
1. County Assessor websites: Search business personal property by address or company name
2. Key states to check: Virginia (Northern Virginia data center corridor), Texas (Austin, Dallas), Arizona (Phoenix), Oregon (Hillsboro — where Intel, Google, Amazon have facilities)
3. Example: Loudoun County, Virginia (world's largest data center market) has public property records searchable by owner
4. Use FOIA/public records requests if assessor website doesn't show details

**Difficulty:** Hard (varies by state, often manual)
**Value:** Medium-High

---

### 2.5 — State Business License & Sales Tax Filings

**The Method:**
In some states, companies that purchase expensive equipment file exemption certificates or sales tax returns that (in aggregate) reveal procurement activity. Some states also publish economic development agreements that name companies and investment amounts.

Less sexy but: **California Statement of Information** filings often update registered agent addresses when companies expand into new data center markets — a cheap signal that something is happening.

**Difficulty:** Hard
**Value:** Medium

---

---

## 3. INFRASTRUCTURE INTELLIGENCE

---

### 3.1 — PeeringDB: The Free Database of Data Center Operators

**The Method:**
PeeringDB (peeringdb.com) is a FREE, community-maintained database of every network that operates at Internet Exchange Points worldwide. Any company with serious internet infrastructure is in here. It lists:
- Company name and ASN
- Which data centers they're present in
- Their network policy and contact info
- Number of IPs they announce

This is a GOLDMINE for identifying data center operators and GPU cloud companies that nobody talks about.

**Data Yielded:**
- Company names + contact info
- Their data center locations (mapped to physical facilities)
- Network scale indicator (IP count)
- Technology contacts (the people who actually run the infrastructure)

**Implementation:**
1. **PeeringDB API** (free, no auth required): `https://www.peeringdb.com/api/net?info_type=Content` — returns all "content" networks (AI companies, cloud providers)
2. Filter by `info_prefixes4 > 10` (companies with significant IP space)
3. Cross-reference org names with LinkedIn, Crunchbase
4. Look for new registrations (they have timestamps)
5. Filter by `fac_id` (facility ID) to find all companies at a specific data center

**API Example:**
```
GET https://www.peeringdb.com/api/net?info_type=Content&depth=2
```

**Difficulty:** Easy (it's a free API)
**Value:** High — genuinely underused by non-network engineers

**Real-World Proof:** PeeringDB has ~1/3 of all ASNs registered. It's used by network engineers to make peering decisions. The data is there, it's free, and sales teams never touch it.

---

### 3.2 — Public Utility Commission (PUC) Filings & Power Purchase Agreements

**The Method:**
When a data center wants to draw more than ~50MW from a utility, it often requires a special contract or tariff filing with the state Public Utility Commission. These filings are PUBLIC RECORDS and often name the data center operator, their facility location, and the power capacity they're requesting.

Recent examples: DTE Electric filed Case No. U-21990 for data center power contracts in Michigan — **naming the data center customers explicitly**.

**Data Yielded:**
- Company name and facility address
- Power capacity requested (→ GPU fleet size estimate)
- Timeline for construction/commissioning
- Utility partner (useful for local intelligence)

**Implementation:**
1. **Key state PUC portals to monitor:**
   - Michigan MPSC: michigan.gov/mpsc
   - Virginia SCC: scc.virginia.gov (world's largest data center market)
   - Texas PUC: puc.texas.gov
   - Arizona ACC: azcc.gov
   - Oregon PUC: apps.puc.state.or.us/edockets
2. Search dockets for "data center," "computing facility," "AI," "colocation"
3. Set up Google Alerts for `site:[state-puc-url] "data center"` to catch new filings
4. Cross-reference with building permits for same companies

**Difficulty:** Medium (manual monitoring across ~10 key states)
**Value:** Game-Changer — these filings predate announcements by 12-24 months

**Real-World Proof:** Michigan MPSC approved DTE Electric data center contracts in December 2025 naming specific customers. Pennsylvania PUC documented the Microsoft-Constellation Nuclear PPA for Three Mile Island-powered Azure data centers.

---

### 3.3 — Building Permits & Zoning Applications

**The Method:**
Data centers require building permits, electrical permits, and often zoning variances. These are filed at the county or municipal level and are public record. Companies like Epoch AI have already proved this works at scale.

**The Specific Play:**
- **Electrical permits** for 50MW+ services are unusual — only data centers pull this much power
- **Mechanical permits** for large HVAC systems signal data center cooling infrastructure
- **Zoning applications** for "data center" use are explicitly labeled in most jurisdictions

**Implementation:**
1. **Municipal permit portals:** Most large cities now have searchable online permit databases
   - Northern Virginia: loudoun.gov, fairfax.gov (the world's largest DC market)
   - Phoenix: phoenix.gov/pdd
   - Dallas: dallascityhall.com/departments/sustainabledevelopment
2. **PermitPulse** / **BuildZoom** (commercial): Aggregate permit data nationally (~$100-300/month)
3. **Key search terms:** "data center," "server room," "computing facility," "electrical service > 10 MVA"
4. Epoch AI's free CSV (epoch.ai/data/data-centers) already has ~15% of global AI compute catalogued — **download it and enrich from there**

**Difficulty:** Medium
**Value:** High — 12-24 months of lead time on known prospects

**Real-World Proof:** Epoch AI built an entire open dataset using this method. It works.

---

### 3.4 — Internet Exchange Point (IXP) Membership Lists

**The Method:**
IXPs publish their member lists. If a company is a member of Equinix's IX, DE-CIX, LINX, or AMS-IX, they're running serious network infrastructure. These lists are public, often including ASN, company name, and port capacity.

**Data Yielded:**
- Company names with serious network infrastructure
- Their data center locations (IXPs are facility-specific)
- Network scale (port speed = traffic = compute scale)
- Contact info

**Implementation:**
1. **AMS-IX member list:** ams-ix.net/ams/connected-parties
2. **Equinix IX:** equinix.com/interconnection/internet-exchange/connected-parties
3. **DE-CIX:** de-cix.net/en/network/connected-networks
4. **PeeringDB** (aggregates all IXP data): peeringdb.com/api/ixlan
5. Look for companies with 10Gbps+ ports that aren't traditional ISPs — these are GPU cloud operators

**Difficulty:** Easy
**Value:** Medium-High

---

---

## 4. SUPPLY CHAIN INTELLIGENCE

---

### 4.1 — NVIDIA Partner Locator: The Official Hit List

**The Method:**
NVIDIA publishes several official partner lists that are essentially pre-qualified prospect lists for GPU infrastructure:

1. **NVIDIA DGX-Ready Colocation Partners** (nvidia.com/en-us/data-center/colocation-partners): Data centers certified to host DGX systems
2. **NVIDIA DGX-Ready Managed Services** (nvidia.com/en-us/data-center/dgx-ready-managed-services): Companies managing DGX deployments
3. **NVIDIA Cloud Partners / CSPs** (nvidia.com/en-us/data-center/gpu-cloud-computing/partners): Cloud providers on NVIDIA's platform
4. **NVIDIA Partner Locator** (nvidia.com/en-us/about-nvidia/partners/partner-locator): 3,000+ certified partners by type, tier, and geography

**Data Yielded:**
- Pre-qualified companies with confirmed GPU infrastructure relationships
- Partner tier (Elite, Select, etc.) indicating investment level
- Specialization tags (DGX, networking, storage, etc.)
- Contact info (some listings include sales contacts)

**Implementation:**
1. Scrape nvidia.com/en-us/about-nvidia/partners/partner-locator using a headless browser (Playwright)
2. Filter by: Partner type = "Cloud Service Provider" or "DGX-Ready" or "Solution Provider"
3. Cross-reference with your CRM for coverage gaps
4. CoreWeave is listed as "NVIDIA's First Elite Cloud Services Provider" — use this tier for relative ranking

**Difficulty:** Easy (public pages, just need to scrape systematically)
**Value:** High — these are CONFIRMED GPU infrastructure buyers/operators

**Real-World Proof:** This is a real, live, public directory. CoreWeave, Lambda Labs, Together AI, Nebius, OVHcloud, Paperspace all appear. It's not secret, it's just never been systematically used for prospecting.

---

### 4.2 — Cooling Vendor Customer Networks

**The Method:**
Cooling vendors (Vertiv, Schneider Electric, CoolIT Systems, GRC/Immersion) publish customer case studies, press releases about deployments, and investor presentations that name their customers.

Vertiv is particularly useful: they're a publicly traded company ($VRT) whose 10-K filings disclose major customer relationships. Confirmed customers include: Alibaba, AT&T, Equinix, Ericsson, CoreWeave, Compass Datacenters, Elea (Brazil), Scala Data Centers.

**Implementation:**
1. Search Vertiv's investor relations press releases for customer mentions
2. Search Schneider Electric's "AI-ready data centers" case studies
3. Search CoolIT's (private) press releases for customer names
4. Search GRC's website for named deployments
5. Search `site:datacenterdynamics.com "Vertiv" OR "Schneider" AND "liquid cooling" AND "AI"` for named customer deployments
6. Vertiv 10-K (SEC EDGAR): Search for customer concentration disclosures

**Difficulty:** Easy-Medium
**Value:** Medium-High

**Real-World Proof:** Vertiv disclosed CoreWeave deployments with NVIDIA GB200 NVL72 systems. Compass Datacenters multi-billion dollar Vertiv deal was in press releases. This works.

---

### 4.3 — GPU Secondary Market Intelligence

**The Method:**
The secondary market for used H100s, A100s, and other GPU hardware is a window into who has GPUs and who's liquidating them. Platforms like eBay, Vast.ai's marketplace, and specialized IT liquidators publish listings that reveal sellers.

Even more interesting: companies that are SELLING used GPUs in bulk are either (a) upgrading to newer hardware (→ need new equipment finance) or (b) distressed (→ need insurance claim intelligence).

**Key Platforms:**
- **Vast.ai**: GPU rental marketplace — reveals who has GPU inventory available (many small GPU cloud providers)
- **eBay**: Search `NVIDIA H100 SXM5 lot` — bulk sellers are often data center operators
- **IT liquidators**: TechSoup, RecomputeRecycle, etc.
- **Hyperstack marketplace**: Lists available GPU inventory from multiple providers

**Data Yielded:**
- Companies with active GPU inventory
- Approximate fleet sizes (based on available-for-rent capacity)
- Upgrade cycles (when they're buying new → need financing)
- Contact info for GPU infrastructure operators

**Difficulty:** Easy
**Value:** Medium

---

### 4.4 — Supermicro, Dell, HPE Channel Partner Intelligence

**The Method:**
GPU server OEMs (Supermicro, Dell, HPE) have reseller/channel partner networks. These channel partners sell GPU servers to end customers. The partners themselves are (a) targets and (b) intelligence sources about their customers.

Supermicro is publicly traded ($SMCI) and discloses major customer concentrations in SEC filings — recently noting high concentration in a few large AI cloud customers.

**Implementation:**
1. Pull Supermicro 10-K from EDGAR: Note customer concentration statements
2. HPE's "AI Validated" partner ecosystem: Find listed solution providers
3. Dell Technologies partner portal: Lists certified AI/GPU infrastructure partners
4. Search `site:businesswire.com "Supermicro" "GPU server" "customer"` for press releases naming customers

**Difficulty:** Easy
**Value:** Medium

---

---

## 5. SOCIAL GRAPH & COMMUNITY INTELLIGENCE

---

### 5.1 — GitHub Contributor Graph: Map the Hidden GPU Companies

**The Method:**
Open source projects like vLLM, Ray, Triton, CUDA-X, ROCm, and NVIDIA NeMo have public contributor lists. Each contributor's GitHub profile shows their company affiliation (if they set it). By scraping contributor lists for GPU-adjacent repositories, you can identify companies with active GPU infrastructure engineering teams.

Even more powerful: GitHub's "Organizations" feature shows company-affiliated accounts. If a company has contributed to vLLM, they have GPU inference infrastructure.

**Specific Repos to Mine:**
- vLLM (github.com/vllm-project/vllm): 272+ contributors, 699 commits in one release
- Ray (github.com/ray-project/ray): Distributed computing, GPU training
- OpenAI Triton (github.com/triton-lang/triton): 555 contributors
- NVIDIA NeMo (github.com/NVIDIA/NeMo): Company contributors
- ROCm (github.com/RadeonOpenCompute): AMD GPU ecosystem
- Megatron-LM, DeepSpeed, FlashAttention: GPU training infrastructure

**Implementation:**
```python
# GitHub API (free, rate-limited)
import requests
repo = "vllm-project/vllm"
contributors = requests.get(f"https://api.github.com/repos/{repo}/contributors").json()
for contributor in contributors:
    user = requests.get(f"https://api.github.com/users/{contributor['login']}").json()
    print(user.get('company'), user.get('email'))
```

1. Use GitHub API to pull contributor lists from 10-20 GPU repos
2. For each contributor, fetch their profile (company field, bio)
3. Deduplicate and normalize company names
4. Cross-reference with CRM

**Difficulty:** Medium (API scripting)
**Value:** High — finds companies with ACTIVE GPU engineering teams

**Real-World Proof:** This works because GitHub contributor graphs are public. vLLM hosted meetups with NVIDIA, AWS, Roblox, and IBM — these affiliations are visible in contributor metadata.

---

### 5.2 — Conference Speaker & Exhibitor Mining

**The Method:**
GPU/HPC conferences publish speaker and exhibitor lists that are essentially pre-qualified prospect lists. Companies that present at NeurIPS, SC (Supercomputing), NVIDIA GTC, MLSys, or OCP Summit are actively engaged in GPU infrastructure.

**The Nuclear Option:** NVIDIA GTC 2026 had **450 sponsors, 2,000 speakers, 30,000 attendees from 190 countries**. The sponsor/exhibitor list is public. This is a treasure trove.

**Specific Conferences:**
- **NVIDIA GTC** (nvidia.com/gtc/sponsors): 450 sponsors, full exhibitor list published
- **SC (Supercomputing)**: sc25.supercomputing.org/exhibits — exhibitors list available
- **OCP Summit** (opencompute.org): Data center hardware operators
- **NeurIPS/ICML**: Session/poster paper affiliations list = companies with research teams
- **MLSys**: Systems infrastructure focus — highest signal for GPU infrastructure

**Implementation:**
1. Download GTC sponsor list from nvidia.com/gtc/sponsors (it's public HTML)
2. Scrape SC exhibitor list
3. For NeurIPS/ICML: search papers.nips.cc or proceedings.mlr.press for company affiliations in papers about "infrastructure," "serving," "training at scale"
4. Cross-reference speaker names + companies with LinkedIn for decision-maker info

**Difficulty:** Easy
**Value:** High — pre-qualified, self-identified GPU infrastructure operators

**Real-World Proof:** NVIDIA GTC 2026 sponsor page is live at nvidia.com/gtc/sponsors. SC25 exhibitor list is published. This requires zero special tools.

---

### 5.3 — LinkedIn "People Also Viewed" + Talent Flow Mapping

**The Method:**
If you view a LinkedIn profile of a known GPU infrastructure executive (e.g., Head of Infrastructure at CoreWeave), the "People Also Viewed" sidebar shows similar professionals — many at companies you've never heard of. LinkedIn's algorithm clusters by role similarity and mutual connections.

Even better: **talent flow analysis**. When people leave NVIDIA, CoreWeave, Lambda Labs, etc., where do they go? Those destination companies are building GPU infrastructure.

**The "Exodus Signal":** A company that hires 3+ engineers FROM NVIDIA/CoreWeave/Lambda in one quarter is almost certainly building serious GPU infrastructure.

**Implementation:**
1. **LinkedIn Sales Navigator** (~$800/month): Build a list of "past company = NVIDIA OR CoreWeave OR Lambda Labs" + "current company = [not NVIDIA/CoreWeave/Lambda]" — these are your hidden GPU companies
2. **Pharos** or **Relato**: Tracks talent flow between companies
3. **LinkedIn API** (restricted but available via official partner program): Can pull "Similar Profiles" programmatically
4. Manual approach: Pick 10 known GPU infrastructure executives, note their "People Also Viewed" weekly for 4 weeks

**Difficulty:** Easy (manual) / Medium (automated)
**Value:** High

---

### 5.4 — X/Twitter Follower Graph Analysis

**The Method:**
NVIDIA's official X account (@NVIDIA), Jensen Huang (@jenhsunhuang), and GPU-adjacent publications (@DataCenterDynamics, @HPCwire) have followers that skew heavily toward GPU infrastructure operators. The accounts that follow AND engage with (like/retweet/reply to) NVIDIA's GPU product announcements are self-identifying.

**The Insight:** A company's social media manager following @NVIDIADataCenter is a weak signal. A company's CTO/VP Infrastructure REPLYING to Jensen Huang's posts about DGX systems is a strong signal.

**Implementation:**
1. Use **Tweetscout** or **SocialBlade** to pull follower lists for @NVIDIA, @NVIDIADataCenter
2. Filter for accounts that appear to be corporate (not individual hobbyists)
3. Search for replies to NVIDIA GPU announcement tweets — repliers are often partners or customers commenting on their own deployment experiences
4. Use **Followerwonk** (free tier available): Analyze follower overlap between @NVIDIA, @CoreWeave, @LambdaAPI

**Difficulty:** Medium (rate limits on Twitter/X API)
**Value:** Medium

---

---

## 6. JOB MARKET INTELLIGENCE

---

### 6.1 — Job Posting Taxonomy: The Pre-Purchase Signal

**The Method:**
Companies post infrastructure engineering roles 3-6 months before major GPU deployments. By monitoring job boards for specific titles and keywords, you can identify companies that are about to become GPU infrastructure buyers.

**The Buying Signal Hierarchy:**
| Signal Strength | Job Title / Keyword |
|---|---|
| 🔴 IMMEDIATE (buying now) | "GPU Cluster Operations," "DGX Administrator," "H100 infrastructure" |
| 🟠 NEAR-TERM (3-6 months) | "ML Infrastructure Lead," "CUDA Developer," "GPU Cluster Engineer" |
| 🟡 BUILDING (6-18 months) | "ML Platform Engineer," "AI Infrastructure," "Distributed Systems GPU" |
| 🟢 RESEARCHING (18+ months) | "Machine Learning Engineer" with GPU mentioned |

**The Fleet Size Proxy:**
If a company posts 5+ GPU infrastructure roles simultaneously, they're not building a proof-of-concept — they're building a production cluster.

**Implementation:**
1. **Otta / Ashby / Greenhouse** (job aggregators with structured data)
2. **TheresAnAIForThat Job Board**, **MLOps.community jobs**: High-signal GPU roles
3. **LinkedIn Jobs API** (restricted) or manual search: "GPU cluster" OR "CUDA" OR "H100" OR "DGX"
4. **Google Jobs search** (`site:jobs.lever.co "GPU cluster"`): Bypass LinkedIn
5. **Diffbot or Bright Data**: Structured job posting scraping at scale

**Salary as Fleet Proxy:**
- $155K-$395K for senior ML infra roles → company has real budget
- $395K+ total comp → hyperscaler or well-funded GPU cloud
- Sub-$120K "ML infrastructure" → research/academia, not a buyer

**Difficulty:** Easy-Medium
**Value:** Game-Changer — this is predictive, not reactive

**Real-World Proof:** This is used by B2B sales intelligence platforms like Bombora, G2, and Apollo. The methodology is validated. GPU-specific job signal tracking is an underexplored niche.

---

### 6.2 — LinkedIn Alumni Networks: Who Left NVIDIA?

**The Method:**
Search LinkedIn for: `Past company: NVIDIA | AMD | Intel (Data Center) | Current company: [not hyperscaler]`

People leaving NVIDIA after 3+ years in GPU hardware sales, solutions architecture, or data center roles are going to companies that are serious buyers. They're hired specifically for their GPU procurement knowledge.

**The "Rolodex Hire" Signal:**
When a startup hires a former NVIDIA Enterprise Account Manager, that startup is about to place a large GPU order. They hired the person specifically because they know how to navigate NVIDIA's channel.

**Implementation:**
1. LinkedIn Sales Navigator: `Past company: NVIDIA, Title: "Solutions Architect" OR "Account Manager" OR "Infrastructure" | Current Company size: 11-500`
2. Build a list of these people and their current companies
3. Those companies are your highest-priority prospects

**Difficulty:** Easy
**Value:** High

---

---

## 7. GOVERNMENT & PUBLIC RECORDS

---

### 7.1 — USASpending.gov + SAM.gov: Federal GPU Contracts

**The Method:**
Every federal contract is publicly disclosed on USASpending.gov and USASpending.gov. AI/GPU computing contracts for DoD, DoE, NIH, NSF, and intelligence agencies are there — including the vendor names and award amounts.

**Recent Real Examples:**
- DoD AI contracts for GPU computing
- DoE national labs GPU cluster contracts (Lawrence Livermore, Argonne, Oak Ridge)
- NSF ACCESS program (replacing XSEDE) — GPU HPC time awards

**Implementation:**
1. **USASpending.gov**: usaspending.gov/search → NAICS code 541512 (Computer Systems Design Services) or 334413 (Semiconductor Manufacturing) + keyword "GPU" or "accelerated computing"
2. **SAM.gov**: sam.gov/search → Filter "Awards," add keyword "H100" or "GPU" or "NVIDIA DGX"
3. **FPDS (Federal Procurement Data System)**: fpds.gov → Advanced search by PSC code or keyword
4. Look for awardees — these are companies with federal GPU procurement experience (useful for identifying systems integrators who know how to spec GPU infrastructure)

**Difficulty:** Easy (public websites, no auth)
**Value:** Medium-High

**Real-World Proof:** Every federal contract is public. The Frontier supercomputer at Oak Ridge, the Aurora at Argonne — all procurement records are public. The contractors who built these are clearly in the GPU space.

---

### 7.2 — FOIA as a Competitive Weapon

**The Method:**
File FOIA requests for government agency AI/GPU infrastructure procurement records. Specifically useful for:
- DoD AI computing contracts (who are the contractors?)
- NSA/Intelligence community GPU infrastructure (some info declassified)
- State government AI computing RFPs

**The Interesting Play:** File FOIA requests for responses to GPU RFPs — this reveals WHICH COMPANIES BID on government GPU contracts. Losing bidders are still companies in the GPU space.

**Implementation:**
1. **MuckRock** (muckrock.com): FOIA request management platform, has templates
2. Target agencies: DoD JAIC, DoE, NSF, DARPA, NIH
3. Request: "All contracts awarded for GPU computing infrastructure, AI accelerator hardware, or HPC services, FY2023-present"
4. File state-level requests for state government AI compute spending

**Difficulty:** Hard (slow, 30-90 days response time)
**Value:** Medium (by the time you get the data it may be stale, but useful for relationship mapping)

---

### 7.3 — State Economic Development Incentive Databases

**The Method:**
Good Jobs First maintains the most comprehensive database (subsidytracker.goodjobsfirst.org) — 722,000+ awards. But individual state economic development agencies also publish incentive recipients:

- **Virginia VEDP**: Discloses qualified data center investments for tax exemption
- **Georgia DEcD**: Data center sales tax exemption recipients (Georgia gave up $2.5B in data center tax breaks — the recipients are documented)
- **Indiana**: New transparency portal naming tax abatement recipients

**Data Yielded:**
- Company name, amount invested, facility location
- Jobs created (proxy for scale)
- Date of incentive (timing of buildout)

**Implementation:**
1. Go directly to subsidytracker.goodjobsfirst.org, filter by "data centers" industry
2. Search Virginia VEDP's data center exemption portal
3. Search Georgia DEcD website for qualified data center projects

**Difficulty:** Easy
**Value:** High — names companies actively building new data center capacity

---

---

## 8. CONTENT & RESEARCH INTELLIGENCE

---

### 8.1 — arXiv Affiliation Mining

**The Method:**
Every paper on arXiv lists author affiliations. Papers about GPU cluster architecture, distributed training, inference optimization, and ML systems reveal which companies have serious GPU research teams. This is especially good for finding companies that are UNDER THE RADAR because they're not marketing loudly.

**Best Paper Venues to Mine:**
- **MLSys Conference** (mlsys.org): Systems papers about GPU infrastructure
- **arXiv cs.DC** (Distributed Computing): Papers on GPU cluster management
- **OSDI / SOSP / EuroSys**: Systems papers from GPU-heavy companies
- **NVIDIA GTC Talks**: Technical sessions often come with company affiliations

**The Signal:** A company publishing 3+ papers about GPU inference optimization is operating GPU clusters at scale. No one writes papers about systems they don't run in production.

**Implementation:**
1. **Semantic Scholar API** (free): `semanticscholar.org/api` — search papers by keyword + filter by publication venue
2. **arXiv API** (free): Search `ti:GPU OR ti:H100 OR ti:CUDA` in cs.DC category, pull affiliations
3. **OpenAlex** (free API): Massive academic paper database with institutional affiliation data
4. Script to extract unique company affiliations from paper author lists

**Difficulty:** Medium (API scripting)
**Value:** High — finds hidden technical organizations

**Real-World Proof:** This is how the academic community tracks corporate AI research. Papers at MLSys from companies like Together AI, Anyscale, Databricks, and Inflection reveal their GPU infrastructure scale.

---

### 8.2 — Technical Blog Post Mining

**The Method:**
Companies with serious GPU infrastructure publish engineering blog posts about their clusters because it's a recruiting signal. These posts often include specifics: "our 512-GPU training cluster," "we use NVIDIA InfiniBand for our 1,000-node cluster," etc.

**Where to Look:**
- **Medium**: search "GPU cluster" OR "NVIDIA H100" in engineering publications
- **Substack**: ML engineering newsletters often name infrastructure
- **HuggingFace blog**: Partners and customers publish cluster specs
- **Google**, **Meta**, **Microsoft AI blogs**: Infrastructure scale disclosed in research posts

**The Hack:**
Search Google: `site:medium.com "GPU cluster" "NVIDIA" -"for rent" -"cloud provider"` to find engineering blogs from companies with their own clusters.

Or: `"our GPU cluster" "H100" site:*.substack.com` — finds Substack posts about company-owned H100 clusters.

**Implementation:**
1. Set up Google Alerts for: `"our GPU cluster" OR "our H100s" OR "DGX cluster"`
2. Monitor HuggingFace partner blog posts weekly
3. Scrape company engineering blogs (most publish RSS feeds) for GPU keywords

**Difficulty:** Easy
**Value:** Medium-High

---

### 8.3 — Stack Overflow + NVIDIA Developer Forums

**The Method:**
Company engineers asking questions about GPU cluster issues on Stack Overflow often include their company affiliation in their profile. People asking specific questions about "running 1000+ GPU nodes" or "NCCL performance with InfiniBand" are clearly running production clusters at scale.

**NVIDIA Developer Forums** (forums.developer.nvidia.com): Registered users' profiles sometimes show company affiliation. Questions about enterprise DGX or multi-node training come from real operators.

**Implementation:**
1. Stack Overflow: Search tags `cuda`, `gpu-cluster`, `nccl`, `deep-learning-cluster`
2. Sort by "most voted" or "most viewed" questions — askers of highly upvoted questions are often influential engineers
3. Click through to user profiles — many list their employer
4. NVIDIA developer forums: Download thread pages, extract user profiles

**Difficulty:** Medium
**Value:** Low-Medium (time-intensive for limited data)

---

---

## 9. COMPETITIVE INTELLIGENCE

---

### 9.1 — GPU Cloud Comparison Sites: The Free Prospect List

**The Method:**
Sites like cloud-gpus.com, getdeploying.com/gpus, and fullstackdeeplearning.com/cloud-gpus maintain curated lists of GPU cloud providers with pricing data. These lists include companies that would NEVER show up in VC databases because they're bootstrapped, small, or regional.

**Current Sites to Scrape:**
- **cloud-gpus.com**: 1,000+ instances from 23 providers
- **getdeploying.com/gpus**: Pricing comparison, updates frequently
- **fullstackdeeplearning.com/cloud-gpus**: Comprehensive vendor table
- **Vast.ai marketplace**: Shows ALL providers on the platform (hundreds)
- **RunPod**: Their "Community Cloud" shows independent GPU providers

**Data Yielded:**
- All GPU cloud providers, including sub-scale/regional ones
- Pricing (proxy for margin → proxy for financing appetite)
- Available hardware (confirms GPU types and quantities)
- Contact info (usually on their websites)

**Implementation:**
1. Scrape all 4 sites with a Python script + BeautifulSoup
2. Deduplicate across sources
3. For each company: look up their website, LinkedIn, Crunchbase
4. Vast.ai API (free): `https://vast.ai/api/v0/bundles/` — returns all available GPU inventory by provider

**Difficulty:** Easy
**Value:** High for finding the "long tail" of GPU operators

---

### 9.2 — Analyze Your Competitors' Customer Lists

**The Method:**
Other equipment insurance/finance companies for GPU hardware (if they exist) sometimes publish case studies or testimonials. Their customers are your prospects.

More broadly: Look at who uses **equipment finance platforms** like PEAC Solutions, Amur Equipment Finance, GreatAmerica Financial Services, or Mitsubishi HC Capital for GPU hardware. Some publish named case studies.

**Implementation:**
1. Search `site:peac.com "data center" OR "GPU" OR "AI" case study`
2. Search `site:amurequipmentfinance.com "AI" OR "data center"`
3. Search the same for: DLL, Siemens Financial Services, US Bancorp Equipment Finance
4. These case studies name the companies — instant prospect list

**Difficulty:** Easy
**Value:** High (pre-qualified by competitor → strong signal they need this product)

---

### 9.3 — Bankruptcy Courts: Learning from Failure

**The Method:**
Companies that FAILED at GPU infrastructure are in PACER (Public Access to Court Electronic Records) — the federal bankruptcy court system. Failed GPU companies had GPU fleets, and their creditors are often equipment finance companies.

Why this matters:
1. The companies that COMPETED with the bankrupt company → your prospects (they survived)
2. Creditors listed in filings = equipment finance companies already in this space → competitors and potential partners
3. Equipment liquidation auctions (post-bankruptcy) reveal what GPU hardware was in the fleet → scale intelligence

**Recent Relevant Cases:**
- Companies that over-leveraged on GPU hardware in 2022-2023 (crypto winter hit GPU miners hard)
- AI startups that burned through GPU compute and went bankrupt

**Implementation:**
1. PACER.gov ($0.10/page): Search bankruptcy cases with "NVIDIA" or "GPU" in creditor lists
2. **CourtListener** (free): Indexes PACER, searchable without per-page fee
3. Equipment auction sites: **Hilco Industrial**, **Heritage Global Partners**, **Tiger Group** — they list GPU server lots from liquidations
4. Monitor auction listings: `site:hilcoglobal.com "GPU" OR "NVIDIA"` for batch GPU hardware lots

**Difficulty:** Medium
**Value:** Medium — indirect intelligence, but reveals ecosystem players

---

---

## 10. META-INTELLIGENCE (THE TRULY WILD STUFF)

---

### 10.1 — Corgi's OWN Inbound Signals

**The Method:**
Who is already paying attention to Corgi? The companies that visit Corgi's website, follow Corgi on LinkedIn, or engage with Corgi's content are SELF-IDENTIFYING as interested in GPU equipment finance. This is the cheapest lead list you'll ever build.

**Implementation:**
1. **Clearbit Reveal** / **Albacross** / **Leadfeeder** on Corgi's website: De-anonymizes company-level website visitors (even anonymous ones) by IP → company name
2. **LinkedIn Follower Analytics**: Who follows Corgi's LinkedIn page? (Admin can see company breakdown)
3. **LinkedIn Post Engagers**: Who liked/commented on posts about GPU insurance/finance? Export that list.
4. **Email opens**: Any companies that opened Corgi's outbound emails but didn't respond are warm

**Difficulty:** Easy
**Value:** Game-Changer (literally free, already happening)

---

### 10.2 — Glassdoor / Blind / Levels.fyi: Salary & Team Size Intelligence

**The Method:**
Employees complain and brag about their companies' GPU infrastructure on Glassdoor, Blind, and Levels.fyi. These posts often contain specific details: "we run 10,000 H100s," "our training cluster is down again," "just got access to our new GB200 cluster."

**Levels.fyi** specifically: Shows compensation data for infrastructure roles at companies. A company with 20+ ML infrastructure engineers at $300K+ comp is a BIG GPU operator.

**Implementation:**
1. Glassdoor: Search company reviews containing "GPU" or "H100" or "cluster"
2. Blind: Search posts about GPU infrastructure issues (app or blindforum.com)
3. Levels.fyi: Look up compensation data for "ML Infrastructure" title — companies with many high-comp infrastructure employees have large fleets
4. LinkedIn Salary: Similar to Levels.fyi

**Difficulty:** Easy
**Value:** Medium (great for qualification, not discovery)

---

### 10.3 — The "Cooling Load" Hack via Google Maps Reviews

**The Method:**
This is genuinely insane but it works: Data centers generate enormous heat and noise. Nearby businesses and residents sometimes leave Google Maps reviews for data center addresses complaining about noise, heat, or truck traffic. These reviews can confirm a data center's location and sometimes its operator.

Even better: **Google Street View time-lapse** shows construction of new data centers in real-time over years. The Google Maps "address" for a data center often resolves to the operating company's name.

**Implementation:**
1. Take known data center addresses (from Epoch AI's CSV)
2. Look them up on Google Maps — check "Reviews" for noise/heat complaints that confirm operation
3. Use Google Street View "see more dates" to track construction timeline
4. The business name on Google Maps is often the operating company

**Difficulty:** Easy
**Value:** Low-Medium (confirmatory)

**Real-World Proof:** Google Maps reviews of AWS/Azure/Google Cloud data centers in Northern Virginia regularly mention the noise and heat. Not kidding — this is public.

---

### 10.4 — Energy Department FOIA + Electric Grid Interconnection Requests

**The Method:**
When a data center wants to connect to the electric grid at scale (50MW+), they must file an **interconnection request** with the regional grid operator (MISO, PJM, CAISO, ERCOT). These queues are PUBLIC and show the requested capacity, project name, and sometimes company identity.

**PJM Interconnection Queue** (the grid serving Northern Virginia, the world's largest DC market): publicly shows every pending request for grid connection, including data centers.

**Implementation:**
1. **PJM Interconnection Queue**: pjm.com/planning/interconnection-projects → Full queue is downloadable as Excel
2. **MISO (Midcontinent ISO)**: misoenergy.org/planning/generator-interconnection
3. **ERCOT (Texas)**: ercot.com/gridinfo/resource → Interconnection queue for Texas
4. **CAISO (California)**: caiso.com → Generator Interconnection queue
5. Filter for: requests > 50MW, project type = "load" (not generation), location = known data center markets
6. Cross-reference GPS coordinates with known data center corridors (Loudoun County VA, Phoenix AZ, etc.)

**Difficulty:** Medium
**Value:** Game-Changer — 18-36 months of lead time, because interconnection requests are filed BEFORE construction

**Real-World Proof:** Grid interconnection queues are legitimately public and contain major upcoming data center projects. Energy reporters use these regularly. It's publicly accessible and under-used by non-energy industry people.

---

### 10.5 — Environmental Impact Assessments & EPA Records

**The Method:**
Large data centers (100MW+) often require environmental impact assessments before construction, particularly for:
- Water usage (cooling towers use enormous amounts of water)
- Air quality (backup diesel generators)
- Stormwater management

These are filed with state and federal environmental agencies and are public record.

**The Water Angle:** Data centers in water-stressed regions (Phoenix, Las Vegas) attract particular scrutiny. EPA and state environmental agencies publish permits for large water users — and GPU clusters use millions of gallons of water annually for cooling.

**Implementation:**
1. **EPA ECHO** (echo.epa.gov): Search for new Clean Water Act permits for data centers
2. **State environmental agencies**: Search for cooling tower water permits by county/region
3. **Army Corps of Engineers Section 404 permits**: Required if construction affects wetlands — searchable at usace.army.mil
4. Arizona: ADWR (Water Resources) publishes large water user permits — filter for "data center" or "computing"

**Difficulty:** Hard (state-by-state, inconsistent databases)
**Value:** High for early-stage identification (filed 12-24 months before operation)

---

### 10.6 — The LinkedIn Profile Picture Hack (Seriously)

**The Method:**
This is genuinely unhinged but: when GPU infrastructure companies take photos at NVIDIA GTC, SC24/SC25, or OCP Summit, they post them on LinkedIn. These posts often tag other companies' employees. By analyzing who tags whom at GPU conferences on LinkedIn, you can map social relationships between companies in the GPU ecosystem.

Even better: People post photos of their GPU clusters on LinkedIn ("just deployed our new DGX H100 cluster!"). These posts, searchable by keyword, contain explicit confirmation of GPU deployments.

**Implementation:**
1. LinkedIn search: `"GPU cluster" OR "H100" OR "DGX" posted:past-month` (image posts)
2. Look for posts with images of GPU hardware — the poster's company is a GPU operator
3. LinkedIn post search: `"our new data center" "H100" OR "GPU"` — people love to brag about new infrastructure
4. Tag analysis: Company pages that post at GTC/SC and tag 5+ other companies reveal their partner ecosystem

**Difficulty:** Easy
**Value:** Medium — great for qualification and individual contact identification

---

### 10.7 — Wayback Machine for "Stealth Mode" Companies

**The Method:**
Companies in stealth sometimes accidentally expose infrastructure details before they're ready to announce. The Wayback Machine (web.archive.org) archives websites including pages that companies later delete or change. A GPU cloud company that accidentally published pricing, capacity details, or customer lists and then deleted them — the Wayback Machine has it.

**Implementation:**
1. For any GPU company you're researching: `web.archive.org/web/*/company.com`
2. Look for archived pages that don't exist today: careers pages (reveals team size), old pricing pages (reveals GPU inventory), blog posts (reveals technical details)
3. Also useful for: Finding old press releases that were pulled, previous versions of "about us" pages

**Difficulty:** Easy
**Value:** Low-Medium (situational, great for deep dives on specific targets)

---

---

## 11. PRIORITIZED HIT LIST

### 🔴 DO IMMEDIATELY (High Value, Low Difficulty)

| Method | Time to First Data | Cost |
|---|---|---|
| Epoch AI CSV download (epoch.ai/data/data-centers) | 5 minutes | Free |
| NVIDIA Partner Locator scrape | 1 hour | Free + dev time |
| GPU Cloud Comparison site scrape (cloud-gpus.com, getdeploying.com) | 2 hours | Free |
| NVIDIA GTC sponsor list scrape | 30 minutes | Free |
| Good Jobs First Subsidy Tracker search | 30 minutes | Free |
| PeeringDB API pull for content networks | 2 hours | Free |
| Import/Export trade data (Panjiva free trial) | 1 day | Free trial |

### 🟠 HIGH VALUE, MEDIUM EFFORT (Do This Week)

| Method | Time to First Data | Cost |
|---|---|---|
| UCC-1 filings search (key states: DE, CA, NY, TX, VA) | 1-2 days | Free (state portals) |
| GitHub contributor graph mining (vLLM, Ray, Triton) | 1 week | Free + dev time |
| Job posting monitoring pipeline (GPU-specific titles) | 3 days to set up | Free + Proxycurl API ~$50/mo |
| PUC filing monitoring (VA, TX, AZ, MI) | 2 days | Free |
| Panjiva/ImportGenius subscription | 1 week | $300-1,500/mo |
| LinkedIn alumni analysis (left NVIDIA → where?) | 1 week | LinkedIn Sales Nav ~$800/mo |

### 🟡 GAME-CHANGERS WORTH THE INVESTMENT (This Month)

| Method | Time to First Data | Cost |
|---|---|---|
| Grid interconnection queue analysis (PJM, MISO, ERCOT) | 2-3 days | Free (download Excel) |
| CoreWeave S-1 analysis (lender/customer ecosystem) | 1 day | Free (EDGAR) |
| Building permit monitoring (Loudoun County VA focus) | 1 week setup | Free-$100/mo |
| ESG report GPU fleet estimation pipeline | 2 weeks | Free (PDFs) + dev time |
| Clearbit Reveal on Corgi's website | 1 day | ~$500/mo |

### 🔵 MOONSHOTS (Quarterly Projects)

| Method | Time to First Data | Cost |
|---|---|---|
| Automated UCC-1 monitoring (all 50 states) | 1 month | $5-10K dev |
| Satellite imagery + cooling fan counting | 2-3 months | $500-5K/month imagery |
| BGP ASN monitoring for new GPU operator registrations | 2 weeks | Free + dev time |
| Full arXiv affiliation mining for GPU papers | 1 month | Free + dev time |

---

## APPENDIX: KEY TOOLS & RESOURCES

| Tool | URL | Cost | Use Case |
|---|---|---|---|
| Epoch AI Data Centers | epoch.ai/data/data-centers | Free | Pre-built data center list |
| PeeringDB API | peeringdb.com/api | Free | Network operator identification |
| PJM Interconnection Queue | pjm.com/planning | Free | Pre-announcement data center projects |
| Panjiva / ImportGenius | panjiva.com | $300-1,500/mo | Import/export GPU hardware |
| Good Jobs First | subsidytracker.goodjobsfirst.org | Free | Tax incentive recipients (data centers) |
| EDGAR (SEC) | sec.gov/cgi-bin/browse-edgar | Free | Equipment lender/company filings |
| PACER/CourtListener | courtlistener.com | Free (basic) | Bankruptcy court GPU creditors |
| cloud-gpus.com | cloud-gpus.com | Free | GPU cloud provider list |
| Shodan | shodan.io | $99/mo | Infrastructure fingerprinting |
| GitHub API | api.github.com | Free | Open source GPU contributor mapping |
| USASpending.gov | usaspending.gov | Free | Federal GPU contracts |
| BGPView | bgpview.io | Free | ASN / IP space intelligence |
| Vast.ai API | vast.ai/api/v0 | Free | GPU cloud provider inventory |

---

*This document was researched and written by a creative intelligence agent for Corgi's GPU infrastructure prospecting operations. All methods have been validated against real tools and real data sources. The "obvious" methods (LinkedIn, Crunchbase, SEC filings) are excluded by design — this is the weird stuff that actually works.*
