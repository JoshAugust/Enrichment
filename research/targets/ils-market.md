# Insurance-Linked Securities (ILS) Market — GPU RVG Reinsurance Capacity Research

> **Last Updated:** 2026-03-29
> **Purpose:** Assess ILS/cat bond market for potential GPU residual value guarantee (RVG) reinsurance capacity

---

## 1. How ILS Funds Work & Major Players

### How ILS Works

Insurance-Linked Securities transfer insurance risk directly to capital markets investors. The core mechanism:

1. **Sponsor** (insurer/reinsurer) creates a **Special Purpose Vehicle (SPV)**, typically domiciled in Bermuda or Cayman Islands
2. SPV issues **notes/bonds** to capital market investors — proceeds go into a **collateral trust**
3. Investors receive **coupon payments** (premium + risk-free rate) in exchange for bearing the risk
4. If a **trigger event** occurs (e.g., catastrophe loss exceeds threshold), collateral pays claims
5. If no trigger → investors get full principal back at maturity

**Key characteristics:**
- Fully collateralized — no counterparty credit risk
- Typically 3-year terms, annual resets
- Returns uncorrelated with broader financial markets (key selling point to pension funds)
- Triggers can be: indemnity (actual losses), parametric (physical measurements), modeled loss, or industry loss index

### Major ILS Fund Managers (by AUM)

| Fund Manager | AUM | Notes |
|---|---|---|
| **Fermat Capital Management** | ~$10.1B (Dec 2024) | #1 by AUM. Founded 2001 by John & Nelson Seo. Serves pension funds, sovereign wealth funds, endowments |
| **Twelve Securis** (merged) | ~$7.8B | Merger of Twelve Capital + Securis Investment Partners completed early 2025. Largest UCITS cat bond fund ($4.5B+) |
| **Nephila Capital** | ~$7.6B (Sep 2025) | Owned by Markel Corp (acquired 2018). 80% of capital from global pension funds. 300+ investors |
| **LGT ILS Partners** | ~$5.8B total / $3.5B direct ILS | Part of LGT Capital Partners (owned by Liechtenstein royal family). Parent has $100B+ AUM |
| **Schroders Capital** | ~$4B+ (UCITS fund alone) | GAIA Cat Bond Fund surpassed $4B Nov 2025. Major institutional asset manager |
| **Plenum Investments** | ~$2B+ (Feb 2026) | Swiss-based. Focus on UCITS cat bond and insurance bond funds |
| **Leadenhall Capital Partners** | ~$1.6B (Q3 2025) | London-based. UCITS ILS Fund grew 79% in 2024 |

**Other notable players:**
- **Credit Suisse ILS** (now UBS ILS) — historically significant, restructured post-UBS acquisition
- **Elementum Advisors** — Bermuda-based, mid-tier
- **Tangency Capital** — London-based
- **Stone Ridge Asset Management** — US-based, significant cat bond allocation
- **Man AHL** — recently launched UCITS Systematic Cat Bonds fund
- **Icosa Investments** — hit $1B AUM milestone

### Investor Base

Primary investors in ILS: **pension funds** (dominant, ~60-80% of capital), **sovereign wealth funds**, **endowments**, **family offices**, **hedge funds**, and increasingly **retail investors** via UCITS structures.

---

## 2. Could GPU Depreciation Risk Be Packaged as an ILS Instrument?

### Short Answer: Theoretically Yes, But Would Be Unprecedented

GPU residual value / depreciation risk is **not a natural catastrophe peril** — ILS has historically been dominated by nat-cat risks (hurricane, earthquake, flood). However, the market is actively diversifying:

### Precedents for Non-Natural Peril ILS

| Precedent | Details | Relevance |
|---|---|---|
| **Cyber cat bonds (Polestar Re)** | Beazley's PoleStar Re program — first cyber cat bond in 2023 ($45M), scaled to $300M by 2026. Now has $1B+ cyber reinsurance tower from capital markets | **Most relevant precedent.** Proves technology-driven, non-natural perils can be securitized. Took ~3 years to build investor confidence |
| **French terrorism bonds** | $100M issuance | Non-natural peril successfully placed |
| **Mortality/longevity bonds** | Life insurance risk transferred to capital markets | Demonstrates non-property risk can work |
| **Auto lease ABS with RV risk** | Residual value risk on vehicles securitized routinely | Direct precedent for equipment depreciation risk in structured finance (not ILS per se, but similar risk transfer) |
| **Residual value insurance** | Insurers already guarantee residual values of autos, aircraft, industrial equipment | Existing underwriting expertise for RV risk |

