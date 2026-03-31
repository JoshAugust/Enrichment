# Alternative Risk Transfer, ILS & Rating Agency Research
*Wave 6 — March 2026*

---

## 1. Lambda Labs GPU ABS / Securitization (2024–2025)

**Lambda Labs $500M GPU-Backed Facility (April 2024)**
- Secured loan backed by Nvidia GPU collateral — led by **Macquarie Group** with participation from Industrial Development Funding (IDF)
- **NOT a formally rated ABS** — structured as a bespoke secured loan facility (single-borrower, unrated), priced at higher yield to compensate
- Effectively an ABS in structure but without formal rating agency involvement at issuance

**Broader GPU ABS Market Context (2025)**
- Until 2025, **S&P capped data center ABS ratings at A+** given the sector's limited history
- By early 2025: first-ever formal GPU ABS deal — **$1.1B shelf financing**, AAA-rated notes priced inside 110bps spread
- **Moody's** signaled no hard cap for senior tranches with robust credit enhancement
- S&P and Moody's both increasingly active in rating GPU/data-center ABS as the asset class matures
- Senior tranches achieving AAA with sufficient overcollateralization and structural protections

**Key Takeaway for ILS Context:** GPU assets are crossing into rated structured finance, but as traditional ABS (not ILS). The Lambda deal shows the unrated/bespoke version; 2025 market shows rated, investment-grade evolution. No insurance-linked wrapper yet identified.

*Sources: BusinessWire, Medium (elongated_musk analysis), The Register, Sacra*

---

## 2. Catastrophe Bond + Technology Equipment Depreciation — Precedent Search

**Finding: No direct precedent identified** for a cat bond or ILS structure that incorporates technology equipment depreciation as a trigger or collateral component.

**What cat bonds currently do:**
- Trigger on predefined catastrophe events (e.g., hurricane causing $500M+ insured losses, earthquake ≥ M7.0)
- Provide risk transfer from insurers to capital markets, uncorrelated with traditional financial assets
- Principal repaid only if trigger event does NOT occur; otherwise funds recovery

**Technology equipment depreciation context:**
- GAAP accelerated depreciation used for IT equipment (rapid obsolescence)
- Servers/workstations qualify for immediate expensing under certain tax provisions
- IT equipment can become obsolete before physical deterioration — key risk factor for GPU collateral structures

**Gap / Opportunity:** No cat bond or ILS structure has yet been identified that uses technology equipment **depreciation curves** as a trigger parameter. The closest analogy would be parametric structures tied to observable indices — but equipment value indices for GPUs are not yet standardized or exchange-traded, making parametric trigger design non-trivial.

**Implication for GPU-ILS concept:** The absence of precedent is itself notable — it represents a genuine structural innovation gap.

*Sources: Chicago Fed (cat bond primer), Artemis, Wikipedia, III.org*

---

## 3. Aircraft Residual Value Insurance (RVI) — Structure & Securitization Analogy

**This is the most relevant structural precedent for GPU residual value risk.**

### Aircraft ABS Structure
- SPV purchases aircraft + lease payment rights in a **true sale** from the seller/lessor
- SPV finances via tranched debt (senior/junior notes) and equity
- Cash flows: lessee payments + aircraft sales → expenses → principal/interest on notes
- Residual value (aircraft sale proceeds) contributes **meaningfully** to securitization cash flows

### How Residual Value Insurance (RVI) Works
- **RVI = put option** purchased by the lessor/equity investor
- In exchange for an upfront premium, equity investor gains right to **sell the aircraft to the insurer at a fixed price on a fixed date**
- Covers the **deficiency** when fair market value at lease termination < insured value
- Shifts residual value risk from lender → insurer
- Often structured as **security assignment** (lender = security assignee under the policy)

### Why It's Used in Securitizations
- Increases lender pool → better competition → tighter spreads for equity investor
- Bridges the gap between **financing duration** and **asset economic life**
- Allows operators to reimburse less capital; residual risk transferred to third party

### Regulatory Notes (ABS)
- Lease-backed securities qualify as ABS if residual value < 50% of original pool balance (or 65% for certain assets)
- Shelf registration (Form S-3) requires residual value < 20% of original pool balance

