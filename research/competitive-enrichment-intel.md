# Competitive Enrichment Intelligence: How Everyone Else Solves Corgi's Problem

**Compiled:** 2026-03-23  
**Purpose:** Steal every good idea from competitors in insurance, equipment finance, and B2B sales for Corgi's data enrichment and prospect identification engine.

---

## Executive Summary

Corgi needs to identify companies that own GPUs and might need Residual Value Guarantee (RVG) insurance. This is a new category, but the *underlying problem* — finding companies that own specific equipment, enriching their profiles, and enabling deal flow — is solved every day by:

1. **Equipment finance lenders** (who find companies that need capital for equipment)
2. **Specialty insurance underwriters** (who find equipment operators before competitors do)
3. **VC/PE firms** (who build proprietary signal-based deal engines)
4. **B2B sales teams** (who waterfall-enrich prospects across 130+ data sources)

The single most actionable insight: **UCC filings are a public goldmine.** When CoreWeave borrowed $2.3B against NVIDIA H100s, a UCC-1 was filed. When Lambda Labs pledged 500M in chips as collateral, a UCC-1 was filed. These are searchable, public, and queryable by collateral description — including the words "GPU," "NVIDIA," "H100."

---

## 1. Equipment Insurance Companies — How They Find Prospects

### How Specialty Insurers Actually Work

The dirty secret: **Swiss Re, Munich Re, and most reinsurers don't prospect directly.** They operate through a broker/intermediary chain. In the UK, 82% of commercial insurance business goes through brokers. In the US, it's similar.

**The data flow:**
- Brokers submit risks → underwriters evaluate → carriers bind coverage
- Reinsurers go one level up: they work through primary insurers or MGAs (Managing General Agents)

**What this means for Corgi:** Corgi is more like an *MGA* or *delegated authority* trying to write a new class of risk (GPU RVG). The closest analog is Munich Re's Digital Partners program — they back insurtechs that act as MGAs and distribute digitally.

### AGRO (Assured Guaranty Re Overseas) — Aircraft RVI

AGRO writes aircraft Residual Value Insurance — the closest analog to GPU RVG in existence. Aircraft RVI pays out when an aircraft's market value at lease expiry falls below a guaranteed floor.

**How they find prospects:**
- Aviation is small enough that the universe is knowable. Major aircraft lessors: AerCap, Air Lease Corporation, Avolon, SMBC Aviation Capital, Atlas Air (~20 companies own 60%+ of leased aircraft)
- FAA Aircraft Registry is public: searchable at registry.faa.gov, exportable as full database download
- Aviation Week's Fleet Database and Cirium (IHS Markit) track every aircraft, operator, lessor, age, maintenance history
- ICAO and airline filings reveal fleet composition and lease expiry schedules

**Corgi's Analog:** An equivalent GPU registry doesn't exist — but UCC filings, import records, and financing announcements create a synthetic version of it. The addressable universe of GPU-backed borrowers is actually *smaller* than aircraft lessors right now (~50-100 meaningful entities).

### Hartford Steam Boiler (HSB) — Equipment Breakdown Insurance

HSB insures industrial equipment (boilers, machinery, electronics). They've had to solve the "find equipment owners" problem for 150+ years.

**HSB's approach:**
- Commercial property insurance (which includes HSB riders) flows through the same broker channel
- HSB uses **equipment inspection programs** as a distribution mechanism — companies that want inspection services also happen to be prospects for breakdown insurance
- Industrial equipment databases: Dun & Bradstreet SIC/NAICS codes, equipment manufacturer dealer networks
- **Key insight:** HSB became part of Munich Re in 2009. Their underwriting uses IoT sensor data and equipment telemetry — data from the equipment itself becomes the enrichment layer

**Corgi's Analog:** NVIDIA's NIM (NVIDIA Inference Microservices) telemetry, GPU cluster management systems (RunAI, DCGM), and data center DCIM tools all generate equipment telemetry. If Corgi can get access to asset-level GPU data from lessors, that's the HSB playbook.

### Zurich / AIG / Tokio Marine — Technology/Equipment Lines

