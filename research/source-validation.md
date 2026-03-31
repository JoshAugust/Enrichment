# GPU Prospect Source Validation Report
**Date:** 2026-03-23  
**Author:** Brock (subagent: source-validation)  
**Purpose:** Real, hands-on validation of 8 free enrichment data sources. No theory — actual test results.

---

## Summary Table

| Source | Accessible? | Data Quality | Prospect Value | Effort to Scrape |
|--------|-------------|--------------|----------------|-----------------|
| 1. Epoch AI Data Centers | ✅ CSV available | High — structured | Medium (infra ops, not GPU fleet owners) | Low |
| 2. SEC EDGAR Full-Text | ✅ API working | Very High — actual financials | Very High (publicly traded GPU operators) | Low-Medium |
| 3. Grid Interconnection Queues | ✅ Multiple portals | High — power scale | High (large load = data centers) | Medium |
| 4. NVIDIA Partner Directories | ✅ Public page | Medium — named partners only | Medium-High (colocation providers) | Low |
| 5. GitHub GPU Signal Mining | ✅ API working | Low-Medium | Low (mostly BigTech, already known) | Low |
| 6. Job Posting GPU Signals | ⚠️ Fragmented | Medium | Medium (active operators hiring) | Medium |
| 7. Conference Intel | ✅ Searchable | Medium | Medium (broad, not GPU-owner specific) | Low |
| 8. Reddit/HN Community Intel | ✅ Algolia API | Low-Medium | Low (mostly editorial, some gems) | Low |

---

## Source 1: Epoch AI Data Center Database

### What We Tried
- `https://epoch.ai/data/datacenter-investments` → 404
- `https://epoch.ai/data/frontier-data-centers` → 404
- `https://epoch.ai/data/data-centers` → **redirected successfully**
- Direct CSV: `https://epoch.ai/data/data_centers/data_center_timelines.csv` → **✅ 200 OK, data returned**
- Also tried: `https://epoch.ai/data/data_centers/data_centers.csv` → **✅ 200 OK, data returned**

### What We Got

**data_center_timelines.csv** — Fields confirmed in actual CSV:
- `System`, `Organization`, `Country`, `Continent`, `Year`, `Power (MW)`, `Compute (FLOP)`, `Hardware`, `Notes`, `Source`

**Sample entries (from raw data):**
- Frontier (Oak Ridge National Lab) — 20 MW, 1.69e18 FLOP
- Summit (Oak Ridge) — 10 MW
- Various national labs, hyperscalers (Meta, Google, Microsoft, Amazon)
- CoreWeave clusters
- xAI Memphis cluster (~100k H100s)

**data_centers.csv** — Appears to be a companion dataset, similar schema, focusing on broader planned/built AI data centers including announcements (e.g., Stargate project, UAE clusters, EU sovereign AI sites).

### Corgi Relevance Assessment
- **Useful as:** Background intelligence on which organizations have proven scale AI compute. Not a prospect list per se.
- **Who's in it:** Mostly hyperscalers (already known), national labs (not commercial), a few cloud GPU providers (CoreWeave, Lambda, etc.)
- **What's missing:** The thousands of enterprise GPU operators, mid-market AI companies, GPU cloud startups
- **Verdict:** Good for cross-referencing known large players. Not a primary prospect list generator. **Scrape worth it: YES** — automatable, free, no auth needed.

---

## Source 2: SEC EDGAR Full-Text Search

### What We Tried
Base URL: `https://efts.sec.gov/LATEST/search-index?q=<query>&dateRange=custom&startdt=2024-01-01&enddt=2026-03-23`

Queries tested:
1. `"GPU"` — ✅ API returned results
2. `"NVIDIA H100"` — ✅ 
3. `"GPU cluster"` — ✅ **120 total hits**
4. `"GPU infrastructure"` — ✅ **177 total hits**
5. `"residual value" + "GPU"` — ✅ **281 total hits**

### What We Got

**Query: "GPU cluster" (120 hits, Jan 2024–Mar 2026)**

