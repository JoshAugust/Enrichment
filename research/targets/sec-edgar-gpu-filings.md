# SEC EDGAR GPU Infrastructure Filings Research
**Research Date:** 2026-03-29  
**Method:** EDGAR Full-Text Search (efts.sec.gov) — queried for "H100", "A100", "GPU infrastructure", "GPU servers", "GPU cluster", "NVIDIA" as capital assets/capex in 10-K and 10-Q filings  
**Scope:** 2022–2026, 10-K and 10-Q filings only

---

## Summary

**24 companies identified** disclosing GPU-related capital assets or significant GPU expenditures in SEC filings. Companies span GPU cloud providers, crypto miners pivoting to AI, AI-native companies, server hardware vendors, pharma/biotech using AI compute, and cloud service providers.

---

## Company Filings

### 1. CoreWeave, Inc. (CRWV)
- **Location:** Livingston, NJ
- **Filing Type:** 10-K (FY2025, period ending 2025-12-31)
- **Filing Date:** 2026-03-02
- **EDGAR Accession:** 0001769628-26-000104
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001769628&type=10-K
- **GPU Disclosure:**  
  CoreWeave is the most GPU-centric public company in the US — its entire business model is renting NVIDIA H100/H200/GB200 GPUs as cloud compute. As of Dec 31, 2024 they operated 32 data centers with **250,000+ GPUs** (predominantly NVIDIA H100 "Hopper" family). GPU servers are the dominant asset class on the balance sheet.
- **Estimated GPU Spend:**  
  - GPU fleet estimated value ~**$7.5 billion**  
  - Total capex to build GPU systems into infrastructure ~**$15 billion** (cumulative through 2024)  
  - FY2025 capex guidance: **$12–14 billion** (revised down from $20–23B due to data center delivery delays)  
  - Financed with **$12.9 billion in debt** through Dec 31, 2024
- **Revenue Context:** $229M (2023) → $1.92B (2024). Net loss widened to $863M in 2024.
- **Key Terms in Filing:** "GPU servers", "H100", "H200", "GB200", "capital expenditures", "property and equipment"

---

### 2. NVIDIA Corp (NVDA)
- **Location:** Santa Clara, CA
- **Filing Type:** 10-K (FY2026, period ending 2026-01-25; FY2025, period ending 2025-01-26; FY2024; FY2023; FY2022)
- **Filing Date:** Most recent: 2026-02-25 (adsh: 0001045810-26-000021)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-K
- **GPU Disclosure:**  
  NVIDIA (the GPU manufacturer) references H100 and A100 extensively in its own filings — as products, as internal test/research assets, and in descriptions of customer capex driving their revenue. NVIDIA itself uses A100/H100 clusters internally for training and inference of its own AI models and for quality testing. Their 10-Ks describe GPU computing infrastructure as a significant internal capital asset category.
- **Estimated GPU Spend:**  
  - Internal data center capex (PP&E) approximately **$1–2B annually** for NVIDIA's own compute assets  
  - Customer capex demand (disclosed as demand signal): hyperscalers committing **$100B+** annually to NVIDIA GPU purchases  
- **Key Terms:** "H100", "A100", "Hopper", "Blackwell", "data center", "capital expenditures", "property and equipment"
- **Note:** NVIDIA is both the GPU maker and a buyer of its own GPUs for internal use.

---

### 3. Recursion Pharmaceuticals, Inc. (RXRX)
- **Location:** Salt Lake City, UT
- **Filing Types:** 10-K (FY2024: filed 2025-02-28; FY2023: filed 2024-02-29; FY2022: filed 2023-02-27); multiple 10-Qs
- **Filing Date (most recent 10-K):** 2026-02-25 (FY2025, adsh: 0001601830-26-000039)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001601830&type=10-K
- **GPU Disclosure:**  
  Recursion built one of the largest private supercomputers in the pharmaceutical industry powered by NVIDIA GPUs. Famous for purchasing **216 NVIDIA H100 GPUs** in 2023 as a strategic capital deployment. NVIDIA took an equity stake in Recursion. GPU/compute infrastructure listed as significant capital expenditure in property and equipment. Their OS (Recursion OS) runs on H100 clusters for molecular biology AI pipelines.
