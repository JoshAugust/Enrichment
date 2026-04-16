# Jordan.ai Enrichment Pipeline

> **Last updated:** 2026-04-01
> **Location:** `jordan.ai/sources/`
> **Orchestrator:** `sources/enrichment-pipeline.js`

---

## Overview

The enrichment pipeline takes raw company leads and progressively enriches them through **17 data sources**, running free/qualification sources first to gate expensive paid lookups. Every result is logged to an audit trail (`enrichment_log` table) and merged non-destructively — existing data is never overwritten unless the new data is explicitly better.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Raw Lead    │ ──► │  Free Gates  │ ──► │  Qualification   │ ──► │  Paid Enrichment     │
│  (name, url) │     │  (GMaps,     │     │  (DQ + Score +   │     │  (Apollo, Hunter,    │
│              │     │   Vibe, HS)  │     │   Grade)         │     │   LinkedIn, etc.)    │
└──────────────┘     └──────────────┘     └──────────────────┘     └─────────────────────┘
```

---

## Pipeline Execution Order

Sources run in this **strict order** — free checks gate paid spend:

| #  | Source                | Cost     | What It Does                                                | Output                                                    |
|----|----------------------|----------|-------------------------------------------------------------|-----------------------------------------------------------|
| 1  | **google-maps**       | Free*    | Google Maps Places API — phone numbers, HQ address          | `phones[]`, `headquarters`                                |
| 2  | **website-vibe-scorer** | Free   | Scores 0–100 on how "vibe-coded" the website is             | `vibe_score`, `vibe_signals[]`                            |
| 3  | **hubspot-dedup**     | Free     | Fuzzy name + domain search against live HubSpot CRM         | `hubspot_duplicate`, `hubspot_match_id`, `hubspot_match_name` |
| 4  | **qualification-engine** | Free  | Hard DQ filters + ICP scoring → grade A/B/C/DQ             | `dq`, `dq_reason`, `qualification_score`, `qualification_grade`, `qualification_signals[]` |
| 5  | web-search            | Free     | DuckDuckGo Lite — news, exec names, funding snippets        | `recent_news`, exec names, LinkedIn hints                 |
| 6  | company-website       | Free     | Deep scrape — about, team, careers, contact, footer         | `description`, `founded_year`, social URLs, `phones[]`, hiring signals |
| 7  | linkedin-enrichment   | Varies   | LinkedIn company/person data via Orange Slice               | `employee_count`, `linkedin_url`, company data            |
| 8  | funding-research      | Free     | Web search + SEC EDGAR for funding rounds                   | `total_raised`, `last_funding_round`, `investors`         |
| 9  | social-signals        | Free     | Twitter/GitHub/social presence detection                    | `twitter_url`, `github_url`                               |
| 10 | email-discovery       | Free     | Pattern detection from known contacts → generate emails     | Generated emails applied to contacts                      |
| 11 | news-monitor          | Free     | Recent news aggregation                                     | `recent_news`                                             |
| 12 | sec-edgar             | Free     | SEC full-text search for public filings                     | `sec_ticker`, `sec_cik`                                   |
| 13 | job-postings          | Free     | Job listing signals (hiring velocity, tech stack)           | `hiring_signals`, `open_roles_count`, `key_hires`         |
| 14 | nvidia-partners       | Free     | NVIDIA partner/ecosystem detection                          | `nvidia_partnership`                                      |
| 15 | hunter                | Freemium | Hunter.io domain search — finds emails at domain            | New contacts inserted with emails                         |
| 16 | apollo                | Freemium | People search (free) + org enrichment (1 credit)            | Decision-maker contacts, firmographic data                |
| 17 | rocketreach           | Paid     | Contact lookup fallback                                     | Emails, phones                                            |

_*Google Maps: 10K free requests/month, then $0.032/request_

---

## Stage 1: Free Gate Sources (Sources 1–4)

These four run **before any credit is spent**. If a company fails qualification, the pipeline short-circuits.

### 1. Google Maps (`google-maps.js`)

**Purpose:** Get a phone number and verify HQ address.

- Uses Google Maps Places Text Search → Place Details
- Searches `"{company name} {industry} company"` for accuracy
- Skips if company already has a phone number
- Phones are normalized to E.164 format and propagated to phoneless contacts

**Config:** `.config/google-maps/config.json` → `{ "api_key": "..." }`

### 2. Website Vibe Scorer (`website-vibe-scorer.js`)

**Purpose:** Detect if a company website looks "vibe-coded" (small/scrappy startup energy).

8 signals, each independently scored:

| Points | Signal                     | Detection Method                                         |
|--------|---------------------------|----------------------------------------------------------|
| +25    | Website builder detected   | HTML patterns for Webflow, Framer, Squarespace, Wix, Carrd |
| +10    | `.io` or `.ai` domain     | TLD regex                                                |
| +10    | Small/no sitemap           | `<loc>` count in `/sitemap.xml` — fewer than 10 pages   |
| +10    | No pricing page            | No `/pricing` or `/plans` link; demo-only CTAs           |
| +15    | Vague hero text            | Claude Haiku API classification, heuristic fallback      |
| +10    | Few blog posts             | Sitemap + HTML link count — fewer than 5                 |
| +10    | No careers / few jobs      | No `/careers` link or fewer than 3 job entries           |
| +10    | Few customer logos         | `<img>` count in "Trusted by" sections — fewer than 5   |

**Score range:** 0–100. Higher = more vibe-coded = better ICP fit.

### 3. HubSpot Dedup (`hubspot-dedup.js`)

**Purpose:** Prevent enriching companies that already exist in HubSpot CRM.

- Searches by company name (`CONTAINS_TOKEN` on first word)
- Searches by domain (`EQ` exact match)
- Fuzzy name normalization strips `Inc/LLC/Corp/Ltd/Limited/GmbH/etc.`, lowercases, removes punctuation
- Returns `hubspot_duplicate: true/false` with match ID and name

**Config:** `.config/hubspot/config.json` → `{ "access_token": "pat-na2-..." }`

### 4. Qualification Engine (`qualification-engine.js`)

**Purpose:** Hard disqualify bad-fit companies and grade the rest.

#### Hard DQs (instant reject)
| # | Rule                   | Logic                                                   |
|---|------------------------|---------------------------------------------------------|
| 1 | Non-US HQ              | Address parsing — US state abbreviations, country names |
| 2 | YC-backed              | Regex on investors field for "Y Combinator" / "YC"     |
| 3 | Already acquired       | Regex on description/news for acquisition language      |
| 4 | 200+ employees         | Parses ranges ("50-100"), approximations ("~50"), etc.  |

#### Scoring (if not DQ'd)
| Points | Signal              | Condition                              |
|--------|--------------------|-----------------------------------------|
| +15    | Tiny team           | 1–20 employees                         |
| 0      | Small team          | 21–50 employees (neutral)              |
| -10    | Medium team         | 51–200 employees                       |
| +20    | Software product    | SaaS/platform/API/app/cloud keywords   |
| +5     | .io/.ai domain      | TLD check                              |
| +20    | High vibe score     | Vibe score > 60                        |
| +10    | Mid vibe score      | Vibe score 30–60                       |
| +10    | Recent funding      | Has `total_raised` or `last_funding_round` |

#### Grades
| Grade | Threshold |
|-------|-----------|
| **A** | Score ≥ 40 |
| **B** | Score ≥ 20 |
| **C** | Score ≥ 0  |
| **DQ** | Hard DQ triggered |

---

## Stage 2: Web Intelligence (Sources 5–14)

Mostly free, public-data sources that build a rich company profile.

### 5. Web Search (`web-search.js`)
DuckDuckGo Lite scraping — finds news, exec names, funding mentions, LinkedIn hints. No API key needed. Rate-limited internally.

### 6. Company Website (`company-website.js`)
Deep multi-page scraper — crawls `/about`, `/team`, `/careers`, `/contact`, `/blog` pages. Extracts founding year, descriptions, leadership names, hiring signals, phone numbers, social links from footer.

### 7. LinkedIn Enrichment (`linkedin-enrichment.js`)
Orange Slice SDK wrapper for LinkedIn company/person data. Returns employee counts, company descriptions, LinkedIn URLs.

### 8. Funding Research (`funding-research.js`)
Combines DuckDuckGo search + SEC EDGAR full-text for funding rounds, investor names, dollar amounts. Parses `$X million/billion` from snippets.

### 9. Social Signals (`social-signals.js`)
Detects Twitter/X and GitHub presence from web search results and company websites.

### 10. Email Discovery (`email-discovery.js`)
Pattern detection engine — analyzes known contact emails to infer the company's email pattern (e.g., `first.last@`, `flast@`), then generates probable emails for contacts without one. 8 pattern types ranked by B2B frequency.

### 11. News Monitor (`news-monitor.js`)
Aggregates recent news about the company. Stored as `recent_news` on the company record.

### 12. SEC EDGAR (`sec-edgar.js`)
Full-text search of SEC filings for public company detection. Returns ticker symbol and CIK number.

### 13. Job Postings (`job-postings.js`)
Detects hiring velocity and open roles. Returns `hiring_signals`, `open_roles_count`, and notable `key_hires`.

### 14. NVIDIA Partners (`nvidia-partners.js`)
Checks if the company is in the NVIDIA partner/accelerator ecosystem. Sets `nvidia_partnership` field.

---

## Stage 3: Paid Enrichment (Sources 15–17)

Credit-consuming sources — only run on companies that survived qualification.

### 15. Hunter.io (`hunter.js`)
Domain search finds email addresses at the company. Free tier: 25 searches/month. Discovered contacts are inserted/deduplicated into the contacts table. Minimum 50% confidence threshold.

### 16. Apollo.io (`apollo.js`)
Two-phase:
1. **People Search** (FREE, no credits) — finds decision-makers by title (CEO, CTO, CFO, VP Finance, Head of Infra, etc.)
2. **Org Enrichment** (1 credit) — firmographic data (employees, industry, revenue, HQ)

Discovered contacts get inserted with LinkedIn URLs. Emails require separate enrichment calls at 1 credit each.

**Config:** `.config/apollo/config.json` → `{ "api_key": "..." }`

### 17. RocketReach (`rocketreach.js`)
Fallback contact lookup. Used when Apollo and Hunter don't return results.

---

## Data Flow

### Merge Strategy
- **Non-destructive:** Existing non-null DB values are never overwritten
- **First-write wins:** For a given field, the first source to return data gets persisted
- **Verified > unverified:** Verified data sources take priority
- **Arrays serialize to JSON:** Array fields (investors, signals) stored as JSON strings

### Phone Propagation
When a company phone is discovered:
1. Normalized to E.164 format (`+1XXXXXXXXXX`)
2. Stored on the company record
3. Propagated to all contacts at that company who lack a phone number

### Contact Discovery
Hunter and Apollo can **discover new contacts** (not just enrich existing ones):
- Deduplicated by email (exact match) and name (case-insensitive)
- New contacts inserted with available fields (name, title, email, LinkedIn, phone)
- Existing contacts updated only where fields are currently empty

### Email Pattern Detection
Email discovery analyzes known contacts to detect patterns:
```
first.last@domain.com  →  pattern: "first.last"
jsmith@domain.com      →  pattern: "flast"
```
Then generates probable emails for all contacts at that company without email addresses.

---

## Database Schema

### Companies Table (enrichment columns)
| Column                  | Type     | Source(s)                          |
|------------------------|----------|------------------------------------|
| `phone`                 | TEXT     | google-maps, company-website       |
| `headquarters`          | TEXT     | google-maps, company-website       |
| `founded_year`          | INTEGER  | company-website, web-search        |
| `employee_count`        | TEXT     | apollo, linkedin-enrichment        |
| `total_raised`          | TEXT     | funding-research                   |
| `last_funding_round`    | TEXT     | funding-research                   |
| `investors`             | TEXT     | funding-research                   |
| `linkedin_url`          | TEXT     | linkedin-enrichment, web-search    |
| `twitter_url`           | TEXT     | social-signals, company-website    |
| `github_url`            | TEXT     | social-signals, company-website    |
| `recent_news`           | TEXT     | web-search, news-monitor           |
| `hiring_signals`        | TEXT     | job-postings, company-website      |
| `sec_ticker`            | TEXT     | sec-edgar                          |
| `sec_cik`               | TEXT     | sec-edgar                          |
| `gpu_asset_value`       | TEXT     | funding-research                   |
| `depreciation_schedule` | TEXT     | funding-research                   |
| `open_roles_count`      | INTEGER  | job-postings                       |
| `key_hires`             | TEXT     | job-postings                       |
| `nvidia_partnership`    | TEXT     | nvidia-partners                    |
| `last_enriched_at`      | DATETIME | (auto-set on any enrichment)       |
| `call_notes`            | TEXT     | (manual / post-call)               |

### Contacts Table (enrichment columns)
| Column              | Type   | Source(s)                        |
|--------------------|--------|----------------------------------|
| `email`             | TEXT   | hunter, apollo, email-discovery  |
| `phone`             | TEXT   | apollo, google-maps propagation  |
| `linkedin_url`      | TEXT   | apollo, linkedin-enrichment      |
| `twitter_url`       | TEXT   | social-signals                   |
| `github_url`        | TEXT   | social-signals                   |
| `bio`               | TEXT   | linkedin-enrichment              |
| `tenure`            | TEXT   | linkedin-enrichment              |
| `email_pattern`     | TEXT   | email-discovery                  |
| `email_confidence`  | REAL   | hunter (0–1), email-discovery    |
| `last_enriched_at`  | DATETIME | (auto-set)                     |

### Enrichment Log Table
| Column        | Type     | Description                        |
|--------------|----------|------------------------------------|
| `id`          | TEXT PK  | UUID                               |
| `entity_type` | TEXT    | "company" or "contact"             |
| `entity_id`   | TEXT    | ID of the enriched entity          |
| `source`      | TEXT    | Source module name                  |
| `data_found`  | TEXT    | JSON blob of all returned data     |
| `created_at`  | DATETIME | When the enrichment ran            |

---

## Configuration

All API keys stored under `jordan.ai/.config/`:

```
.config/
├── apollo/config.json          # { "api_key": "..." }
├── google-maps/config.json     # { "api_key": "..." }
├── hubspot/config.json         # { "access_token": "pat-na2-..." }
└── orangeslice/config.json     # { "api_key": "..." }
```

Environment variables also accepted:
- `APOLLO_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `HUBSPOT_TOKEN`
- `HUNTER_API_KEY`
- `ANTHROPIC_API_KEY` (for vibe scorer Claude classification)