Top filers (by relevance score):
| Company | Ticker | Form | Date | Notes |
|---------|--------|------|------|-------|
| Nebius Group N.V. | NBIS | 6-K | 2024-11-19 | Amsterdam-based GPU cloud |
| Nebius Group N.V. | NBIS | 6-K | 2024-09-25 | Repeat filer, high relevance |
| Digi Power X Inc. | DGXX | 6-K / 8-K | 2025-12-03, 2026-01-06 | Canadian GPU infra company |
| HIVE Digital Technologies | HIVE | 6-K | 2025-06-25 | Crypto → GPU compute pivot |
| Roth CH Acquisition Co. | USCTF/USTWF | 8-K | 2025-01-29 | SPAC targeting GPU sector |
| Soluna Holdings | SLNH | 8-K | 2025-01-16 | Renewable energy + compute |

**Query: "GPU infrastructure" (177 hits)**

Top filers:
| Company | Ticker | Form | Date |
|---------|--------|------|------|
| Data Storage Corp | DTST | SC TO-I / 8-K | 2025-12-08 |
| Jet.AI Inc. | JTAI | 8-K | 2025-07-02 |
| Data Storage Corp | DTST | 8-K/A | 2026-01-16 |

**Query: "residual value" + "GPU" (281 hits) — HIGHEST VALUE FOR CORGI**

Top filers:
| Company | Ticker | Form | Date |
|---------|--------|------|------|
| Kinetic Seas Inc. | ECGR | 8-K/A, 10-K | 2024-03-06, 2024-04-10 |
| WhiteFiber, Inc. | WYFI | 10-Q | 2025-09-17 |
| IREN Ltd | IREN | 10-Q | 2026-02-05 |

**Corgi-Specific Signal:**
- The "residual value" + "GPU" query is the BEST query for Corgi's use case — these are companies that are literally discussing GPU asset depreciation and residual values in their financial filings. That is exactly the financial context where GPU financing/refinancing becomes relevant.
- `WhiteFiber, Inc. (WYFI)` — new name, NYC, finance sector (SIC 6199) discussing GPU residual value in a 10-Q. Prime prospect.
- `IREN Ltd` — GPU compute operator, discussing residual values in 10-Q.

### How to Use This Source
- API endpoint: `https://efts.sec.gov/LATEST/search-index?q=<QUERY>&dateRange=custom&startdt=YYYY-MM-DD&enddt=YYYY-MM-DD`
- Returns JSON with `hits.total.value` (hit count) and array of filings with `display_names`, `form`, `file_date`, `adsh`
- To read the actual filing text: `https://www.sec.gov/Archives/edgar/data/<CIK>/<adsh-formatted-path>`
- **No auth required. Completely free. Pagination available.**

### Recommended Queries for Corgi
1. `"residual value" "GPU"` — 281 hits, directly relevant
2. `"GPU cluster"` — 120 hits, GPU operators
3. `"GPU infrastructure"` — 177 hits
4. `"H100" "lease"` — likely to surface equipment financing
5. `"NVIDIA" "depreciation" "accelerator"` — asset-heavy GPU owners
6. `"AI compute" "equipment"` — broader net

**Verdict: 🔥 HIGHEST PRIORITY SOURCE. Real financial data, named public companies, specific GPU asset context. Build a scraper for this.**

---

## Source 3: Grid Interconnection Queues

### What We Tried
- `https://www2.pjm.com/planning/services-requests/interconnection-queues.aspx` → **403 Blocked**
- PJM main: requires account registration for download
- ERCOT: portal at `https://www.ercot.com/services/rq/integration` — publicly accessible PDFs
- MISO: `https://www.misoenergy.org/planning/resource-utilization/GI_Queue/` — interactive dashboard
- CAISO: `https://www.caiso.com/library/interconnection-queue-reports` — public reports
- Third-party aggregator: `https://www.interconnection.fyi/` — **daily-updated, no auth, filterable**

### What We Got

