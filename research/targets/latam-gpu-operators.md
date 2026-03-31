# LATAM GPU Operators — Research Dossier
> Compiled: 2026-03-29 | Subagent: wave3-latam

---

## Overview

Latin America held ~5% of the global data center GPU market in 2024. Brazil and Mexico lead by installed capacity and investment. Chile and Argentina are catching up fast via government programs and foreign deals. Colombia is a dark horse building sovereign AI infrastructure.

---

## 🇧🇷 BRAZIL

Brazil is the clear regional leader. Market expected to grow from $0.55B (2025) → $1.43B (2031) in AI data center spend.

---

### 1. LNCC — Santos Dumont Supercomputer
**Type:** Government / Academic Research  
**Country:** Brazil  
**Location:** Petrópolis, Rio de Janeiro

**GPU Operations:**
- Upgraded July 2025 to **18.85 PFlops** (up from ~2.8 PFlops in 2015, ~575% increase)
- **NVIDIA H100 partition:** 62 BullSequana XH3145-H blades, each with 4× H100 GPUs (NVLink) + 4th Gen Intel Xeon → ~248 H100 GPUs
- **NVIDIA Grace-Hopper partition:** 36 nodes × 4 Grace-Hopper H100 superchips → ~144 GH200 superchips
- **AMD MI300A partition:** 6 blades × 3 nodes × 1 pair MI300A → 36 MI300A hybrid units
- Built by Eviden (Atos), NVIDIA Enterprise software stack

**What They Do:**  
Brazil's national scientific supercomputer. Supports 430+ federally-funded research projects, 2,000+ researchers. Now also deploys LLMs locally (685B-parameter model on 4× H100 nodes). Used for astrophysics, meteorology, public health, drug discovery.

**Connection to Brazilian AI Plan (PBIA 2024-2028):** First investment step of R$23B (~US$4.19B) national AI program.

**Key Contacts:**
- **LNCC Director:** (public institution — contact via lncc.br)
- Website: lncc.br

---

### 2. Petrobras — CENPES AI/HPC
**Type:** Private (State-controlled) / Energy  
**Country:** Brazil  
**Location:** CENPES Research Center, Rio de Janeiro

**GPU Operations:**
- **Tatu system:** 224× NVIDIA A100 GPUs (80GB), 11 racks — dedicated AI/ML for E&P
- **Harpia supercomputer** (Lenovo, Oct 2025): ~146 PFlops Rpeak — seismic imaging
- **Ada Lovelace:** geostatistics
- **Capivara / Quati:** seismic analysis systems
- Combined 5 Lenovo systems cost R$500M (~$90M); boosted compute capacity 60%+
- **#1 in LATAM in Top500 supercomputer rankings for 5 consecutive years**
- Funded LNCC's Santos Dumont upgrade (2024)

**What They Do:**  
Oil & gas exploration and production AI: seismic imaging, subsurface modeling, geostatistics, wellbore integrity. Built domain-adapted LLM from 30-year offshore operations knowledge base. Planning US$4.2B in R&D 2025–2029 (+17%).

**Key Contacts:**
- CENPES (Centro de Pesquisas e Desenvolvimento): rio contact via petrobras.com.br
- Note: public-facing contacts limited; approach via institutional/partnership channels

---

### 3. Elea Data Centers
**Type:** Private (Independent DC Operator)  
**Country:** Brazil  
**Location:** HQ: Rio de Janeiro; 9 campuses nationally (São Paulo, Rio, others)

**GPU Operations:**
- **Rio AI City** project: Olympic Park area, Rio de Janeiro
  - Phase 1 (RJO2): 80MW, completion 2026
  - Phase 2 (RJO3/RJO4): +120MW
  - Target: **1.8 GW by 2027**, expandable to **3.2 GW by 2032**
- Partners: **Oracle** (servers), **NVIDIA** (GPU supply MoU with Rio City Hall), Google, hyperscalers
- 100% renewable energy
- "First platform to deploy AI at scale in Latin America"