### Rating Methodology
- **AM Best** has a published rating methodology draft specifically for **Rating Residual Value Insurance** — directly applicable to GPU RVI concept
- Key RVI providers: **Tokio Marine HCC**, **Matrix Specialty Underwriting**, **RVI Group** (NAFA)

### GPU Application
- This structure maps almost exactly to a GPU RVI product:
  - GPU buyer/operator leases GPU fleet → SPV securitizes lease payments
  - RVI policy protects against GPU value falling below insured level at lease end
  - Insurer absorbs residual value risk; lender/investor protected
- Key challenge: GPU depreciation is **faster and less predictable** than aircraft, making actuarial modeling harder but not impossible

*Sources: Structured Finance Association Aircraft ABS Primer, Katten Muchin (JDSupra), Norton Rose Fulbright, AM Best Rating Methodology, Tokio Marine HCC, ISTAT*

---

## 4. Nephila Capital — AUM, Leadership & Investment Focus (2026)

**AUM:** $7.7 billion third-party AUM as of January 1, 2026
- Up from ~$7B at September 30, 2024
- Down ~40% since Markel Group acquisition in 2018 — but **intentionally strategic**: portfolios now use more capital efficiency/leverage, enabling more risk written per dollar of investor capital
- Fund management revenues: **+68% to $159.2M** for Markel in 2025 (strong revenue despite AUM decline)

**Leadership:**
- **Jessica Laird** — CEO, Nephila Capital (promoted from Property Catastrophe leader)
- **Greg Hagood** — Co-Founder & CEO, Nephila Holdings
- **Laura Taylor** — President, Nephila Holdings
- **Frank Majors** — Co-founder, stepped back from leadership to focus on portfolio construction
- Owned by **Markel Group** since 2018

**Investment Focus (2026):**
1. **Catastrophe Reinsurance** — cat bonds + collateralized cat reinsurance (core)
2. **Climate/Weather Risk** — partnered with Markel underwriting; Nephila Climate strategy covers renewable energy + agriculture (net zero transition focus)
3. **Specialty Insurance** (launched 2022) — selective **non-catastrophe**: energy, aviation, terror, **cyber**
4. **Capacity Discipline** — managing capacity tightly, value over volume; positioning as solutions provider, not commodity capacity

**Key Quote:** *"Solving problems for cedants and generating attractive risk-adjusted returns for investors, focusing on areas that require more capacity rather than being a commodity capacity provider."*

**ILS Relevance:** Nephila's specialty/non-cat sleeve and climate focus suggests openness to novel risk transfer structures. Their energy + aviation exposure indicates comfort with asset-backed risk. Potential target for a GPU/tech RVI pitch given their alternatives appetite.

*Sources: Artemis.bm, Nephila.com, Reinsurance News*

---

## 5. Fermat Capital Management — ILS Leadership Profile

**AUM:** ~$9.9 billion in ILS assets (as of December 31, 2025) — recently hit milestone $10B
- Largest pure-play cat bond / ILS manager globally
- Focus: **institutional portfolios of ILS with emphasis on catastrophe bonds**

**Leadership:**
- **Dr. John Seo** — Co-Founder & Managing Director
  - PhD Biophysics, Harvard (1991); BS Physics, MIT
  - 30+ years fixed income, FX options, interest-rate derivatives
  - Former head insurance-risk trader, Lehman Brothers; former officer at Lehman Re; former state-appointed advisor to Florida Hurricane Catastrophe Fund
  - Profiled by Bloomberg (2024): *"The Physics Whiz Fund Manager Winning Against Nature"*

- **Nelson Seo** — Co-Founder & Managing Director (brother of John)
  - 25+ years commodities, derivatives, bond trading, investment banking
  - Co-developed Fermat's real-time cat bond evaluation and pricing methods

- **Brett Houghton** — Managing Director
  - 20+ years structured products (life insurance + catastrophe)
  - Prior: MD at Rochdale Securities (fixed-income trading)
  - SIFMA member

- **Adam Dener** — Managing Director & Founding Partner (Trade Finance)
  - Established Fermat's **trade credit investment management** strategy
  - Notable: Fermat expanded beyond cat bonds into trade finance — shows appetite for non-catastrophe structures