All three use similar approaches:
- **Submission data:** When any company requests a quote, that's a prospect. Insurance companies mine their own submission databases for patterns
- **Technographic targeting:** AIG's tech practice uses SIC/NAICS codes + company size + revenue to identify technology equipment owners
- **Broker relationships:** AIG, Zurich, and Tokio Marine all maintain dedicated wholesale broker relationships (e.g., with Amwins, Burns & Wilcox, Ryan Specialty) who funnel them specialty risks
- **Third-party data:** D&B Hoovers, Equifax, and ZoomInfo for commercial risk data

**Key insight from Aon:** "Most reinsurers capture data from submissions and third-party sources. Those with more advanced data and analytics capabilities outperform the market by making better risk selection and portfolio management decisions." In other words — enrichment IS the competitive advantage.

---

## 2. Equipment Finance Companies — How They Find Borrowers

### The Dominant Method: UCC Leads

This is an industry secret that equipment finance lenders use extensively:

> **When a company takes a new equipment loan, a UCC-1 is filed. Equipment finance companies buy or mine these filings to find companies that are actively borrowing — those companies are likely to need *more* financing, refinancing, or competitive offers.**

Companies that sell UCC-based leads to equipment finance lenders:
- **Accutrend** (accutrend.com) — UCC collateral database, includes contact details, SIC codes, loan amounts
- **Klover Data** (kloverdata.com) — "UCC leads for sale" sourced from verified government filings
- **Datamangroup** (datamangroup.com) — Business loan prospects via UCC database
- **Salesgenie / Data.com** — UCC data as one enrichment layer

**What's in a UCC lead:** Company name, address, phone, email, industry/SIC code, sales volume, lender name, collateral description, filing date.

### Trinity Capital — VC-Backed Equipment Finance

Trinity Capital (NASDAQ: TRIN) provides $5M-$50M equipment financing to venture-backed growth companies.

**How they find deals:**
- Primary channel: **VC and venture bank relationships.** They've built relationships with 100s of VC firms who refer portfolio companies needing equipment financing. This "nearly tripled" the investment opportunities they see.
- Secondary channel: Direct origination team covers credit origination and underwriting
- They specifically target companies with institutional equity investors (VC/PE-backed) — not random SMBs

**Corgi's analog:** The GPU RVG customer is also likely VC-backed or PE-backed (CoreWeave, Lambda, Crusoe all are). Building relationships with the VCs and venture debt lenders (Silicon Valley Bank, Western Technology Investment, Runway) who fund these companies is Trinity's playbook.

### Western Technology Investment (WTI) — Tech Equipment Lending

WTI focuses on venture-backed tech companies. Primary sourcing method: **they live inside the VC ecosystem.** Attend portfolio reviews, LP meetings, demo days.

**Key data insight:** WTI has been lending to tech companies since 2001. They know which companies are raising equity rounds and need bridge capital *before* those companies show up on Bloomberg.

**Signal:** Funding announcements on Crunchbase/PitchBook → these companies just received capital and will need to deploy it into infrastructure → GPU cloud or owned GPU purchase → RVG need.

---

## 3. GPU/Data Center Market Intelligence Providers

### DatacenterHawk

**What it does:** Tracks data center supply, demand, lease pricing, and transactions across 300+ global markets. Products:
- **Hawk Search** — interactive map of data center locations by market/provider
- **Hawk Insight** — market trends and in-depth data
- **Hawk Hyperscale** — tracks hyperscaler capacity (owned + leased)
- **Hawk Swap** — transactional lease/purchase comps database

**2024 Data Points:**
- Tracked $39.3B+ in annual colocation revenue (ex-power)
- Pricing surged 50-75% over 3-4 years due to supply constraints
- AI deployments drove majority of absorption in Q1 2024

**Corgi Use:** Hawk Swap's transaction database reveals which companies are leasing data center capacity — those companies are deploying compute and may be financing GPU purchases. **This is a named account list.**

**Access:** Subscription-based; contact for pricing. Not cheap but probably <$50k/yr for a base subscription.

### Dell'Oro Group

**What it does:** Quarterly reports on data center semiconductors and components — GPU, CPU, FPGA, HBM, DRAM, NVMe. Tracks revenue, unit shipments, pricing, and market share by vendor.

**2024 Data:**
- Server & Storage Component revenues: $244B (record)
- NVIDIA captured nearly 50% of total data center component revenues
- GPU Accelerator market forecast: $446B by 2029

**Corgi Use:** Understand the macro trajectory. Not granular enough to identify specific companies but good for sizing and timing arguments in pitch decks.