**What They Do:**  
Brazil's largest independent DC operator. Colocation and hyperscale hosting for major cloud providers and AI workloads. Rio AI City is largest planned DC campus in LATAM.

**Key Contacts:**
- **Alessandro Lombardi** — Founder & Chairman | iMasons IM100 2024 | Top 50 Global CEOs 2025
- **Elena Winters** — VP International Business (former Meta)
- **Julia Dias Leite** — Board Member, CEO of CEBRI
- Website: eleadatacenters.com

---

### 4. Omnia (backed by Pátria Investimentos)
**Type:** Private (Investment-backed DC Platform)  
**Country:** Brazil  
**Location:** First site: Ceará (Pecém Port Complex); São Paulo region planned

**GPU Operations:**
- Hyperscale platform; **100MW+ facilities** with liquid cooling for high-density GPU racks
- **TikTok/ByteDance deal:** 300MW facility (Ceará), ~R$50B (~$9.4B) investment — largest single-tenant DC ever in Brazil
- AI-ready engineering: liquid cooling, high-voltage power, custom rack densities
- Construction starts H2 2025; operations by end-2027

**What They Do:**  
Brazilian-backed hyperscale DC developer. Focuses on AI-ready infrastructure for hyperscalers and large platforms. Powered by 100% renewable energy (dedicated wind projects).

**Key Contacts:**
- Backed by **Pátria Investimentos** (Brazilian private equity, affiliated with Brookfield)
- Website: (platform launched May 2025; check pátria-investimentos.com for IR contacts)

---

## 🇲🇽 MEXICO

Mexico's AI DC market: $70M (2025) → $261.5M (2031), CAGR 24.55%. Querétaro holds 65% of installed capacity.

---

### 5. KIO Data Centers
**Type:** Private (Independent DC Operator)  
**Country:** Mexico  
**Location:** Querétaro (QRO1, QRO2), Mexico City, Guadalajara

**GPU Operations:**
- **QRO2** opened Dec 2025: 12MW Phase 1 capacity (178% expansion vs QRO1)
- Total national installed capacity: ~**19 MW**
- ICREA Level 6 certified (highest operational resilience)
- Infrastructure designed for AI, cloud, high-density GPU workloads
- Supports AI inference/training for enterprise tenants

**What They Do:**  
Mexico's leading carrier-neutral colocation DC operator. Serves cloud, AI, analytics, cybersecurity workloads. Key nearshore hub for US companies expanding into LATAM.

**Key Contacts:**
- Website: kiodatacenters.com
- Newsroom contacts via official press page

---

### 6. Foxconn — NVIDIA GB200 Manufacturing Facility
**Type:** Private (Manufacturing)  
**Country:** Mexico  
**Location:** Guadalajara (primary); Chihuahua (existing ops, $500M+ invested)

**GPU Operations:**
- Building **world's largest assembly plant for NVIDIA GB200 NVL72 servers**
- Investment: ~**$900M**
- Planned capacity: **20,000 servers/month** (240K/year) — each GB200 NVL72 contains 72 next-gen Blackwell GPUs
- Operational in 2025; part of NVIDIA's Stargate supply chain
- Note: manufacturing not operating GPUs, but ~17M GPU-equiv annual output

**What They Do:**  
Hardware manufacturing for NVIDIA's flagship AI servers. Decentralization of NVIDIA supply chain away from China. Key supplier to US Stargate initiative.

**Key Contacts:**
- Foxconn Technology Group (HQ: Taiwan)
- Mexico operations contact: via foxconn.com/mx

---

### 7. ODATA Mexico
**Type:** Private (DC Operator)  
**Country:** Mexico  
**Location:** Querétaro area

**GPU Operations:**
- Turnkey DC halls supporting AI and GPU-intensive workloads
- Short deployment cycles; modular design
- Serves hyperscaler and enterprise GPU demand

