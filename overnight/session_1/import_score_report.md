# ICP Import & Score Report
**Run:** 2026-04-04 05:09 UTC

## Import Summary
| Metric | Count |
|--------|-------|
| Queue size | 4116 |
| Imported (new) | 4001 |
| Skipped (existing) | 115 |

## ICP Scoring Summary
| Grade | Count | % of scored |
|-------|-------|-------------|
| A (75+) | 0 | 0.0% |
| B (50-74) | 232 | 5.8% |
| C (25-49) | 1048 | 26.2% |
| DQ (<25 or disqualified) | 2721 | 68.0% |
| Errors | 0 | — |
| **Total scored** | **4001** | |

## Notes
- Data sparsity is expected: most queue imports have no employee or revenue data
- Companies with no tech signal score lower or are DQ'd
- HubSpot dedup applied: existing customers excluded from scoring
- All newly imported companies have `enrichment_status = 'queue_import'`
