# VC Portfolio Mining — GPU/AI Infrastructure Companies

**Compiled:** 2026-03-29 | **Method:** Portfolio page scraping + web search across 12 VC firms  
**Purpose:** Identify GPU/AI infrastructure portfolio companies; flag NEW ones not in MASTER-COMPANIES.md (~230 companies)

---

## EXECUTIVE SUMMARY

**VCs Scanned:** 12  
**Total GPU/AI Infrastructure Companies Found:** 32  
**Already in Master List:** 13  
**🆕 NEW Companies (not in Master List):** 19  

The richest veins were **DCVC** (4 new finds), **Playground Global** (2 new), **Lux Capital** (2 new), **a16z** (2 new), and **Valor Equity** (2 new). Coatue and Magnetar mostly doubled down on known names (CoreWeave, Scala). Construct Capital and Valar Ventures had **zero** direct GPU/AI infrastructure plays.

---

## NEW COMPANIES — NOT IN MASTER LIST 🆕

### Tier 1: High Relevance (GPU Cloud / Compute Infrastructure)

| Company | VC Investor(s) | What They Do | Funding | Why It Matters |
|---------|---------------|--------------|---------|----------------|
| **SF Compute** 🆕 | DCVC, Wing VC | GPU compute marketplace — buy/sell GPU-hours; sublease unused capacity | $40M Series A; $300M valuation | Liquidity layer for GPU compute; manages $100M+ hardware; H100/H200/B300 |
| **TensorWave** 🆕 | AMD Ventures, Maverick Capital | AMD MI300X GPU cloud — alternative to NVIDIA neocloud ecosystem | $45M SAFE; AMD-backed | Only major AMD-focused GPU cloud; differentiator in NVIDIA-dominated market |
| **Nexthop AI** 🆕 | a16z, Lightspeed, Kleiner Perkins | Custom AI data center networking for hyperscalers | $610M total ($110M seed + $500M Series B); $4.2B valuation | Founded by Arista COO; direct competitor to Arista in AI DC networking |
| **Scala Data Centers** 🆕 | Coatue, DigitalBridge, IMCO | LATAM's largest AI-ready data center platform (Brazil) | $500M from Coatue+IMCO; 1GW+ capacity | Building "AI City" in Brazil (54MW Phase 1); liquid cooling; AI training workloads |

### Tier 2: High Relevance (Semiconductor / Chip Alternatives)

| Company | VC Investor(s) | What They Do | Funding | Why It Matters |
|---------|---------------|--------------|---------|----------------|
| **Unconventional AI** 🆕 | a16z, DCVC, Lux Capital, Sequoia | Neuromorphic analog compute — 1000x more energy-efficient than GPUs | $475M seed; $4.5B valuation | Naveen Rao (ex-MosaicML/Databricks); could disrupt GPU dependency for inference |
| **Mythic** 🆕 | DCVC | Analog compute-in-memory chips — 100x energy advantage over GPUs | $125M (Dec 2025) | 9 years in development; production-ready; targets inference at the edge and DC |
| **d-Matrix** 🆕 | Playground Global, Temasek, QIA | AI inference chip platform (digital in-memory compute) | $450M total; $2B valuation | "Corsair" platform; direct GPU alternative for inference; Samsung/Ericsson/SK Hynix backing |
| **Snowcap Compute** 🆕 | Playground Global | Superconducting compute platform — 25x perf/watt vs GPUs | $23M seed (Jun 2025) | Uses Josephson Junctions at 4.5K; Pat Gelsinger as Board Chair; first chip by end 2026 |
| **Substrate** 🆕 | Founders Fund, General Catalyst, In-Q-Tel | X-ray lithography for semiconductor manufacturing (ASML/TSMC alternative) | $100M seed; $1B+ valuation | Could fundamentally change chip manufacturing economics; US onshoring play |
| **Cognichip** 🆕 | Lux Capital, Mayfield | Physics-informed AI for semiconductor design (75% cost reduction) | $33M seed (2025) | AI-driven chip design acceleration; indirect GPU infrastructure enabler |
| **Enfabrica** 🆕 | Valor Equity, NVIDIA, Spark Capital | AI SuperNIC — 3.2 Tbps networking chip for GPU clusters | $290M total; Series C | Connects GPUs across scale-out networks; 4x bandwidth of any competing NIC |

