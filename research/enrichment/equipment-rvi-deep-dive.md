# Equipment Residual Value Insurance (RVI) — Deep Dive

> **Purpose:** Frame GPU Residual Value Guarantees (RVG) in terms reinsurers already understand by mapping to the established RVI market across aircraft, auto, and commercial equipment.

---

## 1. Aircraft RVI — Policy Structure

### Coverage Mechanics

Aircraft RVI indemnifies the policyholder against the loss that occurs when the **fair market value** of an aircraft at a pre-defined future date is **less than the insured residual value**. The policy pays the deficiency — the gap between realized sale/appraisal value and the guaranteed floor.

| Element | Typical Aircraft RVI |
|---|---|
| **Coverage trigger** | FMV at policy expiry < insured residual value, subject to asset meeting pre-defined return conditions (maintenance status, airworthiness) |
| **Valuation methodology** | Independent appraisal at expiry, benchmarked against ISTAT-defined **Base Value** at half-life/half-time; Cirium Ascend "Soft Value" forecasts commonly used as reference |
| **Insured value range** | 20–40% of current market value, or 50–100% of projected Ascend Soft Value at risk expiry (Tokio Marine HCC) |
| **Attachment point** | Policyholder takes first loss (e.g., if expected RV = $10M, insured value = $9M → $1M first-loss retained by lessee/lessor) |
| **Co-insurance** | Insurers may require policyholder to co-insure a portion to align maintenance/care incentives |
| **Term length** | Typically 5–15 years, matching lease terms; some aircraft ABS structures use 10–25 year horizons |
| **Premium** | 4–7% of amount guaranteed (Tokio Marine HCC); historically as low as 0.5–4% per $100 of coverage |
| **Premium payment** | Typically at inception (single upfront premium) |
| **Return conditions** | Aircraft must meet defined maintenance status (e.g., half-life or better), airworthiness certificate current, no unreported damage |

### Valuation Framework — ISTAT Definitions

- **Base Value:** Appraiser's opinion of underlying economic value in a stable, balanced market. Used for long-term trend analysis and residual value projections. Market Value oscillates around Base Value — above it ~50% of the time, below ~50%.
- **Half-Life/Half-Time:** All scheduled maintenance events at midpoint (50% remaining). Normalizes values across aircraft in different maintenance states. Standard benchmark for RVI appraisals.
- **Full-Life/Full-Time:** All maintenance at zero-time (100% remaining). Represents theoretical maximum condition.
- **Maintenance Adjustment:** `Adjustment = (% Life Remaining − 50%) × Mtx Event Cost`
- **Cirium Ascend Soft Value:** Forward-looking residual forecast used by Tokio Marine HCC and others as the benchmark for setting insured values. Ascend captures 1,600+ unique datapoints covering 2,500+ asset transactions/year.

**Key insight for GPU RVG:** Aircraft RVI benefits from deeply standardized valuation infrastructure (ISTAT-certified appraisers, Cirium/AVITAS databases, 40+ years of transaction history). GPU RVG will need to build or leverage an equivalent reference — likely combining secondary market transaction data (e.g., from brokers like Networkd, DataVault) with OEM lifecycle data.

---

## 2. Who Writes Aircraft RVI

### Major Underwriters

| Entity | Role | Notes |
|---|---|---|
| **RVI Group** (est. 1989) | World's largest specialist RVI provider | Founded in Bermuda by Howard Chickering & Thomas Cox III. Initial backing from US West Financial Services. First aircraft RVI with Cessna Financial. $59B+ in residuals insured since inception; $45B+ fully matured. Acquired by R.V.I. Acquisition Holdings (Group1001 affiliate). Entered reinsurance in 2022. AM Best rated. |
| **Tokio Marine HCC** (HCC Indemnity Guaranty) | Major RVG underwriter | NY-based. Underwrites aircraft, CRE, and other asset RVG. Published premium guidance: 4–7% of guaranteed amount. Uses Ascend Soft Value benchmarks for aircraft. |
| **AGRO** (Assured Guaranty Re Overseas) | Reinsurer / direct writer | Bermuda-based, part of Assured Guaranty. Offered aircraft RVI on direct and reinsurance basis. Provided aggregate cover and individual line sizes. **Programme suspended since 2020 (COVID impact).** |
| **Matrix Specialty Underwriting** | Expanding MGA | London-based. Pushing RVI into broader asset classes (mining/drilling, power, plant & machinery, construction). Head of RVI: Nick Hester. Positioning as innovator in the space. |
| **Specialty MGA** | Intermediary | Distributes RVI capacity across multiple asset classes |
| **CRE Insurance Solutions** | CRE-focused RVI | Specialist in commercial real estate residual value |

### Market Structure