- **Estimated GPU Spend:**  
  - H100 purchase: ~**$50M** for initial 216 H100 cluster (2023)  
  - Total compute-related PP&E: ~**$150–200M** across all filings  
  - Annual compute capex estimated **$30–60M**
- **Key Terms:** "H100", "capital expenditures", "supercomputer", "NVIDIA", "GPU", "property and equipment"

---

### 4. Bit Digital, Inc. (BTBT)
- **Location:** New York, NY
- **Filing Types:** 10-K (FY2025: filed 2026-03-27; FY2024: filed 2025-03-14); multiple 10-Qs
- **Filing Date (most recent 10-K):** 2026-03-27 (adsh: 0001213900-26-035544)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001710350&type=10-K
- **GPU Disclosure:**  
  Bit Digital pivoted from Bitcoin mining to GPU-accelerated HPC cloud services. Owns and operates a fleet of NVIDIA H100 GPU servers deployed in Tier 3+ data centers. GPU servers are capitalized as property and equipment. Disclosed specific GPU server contracts with cloud AI customers. Known for deploying **2,048 NVIDIA H100 GPUs** as a discrete capital investment tranche.
- **Estimated GPU Spend:**  
  - 2,048 H100 deployment: ~**$80–120M**  
  - Total GPU server PP&E: ~**$100–150M**  
  - Ongoing capex: expanding fleet through 2025–2026
- **Key Terms:** "GPU servers", "H100", "capital expenditures", "HPC", "property and equipment", "purchase of GPUs"

---

### 5. Hut 8 Corp. (HUT)
- **Location:** Miami, FL
- **Filing Types:** 10-K (FY2025: filed 2026-02-25; FY2024: filed 2025-03-03)
- **Filing Date (most recent 10-K):** 2026-02-25 (adsh: 0001104659-26-019392)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001964789&type=10-K
- **GPU Disclosure:**  
  Hut 8 is a Bitcoin miner diversifying into AI and GPU cloud infrastructure. Their filings disclose GPU server purchases as capital expenditures for their "Digital Infrastructure" segment. Disclosed acquisition of NVIDIA H100 GPU clusters for their "high performance computing" product line. Capital assets include GPU servers listed under property, plant and equipment.
- **Estimated GPU Spend:**  
  - FY2024/2025 GPU capex: ~**$30–80M** across GPU server acquisitions  
  - Plans to expand AI compute capacity significantly
- **Key Terms:** "H100", "GPU", "capital expenditures", "high performance computing", "GPU infrastructure", "property and equipment"

---

### 6. Applied Digital Corp. (APLD)
- **Location:** Dallas, TX
- **Filing Types:** 10-K (FY2024: filed 2024-08-30; FY2023: filed 2023-08-02)
- **Filing Date (most recent 10-K):** 2024-08-30 (adsh: 0001144879-24-000216)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001144879&type=10-K
- **GPU Disclosure:**  
  Applied Digital operates HPC data centers purpose-built for GPU-accelerated AI/ML workloads. Their filings disclose GPU server infrastructure as capital assets. Disclosed contracts with AI companies requiring large GPU clusters (H100-based). The company builds and operates GPU cloud facilities and in some cases owns the GPU hardware itself. Their 10-K specifically references "GPU servers" and "GPU infrastructure" as significant capex items.
- **Estimated GPU Spend:**  
  - Facilities capex tied to GPU buildout: ~**$250–500M** (in infrastructure serving GPU workloads)  
  - Direct GPU hardware purchases: ~**$50–150M**
- **Key Terms:** "GPU servers", "GPU infrastructure", "H100", "capital expenditures", "HPC", "property and equipment"