**What They Do:**  
Brazilian-founded (now LATAM-focused) colocation and hyperscale DC operator. Expanded into Mexico to capture nearshoring AI demand.

**Key Contacts:**
- Website: odata.com
- Parent company: previously backed by Brookfield Infrastructure

---

## 🇨🇴 COLOMBIA

Colombia's national AI policy: COP 479B (~$115.9M) through 2030.

---

### 8. Ilkari — ILK-COL1
**Type:** Private (Sovereign DC Operator)  
**Country:** Colombia  
**Location:** Tocancipá Free Trade Zone, 40km from Bogotá

**GPU Operations:**
- Operational GPU servers for AI workloads (exact GPU count not public)
- Supports **5kW and 10kW rack densities** (higher-density configs incoming)
- **DCOS Level 4** + TIA-942-C Rated-3 + SS 564 Sustainable Data Centre certified
- ICREA Level IV (2025) — highest operational standard
- Positioned for sovereign AI, GPU-intensive and HPC workloads

**What They Do:**  
Irish-founded, Colombia-operating sovereign DC infrastructure. Focus on data sovereignty, AI workloads, and private cloud for enterprises that need to avoid hyperscaler dependency. Partnership with Huawei for sovereign DC solutions.

**Key Contacts:**
- **Shane Paterson** — CEO
- **Eduardo Espinel** — Head of Data Center
- **Juan Aguirre** — CCO
- **Viviana Castro** — Sales & Channel Manager
- Website: ilkari.tech

---

### 9. G42 Group × Colombia Government
**Type:** Government Partnership  
**Country:** Colombia  
**Program:** AI Computing Hub Initiative

**GPU Operations:**
- Agreement signed to build **AI computing hubs** for nationwide access to advanced compute
- Targets complex AI models, green energy, genomics, advanced scientific research
- Scale/GPU count not yet publicly disclosed (deal still in formation)

**What They Do:**  
UAE's G42 (major AI infrastructure group) partnering with Colombian government to build sovereign AI compute capacity. Part of Colombia's broader ColombIA Inteligente programme.

**Key Contacts:**
- Ministry of TIC Colombia (MinTIC) — via mintic.gov.co
- G42 Group (Abu Dhabi) — via g42.ai

---

## 🇨🇱 CHILE

Chile ranked **#1 in LATAM AI Readiness Index** (ILIA 2024). National AI fund: $116M over 10 years.

---

### 10. NLHPC — Leftraru / Leftraru Epu (University of Chile)
**Type:** Academic / Government  
**Country:** Chile  
**Location:** Universidad de Chile, Santiago (CMM — Center for Mathematical Modeling)

**GPU Operations:**
- **2× Lenovo ThinkSystem SR675 V3 GPU servers**, each with:
  - Dual 24-core 4th Gen AMD EPYC 9224 CPUs
  - **6× AMD Instinct MI210 GPUs** → **12 AMD MI210 accelerators total**
- 27 compute nodes with AMD EPYC 9754 (128-core) — 6,912 CPU cores
- Quadrupled compute capacity while only doubling energy use
- **AMD MOU signed Nov 2025** for long-term HPC/AI collaboration
- Collaborates with Barcelona Supercomputing Center (BSC) on LATAM initiatives

**What They Do:**  
Chile's national supercomputing center. Supports LatamGPT project (30+ institutions), breast cancer AI research (MIRAI Chile), satellite imagery processing, and climate modeling. Hosting national GPU infrastructure for scientific research.

**Key Contacts:**
- **NLHPC Director:** via nlhpc.cl or cmm.uchile.cl
- Website: nlhpc.cl

---

### 11. CENIA — National Center for Artificial Intelligence
**Type:** Government / Academic  
**Country:** Chile  
**Location:** Santiago (distributed; part of Universidad de Chile / PUC network)

**GPU Operations:**
- Coordinating national GPU procurement competition: **$7M fund** for GPU infrastructure for AI workloads
- LatamGPT project: ~30+ institutions, 60+ AI experts across LATAM
- Accessing NLHPC's GPU cluster for training

