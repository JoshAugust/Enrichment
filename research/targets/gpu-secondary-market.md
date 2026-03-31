# GPU Secondary Market & Depreciation Intelligence

> **Purpose:** Actuarial basis for Residual Value Guarantee (RVG) insurance pricing  
> **Last Updated:** 2026-03-29  
> **Confidence:** High (multi-source corroboration from market data, broker listings, hyperscaler filings, and industry analysis)

---

## 1. Secondary Market Pricing — Current Snapshots

### NVIDIA H100 (Hopper, launched 2022)

| Condition | Price Range | vs. New ($25K–28K) |
|-----------|------------|---------------------|
| New/retail | $25,000–$28,000 | Baseline |
| Server-integrated (new) | $35,000–$40,000+ | +40–60% |
| Refurbished (<1 yr) | $18,000–$25,000 | 70–85% retention |
| Used (1–2 yr) | $12,000–$18,000 | 50–70% retention |
| Used (2+ yr) | $7,000–$12,000 | 30–50% retention |
| Peak secondary (mid-2024, supply-constrained) | ~$50,000 | 180%+ of new |

**Key data point:** CoreWeave's H100s from 2022 contract expirations immediately rebooked at **95% of original pricing** (Dec 2025), demonstrating strong inference-demand floor.

### NVIDIA A100 (Ampere, launched 2020)

| Variant | Secondary Price | vs. Original New |
|---------|----------------|------------------|
| A100 40GB | $8,000–$12,000 | ~50–65% of $15K+ new |
| A100 80GB | $12,000–$18,000 | ~50–70% of $25K+ new |

- A100 prices fell **more sharply** than H100 in mid-2025 corrections — more liquid, broader market
- Saw a **resale price increase** in early 2024 coinciding with LLM adoption wave (counter-cyclical spike)
- Still fully booked at CoreWeave for inference workloads

### NVIDIA V100 (Volta, launched 2017)

| Variant | Purchase Price | Cloud Rental |
|---------|---------------|--------------|
| V100 16GB | ~$1,500–$3,000 (used) | $0.14–$3.06/hr |
| V100 32GB | ~$2,000–$4,000 (used) | $2.02–$2.95/hr |

- Stabilized at low levels; still serves edge inference, video transcoding, education
- Budget cloud providers offer V100 from $0.10/hr/GPU

### NVIDIA T4 (Turing, launched 2018)
- Secondary pricing stabilized at **$700–$800** range
- Valued for low power consumption, small form factor, acceptable inference performance
- Suitable for edge deployments, video transcoding, entry-level workstations

### Cloud Rental Price Collapse (Leading Indicator for Hardware Values)

| GPU | Peak Rental (2024) | Current (2025–26) | Drop |
|-----|-------------------|-------------------|------|
| H100 | $8–$10/hr | $2.85–$3.50/hr | **64–75%** |
| A100 80GB | ~$4–$5/hr | $1.29–$2.50/hr | **50–68%** |
| B200 | — | $3.79/hr (Lambda) | Declining rapidly |

AWS reduced H100 pricing ~30% in June 2025, triggering broader market reset. **300+ new GPU cloud providers** entered market in 2025.

---

## 2. Historical Depreciation Curves

### General Data Center GPU Depreciation Timeline

| Period | Phase | Value Retention | Key Driver |
|--------|-------|----------------|------------|
| Months 0–12 | Premium | 85–100%+ | Supply constraints, peak demand |
| Months 12–18 | Stable decline | 70–85% | Market normalizes |
| Months 18–24 | **Sharp depreciation** | 30–50% | Next-gen available with 2–4x perf |
| Months 24–36 | Stabilization at floor | 20–35% | Finds niche (inference, budget AI, education) |
| Months 36–72 | Long tail | 10–25% | Batch workloads, edge, specialized use |

### Value Cascade Model (Workload Waterfall)

GPUs don't become worthless — they cascade down the value chain:

1. **Years 1–2:** Frontier model training (highest performance requirements)
2. **Years 3–4:** High-value real-time inference (previous-gen suffices)
3. **Years 5–6:** Batch inference, analytics, edge workloads

This cascade is the strongest argument for extended useful life and sustained residual values.

### Refurbished vs. Used Premium
- Refurbished H100s consistently command **15–25 percentage point premiums** over used equivalents
- Refurbished units stayed in the mid-80% range vs. new pricing through 2024–2025
- Used units showed **higher volatility** and steeper discounts

