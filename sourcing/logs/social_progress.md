# Social Domain Sourcing Progress

## Status: COMPLETE ✅
Started: 2026-04-05 07:52 PDT
Completed: 2026-04-05 08:50 PDT

## Results
**6,612 unique new domains** written to `wave1/social_domains.jsonl`
- All deduped against 86,293 existing domains
- Zero internal duplicates

## Source Breakdown
| Source | Count |
|--------|-------|
| Hacker News (Show HN) | 5,842 |
| Reddit r/SaaS | 265 |
| Hacker News (Recent) | 75 |
| Reddit r/microsaas | 118 |
| Reddit r/webdev | 92 |
| Reddit r/SideProject | 92 |
| Reddit r/micro_saas | 41 |
| Reddit r/indiehackers | 36 |
| Reddit r/buildinpublic | 26 |
| Reddit r/reactjs | 18 |
| Reddit r/django | 7 |

## Method
1. **HN Algolia API** — 180+ queries across show_hn and story tags, pages 0-5, covering SaaS categories (CRM, analytics, AI tools, dev tools, etc.) + recent posts
2. **Reddit JSON API** — 32 queries across 10 subreddits, extracting URLs from selftext of founder posts
3. **Web search citations** — Indie Hackers and other citation domains from search results

## Queries Run
- HN Algolia: ~180 queries (56 initial + 124 extended)
- Reddit JSON: 32 queries
- Web search: 4 queries (for Reddit/IH discovery)

## Target
- Goal: 1,500+ → **Delivered: 6,612 (4.4x target)**
