# Overnight ICP Sourcing Run — April 3-4, 2026

## Goal
Source 5,000+ Grade A ICP companies for Corgi Insurance's startup insurance package.
Grade A = ICP score 75+ on icp_score_v1.py

## Session Assignments

| Session | Role | Focus |
|---------|------|-------|
| 1 (Brock) | Master Orchestrator | HubSpot dedup refresh, ICP rescore of 82K DB, monitoring, final report |
| 2 | Apollo Sourcer | Apollo People Search (FREE) for small US tech founders/CTOs → extract company domains → add to DB. ONLY session with Apollo credit access (1,000 max) |
| 3 | Web Scraper Sourcer | Scrape free directories: TinySeed, IndieHackers, Product Hunt, MicroConf, bootstrapped SaaS lists, accelerator portfolios |
| 4 | Maps + Directory Sourcer | Google Maps scraping (Orange Slice), Crunchbase, state registries, SIC-code-based sourcing |
| 5 | Verifier + QA | Website vibe scoring for new companies, LinkedIn employee checks, ICP scoring, quality spot-checks, final curated output |

## Shared Infrastructure

### Files
- **master.db**: `jordan.ai/pipeline/master.db` — single source of truth for all companies
- **HubSpot domains**: `jordan.ai/overnight/shared/hubspot_domains_current.json` — refreshed at start
- **Apollo credit counter**: `jordan.ai/overnight/shared/apollo_credits.json` — ONLY Session 2 writes, others read
- **New companies queue**: `jordan.ai/overnight/shared/new_companies_queue.jsonl` — Sessions 2/3/4 APPEND new companies here
- **Verification queue**: `jordan.ai/overnight/shared/verify_queue.jsonl` — Session 5 reads from here
- **Status board**: `jordan.ai/overnight/STATUS.md` — all sessions update their progress

### Per-Session Directories
Each session writes logs and checkpoints to `jordan.ai/overnight/session_N/`:
- `progress.json` — current stats (companies found, scored, etc.)
- `log.md` — human-readable log of what happened
- `errors.json` — any failures

### Coordination Protocol
1. **New companies**: Sessions 2/3/4 discover companies → write to `new_companies_queue.jsonl` (one JSON object per line, append-only)
2. **Dedup before adding**: Always check domain against master.db AND hubspot_domains_current.json BEFORE adding
3. **DB writes**: Use WAL mode on SQLite. Keep transactions short. Retry on SQLITE_BUSY.
4. **Apollo credits**: Session 2 ONLY. Reads/writes `apollo_credits.json` which has `{"used": N, "limit": 1000}`. Abort if used >= 1000.
5. **Status updates**: Each session updates STATUS.md every 30 minutes via cron

## ICP Scoring Rules (MEMORIZE)

### Hard DQs (instant disqualify)
- Non-US
- No tech/software angle
- Dead/parked/coming-soon website
- Pure biotech/hardware with no software
- Revenue >$20M or Employees >50
- YC companies
- Already in HubSpot
- Government entities / gov tech contractors
- Solo founder with $0 revenue

### Scoring Model: `jordan.ai/pipeline/icp_score_v1.py`
- Tech Fit (0-40): SaaS/software = 40, tech services = 25, tech-forward = 20
- Size Fit (0-30): ≤5 emp = 15, ≤15 emp = 13, ≤$1M rev = 15
- Verifiability (0-15): Live website + product + contact info
- Modifiers (-15 to +15): Accelerator, funded, hiring = bonus; nonprofit = -15

### Grade Thresholds
- A: 75+ (TARGET)
- B: 50-74
- C: 25-49
- D: <25

### Sweet Spot Profile
- US-incorporated SaaS/software company
- 1-15 employees
- $0-$5M revenue
- Has engineers on staff
- Real product with live website
- Bootstrapped or seed-funded (not YC)

## Apollo Budget
- **HARD LIMIT: 1,000 credits**
- People Search = FREE (unlimited)
- People Enrichment = 1 credit each
- Org Enrichment = 1 credit each
- Phone Reveal = 8 credits each (DO NOT USE TONIGHT)
- Credit counter file MUST be updated after every API call
- If counter reaches 950, STOP and switch to free-only mode

## Google Maps (Orange Slice)
- `services.googleMaps.scrape()` = 10 credits per result
- Budget: be reasonable, ~500-1000 results max
- Search queries: "software company [city]", "SaaS startup [city]", "tech startup [city]"
- Focus on tech hubs: SF, NYC, Austin, Denver, Seattle, Boston, Miami, LA, Chicago, Atlanta, Raleigh, Portland, Salt Lake City, Phoenix, Nashville

## Output
When everything is done, Session 1 (Brock) will:
1. Merge all new companies into master.db
2. Run ICP v1 scoring on everything
3. Dedup against HubSpot
4. Export top 5,000+ Grade A companies to `jordan.ai/overnight/FINAL_OUTPUT.xlsx`
5. Generate `jordan.ai/overnight/FINAL_REPORT.md` with stats
6. Notify Josh via Telegram