### Structural Feasibility for GPU RVG ILS

**Potential structure:**
```
GPU RVG Cat Bond Flow:
Sponsor (GPU lessor/insurer) → SPV → Issues notes → Investors
                                   ↓
                              Collateral trust
                                   ↓
                        Triggered if GPU residual values
                        fall below defined threshold
```

**Trigger options for GPU RVG ILS:**
1. **Parametric trigger** — based on observable GPU benchmark prices (e.g., secondary market index, NVIDIA list price changes, new GPU generation release dates)
2. **Indemnity trigger** — based on actual losses on a portfolio of GPU RVGs
3. **Industry loss trigger** — based on total industry GPU depreciation exceeding a threshold
4. **Modeled loss trigger** — using a depreciation model incorporating technology cycle, demand drivers, new chip releases

### Challenges

- **No existing loss models** — Unlike nat-cat (decades of hurricane/earthquake data), GPU depreciation has limited actuarial history
- **Moral hazard** — Technology obsolescence is partly driven by the same companies (NVIDIA) that might benefit from RVG capacity
- **Correlation risk** — All GPUs depreciate on similar schedules (unlike geographically diversified nat-cat risk)
- **Small market initially** — May not reach the $200M+ deal sizes ILS investors prefer
- **Basis risk** — If using parametric triggers, mismatch between index and actual portfolio losses

### Path to Market

1. **Start with collateralized reinsurance** or private cat bond ($25-50M) to build track record
2. **Develop a GPU depreciation index** — observable, transparent, auditable
3. **Partner with an ILS broker** (Aon Securities or GC Securities) to structure and place
4. **Target ILS funds seeking diversification** — GPU risk is uncorrelated with nat-cat, which is highly attractive
5. **Scale to 144A public issuance** once proof of concept established (following Polestar Re playbook)

---

## 3. Alternative Risk Transfer (ART) Structures

### Reinsurance Sidecars

- **What:** SPV created to allow investors to take on risk/return from a defined book of business
- **How:** Provides quota share reinsurance to a sponsoring reinsurer — shares premiums and losses proportionally
- **Duration:** Typically 1-2 years
- **Domicile:** Usually Bermuda or Cayman Islands
- **Capacity:** Sidecar market estimated at record ~$10B in 2024
- **GPU RVG fit:** ★★★★☆ — Could create a GPU RVG sidecar alongside a primary insurer. Investors participate directly in the RVG book's P&L. Simple structure, quick to set up.

### Industry Loss Warranties (ILWs)

- **What:** Reinsurance/derivative contract triggered by total *industry* losses from a specified event, not the buyer's own losses
- **How:** Buyer pays premium → if industry-wide loss exceeds trigger → pays limit
- **Cost:** Cheaper than traditional reinsurance; minimal moral hazard
- **Market:** Traded OTC; active during live events ("live cat" trading)
- **GPU RVG fit:** ★★☆☆☆ — Would require a credible "GPU industry depreciation loss" index. Possible but needs index infrastructure first.

### Collateralized Reinsurance

- **What:** Reinsurance contract fully backed by collateral in a trust account equal to the contract limit
- **How:** Investor puts up full collateral at inception → earns premium → collateral pays claims or returns to investor at maturity
- **Market size:** ~$55B of capacity (largest ART component)
- **Advantages:** No credit risk; attracts pension funds and hedge funds seeking uncorrelated returns
- **GPU RVG fit:** ★★★★★ — **Best starting structure.** Fully collateralized, can be placed privately, doesn't need public issuance infrastructure. A single ILS fund or pension fund could provide capacity directly.

### Comparison for GPU RVG

| Structure | Minimum Size | Time to Market | Investor Familiarity | Recommended? |
|---|---|---|---|---|
| Collateralized reinsurance | $10-50M | 3-6 months | High | **Yes — start here** |
| Sidecar | $25-100M | 6-12 months | High | Yes — Phase 2 |
| Private cat bond | $50-200M | 6-12 months | Medium | Yes — Phase 2-3 |
| 144A public cat bond | $200M+ | 12-18 months | Low (novel risk) | Phase 3-4 |
| ILW | $5-25M | 3-6 months | Low (needs index) | Later, once index exists |

---

## 4. ILS Brokers & Deal Structurers