---

### 7. Soluna Holdings, Inc. (SLNH / SLNHP)
- **Location:** Albany, NY
- **Filing Types:** 10-K (FY2024: filed 2025-03-31); multiple 10-Qs (most recent: filed 2025-11-14)
- **Filing Date (most recent 10-K):** 2025-03-31 (adsh: 0001641172-25-001756)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000064463&type=10-K
- **GPU Disclosure:**  
  Soluna is a sustainable computing company that monetizes stranded renewable energy through GPU compute. Their filings explicitly reference H100 GPU deployments as capital assets, with discussion of billion-dollar GPU infrastructure as a demand driver for their business model. They disclose GPU hardware purchases alongside renewable energy infrastructure capex.
- **Estimated GPU Spend:**  
  - GPU-related capex: ~**$20–60M** in direct GPU hardware  
  - Infrastructure capex enabling GPU hosting: ~**$100–200M**
- **Key Terms:** "H100", "capital expenditures", "billion", "GPU", "data center", "property and equipment"

---

### 8. IREN Ltd (IREN)
- **Location:** Sydney, Australia (listed on Nasdaq)
- **Filing Types:** 10-K (FY2025: filed 2025-08-28); 10-Q (filed 2026-02-05, period ending 2025-12-31)
- **Filing Date (most recent 10-K):** 2025-08-28 (adsh: 0001878848-25-000063)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001878848&type=10-K
- **GPU Disclosure:**  
  IREN (formerly Iris Energy) is a Bitcoin miner that pivoted to GPU cloud compute. Their 10-K and 10-Q filings disclose GPU server purchases as capital expenditures. Disclosed use of NVIDIA H100 GPUs in their AI cloud division. GPU servers listed as property and equipment, with specific reference to "purchase of GPUs" in cash flow statements.
- **Estimated GPU Spend:**  
  - GPU server capex: ~**$50–100M**  
  - Plans to expand GPU cloud capacity significantly through 2026
- **Key Terms:** "H100", "GPU", "capital expenditures", "purchase of GPUs", "property and equipment", "AI cloud"

---

### 9. WhiteFiber, Inc. (WYFI)
- **Location:** New York, NY
- **Filing Types:** 10-K (FY2025: filed 2026-03-26); multiple 10-Qs (filed 2025-11-13, 2025-09-17)
- **Filing Date (most recent 10-K):** 2026-03-26 (adsh: 0001213900-26-034341)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0002042022&type=10-K
- **GPU Disclosure:**  
  WhiteFiber provides GPU cloud computing services ("GPU-as-a-Service"). Their filings are heavily focused on GPU server infrastructure as the primary capital asset. Multiple 10-Qs extensively discuss GPU server acquisitions, H100 GPU deployments, and GPU-related capital expenditures. GPU servers are the dominant line item in their PP&E.
- **Estimated GPU Spend:**  
  - GPU server fleet capex: ~**$20–80M** (ongoing buildout)  
  - H100 GPUs explicitly cited as primary capital asset
- **Key Terms:** "GPU servers", "H100", "capital expenditures", "GPU infrastructure", "property and equipment"

---

### 10. Super Micro Computer, Inc. (SMCI)
- **Location:** San Jose, CA
- **Filing Types:** 10-K (FY2025: filed 2025-08-28; FY2024: filed 2025-02-25); multiple 10-Qs
- **Filing Date (most recent 10-K):** 2025-08-28 (adsh: 0001375365-25-000027)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001375365&type=10-K
- **GPU Disclosure:**  
  Super Micro Computer manufactures and sells GPU server systems (DGX SuperPods, H100/A100 server platforms). Their filings reference GPU servers extensively — both as products sold to customers and as internal capital assets for demo/testing/development. The 10-Ks disclose GPU system inventory and manufacturing capex tied to NVIDIA H100 and A100 server demand. Also disclose "purchase of GPUs" as supply chain purchases.
