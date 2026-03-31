# GPU Cloud Pricing & Competitive Dynamics
## Competitive Intelligence for Corgi RVG Insurance Positioning
*Last updated: 2026-03-29*

---

## 1. Current GPU Cloud Pricing (per GPU-hour)

### NVIDIA H100 (80GB SXM)

| Provider | On-Demand | Spot/Community | Reserved |
|----------|-----------|----------------|----------|
| **CoreWeave** | $6.16 | N/A (spot CPUs only) | Up to 60% off (1-3yr) |
| **Lambda Labs** | $2.99 | N/A | Flat rate, no hidden fees |
| **RunPod** | $2.39 (secure) | $1.99 (community) | N/A |
| **Vast.ai** | $1.87 (marketplace) | Variable | Marketplace-driven |
| **FluidStack** | ~$2.00-2.50 | Available | Volume discounts |
| **AWS (p5)** | ~$3.00-4.00 | ~$2.50 | ~44% cut in June 2025 |
| **GCP** | ~$3.50-4.00 | $2.25 (A3-High) | Reserved discounts |
| **Aggressive floor** | $0.99-1.00 | — | Race-to-bottom providers |

**Key stat:** Silicon Data H100 Rental Index: **$2.36** (June 2025), down from **$3.06** (Sept 2024) — a **23% decline** in <12 months.

### NVIDIA A100 (80GB)

| Provider | On-Demand | Spot/Community |
|----------|-----------|----------------|
| **Lambda Labs** | $1.29 (40GB) | — |
| **RunPod** | ~$1.19 (community) | $2.17 (serverless active) |
| **Vast.ai** | $0.50 | Marketplace variable |

### NVIDIA H200

| Provider | On-Demand | Notes |
|----------|-----------|-------|
| **Market median** | $3.59/hr | 8 providers, starting $2.29 |
| **Nebius** | $2.30 | 3+ month commitment |
| **NeevCloud** | $2.39 | — |
| **GMI Cloud** | $2.50 | — |
| **JarvisLabs** | $3.80 | — |
| **GCP Spot** | $3.72 | Preemptible |

**H200 trend:** On-demand pricing *increased* ~26% since March 2025 ($2.97 → $3.73), but expected to soften as Blackwell ships.

---

## 2. Price Trajectory: The "GPU Glut" (Last 12 Months)

### The Collapse
- **Peak (late 2023 / early 2024):** H100 rental at **$8/hr** — shortage-driven pricing
- **Current (early 2026):** H100 at **$2.36-3.50/hr** — a **56-70% decline** from peak
- **AWS catalyst:** June 2025 ~44% H100 price cut triggered broader market reset
- **Market shift:** From shortage-driven pricing → **oversupply-driven pricing** (classic commodity transition)

### What Drove the Glut
1. **Supply caught up:** Hyperscalers + regional data centers brought massive new capacity online through 2024-2025
2. **300+ new providers** entered the H100 cloud market in 2025 alone
3. **Neo-cloud providers** now deliver 40-85% lower GPU compute costs than hyperscalers
4. **Generation transition:** Blackwell anticipation created hesitancy in new H100 commitments

### Price Floor Dynamics
- Some providers offering H100 at **$0.99-1.00/hr** — likely below sustainable margins
- Marketplace providers (Vast.ai) create continuous downward pressure through supply/demand dynamics
- 85% spread between highest and lowest H200 listings shows fragmented, inefficient market

---

## 3. Operator Vulnerability: Who Needs Residual Value Protection Most?

### Tier 1: Most Price-Pressured (Primary RVG Targets)

**Mid-size neocloud operators (50-500 GPUs):**
- Bought H100s at $25K-40K during shortage
- Revenue per GPU-hour dropped 50-70%
- Can't compete on price with marketplaces or on scale with hyperscalers
- **Gross margins after depreciation: 14-16%** (McKinsey estimate for bare-metal-as-a-service)
- Every 10% of idle time erodes gross margins by ~5 percentage points
- Many locked into power/colo contracts at 2023-2024 rates
- **2026 is the inflection point** — initial 2024-2025 commitments come up for renewal

