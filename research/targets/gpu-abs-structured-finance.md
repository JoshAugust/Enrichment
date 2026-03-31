# GPU-Backed Asset-Backed Securities (ABS) & Structured Finance

> **Research compiled**: 29 March 2026
> **Purpose**: Map the GPU ABS landscape as a distribution channel for Residual Value Guarantee (RVG) insurance

---

## 1. Known GPU / Data Center ABS Issuances

### Pure GPU-Backed Deals (Chip-as-Collateral)

| Date | Issuer | Deal Size | Structure | Arranger / Lead | Collateral | Rating |
|------|--------|-----------|-----------|-----------------|------------|--------|
| Aug 2023 | **CoreWeave** | $2.3B | Secured debt (DDTL) | Magnetar Capital (lead), Blackstone Tactical Opportunities | NVIDIA H100 GPUs | Unrated (private credit) |
| Late 2023 | **Crusoe Energy** | $200M | Secured debt | Upper90 | ~20,000 H100 GPUs | Unrated |
| Apr 2024 | **Lambda Labs** | $500M | GPU financing SPV — described as "first-of-its-kind" GPU ABS | Macquarie Group (lead) | NVIDIA GPU inventory + cloud cash flows | Unrated |
| May 2024 | **CoreWeave** | $7.5B | DDTL facility | Blackstone (lead), Magnetar (co-lead) + Coatue, Carlyle, CDPQ, DigitalBridge, BlackRock, Eldridge, Great Elm | GPUs + customer contracts | Unrated (private) |
| Oct 2024 | **CoreWeave** | $650M | Revolving credit facility | **JPMorgan Chase** (lead), **Goldman Sachs**, **Morgan Stanley** + Barclays, Citi, Deutsche Bank, Jefferies, Mizuho, MUFG, Wells Fargo | GPU infrastructure | Unrated |
| Early 2025 | **[Issuer TBC]** | $1.1B | **First true GPU ABS** — shelf financing, AAA-rated | TBC | High-end GPUs | **AAA** (spread <110 bps) |
| Jul 2025 | **CoreWeave** | $2.6B | Secured DDTL 3.0 | **Morgan Stanley** & **MUFG** (joint bookrunners/lead arrangers), **Goldman Sachs** (joint lead arranger) | GPU assets | Not public |
| Jul 2025 | **CoreWeave** | $1.75B | 9.00% Senior Notes due 2031 | Kirkland & Ellis (counsel); arrangers not disclosed | Unsecured | Rated by S&P |
| Dec 2025 | **CoreWeave** | $2.25B | Convertible Senior Notes | **Goldman Sachs**, **Morgan Stanley**, **JPMorgan**, **Wells Fargo** (joint bookrunners) | Unsecured | Rated |

### Data Center ABS (Infrastructure-Backed — Adjacent Market)

| Date | Issuer | Deal Size | Cumulative ABS | Rating |
|------|--------|-----------|----------------|--------|
| Mar 2024 | **Switch** | $752M | Part of $3.5B total | S&P rated |
| Jun 2024 | **Switch** | $940M | | S&P rated |
| Mar 2025 | **Switch** | $1.09B | | S&P rated |
| Oct 2025 | **Switch** | $659M | $3.5B total | S&P rated; green bonds |
| Sep 2025 | **DataBank** | $1.1B | $3.23B total (5th securitization) | **First dual-rated** data center ABS: S&P (A-) + Moody's (A3) |
| Various | **QTS, CyrusOne, others** | Various | | S&P rated |

**Total market through Q1 2025**: S&P had rated **42 data center ABS issuances** totaling **$16.2B** in transaction value. A broader count: **69 ABS issuances by 19 issuers**, 106 tranches, **$34.4B** aggregate origination value.

### Aggregate GPU-Specific Debt Market
- BlackRock, Pimco, Carlyle, and others have collectively lent **>$11B** to AI infrastructure firms using GPUs as collateral
- CoreWeave alone has raised **>$25B** total (equity + debt) through 2025

---

## 2. Deal Structures & Arrangers

### Key Arranging Banks