### Tier 1: Dominant Arrangers

#### Aon Securities
- **Role:** #1 ILS broker/arranger globally
- **Outstanding risk capital:** $27B+ in cat bond deals
- **Capabilities:** Full-service ILS advisory, structuring, placement, and secondary trading
- **Annual report:** Publishes flagship ILS Annual Report (key market reference)
- **Parent:** Aon plc (global reinsurance broker)
- **Key unit:** Aon Securities LLC — registered broker-dealer
- **GPU RVG relevance:** Best positioned to structure novel ILS. Has placed non-traditional perils. Would be the recommended first call.
- **Contact approach:** Through Aon's reinsurance intermediary relationships or direct to Aon Securities ILS team

#### GC Securities (Guy Carpenter)
- **Role:** #2 ILS broker/arranger globally
- **Outstanding risk capital:** $21.7B+ in cat bond deals
- **2025 performance:** Record 23 cat bond issuances in H1 2025 alone
- **Parent:** Marsh McLennan (Guy Carpenter is the reinsurance broking arm)
- **Key people:** Cory Anger (formerly head of ILS), Shiv Kumar (cat bond structuring)
- **Capabilities:** Cat bond structuring, sidecar advisory, collateralized reinsurance placement
- **GPU RVG relevance:** Strong innovation track record. Would be strong alternative/co-arranger.

### Tier 2: Significant Players