**2022: Cyber Risk Expansion**
- Fermat chose **CyberCube Portfolio Manager** for cyber ILS exposure management — confirms non-nat-cat expansion trajectory

**ILS Relevance:** Fermat's expansion into trade finance and cyber signals openness to non-traditional ILS. Their quant/physics-heavy team may be well-positioned to model GPU depreciation curves as a parametric risk. Highest-profile potential validator for a GPU-ILS product.

*Sources: Artemis.bm, fcm.com, Bloomberg, BusinessWire, SEC IARD*

---

## 6. AM Best — GPU / Technology Asset Insurance Rating

**Finding: No specific AM Best methodology for GPU-backed insurance or GPU technology assets exists (as of March 2026)**

**What AM Best Does Rate:**
- Insurance carriers (balance sheet strength, operating performance, business profile, ERM)
- **Residual Value Insurance** — AM Best has a published draft rating methodology for RVI (see Topic 3, `rc=234387`)
- Financial strength of insurers writing specialty lines (including tech, cyber, equipment)

**Relevant AM Best Positions on Tech Assets:**
- AM Best flags that "investments in untested technologies or start-ups may carry increased credit risks"
- Asset quality assessment covers insurer portfolios: GPU-heavy investments would be scrutinized for concentration risk and technology obsolescence
- No specific GPU asset class guidance exists — falls under general high-risk alternative investment assessment

**Notable Tangent — GPU in Insurance Operations:**
- ScienceDirect study on GPU parallel processing for asset-liability management at insurance companies — shows GPUs as operational tools, not rated assets

**Gap Identified:** AM Best does not have a GPU-specific rating criterion. A GPU RVI product would likely be evaluated under:
1. AM Best's general RVI methodology (drafted for aviation — adaptable)
2. Specialty lines/technology insurance criteria
3. Potentially classified as "non-traditional" ILS if structured with capital markets components

**Key AM Best Document:** Rating Residual Value Insurance methodology (`rc=234387`) — most applicable existing framework for GPU value protection structures

*Sources: AM Best Rating Methodology portal (ambest.com), ScienceDirect*

---

## 7. S&P & Fitch — GPU-Backed Securities / AI Infrastructure Ratings (2025)

**Market Scale:** Data-center/GPU ABS issuance ~$8B in 2025; forecast to reach **$25B by 2028**

### S&P Global
- **First major agency** to release data center rating criteria — published **June 2024**, revised **August 2025**
- Initially capped data center ABS ratings at **A+** (limited sector history)
- By late 2025: senior GPU ABS tranches achieving **AAA** with sufficient credit enhancement
- S&P separately upgraded NVIDIA to **AA-** on continued financial strength
- S&P published: "AI Infrastructure Buildout Weighs Credit Risks and Rewards" + "Where Are AI Investment Risks Hiding?"
- S&P AI infrastructure midyear 2025 report notes GPU/AI capex cycle dynamics and credit profile shifts

### Fitch Ratings
- Published **exposure draft July 24, 2025** — soliciting feedback on whether CMBS Large Loan Rating Criteria should apply to structured finance data center transactions (CMBS + ABS)
- **Key Fitch position:** Data centers for **AI training** viewed **less favorably** than those for cloud computing — citing higher obsolescence risk and concentration
- No final published criteria as of July 2025; still in consultation phase

### Moody's
- Signaled **no hard cap** on senior data center/GPU ABS tranche ratings with robust credit enhancement
- Most accommodating of the big three for high-rated GPU collateral structures

### Market Pricing Evolution
- 2024: ~150bps over Treasuries for senior bonds
- Early 2025: Spreads inside **110bps** (rivaling prime auto ABS) — massive demand compression
- First GPU ABS: $1.1B shelf financing, AAA-rated

### Key Risk Factors Identified by Agencies
- **Technological obsolescence** (Nvidia H100 → H200 → Blackwell cycle)
- Demand fluctuations for GPU compute
- Single-borrower concentration (Lambda-style deals penalized)
- AI training vs. inference vs. cloud use case differentiation