**ERCOT (Texas) — Best Signal:**
- **238.6 GW** of large load interconnection requests in queue
- **>70% are from data centers** (confirmed by ERCOT official reports)
- Large load requests jumped **270% in 2025** driven by data centers
- Download: PDFs publicly available; structured data via `interconnection.fyi`

**MISO (Midwest):**
- 309 GW total queue
- Data format: interactive dashboard with map + downloadable project status tool
- Can filter by fuel type (load/generation), state, project status

**CAISO (California):**
- 427 active projects, 126.09 GW total
- Queue reports downloadable as PDFs from library

**PJM:**
- Blocked direct download (requires account)
- Workaround: `interconnection.fyi` aggregates PJM daily — **1,658 projects, 174.18 GW**

**Best Third-Party Source:**
`https://www.interconnection.fyi/` — free, daily updated, filterable by:
- Market (PJM, ERCOT, MISO, CAISO, etc.)
- Status (Active/Withdrawn/etc.)
- Type (Load vs. Generation)
- Capacity (MW)
- State/County

**Lawrence Berkeley Lab (LBNL):**
`https://emp.lbl.gov/queues` — Annual Excel data file with full interconnection data through end-of-year. Free. No auth.

### How to Filter for Data Centers
- Filter: **Type = Load** (not generation — these are consumers, not generators)
- Filter: **Capacity ≥ 50 MW** (data center scale)
- ERCOT reports specific fields: Applicant Name, Load (MW), County, Requested In-Service Date
- **However:** Applicant names are often shell companies or SPVs, not the ultimate data center operator. Requires cross-referencing.

### Corgi Relevance
- **Primary value:** Geographic intelligence — where are the next big GPU data centers being built?
- **Secondary value:** Company intelligence — some filings include applicant names (data center developers)
- **Limitation:** Names often obfuscated behind LLCs; timing is far out (2027-2030 operational dates)
- **Verdict: MEDIUM PRIORITY. Good for deal pipeline timing. Not a direct prospect list. Scrape interconnection.fyi for load requests ≥50MW.**

---

## Source 4: NVIDIA and AMD Partner Directories

### What We Tried
- `https://www.nvidia.com/en-us/data-center/colocation-partners/` → **✅ 200 OK, full page returned**
- NVIDIA Inception program member list → No public directory exists
- AMD Instinct partner ecosystem → No public structured list found

### NVIDIA DGX-Ready Colocation Partners (Full List Extracted)

**Americas:**
| Company | Location | Liquid-Cooled? |
|---------|----------|----------------|
| Aligned Data Centers | IL, MD, UT, TX, VA, OH, OR, AZ; Canada; LATAM | Yes |
| AUBix LLC | Alabama | Unknown |
| Colovore | Santa Clara, CA | ✅ Yes |
| CoreSite (American Tower) | LA, Silicon Valley, Chicago, Virginia | Unknown |
| CyrusOne | US East/South/West, Europe, Asia | Unknown |
| DataBank | Atlanta, Denver, Dallas, NYC, Minneapolis | ✅ Yes |
| Switch | (Nevada-based) | Unknown |
| Flexential | Multiple US locations | Yes |

**Europe:**
| Company | Notes |
|---------|-------|
| Digital Realty | 310 DCs, 25 countries |
| Equinix | 71 markets, 6 continents |
| Borealis Data Center | — |
| EcoDataCenter | — |
| Global Switch | Amsterdam & Paris |
| MegaDC | — |
| Verne Global | Iceland (100% renewable) |

**Africa:**
| Company | Notes |
|---------|-------|
| Khazna | UAE |

**Asia:**
| Company | Notes |
|---------|-------|
| AirTrunk | — |
| BDX | — |
| CDC | — |
| Digital Realty Asia | — |
| NextDC | Australia |
| Princeton Digital | — |
| Sify | India |
| ST Telemedia | Singapore |
| Fujitsu | Japan (JDCC Tier 4) |