**What They Do:**  
Chile's government AI research hub. Leading LatamGPT (first LATAM large language model). Partnered with AMD, Barcelona Supercomputing Center, NLHPC. Published ILIA index ranking Chile #1 in LATAM AI readiness.

**Key Contacts:**
- Website: cenia.cl
- CAF (Development Bank of LATAM) co-funds LatamGPT

---

### 12. Universidad de Tarapacá — Instituto de Alta Investigación
**Type:** Academic  
**Country:** Chile  
**Location:** Arica (northern Chile)

**GPU Operations:**
- Planned **$10M investment** in dedicated GPU Supercomputing Center
- **12 nodes × 8 NVIDIA H200 GPUs = 96 NVIDIA H200 GPUs**
- Already procured H200 semiconductors from NVIDIA
- Will serve as **National Compute Center** for AI model training

**What They Do:**  
University-based AI compute hub. Part of Chile's CORFO/Ministry of Science program "Development and Management of a National Supercomputing Infrastructure Specialized in AI." Focus on large-scale model training for key sectors (energy, health, mining).

**Key Contacts:**
- Instituto de Alta Investigación — via uta.cl
- Ministry of Science Chile + CORFO — program funders

---

## 🇦🇷 ARGENTINA

Argentina is positioning as a future AI hub via nuclear energy ambitions, Patagonia's renewables, and foreign investment deals.

---

### 13. Servicio Meteorológico Nacional (SMN) — Clementina XXI
**Type:** Government  
**Country:** Argentina  
**Location:** Buenos Aires

**GPU Operations:**
- **296 Intel Data Center GPU Max Series (Ponte Vecchio)** accelerators
- **5,120 cores** Intel Xeon CPU Max (Sapphire Rapids HBM)
- **15.7 PFlops** — formerly LATAM's fastest supercomputer (now ~2nd after Santos Dumont upgrade)
- Built by Lenovo; funded by CAF ($4.9M, 2022)
- First LATAM deployment of Intel Xeon CPU Max + Intel Data Center GPU Max

**What They Do:**  
Argentina's national scientific supercomputer. 10% allocated to weather service; 90% shared across 21 National Science & Technology System members (CONICET and others). Used for AI research, climate modeling, materials science, public health.

**Key Contacts:**
- SMN Director — via smn.gob.ar
- CONICET partnership — via conicet.gov.ar
- Ministry of Science & Technology Argentina

---

### 14. OpenAI × Sur Energy — Patagonia Data Center (planned)
**Type:** Private (Foreign Investment)  
**Country:** Argentina  
**Location:** Patagonia (southern Argentina) — exact site TBD