**CRA Research (Dec 2025):** Published "Data Center ABS – Risks, Yields, and Ratings" — comprehensive market analysis available.

*Sources: CRA.com (Dec 2025 report), S&P Global Ratings, Fitch (exposure draft), Medium (GPU ABS analysis), Two Birds law firm*

---

## 8. ILS Market — Non-Catastrophe & Specialty Risk Expansion (2025)

**Market Scale:**
- Outstanding cat bond / ILS risk capital at record **~$61.3 billion** at end of 2025
- Cumulative ILS market activity surpassed **$200 billion** tracked since inception (Artemis)
- Q2 2025: New quarterly issuance record — strong repeat + first-time sponsors
- Collateralized reinsurance sidecars outstanding: ~$17B (up ~70% YoY) — expanding into casualty + specialty

**Non-Cat Specialty Lines Now Active in ILS:**

| Risk Type | Status | Details |
|---|---|---|
| **Cyber** | Active | $750M+ in 144A cat bonds deployed (2024); Hannover Re, Beazley, Chubb renewals in 2025; Beazley launching dedicated cyber ILS fund (2026 Bermuda platform) |
| **Casualty** | Growing | Low-volatility, uncorrelated with property cat; increasingly appealing to institutional investors |
| **Mortality/Longevity** | Established | Life insurers transferring mortality + longevity risk via capital markets |
| **Morbidity** | Active | $200M U.S. morbidity risk transferred to capital markets in 2025 |
| **Terrorism** | Novel | GAREAT (French terrorism pool) placed $105M — new peril entering ILS |

**Key Structural Insight:**
- Cyber ILS structures use **Securities Act Rule 144A** — exempt from full SEC registration; standard for institutional ILS distribution
- ILS is "becoming a significant force" in casualty and cyber (Artex, 2025)

**Implication for GPU/Tech ILS:**
- The market has a well-worn path for novel risk types entering ILS: start with retrocession/private placement → develop triggers → achieve rated cat bond status
- GPU technology obsolescence risk maps most closely to **cyber** in terms of being a new, non-nat-cat systemic tech risk
- Casualty ILS precedent (casualty reserve development risk) shows ILS can handle financial/actuarial rather than physical event triggers

*Sources: Swiss Re ILS Market Insights Feb 2025, Artemis.bm, Geneva Association Cyber ILS Report, NAIC, Risk & Insurance*

---

## 9. GPU Depreciation + ILS / Parametric Insurance — Emerging Landscape

**GPU Depreciation Risk — Financial Materiality:**
- Single GPU cluster failures: potential **$10M daily losses**
- **40% of AI startups** have experienced infrastructure incidents
- Hyperscalers (Amazon, Alphabet, Microsoft) extended server useful life from 3–4 years → **6 years** (accounting policy)
- Michael Burry warned this "completely underestimates the rapid pace of AI hardware advancement"
- theCUBE Research / Tom's Hardware coverage: GPU depreciation called potential "next big crisis" for AI hyperscalers

**Emerging Insurance Solutions — GPU-Specific:**
- **Lloyd's of London**: Established a **$500M AI infrastructure insurance market**
- **Munich Re**: Offers specialized GPU coverage
- **Parametric insurance for cloud GPU outages**: Gaining traction (per Introl.com)
- Parametric triggers: Fast payouts, event-threshold-based, blockchain-automated

**Parametric + ILS Convergence:**
- Parametric triggers already used across ILS structures — natural fit for GPU risk
- Enablers: IoT monitoring, blockchain-automated triggers, ML risk models, real-time data
- Key challenge for GPU: No standardized, observable index for GPU spot values (unlike hurricane wind speed)
- **Potential trigger designs:**
  - Secondary market GPU price index (H100 spot price falls below X%)
  - Compute utilization index (capacity factor falls below threshold)
  - Hardware generation obsolescence event (new chip announced exceeds X% performance delta)

**Market Participants Identified:**
- **Descartes Underwriting** — parametric for climate, cyber, emerging risks (possible GPU extension)
- **Munich Re** — already writing GPU-specific coverage
- **Lloyd's syndicates** — $500M AI infrastructure capacity established
- **Introl** — insurance for AI infrastructure operators ($100M+ GPU investments)

