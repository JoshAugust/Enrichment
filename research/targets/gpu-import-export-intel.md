# GPU Import/Export Intelligence — Nvidia AI Chips 2023–2025

*Research compiled: March 2026*  
*Sources: industry analyst reports (Omdia, TechInsights, TrendForce), news investigations, U.S. government disclosures, enforcement actions*

---

## 1. GLOBAL VOLUME OVERVIEW

| Year | Total Nvidia DC GPU Shipments | Notes |
|------|-------------------------------|-------|
| 2022 | ~2.64M units | Baseline |
| 2023 | ~3.76M units | 98% data center market share; $36.2B revenue |
| 2024 | ~3.5–4M Hopper units | Transition to Hopper + early Blackwell |
| 2025 | 1.5–2.5M Blackwell (GB200) | Sold out through mid-2026; backlog 3.6M+ |

- Nvidia held **98% market share** in AI data center GPU revenue in 2023
- H100 spot pricing reached **2–3× list price** in China black market throughout 2023–2024
- H100: ~$30,000 list; traded as high as $40,000+ on secondary markets

---

## 2. KNOWN LARGE BUYERS — BY REGION

### 🇺🇸 UNITED STATES (Hyperscalers)

**2023 — H100 GPU recipients (est., Omdia/analyst data):**

| Company | Est. H100s Received (2023) |
|---------|-----------------------------|
| Microsoft | ~150,000 |
| Meta | ~150,000 |
| Google | ~50,000 |
| Amazon (AWS) | ~50,000 |
| Oracle | ~50,000 |

- Meta's first H100 training cluster: **24,000 H100 SXM5** GPUs disclosed publicly
- Lead times stretched to **52 weeks** in Q3 2023 due to demand
- Q3 2023 alone: ~500,000 A100/H100 units sold; Meta cited as largest single-quarter driver

**2024 — Hopper GPU recipients (Omdia estimates):**

| Company | Est. Hopper GPUs Ordered (2024) |
|---------|----------------------------------|
| Microsoft | ~485,000 (largest buyer) |
| ByteDance | ~230,000 (H20 variant) |
| Meta | ~224,000 |
| Tesla + xAI (combined) | ~200,000 |
| Amazon (AWS) | ~196,000 |
| Google | ~169,000 |
| Tencent | ~230,000 (H20 variant) |

- Amazon and Google notably lower than expected — both ramping custom silicon (Trainium, TPU)
- ByteDance and Tencent received **H20** — a China-compliant downgrade of H100

**2025 — Blackwell GB200 Buyers:**

| Company | Est. GB200 Order |
|---------|------------------|
| Google | 400,000+ GB200s (~$10B deal) |
| Meta | 360,000 GB200s (~$8–10B) |
| Microsoft | 55,000–65,000 GB200 ready for OpenAI (Q1 2025) |
| AWS | Taking GB200 NVL72 instances from Dec 2024 |
| Oracle | All major hyperscalers buying at NVL72 rack scale |

- Customers ordering in **100,000-GPU quantities** (up from tens of thousands for Hopper)
- Major hyperscalers deploying **~1,000 NVL72 racks/week** in 2025

---

### 🇨🇳 CHINA (H20 — Export-Control Compliant Variant)

**Context:** H20 is a twice-downgraded H100 (H800 → H20), modified to comply with U.S. export control thresholds.

| Company | Activity |
|---------|----------|
| ByteDance | Stockpiled ~100B yuan (~$13.7B) worth of chips; most aggressive pre-restriction buyer |
| Alibaba | Raised H20 purchases substantially; buying from ByteDance stockpile resale |
| Tencent | Raised H20 purchases substantially |
| Baidu | Known buyer; scaled H20 orders pre-ban |
| DeepSeek | Alleged recipient of smuggled H100/H20 chips via Singapore (see enforcement section) |

**Key events:**
- **~1 million H20 units** shipped to China in 2024 for $12B+ revenue
- Jan 2025: DeepSeek's R1 model release triggers panic buying — ByteDance, Alibaba, Tencent rushed to stockpile ~1M chips (full year supply)
- **April 2025:** Trump administration requires licenses for H20 exports → several $B shipped before cutoff
- **Late 2025:** Trump admin reportedly lifts/relaxes some H20 ban → Nvidia resumes some sales

---

### 🇸🇬 SINGAPORE (Major anomaly / diversion hub)

**Billing vs. delivery discrepancy — major red flag:**

| Metric | Figure |
|--------|--------|
| Singapore share of Nvidia revenue (FY2025 billing) | ~18–28% (~$23.7B billed) |
| Singapore share of Nvidia revenue by actual delivery | <2% |
| Singapore Nvidia revenue (FY2023) | $2.3B |
| Singapore Nvidia revenue (FY2025) | $23.7B (10× growth in 2 years) |

- Nvidia's explanation: Singapore used as **centralized invoicing hub** by US-based customers; 99% of AI chips billed via Singapore are for US customers, shipped elsewhere
- Critics: Electric grid capacity insufficient to run chips allegedly "in use" in Singapore