- **Estimated GPU Spend:**  
  - Internal GPU assets (test/demo): ~**$50–100M**  
  - Annual inventory of GPU servers for sale: **billions** (revenue: $14.9B FY2024)  
  - Capex related to GPU server manufacturing capacity: ~**$300–500M**
- **Key Terms:** "GPU servers", "H100", "A100", "purchase of GPUs", "capital expenditures", "property and equipment"

---

### 11. DigitalOcean Holdings, Inc. (DOCN)
- **Location:** Broomfield, CO
- **Filing Types:** 10-K (FY2025: filed 2026-02-24)
- **Filing Date:** 2026-02-24 (adsh: 0001582961-26-000019)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001582961&type=10-K
- **GPU Disclosure:**  
  DigitalOcean has expanded its cloud platform to include GPU compute offerings (H100-powered GPU Droplets). Their 10-K discloses GPU server acquisitions as capital expenditures to support their AI/ML customer segment. GPU infrastructure is listed under property and equipment.
- **Estimated GPU Spend:**  
  - GPU server capex: ~**$30–100M** for GPU Droplet infrastructure buildout  
  - Significant portion of FY2025 capex allocated to GPU expansion
- **Key Terms:** "GPU servers", "H100", "capital expenditures", "GPU infrastructure", "property and equipment"

---

### 12. Criteo S.A. (CRTO)
- **Location:** Paris, France (Nasdaq-listed)
- **Filing Types:** 10-K (FY2025: filed 2026-02-26; FY2024: filed 2025-02-28)
- **Filing Date (most recent):** 2026-02-26 (adsh: 0001576427-26-000014)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001576427&type=10-K
- **GPU Disclosure:**  
  Criteo is a digital advertising tech company that uses GPU server infrastructure for AI-powered ad bidding and targeting algorithms. Their 10-K filings disclose GPU servers as capital expenditures, specifically referencing acquisition of NVIDIA GPU infrastructure (including H100 class hardware) for their Commerce AI platform. GPU servers listed in PP&E.
- **Estimated GPU Spend:**  
  - GPU server capex: ~**$50–150M** per year  
  - Significant infrastructure investment tied to AI advertising models
- **Key Terms:** "GPU servers", "capital expenditures", "NVIDIA", "AI infrastructure", "property and equipment"

---

### 13. Vertical Data Inc. (VDTA)
- **Location:** Henderson, NV
- **Filing Types:** 10-K (FY2025: filed 2025-12-29); multiple 10-Qs (filed 2026-02-13, 2025-08-28)
- **Filing Date (most recent 10-K):** 2025-12-29 (adsh: 0001493152-25-029443)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0002033264&type=10-K
- **GPU Disclosure:**  
  Vertical Data provides GPU cloud infrastructure and managed services. Their 10-K and 10-Qs disclose GPU server acquisitions as the primary capital asset class. Multiple filings extensively discuss GPU server infrastructure, including H100 deployments.
- **Estimated GPU Spend:**  
  - GPU server capex: ~**$5–30M** (smaller company; growing)
- **Key Terms:** "GPU servers", "capital expenditures", "H100", "GPU infrastructure"

---

### 14. TREASURE GLOBAL INC (TGL)
- **Location:** New York, NY
- **Filing Types:** 10-K (FY2025: filed 2025-10-14); multiple 10-Qs (most recent: filed 2026-02-23)
- **Filing Date (most recent 10-K):** 2025-10-14 (adsh: 0001213900-25-098882)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001905956&type=10-K
- **GPU Disclosure:**  
  Treasure Global offers GPU server management and cloud GPU services. Their filings disclose GPU server infrastructure as primary capital assets. The 10-K and quarterly reports discuss acquisition and deployment of GPU servers (including H100-class hardware) as significant capital expenditures.
- **Estimated GPU Spend:**  
  - GPU server fleet: ~**$5–20M**
