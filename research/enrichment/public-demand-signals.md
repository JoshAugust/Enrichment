# GPU Hardware Depreciation Risk — Public Demand Signals

> **Purpose:** Direct demand signal intelligence for outreach. Captures what GPU operators, lenders, executives, and analysts are saying publicly about hardware depreciation risk and the need for residual value protection.
>
> **Last updated:** 2026-03-29

---

## 1. Executive & CEO Quotes (Golden for Outreach)

### CoreWeave CEO Michael Intrator — All-In Podcast & CNBC (2025)

> "My take on the GPU depreciation debate is that it's nonsense."
> — Called it a narrative "being brought to the forefront by some traders that have a short position in the stock."

> "All of the data points that I'm getting are telling me that the infrastructure retains value."

> "And my approach to this has always been, if people are willing to pay me for it, it still has value."

**Context:** Intrator claims CoreWeave's A100 chips from 2020 are fully booked, and H100 chips freed from an expired contract were immediately rebooked at **95% of their original price**. CoreWeave uses a **6-year depreciation schedule** and believes GPUs will last in excess of six years. Average contract length: 5 years.

**Why this matters for outreach:** Intrator is publicly dismissive — but his own S-1 reveals $18.8B debt raised against hardware booked for 6 years that depreciates in 2-3 years. The gap between his rhetoric and the financial reality is the sell.

---

### Microsoft CEO Satya Nadella — Bg2 Pod (November 2024)

> "I didn't want to go get stuck with four or five years of depreciation on one generation."

> Microsoft has "chips sitting in inventory that I can't plug in" due to power infrastructure limitations.

**Why this matters:** Even the biggest hyperscaler CEO publicly admits depreciation lock-in is a strategic concern.

---

### Michael Burry (@michaeljburry) — X/Twitter (2025)

> "Understating depreciation by extending useful life of assets artificially boosts earnings — one of the more common frauds of the modern era."

> "The idea of a useful life for depreciation being longer because chips from more than 3 to 4 years ago are fully booked confuses physical utilization with value creation."

> "It is clearly Cisco." — Comparing NVIDIA to Cisco's position in 1999-2000.

**Context:** Burry estimates hyperscalers will understate depreciation by **$176 billion between 2026-2028**. Claims Oracle may overstate earnings by 26.9% and Meta by 20.8% by 2028.

---

### NVIDIA CFO Colette Kress — Response to Burry (2025)

> "Thanks to CUDA, the A100 GPUs we shipped six years ago are still running at full utilization today, powered by vastly improved software stack."

**Why this matters:** Even NVIDIA felt compelled to publicly defend GPU longevity — the debate has gone mainstream.

---

## 2. Earnings Calls & SEC Filings

### CoreWeave S-1 (2025)

- Extended GPU depreciation period from **4 years to 6 years** in 2023
- $18.8B debt raised against hardware booked for 6 years
- Loan terms require quarterly payments based on cash flow and, starting January 2025, **the depreciated value of the GPUs used as collateral**
- As assets lose value, CoreWeave is forced to **increase monthly payments** as collateral becomes insufficient
- Competitor Nebius uses a more conservative **4-year depreciation period**

> "Longer schedules (like CoreWeave's six years) improve profitability optics today but risk painful impairments tomorrow." — Seeking Alpha analysis

### Applied Digital (APLD) — Fiscal Q1 2026 Earnings

- D&A expenses: **$34.4 million** (up from $8M prior year) — depreciation costs exploding as GPU fleet scales
- Incurred **$4.1M** in expenses for facilities not yet generating revenue
- Pivoting away from operating GPU clouds directly → spinning out cloud business into "ChronoScale"
- Signed 150 MW lease with CoreWeave, ~$11B prospective revenue over ~15 years

**Why this matters:** Applied Digital is literally restructuring to avoid holding GPU depreciation risk directly.

### Amazon — Depreciation Schedule Change (January 2025)

- Changed server depreciation from **6 years to 5 years**
- Resulted in **$700 million reduction in 2025 operating profit**
- Described as "an admission that their previous accounting didn't match operational reality"

### Lambda Labs

