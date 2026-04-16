# Domain Sourcing Progress — SaaSHub / GitHub Lists / Curated DB

## Status: ✅ COMPLETE
Started: 2026-04-05T15:43:00Z
Completed: 2026-04-05T16:10:00Z

## Final Results
| Metric | Count |
|--------|-------|
| **Total unique domains** | **5,083** |
| Dedup against existing | 86,293 |
| Output file | `wave1/g2_domains.jsonl` |

## Sources Breakdown
| Source | Domains | Quality |
|--------|---------|---------|
| saashub-extra (80+ niche categories) | 1,282 | Medium (slug.com guess) |
| saashub (main categories) | 982 | Medium (slug.com guess) |
| github-free-for-dev | 801 | High (verified URLs) |
| saashub-alternatives (deep crawl) | 690 | Medium (slug.com guess) |
| saashub-deep (more alt pages) | 677 | Medium (slug.com guess) |
| known-saas-database | 299 | High (manually verified) |
| curated-final | 170 | High (manually verified) |
| github-awesome-list | 142 | High (verified URLs) |
| micro-saas-indie | 40 | High (verified) |

## Category Distribution (top 15)
- alternatives: 1,367
- free-for-dev: 801
- github-list: 142
- developer-tools: 50
- project-management: 43
- design: 35
- crm: 34
- no-code: 33
- hr: 33
- cms: 32
- ai: 31
- analytics: 28
- seo: 27
- monitoring: 27
- ecommerce: 24

## Quality Notes
- **~35% High Quality** (1,212 domains) — from known DB, curated, GitHub lists with verified URLs
- **~65% Medium Quality** (3,871 domains) — from SaaSHub slug-to-domain mapping (.com guess)
- SaaSHub slug domains need DNS validation before enrichment
- Enterprise companies filtered out (Oracle, SAP, Salesforce, etc.)

## Blocked Sources (could not scrape)
- ❌ g2.com — 403 on all product/category pages
- ❌ capterra.com — 403 on all pages
- ❌ getapp.com — 403
- ❌ alternativeto.net — 403
- ❌ openalternative.co — Needs JS rendering

## Recommendations for Next Steps
1. Run DNS validation on SaaSHub-sourced domains to confirm they're real
2. Enrich high-quality domains first (GitHub + known DB sources)
3. For more domains, try browser-based crawling of G2/Capterra (needs headful browser)
4. Consider Product Hunt API as another source