| Bank | Role in GPU/DC ABS |
|------|--------------------|
| **JPMorgan Chase** | Lead on CoreWeave $650M revolver (Oct 2024); joint bookrunner on convertibles; top ABS manager globally ($51B in 2022) |
| **Goldman Sachs** | Joint lead arranger on CoreWeave DDTL 3.0; joint bookrunner on convertibles; $23B ABS managed in 2022 |
| **Morgan Stanley** | Joint bookrunner/lead arranger on CoreWeave DDTL 3.0; joint bookrunner on convertibles |
| **Barclays** | Participant in CoreWeave $650M revolver; $31.5B ABS managed in 2022 |
| **Blackstone** | Lead on CoreWeave $7.5B facility (largest private credit deal in history); co-lead on $2.3B facility |
| **Magnetar Capital** | Original lead on CoreWeave $2.3B (Aug 2023); co-lead on $7.5B facility |
| **Macquarie Group** | Lead on Lambda Labs $500M GPU SPV |
| **Upper90** | Lead on Crusoe Energy $200M GPU-backed debt |
| **Citi, Deutsche Bank, Mizuho, MUFG, Wells Fargo, Jefferies** | Participants in CoreWeave revolver |

### Typical GPU ABS Structure

```
┌─────────────────────────────────────────────┐
│              ORIGINATOR                       │
│   (CoreWeave, Lambda, etc.)                  │
│   Owns GPUs + customer lease contracts       │
└──────────────┬──────────────────────────────┘
               │ True sale / pledge
┌──────────────▼──────────────────────────────┐
│         BANKRUPTCY-REMOTE SPV               │
│   - First-priority UCC-1 lien on GPUs      │
│   - Serial number tracking                  │
│   - Perfected security interest             │
│   - Backup servicer provisions              │
└──────────────┬──────────────────────────────┘
               │ Issues notes
┌──────────────▼──────────────────────────────┐
│           CAPITAL STRUCTURE                  │
│                                              │
│  AAA Senior Notes     (~81% of pool)        │
│  ─────────────────                          │
│  Mezzanine Notes      (~10%)               │
│  ─────────────────                          │
│  Subordinated/Equity  (~9%)  ← first loss  │
│                                              │
│  Credit Enhancement: ~19% total             │
│  (overcollat + subordination + insurance)    │
└─────────────────────────────────────────────┘
```

**Cash flow waterfall**: Servicing/maintenance → Senior interest → Senior principal → Mezzanine interest → Mezzanine principal → Equity/excess spread

**Key structural features**:
- **Anticipated repayment date (ARD)**: 3–4 years (aligned with GPU useful life)
- **Final legal maturity**: 7–10 years (backstop)
- **Early amortization triggers**: Kick in if performance/value deteriorates
- **LTV cushions**: Initial advance rates of 50–60% of orderly liquidation value
- **Cash sweeps**: From GPU rental contracts to accelerate principal paydown
- **Serial-number tracking**: Perfected liens on individual GPUs

---

## 3. Credit Enhancement Structures

### Does Anyone Include Residual Value Guarantees?

**YES — and this is the critical finding for RVG insurance:**

> *"Insurers have begun to provide [residual value] floors — e.g. a promise that at least **40% of the GPUs' original value** will be realized at disposition. Such a guarantee from a strong third party can substantially reduce investors' risk."*

#### Enhancement Layers (Typical GPU ABS)

| Layer | Description | Coverage |
|-------|-------------|----------|
| **Overcollateralization** | Pool value > notes outstanding | 10–20% cushion |
| **Subordination** | Junior tranches absorb losses first | ~19% credit enhancement for AAA |
| **Residual Value Insurance** | Third-party guarantee of minimum disposal value (e.g., 40% floor) | Caps loss severity even if used GPU prices collapse >60% |
| **Casualty/Theft Insurance** | Standard property coverage on hardware | Full replacement |
| **Cash reserve accounts** | Funded at closing | Liquidity buffer |
| **Excess spread** | Rental income > note coupons | First-loss absorption |

#### How RVG Insurance Enables AAA Ratings

Working example from market data:
- $100M GPU pool → $81M AAA senior tranche (19% credit enhancement)
- Rating agency stress: ~6.6% loss in severe downturn
- 19% enhancement provides **3× coverage** of stress scenario
- **40% RV insurance floor** means even a 60% price crash is absorbed
- Accelerated amortization means ~50% of principal already repaid before GPUs age out
- **Result**: AAA at <110 bps spread — cheaper than unsecured corporate debt

