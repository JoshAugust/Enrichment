---
name: lead-enrichment-pipeline
description: End-to-end lead generation pipeline for Jordan.ai/Corgi Insurance. Converts raw company names+domains into qualified, enriched B2B leads with phones, emails, and decision-maker contacts. Covers discovery, verification, scoring, DQ filtering, HubSpot dedup, and multi-source enrichment. Use when running any stage of the pipeline, processing new lead batches, debugging enrichment issues, or onboarding new data sources. Triggers on: lead pipeline, enrich companies, qualify leads, vibe score, blueprint score, DQ filter, HubSpot dedup, Apollo enrichment, phone enrichment, lead generation, new batch, pipeline run.
---

# Lead Enrichment Pipeline

## ICP (Ideal Customer Profile)

- Small US software companies
- ≤100 employees (LinkedIn-verified)
- ≤$20M revenue (loose signal only — BvD revenue data unreliable)
- Real software/tech product (confirmed via website vibe scoring)
- NOT YC-backed (handled in separate pipeline)
- NOT already in HubSpot

## Pipeline Stages (in order)

**Principle: fastest/cheapest filters first, slowest/most expensive last.**

### FREE STAGES (1-9)

**Stage 1: Domain Dedup** _(~2 min)_
- Normalize: lowercase, strip www., strip trailing slashes
- Remove exact duplicates across all sources
- ~25% cut

**Stage 2: DNS Check** _(~15 min at 100 concurrent)_
- DNS A-record lookup on every domain
- No A record = dead domain → remove
- 10x faster than HTTP; catches dead domains without loading a page
- ~7% cut

**Stage 3: HubSpot Dedup** _(~5 min)_
- Pull all HubSpot company domains via API (currently ~81K)
- Exact domain match + fuzzy name match (normalized, stripped)
- Fuzzy domain match: strip TLD, compare stems (e.g. `app.io` vs `app.com`)
- Remove any match → prevents duplicate outreach
- ~15% cut

**Stage 4: Domain Resolution + Acquisition Check** _(~2 hrs at 20 concurrent)_
- HTTP HEAD with redirect follow
- If final domain ≠ original domain → acquired/merged → remove
- Flag: parked domains (GoDaddy/Sedo/HugeDomains keywords), error pages
- ~8% cut

**Stage 5: Quick Tech Signal Check** _(~30 min)_
- Lightweight, NOT a full page scrape. Check:
  - TLD signal: `.io`, `.ai`, `.dev`, `.app`, `.tech` = tech company likely
  - HTTP headers: `X-Powered-By`, `Server` → reveals stack
  - `robots.txt` / `sitemap.xml` presence → real site vs placeholder
  - Meta tags only: `<meta name="description">`, `og:title` (1 small request)
- DQ clearly non-tech (law firms, restaurants, construction, etc.)
- ~15% cut

**Stage 6: Google Maps Lookup** _(free, 10K/month limit)_
- Returns: company phone, business category, address, place name
- Category is a **free qualifying signal** — "Software company" vs "Plumbing"
- DQ non-tech categories that slipped through Stage 5
- Enriches company phone for all matches (~70% hit rate)

**Stage 7: Full Vibe Score** _(~4 hrs at 20 concurrent)_
- Full homepage scrape + scoring (see `references/scoring.md`)
- Only runs on companies that survived Stages 1-6
- DQ vibe=0 (no tech signal at all)
- ~20% cut

**Stage 8: Website Contact Scraping** _(~3 hrs)_
- Scrape `/contact`, `/about`, `/team` pages
- Parse: `tel:` links, `mailto:` links, schema.org ContactPoint
- Extract team member names from /team pages
- Fills phone/email gaps that Google Maps missed

**Stage 9: Blueprint Score + Grade** _(instant)_
- Score using verified data only — see `references/scoring.md`
- **Inputs**: vibe score, domain signals, GMaps category, website contact signals, GitHub activity
- **NO BvD employee/revenue data in scoring**
- Grade: A ≥75, B ≥50, C ≥25, D <25
- Keep A + B only

### PAID STAGES (10-14)

**Stage 10: Apollo Org Enrichment** _(1 credit/company)_
- `GET /api/v1/organizations/enrich?domain={domain}`
- Returns: LinkedIn employee count, industry, founded year
- DQ >100 employees (the ONLY reliable employee filter)
- Rate limit: 50 req/min, 1.2s delay between calls
- Checkpoint every 200 companies

**Stage 11: Re-score + Final Grade** _(instant)_
- Incorporate LinkedIn employee count into Blueprint Score
- Re-grade. Final A/B cut.

**Stage 12: Apollo People Search** _(free on current plan)_
- `POST /api/v1/mixed_people/api_search`
- Target titles: CEO, CTO, Founder, Co-founder, President, VP, Director, Owner, Managing Director, COO, CFO, Head of
- 1 contact per company max

**Stage 13: Email Verification** _(free flag, no DQ)_
- Verify found emails before spending on phone reveals
- Flag `email_verified: true/false`
- Don't remove leads — just prioritize verified for phone reveals

**Stage 14: Apollo Phone Reveals** _(9 credits each: 1 match + 8 reveal)_
- `POST /api/v1/people/match` with `reveal_phone_number: true`
- Async: requires webhook server + Cloudflare tunnel
- Only for companies WITH a verified contact match
- ~70% reveal success rate

**Stage 15: Final Clean + Export** _(instant)_
- Strip generic emails (info@, sales@, support@, contact@, hello@, admin@, etc.)
- Any email appearing 3+ times across dataset = generic → clear
- Format incorporation dates (Mon YYYY or just YYYY)
- Remove garbage columns (UUIDs in tech stack, empty GitHub/Twitter)
- Sort by Blueprint Score desc
- Export XLSX + CSV

## DQ Rules (Disqualification)

| Rule | Source | Stage |
|------|--------|-------|
| Dead domain (no DNS) | DNS lookup | 2 |
| Already in HubSpot | HubSpot API | 3 |
| Acquired/redirected | HTTP redirect | 4 |
| Parked domain | HTTP response | 4 |
| Zero tech signal | Quick check | 5 |
| Non-tech GMaps category | Google Maps | 6 |
| Vibe score = 0 | Full vibe | 7 |
| Grade C/D | Blueprint score | 9 |
| >100 LinkedIn employees | Apollo org | 10 |
| Grade C/D after re-score | Blueprint v2 | 11 |

## Critical Rules

- **BvD is discovery-only.** Take company name + domain. Trust NOTHING else (employees, revenue, SIC codes are unreliable). BvD maps tiny legal entities to parent company domains.
- **Apollo org enrichment is the ONLY reliable employee source.** LinkedIn employee counts from Apollo ≠ BvD counts. We've seen 10x-100x discrepancies.
- **Free stages before paid.** Never call Apollo on a company that would be DQ'd by a free filter.
- **Checkpoint everything.** Long-running enrichment jobs must checkpoint every 100-200 companies. Resume from checkpoint on restart.
- **Rate limits:** Apollo 50 req/min (1.2s delay). Google Maps 10K/month. HubSpot 100 req/10s.
- **Generic emails are not DM emails.** info@, sales@, support@ are useless for outreach. Clear them.

## Tools & Config

See `references/tools.md` for API endpoints, config file locations, rate limits, and credit costs.

## Scoring System

See `references/scoring.md` for vibe score signals, Blueprint Score v3 breakdown, and grade thresholds.

## Data Sources

See `references/sources.md` for all discovery and enrichment sources with reliability ratings.
