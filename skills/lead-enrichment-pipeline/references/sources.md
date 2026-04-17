# Data Sources

## Discovery Sources

| Source | Records | Reliability | Cost | What to trust |
|--------|---------|-------------|------|---------------|
| BvD 60K batch | 23,301 | ⭐⭐ Low | Paid (uni license) | Name + domain ONLY. Employee/revenue data is garbage. |
| BvD 45K batch | 15,219 | ⭐⭐ Low | Paid | Same — name + domain only |
| Crunchbase | 32,430 | ⭐⭐⭐⭐ High | Orange Slice SQL | Good descriptions. Largest single source. |
| US Software (BvD subset) | 4,995 | ⭐⭐⭐ Medium | Paid | Pre-filtered by SIC. Domain mappings still suspect. |
| Y Combinator | 3,518 | ⭐⭐⭐⭐⭐ | Public | Separate pipeline. High quality but DQ'd for main outreach. |
| Product Hunt | 1,041 | ⭐⭐⭐ Medium | Scraped (free) | Good for early-stage. Many dead/pivoted. |
| Hacker News | 830 | ⭐⭐⭐ Medium | Scraped (free) | Technical founders. |
| Tech Companies List | 441 | ⭐⭐⭐⭐ High | Manual | Small but curated. |
| Accelerators | 138 | ⭐⭐⭐⭐ High | Scraped (free) | 15+ programs. Low volume, high signal. |
| AngelList | 70 | ⭐⭐⭐ Medium | Scraped | Limited. |
| Silicon Valley List | 17 | ⭐⭐⭐ Medium | Manual | Tiny supplemental. |

## Enrichment Sources

| Source | What it provides | Reliability | Cost per call |
|--------|-----------------|-------------|---------------|
| Apollo Org Enrichment | LinkedIn employees, industry, name | ⭐⭐⭐⭐⭐ | 1 credit |
| Apollo People Search | DM contacts (name, title, LinkedIn) | ⭐⭐⭐⭐ | FREE |
| Apollo Phone Reveals | DM phone + verified email | ⭐⭐⭐⭐ | 9 credits |
| Google Maps Places | Company phone, category, address | ⭐⭐⭐⭐ | FREE (10K/mo) |
| Website Scraping | Phones, emails, team names from /contact /about /team | ⭐⭐⭐ | FREE |
| Vibe Scoring | Website quality + tech signals (0-100) | ⭐⭐⭐⭐ | FREE |
| HubSpot Export | Existing domains for dedup | ⭐⭐⭐⭐⭐ | FREE |
| GitHub API | Org activity, repo count, recent commits | ⭐⭐⭐⭐ | FREE (5K/hr) |

## Known Issues

### BvD Data is Unreliable
- Employee counts: BvD reported 6 for Substack (actual LinkedIn: 3,100)
- Domain mismatches: tiny legal entities mapped to parent company domains (e.g., `apptio.com` listed under a 5-person subsidiary, Apptio has 1,400 employees)
- 27% of companies had LinkedIn counts 10x+ higher than BvD
- Revenue data similarly suspect for US startups

### Orange Slice Credits
- Depleted as of 2026-04-02. Use Google Maps Places API (free) as replacement.
- If credits replenish, `services.googleMaps.scrape()` gives phone + address at 10 credits/result.

### Apollo Phone Reveal Latency
- Phone reveals are async (webhook-based)
- Some arrive in seconds, others take 10+ minutes
- Keep webhook server running for at least 15 min after last submission
- ~70% success rate on reveals (465 of 708 in our data)
