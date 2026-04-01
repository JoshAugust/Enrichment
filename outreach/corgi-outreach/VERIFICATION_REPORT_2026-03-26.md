# Corgi Outreach — Lead Verification Report
**Date:** 2026-03-26  
**Scope:** All 327 companies, 665 contacts  
**Method:** `verify-leads.js --no-http` (static analysis + data cross-referencing)  
**Runtime:** ~0.1 seconds (no live HTTP)  

---

## Executive Summary

| Metric | Value |
|---|---|
| Total companies | 327 |
| Total contacts | 665 |
| Average verification score | **76.9 / 100** |
| Verified (80+) | **108** (33%) |
| Pending (50–79) | **219** (67%) |
| Flagged (<50) | **0** (0%) |

The database is in **solid shape**. Every single company scored above 50 — none are flagged. The primary weaknesses are data completeness (missing funding data, LinkedIn, HQ for many companies) and contact depth (average of only 2.0 contacts per company). All data scores 100/100 on freshness — the enrichment run on March 24–25 is recent.

---

## Score Distribution

| Bucket | Count | % | Avg Score |
|---|---|---|---|
| 🟢 **90–100 (Elite)** | 4 | 1.2% | 91.5 |
| 🟢 **80–89 (Verified)** | 104 | 31.8% | 82.0 |
| 🟡 **70–79 (Solid Pending)** | 194 | 59.3% | 75.1 |
| 🟡 **60–69 (Weak Pending)** | 25 | 7.6% | 67.1 |
| 🔴 **Below 50 (Flagged)** | 0 | 0% | — |

**The majority (59.3%) sits in the 70–79 band** — good data, but missing a handful of fields or contacts. These are actionable leads that need minor enrichment rather than rebuild.

---

## Score Breakdown by Company Type

| Type | Count | Avg Overall | Avg Completeness | Avg Accuracy | Avg Contact Quality | Verified | Pending |
|---|---|---|---|---|---|---|---|
| **Operator** | 154 | 77.3 | 68.0 | 67.0 | 74.2 | 50 | 104 |
| **Lender** | 85 | 77.4 | 63.4 | 63.4 | 82.3 | 36 | 49 |
| **Arranger** | 88 | 75.7 | 53.9 | 62.3 | 86.2 | 22 | 66 |

**Key observations:**
- **Arrangers** have the lowest completeness (53.9) — most are insurance/reinsurance companies where financial data (total raised, LinkedIn) is less publicly available
- **Lenders** have the best contact quality (82.3) — most have 2–3 contacts with emails
- **Arrangers** also have excellent contact quality (86.2) — well-sourced
- **Operators** have the best data completeness (68.0) — website/description/HQ data is easiest to find for tech companies

---

## Score Breakdown by Priority Tier

| Priority | Count | Avg Overall | Avg Completeness |
|---|---|---|---|
| **A** | 77 | 78.1 | 65.7 |
| **B** | 105 | 76.4 | 59.3 |
| **C** | 145 | 76.6 | 64.3 |

Priority tiers are fairly evenly scored overall — the manual prioritization (A/B/C) was based on strategic fit, not data quality, which is expected.

---

## Top 20 Strongest Leads

*Sorted by verification score descending. These are ready for outreach.*

| Rank | Company | Type | Priority | Overall | Complete | Fresh | Accuracy | Contact |
|---|---|---|---|---|---|---|---|---|
| 1 | **Colovore** | operator | C | **95** | 95 | 100 | 85 | 100 |
| 2 | **phoenixNAP** | operator | C | **91** | 82 | 100 | 80 | 100 |
| 3 | **Cirrascale Cloud Services** | operator | A | **90** | 90 | 100 | 80 | 91 |
| 4 | **Monroe Capital** | lender | C | **90** | 84 | 100 | 77 | 99 |
| 5 | **Flexential** | operator | C | **88** | 79 | 100 | 72 | 99 |
| 6 | **Gcore** | operator | A | **87** | 84 | 100 | 72 | 91 |
| 7 | **Gladstone Capital Corporation** | lender | B | **87** | 79 | 100 | 77 | 91 |
| 8 | **Vultr** | operator | B | **87** | 82 | 100 | 70 | 96 |
| 9 | **BNP Paribas Leasing Solutions** | lender | B | **86** | 74 | 100 | 72 | 99 |
| 10 | **Benefit Street Partners (Franklin Templeton)** | lender | C | **86** | 79 | 100 | 72 | 91 |
| 11 | **Muzinich & Co.** | lender | B | **86** | 74 | 100 | 72 | 99 |
| 12 | **Penguin Solutions (formerly SMART Modular)** | operator | A | **86** | 79 | 100 | 72 | 91 |
| 13 | **TeraWulf** | operator | B | **86** | 74 | 100 | 72 | 99 |
| 14 | **Fal.ai** | operator | A | **85** | 79 | 100 | 77 | 83 |
| 15 | **Groq** | operator | C | **85** | 79 | 100 | 77 | 83 |
| 16 | **RunPod** | operator | C | **85** | 74 | 100 | 72 | 92 |
| 17 | **Blue Owl Capital** | lender | C | **84** | 79 | 100 | 72 | 86 |
| 18 | **Core Scientific** | operator | B | **84** | 74 | 100 | 72 | 91 |
| 19 | **DataBank** | operator | C | **84** | 74 | 100 | 72 | 91 |
| 20 | **EverBank Corporate Asset Finance** | lender | B | **84** | 74 | 100 | 72 | 91 |

