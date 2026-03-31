# Captive Insurance & GPU/Tech Infrastructure
**Research Date:** March 2026  
**Topic:** Captive insurance programs for GPU fleets and AI infrastructure; residual value risk insurability

---

## Executive Summary

Captive insurance is established practice among Big Tech for employee benefits and general liability, but **no major tech company has publicly disclosed a captive specifically designed to cover GPU fleet residual value or tech infrastructure obsolescence risk**. The market gap is real and growing: hyperscale data center campuses now exceed $20B in total insured value while the commercial insurance market's effective single-asset capacity is capped around $5B. GPU residual value risk is theoretically insurable through captives (Residual Value Insurance / RVI is an established product), but the pace of AI hardware obsolescence makes actuarial pricing extremely difficult. The risk is currently being managed through debt structuring (ABS, DDTLs, SPVs) rather than traditional insurance.

---

## 1. Known Captive Insurance Entities at Major Tech Companies

### Microsoft — **Confirmed Captive Structure**
- **Orcas Ltd** — Pure captive domiciled in **Bermuda**, with a branch in **Vermont**
  - ~11 years old (as of ~2018 reporting)
  - Originally structured for property and liability coverage
  - Vermont branch sought to reinsure long-term disability policies for ~55,000 US employees
- **Cypress Insurance Company** — Arizona-domiciled captive, admitted July 1, 2008
- All three Microsoft captives managed by **AIG**
- **Notable incident:** Microsoft's Vermont captive was ordered to cease and desist by Washington State Insurance Commissioner for writing coverage in WA without proper licensing; settled in 2018 (~$876K)
- **Focus:** Employee benefits, general P&L — **not GPU/infrastructure**

### Google / Alphabet — **Confirmed Captive Structure**
- **Imi Assurance, Inc.** — Domiciled in **Hawaii**, licensed 2010, Class 2 pure captive
- Used as fronting insurer for **catastrophe bond transactions** (earthquake risk at Google data centers)
  - Alphabet's first cat bond: $237.5M (2019)
  - Follow-on: $250M+ (2021)
- Director of business risk and insurance at Google serves as CEO of Imi Assurance
- Assets under management: **>$1.5B** across three captives led by same director
- **Focus:** Nat cat/earthquake, employee benefits — **not GPU residual value**

### Meta (Facebook) — **Confirmed Captive Structure**
- **Ekahi Insurance Company, LLC** — Domiciled in **Hawaii**
- Seeking (and received, July 2025) **ERISA exemption from the DOL** to use Ekahi for employee health benefits
  - Structure: Prudential reinsures covered insurance by contracting with Ekahi (Meta-owned)
- DOL Federal Register filing: November 2024 proposed exemption; July 2025 granted
- **Focus:** Employee healthcare — **not infrastructure**

### Amazon — **Partial Captive Activity**
- **Day One Insurance** — Amazon's captive for **employee healthcare**
- **Amazon + AXA partnership** — building a global risk management platform (not captive per se)
- Third-party captive for Amazon Delivery Service Providers (DSPs) exists — a homogenous group captive covering last-mile contractors — but this is not Amazon itself
- **No known property/technology/GPU captive**

### Oracle — **No Public Captive Found**
- No captive insurance entity identified in any public filing or captive industry registry

### CoreWeave — **No Captive; Uses Structured Finance Instead**
- 32 data centers, 250,000 GPUs (2025)
- $11.17B total borrowings — largely GPU-backed debt
- **DDTL 1.0 (2023):** $2.3B from Magnetar Capital & Blackstone, collateralized by H100 GPUs — first use of H100s as collateral
- Risk managed through: take-or-pay customer contracts, aggressive depreciation accounting, asset-backed lending
- **Critical risk identified ("GPU Maturity Wall"):** GPU rental rates have fallen 50–70%; repayment schedules reference hardware that may be worth far less than original collateral value
- **No self-insurance program or captive identified**

### Lambda Labs — **No Captive; Uses GPU-Backed SPV**
- April 2024: **$500M GPU-backed financing facility** led by Macquarie Group + IDF
- Structured as a special purpose GPU financing vehicle — assets sequestered for lenders in case of operating company failure
- Not insurance; pure debt/structured finance
- No captive identified