**Access:** Contact dgsales@delloro.com; custom pricing, likely $5k-$50k per report.

### Synergy Research Group

**What it does:** SaaS platform (SIA™) for cloud market share and forecast analytics. Tracks hyperscaler spend, cloud infrastructure revenue by provider.

**Corgi Use:** Identifying which companies are spending the most on cloud/GPU infrastructure. Market share data by company can inform ICP definition.

**Access:** Enterprise subscription through SIA™ platform.

### Omdia (Informa Tech)

**What it does:** AI Processors for Cloud and Data Center Forecast — GPUs, AI ASICs/ASSPs, FPGAs, CPUs with AI acceleration. Breakdown by market segment, region, vertical, application, memory, compute performance, power.

**2024 Data:**
- $123B in GPUs/AI accelerators shipped in 2024
- $207B projected for 2025
- $286B by 2030

**Corgi Use:** Vertical and segment breakdowns — which industries are buying GPUs fastest? Healthcare AI, financial services, etc. This informs which verticals to prioritize for RVG outreach.

**Access:** Informa Tech subscription; "Ask an Analyst" service available. Similar pricing to Dell'Oro.

### Structure Research / Uptime Institute

**Uptime Institute:** Runs the data center Tier certification program. Their list of Tier III/IV certified data centers globally is public (uptimeinstitute.com/tcf/). Companies with Tier certifications are serious data center operators — potential GPU fleet owners.

**Corgi Use:** The Uptime Institute certified data center list is a free prospect list. Cross-reference with GPU infrastructure signals to identify targets.

### NVIDIA Inception Program

**What it does:** Startup accelerator with 8,000+ AI startups globally. Members get discounts on NVIDIA hardware, cloud credits, technical support.

**Public Access:**
- Member Showcase: nvidia.com/en-us/startups/showcase/ (selected companies)
- Crunchbase tracks "NVIDIA Inception portfolio" companies — 518 known investments tracked by CB Insights
- Full directory requires NVIDIA membership

**Corgi Use:**
- Crunchbase Inception portfolio = ~500 known AI startups that NVIDIA has formally backed
- Cross-reference with funding data to find companies that are growing fast enough to be buying serious GPU infrastructure
- NVIDIA Inception members get hardware discounts → they ARE buying NVIDIA hardware

**Actionable NOW:** Pull the Crunchbase NVIDIA Inception list. Filter by company stage (Series A+), funding amount ($10M+), and AI infrastructure verticals. This is a named account list that costs nothing.

### AMD Accelerator Cloud / Partner Directory

AMD's partner ecosystem is less well-documented than NVIDIA's but similarly structured. AMD ROCm partner list and AMD Accelerate program members are findable via AMD's partner locator.

---

## 4. B2B Sales Intelligence Leaders — The Modern Stack

### The 2025-2026 Sales Enrichment Stack

**Tier 1 — Contact/Company Database:**
- **Apollo.io** ($49/user/mo) — 275M contacts, 60M companies; best for high-volume SMB outbound; budget option
- **ZoomInfo** ($15,000+/yr) — 600M+ contacts; best for enterprise, 95% phone accuracy; intent signals included; expensive but gold standard

**Tier 2 — Enrichment Orchestration:**
- **Clay** ($149-$720/mo) — 130+ real-time data sources, 75+ enrichment vendors, AI research agent (Claygent). Powers 8,000+ teams including OpenAI, Canva, Rippling. Claygent can scrape websites, summarize content, extract structured data from unstructured sources.
  - Single-provider enrichment: 30-60% match rates
  - Waterfall enrichment via Clay: 80%+ match rates
  - **This is the tool Corgi should build on**

**Tier 3 — Intent Data:**
- **6sense** — 1 trillion buying signals/day; identifies accounts researching solutions before they contact vendors; 10x coverage vs competitors; ~$60k-$200k+/yr
- **Bombora** — intent data co-op; B2B intent signals from 5,000+ media properties
- **ZoomInfo Intent** (included in ZoomInfo subscription)

**Tier 4 — Technographic:**
- **BuiltWith** ($295-$995/mo) — tracks 113k+ web technologies; identifies companies using specific tech stacks (e.g., "uses Kubernetes," "uses CUDA-based frameworks")
- **HG Insights** — enterprise technographic data; better for enterprise/on-premise tech detection