**Other Partners (from search results, not on direct page):**
- Global Switch (Amsterdam, Paris)
- ST Telemedia Global Data Centres (STT GDC)
- Verne Global

### NVIDIA Inception Program
- **No public member directory.** Program has 8,500+ members in 90 countries.
- Member showcase at `https://www.nvidia.com/en-us/startups/showcase/` — browsable by industry, but no exportable list.
- CB Insights tracks some as portfolio companies.
- **Verdict: Dead end for bulk prospecting.**

### AMD Instinct Partner Ecosystem
- No equivalent public partner directory found.
- AMD Instinct customers known from press releases only (hyperscalers, national labs, a few cloud providers).

### Corgi Relevance
- DGX-Ready partner list: ~25-30 named companies. These are **colocation providers**, not end users. They're potential channel partners for Corgi, not GPU leaseback targets.
- **Verdict: LOW-MEDIUM PRIORITY for direct prospects. Useful for channel partnership mapping.**

---

## Source 5: GitHub GPU Signal Mining

### What We Tried
- `https://api.github.com/search/repositories?q=cuda+cluster+management&sort=stars` → Very few results, generic
- `https://api.github.com/search/repositories?q=gpu+scheduling+kubernetes&sort=stars&per_page=10` → ✅ **42 results**
- `https://api.github.com/search/repositories?q=nvidia+dcgm+org:&sort=stars` → 422 error (invalid query format)

### What We Got

**GPU Scheduling + Kubernetes repos (top results by stars):**
| Repo | Owner (Org) | Stars | Notes |
|------|------------|-------|-------|
| microsoft/pai | **Microsoft** | 2,682 | "Resource scheduling and cluster management for AI" — archived |
| AliyunContainerService/gpushare-scheduler-extender | **Alibaba Cloud** | — | GPU sharing for K8s |

Other repos in results: mostly academic/community projects (University repos, individual contributors)

**Key Observation:** GitHub GPU infrastructure repos are dominated by:
- Big Tech (Microsoft, Alibaba, Google, Meta) — already known, not Corgi targets
- Open-source framework maintainers (SkyPilot, RunAI, etc.)
- Academic institutions

**GitHub as Signal Source — What Actually Works:**
The HN result that surfaced organically was more useful:
- `blog.skypilot.co` — SkyPilot is a GPU orchestration tool used by many mid-market AI companies. **Their users are Corgi targets.**
- `together.ai` published "practitioner's guide to running GPU clusters" — **Together AI is a confirmed GPU operator.**

### Corgi Relevance
- GitHub company discovery is weak — too much noise, mostly Big Tech and academia.
- **Better approach:** Look at users/stargazers of GPU management repos (DCGM, RunAI, Determined AI, etc.) — these are engineers at companies running GPU clusters.
- **Verdict: LOW PRIORITY as a direct source. Medium value for indirect signal (who uses which GPU tools).**

---

## Source 6: Job Posting GPU Signals

### What We Tried
- LinkedIn job search via web_search (no API access) → fragmented results
- ZipRecruiter, Indeed, SimplyHired via web_search → generic results

### What We Got

**Companies Currently Hiring GPU Infrastructure Roles:**

| Company | Role | Notes |
|---------|------|-------|
| **OpenAI** | Software Engineer, GPU Infrastructure - HPC | "Reliability and uptime of OpenAI's compute fleet" |
| **NVIDIA** | Senior AI-HPC Cluster Engineer (multiple) | EDA clusters, general GPU HPC |
| **NVIDIA** | Compute Cluster SRE Engineer, GPU-HPC | Production GPU systems |
| **AMD** | GPU Cluster Performance Engineer | Austin TX |
| **Aethir** | Infrastructure Operations Engineer, GPU Computing | Decentralized GPU cloud |

**LinkedIn search context:**
- 880 GPU Programming jobs in SF Bay Area alone
- 694 NVIDIA Architect jobs in US
- "Solutions Architect, AI & ML Infrastructure" roles active at multiple companies

