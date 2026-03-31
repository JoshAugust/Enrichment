# Competitive Landscape: GPU Residual Value Insurance & Related Products

*Research compiled: 29 March 2026*

---

## Executive Summary

**No one currently offers a standalone, insurance-wrapped GPU Residual Value Guarantee (RVG) product as Corgi envisions it.** The concept exists in discussion (blog posts, analyst commentary, structured finance circles), and adjacent products are emerging — but the market has a clear gap. The closest competitor is **Ornn Compute Exchange**, which offers residual value *swaps* (a derivatives product, not insurance). The major brokers (Aon, Marsh) are focused on construction/property/BI for data centers — none cover depreciation or obsolescence risk.

---

## 1. Existing Insurance Products Covering GPU/AI Hardware Depreciation Risk

### What Exists Today

**Nothing directly.** No insurance carrier or MGA currently offers a standalone policy that pays out when GPU resale values fall below an agreed floor due to technological obsolescence or market depreciation.

What *does* exist in adjacent spaces:

| Product | Provider | What It Actually Covers |
|---------|----------|------------------------|
| **Residual Value Swaps** | Ornn Compute Exchange | Derivatives contract (not insurance) guaranteeing a floor price on GPU resale. Quarterly premium; payout if GPUs sell below agreed price at contract end. |
| **Deal-specific RVI** | Unnamed specialist insurers | One-off residual value guarantees embedded in GPU ABS deals (e.g., guaranteeing ≥40% of original value on resale). Not a product you can buy off the shelf. |
| **Obsolescence insurance** | Referenced but unconfirmed | Some specialist insurers reportedly offer policies paying out if resale values fall below a threshold due to a new tech release. Not widely available or standardised. |
| **NVIDIA lease guarantees** | NVIDIA (NVFS) | NVIDIA has guaranteed $860M in facility lease obligations for partner data centers — but this is credit support for *real estate*, not GPU hardware residual values. |
| **Buyback arrangements** | Various lessors | Some lessors offer buyback guarantees or floor prices on residual values, plus technology refresh provisions. These are contractual, not insurance-backed. |

### Key Insight

The GPU ABS market (~$8B issuance in 2025, forecast $25B by 2028) is *crying out* for residual value protection. Current deals either: (a) demand large equity buffers instead of insurance, or (b) embed one-off guarantees negotiated deal-by-deal. There is no standardised, repeatable insurance product.

---

## 2. Aon's $2.5B Data Center Lifecycle Insurance Program (DCLP)

### Overview
- **Launched:** 2025 (original); expanded January 2026 to $2.5B (added $1B capacity)
- **Led by:** Insurers at Lloyd's of London
- **Purpose:** Multi-line insurance for data center projects from construction through operations

### What It Covers

| Coverage Line | Capacity |
|---------------|----------|
| Construction All Risks + Delay in Start-Up (DSU) + Operational Property Damage/Business Interruption | Up to **$2.5B** |
| Cyber, Cyber Property Damage, Tech E&O (incl. DSU, BI, SLA violations) | Up to **$400M** |
| Third-party liability (excl. US exposures) | Up to **$100M** |
| Project cargo and transport | Up to **$500M** |
| Integrated risk engineering + cyber impact modelling | Included |

### What It Does NOT Cover
- ❌ **GPU depreciation or obsolescence**
- ❌ **Residual value risk on equipment**
- ❌ **Technology supersession** (your H100s becoming worth less because Blackwell shipped)
- ❌ Market price movements on hardware

### Competitive Relevance to Corgi
**Zero overlap.** Aon's DCLP is about protecting the *physical asset and operations* — fire, flood, construction delays, cyber attacks. It explicitly does not cover the economic risk of GPU value declining due to technological advancement. Corgi's RVG fills a gap that DCLP leaves completely open.

---

## 3. Marsh's Technology Equipment & Data Center Programs

### Marsh Data Centre Insurance & Risk Management Services
- **Scope:** Full lifecycle coverage — project development, financing, construction, operations
- **Coverage:** Property damage, business interruption, construction risks, physical cyber events
- **Focus:** Risk management consulting + insurance placement for data center operators