**Tier 5 — Signal-Based:**
- **Harmonic** ($23M Series A; 20M+ companies, 160M founders) — tracks founders who quit jobs quietly, domain registrations, early hiring signals; built for VC but applicable to B2B
- **UserGems** — tracks "job change" signals; when a champion at a customer moves to a new company, that's a sales signal

### Clay Power User Playbook (Corgi-Specific)

What the best Clay users do that's applicable to Corgi:

1. **Build a seed list:** Start with publicly known GPU cloud providers (CoreWeave, Lambda, Crusoe, RunPod, Nebius, Together, Vast, Hyperstack, etc.) — this ~50-company list is Tier 1
2. **Waterfall enrich:** Pull company data from Apollo → verify/expand with ZoomInfo → fill gaps with Clearbit → use Claygent to research anything not in databases
3. **Signal layer:** Add Crunchbase funding data, NVIDIA Inception membership, LinkedIn employee count growth (hiring signal), job postings (GPU engineer hires = infrastructure expansion signal)
4. **Contact discovery:** Find CFO/COO/Head of Infrastructure at each company via Apollo/LinkedIn
5. **Personalization at scale:** Claygent writes a custom one-liner per company based on scraped website data

**Cost to implement:** ~$1,000-$2,000/mo for Clay Pro + Apollo + one intent data source. Very high ROI given deal sizes.

### How VC Firms Do Deal Sourcing (The Harmonic/Affinity Playbook)

VCs solve a nearly identical problem: find companies before they're widely known. Their approach:

- **Harmonic:** "Always-on" engine that monitors incorporation filings, LinkedIn updates, domain registrations, GitHub activity. Catches founders who quit their job (LinkedIn title change or gap) before they announce a new company.
- **Affinity:** CRM + relationship intelligence; tracks email/calendar activity to surface warm intros; enriches with 40+ sources (Crunchbase, PitchBook, Dealroom)
- **Signal detection:** Key hires (GPU infrastructure engineer hired = scale-up signal), patent filings, press releases, job postings

**Corgi Analog:**
- Monitor for companies that just hired a "VP of Infrastructure" or "GPU Operations" role — that's a buying signal
- Monitor LinkedIn for people moving from FAANG data center roles to AI startup roles — that's a company building GPU infrastructure
- Monitor for Series B/C AI infrastructure companies — those companies will be buying GPUs in the next 6-12 months

**Affinity for Corgi:** Once Corgi has deal flow, Affinity ($4k-$10k/mo) helps track all relationships and surfaces warm intro paths. The CRM for a 50-company top-of-funnel is overkill, but useful at scale.

---

## 5. UCC Filing Analysis — THE GOLDMINE

### Why This Is Corgi's Most Actionable Data Source

When any company takes an equipment-secured loan, the lender files a UCC-1 financing statement with the state where the debtor is incorporated (usually Delaware for tech companies). This creates a public record that includes:

- **Debtor name** (the company)
- **Secured party** (the lender)  
- **Collateral description** (free text — can literally say "NVIDIA H100 GPUs, serial numbers [list]" or "all graphics processing units, wherever located")
- **Filing date**
- **Expiration date** (5 years, auto-renewable)

### Real GPU-Backed Transactions Already in UCC System

- **CoreWeave:** $2.3B (Aug 2023, Magnetar/Blackstone) + $14.2B total debt, all GPU-collateralized
- **Lambda Labs:** $500M (Apr 2024, Macquarie/IDF)
- **Crusoe Energy:** $200M (Upper90), ~20,000 H100s as collateral
- **Total GPU-backed debt by end 2024:** $11B+ (BlackRock, PIMCO, Carlyle, and others)
- **All of these have UCC-1 filings** — public records, searchable

### How to Search

**Delaware (Most Important — where most tech companies incorporate):**
- **Direct collateral search:** https://icis.corp.delaware.gov/Ecorp/UCC/collateral.aspx
- You can search by collateral description text (keyword search)
- Search terms: "GPU," "NVIDIA," "H100," "A100," "graphics processing unit," "accelerator"
- **This is a free tool that exists right now**

**National Aggregators (search all 50 states):**