**Structural Path to ILS:**
1. Indemnity/parametric insurance product written by carrier (Munich Re, Lloyd's)
2. Carrier reinsures peak risk via collateralized reinsurance / sidecar structure
3. ILS investors absorb tail risk — potentially as a 144A cat bond with technology obsolescence trigger

*Sources: Introl.com, Tom's Hardware, theCUBE Research, Bermuda Re ILS/Parametric, FSI-IAIS, Munich Re, WEF, Descartes Underwriting*

---

## 10. Twelve Securis — ILS Manager Profile

**Formation:** Merger of **Twelve Capital** + **Securis Investment Partners**
- Announced: July 25, 2024
- Closed: Early 2025
- Combined entity: **Twelve Securis**

**Scale:**
- **~$9.7 billion AUM** (as of June 2025)
- History tracing to 2005
- 90+ experienced professionals
- Offices: Zurich, London, Munich, Bermuda, Tokyo

**Investment Strategies:**

| Strategy | Description |
|---|---|
| **Cat Bonds** | Liquid, tradeable event risk instruments — tropical cyclones, earthquakes, other cat perils |
| **Private ILS** | Bespoke private (re)insurance transactions unavailable in public markets; higher yields via illiquidity premium |
| **Insurance Bonds** | Fixed income — investment-grade debt issued by insurance companies; European focus |
| **Insurance Private Debt** | Solvency capital solutions for smaller European insurers |
| **Multi-Asset** | Blends cat bonds + insurance bonds + listed insurance equity; UCITS format + custom mandates |

**Key Differentiators:**
- Deep expertise in **catastrophe risk modeling**, **capital markets**, and **reinsurance underwriting**
- Private ILS sleeve is particularly relevant — tailored, bespoke structures for novel risk types
- UCITS-format fund availability (regulatory pathway for European institutional investors)
- ERS (Employers' Reinsurance Solutions) launched ILS unit with Securis/Twelve Capital — indicating active deal origination relationships

**ILS Relevance for GPU/Tech:**
- **Private ILS strategy** is the natural entry point for a novel tech risk structure — bespoke, illiquidity premium, not public market
- Twelve Securis's multi-asset + private debt capabilities could accommodate a GPU RVI / tech obsolescence structure
- Bermuda office critical — Bermuda remains the primary ILS issuance jurisdiction
- Size ($9.7B) and global network make them a tier-1 target for novel risk origination

*Sources: Artemis.bm, TwelveSecuris.com, Bermuda Re, Reinsurance News, B-FLEXION, Intelligent Insurer*

---

## Summary & Key Takeaways

### What Exists (2025)
1. **GPU ABS market** fully established — $8B+ issuance, AAA-rated tranches, S&P/Moody's coverage, growing to ~$25B by 2028
2. **Aircraft RVI** — mature precedent for asset-value insurance in securitization; AM Best has rating methodology
3. **Non-cat ILS** — cyber, casualty, mortality, terror all active; market ~$61B outstanding
4. **Munich Re + Lloyd's** writing GPU insurance already ($500M AI infrastructure capacity)
5. **Parametric triggers** proven in ILS; blockchain/IoT enabling new asset classes

### What Doesn't Exist Yet
1. **GPU Residual Value Insurance (RVI)** in ILS/cat bond format — no precedent identified
2. **Technology obsolescence parametric trigger** in ILS — no standardized index
3. **Rated GPU insurance-linked product** — gap between GPU ABS (structured finance) and GPU ILS (insurance wrapper)

### Key Players for GPU-ILS Development
| Role | Candidates |
|---|---|
| **ILS Investor** | Nephila Capital, Fermat Capital, Twelve Securis |
| **Insurance Capacity** | Munich Re, Lloyd's, Tokio Marine HCC |
| **Structuring/Rating** | S&P (data center criteria), AM Best (RVI methodology), Moody's |
| **Origination** | Macquarie (GPU ABS), specialty ILS desks at Aon, Gallagher Re |
| **Novel Parametric** | Descartes Underwriting, Beazley (cyber ILS), Artex |

*Research complete — Wave 6, March 2026*