### Nimbus Facility (Construction Focus)
- **Launched:** June 2025 (UK/Europe); expanded to $2.7B by early 2026
- **Coverage:** Construction all-risks + property damage + DSU + BI for data center builds
- **Geography:** UK, US, Canada, Europe, Australia, New Zealand
- **Nimbus Casualty (Feb 2026):** Up to $75M excess general liability during construction

### What Marsh Does NOT Offer
- ❌ **GPU residual value protection**
- ❌ **Equipment depreciation/obsolescence coverage**
- ❌ **Parametric products tied to GPU pricing**

### Competitive Relevance to Corgi
Same as Aon — **no overlap.** Marsh is the largest insurance broker in the world and they've built a massive data center practice, but it's entirely focused on traditional property/casualty/construction risks. The residual value gap is wide open.

---

## 4. Parametric Insurance Products Tied to GPU Pricing

### Current State: **Essentially non-existent as insurance**

No parametric insurance product currently exists that triggers payouts based on a GPU price index.

**However, the building blocks are emerging:**

| Component | Status | Provider |
|-----------|--------|----------|
| **GPU Price Index (OCPI)** | Live | Ornn Compute Exchange — the Ornn Compute Price Index tracks compute pricing over time |
| **Residual Value Swaps** | Live | Ornn — derivatives contracts using OCPI as reference price |
| **Parametric insurance wrapper** | Does not exist yet | No carrier or MGA has wrapped a parametric policy around GPU pricing data |

### Why This Matters for Corgi
A parametric product tied to a GPU price index would be the *most elegant* form of RVG — simple trigger, fast payout, no claims adjustment. Ornn has built the index. No one has built the insurance product on top of it. **This is a first-mover opportunity.**

---

## 5. Startups & MGAs Working on Similar Products

### Ornn Compute Exchange (Closest Competitor)
- **What:** U.S.-regulated derivatives venue for GPU compute financial products
- **Product:** Residual Value Swaps (RVS) — pay quarterly premium, guaranteed floor price on GPU resale
- **Index:** OCPI (Ornn Compute Price Index) — benchmark for compute pricing
- **Funding:** $5.7M raised
- **Key difference from Corgi:** Ornn is a *derivatives exchange*, not an insurance product. Their RVS is a swap contract, not an insurance policy. This matters for:
  - Regulatory treatment (derivatives vs. insurance regulation)
  - Counterparty risk (exchange vs. rated insurer)
  - Accounting treatment for buyers (hedge vs. insurance asset)
  - Capital requirements for capacity providers
- **Partnership angle:** Ornn's OCPI could potentially serve as a pricing oracle for Corgi's insurance product

### Armilla AI (Different Category)
- **What:** YC-backed Lloyd's coverholder
- **Product:** AI performance insurance — covers financial losses when AI systems underperform
- **Relevance:** Covers AI *model* risk, not hardware depreciation. Different market entirely.

### Munich Re aiSure™ (Different Category)
- **What:** AI performance risk insurance (since 2018)
- **Product:** Triggered by unexpected errors in AI model performance
- **Relevance:** Insures AI *output quality*, not GPU asset values. No overlap.

### Other Notable Mentions
- **Lloyd's $500M AI infrastructure insurance market** — focused on hardware replacement costs, not depreciation
- **AIG cyber-physical policies** — data center cyber/physical risk intersection, not residual values

### Key Takeaway
**No MGA or startup is currently offering insurance-wrapped GPU residual value protection.** Ornn is the closest with derivatives-based swaps, but there is a meaningful structural difference between a swap and an insurance policy.

---

## 6. Traditional Property/Equipment Insurance: What It Covers & Excludes for Data Centers

### What Standard Property Insurance Covers
- ✅ Physical damage from fire, flood, windstorm, explosion
- ✅ Equipment breakdown / mechanical failure
- ✅ Business interruption from covered physical perils
- ✅ Replacement cost of damaged equipment (often with betterment issues)
- ✅ Cargo/transit coverage during shipping
- ✅ Some cyber-physical damage (varies by policy)

