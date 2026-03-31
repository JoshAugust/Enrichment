# GPU Supply Chain Risks & Residual Value Implications

> Intelligence brief for Corgi's actuarial modelling. These supply chain dynamics are the exogenous factors that make GPU residual values fundamentally different from traditional IT asset depreciation.

---

## 1. TSMC Concentration Risk

### The Single Point of Failure
- **TSMC produces >90% of the world's most advanced semiconductors.** Every major AI GPU — NVIDIA, AMD, Google TPU — depends on TSMC fabrication.
- Taiwan imports **97% of its energy**. The island's entire semiconductor ecosystem is characterised by acute energy dependence, limited material stockpiles, and unprecedented fab concentration.
- **Polymarket estimated a 16% probability** of a military clash between Taiwan and China in 2025 — high enough that Berkshire Hathaway reversed its entire TSMC position within months of buying it.

### What Happens If TSMC Has Issues
- **Immediate supply shock**: No alternative fab can produce leading-edge AI chips at scale. Intel Foundry and Samsung are years behind on advanced nodes.
- **Pricing surge on existing hardware**: Any disruption to new GPU supply would send secondary market prices for current-gen GPUs through the roof — exactly the dynamic that supports residual values.
- **Insurance relevance**: A TSMC disruption is a tail risk that *increases* the value of insured assets. Corgi's actuarial models should account for this asymmetry — catastrophic supply events don't destroy GPU value, they inflate it.

### Diversification Efforts (Slow)
- TSMC Arizona fab (N4 process) is ramping but won't match Taiwan's advanced packaging ecosystem for years.
- Samsung and Intel are attempting to compete on advanced nodes but neither has qualified for NVIDIA's highest-tier products.

---

## 2. US Export Controls on AI Chips

### The Regulatory Landscape
- The Biden administration's **"AI Diffusion Rule"** (January 2025) established a three-tier global framework dividing countries by GPU access levels.
- Trump administration later modified: eased Middle Eastern access, tightened enforcement against China, then reversed to allow conditional sales (H20, MI308) with a **15% revenue-sharing arrangement** with the US government.
- BIS expanded controls in 2024 to include advanced packaging equipment, HBM, DRAM, and added **140 PRC entities** to the Entity List.

### Impact on Secondary Markets
- **Massive black market emerged**: CNAS estimates **10,000 to several hundred thousand AI chips** were smuggled to China in 2024 alone.
- **Operation Gatekeeper**: $160M+ worth of H100/H200 GPUs allegedly smuggled via "ant parade" networks — individuals carrying 1-2 GPUs as "personal gaming hardware."
- **China dependency**: ~75% of chips powering AI training in Chinese data centers run on NVIDIA's CUDA platform. NVIDIA shipped 1M+ export-compliant H20 chips to China since late 2024.

### Residual Value Implications
- **Export controls create artificial scarcity** in restricted markets, inflating secondary market prices for controlled chips.
- **Geographic arbitrage**: GPUs in unrestricted markets maintain premium pricing because of the demand pressure from restricted regions.
- **Regulatory risk cuts both ways**: Loosening controls could flood secondary markets; tightening could create further price support. Corgi's models need a regulatory scenario variable.
- Even NVIDIA acknowledges that "sales of older generation products on the secondary market are subject to strict scrutiny," meaning controlled chips retain a compliance premium.

---

## 3. NVIDIA's Accelerated Release Cadence

### The Roadmap (4 Architectures in 4 Years)
| Architecture | Timeline | Key Specs |
|---|---|---|
| **Hopper** (H100/H200) | 2022-2023 | 80GB HBM3/HBM3e, 4nm |
| **Blackwell** (B100/B200/GB200) | 2024-2025 | 192GB HBM3e, 4nm, NVL72 racks |
| **Rubin** (VR200) | H2 2026 | 288GB HBM4, 50 PFLOPS FP4 |
| **Rubin Ultra** | H2 2027 | 4 chiplets/socket, 1TB HBM4e, 100 PFLOPS FP4 |
| **Feynman** | 2028 | 3D stacking, HBM4e/HBM5, NVLink-8 |