### Tier 3: Supporting Infrastructure (Energy / DC Optimization)

| Company | VC Investor(s) | What They Do | Funding | Why It Matters |
|---------|---------------|--------------|---------|----------------|
| **Torus** 🆕 | Magnetar Capital | Modular flywheel-battery power plants for data centers | $200M from Magnetar | 1GW/quarter manufacturing target; PacifiCorp 500MW MOU; AI load smoothing |
| **Emerald AI** 🆕 | Radical Ventures, CRV | AI software to orchestrate DC workloads for grid-responsive energy management | $24.5M | Makes DCs flexible grid assets; reduces electricity demand during peak stress |
| **CentML** 🆕 | Radical Ventures, Google, NVIDIA | ML compiler optimization — reduces GPU compute costs/time for training & inference | $3.5M seed (expanded) | Maximizes GPU utilization; Vector Institute / UofT roots |
| **Fervo Energy** 🆕 | DCVC | Advanced geothermal power for data centers | $462M raised | Clean baseload power specifically for AI infrastructure |
| **Radiant Nuclear** 🆕 | DCVC | Portable 1MW SMR (small modular reactor) for remote power | $300M raised | First new nuclear design tested at Idaho National Lab; DC power source |
| **ElectronX** 🆕 | DCVC | Electricity derivatives exchange | $30M raised | Creates liquidity in power markets critical for compute infrastructure |

### Tier 4: Adjacent / Narrow Relevance

| Company | VC Investor(s) | What They Do | Funding | Why It Matters |
|---------|---------------|--------------|---------|----------------|
| **WEKA** 🆕 | Valor Equity | AI-optimized data platform / parallel file system for GPU workloads | Fund VI investment | Storage layer for GPU clusters; not a GPU operator but tightly coupled |
| **CHAOS Industries** 🆕 | Valar Ventures, Valor Equity, 8VC | Defense sensing/radar distributed networks (CDN) | $1B total; $4.5B valuation | Not GPU infrastructure per se, but massive compute + sensing hardware; defense vertical |

---

## ALREADY KNOWN — Companies in Master List

| Company | VC Investor(s) Found | Status in Master |
|---------|---------------------|-----------------|
| **CoreWeave** | Coatue (led $1.1B Series C), Magnetar (30% owner, led $7.5B debt) | 🔴 S-tier (95pts) |
| **Crusoe Energy** | Founders Fund (led Series D), Valor Equity (Series E co-lead), NVIDIA | 🔴 S-tier (90pts) |
| **Lambda Labs** | (no new VC from this scan) | 🟠 1-tier (85pts) |
| **Together AI** | Lux Capital | 🟡 2-tier (70pts) |
| **Nebius Group** | (no new VC from this scan; Accel/NVIDIA/Orbis known) | 🟠 1-tier (80pts) |
| **FluidStack** | (no new VC from this scan) | 🟡 2-tier (75pts) |
| **Vultr** | (no new VC from this scan) | 🟡 2-tier (70pts) |
| **xAI / VCI** | Valor Equity ($5.4B VCI fund), a16z, Sequoia | 🟠 1-tier (80pts) |
| **Magnetar Capital** | (investor, not investee) | Listed as Private Credit |
| **Coatue Management** | (investor, not investee) | Listed as Private Credit |
| **Valor Equity Partners** | (investor, not investee) | Listed as Private Credit |
| **DCVC** | (investor, not investee) | Not listed (VC, not lender) |
| **Blackstone** | (co-led CoreWeave $7.5B w/ Magnetar) | Listed as Private Credit |

---

## VC-BY-VC BREAKDOWN

### 1. Radical Ventures 🍁
**Focus:** AI-first VC (Toronto/SF/London) | $2.5B AUM | 76 portfolio companies  
**GPU/AI Infra Finds:**
- 🆕 **CentML** — ML compiler optimization; maximizes GPU utilization
- 🆕 **Emerald AI** — AI-powered DC energy orchestration
- Also has $250K GPU compute credit program for early-stage startups
- Portfolio skews to AI applications (Cohere, Waabi, World Labs), not infrastructure