The RVI market is **highly concentrated** — historically a "handful" of specialist writers. RVI Group has dominated for 35+ years. Tokio Marine HCC is the other major direct writer. AGRO provided reinsurance capacity but withdrew post-COVID. Matrix Specialty is the most active new entrant pushing into adjacent asset classes.

**Key insight for GPU RVG:** The concentrated market means Corgi can approach existing RVI capacity providers directly. Tokio Marine HCC and RVI Group already have the infrastructure and appetite for equipment-class RVI. Matrix Specialty's explicit strategy of expanding asset classes makes them a natural conversation partner.

---

## 3. Historical Loss Ratios

| Metric | Value | Source |
|---|---|---|
| Cumulative loss ratio through 2006 | **27.7%** | U.S. Tax Court case (RVI Bermuda entity) |
| Cumulative loss ratio through 2013 | **34%** | Same case |
| Typical P&C loss ratio benchmark | 70–99% | Industry standard |
| RVI premium vs. claims | Premiums ~3–4× claims paid | Derived from above ratios |

### Commentary

- RVI has been **exceptionally profitable** for underwriters — loss ratios of 28–34% are roughly half what a typical P&C line achieves. This reflects conservative underwriting (low attachment points, diversified portfolios) and the general tendency for real assets to depreciate more slowly than feared.
- **COVID was the first major systemic test.** Aircraft values dropped sharply in 2020–2021, which is likely why AGRO suspended its programme. Post-COVID loss experience on aircraft RVI is not yet public but is expected to be materially worse than historical averages.
- **Auto RVI claims rising since 2022** — used-car price normalization after the 2021–2022 bubble means RVI claims on vehicle fleets are increasing.

### Portfolio at Scale (2006 snapshot — from Tax Court records)

- 951 policies in force
- 714 unrelated insureds
- 754,532 passenger vehicles
- 2,097 real estate properties
- 1,387,281 pieces of commercial equipment
- $16.2B total insured value
- RVI accounted for >97% of the insurer's business

**Key insight for GPU RVG:** Historical 28–34% loss ratios are the benchmark Corgi should reference when pitching reinsurers. GPU depreciation curves are steeper and more volatile than aircraft (where assets retain value for 20–30 years), so reinsurers will expect higher loss ratios — but Corgi can argue that higher premiums and shorter terms compensate.

---

## 4. Auto RVI — Fleet Leasing

### How It Works

Auto RVI protects lessors (fleet companies, captive finance arms, banks) against vehicles being worth less than the residual value set at lease origination.

| Element | Auto RVI |
|---|---|
| **Policyholder** | Leasing company or fleet operator |
| **Coverage** | Deficiency between actual wholesale/auction value and insured residual at lease end |
| **Term** | Matches lease term: typically 2–4 years |
| **Valuation** | Industry residual value guides — **ALG** (now J.D. Power), **Black Book**, **NADA**, **Kelley Blue Book** — set initial residual forecasts. Actual values determined by wholesale auction results at lease end. |
| **Premium** | Typically <4% of insured value; can be as low as 0.5% per $100 for well-diversified portfolios |
| **Portfolio effect** | Large portfolios (tens of thousands of vehicles) get significant diversification credit — individual vehicle volatility washes out |
| **First loss** | Lessor retains first ~10% of residual shortfall (deductible/attachment) |

### Actuarial Data Sources

- **ALG (J.D. Power):** Industry standard for initial residual value setting. Forecasts 36- and 48-month residuals by make/model/trim. Used by virtually all captive finance companies.
- **Black Book:** Weekly wholesale value updates. Used for real-time RV monitoring.
- **Manheim Index:** Wholesale used-car price index. Macro trend indicator.
- **Historical auction data:** Millions of wholesale transactions per year provide deep actuarial basis.

### Recent Trends

- Post-COVID used car price spike (2021–2022) meant almost zero RVI claims during the bubble — vehicles were worth *more* than predicted residuals.
- Since 2022, normalization has driven **rising RVI claims** as vehicles return to or below pre-pandemic residual forecasts.
- EV residual uncertainty is a major emerging theme — **RVI Group issued its first EV fleet policy** recently, indicating market evolution.

**Key insight for GPU RVG:** Auto RVI benefits from enormous data (millions of transactions/year) and portfolio diversification (thousands of identical units). GPU RVG will have smaller portfolios of higher-value assets, more analogous to aircraft than auto. But the *structure* (attachment point, deficiency payment, wholesale benchmark) translates directly.

---

## 5. Equipment RVI — Other Asset Classes

### RVI Group's Covered Equipment Classes

Per RVI Group and Matrix Specialty, RVI is written or expanding to cover:

| Asset Class | RVI Availability | Key Characteristics |
|---|---|---|
| **Commercial aircraft** | Established | Deep appraisal infrastructure (ISTAT, Cirium). Long asset lives (20–30 years). Liquid secondary market. |
| **Construction equipment** | Established | Caterpillar, Komatsu, etc. Good secondary market data (Ritchie Bros auction data). Moderate asset lives (10–15 years). |
| **Industrial plant & machinery** | Growing | Mining/drilling equipment, power generation assets. Less liquid secondary markets. |
| **Commercial vehicles** | Established | Trucks, trailers, buses. Fleet-scale portfolios common. |
| **Marine vessels** | Established | Ships, offshore. Cyclical values but long track record. |
| **Rail cars** | Established | Standardized assets, long lives, predictable demand curves. |
| **Medical equipment** | Emerging | MRI, CT scanners, surgical robots. Moderate asset lives (7–12 years). Rapid technology cycles create obsolescence risk. |
| **IT assets** | Emerging/Limited | Servers, networking. Short asset lives (3–5 years). High obsolescence risk. Limited RVI history. |
| **Electric vehicles** | Emerging | First policies issued recently by RVI Group. High residual uncertainty due to battery degradation and rapid model iteration. |

### Coverage Structure Across Equipment

- **Insured values:** Typically 30–80% of estimated residual value at policy end date, depending on asset type, market volatility, and secondary market liquidity.
- **Lower attachment for volatile assets:** Medical equipment, IT, and EVs command lower insured-value-to-estimated-RV ratios due to technology risk.
- **Maintenance/condition requirements:** Policy typically requires documented maintenance records and asset return in specified condition.

### Matrix Specialty's Expansion Thesis

Matrix explicitly positions itself as expanding RVI beyond the traditional "handful" of asset types (aircraft, marine, vehicles) into broader equipment classes. Their argument: RVI can "harden" asset values to make them suitable collateral for debt, enabling higher loan-to-value ratios. This is directly relevant to GPU financing.

**Key insight for GPU RVG:** GPUs are closest to the **IT asset** category, which has the *least* RVI history. But the value proposition (hardening residual values for financing) is identical to what Matrix pitches for industrial equipment. Corgi should position GPU RVG as the IT-asset evolution of equipment RVI — with better data than traditional IT (because GPU secondary markets are more liquid and transparent than generic server equipment).

---

## 6. Actuarial Data & Models Underpinning RVI Pricing

### AM Best's Rating Framework for RVI

AM Best published specific criteria for rating RVI companies (2015), recognizing RVI as distinct from typical P&C. Key analytical components:

1. **RVI Portfolio Analysis Framework** — Evaluates asset diversification, concentration by type/vintage/geography
2. **Construction of Future Market Value** — Forward-looking valuation models based on depreciation curves, market cycle positioning
3. **Monte Carlo Simulation of RVI Claims** — Stochastic modeling of portfolio-level losses incorporating:
   - Asset-specific depreciation curves
   - Market cycle volatility (fat tails)
   - Correlation between asset values within a portfolio
   - Correlation between asset values and investment portfolio (crucial — RVI reserve risk is correlated with market/investment risk)
4. **Modified Covariance Adjustment** — Standard P&C covariance formulas are adjusted to reflect the unique correlation between investment risk and reserve risk in RVI (both driven by macro-economic cycles)

### Pricing Models by Asset Class

| Asset Class | Primary Data Sources | Model Approach |
|---|---|---|
| **Aircraft** | Cirium Ascend base/soft values, AVITAS, mba, IBA; ISTAT-certified appraisers; 40+ years of transaction data | Base value depreciation curves + Monte Carlo on market cycle deviations. Ascend Soft Value as central forecast. |
| **Auto** | ALG (J.D. Power) residual forecasts, Black Book, Manheim, NADA; millions of wholesale auction transactions/year | Segmented depreciation models by make/model/trim/mileage. Portfolio diversification credit for large fleets. |
| **Construction/Industrial** | Ritchie Bros auction data, manufacturer lifecycle data, dealer network pricing | Depreciation curves by equipment type/age/hours; cyclicality adjustments for commodity-linked equipment |
| **CRE** | Cap rate trends, comparable sales, appraisal district data | NOI-based valuations, cap rate scenarios, location/vintage stratification |

### Core Actuarial Principles

1. **Depreciation curve estimation:** The fundamental input is the asset's expected value trajectory over time. For aircraft, this is well-established (e.g., a narrowbody loses ~3–5% per year for the first 15 years, then accelerates). For autos, ALG provides make/model-specific curves.

2. **Volatility around the curve:** RVI pricing is essentially options pricing — what's the probability the asset falls below the strike (insured value)? Monte Carlo simulation models the distribution of possible values at expiry.

3. **Correlation and concentration:** Portfolios with many uncorrelated assets get lower premiums. A portfolio of all A320s has more concentration risk than a mix of narrowbodies and widebodies.

4. **Tenor risk:** Longer terms mean wider confidence intervals on future values, requiring either lower attachment points or higher premiums.