NVIDIA has committed to an **annual architecture cadence** — this is the single biggest driver of accelerated obsolescence.

### Obsolescence Dynamics
- **Each generation delivers ~2-3× performance uplift**, making previous-gen hardware less competitive for frontier training workloads within 12-18 months.
- **But performance isn't the whole story**: Previous-gen GPUs cascade into inference, batch processing, and edge workloads — creating a **value cascade model**:
  - Years 1-2: Frontier training
  - Years 3-4: Inference and fine-tuning
  - Years 5-6: Batch workloads and secondary markets

### The Actuarial Angle
- Traditional IT depreciation assumes gradual, predictable decline. NVIDIA's annual cadence means **step-function depreciation** aligned with new architecture launches.
- Historical pattern: B200 general availability (expected Q1 2026) will pressure H100 secondary values by **10-20%** — this is the "new-gen discount" that kicks in predictably.
- **Supply constraints on NEW hardware actually slow this depreciation** — if Blackwell is supply-constrained, Hopper retains value longer because buyers can't get the new stuff.

---

## 4. CoWoS Packaging Bottlenecks

### The New Choke Point
- **CoWoS (Chip-on-Wafer-on-Substrate)** is the advanced packaging process that integrates HBM memory alongside GPU dies. Without it, raw wafer output is meaningless.
- TSMC CEO C.C. Wei confirmed: **"CoWoS capacity is very tight and remains sold out through 2025 and into 2026."**
- Even as TSMC doubles wafer output, **packaging capacity is the binding constraint** on AI chip shipments.

### Capacity Numbers
| Year | Monthly CoWoS Capacity | Status |
|---|---|---|
| 2024 | ~37,500 wafers/month | Fully booked |
| 2025 | ~75,000 wafers/month (2× increase) | Fully booked |
| 2026 (target) | 120,000-130,000 wafers/month | Still expected to be tight |

### NVIDIA's Lock on Capacity
- **NVIDIA has secured 60-70%+ of total CoWoS capacity** for 2025-2026, booking 800,000-850,000 wafers for 2026 alone.
- Only **three companies** (TSMC, ASE-SPIL, Amkor) handle the bulk of cutting-edge packaging globally.
- Competitors (AMD, Broadcom, Google) are scrambling for the remainder or exploring Intel's EMIB/Foveros as alternatives.

### Residual Value Impact
- **Packaging bottleneck = constrained new supply = price support for existing hardware.** This is the most direct mechanism supporting residual values.
- If any hiccup hits a major packaging site, it could bottleneck global AI hardware supply overnight.
- This constraint is **structural, not cyclical** — expanding CoWoS capacity requires years of capital investment and qualification.

---

## 5. HBM Memory Supply Constraints

### The Memory Wall
- **All three HBM manufacturers have 2025-2026 production completely sold out:**
  - SK Hynix CFO: *"We have already sold out our entire 2026 HBM supply."*
  - Micron CEO: *"Our HBM capacity for calendar 2025 and 2026 is fully booked."*
  - Samsung: Raising HBM3E prices ~20% for 2026.

### Market Structure
| Supplier | HBM Market Share (Q2 2025) | Position |
|---|---|---|
| **SK Hynix** | ~62% | Dominant; ~90% of NVIDIA's HBM supply |
| **Samsung** | ~20% | Recovering; passed NVIDIA HBM4 tests |
| **Micron** | ~18% | Capacity constrained until US fab (2027) |

### Key Dynamics
- **HBM TAM projected at $100B by 2028**, up from ~$35B in 2025 (~40% CAGR).
- HBM4 transition starting H2 2026 — revenue mix projected at 55% HBM4 / 45% HBM3E by 2027.
- **Memory now accounts for >80% of the bill of materials** for some high-end GPUs — memory scarcity directly constrains GPU production.
- Only Samsung and SK Hynix can modestly expand lines; Micron's new US fab won't start until 2027. **This is a structural bottleneck.**