**⚡ THIS IS THE OPPORTUNITY**: RVG insurance is already being used in GPU ABS deals. The market needs more capacity and more specialized insurers. Current providers are not identified publicly, which suggests the market is underserved.

---

## 4. Rating Agency Reports & Methodologies

### S&P Global Ratings
- **"ABS Frontiers: Equipping Data Centers Through Securitization"** — Key report on GPU/DC securitization
- Through Q1 2025: Rated **42 data center ABS issuances**, $16.2B total
- **Initially capped data center ABS ratings at A+** due to short sector history
- Has since allowed higher ratings with sufficient credit enhancement

### Moody's Ratings
- **Published dedicated Data Center ABS Rating Methodology** (2025)
  - Reference: Asset Securitization Report coverage — "Moody's issues ratings methodology for Data center ABS"
- **No hard cap on ratings** — differs from S&P's initial A+ cap
- Stress tests project ~6.6% severe losses; require ~3× coverage for AAA
- Rated DataBank's Sep 2025 $1.1B deal at **A3** (first dual-rated DC ABS with S&P)

### KBRA (Kroll Bond Rating Agency)
- **Equipment Lease & Loan ABS Global Rating Methodology** — directly applicable to GPU ABS
  - Incorporates: originator/servicer strength, asset quality, residual value analysis, structural features
  - Calculates aggregate discounted contract balance using projected cash flows + residual value at implicit IRR
- **Data Center ABS Global Rating Methodology** — published and in use
  - Includes stressed terminal capitalization rates for property residual value
  - Higher stresses applied for higher rating categories
- **Proposed Data Center ABS Global Rating Methodology** — indicates ongoing methodology refinement

### Fitch Ratings
- Active in broader ABS market but no publicly identified GPU-specific methodology yet
- Likely to follow as market scales

### Key Rating Agency Publications

| Agency | Report / Methodology | Relevance |
|--------|---------------------|-----------|
| S&P | "ABS Frontiers: Equipping Data Centers Through Securitization" | Market overview + approach |
| Moody's | Data Center ABS Rating Methodology (2025) | No hard cap; stress scenarios |
| Moody's | Equipment Lease and Loan Securitizations Methodology | GPU as equipment collateral |
| KBRA | Equipment Lease & Loan ABS Global Rating Methodology | RV calculation framework |
| KBRA | Data Center ABS Global Rating Methodology | DC-specific stress tests |
| CRA International | "Data center ABS – Risks, yields, and ratings" (Dec 2025) | Independent analysis |

---

## 5. Role of Residual Value Assumptions in ABS Credit Ratings

### Why RV Assumptions Are the Linchpin

Residual value assumptions are **the single most critical variable** in GPU ABS credit ratings because:

1. **GPUs depreciate faster than any traditional ABS collateral**
   - ~50% value retained after 3 years (base case)
   - ~20% after 5 years (base case)
   - ~10% after 5 years (pessimistic/stress case)

2. **No long historical dataset** — GPU securitization only began in 2023

3. **Technology obsolescence risk** — new chip generations (H100 → H200 → Blackwell → next) can crater older GPU values overnight

4. **Glut risk** — simultaneous off-lease events could flood secondary markets (parallel: crypto GPU dump of 2018/2022, where prices fell 50%+ in months)

### How Rating Agencies Stress RV

| Scenario | Assumption | Impact |
|----------|------------|--------|
| Base case | 50% RV at year 3, 20% at year 5 | Standard amortization covers |
| Moderate stress | 30% RV at year 3 | Subordination absorbs losses |
| Severe stress | 10% RV at year 5, near-zero terminal | Requires insurance + OC to protect AAA |
| Catastrophic | Simultaneous: collateral -50%, contracts terminate, refi fails | "Assumptions baked into GPU ABS structures can fail all at once" |

### RV Insurance as Rating Upgrade Catalyst

- A **strong RVG from a rated insurer** can:
  - Move a deal from A+ to AAA
  - Compress spreads by 50–100+ bps
  - Expand the investor base to insurance companies and pension funds
  - Reduce required overcollateralization (cheaper for issuers)

**This is the core value proposition for an RVG insurer in GPU ABS.**

---

## 6. Market Size & Projections

### GPU / Data Center ABS Issuance Trajectory