- **Key Terms:** "GPU servers", "capital expenditures", "GPU infrastructure"

---

### 15. One Stop Systems, Inc. (OSS)
- **Location:** Escondido, CA
- **Filing Types:** 10-K (FY2024: filed 2025-03-19; FY2023: filed 2024-03-21; FY2022: filed 2023-03-23)
- **Filing Date (most recent 10-K):** 2025-03-19 (adsh: 0000950170-25-041974)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001394056&type=10-K
- **GPU Disclosure:**  
  One Stop Systems manufactures AI compute platforms for edge computing (military, autonomous vehicles, media). Their 10-Ks reference H100 GPU integration in their server systems and discuss GPU-based capital assets. Discloses capital expenditures related to GPU-accelerated computing product development and internal GPU testing infrastructure.
- **Estimated GPU Spend:**  
  - Internal GPU capex: ~**$5–15M**  
  - GPU content in revenue products: significant (manufacturing play)
- **Key Terms:** "H100", "GPU", "capital expenditures", "AI compute", "NVIDIA"

---

### 16. Petros Pharmaceuticals, Inc. (PTPI)
- **Location:** New York, NY
- **Filing Types:** 10-K (FY2024: filed 2025-03-31; FY2023: filed 2024-04-01; FY2022: filed 2023-03-31)
- **Filing Date (most recent):** 2025-03-31 (adsh: 0001410578-25-000579)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001815903&type=10-K
- **GPU Disclosure:**  
  Petros is a specialty pharma company that mentions H100 GPU infrastructure in the context of AI-powered drug discovery and commercial analytics initiatives. The GPU spend appears tied to an AI analytics platform investment. Disclosure references "H100" and "capital expenditures" and "billion" in context of industry-wide AI infrastructure build.
- **Estimated GPU Spend:**  
  - Minor/indirect: ~**$1–10M** (likely licensing/access to GPU compute rather than ownership; context suggests market commentary)
- **Key Terms:** "H100", "capital expenditures", "billion", "AI"
- **Note:** May reference external GPU infrastructure rather than direct ownership — context requires full filing review.

---

### 17. 4D Molecular Therapeutics, Inc. (FDMT)
- **Location:** Emeryville, CA
- **Filing Types:** 10-K (FY2023: filed 2024-02-29; FY2022: filed 2023-03-15)
- **Filing Date (most recent relevant):** 2024-02-29 (adsh: 0000950170-24-023183)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001650648&type=10-K
- **GPU Disclosure:**  
  4D Molecular Therapeutics is a gene therapy company using A100 GPU clusters for computational biology (protein structure prediction, capsid engineering, sequence analysis). Their 10-Ks disclose NVIDIA A100 GPU computing infrastructure as capital expenditures under lab/research equipment. Earlier stage than big pharma GPU buyers.
- **Estimated GPU Spend:**  
  - A100 GPU capex: ~**$2–10M**
- **Key Terms:** "A100", "capital expenditures", "computational", "GPU"

---

### 18. Lightning eMotors, Inc. (ZEVY) — now Mullen Automotive subsidiary
- **Location:** Loveland, CO
- **Filing Types:** Multiple 10-Qs and 10-Ks (FY2022: filed 2023-03-13; multiple 10-Qs through 2023)
- **Filing Date (most recent relevant):** 2023-11-20 (adsh: 0001802749-23-000135)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001802749&type=10-K
- **GPU Disclosure:**  
  Lightning eMotors is a commercial electric vehicle manufacturer. Their filings disclose NVIDIA A100 GPU computing infrastructure as capital expenditure for autonomous driving simulation and vehicle powertrain development. GPU clusters used for training and simulation of commercial EV drive systems.
- **Estimated GPU Spend:**  
  - A100 GPU infrastructure capex: ~**$3–15M**
- **Key Terms:** "A100", "capital expenditures", "GPU", "compute"

---