**Oracle's AI Cloud:**
- ~$900M revenue, only $125M gross profit (**14% margin**)
- Operating *loss* of ~$100M specifically from Blackwell chip rentals
- Demonstrates even large operators struggle with GPU economics

### Tier 2: High Leverage Risk

**CoreWeave:**
- **$14B total debt**, $9.7B due within 12 months
- Interest expense: $311M/quarter (3x YoY)
- Q3 2025 net loss: $110M
- Stock down 60%+ from peak ($180 → ~$68)
- Credit default swap spreads doubled since October 2025
- Too big to be a simple RVG customer, but their distress signals validate the market need

### Tier 3: Marketplace/Distributed Operators

**Vast.ai, RunPod community tier, distributed GPU networks:**
- Individual GPU owners face most acute depreciation risk
- No institutional hedging mechanisms
- H100 purchase price ($25-40K) vs declining rental revenue = urgent residual value concern

### McKinsey's Three Outcomes for Neoclouds
1. **Niche survival** — serve markets hyperscalers don't reach
2. **Grow with startups** — bet on customer success
3. **Consolidation/fade** — absorbed by hyperscalers/telcos or simply shut down

---

## 4. Utilization Rates: The Idle Capacity Problem

### Industry Averages
- **Average GPU utilization: 15-30%** in centralized cloud environments
- **~1/3 of GPUs operate below 15% capacity**
- Many teams paying for **40-60% more capacity** than they use
- **30-50% of GPU budgets** wasted on provisioned-but-idle hardware

### Real-World Examples
- **OpenAI GPT-4 training** (25,000 A100s): average utilization **32-36%**
- **Fintech startup** (8 GPUs): 60% avg utilization → ~$12K/month wasted on idle capacity

### Financial Impact
- Every **10% of idle time** → ~5 percentage point margin erosion
- Typical 20-30% utilization → could be improved to 70-80% with optimization
- The gap between *provisioned* and *utilized* is the residual value risk gap

### Why This Matters for Corgi
Low utilization means operators are already underwater on their GPU investments before depreciation even kicks in. An RVG policy that guarantees a floor on residual value addresses the **dual risk** of:
1. Technological depreciation (next-gen GPUs)
2. Economic depreciation (insufficient utilization to recover CapEx)

---

## 5. Contract Structures: Spot vs Reserved vs Committed

### On-Demand
- No commitment, highest price (2-3x reserved)
- Immediate availability
- Used for: burst training, prototyping, unpredictable workloads
- **Lambda** known for transparent flat-rate on-demand pricing

### Reserved / Committed
- **1-3 year commitments** → 30-60% discounts
- **CoreWeave:** Up to 60% off on-demand for committed usage
- Makes sense for: predictable baseline workloads, 24/7 inference serving
- **Risk for operators:** If the customer churns or reduces usage, the GPU sits idle
- **Risk for customers:** Locked into hardware that may depreciate faster than the contract term

### Spot / Preemptible
- **60-90% discounts** vs on-demand
- Can be interrupted with **2-minute warning**
- Used for: batch inference, non-urgent training, fault-tolerant workloads
- Growing share of market as price-sensitive users optimize

### Strategic Mix (Industry Best Practice)
- 50% reserved (minimum guaranteed load)
- 30% on-demand (variable demand)
- 20% spot (batch/tolerant workloads)

### RVG Insurance Angle
Reserved contracts are the sweet spot for RVG because:
- Operators commit capital to specific GPU hardware for 1-3 years
- Hardware depreciation risk is highest during this period
- An RVG policy could be structured to match contract terms
- If the reserved customer churns mid-contract, the operator is exposed to both idle capacity AND depreciated hardware

---

## 6. Blackwell/GB200 Impact on H100 Demand

### The Headline Threat
Jensen Huang reportedly joked: *"When Blackwell ships, you couldn't give Hoppers away."*

