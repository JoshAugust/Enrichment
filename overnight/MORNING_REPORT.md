# 🌅 Overnight Run — Morning Report
**Date:** April 4, 2026 | **Runtime:** ~3 hours | **Operator:** Session 1 (solo)

---

## TL;DR
Sourced **4,116 new companies**. Imported and scored them all. But the hard truth: **heuristic scoring can't reach 5,000 Grade A** without employee/revenue data that isn't publicly available. Current Grade A: **1,169**. There are **1,328 companies one notch below** that need one piece of data to cross the line.

---

## What Happened

### Sessions 2-5: Dead on Arrival ☠️
Sessions 2-5 spawned sub-agents but produced **zero output**. Session 5 never even started. Session 1 compensated by running 10 sub-agents solo, covering all planned sourcing work.

### Sourcing: Massive Success ✅
| Source | New Domains | Runtime |
|--------|-------------|---------|
| Crunchbase SQL (Orange Slice) | 871 | 9 min |
| Accelerator portfolios (Techstars, Capital Factory, etc.) | 823 | 20 min |
| Directory mining (TinySeed, CalmFund, state lists) | 722 | 19 min |
| GitHub/dev community (awesome lists, Product Hunt) | 690 | 18 min |
| Apollo free company search | 551 | 13 min |
| Google Maps (20 US cities) | ~525 | 6 min |
| Wellfound + Crunchbase web scraping | 324 | 23 min |
| **TOTAL** | **4,116** | — |

All deduplicated against 153K existing domains (82K HubSpot + 82K master.db).

### Scoring: The Data Wall 🧱
| Grade | Count | From new imports |
|-------|-------|-----------------|
| **A (75+)** | **1,169** | 0 |
| **B (50-74)** | **13,634** | ~411 |
| C (25-49) | 29,670 | ~864 |
| DQ | 41,246 | ~2,446 |
| **Total** | **86,002** | 4,001 |

**Why zero new Grade A?** The scoring model gives 0/30 for Size Fit when employee count is unknown. Even with perfect Tech Fit (40/40) and Verifiability (15/15), that's only 55 → Grade B. Website scraping found employee counts for only 11 of 232 companies tried.

### Enrichment Attempts
| Agent | Processed | Promotions to A |
|-------|-----------|----------------|
| Grade B website enrichment (232 cos) | 232 | **0** |
| Rescue enrichment (240 cos) | 240 | **0** (but 172 C→B, 24 rescued from DQ) |
| Grade B→A promoter (funding/hiring search) | 4,367 scanned | **13** |

### Bugs Found in Scoring Pipeline
1. **`recently_funded` hardcoded False** — never auto-applied even when `recent_news` has funding evidence
2. **`website_exists` vs `live_website` gap** — 3-point penalty from inconsistent tagging
3. **Crypto/DeFi keywords missing** from `STRONG_TECH_KEYWORDS`

---

## The Real Picture

**Grade A (1,169)** = companies that have: strong tech signals + known small employee count + known revenue + good verifiability + sometimes accelerator/funding modifiers. These all came from BvD/Crunchbase data that included employee counts and revenue.

**Grade B 70-74 (1,328)** = companies that are almost certainly ICP but are missing ONE data point — usually employee count or a modifier signal. These are the **lowest-hanging fruit**.

**The 4,116 new companies** are real tech companies from legitimate sources (Techstars, Crunchbase, Product Hunt, etc.) but they're data-sparse. They need enrichment before they can score well.

---

## Options for Reaching 5,000 Grade A

### Option 1: Apollo Bulk Enrichment (Recommended)
Use the 1,000 Apollo credits to enrich the 1,328 Grade B 70-74 companies. Apollo returns employee count + revenue + funding data. If even 60% come back with ≤50 employees, that's ~800 new Grade A.
- **Cost:** 1,000 credits (already budgeted)
- **Expected yield:** 500-800 new Grade A
- **Total:** ~1,700-2,000 Grade A

### Option 2: Lower Grade A Threshold to 70
The 1,328 companies at score 70-74 are functionally identical to Grade A — they just lack one modifier signal. Lowering the threshold to 70 instantly adds 1,328 to Grade A.
- **Cost:** Zero
- **Total:** ~2,500 Grade A
- **Risk:** Slightly lower average quality

### Option 3: LLM-Based Tech Classification (The Nuclear Option)
The ICP model includes an LLM prompt for production use. Running it against the 13,634 Grade B companies could reclassify many from `moderate_tech` (15pts) to `strong_tech` (25pts), promoting thousands.
- **Cost:** API calls (Sonnet at ~$0.003/company = ~$41 for all Grade B)
- **Expected yield:** 2,000-4,000 promotions
- **Total:** Could reach 5,000+

### Option 4: Combine 1 + 2 + 3
Apollo enrich the near-A companies, lower threshold to 70, and run LLM on the rest. Most likely path to 5,000.

---

## Files Produced
- `jordan.ai/overnight/shared/new_companies_queue.jsonl` — 4,116 new companies
- `jordan.ai/overnight/session_1/import_score_results.json` — import stats
- `jordan.ai/overnight/session_1/import_score_report.md` — detailed report
- `jordan.ai/overnight/session_1/promotions.json` — 13 B→A promotions with evidence
- `jordan.ai/overnight/session_1/enrichment_results.json` — enrichment stats
- `jordan.ai/overnight/session_1/rescue_results.json` — rescue enrichment stats
- All session logs in `jordan.ai/overnight/session_1/`

---

## Recommendation
Do **Option 4** in phases:
1. **Now:** Apollo enrich the 1,328 near-A companies (use the 1,000 credits)
2. **If that's not enough:** Lower threshold to 70 (gets us to ~2,500)
3. **If we need more:** Run LLM classification on Grade B (gets us to 5,000+)

The companies are there. The data is the bottleneck. Each option is progressively more aggressive but also more effective.
