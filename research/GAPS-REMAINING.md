# GAPS-REMAINING.md — What We Tried But Couldn't Verify
**Compiled:** 2026-03-29 (Hour 9 Final Pass)  
**Purpose:** Document all research gaps requiring manual follow-up

---

## 🔴 CRITICAL: Outdated / Incorrect Data

| Issue | Details | Action Required |
|-------|---------|-----------------|
| **Voltage Park no longer exists** | Merged with Lightning AI on Jan 21, 2026. All @voltagepark.com emails are defunct. | Replace with Lightning AI (lightning.ai). Research Ozan Kaya (President) and Saurabh Giri (CPTO) at new domain. |
| **Crusoe CFO outdated** | Matthew DeNezza moved to advisory role Dec 2025. New CFO is Michael Gordon (also COO). | Verify michael.gordon@crusoe.ai or mgordon@crusoeenergy.com |
| **IREN domain migration** | Rebranded from irisenergy.co to iren.com (Nov 2024). Old email addresses may not route. | Use @iren.com for new outreach. Test deliverability of @irisenergy.co. |

---

## 🟡 Contact Verification Gaps

### High-Priority Targets Missing Verified Contacts
| Company | Score | Gap | What We Know |
|---------|-------|-----|--------------|
| **HUMAIN** (Saudi) | 85 | No direct email pattern confirmed | CEO: Tareq Amin identified. Government entity — likely requires warm introduction via Saudi networks. |
| **G42 / Core42** (UAE) | 85 | No email pattern confirmed | Peng Xiao (CEO G42), Mohamed Al Hameli (CEO Core42) identified. No public email domain confirmed. |
| **Firmus Technologies** | 75 | Very limited public contact info | High-priority target ($330M raise, 54K GB300 GPUs). NVIDIA equity investor. Almost no public-facing contact information. |
| **FluidStack** | 75 | Very limited public contacts | $10B Macquarie GPU facility confirmed. Fleet size/composition unknown. No named contacts found. |
| **5C Group** | 65 | Almost no public information | $835M Brookfield debt confirmed. Nearly zero public contact data. |
| **xAI / Valor Compute Infra** | 80 | CEO identified, no email | Antonio Gracias (VCI CEO) identified. No verified email. xAI is notoriously opaque. |

### Contacts Sourced from Low-Quality Sources Only
| Company | Contact | Role | Source | Risk |
|---------|---------|------|--------|------|
| Nebius Group | Maria del Dado Alonso Sanchez | CFO | Bloomberg profile only | Name spelling may be wrong; role unverified independently |
| Nebius Group | Danila Shtan | CTO | simplywall.st only | Single low-quality source |
| Lambda Labs | Mitesh Agrawal | COO | exa.ai directory | No LinkedIn, no independent confirmation |
| Lambda Labs | Paul Miltenberger | VP Finance | exa.ai directory | No LinkedIn, no independent confirmation |
| Kasi Cloud | Rico Besse | VP Operations | RocketReach only | May be outdated; company pre-launch |
| Kasi Cloud | Alexis Orjiako | GM Key Account Sales | RocketReach only | May be outdated |
| Kasi Cloud | Victor Lawson | Senior Legal Counsel | RocketReach only | May be outdated |

### Sovereign AI Entities — Government Contact Gaps
- **NEOM/TONOMUS** (Saudi): Key roles identified but no email patterns. Government megaproject — requires warm intro.
- **Qai/QCRI** (Qatar): $20B Brookfield JV confirmed. QIA involvement. No direct contacts.
- **SDAIA** (Saudi): Dr. Abdullah Al-Ghamdi (President) identified. Government entity contact methods unknown.
- **TII/Falcon LLM** (UAE): Dr. Najwa Aaraj (CEO) identified. NVIDIA Joint Lab opened Sept 2025. No email confirmed.
- **IndiaAI Mission**: Government programme. Demand aggregator, not direct operator.

---

## 🟡 Email Verification Gaps

### What Was NOT Done
- **No emails were bounce-tested** — all "confirmed" emails are from public press releases and contact pages
- **Hunter.io was NOT used** — requires paid account
- **Apollo.io was NOT used** — requires paid account
- **Lusha was NOT used** — requires paid account
- **ZoomInfo was NOT used** — enterprise pricing only
- **LinkedIn Sales Navigator was NOT used** — requires paid subscription

### Partially Confirmed Patterns (Inferred, Not Individually Verified)
| Company | Pattern | Basis | Confidence |
|---------|---------|-------|------------|
| CoreWeave | first.last@coreweave.com | Industry norm; press alias confirmed | Medium |
| nscale | first.last@nscale.com | Inferred from aliases | Medium |
| Nebius | first.last@nebius.com | Inferred from media alias | Medium |
| Blue Owl | first.last@blueowl.com | Inferred from media alias | Medium |
| Convex Insurance | first.last@convexin.com | Inferred from contact page context | Medium |
| Magnetar Capital | first.last@magnetar.com | Inferred; 2016 alias may be stale | Low |
| Everest Re | first.last@everestglobal.com | Domain inferred from website rebrand | Medium |