### 2. Coatue Management 💰
**Focus:** Crossover hedge/growth fund | $50B+ AUM  
**GPU/AI Infra Finds:**
- ✅ **CoreWeave** — Led $1.1B Series C (May 2024); participated in $650M secondary
- 🆕 **Scala Data Centers** — $250M structured financing for LATAM AI data centers
- Coatue is a financing counterparty, not pure VC; primarily known CoreWeave exposure

### 3. a16z (Andreessen Horowitz) 🏗️
**Focus:** Premier tech VC | Multi-stage  
**GPU/AI Infra Finds:**
- 🆕 **Nexthop AI** — $500M Series B; custom AI DC networking (a16z participated)
- 🆕 **Unconventional AI** — $475M seed; neuromorphic compute (a16z co-led)
- ✅ **xAI** — Series B ($6B) and Series C ($6B) participant
- a16z infrastructure portfolio is heavily model-layer (Mistral, Character.ai) vs. hardware

### 4. Founders Fund 🇺🇸
**Focus:** Thiel-founded deep tech/defense VC  
**GPU/AI Infra Finds:**
- ✅ **Crusoe Energy** — Led $600M Series D (Dec 2024); participated in $1.375B Series E
- 🆕 **Substrate** — $100M seed; X-ray lithography semiconductor manufacturing
- Strong conviction in AI infrastructure via Crusoe; Substrate is adjacent (chip manufacturing)

### 5. Lux Capital 🔬
**Focus:** Deep tech / frontier science VC  
**GPU/AI Infra Finds:**
- 🆕 **Unconventional AI** — Participated in $475M seed (neuromorphic compute)
- 🆕 **Cognichip** — Co-led $33M seed; AI for semiconductor design
- ✅ **Together AI** — GPU cloud (infrastructure layer)
- Also invested in Rigetti (quantum), Luxtera (optical, acquired by Cisco)
- Thesis: "next-gen clusters need 300-500K chips at ~1GW" — investing in what replaces GPUs

### 6. Eclipse Ventures ⚡
**Focus:** Industrial/defense deep tech | $3B+ AUM  
**GPU/AI Infra Finds:**
- **No direct GPU/AI compute infrastructure companies found**
- Portfolio focuses on industrial (Hadrian, Fortera, Machina Labs) and defense
- May have unlisted/stealth investments not discoverable via public portfolio pages

### 7. Playground Global 🎮
**Focus:** Deep tech (Pat Gelsinger is GP) | Frontier hardware  
**GPU/AI Infra Finds:**
- 🆕 **Snowcap Compute** — Led $23M seed; superconducting compute platform (25x perf/watt)
- 🆕 **d-Matrix** — Led $44M Series A; AI inference chip ($450M total raised, $2B valuation)
- Strong AI hardware thesis; Pat Gelsinger connection makes this a semiconductor incubator

### 8. Construct Capital 🏗️
**Focus:** Foundational industries (manufacturing, logistics, defense, energy) | $750M AUM  
**GPU/AI Infra Finds:**
- **No direct GPU/AI infrastructure companies found**
- Portfolio is industrial automation (Hadrian, Chef Robotics, Veho)
- Energy investments (Aetherflux, ChargeLab) don't target DC power specifically
- Not a relevant VC for GPU infrastructure sourcing

### 9. DCVC 🧬
**Focus:** Deep tech / compute-driven science | $1B+ recent funds  
**GPU/AI Infra Finds:**
- 🆕 **SF Compute** — Co-led $40M Series A; GPU compute marketplace
- 🆕 **Mythic** — Led $125M; analog compute-in-memory chips (100x energy advantage)
- 🆕 **Unconventional AI** — Participated in $475M seed
- 🆕 **Fervo Energy** — $462M; geothermal power for DCs
- 🆕 **Radiant Nuclear** — $300M; portable SMR for DCs
- 🆕 **ElectronX** — $30M; electricity derivatives exchange for compute power markets
- **Richest VC for new finds** — DCVC's thesis directly targets compute infrastructure + its power sources