---

## Usage

### Enrich a single company
```js
const pipeline = require('./sources/enrichment-pipeline');
await pipeline.enrichCompany(companyId);
```

### Enrich a single contact
```js
await pipeline.enrichContact(contactId);
```

### Batch enrich all companies
```js
await pipeline.enrichAll({
  priority: 'A',           // optional: filter by grade
  limit: 50,               // optional: max to process
  includeContacts: true,    // optional: also enrich contacts
});
```

### Check pipeline health
```js
const status = pipeline.getPipelineStatus();
// { availableSources: [...], sourceStats: {...}, companiesEnriched: N, ... }
```

### Run from CLI
```bash
node jordan.ai/scripts/run_enrichment.js
```

---

## Rate Limiting & Cost Control

| Source        | Free Tier                  | Cost Beyond Free           |
|--------------|----------------------------|---------------------------|
| Google Maps   | 10K requests/month         | $0.032/request             |
| Hunter.io     | 25 searches/month          | $49/mo for 500             |
| Apollo.io     | People Search = FREE       | Org enrich: 1 credit       |
|               | 10K credits/month (paid)   | Email enrich: 1 credit     |
| Orange Slice  | Per-credit                 | ~10 credits/Google Maps result |
| DuckDuckGo    | Unlimited (scraping)       | Free                       |
| SEC EDGAR     | Unlimited                  | Free                       |

Internal rate limiter (`rate-limiter.js`) prevents burst requests across all sources.

---

## HubSpot Sync

After enrichment, push to HubSpot via:
- `sources/hubspot-sync-v2.mjs` — full property mapping, enum conversion, checkpoint/resume
- Maps qualification grades → HubSpot custom properties
- Filters out generic emails (info@, contact@, etc.)
- 51 created, 18 updated on first push (69 GPU operators)

---

## Architecture Notes

1. **CJS + ESM hybrid** — Most sources are CJS (`require`). New modules (vibe scorer, qualification engine, hubspot dedup) are ESM (`export`). Pipeline uses `require()` for CJS and dynamic `import()` for ESM.

2. **Source contract** — Every source exports `enrich(entityType, entityId, existingData)` returning:
   ```js
   {
     success: boolean,
     data: { ...fields },      // DB-updatable fields
     contacts?: [...],          // Discovered contacts (Hunter/Apollo)
     skipped?: boolean,
     error?: string,
     source: string,
   }
   ```

3. **Idempotent migrations** — `enrichment-pipeline.js` runs `ALTER TABLE` wrapped in try/catch on module load. Safe to call repeatedly.

4. **2-second pause** between companies in batch mode to respect rate limits.