### Stale Contact Risk
- **Hiscox contacts**: Sourced from 2019–2020 press releases. May have changed.
- **Magnetar media alias**: From 2016 press release. Likely still valid but contact person may differ.

---

## 🟡 Phone Number Gaps

### What We Have (Total: 2 contacts with phones)
| Person | Company | Phone | Source |
|--------|---------|-------|--------|
| Nick Hester | Matrix Specialty | +44 203 457 0916 / +44 750 497 7044 | Company website |
| Kasi Cloud | Office | 703-659-7693 | Company contact |

### What We Don't Have
- **NO phone numbers for ANY GPU cloud operator executive** (CoreWeave, nscale, Crusoe, Lambda, Nebius, etc.)
- **NO phone numbers for ANY lender contact** (Blackstone, Magnetar, Blue Owl, PIMCO, etc.)
- **NO phone numbers for ANY insurance/reinsurer contact** (except Nick Hester above)
- Phone enrichment tools (Hunter.io, Apollo, Lusha) require paid accounts and were not used

---

## 🟡 Company Data Gaps

### Financial Data Missing
| Company | What's Missing |
|---------|---------------|
| FluidStack | Fleet size/composition unknown despite $10B facility |
| 5C Group | Almost no company information beyond Brookfield debt |
| Firmus Technologies | No prospectus yet (IPO-bound); financials unavailable |
| Most Africa operators | Minimal English-language financial data |
| Most LATAM operators | Limited financial disclosure |

### Scoring Gaps
- **~130 of ~230 companies** in MASTER-COMPANIES.md were NOT priority-scored (insurers, lenders, academic, ecosystem)
- Insurance/reinsurance companies cannot be scored on "Est GPU Value" (they're capacity providers)
- Lloyd's syndicates: Managing agent contacts not individually researched
- Bermuda insurers: Only ~8 of 24 have confirmed email patterns

---

## 🔵 Market Intelligence We Couldn't Access

| Source | What It Would Provide | Why We Couldn't Access |
|--------|----------------------|----------------------|
| Lloyd's Market Association (LMA) | Actual placement volumes for GPU/tech equipment | Members-only data |
| NVIDIA Partner Portal | Verified customer list, fleet sizes | NDA-protected |
| UCC-1 Filings (state level) | Actual equipment liens/security interests on GPUs | Requires state-by-state searches ($) |
| Aon/Marsh/Willis placement data | Existing GPU coverage premiums | Broker-confidential |
| PitchBook Pro / Crunchbase Pro | Detailed funding rounds, debt terms | Paid subscriptions |
| LinkedIn Sales Navigator | Verified contact details, InMail | Paid subscription |
| SEC EDGAR full analysis | All 10-K/10-Q GPU disclosures | Time-limited; identified but not all read |

---

## 🟢 What IS Solid

### Verified & High-Confidence Data
- **23 companies** with confirmed email patterns (from press releases, contact pages, SEC filings)
- **4 gateway contacts** with deep dossiers (Robert Prince, Ryan Little, Nick Hester, Hannah Greenwood)
- **Top 10 GPU operators**: Executive teams identified, 5+ contacts each
- **Email patterns confirmed** for: CoreWeave, Lambda, Crusoe, Together AI, Voltage Park (defunct), IREN, Blackstone, PIMCO, Ares, Everest Re, RenaissanceRe, Arch Capital, AXIS Capital, Hiscox, Fidelis, Awbury (best verified)
- **Priority scoring** complete for top 64 companies
- **~230 unique companies** identified and categorized
- **107 research files** compiled

---

## Recommended Manual Follow-Up Priority

1. **Set up Hunter.io or Apollo.io account** → Verify top 30 contact emails in bulk
2. **LinkedIn Sales Navigator** → Verify roles for Nebius CFO, Lambda COO, all sovereign AI contacts
3. **UCC-1 searches** → File searches in Delaware, Texas, California for CoreWeave, Lambda, Crusoe GPU liens
4. **Lightning AI research** → Replace all Voltage Park data with Lightning AI contacts
5. **Warm introductions** → Saudi/UAE sovereign AI entities require network introductions, not cold outreach
6. **Bounce-test critical emails** → Send test messages to top 10 confirmed email addresses
7. **Lloyd's broker introduction** → Robert Prince (Iris) can open doors to most Lloyd's syndicates

---

*Generated 2026-03-29 | Hour 9 Final Research Pass*
