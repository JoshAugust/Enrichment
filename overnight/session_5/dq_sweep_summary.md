# DQ Sweep Summary — Session 5

**Run:** 2026-04-04 05:14 PDT  
**Total companies DQ'd:** 9

---

## Sweep 1: Gov Tech False Positives → 2 DQ'd

Both Grade A companies with "Government workflow automation platform operator" (BvD description) were DQ'd:

| Domain | Company | Prev Grade | Prev Score |
|--------|---------|------------|------------|
| softech-inc.net | SOFTECH INC | A | 79 |
| onecle.com | ONECLE INC. | A | 76 |

**Note:** Both shared the identical BvD description — likely a copy-paste cluster.

---

## Sweep 2: Non-Tech SIC Mismatches → 5 DQ'd (119 hits reviewed)

The query returned 119 companies, but **114 are legitimate vertical SaaS** (software FOR construction, real estate, restaurant, dental industries). Only 5 are clearly non-tech operations that were mis-assigned tech SIC codes:

| Domain | Company | Why Not Tech |
|--------|---------|-------------|
| summit-service.com | SUMMIT SERVICES | Laundry/cleaning/garment services |
| dotoloresearch.com | DOTOLO RESEARCH CORP | Colon cleaning hardware manufacturer |
| krk.com | KRK | Real estate property management operations |
| stigroup.net | SECURE TECHNOLOGY INTEGRATION PRODUCTS I | Real estate investment services |
| l1enterprises.com | L1 ENTERPRISES, INC. | Data centre construction services |

**⚠️ BvD Description Quality Issue:** Many BvD descriptions are clearly copy-pasted to wrong companies. Example: `browserstack.com` (a browser testing platform) is described as "Online cloud-based real estate management SaaS provider." These companies are fine — BvD is wrong, not the company.

---

## Sweep 3: Duplicate BvD Descriptions → 0 DQ'd (flagged for review)

Found 20 description clusters with ≥5 companies sharing identical text. Key findings:

| Cluster | Count | Risk Level |
|---------|-------|------------|
| "Sales office" / "Sales Office" | 115 | 🟡 Generic label, not real descriptions |
| "Non classifiable establishment" | 45 | 🟡 BvD couldn't classify — includes MicroStrategy |
| "Personnel supply services" | 30 | 🔴 Likely staffing firms, not SaaS — **recommend manual review** |
| "Veterans and caregivers records platform" | 26 | 🔴 Specific description applied to jewelry/homeschool/money management companies — classic BvD copy-paste |
| "Innovative automation system solutions" | 26 | 🟡 Too specific for 26 companies |
| "Customer interaction and workforce optimization software" | 22 | 🔴 Very specific description for 22 companies — BvD copy-paste |

**Recommendation:** The "personnel supply services" cluster (30 companies) likely contains staffing agencies that aren't SaaS product companies. Manual spot-check recommended.

---

## Sweep 4: Unknown-Size Grade A Companies → 0 found

No Grade A companies had all three size fields NULL. Every Grade A company has at least one data point (BvD employees, LinkedIn employees, or revenue). Clean.

---

## Sweep 5: Known Large Companies → 2 DQ'd

| Domain | Company | Prev Grade | Prev Score |
|--------|---------|------------|------------|
| datadog.com | Datadog | B | 55 |
| stability.ai | Stability AI | B | 70 |

- 9 of 15 checked were already DQ'd
- `linear.app` was Grade C (no action needed)
- `vercel.com` and `anthropic.com` not in the database

---

## Summary

| Sweep | Hits | DQ'd | Notes |
|-------|------|------|-------|
| 1 — Gov Tech | 2 | 2 | Both BvD copy-paste |
| 2 — Non-Tech SIC | 119 | 5 | 114 are legit vertical SaaS |
| 3 — BvD Duplicates | 20 clusters | 0 | Flagged ~70+ companies for manual review |
| 4 — Unknown Size | 0 | 0 | Clean |
| 5 — Known Large | 2 in A/B | 2 | 9 already DQ'd, 2 not in DB |
| **TOTAL** | — | **9** | — |

### Open Items for Human Review
1. **30 "personnel supply services" companies** in Grade A/B — likely staffing agencies
2. **26 "veterans and caregivers" companies** — BvD copy-paste error, descriptions unreliable
3. **115 "Sales office" companies** — generic BvD label with no useful signal
4. **~114 vertical SaaS companies** matched the non-tech keyword sweep but are legitimate software companies serving construction/RE/restaurant/dental verticals — left intact