### The Reality (More Nuanced)
**Supply constraints buffer the transition:**
- Blackwell **sold out through mid-2026** with 3.6M unit backlog
- Limited availability means H100s retain utility longer than expected
- CoreWeave H100s from 2022 contract expirations **rebooked at 95% of original pricing**

**The "Value Cascade" Model:**
- **Years 1-2:** Frontier training (original purpose)
- **Years 3-4:** Inference workloads (still very valuable)
- **Years 5-6:** Batch processing, fine-tuning, smaller models
- Inference demand keeps previous-gen hardware valuable longer

**Depreciation Reality:**
- **30-40% economic depreciation in Year 1** (accelerating 3-year cycles)
- Historical pattern: **10-20% price reduction** for previous-gen when new gen reaches GA
- Hyperscalers extended depreciation to **6 years** (saving ~$18B annually on $300B+ CapEx)
- H100 purchase prices stabilized at **$25-40K** (down from $40K+ peak)

### B200 GA (Expected Q1 2026) Impact
- Will pressure H100 secondary market values
- But Blackwell supply constraints mean the "cliff" is more of a "slope"
- Mid-tier operators who bought H100s at peak ($35-40K) face the steepest value erosion

---

## 7. Corgi RVG Positioning Implications

### The Core Thesis
GPU operators face a **perfect storm** of compressing revenues (price collapse), fixed costs (power, colo, debt service), technological obsolescence (Blackwell), and low utilization. **Residual value guarantee insurance** directly addresses the single largest unhedged risk on their balance sheet: *What is this GPU worth in 2-3 years?*

### Target Customer Segments (Priority Order)

1. **Mid-size neocloud operators (50-500 GPUs)**
   - Bought hardware at peak, now facing 50-70% revenue decline per GPU
   - 14-16% gross margins leave zero room for depreciation surprises
   - Most likely to value RVG as it enables them to finance/refinance GPU purchases
   - **Size of addressable market:** 300+ operators entered in 2025 alone

2. **GPU lessors and financiers**
   - Companies providing GPU-backed financing need residual value certainty
   - RVG policy enables better loan-to-value ratios on GPU-backed debt
   - CoreWeave's $14B debt mountain shows the scale of GPU-backed financing

3. **Enterprise AI teams with owned hardware**
   - Provisioned 40-60% more capacity than needed
   - Need to plan exit/refresh cycles with confidence
   - RVG helps justify CapEx approval by de-risking the downside

### Pricing Signals
- H100 depreciation: ~30-40% in Year 1, stabilizing thereafter
- 3-year residual value likely 20-30% of purchase price without RVG
- The spread between "optimistic cascade" (inference reuse) and "pessimistic obsolescence" (Blackwell dominance) is the insurance opportunity
- Operators will pay a premium to guarantee the optimistic scenario

### Competitive Moat
- No established GPU residual value insurance product exists in market
- Traditional equipment insurers don't understand AI hardware lifecycle
- Corgi's ability to model the value cascade (training → inference → batch) is the underwriting edge
- First-mover advantage in a market that will only grow as GPU CapEx reaches $3.1T by 2030 (McKinsey)

### Key Risk for Corgi
- If AI demand collapses broadly (not just a generation transition), residual values could fall below modeled floors
- Concentration risk: if a few large operators default simultaneously
- Need to model correlation between GPU utilization trends and residual value
- Blackwell Ultra / B300 timeline could accelerate H100/H200 depreciation beyond projections

---

## Sources
- Silicon Data H100 Rental Index (2025)
- McKinsey: "The Evolution of Neoclouds and Their Next Moves"
- CoreWeave Q3 2025 SEC Filing / Earnings
- Introl Blog: "GPU Cloud Prices Collapse" (Dec 2025)
- IntuitionLabs H100 Rental Price Comparison (Nov 2025)
- dstack: "The State of Cloud GPUs in 2025"
- Vultr: "Great Neocloud Consolidation of 2026"
- The Register: "Rent-a-GPU Neoclouds Need to Adapt or Die"
- SemiAnalysis: "GPU Cloud Economics Explained"
- Various provider pricing pages (Lambda, CoreWeave, RunPod, Vast.ai, GCP, AWS)