### Counter-Cyclical Price Spikes
- A100 saw **price appreciation** in early 2024 during LLM adoption surge
- H100s traded at **~$50K** (180% of new) during mid-2024 supply constraints
- **RVG implication:** Residual values are not monotonically declining — demand shocks can create temporary appreciation

---

## 3. Major GPU Brokers, Resellers & Marketplaces

### Tier 1: Enterprise-Grade Resellers

| Company | Focus | Notable |
|---------|-------|---------|
| **Alta Technologies** | Refurbished NVIDIA GPUs (H100, A100, H200) | 30+ years enterprise IT reuse; multi-point inspection; in-stock inventory |
| **Brightstar Systems** | Refurbished NVIDIA datacenter GPUs | 1-year warranty, free global shipping |
| **Renewtech** | Refurbished GPU servers (Dell, Supermicro, NVIDIA) | ISO-certified facility in Denmark; European broker network |
| **NetEquity** | GPU buyback, trade-in, consignment remarketing | H100/A100 specialist; certified engineer testing |
| **Park Place Technologies / Curvature** | Third-party data center maintenance & pre-owned hardware | Acquired Curvature in 2021; maintenance 55–90% below OEM; more traditional DC hardware than pure GPU |
| **PCSP (PC Server & Parts)** | Refurbished graphics cards | Broad inventory |
| **Unix Surplus** | Used GPUs | Data center decommission specialists |

### Tier 2: OEM Certified Refurbished Programs

| Vendor | Program | Pricing vs. New | Warranty |
|--------|---------|-----------------|----------|
| **Dell** | Certified refurbished GPU servers | 30–40% below new | 1–2 years |
| **HPE** | Certified refurbished GPU servers | 30–40% below new | 1–2 years |
| **Supermicro** | Certified refurbished GPU servers | 30–40% below new | 1–2 years |

### Tier 3: Marketplace & Exchange Platforms

| Platform | Type | Risk Level |
|----------|------|-----------|
| **Compute Exchange** | Reserved GPU marketplace | Low-Medium |
| **GPUnex** | GPU buying/selling platform | Medium |
| **SellGPU** | Consumer/enterprise GPU buyback | Medium |
| **BuyBackWorld** | ITAD company, direct GPU buyer | Low-Medium |
| **eBay / Alibaba** | Grey market | **High** (counterfeits, no warranty, firmware locks) |

### Tier 4: ITAD (IT Asset Disposition) Firms
- Specialized in handling data center decommissions
- Aggregate inventory from multiple sellers
- 20–30% savings vs. certified refurbished
- Provide limited warranties and provenance verification

### Notable Absence: ITRenew
- ITRenew (now part of **Iron Mountain**) focuses primarily on data center decommissioning and lifecycle management
- More focused on bulk hardware disposal/recycling than GPU-specific resale
- Not a major player in the GPU resale market specifically

---

## 4. Generational Transition Impact on Pricing

### NVIDIA Architecture Cadence

| Architecture | Launch | Key GPU | Successor Gap |
|-------------|--------|---------|---------------|
| Volta | 2017 | V100 | 3 years to Ampere |
| Turing | 2018 | T4 | 2 years to Ampere |
| Ampere | 2020 | A100 | 2 years to Hopper |
| Hopper | 2022 | H100/H200 | 2 years to Blackwell |
| Blackwell | 2024 | B200/GB200 | ~1 year to Rubin (announced) |
| **Rubin** | **2026 (expected)** | **R-series** | Accelerating cadence |

**Critical trend:** NVIDIA has shifted from a **2-year** to potentially **1-year** architecture cadence post-Blackwell. This acceleration compresses depreciation windows.

### Historical Price Impact of New Generations

| Transition | Impact on Previous Gen | Timeline |
|------------|----------------------|----------|
| A100 → H100 | A100 declined ~40–50% over 12 months | 2022–2023 |
| H100 → Blackwell (B200) | Expected 10–20% H100 price reduction on GA (Q1 2026) | 2025–2026 |
| H100 → Rubin | Expected **sharp** H100 depreciation (late 2026–2027) | Projected |

### Selling Timing Guidance (from market participants)
- **Optimal:** Sell 6–12 months **before** expected successor launch
- **Worst:** Sell immediately **after** successor launch
- **Counterpoint:** Inference demand sustains value for previous-gen longer than training-focused analysis suggests

---

## 5. H100 → H200 → Blackwell Transition (Current State)

### H100 Price Trajectory
- **Mid-2024 peak:** ~$50,000 (secondary market, supply-constrained)
- **Late 2024:** $25,000–$30,000 (normalizing)
- **2025:** $18,000–$25,000 (declining as Blackwell ramps)
- **2026 (current):** $18,000–$22,000 (stabilizing before Rubin)