| Provider | Coverage | API? | Pricing |
|----------|----------|------|---------|
| **CSC Global** (cscglobal.com) | All 50 states; industry's largest UCC database | Yes — integrates with Salesforce, LaserPro, lending systems | Enterprise pricing; contact sales |
| **LexisNexis Public Records** | All 50 states + DC + USVI; includes inactive filings; matches amendments/continuations | Yes — access via LexisNexis API; 81B+ public records | $5k-$50k+/yr depending on volume |
| **First Corporate Solutions (FiCoso)** | All states; REST JSON API | Yes — ficoso.com/ucc | Per-search pricing; API available |
| **Wolters Kluwer iLien** | All states | Yes — pre-built modules for lending systems | Enterprise pricing |
| **Dun & Bradstreet** | UCC Financing REST API; uses D-U-N-S Numbers | Yes — docs.dnb.com/direct | Volume-based; enterprise |
| **Microbilt** (microbilt.com) | UCC search across US states | Yes | Per-search; lower entry cost |
| **Accutrend** (accutrend.com) | Pre-packaged UCC leads with contact enrichment | No (data product) | Data subscription |

### Can You Search By Collateral Description?

**Yes.** The Delaware system explicitly has a collateral description search. CSC Global and LexisNexis both support keyword search on collateral text.

However: collateral descriptions vary widely. Some say "all personal property" (useless). Others are specific: "NVIDIA H100 SXM5 GPU accelerator systems, model DGX H100, serial numbers..." (jackpot). The quality depends on the lender's documentation practices.

**Smart search strategy:**
1. Search Delaware: "NVIDIA" in collateral → get all Delaware corps with NVIDIA collateral
2. Search Delaware: "GPU" in collateral 
3. Search Delaware: "graphics processing" in collateral
4. Search Delaware: "H100" or "A100" in collateral
5. Cross-reference results with company funding data on Crunchbase to prioritize

### Monitoring / Alerts

**CSC Global** and **FiCoso** both offer UCC monitoring — set up alerts for new filings matching your criteria. When a new GPU-backed loan is filed, you know about it within days.

**Strategic use:** When Corgi sees a new UCC-1 filed against a company with GPU collateral, that company just took on debt secured by the GPUs. They now have:
- Identified GPU assets (confirmation they own hardware)
- A lender (potential partner for RVG co-sell)
- A new financial obligation (motivation to protect collateral value)
- A 5-year horizon (when they need to think about depreciation/RVG)

**This is the highest-quality signal Corgi can get.**

### Cost Summary for UCC

- Delaware collateral search: **Free**
- FiCoso API: ~$0.10-$2.00 per search
- Accutrend data subscription: ~$2,000-$10,000/yr
- CSC Global enterprise: $20k-$100k+/yr
- LexisNexis: $5k-$50k+/yr

**Start with free Delaware search. Graduate to FiCoso API for automation.**

---

## 6. Import/Export Trade Data

### The Core Insight

GPUs are manufactured in Taiwan (TSMC), assembled in Taiwan/China, and shipped to the US. Every shipment creates a US Customs record (Bill of Lading) that is **public information**. The records contain:

- **Consignee:** The company receiving the shipment (e.g., "CoreWeave Inc" or "Lambda Labs")
- **Shipper:** The sending entity (e.g., "NVIDIA Taiwan")
- **Product Description:** Free text — may say "GPU server," "DGX system," "H100 compute node"
- **HS Code:** Standardized tariff classification
- **Weight and value:** Approximation of shipment value
- **Port of entry**
- **Date of arrival**

### HS Codes for GPU Hardware

| HS Code | Description | Notes |
|---------|-------------|-------|
| **8473.30.1180** | Parts/accessories for ADP machines (GPUs) | NVIDIA's own code per CBP ruling N304787; Quadro K2000D, Tesla V100 classified here |
| **8471.80.1000** | Other ADP machines | Used by Census Bureau for graphics cards |
| **8543.70** | Electrical machines with individual functions | Sometimes used for AI accelerators |
| **8471.30** | Portable ADP machines | Can catch GPU-integrated systems |

**Key fact:** HS code 8473.30.1180 showed imports **over $1 billion per month** for most of H2 2023. The AI hardware import surge is visible in trade data.

### Services