**Key Insight:** Job postings are a real-time signal of which companies are OPERATING (not just planning) GPU infrastructure. The limitation is that without LinkedIn API access, we can't efficiently scrape company names at scale.

**Workaround Approach:**
- Use LinkedIn Boolean search: `"GPU cluster" OR "H100" OR "GPU infrastructure" title:"infrastructure engineer" OR "ML platform engineer"` 
- Indeed.com search: `q=gpu+infrastructure+engineer` returns ~500+ results with company names
- Glassdoor: similar

### Corgi Relevance
- **High signal quality** — a company posting for GPU Infrastructure SRE is definitely running GPUs at scale
- **Cross-reference opportunity:** Against existing 327-company database to find uncovered prospects
- **Limitation:** Manual process without API; LinkedIn API prohibitively expensive; Indeed API exists (limited)
- **Verdict: MEDIUM PRIORITY. Best used as enrichment/signal confirmation, not bulk discovery. Manual review weekly for new companies.**

---

## Source 7: Conference Speaker/Attendee Intelligence

### What We Tried & Got

**NVIDIA GTC 2025 (March 2025, San Jose):**
- 1,000+ sessions, 2,000 speakers, 400+ exhibitors, 900+ participating organizations
- Full speaker list is behind registration wall on the GTC website
- What's publicly known:

**Companies with confirmed GTC 2025 presence (GPU/AI infrastructure focus):**
- CoreWeave, Dell Technologies, AWS, Microsoft, Google Cloud, Oracle Cloud
- Meta, OpenAI, Arm, TSMC, Foxconn, Samsung, SoftBank
- Capital One, Accenture, SAP (enterprise AI adopters)
- T-Mobile, Nokia (telco AI)
- Rockwell Automation, Siemens (industrial)

**SC25 (Supercomputing 2025, November 2025, St. Louis):**
- 16,500 attendees, **524 exhibitors** (record)
- Major exhibitors confirmed: Intel, NVIDIA, AMD, HPE, IBM, Dell Technologies, AWS, Azure, Google Cloud, Oracle
- **CoreWeave, Nebius** — GPU cloud providers at SC25
- **DDN, Vast Data, Hammerspace, Weka, Peak:AIO** — storage for GPU clusters (their customers are Corgi prospects)
- Broadcom, XSight Labs, Nokia (networking)
- Full exhibitor list at `https://sc25.supercomputing.org/exhibits/exhibitor-list-floorplan/` — **publicly accessible**

**OCP Summit 2025 (October 2025, San Jose):**
- 10,835 attendees
- NVIDIA, AMD, Meta, Google, Arm confirmed
- TE Connectivity, Delta Electronics, Vertiv, Astera Labs, Credo, AMI
- **OCP EMEA Summit participating companies PDF** — partially readable, lists: 2CRSI, 3M, 42datacenter, and many others
- Full list at `https://www.opencompute.org/events/past-events/2025-ocp-global-summit`

**MLSys 2025 (May 2025, Santa Clara):**
- 22% acceptance rate, 61 papers
- Companies with accepted papers:
  - **Meta, Microsoft, Amazon/AWS, Google, NVIDIA** (all known)
  - **Together AI** (GPU cloud — strong Corgi prospect)
  - **Databricks, PyTorch Foundation, Qualcomm** (sponsors)
- Paper titles revealing GPU operations context:
  - "PipeFill: Using GPUs During Bubbles in Pipeline-parallel LLM Training" (CMU + AWS)
  - "NEO: Saving GPU Memory Crisis with CPU Offloading" 
  - "Scaling Deep Learning Training with MPMD Pipeline Parallelism" (NVIDIA)

### Corgi Relevance
- Conference intel gives **broad industry mapping** but skews toward large known players
- Most useful: SC25 exhibitor list (524 companies in HPC/GPU space) — this list is **worth scraping**
- MLSys sponsors/speakers are smaller and more interesting than GTC
- **Verdict: MEDIUM PRIORITY. SC25 exhibitor list is the most actionable. Together AI surfaced as new prospect.**

---