---

### 🌏 SOUTHEAST ASIA — Diversion Operations

#### Megaspeed International (Singapore)
- **Background:** Spin-off of Chinese gaming firm 7Road (state-linked via investors)
- **Scale:** Imported **$4.6B+ worth of Nvidia hardware**, **136,000+ GPUs** — single largest SEA buyer
- **Red flag:** >50% of volume is newest Blackwell chips; Nvidia in-person inspection found **only "a few thousand" Blackwell chips on site**
- **BIS inspection (late 2024):** Found Nvidia servers still **sealed in crates** at Malaysian data center — consistent with re-export staging
- **Status:** Under investigation by U.S. Commerce/BIS and Singapore Police Force (2024–2025)
- **Source:** Bloomberg (Dec 2025), CNBC (Oct 2025)

#### Aperia Cloud Services (Singapore)
- Three executives charged with **fraud** for misrepresenting final destination of servers containing Nvidia chips
- Servers rerouted from Malaysia to undisclosed locations

#### ALX Solutions (California-based, Chinese-national-operated)
- Chuan Geng + Shiwei Yang used CA company to export restricted H100 + RTX 4090 GPUs to China via Singapore/Malaysia intermediaries
- A 2023 invoice for **$28.4M** falsely declared a Singapore customer that didn't exist at stated address

#### Operation Gatekeeper
- U.S. enforcement disrupted ring buying Nvidia chips via **straw purchasers**, stripping manufacturer labels, re-exporting to China
- Singapore police **raided 22 locations**, arrested **9 individuals**; three charged (2 Singaporean nationals, 1 Chinese citizen) with fraud
- Case reportedly linked to **DeepSeek** obtaining restricted chips

---

### 🇮🇳 INDIA

| Company | Deal | Scale |
|---------|------|-------|
| Yotta (data center operator) | H100 + H200 GPU deployment | 32,000 GPUs by 2025 (~$1B deal) |
| Tata Group | AI supercomputer with GH200 | Tens of thousands of H100s |
| Reliance Industries | Partnered with Nvidia; GH200 "superchips" | Undisclosed volume |

- Nvidia specifically pivoted India as alternative market after China export controls blocked H100 sales
- India GPU server market growing rapidly with government AI push

---

### 🇯🇵 JAPAN

- GPU server market: **¥15B (2023)** → projected ¥95B by 2028
- SoftBank Vision Fund, NTT, and government-backed projects are major GPU acquirers
- Japan has been a priority market for Nvidia's non-China Asia strategy

---

### 🇸🇦 SAUDI ARABIA

| Entity | Deal | GPU Count | Value |
|--------|------|-----------|-------|
| HUMAIN (PIF subsidiary) | Strategic partnership (May 2025) | ~240,000 GB300 GPUs through 2028; initial 18,000 GB300 | ~$7B total deal |
| SDAIA (Saudi Data & AI Authority) | Sovereign AI factory | Up to 5,000 Blackwell GPUs | Part of broader deal |
| HUMAIN (Trump admin approval, Nov 2025) | Direct GPU sale authorization | Up to 35,000 GB300 equivalent | ~$1B tranche |

- Saudi Crown Prince MBS visited Washington (Nov 2025) → accelerated approvals
- HUMAIN target: supply **6% of global AI compute power by 2034**
- 500MW capacity planned; 1GW Stargate cluster in negotiation

---

### 🇦🇪 UAE

| Entity | Deal | GPU Count | Value |
|--------|------|-----------|-------|
| G42 (Abu Dhabi AI firm) | Microsoft investment ($1.5B) + export license | 21,500 deployed (A100 eq.) + 60,400 additional (incl. GB300) | Part of $7.3B Microsoft UAE spend |
| G42 (Trump admin approval, Nov 2025) | Direct authorization | Up to 35,000 GB300 equivalent | ~$1B tranche |

- G42 CEO confirmed first advanced AI chip shipments expected **"within months"** (late 2025)
- Planned: 200MW initial Stargate cluster, scaling to 1GW
- Prior concern: UAE-China AI collaboration deepening; risk chips transit to China

---

### 🇶🇦 QATAR

- Nvidia partnered with **Ooredoo** (Qatar telecom) for AI data centers across Middle East (June 2024)
- First major Nvidia Middle East deployment after U.S. tightened export controls

---

## 3. EXPORT CONTROL TIMELINE

