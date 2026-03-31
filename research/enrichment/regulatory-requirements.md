# Regulatory Requirements: GPU Residual Value Guarantee Insurance

> **Research compiled:** 2026-03-29
> **Product:** Insurance policy guaranteeing the residual/resale value of GPU hardware after a set period

---

## Table of Contents
1. [US Insurance Licensing — Admitted vs Surplus Lines](#1-us-insurance-licensing)
2. [Bermuda Class 3A / 3B Insurer Licensing](#2-bermuda-class-3a--3b)
3. [Cayman Islands Insurance Licensing](#3-cayman-islands)
4. [UK / Lloyd's MGA Authorization](#4-uk--lloyds-mga)
5. [MGA Model — Operating Under Carrier Paper](#5-mga-model)
6. [Surplus Lines / E&S Market — Fast-Tracking Novel Products](#6-surplus-lines--es-market)
7. [Regulatory Filings for a New Insurance Product](#7-regulatory-filings)
8. [Recommended Path for Corgi](#8-recommended-path)

---

## 1. US Insurance Licensing

### Admitted (Licensed) Insurer
- Must obtain a **Certificate of Authority** from each state's Department of Insurance individually — there is no federal insurance license
- Each state has its own capital/surplus requirements (e.g., Texas ≥$25M, California ≥$26M, New York ≥$10M for P&C)
- Products must go through **rate and form filings** in every state before sale
- Covered by state **guaranty funds** (consumer protection in insolvency)
- Timeline: **1–2+ years** to get licensed in even one major state; multi-state rollout takes longer
- This route is **prohibitively slow and expensive** for a novel product like GPU residual value guarantees

### Non-Admitted / Surplus Lines Insurer
- Does **not** need a license in each state — operates as a "non-admitted" or "surplus lines" insurer
- Policies are placed through **licensed surplus lines brokers** in each state
- The insurer must appear on approved **eligibility lists** (state-specific or NAIC Quarterly Listing for alien insurers)
- **No rate/form filing requirements** in most states — the surplus lines market is specifically designed for novel, hard-to-place risks
- Policyholders must be informed: no guaranty fund protection, insurer not subject to full state regulation
- **Diligent search requirement:** In most states, 3 admitted insurers must decline the risk before it can be placed in surplus lines (easily met for a novel product with no admitted market)

### Key Implication
GPU residual value guarantees have no existing admitted market — surplus lines is the natural channel.

---

## 2. Bermuda Class 3A / 3B

### Overview
Bermuda is the world's leading offshore insurance/reinsurance domicile. The Bermuda Monetary Authority (BMA) regulates insurers under the Insurance Act 1978.

### Class 3A — Small Commercial Insurer
- Unrelated (third-party) business ≥50% of net premiums written
- Unrelated business net premiums **≤$50 million**
- **Best fit for Corgi's initial scale**

### Class 3B — Large Commercial Insurer
- Same thresholds as 3A but unrelated business net premiums **>$50 million**
- More extensive reporting/regulatory scrutiny

### Capital Requirements (Same for 3A & 3B)
| Requirement | Amount |
|---|---|
| Minimum paid-up share capital | BMD 120,000 (~$120K) |
| Minimum statutory capital & surplus | BMD 1,000,000 (~$1M) |
| Enhanced Capital Requirement (ECR) | Greater of: BSCR (tail VaR), minimum solvency margin (premium + reserve formula), or $1M floor |

### Licensing Process
- **Application reviewed by:** BMA's Insurance Assessment and Licensing Committee (IALC)
- **Assessment criteria:** (1) fitness/propriety of management, (2) governance framework, (3) viability of business plan, (4) capitalisation relative to risk profile
- **Timeline:** Minimum **6 weeks** for straightforward applications; complex profiles take longer
- **Local requirements:** Must appoint a principal representative in Bermuda; local office not strictly required for all classes
- **Cost:** Application fees + legal/advisory costs typically **$150K–$300K** all-in for setup (legal, actuarial, corporate formation, BMA fees)

### Why Bermuda?
- **NAIC Qualified/Reciprocal Jurisdiction** — Bermuda-domiciled insurers can access US surplus lines market via NAIC IID listing
- Solvency II equivalent — can passport into EU/UK markets
- No corporate income tax
- Deep pool of insurance talent, service providers, and reinsurers
- Fast licensing relative to US or EU

---

## 3. Cayman Islands Insurance Licensing

### Overview
Regulated by the **Cayman Islands Monetary Authority (CIMA)** under the Insurance Act.

### Relevant License Classes

| Class | Description | MCR | PCR | Timeline |
|---|---|---|---|---|
| **B(iii)** | Captive writing ≤50% related business | $200,000 | Function of premiums/reserves | 8–12 weeks |
| **B(ii)** | Captive writing >50% related business | $150,000 | Function of premiums/reserves | 8–12 weeks |
| **D** | Commercial reinsurer | $50,000,000 | >MCR | Longer |
| **A** | Domestic insurer (local market only) | $1,000,000 (external) | 150% of MCR | Varies |

### Key Requirements
- Must appoint a **local insurance manager** (for Class B)
- Annual regulatory filings to CIMA
- Fit and proper directors/officers
- Business plan and reinsurance arrangements

### Assessment
- Cayman is primarily a **captive insurance** domicile — not ideal for a commercial insurer writing third-party risk
- **Class B(iii)** could work if Corgi structures as a captive writing external business, but the captive framework isn't the cleanest fit
- **Class D** ($50M MCR) is far too capital-heavy for an early-stage venture
- **Bermuda is generally a better fit** for a commercial insurer targeting US/global markets

---

## 4. UK / Lloyd's MGA Authorization

### Route 1: Direct FCA Authorization as an MGA
- Apply to the **Financial Conduct Authority (FCA)** for authorization as an insurance intermediary
- Timeline: **up to 6 months**
- Requirements: detailed business plan, board composition, compliance systems, PI insurance, capital adequacy (lower than carriers)
- Cost: £10K–£50K in application/legal fees; ongoing compliance costs

### Route 2: Appointed Representative (AR)
- Partner with an already-regulated intermediary (the "Principal") who takes regulatory responsibility
- **Much faster** — weeks rather than months
- Lower upfront cost
- Trade-off: less independence, principal takes oversight role and a fee

### Route 3: Lloyd's Coverholder
- Obtain a **binding authority** from a Lloyd's syndicate
- Must be FCA-authorized (or AR of an FCA-authorized firm)
- Lloyd's reviews and approves the coverholder and the binding authority agreement
- Access to Lloyd's ratings (A+ AM Best) and global licensing network
- Lloyd's syndicates can write surplus lines in the US through Lloyd's US platform

### Route 4: Lloyd's Managing Agent (Run a Syndicate)
- Full authorization from **PRA, FCA, and Lloyd's**
- Timeline: ~**6 months** (recently streamlined from 12–18 months)
- Much higher capital requirements and complexity — overkill for an MGA model

### Recommendation for UK
- **FCA authorization + Lloyd's coverholder status** is the sweet spot — moderate regulatory burden, access to Lloyd's paper and global licenses

---

## 5. MGA Model — Operating Under Carrier Paper

### What Is an MGA?
A Managing General Agent (MGA) / Managing General Underwriter (MGU) is an intermediary with **delegated authority** from a licensed insurance carrier to:
- Underwrite and bind policies
- Set rates and terms (within agreed guidelines)
- Handle claims (often)
- Issue policies on the carrier's "paper" (license)

The carrier provides the insurance license, balance sheet, and regulatory compliance; the MGA provides the product expertise, distribution, and underwriting.

### Advantages for Corgi

| Factor | MGA | Own Carrier License |
|---|---|---|
| **Startup capital** | $200K–$750K | $5M–$26M+ |
| **Time to market** | 3–6 months | 1–2+ years |
| **Regulatory burden** | Light (state MGA licensing in some states) | Heavy (every state, ongoing) |
| **Rate/form filings** | Carrier handles (or none if surplus lines) | Must file in every admitted state |
| **Risk capital** | Carrier's balance sheet | Your balance sheet |
| **Product control** | High (binding authority, program design) | Full |

### Trade-offs
- Carrier takes a portion of premium (typically 15–30% ceding commission to MGA, carrier retains the rest)
- Must find a carrier willing to put up paper for a novel product
- Carrier has ultimate oversight and can terminate the relationship
- MGA licensing may be required in some states (varies by state)

### Finding Carrier Partners
- **Surplus lines / E&S carriers** are the natural partners for novel products (e.g., Markel, Berkley, ARGO, Palomar, Kinsale)
- **Lloyd's syndicates** are experienced with novel/specialty risk and delegate heavily to coverholders
- **Bermuda-domiciled carriers** with US surplus lines access
- **ILS / alternative capital** providers interested in uncorrelated risk

### Can Corgi Operate as an MGA?
**Yes — this is the most practical path to market.** The MGA model is specifically designed for specialist underwriters who have product expertise but don't want the capital and regulatory burden of being a carrier. GPU residual value risk is exactly the type of niche, data-driven product that MGAs excel at.

---

## 6. Surplus Lines / E&S Market — Fast-Tracking Novel Products

### Why Surplus Lines Exists
The E&S (Excess & Surplus Lines) market exists specifically for risks that the standard admitted market cannot or will not cover — including **novel products without loss history**.

### How It Works
1. A **surplus lines broker** (licensed in the insured's home state) places the policy
2. The broker must perform a **"diligent search"** — typically 3 admitted carriers must decline the risk
3. The policy is issued by a **non-admitted insurer** (domestic or alien)
4. The broker collects and remits **surplus lines premium tax** to the state
5. The insured receives a **disclosure** that the policy is not covered by state guaranty funds

### Key Advantages for Novel Products
- **No rate or form filing requirements** — the insurer can price and structure the product freely
- **No prior approval** — can go to market immediately
- **Designed for innovation** — surplus lines insurers "primarily focus on the development of new coverages and the structuring of policies and premiums for unique risks"
- **Flexible terms** — can customize policy language without regulatory template constraints
- **National reach** — a single non-admitted insurer can write business in all 50 states through surplus lines brokers

### Becoming an Eligible Surplus Lines Insurer

**For US-Domiciled Non-Admitted Insurers:**
- Must meet state eligibility requirements (typically **$15M+ capital & surplus**)
- Apply to each state's approved surplus lines insurer list
- Maintain Certificate of Authority from domicile state

**For Alien (Non-US) Insurers (e.g., Bermuda-domiciled):**
- Apply for inclusion on the **NAIC Quarterly Listing of Alien Insurers** (maintained by the International Insurers Department)
- Requirements:
  - Establish a **US trust fund** held by a qualified US bank (minimum **$15M** security deposit)
  - Provide articles of incorporation, officer bios, business plan, financial statements
  - Update annually
- Once on the NAIC list, **all states must permit** the insurer to write surplus lines (per the Nonadmitted and Reinsurance Reform Act / NRRA)
- Some states maintain additional eligibility requirements beyond the NAIC listing

### Surplus Lines Market Size
- The US E&S market writes **$100B+** in annual premium (2024)
- Growing rapidly as standard market hardens and novel risks increase
- Lloyd's is the largest single surplus lines provider in the US

---

## 7. Regulatory Filings for a New Insurance Product

### If Operating Through Surplus Lines (Recommended)
- **No rate or form filings required** in most states
- Product design, pricing, and policy language are between the insurer, MGA, and policyholder
- Must comply with general insurance contract law (no unconscionable terms, good faith, etc.)
- Surplus lines broker handles state-specific disclosure and tax requirements

### If Operating as an Admitted Insurer (Not Recommended for Novel Products)

#### Filing Types
1. **Rate Filings** — actuarial support for premium rates, rating plans, classifications, territories
2. **Form Filings** — policy forms, endorsements, riders, applications, certificates, declarations pages
3. **Rule Filings** — underwriting rules, rating rules, manuals

#### Filing Systems (Vary by State and Line of Business)

| System | Description |
|---|---|
| **Prior Approval** | Must be filed and approved before use. Approval via explicit approval or "deemer" provision (auto-approved after X days without denial) |
| **File and Use** | File on or before effective date; can use immediately unless regulator objects |
| **Use and File** | Use immediately; file within specified period after use |
| **Flex Rating** | Rate changes within a band (e.g., ±12%) take effect immediately; larger changes require prior approval |
| **No Filing** | Some states/lines have no filing requirement |

#### SERFF (System for Electronic Rate and Form Filing)
- **All filings** are submitted electronically through SERFF (run by NAIC)
- Each state has its own SERFF requirements and review timelines
- Filings are classified by **Type of Insurance (TOI)** and **Sub-Type** from the NAIC Product Coding Matrix
- A novel product may not have an existing TOI — would need to work with NAIC/states to classify

#### Typical Timeline for Admitted Product Approval
- **30–90 days per state** for prior approval states
- Must file separately in each state where the product will be sold
- Resubmissions for objections add months
- Total multi-state rollout: **6–18 months** after product development

---

## 8. Recommended Path for Corgi

### Phase 1: MGA + Surplus Lines (Fastest to Market)
1. **Form Corgi as an MGA** — incorporate, get state MGA licenses where required
2. **Secure carrier paper** — partner with a surplus lines carrier or Lloyd's syndicate willing to back GPU residual value risk
3. **Appoint surplus lines brokers** or distribute through existing broker networks
4. **No rate/form filings needed** — design the product, price it, go to market
5. **Timeline: 3–6 months** | **Capital: $200K–$750K**

### Phase 2: Own Bermuda Carrier (Scale & Margin)
1. **Apply for Bermuda Class 3A license** once premium volume justifies it
2. **Establish US trust fund** ($15M) and apply for **NAIC IID Quarterly Listing**
3. **Write surplus lines directly** in the US without needing carrier paper
4. **Retain full underwriting profit** instead of sharing with carrier partner
5. **Timeline: 6–12 months** from application | **Capital: $1M statutory minimum + $15M US trust fund**

### Phase 3: Scale & Diversify
- Add Lloyd's coverholder status for European/global distribution
- Consider admitted market entry in high-volume states if product matures and loss data accumulates
- Explore ILS structures (catastrophe bond-style) for risk transfer to capital markets

### Key Advisors Needed
- **Insurance regulatory counsel** (US multi-state + Bermuda) — firms like Mayer Brown, Willkie Farr, Conyers (Bermuda)
- **Actuarial firm** — for pricing, reserving, and capital modeling (no historical loss data = need creative approaches)
- **Surplus lines broker partner** — for distribution and state compliance
- **Bermuda corporate services** — for eventual carrier formation (insurance manager, registered office, directors)

---

## Sources & References
- NAIC Surplus Lines Topics: https://content.naic.org/insurance-topics/surplus-lines
- BMA Insurance Licensing: https://www.bma.bm/insurance-licensing
- CIMA Insurance: https://www.cima.ky/insurance
- FCA Authorization: https://www.fca.org.uk/firms/authorisation
- Lloyd's Managing Agent Guide: https://www.lloyds.com/join-lloyds-market/underwriter/managing-agent
- SERFF: https://www.serff.com/
- WSIA (Wholesale & Specialty Insurance Association): https://www.wsia.org
- Mayer Brown MGA/MGU Resource: https://www.mayerbrown.com/en/insights/resource-centers/insurtech/mga-mgu