| Service | Price | Coverage | Notes |
|---------|-------|----------|-------|
| **ImportGenius** | $149-$399/mo (self-serve); enterprise custom | 25+ countries, 8M+ US businesses | Essentials = $149/mo; USA Pro = $199-$399/mo; 20% discount annual |
| **Panjiva (S&P Global)** | Custom (contact sales; "twice Tendata pricing") | 2B+ shipment records, 9M+ companies | Supports HS code search, company name search, alerts |
| **ImportYeti** | Free (limited) / paid | US only | Good for quick lookups; limited for systematic use |
| **Zauba** | Free | India + some US data | Indian import records for NVIDIA visible at zauba.com |

### How to Use for Corgi

1. **Search by consignee name:** "CoreWeave," "Lambda Labs," "Crusoe Energy," etc. — verify they're importing GPUs
2. **Search by HS code 8473.30:** Get list of ALL US companies importing GPU hardware → prospect list
3. **Search by shipper name:** "NVIDIA," "Super Micro," "Dell" — find all recipient companies
4. **Set up alerts:** When a new company starts importing large volumes of GPU hardware, you get notified

**Limitation:** Export controls on NVIDIA chips (particularly H100/H200 to China and other restricted countries) mean some shipments are obscured. But US-domestic imports to legitimate AI companies are fully visible.

**Immediate action:** $149/mo ImportGenius Essentials subscription. Search HS code 8473.30 consignees for last 12 months. This likely produces a list of 200-500 companies that imported NVIDIA hardware at meaningful scale.

---

## 7. Patent & IP Intelligence

### What Patents Reveal

Patent filings indicate where a company is investing R&D — and what infrastructure they're building. Companies building GPU clusters file patents on:
- GPU cluster management and orchestration
- GPU cooling and thermal management systems
- AI training infrastructure and optimization
- GPU memory management
- Multi-GPU scheduling

**Key players by patent volume (GPU infrastructure):**
- Hyperscalers: Microsoft, Google, Amazon, Meta — massive patent portfolios
- NVIDIA, AMD, Intel — hardware IP
- Emerging: CoreWeave, Lambda, Cerebras have started filing

### How to Search

**Free Tools:**
- **Google Patents** (patents.google.com) — full-text search, assignee search, citation analysis
- **USPTO Patent Full-Text Database** (patents.google.com links through) — searchable
- **Espacenet** (European Patent Office) — global coverage

**Search Strategies for Corgi:**
- Search assignee: company name (e.g., `assignee:CoreWeave`)
- Search claims/abstract: "GPU cluster" OR "GPU cooling" OR "AI accelerator" OR "NVIDIA" 
- Filter by filing date 2022-present (the GPU buildout era)

**Intelligence Use:**
- Companies that suddenly start filing GPU infrastructure patents are building serious infrastructure
- Patent applicant lists = companies investing at R&D level in GPU infrastructure
- Cross-reference patent applicants with UCC filings → high-confidence targets

**Limitation:** Patents lag reality by 12-18 months (filing to publication). Early-stage companies often don't patent. But for identifying established GPU infrastructure companies, useful.

**PatSnap, Derwent Innovation** offer enterprise patent intelligence with better search but cost $10k-$50k+/yr. Free USPTO/Google Patents search is sufficient for initial prospecting.

---

## 8. Real-World Enrichment Workflows

### Real-World Example 1: How Equipment Finance Lenders Use UCC (NOW)

Companies like **Accutrend** and **Klover Data** have built entire businesses on packaging UCC filings as sales leads:

- Pull all UCC filings nationally by SIC code (e.g., "7374 Computer Processing and Data Preparation")
- Enrich with contact data (phone, email from D&B / ZoomInfo)
- Sell as "UCC leads" to equipment finance salespeople for $0.50-$5.00 per record

**Corgi should do the same thing inverted:** Instead of buying UCC leads, BUILD the UCC monitoring capability. Monitor for new GPU-collateral UCC filings. Contact those companies within 7 days of filing. They just proved they own GPUs and are borrowing against them — RVG is directly relevant.

### Real-World Example 2: How VCs Use Harmonic (Directly Applicable)

Harmonic's "always-on" engine does for VC deal sourcing what Corgi needs for insurance prospecting:

1. **Scan:** Monitor incorporation filings (Delaware SOS, state APIs), LinkedIn, GitHub, domain registrations
2. **Signal detection:** Founder quit big tech job → probably starting something → flag
3. **Enrich:** Pull all available data on the founder and nascent company
4. **Prioritize:** Score based on predictive model (prior exits, school, connections, etc.)
5. **Alert:** Send to VC analyst's inbox with "here's a new stealth startup"