- Uses **5-year depreciation** schedule (shorter than CoreWeave's 6-year)
- Reflects "faster modernization cycles and less heterogeneous workload mix"

---

## 3. GPU-Backed Lending & Structured Finance

### The CoreWeave Debt Stack

| Facility | Date | Size | Lead |
|----------|------|------|------|
| DDTL 1.0 | Aug 2023 | $2.3B | Magnetar + Blackstone |
| DDTL 2.0 | May 2024 | $7.5B | Blackstone + Magnetar |
| DDTL 3.0 | 2025 | $2.6B | Morgan Stanley + MUFG |

- Collateralized by NVIDIA H100 chips (tracked by serial number via UCC-1 filings)
- Effective interest rate: **~14%** (S+6% for hyperscale, S+13% for speculative)
- SPV ring-fencing: mirrors traditional ABS structure

> "CoreWeave operates as a leveraged infrastructure vehicle that finances GPUs like power plants, collateralizes them like aircraft, and backstops them with customer prepayments that behave like short-term loans."
> — Dave Friedman, Substack

### First GPU ABS Deal — Residual Value Insurance

> "One of the first GPU ABS deals had an insurer guarantee that at least **40% of the original value** of the GPUs would be realized on resale, effectively putting a floor on losses."

> "Deals often add residual value insurance or guarantees that cover shortfalls if used GPU market prices collapse below the insured threshold."

**Key concern for lenders:**
> "A watchpoint is insurance market capacity: if many GPU ABS deals seek residual value insurance or guarantees, can insurers support tens of billions in exposure?"

---

## 4. Blog Posts & Analysis (High-Signal Sources)

### Dave Friedman — "The GPU Debt Treadmill" (Substack)

> "The assumptions underneath GPU infrastructure debt are: that demand for compute remains insatiable, that each hardware generation can earn its returns before the next one makes it obsolete, and that the equity treadmill sustaining the operators doesn't break."

> "By year 3, those H100s are being lapped by hardware that is an order of magnitude or more efficient for the workloads where margins are best."

> "Each generation obsoletes the last one faster than the prior cycle did. This is the treadmill."

> "If the treadmill breaks, it won't break at the SPV level. It'll break at the corporate level. And that's where the lender's ring fence gets tested."

> "The speed at which this technology is moving, with generational efficiency gains measured in multiples, not percentages, means the margin for error is thinner than in any prior infrastructure buildout."

**Also from Friedman:**
> "Neoclouds hold more than $20 billion in GPU-backed debt. What happens if they can't repay their loans?"

### Eugene Cheah (Featherless.AI CEO) — "$2 H100s: How the GPU Bubble Burst" (Latent Space, Oct 2024)

> "Don't buy H100s. The market has flipped from shortage ($8/hr) to oversupplied ($2/hr)."

> "For the general market, it makes little sense to be investing in new H100s today, when you can rent it at near cost, when you need it, with the current oversupply."

> "Once the rental cost for H100 falls below $1.65 per hour, revenues no longer recoup the investment, and the price needs to be above $2.85 to beat the internal rate of return provided by the stock market."

### SiliconANGLE — "Resetting GPU Depreciation" (Nov 2025)

> "More rapid innovation cycles being pushed by Nvidia will somewhat compress depreciation cycles from their current six years to a more conservative five-year timeframe."

> "A one-year change in useful life assumptions for trillion-dollar GPU estates can swing operating income by tens of billions."

### "Where's Your Ed At" — "CoreWeave Is A Time Bomb"

> "$18.8B debt raised against hardware that depreciates in 2-3 years while booked for 6."

---

## 5. Market Data — The Depreciation Reality

### H100 Rental Price Collapse
- Early 2024: **~$8/hr**
- Late 2025: **$2-3/hr**
- **60-70% decline in 18 months**

### H100 Resale Market
- Lightly used (1-2 years): **70-85%** of new value
- Moderate use (2-3 years): **50-70%** of new value
- Enterprise resale: **60-80%** of original
- Refurbished outperform used by **15-25 percentage points**
- eBay fire-sale pricing: **85% drop** from $40K to ~$6K (extreme case)

### The "Value Cascade" Theory
GPUs supposedly retain value by serving different workloads as they age:
- Years 1-2: Frontier model training
- Years 3-4: High-value real-time inference
- Years 5-6: Batch inference and analytics

**Counter-argument:** Each new generation delivers ~10x performance improvements. If Blackwell delivers the same workload for 1/10th the power cost of Hopper, older hardware becomes "OpEx obsolete" instantly.

### Plot Twist — 2026 Reversal
> "Since December 2025, the H100 rental market has gone 'VERY up,' with H100s worth more today than they were 3 years ago, related to the chip shortage and reasoning model/agent inflection."

This volatility in *both directions* is precisely why residual value protection has value.

---

## 6. Emerging Solutions — The Residual Value Protection Market

### Ornn Compute Exchange (ornnai.com)

- Published the **Ornn Compute Price Index (OCPI)** on the Bloomberg Terminal — first compute price index that derivatives reference and settle against
- Executed the **first-ever compute swap** in December 2025
- Launched **GPU Value Protection** — a Residual Value Swap (RVS):
  - Pay quarterly premium → guaranteed minimum sale price for GPUs at a future date
  - Analogous to residual value insurance in ship and aircraft leasing

> "For datacenter operators, this enables better financing terms, reduces equity volatility, and allows investment decisions based on expected performance rather than worst-case scenarios. For lenders, it provides a defined floor under collateral value, supporting higher advance rates and insulation from technology obsolescence."

### Specialist Obsolescence Insurance

> "Some specialist insurers now offer obsolescence insurance — effectively paying out if resale values fall below a threshold due to a new tech release, analogous to extended warranty or residual value insurance in other asset classes."

### The Market Gap

> "A functioning compute derivatives and residual value market — forward contracts, options, swaps on standardized compute units, insurance products on hardware residual values — would give lenders a reference curve and a mechanism to hedge tail risk, borrowers a tool to lock in future revenue, and investors transparent price signals."

> "Early efforts to build this market exist, but it remains nascent."

---

## 7. Key Themes for Outreach Messaging

### Pain Points (What operators/lenders lose sleep over)

1. **The Depreciation Schedule Mismatch** — 6-year books vs. 2-3 year real economic life
2. **Collateral Value Erosion** — GPU-backed loans where collateral depreciates faster than amortization
3. **Generation Leap Risk** — Each new NVIDIA architecture delivers 2-10x improvement, crushing resale of prior gen
4. **Rental Rate Collapse** — 60-70% decline in H100 rental rates in 18 months
5. **Impairment Exposure** — If book values assume 6 years but resale drops 50% by year 3, impairment charges loom

### Who Needs This Most

| Persona | Pain | Signal |
|---------|------|--------|
| **GPU Cloud Operators** (CoreWeave, Lambda, Crusoe, TensorWave) | Carrying billions in GPU assets on balance sheet with uncertain resale | Applied Digital literally spinning out cloud biz to avoid holding this risk |
| **Infrastructure Lenders** (Blackstone, Magnetar, Morgan Stanley) | $20B+ in GPU-collateralized loans with uncertain recovery | First ABS deals already require 40% residual value guarantees |
| **Hyperscalers** (Microsoft, Meta, Amazon) | $176B in potentially understated depreciation (Burry estimate) | Amazon already adjusted schedule, took $700M hit |
| **GPU Lessors & Brokers** | Lease economics depend on residual value at end of term | Refurbished vs. used spread widening 25-30% by year 3 |

---

## Sources & Further Reading

- [CoreWeave S-1 / SEC Filing](https://investors.coreweave.com)
- [Dave Friedman — "The GPU Debt Treadmill"](https://davefriedman.substack.com/p/the-gpu-debt-treadmill)
- [Dave Friedman — "CoreWeave's $30 Billion Bet"](https://davefriedman.substack.com/p/coreweaves-30-billion-bet-on-gpu)
- [Eugene Cheah — "$2 H100s: How the GPU Bubble Burst"](https://www.latent.space/p/gpu-bubble)
- [CNBC — "How long before a GPU depreciates?"](https://www.cnbc.com/2025/11/14/ai-gpu-depreciation-coreweave-nvidia-michael-burry.html)
- [SiliconANGLE — "Resetting GPU Depreciation"](https://siliconangle.com/2025/11/22/resetting-gpu-depreciation-ai-factories-bend-dont-break-useful-life-assumptions/)
- [Seeking Alpha — "CoreWeave: The Devil Is In The Details"](https://seekingalpha.com/article/4859225-coreweave-the-devil-is-in-the-details-of-its-gpu-defense)
- [Ornn Compute — GPU Value Protection](https://www.ornnai.com/research/residualvalue)
- [Bizety — "GPU Depreciation: CoreWeave vs. Nebius"](https://bizety.com/2025/09/23/gpu-depreciation-coreweave-vs-nebius/)
- [Silicon Data — "H100 GPU Market Value Trends"](https://www.silicondata.com/use-cases/h100-gpu-market-value-trends/)
- [Michael Burry (@michaeljburry) — X/Twitter thread on depreciation](https://x.com/michaeljburry/status/1987918650104283372)
- [NVIDIA pushback memo — CNBC](https://www.cnbc.com/2025/11/25/nvidia-pushes-back-on-charges-that-ai-investment-is-a-bubble.html)
- [Satya Nadella on Bg2 Pod (Nov 2024)](https://medium.com/@truthbit.ai/microsoft-ceo-admits-we-have-gpus-we-cant-plug-in-109e12dc040e)
- [Applied Digital Q1 2026 Earnings](https://ir.applieddigital.com/news-events/press-releases/detail/131/applied-digital-reports-fiscal-first-quarter-2026-results)