### Residual Value Impact
- When you can't build new GPUs because memory is sold out, existing GPUs with HBM onboard become more valuable.
- VRAM is the limiting factor — a used H100 with 80GB HBM3 retains value precisely because that memory can't be easily replaced or augmented.

---

## 6. Net Effect: Does Supply Scarcity HELP Residual Values?

### The Verdict: Yes — With Nuance

**The bull case for residual values (strong):**
1. **Supply constraints on new hardware directly support pricing on existing hardware.** CW's H100 GPUs from 2022 contract expirations immediately rebooked at **95% of original pricing**.
2. **Refurbished units trade at mid-80% of new pricing** across 2024-2025. Even used units maintain **60-75% of original value** for A100s after 3+ years.
3. **Organizations holding surplus GPUs are seeing residual values increase** as demand continues to outpace supply.
4. **The packaging/memory double bottleneck is structural** — it won't resolve before 2027 at the earliest. This gives a multi-year floor to residual values.

**The bear case (real but manageable):**
1. **NVIDIA's annual cadence creates step-function depreciation events** — each new architecture launch pressures previous-gen by 10-20%.
2. **H100 depreciation accelerates sharply after ~2 years**, especially for used (vs. refurbished) inventory.
3. **Rental market compression**: H100 spot pricing dropped from $8-12/hr (2023) to $2-4/hr (late 2025) — a 44-75% decline. Hardware values follow rental yields eventually.
4. **If export controls loosen significantly**, a flood of Chinese demand could be served by new production, reducing secondary market pressure.

### Current Market Pricing Snapshot (Q1 2026)

| GPU | New Price | Used Price | Residual % |
|---|---|---|---|
| **H100 80GB SXM** | $30,000-40,000 | $18,000-22,000 | ~55-60% |
| **A100 80GB** | $25,000 (original) | $12,000-18,000 | ~48-72% |
| **A100 40GB** | $15,000 (original) | $8,000-12,000 | ~53-80% |

### The Actuarial Insight for Corgi

**GPU residual value is NOT like traditional IT equipment depreciation.** The key differences:

1. **Asymmetric tail risk**: Supply chain disruptions (TSMC, CoWoS, HBM) increase asset values rather than decrease them. Traditional insurance models assume disruptions hurt asset value — for GPUs, the opposite is often true.

2. **Demand-driven floor**: Unlike servers or networking equipment, GPUs have massive unsatisfied demand globally. There's always a buyer at some price point, especially for export-controlled chips.

3. **Value cascade lifecycle**: GPUs don't go from "useful" to "worthless." They cascade through use cases (training → inference → batch → secondary markets) over 5-6 years. Each stage has willing buyers.

4. **Supply scarcity is the norm, not the exception**: With HBM sold out through 2026, CoWoS constrained through 2026+, and TSMC being the only game in town, structural scarcity is the baseline assumption for GPU supply through at least 2027.

5. **The depreciation curve should be modelled as staircase, not linear**: Step down at each new architecture launch (predictable, ~annual), with a floor supported by supply constraints and use-case cascading.

**Bottom line for Corgi's pitch**: GPU residual value risk is lower than traditional actuarial models would suggest, precisely because of supply chain dynamics that have no parallel in conventional IT hardware. The supply chain itself acts as a natural floor on residual values — and that's a story that makes GPU insurance actuarially attractive.

---

## Sources & Key References
- TSMC Q2 2025 earnings call (CoWoS capacity constraints)
- SK Hynix, Micron, Samsung executive statements on HBM sold-out status
- CRS Report R48642 (US Export Controls and China: Advanced Semiconductors)
- Tom's Hardware, TrendForce, SiliconData market analysis (2025-2026)
- Introl secondary GPU markets guide (2025)
- NVIDIA GTC 2025 roadmap announcements (Rubin, Rubin Ultra, Feynman)
- SiliconData H100 GPU market value trends analysis
- CNBC reporting on GPU smuggling operations (Operation Gatekeeper)

*Last updated: March 2026*