**Corgi equivalent:**
1. **Scan:** Monitor UCC filings (new GPU collateral), import records (new GPU importers), job postings (GPU infrastructure hiring), funding announcements (AI infra companies raising)
2. **Signal detection:** Company just pledged GPUs as collateral → has hardware, has debt, needs protection
3. **Enrich:** Pull company data from Apollo/ZoomInfo, funding history from Crunchbase, GPU details from UCC collateral description
4. **Prioritize:** Score by GPU fleet size × loan maturity × depreciation risk
5. **Alert:** Sales team gets "CoreWeave filed a new $500M GPU-collateral UCC today, here's everything we know about them"

**Build cost:** $5k-$20k to build the monitoring layer on top of FiCoso API + Clay enrichment. Ongoing cost: ~$2k/mo.

### Real-World Example 3: Clay Power User Waterfall (Start Here)

The most successful SDR teams at companies like Gong and Outreach use Clay like this:

```
Seed List (known GPU companies) 
    → Apollo (get contacts, 60% match rate)
    → ZoomInfo (fill gaps, 80% cumulative)
    → Clearbit (fill remaining gaps)
    → Claygent (scrape website for custom context)
    → LinkedIn (verify title/role)
    → Output: Enriched prospect with verified contact + personalized context
```

**Cost:** Clay Pro ($720/mo) + Apollo ($49/user) = ~$800/mo  
**Output:** 80%+ enriched prospect list with contact data + custom research  
**Time to value:** 2 hours to set up a Clay table; results same day

### Real-World Example 4: How PE Firms Find Acquisition Targets (Affinity/Pitchbook)

Private equity firms have solved the same problem (identify companies meeting specific criteria) with:

- **PitchBook** ($25k-$50k+/yr) — comprehensive company database with firmographics, funding history, ownership, financials
- **Affinity** ($10k-$20k+/yr) — relationship intelligence CRM; surfaces warm intros through partner network
- **Relevant filters for Corgi:** PitchBook lets you filter by vertical (AI/ML), stage (Series B+), last funding date (<2 years), headcount growth (>50% YoY), geography, and key investors

PE firms find that **80% of the best deals come through relationships, 20% through cold data mining.** The data sources are for cold outbound; relationships are for warm inbound.

**Corgi PE Playbook:**
- PitchBook filter: AI Infrastructure companies, $10M-$500M raised, last funded 2023-2025, 50+ employees → ~200 companies
- Cross-reference with DatacenterHawk's operator list → companies with colocation contracts (likely GPU operators)
- Cross-reference with UCC GPU collateral → confirmed GPU owners
- Result: <50 high-priority targets with multiple confirmation signals

---

## 9. The Corgi Enrichment Architecture (Recommendations)

### Layer 1: Universe Definition (Free or Near-Free)

| Source | What You Get | Cost | Time |
|--------|-------------|------|------|
| Delaware UCC collateral search | GPU-collateralized borrowers | Free | 2 hrs |
| NVIDIA Inception Crunchbase list | 500+ NVIDIA-backed AI startups | Free | 1 hr |
| DatacenterHawk operator list | Named colocation operators | Contact for pricing | 1 week |
| GPU cloud provider list (manual) | ~50 known neo-cloud providers | Free | 1 hr |
| ImportYeti HS 8473.30 consignees | Companies importing GPU hardware | Free (limited) | 1 hr |
| Uptime Institute certified DC list | Data center operators | Free | 1 hr |

**Output: ~500-1000 company seed list**

### Layer 2: Enrichment (Low-Cost Start)

| Source | What You Get | Cost |
|--------|-------------|------|
| Clay (Starter → Pro) | Waterfall enrichment across 130+ sources | $149-$720/mo |
| Apollo (Basic) | Contacts, firmographics, intent signals | $49/user/mo |
| Crunchbase Pro | Funding history, investors, team | $29-$99/mo |
| BuiltWith | Technology stack signals | $295/mo |

**Output: 80%+ enriched profiles with verified contacts**

### Layer 3: Signals & Monitoring (Build Over Time)

