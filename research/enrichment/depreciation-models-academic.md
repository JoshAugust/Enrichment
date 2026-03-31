# Technology Asset Depreciation Models: Academic & Industry Literature Review

> **Purpose:** Actuarial basis for Residual Value Guarantee (RVG) pricing on GPU and semiconductor assets.
> **Compiled:** 2026-03-29

---

## Table of Contents

1. [GPU Depreciation Curves — Published Research & Market Data](#1-gpu-depreciation-curves)
2. [Moore's Law & Hardware Value Over Time](#2-moores-law--hardware-value-over-time)
3. [Industry Analyst Reports — Gartner, IDC, Forrester](#3-industry-analyst-reports)
4. [Accounting Standards — ASC 360 & IAS 16](#4-accounting-standards)
5. [Hyperscaler Useful-Life Models](#5-hyperscaler-useful-life-models)
6. [Actuarial & Financial Papers on Residual Value Risk](#6-actuarial-papers-on-residual-value-risk)
7. [Historical Server/Compute Depreciation Patterns](#7-historical-depreciation-patterns)
8. [Implications for RVG Pricing](#8-implications-for-rvg-pricing)
9. [Key Sources & Bibliography](#9-bibliography)

---

## 1. GPU Depreciation Curves

### Empirical Market Data (NVIDIA H100 / A100)

**H100 Price Trajectory:**
| Period | New Price | Used/Resale | Rental ($/hr) |
|--------|-----------|-------------|----------------|
| Mid-2023 | ~$40,000 | $40,000+ (scarce) | $4.70+ |
| Mid-2024 | ~$30,000–35,000 | ~$50,000 (peak used) | ~$3.06 |
| Mid-2025 | ~$25,000–30,000 | $22,000–28,000 | ~$2.36 |
| Early 2026 | ~$25,000 | $18,000–22,000 | ~$2.10 |

- **Used H100 peak-to-trough:** ~$50K → $18K–22K = **56–64% decline** in ~18 months
- **Rental rates:** $4.70 → $2.10 = **55% decline** from 2023 peak
- H100 depreciation accelerates sharply after ~2 years of service, counter to the more gradual A100 pattern

**A100 Secondary Market:**
- 40GB variants: $8,000–12,000 (from $15,000+ new) → ~47–20% residual
- 80GB variants: $12,000–18,000 (from $25,000+ new) → ~48–72% residual
- A100 prices fell more sharply than H100 in mid-2025 corrections due to broader, more liquid secondary market

**Key Finding:** GPU depreciation is **non-linear and generation-dependent**. A new architecture release (e.g., B200 expected Q1 2026) triggers 10–20% immediate price reduction in predecessor hardware. This makes GPU residual value fundamentally different from traditional server hardware.

### The "Value Cascade" Model

A framework proposed by industry analysts suggests GPUs have an economic life that extends beyond their primary use:

1. **Tier 1 (Years 0–2):** Cutting-edge training workloads — highest value
2. **Tier 2 (Years 2–4):** Inference and fine-tuning — profitable but lower margin
3. **Tier 3 (Years 4–6):** Edge inference, development, academic use — lowest margin

The "value cascade" argument gives GPUs an economic life 2–3× longer than their primary training role. This is the theoretical basis hyperscalers use to justify 5–6 year depreciation schedules.

**Counter-argument (Michael Burry et al.):** Actual useful life for high-utilization datacenter GPUs is 1–3 years. The cascade model overstates residual value because each tier has dramatically lower revenue potential, and next-gen hardware competes on both performance and efficiency.

### Sources
- Silicon Data: "H100 Rental Price Over Time 2023–2025" (silicondata.com)
- Silicon Data: "H100 GPU Market Value Trends" (silicondata.com)
- Introl: "Secondary GPU Markets: Buying and Selling Used AI Hardware" (introl.com)
- Princeton CITP Blog: "AI Chip Lifespans: A Note on the Secondary Market" (Dec 2025)
- TheCUBE Research: "Resetting GPU Depreciation" (Nov 2025)
- Stanley Laman: "Why GPU Useful Life Is the Most Misunderstood Variable in AI Economics"

---

## 2. Moore's Law & Hardware Value Over Time

### Economic Framework

**Kenneth Flamm, "Measuring Moore's Law: Evidence from Price, Cost, and Quality Indexes" (NBER Working Paper 24553, 2018)**
- Most-cited academic work on semiconductor depreciation economics
- Documented **20–30% annual decline** in cost per transistor during Moore's Law era
- The acceleration in semiconductor progress contributed to a surge in U.S. productivity growth (3.4% p.a. in 1997–2004 vs 1.6% in other periods)

**Key Findings from Academic Literature:**

1. **Depreciation as innovation proxy:** The depreciation rate of the semiconductor industry shows a clear declining trend after 2000 — consistent with a slowing rate of innovation (Flamm, 2018)
2. **Fab lifetime extension:** Contrary to expectations, fab lives have *increased* as Moore's Law slows — older 200mm fabs are being "reawakened" for production
3. **PC replacement cycles:** Extended from ~4 years to longer as Moore's Law deceleration reduces the performance delta between generations (Intel CEO Brian Krzanich, 2016)
4. **Physical contribution to productivity:** 11.74–18.63% of productivity growth during 1960–2019 attributable to physical changes in electronic component size (NY Fed Staff Report 970)

### Implications for GPU Depreciation

Moore's Law is **not directly applicable** to GPU depreciation in the AI era because:
- GPU performance gains are driven by architecture, not just transistor shrinks
- Demand-side dynamics (AI training needs) create artificial scarcity/surplus cycles
- Software ecosystem lock-in (CUDA) creates non-Moore's-Law value retention
- However, the general principle that **performance doubles on a predictable cadence** still applies — NVIDIA's ~2-year generation cycle (A100 → H100 → B200 → next) creates a rhythmic obsolescence pattern

### Sources
- Flamm, K. (2018) "Measuring Moore's Law: Evidence from Price, Cost, and Quality Indexes" NBER WP 24553
- NY Fed Staff Report 970: "Moore's Law and Economic Growth"
- National Academies Press: "Moore's Law and the Economics of Semiconductor Price Trends"
- Yoo (2015) "Moore's Law, Metcalfe's Law, and the Theory…" Colorado Technology Law Journal

---

## 3. Industry Analyst Reports

### Gartner

- **Server Lifecycle Guidance:** Most organizations should refresh server hardware every 3–5 years
- **Predictive lifecycle management** can reduce total IT costs by up to 30%
- Data-driven procurement saves up to 30% by avoiding unnecessary purchases
- Gartner Peer Community confirms 5-year common lifecycle as of 2022 (was 3 years in 2015)

### IDC

- Hardware costs have risen ~15% YoY since 2022, forcing strategic upgrade planning
- Companies with structured lifecycle plans experience:
  - **25% lower IT operating costs**
  - **40% fewer unplanned outages**
- IDC data shows shift toward longer retention as hardware reliability improves

### Forrester

- Network infrastructure refresh: typically every 3–5 years
- Trend toward extending refresh cycles as costs increase

### Statista (Survey Data)

- In 2020: **42% of respondents** refreshed data center servers every 2–3 years; 26% every year
- This has shifted significantly post-2022 toward longer cycles

### Key Data Point for RVG
> **On average, 40% of server hardware deployed at enterprise data centers is more than 3 years old.** Organizations retain aging hardware for ~4 years on average. Server reliability data shows most hardware is reliable for **10+ years** — the refresh driver is performance/efficiency, not failure.

---

## 4. Accounting Standards

### ASC 360 (US GAAP) — Property, Plant and Equipment

- **Cost model only** (no revaluation option under US GAAP)
- PPE carried at historical cost minus accumulated depreciation and impairment losses
- **Two-step impairment test:**
  1. Recoverability test: compare undiscounted expected cash flows to carrying value
  2. If failed: impairment loss = carrying value – fair value
- Must disclose depreciation method for each class of long-lived assets
- Technology firms must test for impairment after rapid innovation cycles

### IAS 16 (IFRS) — Property, Plant and Equipment

- Choice between **cost model** and **revaluation model**
- Depreciation method must reflect pattern of economic benefit consumption
- **Reducing balance method** recommended when benefits decline over time (explicitly cited for computers, machinery)
- Impairment testing per IAS 36 uses a single-step approach based on cash-generating units (CGUs)
- Recoverable amount = higher of fair value less costs to sell, and value in use

### Key Differences Relevant to RVG

| Feature | ASC 360 (US GAAP) | IAS 16 (IFRS) |
|---------|-------------------|----------------|
| Valuation model | Cost only | Cost or Revaluation |
| Impairment test | Two-step (undiscounted CF then FV) | One-step (recoverable amount) |
| Reversal of impairment | Not permitted | Permitted (up to original cost) |
| Depreciation pattern | Must reflect benefit consumption | Must reflect benefit consumption |

### IRS Treatment
- Servers classified as 5-year MACRS property (7-year useful life per IRS guidelines)
- Many organizations elect 5-year straight-line for financial reporting

### Relevance to RVG
The standards **do not prescribe** specific useful lives for GPU/server hardware — they require management judgment. This creates the latitude that hyperscalers exploit (extending from 4 to 6 years) and simultaneously creates the risk environment where an RVG product has value: if the accounting useful life diverges from economic useful life, the residual value gap is exactly the risk being priced.

### Sources
- CPCON Group: "ASC 360 Compliance Guide"
- IFRS Community: "Depreciation of PP&E and Intangibles (IAS 16 / IAS 38)"
- TFA Geeks: "Accounting for PPE: IAS 16 / ASC 360"
- EY: "Impairment or Disposal of Long-Lived Assets" (2025)
- NJCPA: "ASC 360: Impairment of Property Plant & Equipment"

---

## 5. Hyperscaler Useful-Life Models

### Current Depreciation Schedules (as of early 2026)

| Company | Useful Life | Prior Schedule | Change Date | Annual Savings |
|---------|-------------|----------------|-------------|----------------|
| **Microsoft** | 6 years | 4 years | Q4 FY2022 | ~$3.7B (FY2023) |
| **Google/Alphabet** | 6 years | 4 years | 2023 | ~$3.0B (2023) |
| **Amazon/AWS** | 5 years (reverted) | 6 years (briefly) | Feb 2025 | ~$1B/quarter saved at 6yr |
| **Meta** | 5.5 years | 4–5 years | FY2025 | ~$2.9B reduction in depreciation |
| **Oracle** | 6 years | — | — | — |

### The Divergence Debate

**Amazon (shortening to 5 years, Feb 2025):** Explicitly cited "rapid pace of AI and machine-learning innovation" — the opposite direction from Meta's extension. This is the strongest signal that 6-year useful life may be aggressive for AI-specific hardware.

**Michael Burry's critique:** Companies are overstating GPU useful life and understating depreciation. His estimate: **actual useful life of 2–3 years** for server equipment running AI workloads.

### What Models Support Extended Life?

1. **Value Cascade Model:** GPUs transition from training → inference → edge over time (see Section 1)
2. **Custom Silicon Argument:** Hyperscalers design infrastructure around specific GPU generations; their workloads are optimized differently than merchant market
3. **Power/Cooling Efficiency:** A GPU running inference at 40% utilization in year 5 still generates positive ROI if infrastructure costs are already sunk
4. **Software Optimization:** Inference frameworks improve over time, extracting more performance from older hardware

### What Models Challenge Extended Life?

1. **Performance/Watt Improvement:** Each new GPU generation offers 2–3× performance/watt improvement. Running old GPUs becomes uneconomical even if functional
2. **Opportunity Cost:** Datacenter space, power, and cooling consumed by old GPUs could host new-gen hardware with better economics
3. **Workload Evolution:** Model architectures evolve rapidly; hardware optimized for transformer training may be suboptimal for future architectures
4. **Secondary Market Data:** Actual resale values decline 50%+ in first 2 years (see Section 1), suggesting the accounting life diverges from economic life

### Sources
- The Register: "Microsoft extends life of cloud servers to six years" (Aug 2022)
- Computer Weekly: "Microsoft anticipates $3.3bn savings by extending server life"
- CNBC: "The question everyone in AI is asking: How long before a GPU depreciates?" (Nov 2025)
- MBI Deep Dives: "Big Tech's Deteriorating Earnings Quality"
- Behind the Balance Sheet: "AI and Server Lives"
- Data Center Frontier: "Meta Will Run its Servers For Up to 5 Years"
- Yahoo Finance: "Meta Accounting Move on AI Servers to Boost Profit This Year"

---

## 6. Actuarial & Financial Papers on Residual Value Risk

### Key Academic Literature

**1. Pirotte, H. & Speder — "Residual value risk in the leasing industry: A European case"**
- Published in *The European Journal of Finance*, Vol 14, No 2
- Examined 4,828 individual lease contracts from 1990–2001 (automotive)
- Estimated loss-given-default distributions using resampling techniques
- Produced probability density functions and Value-at-Risk measures for residual value losses
- **Relevance:** The methodology (VaR-based residual value risk) is directly transferable to GPU fleet risk assessment

**2. Rode, D., Fischbeck, P., & Dean, S. — "Residual Risk and the Valuation of Leases under Uncertainty and Limited Information"**
- Published in *Journal of Structured and Project Finance* 7:4 (2002): 37–49
- Carnegie Mellon University CEIC Working Paper 02-02
- Framework using plausible, internally consistent models and simulation of future states
- Formally extends traditional lease valuation models to incorporate uncertainty effects
- **Relevance:** Provides the mathematical framework for pricing uncertainty in residual value — exactly the model needed for RVG

**3. Kolber, V.A. (1985) — "Residual Value Insurance: A Risk Management Tool for the Leasing Industry"**
- Published by Equipment Leasing & Finance Foundation
- **Key insight: Residual Value Insurance (RVI) is equivalent to a put option**
- This establishes that RVG pricing can use option pricing theory (Black-Scholes or variants)
- The RVG seller is effectively writing a put option on the asset's future value

**4. BEA Depreciation Research (Oliner, 1993; Hulten-Wykoff)**
- BEA's geometric depreciation rates for computers and peripheral equipment based on Oliner (1993)
- Most assets follow geometric decline; empirical used-asset-price studies confirm this
- Equipment declining-balance rate: **1.65** (Hulten-Wykoff)
- Published at: apps.bea.gov/national/pdf/BEA_depreciation_rates.pdf
- **Note:** Computers/peripherals excluded from standard geometric formula — BEA uses empirical profiles based on actual resale market data
- Federal Reserve paper: "How Fast Do Personal Computers Depreciate? Concepts and New Estimates" (FEDS 2004-31)

### Residual Value Risk — Definition & Quantification

**Formal definition:** Residual value risk is the possibility that a lease asset can only be resold or re-leased at a price below its residual value — i.e., the difference between the residual value set at inception and the lower salvage value realized upon disposal.

**Three valuation approaches for residual value:**
1. **Market approach:** Based on comparable transactions (most relevant for GPUs given active secondary market)
2. **Cost approach:** Replacement cost minus obsolescence
3. **Income approach:** Discounted future cash flows from the asset

**Key characteristic for technology assets:** IT equipment generally retains less residual value due to rapid obsolescence. Technology experiences advancement that quickly makes older models obsolete, resulting in lower residual values compared to other equipment classes.

### Gap in Literature

There is a notable **absence of published actuarial papers specifically on technology/GPU residual value risk**. The existing literature focuses on:
- Automotive leasing (Pirotte & Speder)
- General equipment leasing (Kolber, Rode et al.)
- Real estate (extensive)

This represents both a **risk** (no established actuarial tables) and an **opportunity** (first-mover advantage for anyone who builds a proprietary model).

---

## 7. Historical Depreciation Patterns

### Server Hardware Market Value Depreciation

| Age | Typical Residual Value (% of original) | Source |
|-----|----------------------------------------|--------|
| Year 0 | 100% | — |
| Year 1 | ~50% | Industry practitioner rule of thumb |
| Year 2 | ~25% | Geometric decline pattern |
| Year 3 | 5–10% | WebHostingTalk survey / practitioner data |
| Year 4+ | ~0–5% | Negligible resale value |

**Key data point:** "Industry practitioners count on servers losing about 50% of their value per year" — this implies a geometric decline rate significantly steeper than accounting depreciation.

### Accounting vs. Market Depreciation Gap

| Metric | Accounting (Straight-line 5yr) | Market (Geometric) |
|--------|-------------------------------|-------------------|
| Year 1 residual | 80% | ~50% |
| Year 2 residual | 60% | ~25% |
| Year 3 residual | 40% | 5–10% |
| Year 4 residual | 20% | ~2–5% |
| Year 5 residual | 0% | ~0–2% |

**This gap is the core risk that an RVG product insures against.** An entity carrying servers at 40% book value in year 3 faces a potential impairment of 30–35% of original cost if forced to dispose at market rates.

### GPU-Specific Depreciation (Emerging Data)

Based on H100/A100 market data (see Section 1):
- **Year 0–1:** Scarcity premium may exceed original cost (anomalous period 2023)
- **Year 1–2:** Rapid decline (~40–50%) as supply normalizes
- **Year 2–3:** Continued decline (~20–30%) as next-gen launches
- **Year 3+:** Stabilization at ~30–40% of original for inference-capable hardware

GPU depreciation is fundamentally different from generic server depreciation because:
1. **Architecture-gated obsolescence:** Value drops discretely at new architecture launches, not continuously
2. **Workload-dependent value:** Training value declines faster than inference value
3. **Supply/demand cycles:** Scarcity during AI booms creates non-monotonic price curves
4. **Software ecosystem:** CUDA lock-in provides floor value that other hardware lacks

---

## 8. Implications for RVG Pricing

### Core Pricing Framework

Based on the literature, an RVG for GPU assets should be priced as:

**RVG Premium = f(Put Option Value, Obsolescence Risk, Generation Cycle, Utilization, Supply/Demand)**

Where:
1. **Put Option Component** (Kolber, 1985): RVG ≈ put option on future asset value. Can be priced using modified Black-Scholes with:
   - Strike price = guaranteed residual value
   - Underlying = expected market value at lease end
   - Volatility = historical GPU price volatility (very high — see H100 data)
   - Time to expiry = lease term

2. **Obsolescence Risk Factor:** Must account for discrete drops at architecture transitions (~2-year cycle). This is not captured by standard geometric depreciation models. Suggest a **jump-diffusion model** (Merton, 1976) to capture both continuous depreciation and architecture-shock jumps.

3. **Generation Cycle Position:** An RVG issued in year 1 of a GPU generation has different risk profile than one issued in year 2 (next-gen launch imminent).

4. **Utilization Adjustment:** High-utilization training workloads degrade hardware faster than inference. Utilization-based adjustments to expected residual value are essential.

### Suggested Actuarial Model Structure

```
Expected Loss = Σ P(market_value < guaranteed_value) × (guaranteed_value - E[market_value | market_value < guaranteed_value])

Where:
- Market value follows jump-diffusion process
- Jump component calibrated to GPU architecture release cycle (~2 years)
- Diffusion component calibrated to secondary market price data
- Correlation with broader AI demand cycle incorporated
```

### Risk Factors to Price

| Risk Factor | Measurable? | Data Source |
|-------------|-------------|-------------|
| Architecture obsolescence | Yes (2yr cycle) | NVIDIA roadmap + historical |
| Supply/demand imbalance | Partially | Cloud rental indices (SiliconData) |
| Workload evolution | Difficult | Qualitative assessment |
| Physical degradation | Yes | Datacenter failure rate data |
| Software ecosystem shift | Difficult | CUDA market share |
| Regulatory (export controls) | Event-driven | Geopolitical assessment |

### Key Pricing Insight

The **accounting-to-market depreciation gap** (Section 7) represents the maximum theoretical loss on an RVG. For a 3-year GPU RVG:
- Accounting book value at year 3: ~40% (straight-line 5yr)
- Expected market value at year 3: ~10–30% (depending on generation timing)
- **Maximum expected loss: 10–30% of original asset value**
- But actual loss distribution is fat-tailed due to architecture jumps

---

## 9. Bibliography

### Academic Papers
1. Flamm, K. (2018). "Measuring Moore's Law: Evidence from Price, Cost, and Quality Indexes." NBER Working Paper 24553.
2. Pirotte, H. & Speder. "Residual value risk in the leasing industry: A European case." *The European Journal of Finance*, 14(2).
3. Rode, D., Fischbeck, P., & Dean, S. (2002). "Residual Risk and the Valuation of Leases under Uncertainty and Limited Information." *Journal of Structured and Project Finance*, 7(4): 37–49.
4. Kolber, V.A. (1985). "Residual Value Insurance: A Risk Management Tool for the Leasing Industry." Equipment Leasing & Finance Foundation.
5. Oliner, S. (1993). Constant-quality price change, depreciation, and retirement of mainframe computers. (Basis for BEA computer depreciation estimates.)
6. Hulten, C.R. & Wykoff, F.C. "The Measurement of Economic Depreciation." (Declining-balance rate of 1.65 for equipment.)
7. Federal Reserve (2004). "How Fast Do Personal Computers Depreciate? Concepts and New Estimates." FEDS 2004-31.
8. NY Fed Staff Report 970: "Moore's Law and Economic Growth."

### Government / Standards
9. BEA. "BEA Depreciation Estimates." apps.bea.gov/national/pdf/BEA_depreciation_rates.pdf
10. FASB ASC 360: Property, Plant and Equipment.
11. IASB IAS 16: Property, Plant and Equipment.
12. IASB IAS 36: Impairment of Assets.
13. BLS Working Papers (2021). "Alternative capital asset depreciation rates for U.S. capital and total factor productivity measures."

### Industry / Analyst
14. Gartner Peer Community. "Server Lifecycle: How does the industry consider lifecycle of server hardware?"
15. IDC. Hardware cost and lifecycle management reports (2022–2025).
16. Statista. "Data center server replacement frequency 2020."
17. TheCUBE Research (Nov 2025). "Resetting GPU Depreciation — Why AI Factories Bend, But Don't Break, Useful Life Assumptions."

### Market Data & Analysis
18. Silicon Data. "H100 Rental Price Over Time (2023–2025)." silicondata.com
19. Silicon Data. "H100 GPU Market Value Trends." silicondata.com
20. Introl. "Secondary GPU Markets: Buying and Selling Used AI Hardware." introl.com
21. Princeton CITP Blog (Dec 2025). "AI Chip Lifespans: A Note on the Secondary Market."
22. CNBC (Nov 2025). "The question everyone in AI is asking: How long before a GPU depreciates?"
23. MBI Deep Dives. "Big Tech's Deteriorating Earnings Quality."
24. Deep Quarry (Substack). "Depreciation of GPUs: between useful lives and useful myths."
25. Tom's Hardware. "GPU depreciation could be the next big crisis coming for AI hyperscalers."

### Accounting Analysis
26. Deloitte DART. "Amounts That It Is Probable That the Lessee Will Owe Under a Residual Value Guarantee."
27. PwC Viewpoint. "Sales of equipment with guaranteed minimum resale amount."
28. IFRS Foundation (2011). "Lessor accounting — Residual value guarantees."
29. EY (2025). "Impairment or disposal of long-lived assets."
30. Hudson Labs. "Accounting policy changes boost tech earnings."

---

*This document supports the actuarial basis for RVG pricing. The key takeaway: GPU residual value risk is characterized by high volatility, discrete architecture-driven jumps, and a significant gap between accounting book value and market value — all of which create a well-defined, priceable risk for an insurance/guarantee product.*