| Year | Estimated Issuance | Notes |
|------|-------------------|-------|
| 2023 | ~$2.5B | CoreWeave pioneer deal; private credit |
| 2024 | ~$5B | Lambda, Crusoe, Switch, DataBank entering |
| 2025 | **~$8B** | First true rated GPU ABS; S&P rated 42 DC ABS ($16.2B cumulative) |
| 2026E | ~$12–15B | Market doubling as more issuers enter |
| 2027E | ~$18–22B | Standardization of structures; more rating agencies active |
| 2028E | **~$25B+** | Mature market; GPU ABS becomes standard asset class |

### Broader Context
- **$50B** of GPUs sitting on hyperscaler balance sheets — potential securitization fodder
- **$150B** estimated total ABS + CMBS needed for AI/DC buildout through 2028–2030 (Morgan Stanley Research)
- **$2.9T** total AI data center capital expenditure estimated through 2030 (Reuters/industry consensus)
- Spread compression: CoreWeave's early facilities at **SOFR+1300 bps** → AAA GPU ABS at **<110 bps** in 18 months

### Addressable Market for RVG Insurance
If GPU ABS reaches $25B by 2028, and:
- RV insurance covers ~40% of pool value
- Premium rates of 1.5–3% annually on insured amount
- **Addressable premium pool: $150M–$300M/year by 2028**
- First-mover advantage is massive — no publicly identified specialist insurer yet

---

## 7. Key Contacts & Stakeholders

### Arranging Banks — Structured Finance / ABS Desks

| Institution | Relevant Group | Why They Matter |
|-------------|---------------|-----------------|
| **JPMorgan Chase** | Securitized Products / ABS Origination | Top ABS manager globally; lead on CoreWeave revolver; projected AI DC financing as multi-trillion opportunity |
| **Goldman Sachs** | Structured Finance / ABS | Joint lead arranger on CoreWeave DDTL 3.0; bookrunner on convertibles |
| **Morgan Stanley** | ABS / Structured Credit | Joint bookrunner on CoreWeave DDTL 3.0; ABS research projecting $150B DC financing need |
| **Barclays** | Securitization / ABS | Participant in CoreWeave revolver; $31.5B ABS in 2022 |
| **Blackstone** | Tactical Opportunities / Private Credit | Lead on largest GPU credit deals ($7.5B + $2.3B CoreWeave) |
| **Magnetar Capital** | Structured Credit | Original pioneer lender in GPU-backed credit |
| **Macquarie Group** | Principal Finance / Asset Finance | Led Lambda Labs GPU SPV — first explicit "GPU ABS" |
| **Citi** | ABS / Securitization | Participant in CoreWeave facility |
| **Deutsche Bank** | ABS / Structured Finance | Participant in CoreWeave facility |
| **MUFG** | Structured Finance | Co-lead arranger on CoreWeave DDTL 3.0 |

### Rating Agencies — ABS / Structured Finance Analysts

| Agency | Key Coverage Area | Contact Approach |
|--------|------------------|------------------|
| **S&P Global Ratings** | ABS Frontiers team; Data Center ABS analysts | Authored GPU/DC securitization reports; initially conservative (A+ cap) |
| **Moody's Ratings** | Data Center ABS methodology team; Equipment ABS | Published dedicated DC ABS methodology; no rating cap |
| **KBRA** | Equipment Lease & Loan ABS; Data Center ABS | Most detailed public methodology on RV treatment; likely most receptive to RVG insurance concepts |
| **Fitch Ratings** | Equipment ABS | Not yet prominent in GPU ABS but will follow market growth |

### Issuers / Borrowers (Potential Insurance Buyers)

| Company | GPU ABS Activity | Status |
|---------|-----------------|--------|
| **CoreWeave** | Largest GPU-backed borrower ($25B+ total) | Public (CRWV); IPO 2025 |
| **Lambda Labs** | First explicit GPU ABS SPV ($500M) | Private |
| **Crusoe Energy** | $200M GPU-backed debt | Private; raising Series E at $10B+ |
| **Switch** | $3.5B data center ABS (4 issuances) | Subsidiary of DigitalBridge |
| **DataBank** | $3.23B total ABS (5 issuances) | First dual-rated DC ABS |