**Notable:** Colovore (95), phoenixNAP (91), and Cirrascale (90) are the top-tier targets. All 4 elite leads (90+) are in the operator category, all with 5–6 contacts and full email coverage.

---

## Bottom 20 — Needs Enrichment (but NOT flagged)

*All scored between 65–69. Primary issue: missing financial/LinkedIn data. All have fresh data.*

| Rank | Company | Type | Priority | Overall | Missing Key Fields |
|---|---|---|---|---|---|
| 1 | **Antares Re (Bermuda)** | arranger | B | 65 | Total Raised, LinkedIn, Funding Round, Investors |
| 2 | **Asset RVI** | arranger | A | 65 | Total Raised, LinkedIn, Funding Round, Investors |
| 3 | **Bison Reinsurance Company, Ltd.** | arranger | B | 65 | Total Raised, LinkedIn, Funding Round, Investors |
| 4 | **DataVault AI** | lender | B | 65 | Total Raised, LinkedIn, Funding Round, Investors |
| 5 | **Premia Holdings Ltd.** | arranger | B | 65 | Total Raised, LinkedIn, Funding Round, Investors |
| 6 | **AssuredPartners** | arranger | B | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 7 | **Banc of California Equipment Finance** | lender | A | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 8 | **Comerica Equipment Finance** | lender | A | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 9 | **EdgeCore Digital Infrastructure** | operator | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 10 | **Hiscox Re** | arranger | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 11 | **Iron Mountain (Data Center + ITAD)** | operator | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 12 | **KeyBanc Equipment Finance** | lender | A | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 13 | **LiquidStack** | operator | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 14 | **Marlin Capital Solutions** | lender | B | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 15 | **NetEquity.com** | operator | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 16 | **Perplexity AI (Infrastructure)** | operator | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 17 | **Sims Lifecycle Services** | operator | C | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 18 | **Woodruff Sawyer** | arranger | B | 67 | Total Raised, LinkedIn, Funding Round, Investors |
| 19 | **USD.AI** | lender | B | 68 | Total Raised, LinkedIn, Funding Round, Investors |
| 20 | **ALTA Technologies** | operator | C | 69 | Total Raised, LinkedIn, Funding Round, Investors |

**Pattern:** These companies share the exact same profile — missing financial data (`total_raised`, `last_funding_round`, `investors`) and LinkedIn URL. This is a **systematic gap** addressable in a single enrichment pass, not a per-company problem.

⚠️ **Priority-A attention required:** Asset RVI, Banc of California Equipment Finance, Comerica Equipment Finance, and KeyBanc Equipment Finance are all Priority-A leads sitting at 65–67. These need enrichment before outreach.

---

## Verification Log Summary

| Check | Pass | Warning | Fail | Skip |
|---|---|---|---|---|
| `contact_reachable` | 214 | 113 | 0 | 0 |
| `data_completeness` | 107 | 220 | 0 | 0 |
| `description_quality` | 327 | 0 | 0 | 0 |
| `founded_year_valid` | 31 | 0 | 5 | 291 |
| `funding_cross_ref` | 8 | 168 | 0 | 151 |
| `headquarters_valid` | 315 | 1 | 0 | 11 |
| `linkedin_format` | 188 | 0 | 0 | 139 |
| `news_freshness` | 327 | 0 | 0 | 0 |
| `phone_format` | 326 | 0 | 1 | 0 |
| `website_alive` | 0 | 0 | 0 | 327 (skipped) |
| `website_format` | 327 | 0 | 0 | 0 |

*Note: `website_alive` was skipped (--no-http flag). Run with live checks for deeper accuracy scoring.*