| Date | Action |
|------|--------|
| Oct 2022 | Biden admin imposes initial export controls on A100/H100 to China |
| Aug 2023 | Additional licensing requirements for Middle East (unnamed countries); A100/H100 restricted |
| Oct 2023 | Commerce Dept. adds multiple Middle East countries to license-required list |
| May 2024 | Biden broadens restrictions — special licenses required for advanced chips to most Middle East nations (incl. Saudi Arabia, UAE) |
| Apr 2025 | Trump admin imposes H20 license requirement → Chinese companies rush to pre-buy |
| May 2025 | Nvidia-HUMAIN Saudi Arabia deal announced during Trump trip |
| Nov 2025 | Trump admin approves G42 (UAE) and HUMAIN (KSA) chip sales — 35,000 GB300 each |
| Sep 2025 | Microsoft receives Commerce Dept. license for 60,400 additional chips to G42/UAE |
| Mar 2026 | Super Micro co-founder Yih-Shyan Liaw arrested; $2.5B diversion indictment |

---

## 4. MAJOR ENFORCEMENT ACTIONS

### Super Micro / Yih-Shyan Liaw Indictment (March 2026)
- **Defendants:** Yih-Shyan "Wally" Liaw (Supermicro co-founder), Ruei-Tsang "Steven" Chang, Ting-Wei "Willy" Sun
- **Charges:** Conspiring to violate export control laws; smuggling; conspiracy to defraud the U.S.
- **Scale:** ~$2.5 billion in Nvidia AI chip servers diverted to China
- **Method:** Southeast Asia pass-through company placed orders appearing legitimate; servers shipped Taiwan → SEA company → stripped of packaging → unmarked boxes → China. **Dummy servers** used during inspections
- **Status:** Liaw arrested in California, released on bail; Chang at large (Taiwan); Supermicro stock -33% on news

### Operation Gatekeeper
- Broke up ring using straw purchasers + label stripping to ship Nvidia GPUs to China
- Multi-agency operation; specific companies not yet named publicly

### Megaspeed Investigation (ongoing, 2024–2026)
- $4.6B in Nvidia hardware imported vs. minimal on-site evidence
- Both BIS and Singapore Police investigating

---

## 5. TRADE DATA SOURCES & METHODOLOGY NOTES

### Open/Commercial Sources
- **Volza:** Tracks 20,085+ Nvidia import shipments and 8,687+ export shipments (as of 2025). Includes buyer, supplier, pricing, quantity, port data.
- **Panjiva / ImportGenius:** Compile from 30+ customs databases covering 10M+ businesses. GPU-specific records may be suppressed/redacted under export control sensitivity.
- **Omdia:** Primary analyst source for per-customer GPU order estimates; methodology = public capex, server shipment data, supply chain intelligence.
- **TechInsights / TrendForce:** Semiconductor shipment volume analysis.

### Key Caveat
Actual customs records for restricted semiconductors are often **redacted or withheld** from public trade databases per U.S. export control regulations. Most unit-level buyer data is analyst inference, not confirmed customs manifests.

---

## 6. SIGNALS & PATTERNS FOR FURTHER INVESTIGATION

1. **Singapore billing anomaly** — ~18–28% of Nvidia revenue billed in Singapore but <2% physically shipped there. Which US-based customers centralize invoicing in Singapore, and why?

2. **Megaspeed customer base** — 136,000+ GPUs imported, only thousands confirmed on-site. Where are the rest? End-user verification incomplete per U.S. investigators.

3. **Chinese government-linked investors** in nominally "clean" SEA data center companies (Megaspeed / 7Road / state-linked cloud firms) — pattern of using offshore vehicles to launder GPU access.

4. **H20 resale market** — Tencent, Alibaba reportedly buying H20s from **ByteDance's stockpile**, suggesting secondary market for these restricted chips forming within China.

5. **Super Micro supply chain** — Indictment implicates unnamed Southeast Asian pass-through company. Identity not yet public; may involve other Supermicro channel partners in region.

6. **DeepSeek chip access** — U.S. officials probing whether DeepSeek obtained restricted H100/H200 chips via Singapore intermediaries. Singapore arrests (Feb 2025) explicitly linked to this probe.

7. **Gulf re-export risk** — UAE and Saudi Arabia approved for advanced GPUs but prior concern about China collaboration. Strict security requirements reportedly attached to Nov 2025 approvals.

---

## 7. SOURCES / CITATIONS

- Bloomberg (Dec 2025): Megaspeed investigation
- CNN / CNBC (Mar 2026): Supermicro/Liaw indictment  
- Tom's Hardware: Ongoing GPU export control coverage
- Data Center Dynamics: Shipment volume reports
- Omdia (via multiple outlets): Per-customer order estimates 2023–2024
- TechInsights: 3.76M unit 2023 shipment figure
- Nvidia official newsroom: HUMAIN/Saudi deal; G42/UAE
- U.S. Senate Banking Committee: Senators Warren/Banks letter on export license review
- Fortune Asia (Feb 2025): Singapore arrests / DeepSeek link
- The Register: Export control timeline
- CNBC (Nov 2025): Trump admin Gulf approvals
- Volza.com: Commercial trade data tracking

---

*File: research/targets/gpu-import-export-intel.md*  
*Status: Initial research complete. Recommend follow-up on Megaspeed beneficial ownership, Supermicro SEA pass-through company identity, and H20 secondary market flows.*