---

## 2. How Captive Insurance Works for High-Value Depreciating Assets

### Core Mechanics
A **captive insurance company** is a licensed insurer wholly owned by the insured entity. The parent pays premiums to the captive, which accumulates reserves and pays claims. Benefits include:
- **Underwriting profit stays within the enterprise**
- **Tax-deductible premiums** (IRS scrutinizes but can't categorically deny)
- **Coverage for risks commercial markets won't write** — the key use case for emerging tech assets
- **Customization** — tailor terms to actual risk profile

### Residual Value Insurance (RVI) — The Relevant Product
**RVI** protects the asset owner/lessor if an asset's actual market value at end of lease/financing term falls below the projected (contracted) residual value.

**Example:** GPU contracted at $30,000/unit with 5-year useful life and projected $9,000 residual value. If actual value at year 5 = $3,000, RVI pays the $6,000 shortfall.

**Key facts:**
- Already used extensively in: auto leasing, aviation, heavy equipment, commercial real estate
- **IRS has litigated and LOST** the argument that RVI through captives doesn't qualify as real insurance for tax purposes — captive-written RVI is tax-legitimate if properly structured
- Product sold by: RVI Group, Swiss Re, Munich Re, specialty carriers

### Captive RVI Mechanics
1. Parent establishes captive (Bermuda, Cayman, Vermont, Hawaii)
2. Captive writes RVI policies against GPU/equipment portfolio
3. Parent pays annual premiums into captive (tax-deductible)
4. Captive builds reserves and invests them
5. At asset maturity, if realized values fall short of projections, captive pays claims
6. Excess reserves belong to parent via dividend from captive

### Challenges for GPU-Specific RVI
- **Actuarial uncertainty:** Limited historical data on GPU value curves; NVIDIA architecture cycles (18–24 months) vs. accounting depreciation schedules (5–6 years)
- **Pace of obsolescence:** Mid-market GPU cohorts originally underwritten for 5.5-year useful life are trending toward **3.7 years** effective life — nearly a 2-year gap
- **Price collapse:** GPU rental rates fell 50–70% in 2024–2025 in some segments
- **Concentration risk:** A single hyperscale campus can exceed $20B insured value; commercial market capacity tops out ~$5B

---

## 3. GPU Residual Value Risk: Current Market State

### The Problem
- NVIDIA releases new architectures every 18–24 months
- Hyperscalers are booking 6-year depreciation schedules
- Some GPUs retain only ~50% value after 3 years and ~20% after 5 years (base case)
- Some cohorts depreciate 30–45% faster than projected
- **The gap between accounting life and economic life is the core risk**

### How Risk Is Currently Managed (Not Via Insurance)
1. **GPU-backed ABS** — First GPU ABS deal: $1.1B in early 2025; market forecast to grow from $8B (2025) to $25B (2028)
   - ABS deals use: reserve accounts, overcollateralization, and sometimes RVI to bolster credit ratings
2. **Take-or-pay contracts** — Hyperscalers lock in multi-year committed revenue before signing GPU financing
3. **Aggressive early amortization** — Loan structures assume fast depreciation, require front-loaded repayment
4. **SPV ring-fencing** — Assets legally segregated from operating company (Lambda model)
5. **Buyback/put agreements** — Cloud providers negotiate residual value guarantees directly with NVIDIA or OEMs

### Insurance Market Capacity Gap
- **Aon's Data Center Lifecycle Insurance Program (DCLP):** Expanded to **$2.5B capacity** (announced January 2026) — covers construction all-risks, delay in start-up (DSU), property damage/business interruption
- **Insurance market concern:** If many GPU ABS deals simultaneously seek RVI or guarantees, insurers may face capacity crisis covering tens of billions in GPU exposure
- **FM Global, WTW, Aon** are the main players building data center insurance capacity

### Captive/Mutual Structures: Emerging Frontier
- Energy sector analogy: the energy industry long used **mutual structures** to pool catastrophic risks and access reinsurance capacity — data center hyperscalers could adopt a similar construct
- **Industry-funded primary layer** (captive/mutual) + public-sector backstop for catastrophic excess is being discussed but not yet implemented
- **Self-insured retentions (SIRs)** on large data center projects are already growing — major owners are effectively self-insuring more as project values outpace commercial capacity

---

## 4. Strategic Assessment: Would a Tech Captive Write GPU RVI?

### Why It Makes Sense
- **Commercial market gap:** No traditional insurer is writing GPU residual value at scale
- **Tax efficiency:** Captive premiums are deductible; reserves compound inside the captive
- **IRS precedent:** RVI through captives is tax-legitimate (IRS lost this argument in court)
- **Scale:** Microsoft, Google, Meta, Amazon have billions in GPU/hardware assets — even a small premium rate generates meaningful risk capital
- **Regulatory familiarity:** Microsoft, Google, Meta already operate captives; incremental cost to add a new line is low

### Why It Hasn't Happened (Publicly)
- **Unquantifiable risk:** Actuaries can't price GPU obsolescence with confidence given NVIDIA's release cadence and unpredictable AI workload demand shifts
- **Not the real problem:** Hyperscalers aren't worried about residual values — they consume their own GPU capacity. The residual value risk sits with **neo-cloud GPU renters** (CoreWeave, Lambda) and their **lenders**, not with the hyperscalers themselves
- **Structural alternatives dominate:** ABS structuring, take-or-pay contracts, and overcollateralization are cheaper and faster to implement than setting up and capitalizing a captive for a new risk class
- **Reputational/regulatory risk:** Writing RVI through a captive for rapidly depreciating tech assets could attract IRS scrutiny (IRS has been aggressive about captive abuses in recent years)

### Most Likely Path to GPU Captive RVI
- A **neo-cloud company (CoreWeave-scale)** or a **lender consortium** creates or uses an existing captive to write RVI on GPU-backed ABS deals
- More likely: a **specialty reinsurer** (Swiss Re, Munich Re) provides the capacity via facultative or treaty arrangements, with tech company captives taking a small co-insurance slice
- **Vermont** or **Cayman** most likely domicile given existing tech company captive presence

---

## 5. Key Sources & Further Research

| Topic | Source |
|-------|--------|
| Microsoft captives (Orcas Ltd, Cypress) | Captive Insurance Times, Business Insurance |
| Google Imi Assurance cat bonds | Artemis.bm, captive.com |
| Meta Ekahi ERISA exemption | Federal Register (Nov 2024, July 2025), captiveinternational.com |
| Amazon Day One Insurance | lexchart.com (Amazon subsidiaries) |
| CoreWeave GPU financing | Magnetar/Blackstone DDTL filings, Dave Friedman Substack |
| Lambda $500M SPV | BusinessWire, Greenberg Traurig press release |
| GPU ABS market | Medium/@Elongated_musk "Silicon to Securities" |
| RVI through captives (tax legitimacy) | IRMI, captive.com |
| Data center insurance capacity gap | Aon DCLP Jan 2026, Risk & Insurance |
| GPU depreciation curve | stanleylaman.com, natlawreview.com, introl.com |
| GPU RVI in ABS deals | Two Birds law, Morgan Lewis |

---

## 6. Watch List

- **Vermont Division of Financial Regulation** quarterly captive formation reports — watch for tech company formations listing "technology asset" or "equipment" as covered risk classes
- **Bermuda Monetary Authority** annual insurance statistics — Bermuda has 631 captives; any new large tech-sector formations
- **IRS Form 8886** disclosures — required for "listed transactions" including certain captive structures; may surface abusive GPU RVI attempts
- **GPU ABS prospectuses (SEC filings)** — check "credit enhancement" sections for RVI/captive insurance descriptions
- **CoreWeave 10-K/S-1 filings** — IPO'd 2025; risk factors and insurance disclosures will be revealing
- **NVIDIA's channel** — if NVIDIA starts offering residual value guarantees/buybacks, it changes the captive calculus entirely

---

*Research compiled: March 2026 | Next update trigger: CoreWeave annual report, Vermont Q1 formation data*