| Signal | Source | Priority |
|--------|--------|---------|
| New GPU-collateral UCC filing | Delaware SOS free / FiCoso API | 🔴 Critical |
| New GPU import records | ImportGenius $199/mo | 🔴 Critical |
| New funding round (AI infra) | Crunchbase / Harmonic | 🟡 High |
| GPU infrastructure job postings | LinkedIn / Clay | 🟡 High |
| Patent filing (GPU infra) | Google Patents | 🟢 Medium |
| NVIDIA Inception new members | Crunchbase | 🟢 Medium |
| DatacenterHawk new transactions | Hawk Swap | 🟢 Medium |

### Layer 4: Intent & Timing (Advanced)

- **6sense:** ~$60k-$200k+/yr — only worth it when Corgi has digital content for accounts to research
- **Bombora intent:** Similar pricing — intent signals require an established brand
- **ZoomInfo Intent:** Bundled with ZoomInfo if/when budget allows

### The 30-Day Quick Start (Under $1,000 Total)

1. **Day 1:** Search Delaware UCC collateral for "NVIDIA," "GPU," "H100," "A100" — manual, free
2. **Day 2:** Pull NVIDIA Inception list from Crunchbase — free
3. **Day 3:** Import ImportYeti for HS 8473.30 lookups — free
4. **Day 4:** Set up Clay Starter ($149) with Apollo Basic ($49) — waterfall enrich the seed list
5. **Week 2:** Set up FiCoso API for UCC monitoring (quote cost; likely ~$100-$500/mo for moderate volume)
6. **Week 3:** Subscribe to ImportGenius Essentials ($149/mo) for systematic GPU importer identification
7. **Week 4:** Have enriched, verified contact list of top 100 GPU infrastructure companies with CFO/COO contacts

**Total cost: ~$500-$1,000/mo ongoing**

---

## 10. Key Competitors to Watch

### Who's Building Similar Intelligence Capabilities

**Zurich Insurance's Technology Practice:** Zurich has built a technology risk underwriting platform that uses technographic data to identify tech companies by their stack and size. Closest analog to what Corgi needs.

**Munich Re Digital Partners:** Munich Re backs MGAs and insurtechs that solve distribution problems in new insurance lines. They've solved the "find the risk" problem for many new categories. Worth studying their portfolio for any analog to GPU risk.

**CoreWeave's CFO:** CoreWeave's lenders (Blackstone, Magnetar, Carlyle) already have the risk data Corgi needs. Their due diligence on GPU collateral is the template for RVG underwriting. Those lenders are natural Corgi partners/customers.

**Cowbell Cyber:** MGA that used technographic data (BuiltWith) to identify cyber insurance prospects by tech stack. Grew to $100M+ GWP. Closest precedent for "use data sources to identify novel insurance risks."

---

## Sources

- Medium/@Elongated_musk: "Silicon to Securities: How GPUs Became AAA-Rated ABS Assets" 
- davefriedman.substack.com: "How GPUs Became the Newest Financial Asset"
- twobirds.com: "GPU-Based Financing in the Global Data Center Market"
- datacenterhawk.com/products and market insight reports
- harmonic.ai case studies (Sorenson Capital, Airtree)
- affinity.co/blog/data-enrichment
- Clay.com: "130+ real-time enrichment sources"
- saber.app/blog: "Best Sales Intelligence Platforms Q3 2025"
- 6sense.com: 2025 Buyer Experience Report
- delloro.com: Q2 2025 semiconductor press releases
- omdia.tech.informa.com: AI data center chip forecasts
- importgenius.com/pricing
- panjiva.com
- ficoso.com/ucc: "Choose The Right API For UCC"
- icis.corp.delaware.gov/Ecorp/UCC/collateral.aspx (confirmed live)
- accutrend.com: "The Ultimate Guide to UCC Collateral Data"
- salesgenie.com/blog: "How to Use UCC Data to Identify Prospects"
- nvidia.com/en-us/startups/showcase
- crunchbase.com/hub/nvidia-inception-portfolio-companies
- builtwith.com pricing page
- CBP Ruling N304787 (8473.30.1180 GPU classification)
- equipmentfinancenews.com: "How Financiers Can Navigate UCC Searches with AI"
- trinitycap.com investor FAQs and SEC filings
- munichre.com/specialty/north-america/en/solutions/programs/digital-partners
- aon.com: "How to Futureproof Data and Analytics Capabilities for Reinsurers"
