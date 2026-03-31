# B2B Data Enrichment Methods: Comprehensive Blueprint
## For Corgi GPU Infrastructure Insurance — Finding & Understanding Target Companies

**Document purpose:** Exhaustive reference for every known method, tool, API, and creative technique to find and enrich company data for sales/deal-making in the GPU infrastructure, AI compute, and equipment financing space.

**Target company profiles:**
1. Companies that **own GPU hardware** (AI cloud providers, HPC clusters, crypto miners transitioning to AI, research labs, large enterprises with on-prem AI)
2. Companies that have **taken GPU-backed loans** (equipment financing, ABL/ABS facilities backed by NVIDIA/AMD chips)
3. Companies that provide **reinsurance** to the GPU/tech sector (specialty re/insurers, Lloyd's syndicates, parametric cover providers)

---

## Table of Contents
1. [Company Discovery — Finding Target Companies](#1-company-discovery)
2. [Financial Intelligence](#2-financial-intelligence)
3. [Technology Stack Intelligence](#3-technology-stack-intelligence)
4. [People Intelligence — Employee & Contact Enrichment](#4-people-intelligence)
5. [Social & Web Intelligence](#5-social--web-intelligence)
6. [Government & Regulatory Sources](#6-government--regulatory-sources)
7. [Alternative / Creative Data Sources](#7-alternativecreative-data-sources)
8. [Data Aggregation Platforms — Full Reviews](#8-data-aggregation-platforms)
9. [Enrichment Waterfall Architecture](#9-enrichment-waterfall-architecture)
10. [Legal & Ethical Considerations](#10-legal--ethical-considerations)
11. [Recommended Stack for Corgi](#11-recommended-stack-for-corgi)

---

## 1. Company Discovery

### 1.1 Industry Databases & Directories

#### NVIDIA Partner Network / DGX-Certified Partners
- **What it provides:** Official list of companies certified to sell, deploy, or integrate NVIDIA DGX systems and GPU infrastructure. Includes solution providers, cloud partners, and system integrators.
- **How to access:** Public directory at nvidia.com/en-us/data-center/partners/ — manually scrape or use web automation. Filter by region, partner tier, and specialty.
- **Cost:** Free (public directory)
- **Data quality:** ★★★★☆ — authoritative but only covers formal partners, not all operators
- **GPU relevance:** ★★★★★ — direct signal of GPU ownership/deployment
- **Creative angle:** Cross-reference partner IDs with LinkedIn to find infrastructure engineers at those companies. Companies that are "DGX-Ready" or "NVIDIA Preferred" operate serious GPU clusters.

#### AMD Partner Network
- **What it provides:** Similar to NVIDIA — lists companies integrating/deploying AMD Instinct (MI300X, MI250) GPUs for AI/HPC
- **How to access:** amd.com/en/partner/find-a-partner
- **Cost:** Free
- **GPU relevance:** ★★★★☆

#### MLCommons / MLPerf Submissions
- **What it provides:** Companies that submit to MLPerf benchmarks are *definitively* running large GPU clusters. The submission database lists companies, hardware configurations, and system sizes.
- **How to access:** mlcommons.org/results — public database with full hardware specs
- **Cost:** Free
- **Data quality:** ★★★★★ — ground truth for who owns serious inference/training hardware
- **Creative angle:** Every MLPerf submission includes the exact GPU model and cluster size. This is a *gold mine* for identifying serious operators — if a company submitted H100 results, they have H100s.

#### AI Infrastructure Indices & Market Research
- **What:** Trackers like the Epoch AI Frontier Data Centers Hub, DC Byte, DatacenterHawk, CBRE Data Center Reports
- **How to access:** epoch.ai/data/data-centers (free), DatacenterHawk (paid), DC Byte (paid subscription ~$5K-$20K/yr)
- **GPU relevance:** ★★★★☆ — identifies major facilities, often names the operator

---

### 1.2 SEC / EDGAR Filings

#### Full-Text Search (EFTS)
- **What it provides:** Search the text of ALL SEC filings since 2001 — 10-K, 10-Q, 8-K, S-1, proxy statements, etc. Find exact phrases like "NVIDIA H100", "GPU infrastructure", "capital expenditure for computing equipment."
- **How to access:**
  - Free: `https://efts.sec.gov/LATEST/search-index?q=%22NVIDIA+H100%22&dateRange=custom&startdt=2024-01-01&forms=10-K`
  - Also: `https://www.sec.gov/cgi-bin/srqsb` (legacy full-text)
  - Third-party API: `sec-api.io` — paid wrapper with better filtering, ~$299-$999/mo
- **Query examples for GPU companies:**
  ```
  "H100" "data center" "capital expenditure"
  "NVIDIA" "GPU" "equipment"
  "AI compute" "infrastructure investment"
  "graphics processing" "property and equipment"
  ```
- **Cost:** Free (SEC native), $299/mo (sec-api.io enhanced)
- **Data quality:** ★★★★★ — primary source, companies must disclose accurately
- **Creative angle:**
  - Search for companies that describe GPU fleets in their risk factors ("significant investment in GPU hardware exposes us to…")
  - Search for companies where NVIDIA appears in the "Major Vendors" section
  - Search 8-K filings for GPU-related press releases (e.g., "announces 10,000 H100 cluster")
  - XBRL financial data lets you programmatically extract CapEx figures from property/equipment schedules

#### Form 4 / Insider Transactions
- Check S-1 registration statements for GPU companies going public — they often disclose exact hardware inventories in prospectus risk factors.

---

### 1.3 Patent Databases

#### USPTO Patent Full-Text Database
- **What it provides:** Companies filing patents on GPU scheduling, distributed training, inference optimization, custom chip designs — all signal serious GPU investment
- **How to access:** 
  - `patents.google.com` — free full-text search
  - `patentsview.org` — structured API, free
  - `USPTO PatFT/AppFT` — free full-text
- **Search queries:**
  ```
  GPU "distributed training" assignee:(company)
  "neural network" "graphics processing unit" inference
  "tensor parallelism" OR "model parallelism"
  ```
- **Cost:** Free
- **GPU relevance:** ★★★☆☆ — companies filing GPU-related patents are investing in the space, but patent filings lag by 12-18 months
- **Creative angle:** Search for patents assigned to companies using NVIDIA's CUDA APIs. Any company filing patents on GPU memory management is building serious infrastructure.

---

### 1.4 Job Posting Analysis

Job postings are a *real-time signal* of what infrastructure a company is actually deploying. This is one of the highest-quality signals for GPU ownership.

#### Key Job Posting Signals for GPU Ownership

**Roles that indicate on-prem GPU ownership (vs. cloud GPU usage):**
- "Data Center Technician" + "GPU" or "NVIDIA"
- "Infrastructure Engineer" + "InfiniBand" or "NVLink" (only relevant for on-prem clusters)
- "HPC Systems Administrator"
- "GPU Cluster Engineer"
- "Cooling/Power Infrastructure" (data center physical layer)
- "Site Reliability Engineer" + "bare metal" + "GPU"

**Job description keywords indicating owned hardware:**
- "on-premises GPU cluster"
- "racking and stacking"
- "hardware validation"
- "DCIM" (Data Center Infrastructure Management)
- "InfiniBand fabric"
- "DGX SuperPOD"
- "Colossus" or "cluster at scale"
- "hardware procurement"

**Job posting data sources:**
- **Theirstack** (theirstack.com) — job posting database with tech stack filtering, ~$500-$2K/mo
- **Textkernel / Burning Glass** — structured job market data
- **Indeed API** — limited, requires approval
- **LinkedIn Jobs API** — restricted; use Sales Navigator + manual scraping
- **Otta, Greenhouse, Lever APIs** — many companies post on ATS platforms with structured data

**Structured job posting aggregators:**
- **JobsPikr** (~$200-$500/mo) — real-time job posting data with company metadata
- **Coresignal** (coresignal.com) — job posting + employee history data, ~$1K-$5K/mo
- **People Data Labs (PDL)** — bulk company+job posting data, $0.002-$0.01/record

---

### 1.5 News & Press Release Monitoring

#### Sources to monitor for GPU company signals:
- **Google News API / SerpAPI** — search for "GPU cluster" OR "H100" OR "AI infrastructure" announcements
- **PR Newswire / Business Wire API** — companies announce hardware purchases here
- **Meltwater / Mention.com** — enterprise news monitoring, $3K-$20K/yr
- **Google Alerts** — free, basic
- **Feedly / Inoreader** — RSS aggregation for tech publications

#### High-value publication RSS feeds:
- Data Center Dynamics (datacenterdynamics.com/en/news/)
- The Register (AI/cloud section)
- ServeTheHome (servethehome.com)
- AnandTech (now archived but archives searchable)
- HPCwire (hpcwire.com)
- The Next Platform (nextplatform.com)
- Blocks & Files (blocksandfiles.com)

**Creative angle:** Set up alerts for:
- "[Company name] + GPU" 
- "[Company name] + NVIDIA + data center"
- Any company announcing new data center construction in AI-dense regions (Northern Virginia, Phoenix, Dallas, Amsterdam)

---

### 1.6 Conference Attendee & Speaker Databases

Conferences are extremely high-signal for finding GPU infrastructure companies. The people presenting at these events *are* building these systems.

#### Key GPU / AI Infrastructure Conferences:
- **SC (Supercomputing)** — annual HPC conference, exhibitor list is public
- **GTC (NVIDIA GPU Technology Conference)** — speaker database at on.nvidia.com/gtc
- **Hot Chips** — detailed hardware talks, speaker affiliations
- **IPDPS, NeurIPS, ICML** — research lab and enterprise ML teams
- **Open Compute Project Summit (OCP)** — hyperscale infrastructure operators
- **Cloud Expo / Data Center World** — commercial operators
- **Liqid, Pure Storage, DDN user conferences** — storage/networking partners

**How to access attendee data:**
- Exhibitor/sponsor lists are almost always public (these are marketing vehicles)
- Speaker databases usually list names + company on conference websites
- LinkedIn events often have attendee lists visible to mutual connections
- Event apps (Whova, Eventbrite) sometimes have attendee directories

---

### 1.7 Government Contract Databases

#### USASpending.gov
- **What it provides:** Every U.S. federal government contract, grant, and loan. Search for GPU/NVIDIA purchases by federal agencies — these reveal which system integrators, cloud providers, and contractors handle government AI workloads.
- **How to access:** usaspending.gov/search — free. Filter by:
  - Award type: Contract
  - Keyword: "GPU", "NVIDIA", "graphics processing", "AI compute"
  - PSC codes: 7021 (Computers), 7025 (Peripheral data processing equipment)
  - NAICS: 334111 (Electronic Computer Manufacturing), 518210 (Data Processing)
- **Cost:** Free
- **GPU relevance:** ★★★★☆
- **Creative angle:** The *awardee* data tells you which companies are winning contracts to deploy GPU infrastructure for the government. These are companies with serious GPU fleets.

#### SAM.gov (System for Award Management)
- **What it provides:** Registered federal contractors — any company doing business with the federal government. Search for companies with GPU/AI capabilities listed in their capability statements.
- **How to access:** sam.gov — free search
- **Cost:** Free

#### FPDS-NG (Federal Procurement Data System)
- More detailed contract data than USASpending, queryable via API

---

### 1.8 Venture Capital & Startup Databases

These databases tell you who is *funding* GPU infrastructure companies — which is a leading indicator of GPU ownership.

*(Full reviews in Section 8 — Data Aggregation Platforms)*

**Quick signal:** Any company that raised a Series B+ in the AI infrastructure space in the last 24 months likely owns significant GPU hardware. Filter VC databases for:
- Category: "AI Infrastructure", "Cloud Computing", "HPC"
- Stage: Series A+
- Recent funding: 2023-2025

---

### 1.9 Import/Export Records

This is a GOLD MINE for identifying companies actively importing NVIDIA hardware.

#### Volza
- **What it provides:** Global import/export customs records for 209 countries. Can search for NVIDIA GPU shipments — shows importer name, address, quantities, prices, shipping dates.
- **How to access:** volza.com — subscription required
- **Data available:** Importer name, address, shipment dates, HS codes, quantities, unit values, exporter names
- **Cost:** ~$500-$2K/mo depending on country coverage
- **GPU relevance:** ★★★★★ — direct evidence of GPU hardware imports
- **Creative angle:** Search HS code 8471.80 (data processing machines) + "NVIDIA" in product description. Companies importing thousands of units are building real clusters.

#### ImportYeti (importyeti.com)
- **What it provides:** U.S. import records (bill of lading data), free tier available
- **Cost:** Free basic / paid for exports and contacts
- **Coverage:** U.S.-focused

#### Panjiva (S&P Global subsidiary)
- **What it provides:** North America + Latin America customs records, 10M+ businesses
- **Cost:** ~$1,500-$5,000/mo
- **Data quality:** ★★★★☆

#### Import Genius (importgenius.com)
- **What it provides:** U.S. import records with company contact details
- **Cost:** ~$500-$2,000/mo
- **GPU relevance:** ★★★★★

**Search strategy for Corgi:**
1. Search HS codes 8471.80.1000 and 8473.30.1180 (NVIDIA GPU classifications)
2. Filter for importers of record in your target geographies
3. Match company names against other enrichment sources
4. High-volume importers = large GPU deployments = high insurance need

---

## 2. Financial Intelligence

### 2.1 SEC EDGAR — Structured Financial Data

#### 10-K (Annual Reports) — Equipment Schedules
- **Target sections:**
  - Note: Property, Plant & Equipment — look for "computer equipment" or "servers" line items with high values
  - MD&A (Management Discussion & Analysis) — capex discussions
  - Risk Factors — "dependence on GPU suppliers", "GPU supply constraints"
  - Commitments & Contingencies — future purchase obligations (e.g., NVIDIA prepaid orders)
- **Free API:** `data.sec.gov/api/xbrl/frames/` — XBRL financial data in JSON
- **Example query:** Get all companies with PropertyPlantAndEquipmentNet > $500M in the computer equipment subcategory

#### 8-K (Current Reports) — Real-Time Events
- Companies file 8-Ks for material GPU purchases, credit facility announcements
- Search EDGAR for 8-Ks mentioning "GPU", "NVIDIA", "compute infrastructure"

#### S-1 Registration Statements
- AI companies going public disclose detailed hardware inventories
- CoreWeave's S-1 (2025) disclosed 250,000+ NVIDIA chips — this level of detail is gold for insurance underwriting

---

### 2.2 UCC Filings — GPU-Backed Loans

**This is the most direct source for identifying companies with GPU-backed debt.**

#### How It Works
- When a lender provides a GPU-backed loan, they file a UCC-1 Financing Statement with the Secretary of State in the debtor's state
- The filing lists: debtor name/address, secured party name/address, and collateral description
- For GPU loans, collateral descriptions often include: "all inventory, including NVIDIA GPUs, serial numbers as listed in Schedule A", "all AI computing hardware"
- These are **public records**

#### How to Search
1. **State-by-state:** Each Secretary of State has a free UCC search portal. Key states:
   - Delaware: corp.delaware.gov/uccfilings/
   - California: bizfileonline.sos.ca.gov/search/ucc
   - New York: appext20.dos.ny.gov/pls/ucc_pub/web_search
   - Texas: sos.state.tx.us/ucc/

2. **National aggregators (paid):**
   - **CSC Global (cscglobal.com)** — comprehensive national UCC search, custom pricing
   - **CT Corporation (wolterskluwer.com/ct)** — enterprise UCC search
   - **Lien Solutions (liensolutions.com)** — real-time UCC monitoring
   - **PACER (pacer.gov)** — federal court filings including UCC-related disputes

3. **Search strategies:**
   - Search by **secured party name**: Look for lenders known to do GPU deals (Blackstone Credit, DigitalBridge Credit, Upper90, Pacific Western Bank, Western Technology Investment)
   - Search by **debtor name** if you have a specific company
   - Search collateral descriptions containing "NVIDIA", "GPU", "graphics processing", "AI chips"

4. **Key GPU lenders to search as secured party:**
   - Blackstone Credit
   - Magnetar Capital
   - DigitalBridge Credit
   - PIMCO
   - Carlyle Group
   - Upper90
   - Pacific Western Bank / PacWest
   - Western Technology Investment (WTI)
   - Trinity Capital
   - Hercules Capital

**Creative angle:** This is the *only* database that directly shows GPU-backed loan relationships. If a company has a UCC-1 filed by Blackstone with GPU collateral, that company *needs* GPU infrastructure insurance.

#### UCC Data Quality
- ★★★★★ for identifying GPU-backed loans
- Data freshness: UCC filings are current (must be renewed every 5 years)
- Free at state level; ~$50-$500/search via aggregators

---

### 2.3 Private Company Revenue Estimation

Techniques for estimating revenue of private GPU companies:

#### Employee Count as Proxy
- **Method:** Use LinkedIn employee count × revenue/employee benchmarks by industry
- AI infrastructure companies: ~$150K-$400K revenue/employee for cloud providers
- **Sources for employee counts:** LinkedIn (direct), Harmonic.ai, PeopleDataLabs

#### Web Traffic Analysis
- **SimilarWeb** ($125-$333/mo): Estimates monthly visits, engagement metrics
- **Semrush** ($120-$450/mo): Traffic + keyword data
- **Rule of thumb:** For SaaS/cloud, ~$1-$5 revenue per monthly unique visitor

#### Job Posting Volume
- Companies hiring at 20%+ YoY are likely growing revenue at similar rates
- Coresignal, Theirstack, and LinkedIn all provide historical job posting counts

#### Funding-Based Valuation
- Last round valuation × 0.3-0.7x is a rough private company revenue estimate
- Rule of thumb: AI infrastructure companies trade at 5-15x revenue (2024-2025 market)

#### PrivCo, Dun & Bradstreet
- These platforms aggregate private financial data (see Section 8)

---

### 2.4 Debt & Credit Intelligence

#### Reorg Research (reorg.com)
- **What it provides:** Private credit market intelligence, distressed debt, restructuring data
- **Cost:** $5K-$30K/yr
- **GPU relevance:** ★★★☆☆ — useful if GPU-backed debt goes distressed (insurance claims scenario)

#### Covenant Review / LCD (Leveraged Commentary & Data)
- **What it provides:** Leveraged loan and bond market data — useful for finding GPU company debt facilities
- **Cost:** Part of S&P Global bundle

#### Bloomberg Terminal
- Full debt/bond/loan data, but $25K+/yr per seat
- GPU companies raising term loans appear in Bloomberg's loan database

#### Pitchbook Debt Data
- Term sheets, credit facilities, debt rounds — included in PitchBook Enterprise

---

### 2.5 Equipment Leasing & Financing Records

- **Equipment Leasing and Finance Association (ELFA)** — industry body, member directory
- **Monitor Daily** — equipment finance industry publication, deal announcements
- **deBanked.com** — alternative lending/equipment finance news
- **Watch for:** Announcements of GPU leasing facilities, NVIDIA Capital partnerships, hyperscaler financing announcements

---

## 3. Technology Stack Intelligence

### 3.1 Direct GPU Detection Methods

#### Shodan / Censys
- **What they provide:** Internet-connected device inventory — can find exposed GPU telemetry endpoints, DCGM (Data Center GPU Manager) metrics endpoints, NVIDIA DCGM Prometheus exporters
- **How to access:** 
  - Shodan: shodan.io — free basic, $69-$899/mo for API
  - Censys: censys.io — free tier, $99-$995/mo for teams
- **Search queries:**
  - `shodan: "dcgm" port:9400` (finds exposed NVIDIA DCGM Prometheus exporters)
  - `shodan: "nvidia-smi" html`
  - `censys: services.banner:"NVIDIA"` 
- **Data quality:** ★★★☆☆ — only finds *exposed* endpoints, many GPU clusters are properly firewalled
- **GPU relevance:** ★★★☆☆

#### NVIDIA DCGM (Data Center GPU Manager) Exporter
- Some companies expose GPU telemetry on public ports — `port:9400` with "dcgm" in the banner
- Returns GPU model, utilization, memory, power consumption metrics

#### Cloud Provider GPU Instance Detection
- Use BuiltWith/Wappalyzer to see if a company uses AWS, GCP, or Azure
- Cross-reference with their job postings for "GPU instance" or "A100" usage
- **Key insight:** Companies using cloud GPU instances at scale will appear in cloud vendor partner directories

#### ASN / BGP Analysis
- **BGPView (bgpview.io)** — free ASN lookup, see IP ranges owned by a company
- **Hurricane Electric BGP Toolkit (bgp.he.net)** — free, comprehensive
- **PeeringDB (peeringdb.com)** — free, shows which data centers a company is in (if they peer)
- **RIPE Stat (stat.ripe.net)** — free, European focus
- **IPinfo.io** — $0-$250/mo, ASN + company mapping
- **Method:** Look up a company's ASN, see their IP block announcements, identify which data center facilities they're present in based on BGP routes

#### SSL Certificate Transparency Logs
- **crt.sh** — free, search all issued SSL certificates
- Find subdomains like `gpu.company.com`, `compute.company.com`, `dgx.company.com`, `h100.company.com`
- Shows internal infrastructure naming conventions

#### DNS Records
- Tools: SecurityTrails (securitytrails.com, $50-$500/mo), Spyse (acquired by SecurityTrails), DNSdumpster (free)
- Find hostnames suggesting GPU infrastructure: `gpu-cluster.company.com`, `inference.company.com`, `train.company.com`

---

### 3.2 Technology Intelligence Platforms

#### BuiltWith (builtwith.com)
- **What it provides:** Front-end technology detection for 673M+ websites, 111K+ technology signatures
- **How to access:** API or manual lookup
- **Cost:** Free basic, $295-$495/mo for API/bulk
- **GPU relevance:** ★★☆☆☆ — detects frontend frameworks, CDNs, analytics; limited backend GPU detection
- **Creative angle:** Can identify if a company uses NVIDIA's NIM (NVIDIA Inference Microservices) via SDK references, or if they link to GPU cloud APIs

#### Wappalyzer (wappalyzer.com)
- Similar to BuiltWith but browser-extension-based with crawler component
- **Cost:** Free basic, $250+/mo for API
- **Limitation:** Backend infrastructure (where GPUs live) is not detectable via website scanning

#### G2 Stack (g2.com/products/g2-buyer-intent)
- Companies' software purchasing patterns — if they're buying ML tools (Weights & Biases, Comet, Scale AI), they're running ML infrastructure

---

### 3.3 Data Center & Colocation Intelligence

#### DatacenterHawk (datacenterhawk.com)
- **What it provides:** Data center market intelligence — facility locations, operators, capacity, tenants
- **Cost:** $10K-$50K/yr (enterprise)
- **GPU relevance:** ★★★★☆ — identifies who's leasing data center space and expanding

#### DC Byte
- Similar to DatacenterHawk, European focus
- **Cost:** $5K-$20K/yr

#### Structure Research
- Market research firm focused on data center infrastructure
- Reports on GPU infrastructure operators

#### Colocation Provider Customer Detection
- Some colo providers list case studies or reference customers (Equinix, Digital Realty, QTS, CyrusOne)
- LinkedIn: Search "[Equinix OR CoreSite OR CyrusOne] AND [GPU OR AI OR ML]" in job postings
- Equinix's customer list is partially public via their annual report and press releases

---

### 3.4 Power & Energy Intelligence

#### Public Utility Commission Filings
- Large power consumers must file with state utility commissions
- Data centers filing for new 100MW+ connections are building serious GPU infrastructure
- **Where to look:** State PUC websites (FERC.gov for interstate; state PUC for local)
- **Creative angle:** A power interconnection request for 100-500MW from a previously unknown company is a strong signal of GPU cluster deployment

#### EIA (U.S. Energy Information Administration)
- **eia.gov/electricity** — tracks large industrial power consumers
- Form EIA-861 reports electricity sales data by utility

---

## 4. People Intelligence — Employee & Contact Enrichment

### 4.1 LinkedIn

#### LinkedIn Sales Navigator
- **Plans (2025):**
  - Core: $119.99/mo or $1,079.88/yr per seat
  - Advanced (team): $159.99/mo or $1,799.88/yr per seat  
  - Advanced Plus (enterprise, CRM-integrated): Custom ~$1,600+/seat/yr
- **Key capabilities:**
  - 50+ search filters including job title, seniority, company size, industry, technologies
  - Lead and account lists with alerts
  - 50 InMail credits/mo
  - CSV upload for account-based targeting
- **GPU-specific search:** Filter for "Data Center" OR "GPU" OR "HPC" in keywords; companies in industry "Internet Software & Services" or "Computer Hardware"
- **Limitation:** LinkedIn blocks bulk data export; no programmatic API access for standard users

#### LinkedIn Data via Third-Party Providers
- **Proxycurl (proxycurl.com)** — LinkedIn profile scraping API, $0.01-$0.04/profile, legal grey area
- **PhantomBuster** — LinkedIn automation, $56-$352/mo
- **Evaboot** — Sales Navigator export, $49-$99/mo
- **Wiza** — Sales Navigator export with email enrichment

---

### 4.2 Email Discovery Tools

#### Hunter.io
- **What it provides:** Domain-based email discovery (finds all emails at a domain), email verification, email pattern discovery
- **Pricing (2025):**
  - Free: 25 searches + 50 verifications/mo
  - Starter: $49/mo (500 searches, 1,000 verifications)
  - Growth: $99/mo (2,500 searches, 5,000 verifications)
  - Business: $199/mo (10,000 searches, 20,000 verifications)
  - Scale: $299/mo
- **API:** Free with any plan (credits consumed same as platform)
- **Data quality:** ★★★★☆ — high accuracy for corporate domains
- **Best for:** Systematic email discovery when you know the domain

#### Snov.io
- **What it provides:** Email finder, verifier, drip campaigns, LinkedIn automation (add-on)
- **Pricing (2025):**
  - Free trial: 50 credits
  - Starter: $39/mo (1,000 credits)
  - Pro S: $99/mo (5,000 credits)
  - Pro 20K: $149/mo (20,000 credits)
  - Pro 50K: $249/mo (50,000 credits)
- **API:** Available from Starter plan
- **LinkedIn automation add-on:** $69/slot/mo
- **Data quality:** ★★★☆☆

#### Apollo.io
- **What it provides:** Email + phone discovery, prospecting, sequences, enrichment
- **Pricing (2025):**
  - Free: 10,000 email credits/mo, 5 mobile credits
  - Basic: $59/mo per user ($49/yr) — 2,500 email credits/mo, 75 mobile credits
  - Professional: $99/mo per user — 9,000 credits, A/B testing, call dialing
  - Organization: $119-149/mo per user — 15,000 credits, advanced API
- **API:** Available on Organization plan
- **Database:** 210M+ contacts, 35M+ companies
- **Data quality:** ★★★★☆ for North America; weaker internationally
- **Best for:** Volume prospecting with intent signals

#### Seamless.ai
- **What it provides:** Real-time email + phone discovery with AI verification
- **Pricing:** Free (50 credits), Basic ($147/mo), Pro (custom), Enterprise (custom)
- **Data quality:** ★★★☆☆ — high volume but mixed accuracy reports
- **Differentiator:** Claims real-time verification vs. cached databases

#### RocketReach
- **What it provides:** Email, phone, LinkedIn profiles for 700M+ professionals
- **Pricing:** $53-$359/mo (individual), enterprise custom
- **API:** Available on all paid plans
- **Data quality:** ★★★☆☆

#### ContactOut
- **What it provides:** Email + phone from LinkedIn profiles, Chrome extension
- **Pricing:** Free (4 emails/day), $29-$99/mo individual, enterprise custom
- **Data quality:** ★★★☆☆

#### LeadIQ
- **What it provides:** Prospecting + email/phone discovery, CRM integration, buying signals
- **Pricing:** Free (20 verified emails/wk), Starter $45/mo, Pro $89/mo, Enterprise custom
- **Data quality:** ★★★★☆ for decision-maker contacts

#### SalesIntel
- **What it provides:** Human-verified contacts (95%+ accuracy claimed), technographic data, intent data
- **Pricing:** $69-$99/mo/user, enterprise custom
- **Differentiator:** Human research team verifies contacts — higher accuracy than AI-only
- **Data quality:** ★★★★☆

---

### 4.3 Professional Association & Membership Directories

- **Association for Computing Machinery (ACM)** — member directory (limited public access)
- **IEEE** — member directory; GPU/HPC papers identify key engineers
- **SNIA (Storage Networking Industry Association)** — storage + compute infrastructure members
- **AFCOM (data center professionals)** — member directory
- **ASHRAE** — thermal engineering for data centers (cooling engineers at GPU facilities)

---

### 4.4 Patent Inventor Databases

Patents list inventors by name and employer:
- **Google Patents API** — free, search by assignee and pull inventor lists
- **PatentsView API (patentsview.org/api)** — free, structured data
- **Method:** Search for GPU/AI patents, extract inventor names and affiliations = technical leadership at GPU companies

---

### 4.5 GitHub / Technical Communities

#### GitHub
- **Method:** Search GitHub for organizations with GPU-related repos
  - `org:company-name cuda OR triton OR vllm OR tgi`
  - Companies with DCGM, NVML, or CUDA in their repos are running GPUs
- **GitHub API:** Free, 5,000 requests/hr authenticated
- **Tools:** ghapi (Python), PyGithub

#### Key GPU indicators on GitHub:
- NVIDIA DCGM configurations
- Slurm job scheduler configs (HPC cluster management)
- Kubernetes GPU device plugin manifests
- Custom CUDA kernels (writing custom CUDA = owning GPUs)

---

### 4.6 Academic Databases

- **Semantic Scholar API (semanticscholar.org/product/api)** — free, search AI/ML papers by institution
- **OpenAlex (openalex.org)** — free open academic data, 240M+ papers
- **ArXiv** — preprints; GPU infrastructure papers include cluster specs
- **Method:** Find papers from company research labs, identify key researchers, enrich via LinkedIn

---

## 5. Social & Web Intelligence

### 5.1 Twitter/X Monitoring

- **Search operators:** `"H100" OR "GPU cluster" from:@companyhandle`
- **Monitoring tools:** 
  - Tweetdeck (free)
  - Brandwatch ($1K-$5K/mo)
  - Sprinklr ($1.5K+/mo)
  - Mention.com ($49-$250/mo)
- **Key signals:** 
  - Company announces new GPU purchase → tweet/press release
  - Engineers tweeting GPU utilization screenshots
  - Job posting tweets about GPU infrastructure roles

### 5.2 Reddit

**High-value subreddits for GPU company intelligence:**
- r/MachineLearning — research announcements, infrastructure discussions
- r/LocalLLaMA — who's building local GPU inference clusters
- r/HPC — HPC cluster operators
- r/DataHoarder — large-scale storage + compute
- r/sysadmin — IT infrastructure discussions mentioning GPU deployments
- r/gpumining (for crypto-to-AI transitions)

**How to mine Reddit:**
- Pushshift API (was free, now limited/paid via third parties)
- PRAW (Python Reddit API Wrapper) — free, official
- Reveddit, PullPush — third-party archives

### 5.3 Hacker News

- **Search:** hn.algolia.com — full-text search of all HN posts and comments
- **API:** hnsearch.io — free
- **Key signals:** 
  - Show HN posts about GPU infrastructure products
  - Comments mentioning specific companies' GPU clusters
  - Hiring posts often list GPU infrastructure details

### 5.4 Blog & Content Monitoring

**Automated blog monitoring:**
- **Feedly Pro ($8/mo)** — RSS aggregation + keyword alerts
- **Google Alerts (free)** — basic keyword monitoring
- **Distill.io ($15/mo)** — web page change monitoring (watch companies' "infrastructure" or "careers" pages)

**Key technical blogs to monitor:**
- Engineering blogs: `engineering.company.com` or `blog.company.com`
- Search: `site:company.com "GPU" OR "H100" OR "NVIDIA"`
- Medium + Substack technical posts from company engineers

### 5.5 Glassdoor / LinkedIn Reviews

- Reviews often mention internal infrastructure ("we run our own GPU cluster")
- Glassdoor reviews mentioning "InfiniBand", "DGX", or "bare metal" are strong signals
- **Glassdoor API:** Not officially available; third-party scrapers exist

### 5.6 Web Archive Analysis

- **Wayback Machine (web.archive.org)** — free, track historical changes to a company's website
- **Difft (difft.com)** — website change detection
- **Method:** Track companies' "technology" or "infrastructure" pages for changes indicating GPU deployment growth

---

## 6. Government & Regulatory Sources

### 6.1 State Corporate Registration Databases

- **OpenCorporates (opencorporates.com)** — aggregates corporate filings from 150+ jurisdictions
  - Free basic, $500-$5K/mo for API
  - Useful for: registered agent data, corporate structure, subsidiary mapping
- **State Secretary of State websites** — free, lookup by company name
- **Registered Agent lookup:** Finding the service agent gives you corporate structure insight

### 6.2 IRS Exempt Organization Data

- **IRS Form 990 data** — public, free via ProPublica Nonprofit Explorer
- For research universities, national labs, and nonprofits that own GPU clusters (MIT, Stanford, various DOE labs)
- These are not commercial insurance targets but may be reinsurance/partnership targets

### 6.3 OFAC / Sanctions Lists

- **OFAC SDN List (sanctions list)** — free via ofac.treas.gov
- For checking potential customers before onboarding
- **World-Check (Refinitiv)** — paid, ~$10K+/yr
- **Dow Jones Risk & Compliance** — paid

### 6.4 Export Control Databases

- **BIS (Bureau of Industry and Security)** — export controls on NVIDIA A100/H100 under ECCN 3A090
- **Denied Parties List** — companies restricted from receiving NVIDIA chips
- **Access:** bis.doc.gov/index.php/the-denied-persons-list

**Relevance for Corgi:** Companies receiving GPU insurance may need to comply with export controls. A GPU in a sanctioned country is uninsurable and a compliance risk.

### 6.5 Building & Environmental Permits

**For identifying data center construction:**

- **datacenter.fyi** — aggregates data center permit filings by state (free)
- **PermitData (permitdata.io)** — building permit database, ~$500-$2K/mo
- **BuildZoom** — construction permit data, free basic
- **Local government portals:** Most municipalities post permit applications online

**What to look for:**
- Building permits for "data center", "server farm", "computing facility"
- Electrical permits for high-voltage infrastructure (>1MW = significant GPU facility)
- Mechanical permits for precision cooling systems (CRAC units, liquid cooling)
- Zoning variance applications in industrial areas near power substations

### 6.6 State Insurance Department Databases

For finding reinsurance target companies:
- NAIC (National Association of Insurance Commissioners) — insurer financial data, free via naic.org
- State insurance department annual reports — list licensed insurers and their financials
- AM Best ratings database — rated insurers
- Lloyd's of London syndicate directory — lloyds.com/market-resources/market-directory

---

## 7. Alternative / Creative Data Sources

### 7.1 Satellite Imagery

#### Epoch AI Frontier Data Centers Hub
- **What it provides:** Free database of major AI data centers globally, with capacity estimates derived from satellite imagery analysis of cooling infrastructure
- **Access:** epoch.ai/data/data-centers — **completely free and updated**
- **Method used:** Analyzes chiller/cooling tower footprints from satellite imagery to estimate power capacity
- **GPU relevance:** ★★★★★ — directly identifies major GPU-operating facilities

#### Planet Labs (planet.com)
- **What it provides:** High-resolution satellite imagery updated daily, infrastructure change detection
- **Cost:** Enterprise pricing (~$10K-$100K+/yr)
- **Use case:** Monitor specific data center sites for construction activity

#### Airbus Space Solutions
- Infrastructure change detection analytics
- **Cost:** Enterprise

#### Maxar Technologies (maxar.com)
- High-resolution archive + tasking
- **Cost:** Enterprise

**Creative angle for Corgi:** Monitor data center construction sites for companies that are building new GPU facilities. A company that just broke ground on a 200MW facility is about to have an enormous amount of insurable GPU hardware.

---

### 7.2 Energy / Power Consumption Data

- **FERC Electric Market Data** — large generators and industrial consumers must file
- **EIA Electricity Data (eia.gov/electricity)** — large commercial users (Form 861)
- **State Public Utility Commission databases** — interconnection requests reveal planned power demands
- **EPA eGRID database** — facility-level power consumption for major consumers

**Creative angle:** A company filing for a 500MW power interconnection is building a GPU mega-cluster. File dates appear 12-24 months before construction completes.

---

### 7.3 Real Estate Intelligence

- **CoStar (costar.com)** — commercial real estate database, $10K-$50K/yr
  - Data center lease transactions
  - Companies leasing high-density colocation space
- **CBRE Research** — data center market reports (free PDFs)
- **JLL Data Center Solutions** — market intelligence
- **Datacenter.com** — lease listings sometimes reveal tenants

---

### 7.4 SSL Certificate Transparency

- **crt.sh (crt.sh)** — free, all public SSL certificates
- **Censys certificates** — comprehensive cert database with org mapping
- **Search patterns:** Companies with subdomains like `compute.`, `gpu.`, `train.`, `inference.`, `cluster.`, `hpc.` are running GPU infrastructure

---

### 7.5 Open Source Contributions

#### GitHub Organization Search
- **github.com/search?q=NVIDIA+DCGM+org:target-company** — free
- GPU-related open source contributions indicate internal GPU infrastructure
- Companies contributing to vLLM, TensorRT-LLM, Flash Attention own serious hardware

#### Key GPU-related repos to check org activity for:
- NVIDIA/DCGM (data center management)
- NVIDIA/TensorRT (inference optimization)
- vllm-project/vllm (LLM inference)
- huggingface/transformers (if they're submitting GPU-specific optimizations)
- Custom CUDA kernel repos

---

### 7.6 Cloud GPU Comparison Sites

These aggregate real-time GPU availability and pricing:
- **getdeploying.com/gpus** — GPU price comparison across cloud providers
- **gpulist.ai** — GPU availability tracker  
- **vast.ai** — GPU marketplace (shows active GPU renters/providers)
- **RunPod marketplace** — GPU providers list their hardware specs

**Creative angle:** Companies *selling* GPU capacity on RunPod/Vast.ai own real hardware. The provider listings include company information.

---

### 7.7 Crunchbase/LinkedIn Company Profile Scraping

- **Apify (apify.com)** — web scraping platform with pre-built scrapers for LinkedIn, Crunchbase, G2
  - LinkedIn scraper: ~$49-$99/mo
  - Crunchbase scraper: ~$29-$99/mo
- **ScrapeOwl, ScraperAPI, Bright Data** — proxy infrastructure for scraping
  - Bright Data: $500-$5K+/mo for residential proxies

---

### 7.8 Stack Overflow / Developer Communities

- **Stack Overflow for Teams API** — limited
- **Stack Overflow Jobs (now defunct)** — historical data searchable
- **Stack Exchange Data Dump** — free download of all public Q&A
  - Search for questions tagged `cuda` + `company` mentions in profiles

---

## 8. Data Aggregation Platforms

### 8.1 Contact & Prospecting Platforms

#### Apollo.io ⭐ Recommended starting point
- **What it provides:** 210M+ contacts, 35M+ companies, email + phone, intent data, sequences, enrichment API
- **Pricing (2025):**
  - Free: 10K email credits/mo
  - Basic: $59/mo (2,500 email credits, 75 mobile)
  - Professional: $99/mo (9,000 credits, advanced automation)
  - Organization: $119-149/mo (15,000 credits, advanced API)
- **Data quality:** ★★★★☆ — strong for tech companies in North America, improving globally
- **API quality:** ★★★☆☆ — available on Organization plan but rate-limited
- **GPU relevance:** Filter by industry ("Computer Hardware", "Information Technology"), then use job title and keyword filters for GPU-specific roles
- **Best for Corgi:** Primary prospecting database — find CTO/VP Infrastructure at AI companies

#### ZoomInfo
- **What it provides:** 260M+ contacts, 100M+ companies, intent data (Streaming Intent), technographics, org charts
- **Pricing (2025):**
  - Professional: $14,995/yr (5,000 credits)
  - Advanced: $24,995/yr (10,000 credits)
  - Elite: $14,995-$39,995/yr (API, advanced features)
  - Add-ons: Intent Signals ($5K-$20K/yr), WebSights, Engage
- **Data quality:** ★★★★★ — best database depth for enterprise contacts
- **API:** Enterprise/Elite tier
- **GPU relevance:** Strong technographic filters — can filter for companies using "NVIDIA", "GPU computing", "AI infrastructure"
- **Best for Corgi:** Enterprise and mid-market GPU operators; expensive but comprehensive

#### Cognism ⭐ Best for Europe
- **What it provides:** GDPR-compliant contacts (critical for EU), Diamond Data (phone-verified mobiles), Bombora intent integration
- **Pricing (2025):**
  - Platinum: $15,000 platform fee + $1,500/user/yr
  - Diamond: $25,000 platform fee + $2,500/user/yr
- **Diamond Data features:** Phone-verified mobiles with 87% connect rate (vs. 30% industry average); 10M+ phone-verified contacts
- **Data quality:** ★★★★☆ — highest phone accuracy; strong EU coverage
- **Best for Corgi:** European GPU companies and reinsurance contacts (Lloyd's, Munich Re, Swiss Re)

#### Lusha
- **What it provides:** 280M+ contacts, email + phone, intent signals, CRM integrations
- **Pricing (2025):**
  - Free: 40-70 credits/mo
  - Pro: $22.45/user/mo (3,000 credits/yr)
  - Premium: $52.45-69.90/mo (9,600 credits/yr)
  - Scale: Custom (~$15,180 median/yr per Vendr)
- **Data quality:** ★★★★☆ — 98% email accuracy (NA), 90%+ phone validation
- **API:** Available on all plans
- **Best for Corgi:** Good balance of cost and quality for mid-market GPU companies

---

### 8.2 Revenue & Company Intelligence Platforms

#### PitchBook ⭐ Best for private company financials
- **What it provides:** 3M+ companies, funding rounds, valuations, investor data, debt/equity transactions, cap tables, M&A deals
- **Pricing (2025):**
  - Solo: $12,000-$20,000/yr
  - Standard (3 users): ~$25,000/yr
  - Professional: $25,000-$40,000/yr
  - Enterprise: $50,000+/yr
- **Data quality:** ★★★★★ for funded companies; ★★★☆☆ for unfunded private companies
- **GPU relevance:** ★★★★★ — has data on all major AI infrastructure funding rounds, investors, co-investors
- **Best for Corgi:** Mapping the GPU ecosystem — who funded CoreWeave, Crusoe, Lambda, Together.ai, etc.; investor network mapping

#### Crunchbase
- **What it provides:** 3.5M+ companies, funding rounds, investor data, acquisitions
- **Pricing (2025):**
  - Starter: $29/user/mo
  - Pro: $49/user/mo
  - Enterprise: Custom
- **Data quality:** ★★★☆☆ — community-contributed, less accurate than PitchBook but cheaper
- **GPU relevance:** ★★★★☆ — good for identifying funded GPU startups
- **Best for Corgi:** Initial discovery of funded GPU companies at lower cost than PitchBook

#### Harmonic.ai ⭐ Best for early-stage AI companies
- **What it provides:** 30M+ companies, 190M+ people, real-time signals (job postings, tech stack changes, funding), GraphQL/REST API, data warehouse delivery
- **Pricing (2025):** Enterprise minimum ~$25,000/yr ($10,000/user/yr, 3-seat minimum)
- **Data quality:** ★★★★★ — freshest data for emerging AI companies
- **GPU relevance:** ★★★★★ — purpose-built for AI company tracking; excels at finding companies before they're on anyone else's radar
- **Best for Corgi:** Finding GPU-intensive AI startups before they're obvious targets

#### CB Insights
- **What it provides:** Startup intelligence, market maps, funding signals, technology tracking, analyst reports
- **Pricing:** Custom enterprise (high-end, typically $20K-$100K+/yr)
- **Data quality:** ★★★★☆ for strategic intelligence; not as deep on contacts
- **GPU relevance:** ★★★★☆ — strong on AI market intelligence

#### Grata
- **What it provides:** Private company search specializing in lower-middle market companies not covered by PitchBook; AI-powered similarity search
- **Pricing (2025):** ~$18,000/yr (reported user prices); enterprise custom
- **Data quality:** ★★★★☆ for private companies under $100M revenue
- **GPU relevance:** ★★★☆☆ — better for finding smaller GPU operators that aren't VC-backed

#### Dealroom.co
- **What it provides:** European focus on startup and VC data; strong for EU/UK companies
- **Pricing:** $10K-$25K/yr
- **GPU relevance:** ★★★★☆ for European GPU/AI companies
- **Best for Corgi:** European reinsurer and GPU company discovery

#### D&B Hoovers (Dun & Bradstreet)
- **What it provides:** 500M+ companies globally, revenue estimates, employee counts, DUNS numbers, corporate family trees
- **Pricing (2025):**
  - Essentials: $49/mo (150 credits) or $529/yr
  - Enterprise: $25,000+/yr with API
- **Data quality:** ★★★★☆ for large companies; ★★★☆☆ for private companies
- **GPU relevance:** ★★★☆☆ — useful for corporate structure and revenue estimation
- **API:** 5 QPS standard, 18K enrichments/hr

#### PrivCo
- **What it provides:** Private company financials — revenue, EBITDA estimates for U.S. private companies
- **Pricing:** ~$3,000-$15,000/yr
- **Data quality:** ★★★★☆ for covered companies; coverage is limited
- **GPU relevance:** ★★★☆☆

#### Owler (owler.com)
- **What it provides:** Company news, competitive intelligence, CEO alerts, funding news
- **Pricing:** Free, Pro $39/mo, Max $99/mo
- **Data quality:** ★★★☆☆ — community-sourced revenue estimates, variable quality
- **GPU relevance:** ★★★☆☆ — useful for monitoring news and competitive intelligence

#### Tracxn
- **What it provides:** Startup tracking, curated sector reports, investment intelligence
- **Pricing:** $599-$1,199/mo
- **GPU relevance:** ★★★☆☆

---

### 8.3 Intent Data Platforms

Intent data tells you which companies are *actively researching* topics related to GPU infrastructure, equipment financing, or insurance — i.e., in-market buyers.

#### Bombora
- **What it provides:** Company Surge® scores — companies showing elevated research activity on specific topics vs. their baseline, based on content consumption across 5,000+ B2B websites (17B monthly interactions)
- **How it works:** If a company's employees are reading about "GPU infrastructure insurance", "equipment financing for AI", or "data center insurance", Bombora detects that intent
- **Pricing (2025):** $25,000-$30,000/yr entry; $50,000-$100,000/yr typical; ~$58,000 median per Vendr
- **Topics for Corgi:** "Technology Insurance", "Equipment Financing", "Data Center Operations", "GPU Cloud Computing", "AI Infrastructure"
- **Data quality:** ★★★★☆
- **GPU relevance:** ★★★★☆ — high-quality intent signal for in-market companies

#### 6sense
- **What it provides:** AI-powered ABM platform combining Bombora intent, website visitor identification, predictive scoring, and ad targeting; claims 1 trillion+ B2B signals/day (Signalverse)
- **Pricing (2025):** 
  - Entry: ~$60,000/yr
  - Mid-market (5,000-10,000 accounts): $60,000-$100,000/yr
  - Enterprise: $300,000+/yr
- **Includes:** 12 free Bombora topics for all customers
- **Data quality:** ★★★★★ for enterprise ABM
- **Best for Corgi:** If budget allows, 6sense provides the most comprehensive "who is in-market" signal

#### G2 Buyer Intent
- **What it provides:** Intent signals from companies researching products in G2's software categories
- **Pricing:** $10K-$50K+/yr
- **GPU relevance:** ★★☆☆☆ — better for software sales; limited insurance/infrastructure signal

#### TechTarget Intent Data
- **What it provides:** B2B tech content consumption signals — companies reading about specific technologies
- **Pricing:** $20K-$100K/yr
- **GPU relevance:** ★★★★☆ — strong for technical decision-makers researching GPU infrastructure

---

### 8.4 Knowledge Graph & Web Data

#### Diffbot Knowledge Graph
- **What it provides:** 10B+ entities (people, companies, products, articles) extracted from the entire web via AI; 50+ fields per company; organizational relationships
- **Pricing (2025):**
  - Startup: $299/mo (250K credits)
  - Plus: $899/mo (1M credits)
  - Enterprise: Custom
  - Credit costs: 25 credits per company record export; 100 credits for enhanced records
- **API quality:** ★★★★★ — REST API, comprehensive
- **Data quality:** ★★★★☆ — AI-extracted, can have errors but very broad coverage
- **GPU relevance:** ★★★★☆ — can extract company technology mentions from web articles and job postings at scale
- **Best for Corgi:** Building a comprehensive GPU company knowledge graph; enriching partial records

---

## 9. Enrichment Waterfall Architecture

### 9.1 What Is a Data Enrichment Waterfall?

A waterfall (or cascade) is an automated pipeline that queries multiple data sources **sequentially**, stopping as soon as a valid result is found. This maximizes data coverage while minimizing cost (you don't pay for redundant lookups).

**Example:** To find an email address:
1. Check your CRM (free — already have it)
2. Try Hunter.io (cheap — $0.05/search)
3. Try Apollo (moderate — $0.01/credit)
4. Try ZoomInfo (expensive — $0.30/credit)
5. Fall back to manual research if all fail

If step 2 succeeds, you never execute steps 3-5. Cost stays low; coverage stays high.

**Clay.com reports:** Their waterfall approach discovers emails for 80%+ of B2B prospects; "routinely triples customer data coverage and quality."

---

### 9.2 Full Waterfall Architecture for Corgi

#### Tier 0: Free / Already-Owned Sources (Cost: $0)
1. Internal CRM data (existing contacts)
2. SEC EDGAR full-text search (free API)
3. USASpending.gov (free)
4. LinkedIn public profiles (manual, or via Sales Navigator)
5. GitHub public repos
6. Epoch AI data center database (free)
7. ImportYeti basic tier (free)
8. EDGAR XBRL financial data (free)
9. UCC filings via state SOS portals (free)
10. Patent databases (USPTO/Google Patents, free)

#### Tier 1: Low-Cost Signals ($100-$500/mo)
1. Hunter.io — email discovery ($49-$199/mo)
2. Apollo free tier → Basic — contact data ($59/mo)
3. Crunchbase Pro — funding signals ($49/user/mo)
4. BuiltWith — tech stack ($295/mo)
5. Google Alerts — news monitoring (free)
6. Shodan — infrastructure intelligence ($69-$69/mo)

#### Tier 2: Core Enrichment ($500-$5K/mo)
1. Apollo Professional or Organization — bulk enrichment + API
2. Lusha API — phone + email
3. People Data Labs — bulk person/company data ($0.002-$0.01/record)
4. Diffbot — web entity extraction ($299-$899/mo)
5. Volza — import/export data (~$500-$2K/mo)
6. SecurityTrails — DNS intelligence ($50-$500/mo)

#### Tier 3: Premium Signals ($5K-$50K/yr)
1. ZoomInfo — enterprise contacts + technographics
2. Cognism Diamond — EU-compliant verified phones
3. PitchBook — private company financials + VC ecosystem
4. Harmonic.ai — early-stage AI company signals
5. Bombora — intent data

#### Tier 4: Elite Intelligence ($50K+/yr)
1. 6sense — full ABM platform with intent + predictive
2. DatacenterHawk — data center market intelligence
3. Bloomberg Terminal — debt/financial data

---

### 9.3 Clay.com as Waterfall Orchestrator

Clay (clay.com) is the best current tool for implementing waterfalls without building custom code.

**How it works:**
1. You build a "table" in Clay that represents your company/contact list
2. For each field (email, phone, revenue, etc.), you define an ordered list of "providers"
3. Clay queries providers sequentially, stopping at the first valid result
4. Credits consumed only per successful hit

**Clay integrates 150+ data providers** including: Apollo, ZoomInfo, Clearbit, Hunter, Lusha, PeopleDataLabs, Proxycurl (LinkedIn), Crunchbase, BuiltWith, Shodan, HunterIO, and many more.

**Pricing (2025):**
- Free: 100 credits/mo
- Starter: $134/mo (24,000 credits/yr)
- Explorer: $314/mo (120,000 credits/yr)
- Pro: $720/mo (600,000 credits/yr)
- Enterprise: ~$30,400/yr median (up to $154K per Vendr)

**Credit consumption:** 6-20 credits per fully enriched record; ~2-3 credits for basic email lookup

**For Corgi:** Clay is the recommended orchestration layer. Connect your API keys for Apollo, Hunter, PeopleDataLabs, and Crunchbase. Build custom waterfall sequences for:
1. "Find company GPU ownership evidence" — check job postings → Shodan → BuiltWith → Diffbot
2. "Find decision-maker contact" — check Apollo → Lusha → Hunter → PeopleDataLabs
3. "Estimate company size" — check Crunchbase → D&B → Harmonic → Diffbot

---

### 9.4 Deduplication & Conflict Resolution

**When multiple sources return different values:**
1. **Recency wins:** Prefer the most recently updated record (store `source_updated_at`)
2. **Confidence-weighted average:** Assign quality scores to sources; weighted average for numerical fields
3. **Primary source hierarchy:** Define authoritative sources per field type:
   - Email: Hunter > Apollo > ZoomInfo (Hunter verifies from SMTP)
   - Phone: Cognism Diamond > ZoomInfo > Lusha (Cognism is phone-verified)
   - Revenue: PitchBook > D&B > Crunchbase > estimated (descending confidence)
   - GPU ownership: SEC filing > MLPerf submission > Job postings > Import records

**Deduplication tools:**
- **Dedupely** — CRM deduplication
- **Custom Levenshtein distance** for company name matching
- **D-U-N-S numbers** — unique company identifier, use D&B for canonical IDs

---

### 9.5 Data Freshness & Decay Rates by Source

| Source | Freshness | Decay Rate | Notes |
|--------|-----------|------------|-------|
| SEC EDGAR | Real-time on filing | N/A — primary source | Always current for public companies |
| UCC Filings | Real-time | 5-year expiry | Filed at time of loan |
| LinkedIn | User-maintained | ~18-24 mo job changes | Stale profiles common |
| ZoomInfo | 30-day refresh cycle | ~20-30%/yr | AI-predicted updates |
| Apollo | Continuous | ~25%/yr | Community + crawled |
| Cognism Diamond | Real-time verification | ~15%/yr | Manually verified |
| Job Postings | 24-48 hour lag | N/A | Signals are current |
| Import Records | Weekly (US) | N/A | Customs data |
| Crunchbase | User + news | Funding rounds are timely | Company info lags |
| Harmonic | Real-time | Best freshness for AI cos | Designed for this |

**Rule of thumb:** Re-enrich records every 6 months for active pipeline; 90 days for hot leads.

---

### 9.6 Building Your Own Waterfall vs. Using Clay

**Build your own (Python/infrastructure):**
- **Pros:** Full control, no Clay markup, can optimize credit usage deeply
- **Cons:** Engineering time (~2-4 weeks for robust pipeline), maintenance burden, rate limit management
- **When to build:** When volume exceeds 500,000 enrichments/month or you need custom logic

**Use Clay:**
- **Pros:** 150+ integrations out of the box, no-code waterfall builder, automatic credit optimization
- **Cons:** Clay markup on API calls (you pay Clay's rate, not provider's directly — unless you bring your own API keys)
- **When to use:** Best for teams without dedicated data engineering; proven waterfall patterns

**Hybrid approach (recommended for Corgi):**
1. Use Clay for initial enrichment and workflow building (Explorer plan, ~$314/mo)
2. Bring your own API keys for Apollo and Hunter (saves ~40% vs. Clay's built-in rates)
3. Build custom Python scripts for specialized enrichment (SEC EDGAR, UCC filings, import data) that Clay doesn't natively support
4. Feed everything into a PostgreSQL database for deduplication and scoring

---

## 10. Legal & Ethical Considerations

### 10.1 GDPR (EU/EEA)

**Key rules for B2B data:**
- **Lawful basis:** You need one to process personal data. For B2B prospecting, "legitimate interests" (Article 6(1)(f)) is typically the basis, but requires a balancing test.
- **Individual rights:** EU contacts can request access, deletion, portability, and objection to processing
- **Data minimization:** Collect only what you need for the specific purpose
- **Retention limits:** Must delete data when no longer needed for the purpose it was collected

**Practical implications:**
- Email addresses tied to personal domain names (firstname.lastname@company.com) are personal data — GDPR applies
- Must provide privacy notice when first contacting EU individuals
- Must have a process for handling DSARs (Data Subject Access Requests)
- **Fines:** Up to €20M or 4% of global annual turnover

**Tools for compliance:**
- **DataGrail** — consent and privacy management platform
- **OneTrust** — enterprise consent management

**Cognism's approach:** They specifically screen for "Do Not Call" lists in multiple EU countries and offer this as a differentiator. For EU contact prospecting, Cognism's GDPR compliance features are worth the premium.

---

### 10.2 CAN-SPAM (U.S.)

For email outreach:
- Must include physical postal address
- Must include unsubscribe mechanism that works within 10 business days
- No misleading subject lines or headers
- **Does not apply to B2B role-based emails** in most interpretations (e.g., info@, sales@)

---

### 10.3 CCPA/CPRA (California)

- Applies to businesses with California consumers' personal information
- Right to know, delete, opt-out of "sale" of personal information
- "Sale" broadly defined — sharing data with third-party data brokers may qualify
- **For Corgi:** If you're using data broker lists with California contacts, ensure you have a CCPA-compliant data processing agreement with the broker

---

### 10.4 LinkedIn Terms of Service

LinkedIn's ToS explicitly prohibits:
- Scraping profiles without authorization
- Using automated tools to access LinkedIn
- Copying or downloading profile data

**Legal precedents:**
- *HiQ Labs v. LinkedIn* (9th Circuit) — ruled public LinkedIn data can be scraped under CFAA; but LinkedIn has TOS claims and can block/terminate accounts
- **Risk level:** Grey area. LinkedIn actively blocks IPs; accounts used for scraping face ban risk

**Legal alternatives to scraping:**
- LinkedIn Sales Navigator (licensed data)
- LinkedIn API (very limited for non-partners)
- Third-party providers with LinkedIn data licenses (e.g., Proxycurl claims legal access via their own ToS agreement with users)

---

### 10.5 Web Scraping Legality

**U.S.:**
- *hiQ v. LinkedIn* and *Van Buren v. U.S.* suggest scraping publicly available data does not violate CFAA if no authentication is bypassed
- ToS violations are civil contract matters, not criminal
- **Risk:** Being blocked/banned; civil claims for breach of contract

**EU:**
- Database directive protects databases with "substantial investment" — scraping proprietary B2B databases may violate this
- GDPR applies if personal data is involved

**Best practices:**
- Respect robots.txt (not legally required in U.S. but reduces legal risk)
- Don't bypass authentication (CAPTCHAs, paywalls)
- Rate limit your requests to avoid DDoS claims
- Use data providers (Apollo, ZoomInfo, etc.) who handle compliance on your behalf

---

### 10.6 Data Retention Policies

**Recommended policies for Corgi:**
- Active prospects: Retain indefinitely while in sales pipeline
- Stale leads (no engagement in 24 months): Archive or delete
- EU contacts: Must respect GDPR retention limits; implement deletion workflows
- UCC/public record data: No restrictions (public domain)

**Tools:**
- **Salesforce Data Lifecycle Management** — automated retention policies
- **HubSpot** — GDPR tools built-in

---

## 11. Recommended Stack for Corgi

### Phase 1: MVP Enrichment (Month 1-2, ~$1,500-$3,000/mo)

**Goal:** Build initial target company list of 500-1,000 GPU operators + lenders

1. **Discovery:**
   - SEC EDGAR full-text search (free) — find public companies disclosing GPU infrastructure
   - Crunchbase Pro ($49/user/mo) — find funded AI infrastructure companies
   - MLCommons submission database (free) — definitive GPU operator list
   - NVIDIA Partner Network (free) — certified GPU operators
   - USASpending.gov (free) — government GPU procurement

2. **Enrichment:**
   - Apollo.io Professional ($99/mo) — initial contact enrichment
   - Clay Explorer ($314/mo) — waterfall orchestration, bring Apollo API key

3. **Financial Intelligence:**
   - UCC state SOS portals (free) — start with Delaware, California, New York
   - EDGAR XBRL API (free) — revenue and capex data for public companies

4. **Monitoring:**
   - Google Alerts (free) — GPU company announcements
   - Epoch AI data center hub (free) — facility tracking

---

### Phase 2: Scale Enrichment (Month 3-6, ~$5,000-$15,000/mo)

1. **Add ZoomInfo** (~$15K-$25K/yr) — deepen contact database, technographic filters
2. **Add Harmonic.ai** (~$25K/yr) — early-stage AI company signals
3. **Add Bombora** (~$25K-$50K/yr) — intent data for in-market GPU companies
4. **Add Volza** (~$1K-$2K/mo) — import/export records for GPU hardware imports
5. **Add Cognism** (~$15K-$25K/yr) — if targeting Europe (reinsurers, EU GPU companies)
6. **Add Diffbot API** (~$299-$899/mo) — web-scale entity extraction

---

### Phase 3: Full Intelligence Platform (Month 6+, $50K+/yr)

1. **Add PitchBook** (~$25K/yr) — private company financials, investor mapping
2. **Add 6sense or Bombora Enterprise** — full ABM with predictive scoring
3. **Build custom Python enrichment pipeline:**
   - EDGAR full-text monitor (daily cron)
   - UCC bulk monitoring via CSC Global API
   - Patent database scraper
   - Government contract monitor
4. **Add DatacenterHawk** — if data center market intelligence becomes core
5. **Add satellite imagery service** (Planet Labs or Epoch AI) — for monitoring data center construction

---

### GPU Company Segmentation for Corgi

Use enrichment data to score companies by:

| Segment | Signal Sources | Priority |
|---------|---------------|----------|
| **Neo-clouds** (CoreWeave, Lambda, Together.ai, Crusoe) | VC funding + import records + SEC filings + MLPerf | ★★★★★ |
| **Enterprise AI** (Fortune 500 building internal GPU clusters) | Job postings + SEC capex disclosures + ZoomInfo technographics | ★★★★☆ |
| **Research institutions** (national labs, top universities) | MLPerf + NSF grants + academic publications | ★★★☆☆ |
| **Crypto-to-AI miners** (former BTC miners converting to GPU AI) | UCC filings + Volza import data + Glassdoor signals | ★★★★☆ |
| **GPU lenders / equipment financiers** | UCC filings as secured party + PitchBook deal data | ★★★★★ |
| **Reinsurers** (Lloyd's syndicates, Munich Re) | Lloyd's directory + insurance department databases + Dealroom | ★★★★★ |
| **System integrators** (Supermicro resellers, NVIDIA VARs) | NVIDIA partner directory + D&B | ★★★☆☆ |

---

### Key Differentiating Signals for Corgi

**Highest confidence GPU ownership signals (in order):**
1. MLPerf benchmark submission (ground truth)
2. SEC 10-K/S-1 hardware disclosure (e.g., "250,000 NVIDIA H100 GPUs")
3. Import records showing NVIDIA hardware (Volza/Panjiva)
4. UCC filing with GPU collateral
5. Job postings for "GPU cluster engineer" + "InfiniBand" (on-prem signal)
6. Press release announcing GPU cluster purchase
7. NVIDIA DGX-certified partner status
8. GitHub DCGM/CUDA infrastructure repos

**Highest confidence GPU-backed loan signals:**
1. UCC-1 filing by known GPU lender (Blackstone, DigitalBridge, Upper90)
2. SEC 8-K announcing credit facility for "computing equipment"
3. Press release announcing equipment financing deal
4. VC database showing "debt" round with equipment-specific terms

---

---

## 12. Supplementary Platform Reviews

### 12.1 People Data Labs (PDL)

- **What it provides:** 1.5B+ person records, 100M+ company records — raw data API designed for builders, not sales teams
- **Pricing (2025):**
  - Free: 100 person/company lookups/mo
  - Pro: $98/mo (350 person enrichment credits, 1,000 company lookups)
  - Enterprise: ~$2,500+/mo (custom credits)
  - Per-record cost: ~$0.004/person record at scale; $0.28/record at Pro tier
- **API quality:** ★★★★★ — purpose-built for programmatic use, bulk API available (100 records/call)
- **Data quality:** ★★★★☆ — broad coverage, not all fields verified
- **Best for Corgi:** Bulk company enrichment at low cost; feeding data warehouse with company firmographics

### 12.2 Coresignal

- **What it provides:** 3B+ records covering company data, employee data (LinkedIn-derived), job postings (448M+, from LinkedIn + Indeed + 3 other sources), multi-source enrichment
- **Pricing (2025):** From $49/mo (credit-based); enterprise custom
- **Unique capability:** Multi-source job data combines LinkedIn, Indeed, and other boards — richer than any single source
- **API quality:** ★★★★☆
- **Best for Corgi:** Job posting analysis to identify GPU infrastructure hiring signals at scale; more comprehensive than using job boards directly

### 12.3 Theirstack

- **What it provides:** 180M+ jobs, technology detection for 33K+ technologies from job postings; find companies using specific tech by analyzing what they're hiring for
- **Pricing:** Free tier (50 company credits, 200 API credits/mo); paid plans contact sales
- **Unique capability:** Technology intelligence from job postings — can search "companies hiring for NVIDIA DCGM" directly
- **Best for Corgi:** ★★★★★ — build a list of every company actively hiring GPU infrastructure engineers. This is a direct signal of GPU hardware ownership.
- **Creative search examples:**
  - Companies hiring for "InfiniBand" (on-prem GPU cluster networking)
  - Companies hiring for "DCGM" (NVIDIA data center management)
  - Companies hiring for "Slurm" (HPC scheduler for GPU clusters)
  - Companies hiring for "GPU procurement" or "GPU operations"

### 12.4 Clay.com (Updated Pricing)

- **Pricing (2025 — confirmed):**
  - Free: 100 credits/mo
  - Starter: $149/mo ($134/mo annual) — 2,000 credits/mo
  - Explorer: $349/mo ($314/mo annual) — 10,000 credits/mo
  - Pro: $800/mo ($720/mo annual) — 50,000 credits/mo
  - Enterprise: Custom (median $30,400/yr per Vendr, up to $154K)
- **Credit cost:** ~6-20 credits per fully enriched record (company + person + email + phone)
- **Key feature:** Email waterfall validated by ZeroBounce by default
- **150+ integrated data providers** available in waterfall
- **Recommendation:** Start on Explorer ($314/mo annual) with BYOK (bring your own API keys) for Apollo and Hunter to maximize credit efficiency

---

## 13. GPU Company Target Universe Reference

### Known Major GPU Operators (Public Companies)
These are confirmed large GPU holders — useful as enrichment examples and competitive intelligence:

| Company | GPU Scale | Primary Loan/Finance Partner |
|---------|-----------|------------------------------|
| CoreWeave | 250,000+ NVIDIA chips | Blackstone, DigitalBridge, Magnetar ($8B+ debt) |
| Lambda Labs | ~30,000 GPUs | Pacific Western Bank, private |
| Crusoe Energy | ~20,000 H100s | Upper90 ($200M GPU-backed loan) |
| Together.ai | Cloud-only provider | VC-backed |
| Vast.ai | Marketplace operator | N/A |
| RunPod | Marketplace | N/A |
| Voltage Park | ~24,000 H100s | DigitalBridge |

### Known GPU-Backed Lenders (Potential Partners/Reinsurance Buyers)
These companies provide the debt facilities that Corgi might help insure:

- **Blackstone Credit** — $7.5B+ GPU facilities
- **DigitalBridge Credit** — Specialty digital infrastructure lender
- **Magnetar Capital** — GPU structured credit
- **PIMCO** — Private credit, GPU deals
- **Carlyle Group** — Credit arm, AI infrastructure deals
- **Upper90** — $200M+ GPU-backed loans
- **Pacific Western Bank / Western Alliance** — Tech equipment financing
- **Western Technology Investment (WTI)** — Venture lending, GPU exposure
- **Hercules Capital** — BDC, tech equipment loans
- **Trinity Capital** — BDC, equipment financing focus

### Known Reinsurance Targets
Companies that might buy reinsurance FROM Corgi for GPU portfolios:

- **Lloyd's of London syndicates** — Multiple syndicates active in tech/cyber
- **Munich Re** — Active in parametric and tech risk
- **Swiss Re** — Tech liability and infrastructure
- **Hannover Re** — Specialty lines
- **Markel** — Specialty insurance and reinsurance
- **Brit Insurance (CGIBG)** — Lloyd's market, tech-focused
- **Beazley** — Cyber and tech specialty

---

*Document compiled: March 2026*
*Research methodology: Web search + primary source verification*
*Sources: Apollo.io, Clay.com, ZoomInfo, Cognism, Bombora, 6sense, Diffbot, PitchBook documentation; SEC.gov; NASS.org; import/export service providers; Epoch AI; academic and industry publications*