### What It Explicitly Excludes
- ❌ **Technological obsolescence** — policies do not pay because your equipment became outdated
- ❌ **Market depreciation** — decline in resale value is not a covered peril
- ❌ **Betterment gap** — insurers only pay to replace with "like kind and quality," forcing operators to pay the difference for modern upgrades
- ❌ **Wear and tear / gradual deterioration**
- ❌ **Loss of value without physical damage** — no trigger unless something physically breaks or is destroyed
- ❌ **Software/firmware obsolescence**
- ❌ **Supply chain price volatility** — if replacement GPUs cost more due to market conditions, not typically covered

### The Specific Problem for GPU Owners
Electronic equipment exclusions in standard property policies can void coverage for servers, GPUs, and networking hardware — which represent **60–70% of a data center's total insurable value**. Even when covered, depreciation is calculated using physical wear models that bear no relationship to how GPUs actually lose value (primarily through architectural supersession, not physical decay).

### The Gap Corgi Fills
Traditional insurance answers: *"What if your GPU is destroyed?"*
Corgi's RVG answers: *"What if your GPU is fine but worth half what you paid?"*

These are fundamentally different risks. Traditional insurance has no product for the second question. This is not a coverage gap that incumbents are racing to fill — it requires a different underwriting model, different data inputs (compute pricing indices, technology roadmap analysis), and different actuarial frameworks.

---

## Competitive Landscape Summary

| Player | Product | Covers Depreciation/Obsolescence? | Structure |
|--------|---------|----------------------------------|-----------|
| **Corgi (planned)** | GPU Residual Value Guarantee | ✅ Yes — core purpose | Insurance policy |
| **Ornn Compute Exchange** | Residual Value Swaps | ✅ Yes — via derivatives | Swap contract on regulated exchange |
| **Aon DCLP** | Data Center Lifecycle Insurance | ❌ No — property/construction/cyber | Multi-line insurance program |
| **Marsh Nimbus** | Data Center Construction Insurance | ❌ No — construction/BI | Insurance facility |
| **Lloyd's AI market** | AI Infrastructure Insurance | ❌ No — hardware replacement at cost | Insurance |
| **Munich Re aiSure** | AI Performance Insurance | ❌ No — model output quality | Insurance |
| **Armilla AI** | AI Performance Insurance | ❌ No — model liability | Insurance |
| **AIG** | Cyber-Physical Policies | ❌ No — cyber/physical damage | Insurance |
| **Deal-specific RVI** | Bespoke ABS enhancements | ⚠️ Partial — one-off, not standardised | Bespoke guarantee |

---

## Strategic Implications for Corgi

1. **True white space.** No standardised, insurance-wrapped GPU residual value product exists. The market discusses it constantly but no one has shipped it.

2. **Ornn is complementary, not competitive.** Their OCPI index could serve as Corgi's pricing oracle. Their swap product serves a different buyer profile (sophisticated derivatives users) vs. Corgi's insurance product (broader market, simpler structure, rated insurer backing).

3. **Incumbents aren't coming soon.** Aon and Marsh have built massive data center practices but they're focused on traditional perils. Residual value risk requires fundamentally different underwriting — it's not an extension of property insurance.

4. **The ABS market is the demand signal.** $8B in GPU ABS in 2025, $25B forecast by 2028. Every one of those deals needs residual value protection. Currently they're using equity buffers or bespoke one-off guarantees. A standardised insurance product would be transformative.

5. **First-mover advantage is real but time-limited.** The concept is well-understood in finance circles. The "exotic structures like obsolescence insurance" are forecast to arrive in "2-3 years." Corgi has a window.

---

*Sources: Aon press releases (Jan 2026), Marsh press releases (2025-2026), Insurance Business Magazine, Ornn Compute Exchange, Substack analyses (Cash & Cache, Dave Friedman), Medium (Elongated Musk GPU ABS series), Morgan Lewis, Reed Smith, Covington & Burling law firm analyses, Lloyd's of London, Munich Re, CNBC, SiliconANGLE, Introl research.*
