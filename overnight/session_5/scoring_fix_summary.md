# Session 5 — Scoring Fix & Rescore Summary

**Run:** 2026-04-04 05:14 PDT

## Baseline
- **Grade A:** 1,185 | **B:** 14,487 | **C:** 29,168 | **D:** 3 | **DQ:** 41,159
- **Total:** 86,002

## Bug Fixes Applied

### Bug 1: `recently_funded` Never Applied (+5 pts)
- **Root cause:** Rescore scripts hardcoded `recently_funded=False`
- **Companies with accelerator data:** 138 (92 were DQ, so 46 eligible)
- **Updated:** 46 companies got +5 points
- **Promoted to A:** 2
- **Promoted to B:** 0

### Bug 2: Blockchain/DeFi Missing from STRONG_TECH_KEYWORDS (+10 pts)
- **Root cause:** `icp_score_v1.py` regex lacks blockchain/DeFi/web3/crypto/NFT terms
- **Affected:** 22 companies scored `moderate_tech` (15) instead of `strong_tech` (25)
- **Updated:** 22 companies got +10 points
- **Promoted to A:** 0
- **Promoted to B:** 5 (from C)

### Bug 3: `website_exists` vs `live_website` Gap (+3 pts)
- **Root cause:** Companies with domain but no vibe-confirmed "live" status lose 3 pts
- **Affected:** 0 companies (no companies matched the criteria)
- **No action needed**

## Final Totals
| Grade | Before | After | Change |
|-------|--------|-------|--------|
| A     | 1,185  | 1,187 | **+2** |
| B     | 14,487 | 14,490| **+3** |
| C     | 29,168 | 29,163| **-5** |
| D     | 3      | 3     | 0      |
| DQ    | 41,159 | 41,159| 0      |

**Net Grade A increase: +2** (both from Bug 1 — funded companies crossing the 75-point threshold)

## Notes
- All updates ran in transactions with WAL mode
- Scores capped at 100
- Bug 3 had zero impact — no companies in the DB matched the `website_exists` without `live_website` pattern
- Bug 2 promoted 5 companies from C→B but none reached the A threshold