## Source 8: Reddit / Hacker News Community Intelligence

### What We Tried
- HN Algolia API: `https://hn.algolia.com/api/v1/search?query=GPU+cluster&tags=story&hitsPerPage=20` → ✅ **Working, free, no auth**
- HN Algolia API: `https://hn.algolia.com/api/v1/search?query=H100+data+center&tags=story&hitsPerPage=15` → ✅ **Working**

### What We Got

**HN "GPU cluster" results — Company signals extracted:**

| Company Mentioned | Context | Source |
|-------------------|---------|--------|
| **SkyPilot** (skypilot.co) | GPU cluster orchestration tool — very active HN community | Top story, 235 pts, 93 comments, Mar 2026 |
| **Together AI** | Published practitioner guide to running large GPU clusters | 116 pts — "a practitioner's guide to testing and running GPU clusters" |
| **Voltage Park** | "We own and manage the infrastructure, currently have 7,000+ H100s live, launching additional 17,000 H100s" | HN "Show HN" post |
| **xAI (Elon Musk)** | Memphis Supercluster, 100,000 H100s | Jul 2024, 21 pts |
| **Amazon EC2** | Historical GPU cluster context | 2010, still relevant as AWS signal |
| **Luma AI** | Named as Voltage Park customer | Inside VP's Show HN description |
| **Mirelo.ai** | Named as Voltage Park customer | Inside VP's Show HN description |
| **273 Ventures** | Named as Voltage Park customer | Inside VP's Show HN description |

**HN "H100 data center" results:**
- xAI Memphis (100k H100s) — confirmed operational
- Voltage Park (7,000+ H100s live at time of posting, scaling to 24,000+) — direct fleet size disclosed
- NVIDIA H100 product page HN submission — no company intel

**Key HN Insight:**
Show HN posts from GPU cloud companies often **disclose exact fleet sizes** and **name their customers**. This is extremely high-value intelligence — public companies don't do this in SEC filings.

### Reddit Assessment
- Unable to directly API-query Reddit (rate limits, auth wall)
- Web search for Reddit r/LocalLLaMA, r/MachineLearning mentions:
  - RunPod, Vast.ai, Lambda Labs, CoreWeave commonly discussed GPU cloud providers
  - r/LocalLLaMA users discuss their own GPU setups but rarely company-scale infrastructure

### Corgi Relevance
- **HN is genuinely useful** for:
  1. Finding GPU cloud companies that self-disclose fleet sizes
  2. Named customer lists (inside Show HN posts)
  3. Real-time signals on new GPU operators
- **Reddit** is lower signal — consumer-focused, not enterprise GPU operators
- **HN Algolia API is completely free, no auth, returns structured JSON** — highly scrapeable
- **Verdict: LOW-MEDIUM PRIORITY. HN is worth a weekly scrape for "Show HN" + GPU/H100/GPU cluster. Specific high-value companies found: Voltage Park (fleet size disclosed), Together AI, SkyPilot users.**

---

## Overall Recommendations for Corgi

### Build These Scrapers (Priority Order)

**🔥 Tier 1 — Build Immediately**

1. **SEC EDGAR Full-Text Search**
   - Endpoint: `https://efts.sec.gov/LATEST/search-index?q=<query>`
   - Queries: "residual value" GPU, "GPU cluster", "GPU infrastructure", "H100 lease", "AI compute equipment"
   - Output: Company names, tickers, CIK numbers, filing dates, form types
   - Cost: Free, no auth
   - Expected yield: 500-1000 unique companies across all queries

2. **Interconnection.fyi (Grid Queues)**
   - URL: `https://www.interconnection.fyi/` — filter for Load requests ≥50MW
   - Output: Project names, applicant names, MW capacity, state, ISOs
   - ERCOT is especially rich: 70%+ of large load queue is data centers
   - Cost: Free, daily updated

**🟡 Tier 2 — Build When Ready**