### B200 Impact
- B200 GA expected Q1 2026
- Lambda Labs offering B200 at $3.79/hr on-demand
- Analysts predict **50–70% further price declines** for B200 over next 6–12 months
- Each B200 price drop exerts downward pressure on H100 secondary values

### Jensen Huang's Quip
> "When Blackwell ships, you couldn't give Hoppers away."

**Reality check:** This hasn't materialized. Inference demand sustains H100 value. CoreWeave's experience (95% rebooking) suggests the market disagrees with Jensen's joke.

### H200 Positioning
- H200 (Hopper refresh with HBM3e) occupies a middle ground
- Less secondary market data available — relatively short production run
- Expected to depreciate faster than H100 as Blackwell scales

### Rubin Wildcard (Late 2026–2027)
- H100 depreciation expected to **accelerate sharply** when Rubin arrives
- Rubin reportedly offers another generational leap
- This is the biggest near-term risk factor for H100 residual values

---

## 6. Published Research & Analysis on GPU Lifecycle Economics

### Key Publications

1. **"How Long Do GPUs Last Anyway?"** — Applied Conjectures (Substack)
   - Deep analysis of hyperscaler depreciation policies and GPUaaS unit economics
   - Shows T4, V100, A100 resale data from Camelcamelcamel with actual price curves
   - Demonstrates depreciation curves flatten/stabilize rather than going to zero
   - URL: appliedconjectures.substack.com

2. **"The Illusion of Stability: Unpacking H100 GPU Market Value Trends"** — Silicon Data
   - Tracks H100 market value over time
   - Documents refurbished vs. used premium dynamics
   - URL: silicondata.com