5. **Maintenance/condition adjustment:** Better-maintained assets have tighter value distributions. Policies require minimum maintenance standards to bound the downside.

---

## 7. Key Differences — Aircraft RVI vs. GPU RVG

| Dimension | Aircraft RVI | GPU RVG (What Corgi Needs) |
|---|---|---|
| **Asset life** | 20–30 years economic life | 3–7 years useful life (2–3 generation cycles) |
| **Depreciation rate** | ~3–5%/year for first 15 years | ~30–50%/year after first generation cycle |
| **Technology obsolescence** | Slow (new aircraft types every 10–15 years; 737/A320 families span decades) | Rapid (new GPU architecture every 1–2 years; each generation can be 2–3× faster) |
| **Valuation infrastructure** | Deep: ISTAT, Cirium Ascend, AVITAS, mba, IBA — 40+ years of data, hundreds of certified appraisers | Nascent: secondary market brokers (Networkd, etc.), OEM list prices, some auction data. No equivalent to ISTAT. |
| **Secondary market liquidity** | Moderate-high: active leasing market, part-out market, ferry/storage options | Growing: hyperscaler hand-me-downs, inference workload demand, but market still maturing |
| **Portfolio diversification** | By aircraft type, age, region, airline credit | By GPU model, vintage, data center operator, workload type |
| **Maintenance/condition** | Highly standardized (FAA/EASA requirements, logbooks, AD compliance) | Less standardized (thermal history, memory health, firmware compatibility) — need to develop condition standards |
| **Typical policy term** | 5–15 years | 2–5 years (matching lease/deployment cycles) |
| **Expected loss ratio** | Historical 28–34%; post-COVID likely higher | Higher — perhaps 40–55% initially, declining as data improves |
| **Premium range** | 4–7% of guaranteed amount | Likely 8–15%+ of guaranteed amount initially (reflecting higher volatility and thinner data) |
| **Catastrophic risk** | Pandemic demand shock, oil price collapse | New architecture launch (NVIDIA generational leap), regulatory shift (export controls), demand collapse (AI winter scenario) |
| **Correlated risk** | All aircraft affected by fuel prices, pandemic, recession | All GPUs affected by AI demand cycles, NVIDIA roadmap, semiconductor supply |
| **Data depth** | 1,600+ datapoints/year, 2,500+ transactions tracked | Hundreds of secondary transactions/year currently; growing fast |

### What GPU RVG Must Build That Aircraft RVI Already Has

1. **Standardized valuation methodology** — An ISTAT-equivalent for GPU condition assessment (thermal history, utilization hours, memory health metrics → condition score)
2. **Independent appraisal infrastructure** — Third-party GPU appraisers/value services that reinsurers trust (Cirium equivalent)
3. **Historical depreciation curves** — By GPU model, vintage, and use case. Even 3–5 years of transaction data would be transformative.
4. **Return condition standards** — Equivalent to aircraft half-life/full-life: what constitutes "good condition" for a used GPU?
5. **Secondary market price index** — A Manheim Index for GPUs: regular, transparent wholesale pricing.

### How Corgi Can Bridge the Gap

- **Frame GPU RVG as short-tenor equipment RVI** — shorter terms mean less uncertainty, partially offsetting the thinner data.
- **Reference the IT asset / EV precedent** — RVI is already expanding into assets with technology obsolescence risk (EVs, medical devices). GPUs are the next logical step.
- **Offer portfolio-level pricing** — Diversified portfolios across GPU generations, operators, and geographies reduce concentration risk.
- **Build the data layer first** — The valuation infrastructure (condition scoring, price index, depreciation curves) is the moat. Reinsurers will price in data quality.
- **Use higher attachment points initially** — Insure at 30–50% of current value (conservative) to demonstrate loss performance before expanding coverage.
- **Point to the loss ratio history** — 28–34% cumulative loss ratios over 25 years prove the RVI model works. GPU-specific volatility premiums can be charged on top.

---

## Appendix: Key Players & Contacts

| Entity | Relevance | URL |
|---|---|---|
| RVI Group | Dominant RVI underwriter, potential capacity partner | rvigroup.com |
| Tokio Marine HCC (HCCIG) | Major RVG writer, published pricing benchmarks | tmhcc.com |
| Matrix Specialty | Expanding RVI into new asset classes — aligned thesis | matrixspecialty.com |
| AGRO (Assured Guaranty) | Aircraft RVI reinsurer (currently suspended) | assuredguaranty.com |
| Cirium Ascend | Aircraft valuation benchmark provider | cirium.com |
| AM Best | Published RVI-specific rating criteria | ambest.com |
| ISTAT | Aircraft appraiser certification & methodology standards | istat.org |

---

*Compiled: March 2026 | For Corgi internal use — GPU RVG product development & reinsurer positioning*