**GPU Operations:**
- **500MW** planned total capacity
- Phase 1: **100MW by 2027**
- Investment: up to **$25 billion** (one of largest in Argentina's history)
- GPU count: not disclosed (will be next-gen, likely NVIDIA Blackwell-class)
- Powered by Patagonian hydroelectric + wind + potentially Vaca Muerta gas

**What They Do:**  
OpenAI's first data center in LATAM. Structured under Argentina's RIGI framework (large investment incentives). Sur Energy is part of Sur Ventures investment group.

⚠️ **Note:** Sur Ventures was led by **Matías Travizano**, who died in a mountaineering accident in California; leadership transition underway. Deal terms still being finalized.

**Key Contacts:**
- OpenAI Infrastructure — via openai.com
- Sur Ventures / Sur Energy — details limited; monitor Argentine press for updates

---

### 15. INVAP S.E. — SMR / AI Data Center Power
**Type:** Government-owned (Río Negro Province)  
**Country:** Argentina  
**Location:** Bariloche, Patagonia

**GPU Operations:**
- Not a GPU operator directly
- Developing **ACR-300 Small Modular Reactor (SMR)** — US-patented
- 4 ACR-300 reactors planned; backed by unnamed American investor
- If built: would power AI data centers with nuclear energy
- Timeline: first SMR by ~2030 (ambitious; faces technical skepticism from Argentine nuclear scientists)

**What They Do:**  
Argentina's state-owned high-tech company. Builds nuclear reactors, satellites (SAC series), radars. The SMR pivot is Milei government's strategy to attract Big Tech with clean, firm power for AI data centers.

**Key Contacts:**
- INVAP CEO/Exec — via invap.com.ar
- CNEA (National Atomic Energy Commission) — co-partner

---

## Summary Table

| # | Org | Country | Type | Est. GPU Scale | Status |
|---|-----|---------|------|----------------|--------|
| 1 | LNCC / Santos Dumont | 🇧🇷 Brazil | Gov/Research | ~400+ H100/GH200 units | Operational (2025) |
| 2 | Petrobras CENPES | 🇧🇷 Brazil | Energy Corp | 224 NVIDIA A100 (Tatu) + PFlop-class HPC | Operational |
| 3 | Elea Data Centers | 🇧🇷 Brazil | DC Operator | GW-scale planned (Rio AI City) | Building |
| 4 | Omnia / Pátria | 🇧🇷 Brazil | DC Developer | 300MW+ (TikTok deal) | Planning/Build |
| 5 | KIO Data Centers | 🇲🇽 Mexico | DC Operator | 19MW colocation | Operational |
| 6 | Foxconn (NVIDIA MFG) | 🇲🇽 Mexico | Manufacturing | 240K servers/yr output | Building |
| 7 | ODATA Mexico | 🇲🇽 Mexico | DC Operator | Not disclosed | Operational |
| 8 | Ilkari ILK-COL1 | 🇨🇴 Colombia | Sovereign DC | GPU-capable racks (small) | Operational |
| 9 | G42 × Colombia Govt | 🇨🇴 Colombia | Gov Partnership | AI compute hubs (TBD) | Planning |
| 10 | NLHPC / U. Chile | 🇨🇱 Chile | Academic | 12 AMD MI210 GPUs | Operational |
| 11 | CENIA | 🇨🇱 Chile | Gov/Academic | Via NLHPC + national fund | Active |
| 12 | U. Tarapacá | 🇨🇱 Chile | Academic | 96 NVIDIA H200 (planned) | Procurement |
| 13 | SMN / Clementina XXI | 🇦🇷 Argentina | Government | 296 Intel Ponte Vecchio | Operational |
| 14 | OpenAI / Sur Energy | 🇦🇷 Argentina | Private/Foreign | 100–500MW (TBD GPUs) | Announced |
| 15 | INVAP | 🇦🇷 Argentina | Gov-owned | SMR power (not GPU direct) | Development |

---

## Notes on "Tempest AI Brazil"

The tasking referenced "Tempest AI" as a Brazilian GPU company. Research found **no match** for this specific entity:
- **Tempest Security Intelligence** (tempest.com.br) — Brazil's largest cybersecurity firm, acquired by Embraer 2020. Not a GPU/AI cloud company.
- **Tempest AI** on LinkedIn — appears to be a small US-based gaming AI startup (2-10 employees, 2023). Not Brazilian.
- No Brazilian GPU cloud startup named "Tempest AI" was found in public sources.

Recommend: verify source of this lead — may be a misattribution or very early-stage stealth company.

---

## Sources
- Next Platform, HPCwire, Data Center Dynamics (2024–2025)
- Eviden/Atos press releases (Santos Dumont upgrade)
- Elea Data Centers official site
- Intel case study (SMN/Clementina XXI)
- AMD case study (NLHPC Chile)
- CENIA.cl, NLHPC.cl
- Rest of World, DCD (Argentina nuclear/OpenAI)
- MordorIntelligence, IMARC (market data)
- BNamericas, mexicobusiness.news (Mexico)
- ilkari.tech, colombiaone.com (Colombia)