3. **SC25 Exhibitor List**
   - URL: `https://sc25.supercomputing.org/exhibits/exhibitor-list-floorplan/`
   - 524 companies — structured, scrapeable
   - Output: Company names, booth assignments, sector tags
   - Note: SC26 will be the next opportunity (November 2026)

4. **HN Algolia API — "Show HN" GPU Monitor**
   - Endpoint: `https://hn.algolia.com/api/v1/search?query=GPU+H100+cluster&tags=story`
   - Weekly cron: monitor for new Show HN posts from GPU companies
   - Look for: fleet size disclosures, named customers, fundraise announcements

**🔵 Tier 3 — Manual / Low Automation Value**

5. **NVIDIA DGX-Ready Partner Page**
   - Static list of ~30 colocation companies
   - Scrape once, update quarterly
   - Value: Channel mapping, not direct prospects

6. **Job Posting Signals**
   - Use web_search or Indeed search to flag new companies posting GPU infrastructure roles
   - No clean API; manual review recommended
   - Best as enrichment/confirmation tool

7. **GitHub GPU Repos**
   - Low ROI — dominated by Big Tech already in database
   - Better approach: look at who forks/stars RunAI, Determined AI, DCGM repos

8. **Epoch AI Data Centers**
   - CSV is free and clean: `https://epoch.ai/data/data_centers/data_center_timelines.csv`
   - Already-known companies dominate
   - Useful for size/scale validation, not discovery

---

## New Companies Found (Not Likely in Existing 327-Company DB)

| Company | Signal Source | GPU Signal | Corgi Relevance |
|---------|--------------|------------|-----------------|
| **Nebius Group N.V. (NBIS)** | SEC EDGAR | 6-K filings mentioning GPU cluster, publicly traded | HIGH — GPU cloud company |
| **Digi Power X Inc. (DGXX)** | SEC EDGAR | Multiple 6-K/8-K filings on GPU clusters | MEDIUM — Canadian GPU infra |
| **WhiteFiber, Inc. (WYFI)** | SEC EDGAR | 10-Q discussing GPU residual value | HIGH — directly in Corgi's domain |
| **IREN Ltd (IREN)** | SEC EDGAR | 10-Q: GPU residual value | HIGH — GPU compute operator |
| **HIVE Digital Technologies** | SEC EDGAR | GPU cluster filings | MEDIUM — crypto→compute pivot |
| **Soluna Holdings (SLNH)** | SEC EDGAR | Renewable energy + GPU compute | MEDIUM |
| **Voltage Park** | HN | Self-disclosed: 7,000+ H100s, scaling to 24,000+ | VERY HIGH |
| **AUBix LLC** | NVIDIA DGX page | DGX-Ready partner, Alabama | MEDIUM |
| **Colovore** | NVIDIA DGX page | "Close to 1,000 DGX-1s and DGX-2s already running" | HIGH |
| **Together AI** | MLSys 2025 sponsor + HN | GPU cluster operator, research-grade infra | HIGH |
| **Data Storage Corp (DTST)** | SEC EDGAR | Tender offer docs mentioning GPU infrastructure | MEDIUM |
| **Jet.AI Inc. (JTAI)** | SEC EDGAR | 8-K mentioning GPU infrastructure | MEDIUM |
| **Kinetic Seas Inc. (ECGR)** | SEC EDGAR | 10-K discussing GPU residual value specifically | HIGH |

---

## Notes on Data Quality & Limitations

- **SEC EDGAR** returns filing metadata, not the full text. To extract quotes/context, need to follow the `adsh` reference to fetch the actual document.
- **Interconnection queues** often list shell LLCs as applicants — requires additional lookup to identify the real operator.
- **NVIDIA Inception program** has 8,500+ members but no public directory. CB Insights tracks ~518 of them.
- **OCP Summit** full exhibitor list accessible but in PDF format for EMEA; HTML/web for global summit.
- **GitHub** company discovery only works if you cross-reference org names against company databases (Clearbit, etc.).
- **PJM interconnection data** requires account for direct download — use interconnection.fyi as workaround.
