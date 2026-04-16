# Indie Domain Sourcing Progress

## Status: COMPLETE
**Last Updated:** 2026-04-05 08:50 PDT

## Results Summary
- **Total unique new domains:** 30,334
- **Target:** 2,000+ ✅ (exceeded by 15x)
- **Output file:** `wave1/indie_domains.jsonl`

## Source Breakdown
| Source | Domains | Notes |
|--------|---------|-------|
| Hacker News (Show HN) | 29,284 | Algolia API, 100+ query variations across 2 waves |
| Indie Hackers / GitHub Lists | 1,010 | awesome-self-funded, free-for-dev, awesome-saas-services, awesome-saas, awesome-free-saas, awesome-indie, awesome-saas-directories, saas-starter-stack |
| BetaList | 40 | JS-rendered site, extracted from readable content |

## Approach
1. **HN Algolia API** — Primary source. Ran 100+ search queries across Show HN posts (saas, startup, tool, app, platform, api, analytics, crm, etc.) with pagination up to 5 pages per query. Extracted URLs from hit objects, cleaned to domains, deduped against 86,294 existing domains.
2. **GitHub Awesome Lists** — Fetched README.md from 8 curated GitHub repos via API. Extracted all markdown links as domains.
3. **BetaList** — JS-heavy site limited web_fetch results. Extracted startup names from topic pages (SaaS, email marketing).
4. **AlternativeTo** — Blocked by Cloudflare (403). Skipped.
5. **Product Hunt** — Blocked by Cloudflare (403). Got a few domains via web_search results.

## Dedup
- All domains checked against `shared/existing_domains.txt` (86,294 domains)
- Internal dedup within session (Set-based)
- Domains cleaned: stripped protocols, paths, www prefix, lowercased
- Skipped: github.com, twitter.com, medium.com, and 30+ other non-company domains

## Data Quality Notes
- HN Show HN posts are founder-submitted → high relevance for indie/bootstrapped companies
- Some domains may be defunct (old HN posts from 2011-2024)
- GitHub list domains include SaaS tools (high quality ICP match)
- BetaList domains are recently launched startups (2024-2025)