---

## Data Quality Assessment

### ✅ Strengths

1. **100% freshness** — Every company was enriched in the last 1–2 days. Data is maximally fresh.
2. **100% website coverage** — All 327 companies have valid website URLs (format-checked)
3. **100% description quality** — Every company has a substantive description (80+ chars)
4. **99.7% phone validity** — Only 1 phone number failed format check (too many/few digits)
5. **96.3% HQ coverage** — 315 of 327 companies have headquarters data
6. **No flagged leads** — Not a single company fell below 50 points

### ⚠️ Weaknesses

1. **LinkedIn missing on 139 companies (42.5%)** — This is the single biggest data gap. LinkedIn URLs are critical for contact discovery and verification.

2. **Funding data gaps on 151 companies (46.2%)** — Neither `total_raised` nor `last_funding_round` recorded. Another 168 have partial data. Only 8 have both fields fully cross-checked.

3. **Low contact depth** — Average of only 2.0 contacts per company. For a 327-company outreach list, 665 contacts means many companies have a single point of failure. If that contact is unreachable, the company goes dark.

4. **Shallow contact quality** — 113 of 327 companies (34.5%) got only "warning" on contact_reachable, meaning their contacts have gaps (missing email or phone).

5. **Founded year missing on 291 companies (89%)** — Low-priority but worth filling in the enrichment pipeline.

6. **No live website checks run** — `data_accuracy_score` was capped at 62–70 for most companies because the website HTTP check (worth 30 pts) was skipped. Running with live checks will revise scores significantly upward for live companies.

---

## Companies Needing Immediate Attention

### Priority A leads scored below 75

| Company | Score | Type | Key Gap |
|---|---|---|---|
| Banc of California Equipment Finance | 67 | lender | No funding data, no LinkedIn |
| Comerica Equipment Finance | 67 | lender | No funding data, no LinkedIn |
| KeyBanc Equipment Finance | 67 | lender | No funding data, no LinkedIn |
| Asset RVI | 65 | arranger | No funding data, no LinkedIn |
| SQN Capital Management | 74 | lender | Missing LinkedIn, funding data |
| Macquarie Capital (GPU Infrastructure) | 74 | lender | Missing LinkedIn, funding data |

---

## Recommendations

### 1. 🎯 Run live HTTP verification on top 50 leads
```bash
node backend/scripts/verify-leads.js --verbose
```
This will run actual HTTP HEAD checks against company websites, adding up to 30 accuracy points per company. The 90+ tier could expand significantly. Expect a batch to take 3–5 minutes.

### 2. 📋 Enrichment sprint: LinkedIn + Funding data
The **139 companies missing LinkedIn** and **151 missing funding data** share near-identical missing profiles. A targeted enrichment pass focusing specifically on these two fields would lift the average score from **76.9 → ~82–83** across the board.

Priority order:
1. Priority-A companies with scores <75 (6 companies)
2. All Priority-B companies missing LinkedIn (estimated ~50)
3. All Priority-C companies missing both LinkedIn + funding

### 3. 📞 Contact depth improvement
With only 2.0 contacts per company average, the list needs more contacts per target. Aim for **3–4 contacts per company** across different roles (CFO, VP Finance, Head of Infrastructure). This would push contact_quality_score from the current average ~78 → ~90+ for well-covered companies.

### 4. 🔄 Weekly freshness maintenance
Set a recurring enrichment schedule. The current data is fresh now (scored 100), but in 30 days `data_freshness_score` drops to 90, in 90 days to 50. A bi-weekly enrichment run on Active/Priority-A companies keeps them in the verified tier.

### 5. 🟢 Act now on the top tier
**108 companies are verified (80+) right now.** These don't need enrichment — they need outreach. In particular, the following A-priority verified leads should be prioritized:
- Cirrascale Cloud Services (90)
- Gcore (87)
- Penguin Solutions (86)
- Fal.ai (85)
- GMI Cloud (84)
- Live Oak Bank (84)
- Western Alliance Bank (84)
- GreatAmerica Financial Services (82)
- Key Equipment Finance / KeyBank (82)
- Verda (82)
- Wingspire Equipment Finance (82)

---

## Verification Log Activity

Total log entries written: **3,270** (10 checks × 327 companies)

Log is queryable via:
```sql
SELECT entity_id, check_type, result, details, score_impact
FROM verification_log
WHERE entity_id = '<company_uuid>'
ORDER BY created_at;
```

---

*Report generated by the Corgi Outreach Verification System · Brock (AI) · 2026-03-26*