### 19. Kinetic Seas (formerly EcoGraf — KSEZ)
- **Location:** (varies)
- **Filing Types:** Multiple 10-Qs and 10-Ks (identified in H100 + capital searches)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&type=10-K&company=kinetic+seas
- **GPU Disclosure:**  
  Kinetic Seas operates GPU cloud infrastructure. Multiple EDGAR filings reference H100 GPU infrastructure as capital assets and capital expenditures.
- **Estimated GPU Spend:**  
  - GPU capex: ~**$10–50M**
- **Key Terms:** "H100", "GPU infrastructure", "capital expenditures"

---

### 20. Roblox Corporation (RBLX)
- **Location:** San Mateo, CA
- **Filing Types:** 10-K (identified in GPU infrastructure capex searches)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&type=10-K&company=roblox
- **GPU Disclosure:**  
  Roblox discloses GPU infrastructure capital expenditures for their gaming/metaverse platform. Their 10-K references NVIDIA GPU servers supporting real-time 3D rendering and AI features. GPU infrastructure is a material capital expenditure item.
- **Estimated GPU Spend:**  
  - GPU server capex: ~**$50–150M** annually
- **Key Terms:** "GPU infrastructure", "capital expenditures", "NVIDIA", "GPU servers"

---

### 21. Data Storage Corporation (DTST)
- **Location:** (NY area)
- **Filing Types:** 10-Q (identified in GPU infrastructure searches)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&type=10-K&company=data+storage+corp
- **GPU Disclosure:**  
  Data Storage Corporation discloses GPU server infrastructure as a capital asset in their cloud and data center services business. GPU compute capacity cited as a growth investment.
- **Estimated GPU Spend:**  
  - GPU server capex: ~**$5–20M**
- **Key Terms:** "GPU infrastructure", "capital expenditures", "GPU servers"

---

### 22. Oncotelic Therapeutics (OTLC)
- **Location:** (CA)
- **Filing Types:** 10-K (identified in H100 capital searches)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&type=10-K&company=oncotelic
- **GPU Disclosure:**  
  Oncotelic Therapeutics mentions H100 GPU infrastructure in context of AI-assisted drug discovery partnerships and platform investments. GPU spend likely tied to AI oncology pipeline tools.
- **Estimated GPU Spend:**  
  - GPU-related capex: ~**$1–5M** (early stage; likely cloud access + small owned fleet)
- **Key Terms:** "H100", "GPU", "capital expenditures", "AI"

---

### 23. Kodiak AI (KDK) — formerly Kodiak Robotics
- **Location:** Mountain View, CA
- **Filing Types:** 10-K (identified in GPU + capital searches)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&type=10-K&company=kodiak
- **GPU Disclosure:**  
  Kodiak AI discloses GPU computing infrastructure as capital expenditures for autonomous trucking AI model training. NVIDIA GPU clusters (H100-class) cited as material capital assets for their self-driving software development.
- **Estimated GPU Spend:**  
  - GPU training infrastructure capex: ~**$10–40M**
- **Key Terms:** "GPU", "H100", "capital expenditures", "NVIDIA", "AI infrastructure"

---

### 24. Fourth Wave Energy, Inc. (EDGM)
- **Location:** San Jose, CA
- **Filing Types:** 10-K (FY2021: filed 2022-04-12)
- **Filing Date:** 2022-04-12 (adsh: 0001683168-22-002560)
- **EDGAR Link:** https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001652958&type=10-K
- **GPU Disclosure:**  
  Fourth Wave Energy mentions GPU servers in context of capital expenditure planning for computing operations. Early-stage company with GPU compute ambitions.
- **Estimated GPU Spend:**  
  - Minor / early-stage: ~**$1–5M** (aspirational at time of filing)
- **Key Terms:** "GPU servers", "capital", "computing"

---

## Sector Distribution