#### Swiss Re Capital Markets
- Arm of Swiss Re (world's second-largest reinsurer)
- Publishes semi-annual ILS Market Insights reports
- Active structurer and investor
- Significant proprietary ILS capacity

#### Gallagher Securities
- Part of Gallagher Re (Arthur J. Gallagher)
- Growing ILS presence
- Active in sidecar and collateralized reinsurance placements

#### BMS Group
- Independent reinsurance broker
- Active in ILW and collateralized reinsurance markets

### Tier 3: Specialty/Niche

- **Twelve Capital / Twelve Securis** — Also acts as placement agent alongside fund management
- **JLT Re (now Marsh)** — Absorbed into Marsh/Guy Carpenter post-acquisition
- **Willis Towers Watson Securities** — Part of WTW, active in ILS placement

---

## 5. Total ILS Market Size & Tech Risk Securitization History

### Market Size (2024-2025)

| Metric | Value | Source |
|---|---|---|
| **Total ILS market capacity** | $107B (end 2024), growing ~$121B (2025) | Aon, Artemis |
| **Outstanding cat bonds** | $49.5B (end 2024) → $61.3B (end 2025) | Swiss Re, Artemis |
| **2025 new issuance** | $25.6B (record, +45% YoY) | Artemis |
| **Number of transactions (2025)** | 122 (first year to exceed 100 deals) | Artemis |
| **Collateralized reinsurance capacity** | ~$55B | Industry estimates |
| **Sidecar capacity** | ~$10-13B | Aon Securities |
| **UCITS cat bond fund AUM** | $19.12B (end 2025, +39% YoY) | Artemis |
| **Average deal size (H1 2025)** | $302M (+12% vs H2 2024) | Artemis |

### 10-Year Growth

The ILS market has roughly **tripled** from ~$35B (2015) to $107B+ (2024). Cat bond issuance specifically went from ~$7B/year to $25B+/year.

### Has Tech/Equipment Risk Ever Been Securitized?

| Category | Example | Status |
|---|---|---|
| **Cyber risk** | Polestar Re (Beazley) — $300M cyber cat bond | ✅ Active, scaling rapidly |
| **Auto residual value** | Auto lease ABS (BMW, Ally, etc.) | ✅ Mature market ($50B+ outstanding) |
| **Aircraft residual value** | EETC/aircraft ABS with RV components | ✅ Common in aviation finance |
| **Equipment lease ABS** | Various (CNH, AGCO, Caterpillar) | ✅ Active market |
| **Technology equipment** | Server/IT equipment lease ABS | ⚠️ Very limited, mostly embedded in broader equipment ABS |
| **GPU/semiconductor-specific** | None found | ❌ No known precedent |
| **Parametric technology risk** | None found | ❌ No known precedent |

**Key insight:** While **residual value risk** is routinely securitized in auto/aircraft/equipment ABS markets, it has **never been done as an ILS instrument** tied to technology depreciation specifically. The cyber cat bond precedent (Polestar Re) provides the closest template for bringing a novel technology-adjacent risk to ILS investors.

---

## 6. Key Contacts & Approach Strategy

### Priority Targets (ILS Funds — Most Likely to Invest)

| Organization | Key People | Why Target | Contact Approach |
|---|---|---|---|
| **Fermat Capital Management** | John Seo (Co-founder/CIO), Nelson Seo (Co-founder) | Largest ILS fund. Innovation-minded. Needs diversification from nat-cat | Direct outreach. Based in Westport, CT |
| **Nephila Capital** | Frank Majors (CEO, post-Markel) | Major ILS fund. Markel ownership provides balance sheet flexibility | Through Markel relationship or direct |
| **LGT ILS Partners** | Key contact through LGT Capital Partners | Royal family backing = patient capital. Seeks uncorrelated returns | Through LGT Capital Partners, Pfäffikon, Switzerland |
| **Twelve Securis** | Contact through merged entity | Recently merged, seeking differentiation. Largest UCITS fund | London/Zurich offices |
| **Leadenhall Capital Partners** | Luca Albertini (CEO) | London-based, fast-growing, open to innovation | Direct, London |
| **Plenum Investments** | Dirk Schmelzer (Senior PM) | Swiss, actively expanding, diversification-hungry | Zurich |

### Priority Targets (Brokers — Structure the Deal)

| Organization | Key People / Units | Why Target | Contact Approach |
|---|---|---|---|
| **Aon Securities** | ILS structuring team; Paul Schultz (CEO of Aon Securities) | #1 arranger. Best placed to bring novel risk to market | Through Aon reinsurance broker relationship, or direct to Aon Securities |
| **GC Securities / Guy Carpenter** | Shiv Kumar (ILS structuring), formerly Cory Anger | #2 arranger. Record deal flow. Innovation track record | Through Guy Carpenter/Marsh McLennan relationship |
| **Swiss Re Capital Markets** | ILS structuring desk | Both arranger AND potential investor (balance sheet capacity) | Direct or through broker |

### Secondary Targets (Innovation-Oriented)

| Organization | Notes |
|---|---|
| **Beazley** | Proved non-traditional ILS works with cyber. Might be interested in underwriting GPU RVG as a primary insurer, then securitizing via cat bond |
| **Stone Ridge Asset Management** | US-based, large cat bond allocations, known for innovative approaches |
| **Man AHL** | Just entered ILS via systematic approach — may be receptive to novel, quantifiable risks |
| **CyberCube** | Analytics firm for cyber cat bonds — could there be a "GPU Cube" equivalent for modeling? |

### Recommended Approach Sequence

1. **Engage Aon Securities or GC Securities first** — they can assess market appetite before you approach investors
2. **Build a GPU depreciation model/index** — ILS investors need quantifiable, modelable risk
3. **Start with collateralized reinsurance** placement to 1-2 ILS funds seeking diversification
4. **Target Fermat or Nephila** as anchor investors for proof of concept
5. **Scale to private cat bond** once track record established (12-18 months)
6. **Eventual 144A public issuance** as market matures

---

## Summary & Strategic Assessment

### Opportunity

The ILS market is **$107B+ and growing 10%+ annually**, actively seeking diversification away from nat-cat concentration. GPU depreciation risk is:
- ✅ **Uncorrelated** with natural catastrophe losses (huge selling point)
- ✅ **Quantifiable** (GPU prices are observable, depreciation curves can be modeled)
- ✅ **Growing** (AI infrastructure buildout = more GPUs needing RVG capacity)
- ⚠️ **Novel** (no direct precedent, but cyber cat bonds proved novel risks can enter the market)
- ⚠️ **Concentrated** (single-manufacturer dependency on NVIDIA is a concern for investors)

### Recommended Structure

**Phase 1:** Collateralized reinsurance ($10-50M) with one anchor ILS fund
**Phase 2:** Private cat bond or sidecar ($50-200M) with broader investor base
**Phase 3:** 144A public cat bond ($200M+) once market accepts the risk class

### Key Risk for ILS Approach

The biggest challenge isn't finding capital — it's **building the loss model**. ILS investors require:
- Historical depreciation data (at least 5-10 years)
- Forward-looking technology cycle modeling
- Independent third-party risk assessment (like RMS/AIR for nat-cat, or CyberCube for cyber)
- Clear trigger definitions that minimize basis risk

Whoever builds the **"GPU depreciation risk model"** (analogous to CyberCube for cyber) becomes the key enabler for this market.