### 10. Valor Equity Partners 💪
**Focus:** Growth equity + infrastructure funds | $55B AUM  
**GPU/AI Infra Finds:**
- ✅ **Crusoe Energy** — Initial investor (2020); co-led $1.375B Series E at $10B+
- ✅ **xAI / VCI** — $5.4B VCI fund for GB200 GPU acquisition (Apollo $3.5B debt)
- 🆕 **Enfabrica** — Series B investor; AI SuperNIC semiconductor
- 🆕 **WEKA** — Fund VI investment; AI data platform for GPU workloads
- Also invested in CHAOS Industries ($1B; defense sensing), Tesla, SpaceX
- Valor is the **GPU sale-leaseback pioneer** via VCI structure

### 11. Magnetar Capital 🧲
**Focus:** Alt credit / hedge fund | $22.8B AUM  
**GPU/AI Infra Finds:**
- ✅ **CoreWeave** — ~30% owner; led $7.5B debt facility w/ Blackstone; Series B lead
- 🆕 **Torus** — $200M investment; modular power plants for DCs
- $235M AI Ventures Fund with dedicated CoreWeave GPU cluster for portfolio companies
- Magnetar's strategy: CoreWeave equity + debt + GPU-as-equity for early-stage investments
- **Invented the GPU-backed debt playbook**

### 12. Valar Ventures 💸
**Focus:** Fintech-primary VC (Thiel-founded) | $300M Fund IX  
**GPU/AI Infra Finds:**
- 🆕 **CHAOS Industries** — $1B total (defense sensing networks); tangential to compute
- **No direct GPU/AI infrastructure investments found**
- Portfolio is overwhelmingly fintech (Wise, N26, Qonto)
- Not a relevant VC for GPU infrastructure sourcing

---

## CROSS-REFERENCE: VCs SHARING PORTFOLIO COMPANIES

Several GPU/AI infra companies appear across multiple of these 12 VCs:

| Company | VCs from This Scan |
|---------|-------------------|
| **Crusoe Energy** | Founders Fund, Valor Equity, NVIDIA |
| **xAI / VCI** | Valor Equity, a16z |
| **CoreWeave** | Coatue, Magnetar |
| **Unconventional AI** | a16z, DCVC, Lux Capital |
| **CHAOS Industries** | Valar Ventures, Valor Equity |

---

## RECOMMENDATIONS

### Immediate Adds to Master List (High Priority)
1. **SF Compute** — GPU marketplace; DCVC-backed; direct infrastructure play
2. **Nexthop AI** — $4.2B AI networking; a16z-backed; critical GPU cluster component
3. **Enfabrica** — AI SuperNIC; NVIDIA + Valor-backed; GPU cluster networking semiconductor
4. **Scala Data Centers** — LATAM AI DC; Coatue $500M; 1GW+; building AI City Brazil
5. **d-Matrix** — AI inference chip; $2B valuation; Playground Global + Temasek
6. **TensorWave** — AMD-focused GPU cloud; differentiator vs NVIDIA ecosystem

### Watch List (Earlier Stage / Adjacent)
7. **Unconventional AI** — Neuromorphic compute; $4.5B valuation but pre-product
8. **Mythic** — Analog compute chips; 100x efficiency; DCVC-led $125M
9. **Snowcap Compute** — Superconducting; Playground Global; very early (first chip 2026)
10. **Substrate** — Chip manufacturing disruption; Founders Fund; could reshape GPU supply chain
11. **Torus** — DC power; Magnetar-backed; 1GW/quarter manufacturing target
12. **WEKA** — GPU cluster storage layer; Valor Fund VI

### Not Relevant for GPU Infra Targeting
- Construct Capital — Industrial automation VC, no GPU plays
- Valar Ventures — Fintech VC, no GPU plays
- Eclipse Ventures — Industrial/defense, no discoverable GPU plays

---

*Last updated: 2026-03-29 03:30 PDT*