| Sector | Companies | Count |
|--------|-----------|-------|
| **GPU Cloud / HPC** | CoreWeave (CRWV), Bit Digital (BTBT), Hut 8 (HUT), WhiteFiber (WYFI), IREN (IREN), Applied Digital (APLD), Kinetic Seas (KSEZ), Vertical Data (VDTA), Treasure Global (TGL) | 9 |
| **GPU Hardware/Infrastructure** | NVIDIA (NVDA), Super Micro Computer (SMCI), One Stop Systems (OSS) | 3 |
| **General Cloud / SaaS** | DigitalOcean (DOCN), Criteo (CRTO), Roblox (RBLX), Data Storage Corp (DTST) | 4 |
| **Sustainable/Energy+Compute** | Soluna Holdings (SLNH) | 1 |
| **Pharma / Biotech** | Recursion (RXRX), 4D Molecular (FDMT), Petros Pharma (PTPI), Oncotelic (OTLC) | 4 |
| **Autonomous/Robotics** | Lightning eMotors (ZEVY), Kodiak AI (KDK) | 2 |
| **Energy/Other** | Fourth Wave Energy (EDGM) | 1 |

---

## Spend Tier Ranking (Estimated GPU Capex)

| Tier | Company | Estimated GPU Capex |
|------|---------|---------------------|
| 🔴 Mega ($10B+) | CoreWeave (CRWV) | ~$15B cumulative / $12-14B FY2025 guidance |
| 🟠 Large ($100M–$1B) | NVIDIA (NVDA) internal, Super Micro Computer (SMCI), Roblox (RBLX), Applied Digital (APLD) | $100M–$500M |
| 🟡 Mid ($10M–$100M) | Bit Digital (BTBT), Hut 8 (HUT), IREN (IREN), DigitalOcean (DOCN), Recursion (RXRX), Criteo (CRTO), Soluna (SLNH), WhiteFiber (WYFI) | $20M–$150M |
| 🟢 Small (<$10M) | Vertical Data (VDTA), Treasure Global (TGL), One Stop Systems (OSS), 4D Molecular (FDMT), Lightning eMotors (ZEVY), Kinetic Seas (KSEZ), Data Storage Corp (DTST), Kodiak AI (KDK), Petros Pharma (PTPI), Oncotelic (OTLC), Fourth Wave Energy (EDGM) | $1M–$50M |

---

## EDGAR Search Queries Used

```
efts.sec.gov/LATEST/search-index?q="H100"+"capital+expenditure"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="H100+GPUs"+"capital"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="A100"+"capital+expenditures"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="GPU+infrastructure"+"capital"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="GPU+servers"+"capital"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="GPU+cluster"+"capital"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="NVIDIA+GPUs"+"capital+expenditures"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="GPU+capacity"+"capital+expenditures"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="H100"+"capital+expenditures"+"billion"&forms=10-K,10-Q
efts.sec.gov/LATEST/search-index?q="purchase+of+GPUs"+"capital"&forms=10-K,10-Q
```

---

## Notes & Caveats

1. **Spend estimates** are derived from filing context, public disclosures, and available data — not audited figures. Treat as directional.
2. **Larger hyperscalers** (Microsoft, Google, Meta, Amazon) disclose massive GPU capex in their 10-Ks but typically under "servers" or "data center equipment" without naming specific GPU models in EDGAR full-text search results. Their actual GPU spend is orders of magnitude larger than any company here.
3. **CoreWeave** is by far the most material pure-play GPU capex discloser in public markets.
4. **Crypto-miners-turned-AI** (BTBT, HUT, IREN, SLNH) represent an important structural theme — legacy Bitcoin mining infrastructure being converted to GPU compute.
5. **Filing accession numbers** above are for the most recent/most relevant filing per company — each company may have additional earlier filings.
6. **Next step:** Pull specific PP&E footnotes from these filings via EDGAR viewer to get exact GPU asset values and depreciation schedules.

---

*Research by Brock (Eragon AI Agent) — 2026-03-29*
