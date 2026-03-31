# Ornn Compute Exchange — Deep Dive

> **Last updated:** 2026-03-29
> **Relevance to Corgi:** Ornn is the closest analogue to Corgi's GPU Residual Value Guarantee (RVG). They approach the same problem — GPU depreciation risk — via derivatives rather than insurance. Potentially a competitor, but more likely a complement and possible pricing partner.

---

## 1. Company Overview

| Field | Detail |
|-------|--------|
| **Legal entity** | Ornn AI, Inc. |
| **Founded** | 2025 |
| **HQ** | Menlo Park, CA |
| **Employees** | ~6 |
| **Funding** | $5.7M seed (Oct 2025) |
| **Investors** | BoxGroup, Crucible Capital (co-lead), Vine Ventures (co-lead), Fortified Ventures, Link Ventures |
| **Regulatory status** | Operating under CFTC de minimis swap dealer exemption (up to $8B notional); pursuing Designated Contract Market (DCM) license |
| **Website** | [ornnai.com](https://ornnai.com) / [ornn.trade](https://ornn.trade) |
| **Bloomberg ticker** | ORNNH100 (and variants per GPU type) |

### Positioning
"The world's first U.S.-regulated derivatives venue for GPU compute." They explicitly model themselves on electricity markets (not oil) — compute is a flow commodity that cannot be stored.

---

## 2. Team

All four core members are **MIT alumni** with quant trading + engineering backgrounds:

| Name | Role | Background |
|------|------|------------|
| **Kush Bavaria** | Co-Founder & CEO | Former investor at Link Ventures; ML researcher at MIT CSAIL |
| **Wayne Nelms** | Co-Founder & CTO | Former equity options trader at Susquehanna (SIG); ex-Google engineer |
| **Andrew Kessler** | Quant Researcher | Former quant researcher at Optiver |
| **Jack Minor** | Operations | Former consultant at BCG |

**Origin story:** Bavaria and Nelms were consulting for PE firms that lend to data centers. PE clients kept saying: "We're extending credit to GPU infra companies but have no way to hedge our exposure." No benchmark → no derivatives → no risk management. That became Ornn.

---

## 3. OCPI — Ornn Compute Price Index

### What It Is
The first tradable compute price index. Published on **Bloomberg Terminal** (ticker: ORNNH100, etc.). Referenced for settlement by derivatives on Kalshi, Robinhood, and soon Architect Financial Technologies (exchange-traded futures).

### Methodology (partially proprietary, but known elements):

| Element | Detail |
|---------|--------|
| **Data source** | Actual executed transaction prices from live GPU markets — NOT surveys, rate cards, or offer prices |
| **Coverage** | Separate indices per GPU type: H100 SXM, H200, B200, RTX 5090, A100 SXM4, and more |
| **Metric** | Volume-weighted average price (VWAP) of GPU compute capacity ($/GPU-hour) |
| **Regional weighting** | Yes — reflects that an H100 in Northern Virginia trades differently from one in Amsterdam |
| **Update frequency** | Daily index values published |
| **Settlement style** | Asian-style — arithmetic average of daily values over the contract period (mirrors electricity markets) |

### Data Partners
- **Hydra Host** — Infrastructure company with 30,000+ GPUs across 50+ locations, supplying real-time operational data
- **InfraSight Software** — Provides "Workload Compute Unit" framework for measuring and comparing compute across different GPU models (enables cross-model index weighting)

### Current Usage
- Already being used by institutional investors as a meaningful indicator
- Referenced in paid research reports (e.g., Uncover Alpha's channel checks, Dave Friedman's GPU volatility analysis)
- H100 index was recently showing ~$1.70/GPU-hour

### Anti-Manipulation Design
Bavaria has stated the goal is to make the index "anti-manipulative, transparent, and verifiable" — participants should be able to replicate the methodology themselves.

---

## 4. Product Offering

### 4a. Compute Swaps (Live)
**First-ever compute swap executed: December 11, 2024**

A compute swap = two parties agree on a fixed GPU hourly rate for a future period. At settlement, the losing party pays the difference in cash based on OCPI. No actual compute changes hands.

**Example:** 30-day swap for 10,000 GPUs at $2/GPU-hour. If OCPI average = $2.30, counterparty pays you ($2.30 - $2.00) × 10,000 = $3,000.

Key benefit: you don't need to change your compute provider. Keep using your existing hyperscaler — if prices rise and your bill increases, the swap payment offsets it.

### 4b. Compute Futures (Launching)
Cash-settled to OCPI benchmark. Asian-style settlement (arithmetic average of daily index values through the tenor). Monthly contracts with 30 daily payouts.

**Distribution channels:**
- **Kalshi** — prediction market contracts referencing OCPI (live)
- **Robinhood** — prediction market contracts referencing OCPI (live)
- **Architect Financial Technologies (AX)** — first exchange-traded futures on GPU and RAM prices (announced Jan 2026)

**Margin required** — counterparties must post cash collateral to guarantee positions. Protects both sides.

### 4c. GPU Value Protection / Residual Value Swaps (RVS) (Launched Jan 2026)
This is the product most directly comparable to Corgi's RVG.

**How it works:**
1. You purchase an RVS contract when acquiring GPUs — specify hardware covered, coverage period, and guaranteed sale price
2. You pay a quarterly premium (or upfront) for the protection
3. At contract maturity, if you elect to sell your hardware, GPUs get purchased at the guaranteed price. If you keep your hardware, the contract expires and you keep your GPUs.

**Pricing basis:** OCPI tracks future revenue potential of GPUs, which is directly correlated to residual value. OCPI provides the foundation for pricing RVS contracts.

**Partnership with USD.ai:** USD.ai provides loans for GPU infrastructure; Ornn reduces financing costs by offering a put option on the hardware in year 3 or 4. Gives lenders confidence in terminal value → better terms for borrowers.

### 4d. Memory Futures (Announced)
Expanding beyond GPU compute into RAM/memory price derivatives.

---

## 5. Derivatives vs. Insurance — Key Differences

| Dimension | Ornn (Derivatives) | Corgi (Insurance) |
|-----------|-------------------|-------------------|
| **Legal structure** | Swap / futures contract (CFTC-regulated) | Insurance policy (state insurance regulator) |
| **Regulator** | CFTC | State insurance departments / Lloyd's |
| **Counterparty risk** | Managed via margin requirements; counterparty posts collateral | Underwriter bears risk; reinsurance backstop |
| **Payout trigger** | Mathematical — settlement price vs. trade price | Claim-based — insured event occurs, claim is filed |
| **Physical delivery** | Cash-settled only; no GPUs change hands | Could involve actual sale of hardware at guaranteed price |
| **Who can buy** | Institutional (currently); needs sophistication to understand swaps | Any GPU owner — simpler to understand |
| **Premium structure** | Margin deposit + mark-to-market | Regular premium payments |
| **Flexibility** | Can be traded / unwound before expiry | Policy term is fixed |
| **Moral hazard** | Lower — cash settlement means no incentive to damage hardware | Higher — need to ensure hardware is maintained |
| **Basis risk** | OCPI may not perfectly reflect YOUR specific GPU's value | Corgi could tailor to specific hardware / config |
| **Regulatory moat** | DCM license is hard to get; CFTC oversight is serious | Insurance licensing is also a meaningful moat |

### Key insight for Corgi:
Ornn's RVS is **economically identical** to Corgi's RVG in outcome (guaranteed floor price for GPUs), but **structurally different** (derivative vs. insurance contract). The derivative approach requires counterparties on both sides and margin; the insurance approach requires underwriting capital and actuarial pricing. Both solve the same customer problem.

---

## 6. Could Corgi Use OCPI as a Pricing Index?

### The Case FOR Using OCPI

**Strong parallels to aviation insurance:**
- Aircraft insurers use **Cirium/ISTAT** values as reference benchmarks for hull values
- Marine insurers use **Baltic Exchange** indices
- Energy insurers reference **Platts/Argus** price assessments
- Corgi could reference OCPI to set insured values, calculate premiums, and trigger payouts

**Specific benefits:**
1. **Premium calculation** — OCPI historical volatility data gives Corgi actuarial inputs for pricing risk
2. **Payout triggers** — Policy could pay out when OCPI drops below a threshold (parametric insurance)
3. **Independent benchmark** — Neither Corgi nor the policyholder controls the index → reduces disputes
4. **Credibility with reinsurers** — Having an institutional benchmark (on Bloomberg!) makes the risk more understandable to reinsurance markets
5. **Forward curve** — As futures markets develop, Corgi gets a forward curve for expected GPU values → better long-term pricing

### The Case AGAINST (or at least caution)

1. **Index ≠ specific hardware value** — OCPI tracks compute rental prices, not hardware resale values directly. A GPU's rental rate and its resale price are correlated but not identical.
2. **Basis risk** — A customer's specific GPU configuration (memory, interconnect, cooling, age, condition) may diverge from the index.
3. **Methodology opacity** — OCPI's full methodology is not public yet. Hard to write insurance policies against an index you can't fully audit.
4. **Single provider risk** — OCPI is currently the only index. If Ornn fails, the benchmark disappears.
5. **Early-stage data** — The index has less than 2 years of history. Actuaries want decades of data.

### Recommendation
**Yes, Corgi should explore using OCPI**, but likely as one input among several (alongside secondary market transaction data, depreciation schedules, and proprietary models). The analogy to aviation's ISTAT values is apt — ISTAT provides reference values, but individual aircraft are appraised based on specific condition. Corgi could do the same: OCPI as the macro benchmark, with adjustments for specific hardware.

---

## 7. Competitor, Complement, or Partner?

### Assessment: **Primarily a complement, with partnership potential**

**Why NOT a pure competitor:**
- Different regulatory regime (CFTC vs. insurance regulators)
- Different customer sophistication required (derivatives expertise vs. buying an insurance policy)
- Different capital structure (margin-based vs. underwriting-based)
- Ornn needs counterparties on both sides; Corgi is a one-sided product (customer buys protection, Corgi underwrites)
- Insurance is far more accessible to mid-market data center operators who don't have derivatives trading capabilities

**Why it's a complement:**
- Ornn provides the **pricing infrastructure** that makes Corgi's product better
- OCPI gives Corgi an independent benchmark for setting insured values
- Ornn's forward curve gives Corgi a market-implied view of future GPU values
- Corgi could use Ornn's derivatives to **hedge its own book** (buy puts on OCPI to offset insurance payouts)

**Partnership scenarios:**
1. **Corgi uses OCPI as pricing reference** — like insurers using Cirium/ISTAT
2. **Corgi hedges its insurance book on Ornn's exchange** — buy compute futures to offset risk
3. **Joint product** — Ornn handles institutional/sophisticated clients with swaps; Corgi handles mid-market with insurance. Referral arrangement.
4. **Data sharing** — Corgi's claims data feeds into OCPI; Ornn's index data feeds into Corgi's actuarial models

**Risk scenario (where they compete):**
- If Ornn's RVS product becomes so user-friendly that mid-market operators prefer it over insurance, there's direct competition
- If insurance regulators make it easier to do parametric GPU insurance, Corgi might not need Ornn at all

---

## 8. Published Research & Content

### Ornn's Own Research (from ornnai.com/research):
1. **"Compute as a Commodity: Electricity Analogy"** — Argues compute is a flow commodity like electricity, not a stock commodity like oil
2. **"Compute Futures"** (Dec 2025) — Detailed explanation of Asian-style cash-settled futures design, margin mechanics
3. **"Introducing GPU Value Protection"** (Jan 2026) — RVS product launch, how residual value protection works
4. **"Introducing Memory Futures"** — Extension to RAM/memory derivatives

### Third-Party Coverage:
- **Dave Friedman (Substack)** — "How to Control Your AI Compute Budget" — detailed walkthrough of first compute swap
- **Dave Friedman** — "Three GPU Markets, Three Volatility Regimes" — uses OCPI data to analyze price volatility across A100/H100/H200
- **Dave Friedman** — "CoreWeave's $30 Billion Bet on GPU Market Infrastructure" — references OCPI
- **moyed/FLAVOR (Paragraph)** — "Ornn, How Do We Price Compute?" (Feb 2026) — excellent deep dive with team cooperation
- **The Innermost Loop (Substack)** — "The First Tradable Compute Price Index" — Bloomberg Terminal launch announcement (authored by someone with financial interest in Ornn, connected to 021T Capital)
- **FoundersPress** — "Ornn Is Turning Compute Into a Commodity" — CEO interview with Bavaria
- **Uncover Alpha** — "Q4 2025 Channel Checks" — uses OCPI as alternative data source (paywalled)
- **Data Center Dynamics** — Coverage of Kalshi/Ornn integration
- **Semi Doped Podcast** — Interview with Wayne Nelms on financing AI infrastructure

---

## 9. Key Takeaways for Corgi

1. **Ornn validates the market.** The fact that a well-funded, MIT-pedigreed team with CFTC backing is building in this exact space proves GPU depreciation risk is a real, fundable problem.

2. **OCPI is the closest thing to a "Cirium for GPUs."** Corgi should seriously explore licensing or referencing OCPI for actuarial pricing. It's already on Bloomberg — that's institutional credibility.

3. **The derivative vs. insurance distinction is Corgi's moat.** Not every data center operator wants to (or can) trade derivatives. Insurance is simpler, more accessible, and doesn't require margin accounts or ISDA agreements. Corgi's product is fundamentally more approachable.

4. **Corgi could use Ornn to hedge its own book.** If Corgi writes insurance guaranteeing GPU values, it takes on residual value risk. Corgi could lay off that risk by buying puts/swaps on Ornn's exchange. This is exactly how property insurers use cat bonds and weather derivatives.

5. **Watch the RVS product closely.** Ornn's Residual Value Swap is the most directly competitive offering. If they make it self-service and accessible to non-institutional buyers, it encroaches on Corgi's territory. Currently it appears to be institutional-only.

6. **Partnership before competition.** At this stage, reaching out to Ornn for a data/index licensing conversation makes strategic sense. Corgi brings insurance expertise and mid-market distribution; Ornn brings pricing infrastructure and institutional credibility.

---

## Sources
- [ornnai.com](https://ornnai.com) — Official website and research hub
- [ornn.trade](https://ornn.trade) — Trading portal
- [PR Newswire — Seed Round](https://www.prnewswire.com/news-releases/ornn-raises-5-7-million-seed-round-to-launch-the-worlds-first-compute-futures-exchange-302596938.html)
- [PR Newswire — Architect Financial Partnership](https://www.prnewswire.com/news-releases/architect-financial-technologies-partners-with-compute-index-provider-ornn-to-launch-exchange-traded-futures-on-gpu-and-ram-prices-302666613.html)
- [FoundersPress Interview](https://thefounderspress.com/ornn-is-turning-compute-into-commodity/)
- [Paragraph — moyed deep dive](https://paragraph.com/@moyed/ornn)
- [The Innermost Loop — Bloomberg announcement](https://theinnermostloop.substack.com/p/the-first-tradable-compute-price)
- [Dave Friedman — Compute Swap](https://davefriedman.substack.com/p/how-to-control-your-ai-compute-budget)
- [PitchBook profile](https://pitchbook.com/profiles/company/1084467-79)