### Key Legal Advisors
- **Kirkland & Ellis**: Advised CoreWeave on $1.75B notes and Switch on $659M ABS
- **Latham & Watkins**: Advised on CoreWeave $2.25B convertible notes

### Research & Commentary Sources
- **Dave Friedman** (Substack) — "How GPUs Became the Newest Financial Asset"; "CoreWeave's $30 Billion Bet"
- **Les Barclays** (Substack) — "Collateralized Chip Obligations" — detailed CCO mechanics
- **Marc Rubenstein** (Net Interest) — "Bubble Trouble" — GPU as asset class
- **High Yield Harry** (Beehiiv) — "Credit's Role in the AI Buildout"
- **CRA International** — "Data center ABS – Risks, yields, and ratings" (Dec 2025)
- **Bird & Bird** — "GPU-Based Financing in the Global Data Center Market" (legal analysis)
- **Structured Finance Association (SFA)** — "Financing Pressures Drive Innovation in Data Center Financing" (May 2025)

---

## 8. Strategic Implications for RVG Insurance

### Why GPU ABS Is the Natural Distribution Channel

1. **RV insurance is already in the structure** — deals already include residual value guarantees/insurance. This isn't hypothetical; it's happening.

2. **Rating agencies explicitly model RV insurance** — KBRA and Moody's methodologies incorporate RV guarantees into credit enhancement calculations. A strong insurer rating directly improves deal economics.

3. **Massive spread compression opportunity** — RVG insurance can move a deal from A+ to AAA, saving issuers 50–100+ bps on $1B+ deals. The economic value is enormous.

4. **No identified specialist insurer** — Despite RV insurance being referenced in deal structures, no publicly identified specialist GPU RV insurer exists. This is a greenfield opportunity.

5. **$150M–$300M annual premium pool by 2028** — Growing with market to $25B+ issuance.

6. **Natural banker relationships** — JPMorgan, Goldman, Morgan Stanley, and Blackstone are all active arrangers who would benefit from an insurance product that improves deal economics and expands their investor base.

### The Pitch to Banks & Issuers
> "We provide rated residual value guarantees on GPU collateral in ABS structures. Our insurance:
> - Enables AAA ratings where otherwise capped at A+
> - Compresses spreads by 50–100+ bps
> - Protects investors against technology obsolescence
> - Is backed by actuarial models and secondary market data
> - Addresses the #1 risk factor in every rating agency methodology"

### Next Steps
- [ ] Identify the unnamed insurer(s) currently providing RV floors in GPU ABS deals
- [ ] Obtain full KBRA Equipment Lease & Loan methodology for RV calculation details
- [ ] Access S&P "ABS Frontiers" full report (paywall)
- [ ] Access CRA International "Data center ABS – Risks, yields, and ratings" (Dec 2025)
- [ ] Map secondary GPU market pricing data (critical for actuarial models)
- [ ] Identify rating agency analysts covering GPU ABS specifically
- [ ] Build relationships with arranging bank structured finance desks

---

## Sources

1. Reuters — CoreWeave $2.3B debt facility (Aug 2023)
2. Blackstone press release — CoreWeave $7.5B facility (May 2024)
3. CoreWeave investor relations — Multiple press releases
4. Medium / @Elongated_musk — "Silicon to Securities: How GPUs Became AAA-Rated ABS Assets" (Jul 2025)
5. Medium / @Elongated_musk — "GPUs as Collateral — Chip Based ABS"
6. Les Barclays Substack — "Collateralized Chip Obligations"
7. Dave Friedman Substack — "How CoreWeave Actually Finances Its GPUs"
8. S&P Global Ratings — "ABS Frontiers: Equipping Data Centers Through Securitization"
9. KBRA — Equipment Lease & Loan ABS Global Rating Methodology
10. KBRA — Data Center ABS Global Rating Methodology
11. Moody's — Data Center ABS Rating Methodology (2025)
12. Asset Securitization Report — Various coverage
13. Bird & Bird — "GPU-Based Financing in the Global Data Center Market"
14. CRA International — "Data center ABS – Risks, yields, and ratings" (Dec 2025)
15. Structured Finance Association — Research Corner (May 2025)
16. DataBank press release — $1.1B hyperscale securitization (Sep 2025)
17. Switch press releases — ABS offerings (2024–2025)
18. GlobalCapital — "Too big to ignore: US data center ABS in 2026 and beyond"