3. **"Resetting GPU Depreciation — Why AI Factories Bend, But Don't Break, Useful Life Assumptions"** — theCUBE Research (Breaking Analysis #298)
   - Industry analysis of depreciation policy changes
   - Value cascade model framework
   - URL: thecuberesearch.com

4. **"$2 H100s: How the GPU Bubble Burst"** — Latent Space (Eugene Cheah)
   - Tracks rental price collapse
   - Market dynamics of oversupply
   - URL: latent.space

5. **"The $1 Trillion GPU Question: How Fast Do AI Chips Lose Value"** — TechBuzz
   - Overview of the depreciation debate
   - URL: techbuzz.ai

6. **"GPU Depreciation Strategies: Optimizing Asset Lifecycles"** — Introl Blog
   - Practical guide to asset lifecycle optimization
   - URL: introl.com

7. **"Secondary GPU Markets: Buying and Selling Used AI Hardware"** — Introl Blog (Dec 2025)
   - Most comprehensive single source on secondary market dynamics
   - Pricing data, acquisition strategies, due diligence checklists
   - URL: introl.com

8. **"Depreciation of GPUs: Between Useful Lives and Useful Myths"** — Deep Quarry (Substack)
   - Academic-style analysis of depreciation assumptions
   - URL: deepquarry.substack.com

### The Hyperscaler Depreciation Debate

| Company | Current Policy | Trajectory | Financial Impact |
|---------|---------------|------------|-----------------|
| **Microsoft** | 6-year useful life | Extended from 4 years | Nadella: "didn't want to get stuck with 4-5 years on one generation" |
| **Google** | 6-year useful life | Extended from 3-4 years | "Servers could be useful for up to 6 years" |
| **Meta** | 5.5-year useful life | Extended from 4→4.5→5→5.5 years | Jan 2025 extension booked $2.9B depreciation reduction |
| **Amazon** | **5-year useful life** (reduced) | Extended to 6 then **reduced back to 5** | Cited "increased pace of AI/ML development" |
| **CoreWeave** | 6-year useful life | Consistent | A100s from 2020 still fully booked |

**Collective impact:** Extended useful life saved hyperscalers **~$18B annually** on $300B+ CapEx. Actual 2024 estimates suggest collective depreciation reduced from $39B to $21B — a **46% reduction**.

### Michael Burry's Contrarian View
- Argues actual server lifespan is **2–3 years**
- Claims hyperscalers are **overstating useful life** and **understating depreciation**
- If correct, hyperscaler earnings are materially overstated
- If 2-year depreciation applied: incremental depreciation would be **7–22% of 2024 EBITDA** for major hyperscalers

---

## 7. NVIDIA Trade-In / Buyback Programs

### Official NVIDIA Programs
- **No formal NVIDIA-branded trade-in program** exists for data center GPUs
- NVIDIA historically ran a consumer "Trade-Up Program" (GeForce) but it was limited and discontinued
- NVIDIA's approach is to let third-party ecosystem handle secondary market

### Third-Party Trade-In Ecosystem

| Company | Service | Model |
|---------|---------|-------|
| **NetEquity** | Buyback, trade-in, consignment remarketing | Cash or credit; H100/A100 specialist |
| **Alta Technologies** | Buy & sell, trade-in credit | Fair market pricing; cash or trade-in credit |
| **BuyBackWorld** | Professional ITAD, direct buyer | Consumer and enterprise GPU |
| **SellGPU** | Online GPU buyback | Consumer-focused, some enterprise |
| **Newegg** | Trade-In Program | Consumer GPUs |
| **Micro Center** | GPU Trade-In Program | Consumer only; refurbished units **not eligible** |

### Enterprise Disposal Channels
- OEM partners (Dell, HPE, Supermicro) sometimes offer trade-in credits toward new purchases
- ITAD firms handle bulk decommissioning
- Direct enterprise-to-enterprise sales within industry networks (no broker margins)

---

## 8. RVG Insurance — Actuarial Implications

### Key Findings for Pricing

1. **Depreciation is NOT linear.** Steep drop at 18–24 months (generational transition), then floor stabilization. RVG policies should model a kinked curve, not straight-line.

2. **Value cascade extends useful life.** The training→inference→batch waterfall means GPUs retain 20–35% value even at 3+ years. This is the residual value floor for most scenarios.

3. **Refurbished premium is real and consistent.** 15–25 percentage points above used — relevant for distinguishing policy tiers (RVG on refurbished vs. used equipment).

4. **Counter-cyclical demand spikes occur.** LLM adoption waves and supply crunches can temporarily *increase* GPU values. Policies should account for potential appreciation events.

5. **Generational transition risk is the dominant variable.** The shift from 2-year to potentially 1-year NVIDIA architecture cadence is the single biggest risk factor for residual values.

6. **Cloud rental prices are a leading indicator.** Hardware resale values follow rental price trends with a 3–6 month lag.

7. **CoreWeave's 95% rebooking rate** provides empirical evidence for the "inference floor" — even 3-year-old H100s retain near-full utility for inference workloads.

8. **Amazon reducing useful life back to 5 years** (from 6) is a bearish signal from the most data-rich hyperscaler — they're seeing faster obsolescence in practice.

### Suggested RVG Pricing Parameters

| Risk Factor | Low Risk | Medium Risk | High Risk |
|-------------|----------|-------------|-----------|
| Policy term | ≤18 months | 18–36 months | 36+ months |
| GPU generation | Current (Blackwell) | Previous (Hopper) | N-2 or older (Ampere) |
| Condition | Certified refurbished | Used (tested) | Grey market |
| Workload tier | Inference-optimized | Training | Unspecified |
| Guaranteed floor | 60–80% of purchase | 30–50% of purchase | 15–30% of purchase |

### Key Risk: Accelerating Architecture Cadence
- NVIDIA moving from 2-year to 1-year release cycles
- Each new generation delivers 2–4x performance improvement
- This compresses the "safe window" for RVG policies
- **Recommendation:** RVG policies on current-gen hardware should price in generational transition within 12–18 months, not 24

---

## Sources & References

1. Introl Blog — "Secondary GPU Markets: Buying and Selling Used AI Hardware" (Dec 2025)
2. Silicon Data — "The Illusion of Stability: Unpacking H100 GPU Market Value Trends"
3. Silicon Data — "A100 vs H100: When GPU Prices Break Out of Sync"
4. Applied Conjectures — "How Long Do GPUs Last Anyway?" (Substack)
5. theCUBE Research — "Resetting GPU Depreciation" (Breaking Analysis #298)
6. Latent Space — "$2 H100s: How the GPU Bubble Burst"
7. CNBC — "The question everyone in AI is asking: How long before a GPU depreciates?" (Nov 2025)
8. Deep Quarry — "Depreciation of GPUs: between useful lives and useful myths"
9. cast.ai — "2025 GPU Price Report"
10. Jarvislabs — "NVIDIA H100 Price Guide 2026"
11. GPUnex — "Buying or Selling GPUs in 2026"
12. Thunder Compute — "AI GPU Rental Market Trends" (Mar 2026)
13. Stanley Laman — "Why GPU Useful Life Is the Most Misunderstood Variable in AI Economics"
14. TechBuzz — "The $1 Trillion GPU Question"
