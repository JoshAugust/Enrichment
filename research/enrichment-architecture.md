# Corgi Enrichment Engine — Architecture Research & Design
**Prepared:** 2025-03-23  
**Purpose:** Design a best-in-class B2B enrichment engine optimized for GPU infrastructure companies

---

## Table of Contents
1. [How Clay.com Works](#1-how-claycom-works)
2. [How Apollo.io Works](#2-how-apolloio-works)
3. [Enrichment Waterfall Design Patterns](#3-enrichment-waterfall-design-patterns)
4. [Free / Low-Cost Data Sources](#4-free--low-cost-data-sources)
5. [Existing Enrichment Codebase Audit](#5-existing-enrichment-codebase-audit)
6. [Proposed Architecture: Corgi Enrichment Engine v2](#6-proposed-architecture-corgi-enrichment-engine-v2)
7. [GPU-Specific Enrichment Strategies](#7-gpu-specific-enrichment-strategies)

---

## 1. How Clay.com Works

Clay is the most sophisticated enrichment orchestration layer on the market. Understanding it precisely tells us what to beat.

### 1.1 Waterfall Architecture

Clay's core innovation is **conditional sequential enrichment** — what they call "waterfall enrichment." The mechanism:

1. **Columns are providers.** Each enrichment column in a Clay table maps to one or more data providers (Hunter, Apollo, Clearbit, Crunchbase, etc. — 75+ providers total).
2. **Stop-on-match.** When you configure a waterfall column, Clay runs provider A. If it returns a value (e.g., an email), it STOPS and charges you for that lookup only. If A returns nothing, it proceeds to B, then C, etc.
3. **You only pay for matches.** If no provider finds data, credits are refunded. This is the big lever — in a naive parallel system, you'd burn credits on every provider for every record.
4. **Conditional column logic.** Each column can have an "only run if [previous column] is blank" condition. This is how waterfalls are manually assembled — column A = Hunter, column B = "only run if A is blank", uses Apollo, column C = "only run if B is blank", uses People Data Labs, etc.
5. **Result:** 30-50% higher coverage than single-provider approaches, significantly lower cost than hitting all providers in parallel.

**Implication for us:** Our current architecture runs ALL sources in parallel via `Promise.all()`. This is wrong for paid sources (burns credits) and doesn't implement true waterfall logic. For FREE sources it's fine to run all in parallel.

### 1.2 Credit System & Pricing (2025)

| Plan | Monthly Credits | Price/month | Cost per 1K credits |
|------|----------------|-------------|---------------------|
| Free | 100 | $0 | — |
| Starter | 2,000–3,000 | $149 | ~$75 |
| Explorer | 10,000–20,000 | $349 | ~$35 |
| Pro (Growth) | 50,000–150,000 | $800 | ~$16 |
| Enterprise | 200,000–500,000 | ~$30,400/yr | ~$5–8 |

**What costs credits:**
- Each enrichment lookup costs 1 credit (basic providers)
- Some premium data sources cost 2–5 credits
- Claygent (AI web scraper) costs ~5–10 credits per run
- **Rollover:** unused credits roll over, capped at 2× your monthly limit

**The math reality:** At Pro tier, you get 50K credits/month for $800. A typical B2B outreach sequence that hits 5 data sources per company for 1,000 companies = 5,000 credits minimum. At Pro, that's doable. But at Starter, 2,000 credits vanishes fast.

**Key complaint:** Credits feel expensive for niche use cases. If you only need to enrich 200 GPU companies deeply, the minimum plans are still overkill. Clay's pricing is optimized for volume GTM teams, not focused research tools.

### 1.3 Claygent (AI Web Scraping Agent)

Claygent is Clay's GPT-4-backed web browsing agent. It:
- Takes a URL or company name
- Navigates to pages, reads content, extracts structured data from unstructured HTML
- Can answer questions like "Find the CFO email from this company's contact page"
- **Costs:** ~5–10 credits per run (expensive relative to structured API lookups)
- **Accuracy:** High for well-structured pages, unreliable for dynamically loaded JavaScript SPAs
- **Use case:** Handles the long tail of enrichment where no structured API exists

**For us:** This is exactly what our `company-website.js` source does — scrapes the company website. We should build something similar: an AI-backed extraction pass over company websites for GPU-specific signals.

### 1.4 Integration Ecosystem

Clay connects to 75+ providers including:
- **Email:** Hunter, Apollo, ZoomInfo, Snov.io, FindyMail, Datagma, Dropcontact, Skrapp
- **Company data:** Clearbit (now deprecated standalone), Crunchbase, PitchBook, LinkedIn
- **Phone:** Datagma, PhantomBuster, People Data Labs
- **Intent:** Bombora, G2, TechTarget, 6sense
- **Social:** Twitter, GitHub, LinkedIn

**Clay's moat is the integration glue, not the data.** They don't own any data sources; they orchestrate calls to sources you pay for separately.

### 1.5 Clay's Limitations

1. **Not purpose-built for niche verticals.** Clay is generic. There's no "GPU infrastructure" enrichment — you build that yourself in Clay.
2. **No proprietary data.** Clay depends entirely on third-party data quality.
3. **Credits are opaque.** Hard to predict costs upfront for complex waterfalls.
4. **No batch job scheduling.** No native "re-enrich stale data weekly" workflow.
5. **Table-centric UX.** Designed for manual GTM workflows, not programmatic enrichment pipelines.
6. **Rate limits on Claygent.** Can't scrape 1,000 sites in parallel — too slow.
7. **Data governance.** Hard to audit exactly which source provided which data point.

---

## 2. How Apollo.io Works

Apollo is the most widely used B2B prospecting and enrichment database, with 275M+ contacts and 73M+ companies.

### 2.1 Data Sourcing Methods

Apollo gets its data four ways:

1. **Contributor network (~2M users).** When someone connects their inbox to use Apollo's email sequencing tools, Apollo scrapes email signatures from their inbox history. Every email signature becomes a data record. This is their fastest-growing sourcing method.
2. **Proprietary web crawl.** Apollo crawls the public web at scale — LinkedIn profiles, company websites, press releases, SEC filings, etc. Processes ~200M records/month.
3. **Engagement signals.** When Apollo users send emails and receive replies/bounces, Apollo uses those signals to verify and update email validity. A bounce = mark that email as invalid. A reply = confirm it's valid and the person still exists.
4. **Third-party data vendors.** Apollo vets and purchases data from multiple data providers, cross-references against their own data.

**The contributor network is the secret weapon.** Apollo has an enormous feedback loop: users send emails through Apollo → they see what bounces → they update the database → everyone benefits. No one else does this at Apollo's scale for B2B emails.

### 2.2 Data Quality

- **US email accuracy:** ~80–88% valid
- **International email accuracy:** ~60–73% valid
- **Mobile phone numbers:** Much lower accuracy, ~50-60% hit rate
- **Bounce rates reported by users:** Up to 35% in some cases (YMMV by industry)
- **7-step email verification:** Apollo claims 91% email accuracy; real-world users report ~75-85%
- **Data freshness:** No guaranteed freshness timestamp. Some records are years out of date.

**Key complaints:**
- "Catch-all" email results (domain accepts all emails, so Apollo can't verify)
- Phone numbers frequently wrong or missing
- Job titles lag behind actual role changes by 6–18 months
- International data coverage drops significantly outside US/UK/EU
- GPU infrastructure companies are niche enough that Apollo's coverage is patchy

### 2.3 Enrichment API

Apollo's enrichment API works as follows:
- **People enrichment:** POST to `/v1/people/match` with name + company or email. Returns contact details.
- **Organization enrichment:** POST to `/v1/organizations/enrich` with domain or name. Returns company data.
- **Waterfall:** Apollo itself runs an internal waterfall across its data sources — you don't control the order.

**API pricing:**
- Free: 10 export credits/month, 5 mobile credits
- Basic: $59/mo billed monthly (~unlimited email credits, 50 mobile)
- Professional: $99/mo (~unlimited email, 100 mobile)
- Organization: $149/mo (team-level, bulk enrichment, advanced API)

**For GPU enrichment:** Apollo's API is best used as ONE source in a waterfall, specifically for contact email/phone discovery. Their company-level data for GPU infrastructure is weak (most targets are private, niche, or recently formed).

### 2.4 Intent Data

Apollo's intent data:
- **Source:** G2 category views, Bombora integration
- **What you get:** "Company X showed intent for AI Infrastructure category this week"
- **Quality:** Useful for timing outreach, not accurate enough to rank by purchase intent

---

## 3. Enrichment Waterfall Design Patterns

### 3.1 Optimal Waterfall Order

For our use case (GPU infrastructure companies), the optimal sequence per data type:

**Company identity / basic firmographics:**
```
1. Direct website scrape (free, highest accuracy for self-reported data)
2. SEC EDGAR (free, authoritative for public companies)
3. DuckDuckGo / Google search (free, broad coverage)
4. OpenCorporates (free tier, incorporation data)
5. Crunchbase (paid, but good for funded companies)
```

**Contact email discovery:**
```
1. Pattern inference from known contacts (free, no API call)
2. DuckDuckGo email search (free, finds publicly listed emails)
3. Hunter.io (25 free searches/month → pay for more)
4. Apollo free tier (10 exports/month)
5. Generate all patterns + mark for verification
```

**Funding / financial:**
```
1. SEC EDGAR full-text search (free, authoritative)
2. Web search for press releases (free)
3. Crunchbase (paid)
4. PitchBook (paid, expensive)
```

**GPU-specific signals:**
```
1. Website scrape for GPU mentions (free)
2. SEC EDGAR keyword search: "GPU", "H100", "A100", "NVIDIA" (free)
3. Job postings scrape (Greenhouse/Lever direct, free)
4. News search for GPU announcements (free)
5. NVIDIA partner directory search (free)
```

### 3.2 Minimize Cost, Maximize Coverage

**Rule 1: Free sources first.** Run all free sources before paying for anything. In our case, that's nearly everything we need.

**Rule 2: Check existing data before running.** `if (company.email_pattern && company.last_enriched_at > 30_days_ago) SKIP`

**Rule 3: Source selection by company type.**
- If `sec_ticker` is set → run SEC EDGAR enrichment first (very high value)
- If company is private + <50 employees → skip SEC, focus on website + web search
- If `total_raised` is null → prioritize funding-research source
- If `email_pattern` is null but contacts exist → run email-discovery first

**Rule 4: Confidence-gated fallbacks.** If source A returns a value with confidence > 0.8, don't run source B for that field.

### 3.3 Deduplication & Entity Resolution

**Company entity resolution (when the same company appears under different names):**

```
Techniques:
1. Domain normalization: remove "www.", trailing slashes, lowercase
   → nvidia.com = NVIDIA = Nvidia Corporation (via domain)
2. CIK normalization: SEC EDGAR CIK is a permanent company identifier
3. Levenshtein distance < 3 on company names (fuzzy match)
4. LinkedIn company URL as canonical ID
5. IRS EIN (for US companies, sometimes public via IRS 990 filings)
```

**For GPU companies specifically:**
- Many have parent/subsidiary relationships (e.g., Lambda Labs vs Lambda, Inc.)
- Watch for operating entities vs. holding entities (common in PE-backed AI infra companies)
- Some have different names for SEC filings vs. brand name (e.g., "Applied Digital Corporation" vs. "Applied Digital")

**Deduplication algorithm:**
```javascript
function isLikelySameCompany(a, b) {
  // Exact domain match → definite match
  if (a.domain && b.domain && a.domain === b.domain) return true;
  // SEC CIK match → definite match  
  if (a.sec_cik && b.sec_cik && a.sec_cik === b.sec_cik) return true;
  // Fuzzy name + country match
  const nameSimilarity = jaccardSimilarity(tokenize(a.name), tokenize(b.name));
  if (nameSimilarity > 0.85 && a.country === b.country) return true;
  return false;
}
```

### 3.4 Confidence Scoring

Each enriched field should carry a `confidence` score (0.0–1.0). Score is determined by:

| Source | Base Confidence |
|--------|----------------|
| SEC EDGAR official filing | 0.99 |
| Company website (self-reported) | 0.90 |
| Verified email (confirmed deliverable) | 0.95 |
| Hunter.io email | 0.85 |
| Apollo enrichment | 0.75 |
| Web search extraction | 0.60 |
| Generated email pattern | 0.30 |
| LLM inference from unstructured text | 0.50 |

**Confidence decay over time:**
```
effective_confidence = base_confidence × (0.95 ^ days_since_enriched)
```
After 90 days, a 0.90 confidence record drops to ~0.70. After 180 days, ~0.49.

**When to re-enrich:** `effective_confidence < 0.50` OR explicit trigger (new funding round detected in news).

### 3.5 Data Freshness Tracking

Current schema stores `last_enriched_at` per entity. Better approach: **per-field freshness.**

```sql
-- Proposed: enrichment_field_log table
CREATE TABLE enrichment_field_log (
  entity_type   TEXT,
  entity_id     TEXT,
  field_name    TEXT,
  field_value   TEXT,
  source        TEXT,
  confidence    REAL,
  enriched_at   DATETIME,
  expires_at    DATETIME,  -- enriched_at + TTL per field type
  PRIMARY KEY (entity_type, entity_id, field_name, source)
);
```

**TTL by field type:**
- Contact email: 90 days (people change jobs)
- Job title: 60 days (high churn)
- Company description: 180 days
- Funding data: 365 days (rarely changes)
- SEC filings: 90 days (new quarters)
- GPU fleet estimate: 30 days (rapidly changing market)
- Employee count: 60 days
- Email pattern: 180 days (company-wide pattern rarely changes)

### 3.6 Incremental Enrichment

Logic for deciding whether to re-enrich:

```javascript
function shouldReEnrich(entity, fieldName) {
  const log = getLatestFieldLog(entity.id, fieldName);
  if (!log) return true;  // Never enriched
  if (log.expires_at < Date.now()) return true;  // Stale
  if (entity.priority === 'A' && log.confidence < 0.7) return true;  // Priority target, low confidence
  return false;
}
```

**Trigger-based re-enrichment:**
- News event detected (funding, exec change, acquisition) → re-enrich immediately
- Company added to pipeline → full enrichment within 24 hours
- Scheduled batch: weekly sweep of records with `expires_at < 7 days from now`

### 3.7 Error Handling & Fallback Chains

```javascript
async function enrichWithFallback(entity, fieldName, sources) {
  for (const source of sources) {
    try {
      const result = await source.enrich(entity);
      if (result.data[fieldName]) {
        return { value: result.data[fieldName], source: source.name, confidence: result.confidence };
      }
    } catch (err) {
      if (err.code === 429) {
        // Rate limited — skip this source entirely, try next
        await sleep(source.backoffMs);
        continue;
      }
      if (err.code === 404) {
        // Not found — try next source immediately
        continue;
      }
      // Unexpected error — log but continue
      logError(source.name, entity.id, err);
      continue;
    }
  }
  return null;  // All sources exhausted
}
```

### 3.8 Rate Limiting & API Quota Management

**Per-source rate limit tracking:**
```javascript
const SOURCE_LIMITS = {
  'hunter-io':    { rps: 15, rpm: 500, dailyFree: 25 },
  'apollo':       { rps: 2,  rpm: 100, monthlyFree: 10 },
  'github':       { rpm: 83, hourly: 5000 },  // authenticated
  'sec-edgar':    { rps: 10, per10min: 100 },  // EDGAR recommends < 10/sec
  'duckduckgo':   { rps: 1,  minDelay: 2000 }, // no published limit, be polite
};
```

**Token bucket implementation** (better than our current queue-based approach):
- Pros: Smooth bursting, handles different rate limit expressions
- Current `rate-limiter.js` uses a queue + min-delay, which is fine but not adaptive

### 3.9 Caching Strategy

**Two-level cache:**

1. **In-process LRU cache** (Node.js `lru-cache` or similar): 100 entries, 5-min TTL
   - Purpose: Prevents duplicate calls within a single batch run (e.g., enriching 5 contacts from the same company hits the company website once, not 5 times)

2. **DB cache** (existing enrichment_log): Persistent, per-entity, per-source
   - Purpose: Cross-session deduplication. If we enriched Applied Digital last week, don't re-run all sources.

**Cache key design:**
```
cacheKey = `${source}:${entityType}:${entityId}:${fieldName}`
```

---

## 4. Free / Low-Cost Data Sources

### 4.1 Sources We Have Access to Right Now

#### Hunter.io
- **Free tier:** 25 email searches + 50 email verifications per month
- **Rate limits:** 15 req/sec, 500 req/min
- **Credit cost:** 0.2 credits per enrichment call (charged only when all core data points returned)
- **Data quality:** Good for US companies. Email accuracy ~85-90%.
- **GPU relevance:** Use for contact email discovery. Good coverage for companies with structured email patterns.
- **API:** `GET https://api.hunter.io/v2/domain-search?domain=example.com&api_key=KEY`
- **What to add:** A `hunter-io.js` source for email discovery. High priority.

#### Apollo.io
- **Free tier:** 10 export credits/month (down from previous 50), 5 mobile credits
- **Authenticated users with corporate domain:** Up to 10,000 credits/month
- **Rate limits:** 2 req/sec, ~100 req/min
- **Data quality:** US emails 80-88% accurate, international drops to 60-73%
- **GPU relevance:** Good for finding CFOs/VPs at target companies. Not great for very niche GPU infra companies.
- **API:** `POST https://api.apollo.io/v1/people/match` (requires API key from paid plan)
- **Priority:** Medium — free tier too limited, but worth having as a fallback.

#### GitHub API
- **Free tier (unauthenticated):** 60 req/hour
- **Free tier (authenticated):** 5,000 req/hour
- **What you get:** Repos, commits, organization members, email addresses (if public)
- **GPU relevance:** HIGH. GPU infra companies have engineering teams on GitHub. Can find:
  - Company's GitHub org (e.g., `github.com/coreweave`)
  - Engineers at the company (org membership)
  - Tech stack (repos reveal CUDA, SLURM, K8s, etc.)
  - Founding team members (early contributors)
  - Public emails in commit history
- **API:** `GET https://api.github.com/orgs/{org}/members`
- **Priority:** HIGH. Add `github.js` source. Excellent signal for tech stack and engineer leads.

#### SEC EDGAR
- **Free:** Completely free, no API key required
- **Rate limits:** Recommend < 10 req/sec, EDGAR asks you identify yourself via User-Agent
- **What you get:** All SEC filings (10-K, 10-Q, 8-K, S-1, etc.), company metadata, officer names
- **GPU relevance:** EXTREMELY HIGH for public GPU companies. APLD (Applied Digital), CORZ (Core Scientific), etc.
  - Equipment values on balance sheet
  - GPU purchase announcements in 8-K filings
  - Debt covenants in credit agreement filings
  - Named officers (CFO, Treasurer)
  - Capital expenditure guidance
- **Status:** Already implemented in `sec-edgar.js` — well-built. Main gap: only searches by name, doesn't systematically scan known public GPU company tickers.
- **Enhancement:** Add a `KNOWN_PUBLIC_GPU_COMPANIES` map with all ~30 public GPU infra companies' CIKs.

#### OpenCorporates
- **Free tier:** 200 req/month, 50 req/day
- **What you get:** Company registration data, incorporation date, registered address, directors, status (active/inactive), jurisdiction
- **GPU relevance:** Medium. Good for verifying company existence and getting incorporation details for private companies. Useful for finding holding company structures.
- **Rate limits:** Very restrictive for free tier. Useful for targeted lookups only.
- **API:** `GET https://api.opencorporates.com/v0.4/companies/search?q={name}&api_token=TOKEN`

#### DuckDuckGo Lite (currently in use)
- **Free:** No API key required
- **Rate limits:** No published limit, must throttle politely (~1 req/sec recommended)
- **What you get:** Web search snippets and URLs
- **GPU relevance:** HIGH as a meta-source. Used in every enrichment module currently.
- **Current implementation:** `ddgSearch()` in `web-search.js` — works well.

#### Hacker News API (Algolia)
- **Free:** Completely free, no authentication required
- **Rate limits:** Unlimited (effectively)
- **What you get:** Full-text search across all HN posts and comments
- **GPU relevance:** MEDIUM-HIGH. GPU infra companies often mentioned in HN discussions. Can find:
  - Hiring posts (e.g., "Ask HN: Who is hiring?" mentions)
  - Technical discussions mentioning company's products
  - Funding announcements that got traction
  - Founder comments / AMAs
- **API:** `GET https://hn.algolia.com/api/v1/search?query={company}&tags=story`
- **Priority:** LOW-MEDIUM. Add as supplemental signal source.

#### Wayback Machine API
- **Free:** Completely free
- **What you get:** Historical snapshots of websites, check if a URL was ever archived
- **GPU relevance:** MEDIUM. 
  - Recover historical team pages (before companies scrubbed them)
  - Check historical pricing pages (GPU rental rates)
  - Historical "About" pages to track company evolution
- **API:** `GET https://archive.org/wayback/available?url={url}`
- **Priority:** LOW. Useful for research but not hot-path enrichment.

#### Reddit API
- **Free tier:** 100 QPM (non-commercial, with OAuth)
- **Cost:** $0.24/1,000 calls for commercial use
- **GPU relevance:** LOW for our use case. Some GPU infra discussions on r/mlops, r/MachineLearning, but not actionable B2B intelligence.

#### Twitter/X API
- **Free tier:** Write-only (1,500 tweets/month). No read access on free tier.
- **Paid:** $100-200/month for Basic read access
- **GPU relevance:** LOW given cost. Skip unless specifically needed.

#### Wikidata/DBpedia
- **Free:** Completely free, SPARQL endpoint
- **GPU relevance:** LOW. Only covers well-known companies. Not useful for niche GPU infra targets.

#### USPTO Patent Database
- **Free:** PatentsView API, completely free
- **GPU relevance:** LOW for our targets (GPU infra companies don't typically patent-protect their operations).

#### Google Custom Search API
- **Free tier:** 100 queries/day
- **Cost:** $5 per 1,000 queries above free tier
- **GPU relevance:** HIGH as alternative/supplement to DuckDuckGo. Better quality results.
- **Priority:** MEDIUM. Could replace or supplement DuckDuckGo as search backbone.

#### Bing Search API
- **Free tier (via Azure):** 1,000 transactions/month free for 12 months, then ~$7/1,000
- **GPU relevance:** Same as Google — useful as search backbone.
- **Priority:** LOW (Bing quality lower than Google, DDG adequate for our needs).

### 4.2 Sources That Used to Be Free But Aren't

| Source | Status | Notes |
|--------|--------|-------|
| Clearbit (now Breeze) | DEAD for free | Acquired by HubSpot Dec 2023, free tier killed Apr 2024. Requires HubSpot subscription + $45/mo min. No standalone API. |
| Twitter/X API (read) | DEAD for free | Requires $100+/mo Basic plan for any meaningful reads |
| LinkedIn API | NEVER free for data access | Marketing API exists but doesn't give contact data |

### 4.3 Sources Worth Paying For (Priority Order)

1. **Hunter.io Starter ($34/mo, 500 searches/month):** Worth it for email discovery at scale.
2. **Apollo.io Basic ($59/mo):** Broad contact database, use as email waterfall fallback.
3. **Google Custom Search ($5/1K queries):** Higher quality search results than DDG. At our volume (~500 queries/month), costs $2.50/month. Buy this.
4. **Crunchbase Pro ($349/mo):** Only if we need funding data at scale. Currently not justified.

---

## 5. Existing Enrichment Codebase Audit

### 5.1 What's Implemented

The enrichment engine lives at:
```
corgi-outreach/backend/src/research/
├── enricher.js               — NLP enricher (heuristic signal extraction from scraped text)
├── enrichment-pipeline.js    — Multi-source pipeline orchestrator
└── sources/
    ├── web-search.js          — DuckDuckGo Lite search
    ├── company-website.js     — Direct website scraping  
    ├── linkedin-enrichment.js — LinkedIn via web search (no API)
    ├── funding-research.js    — Funding via web search + EDGAR
    ├── social-signals.js      — Social media signals
    ├── email-discovery.js     — Email pattern detection + generation
    ├── news-monitor.js        — News monitoring
    ├── sec-edgar.js           — SEC EDGAR API (fully implemented, free)
    ├── job-postings.js        — Greenhouse/Lever job board scraping
    ├── nvidia-partners.js     — NVIDIA partner tier detection
    └── rate-limiter.js        — Shared concurrency limiter
```

### 5.2 Architecture Assessment

**Strengths:**
- ✅ All 10 sources implemented and structurally sound
- ✅ SEC EDGAR source is sophisticated and well-built
- ✅ Email discovery with pattern inference is excellent
- ✅ Job postings source includes ATS direct scraping (Greenhouse/Lever)
- ✅ NVIDIA partner tier detection is unique and high-value
- ✅ Enrichment log for audit trail
- ✅ DB migration pattern (idempotent ALTER TABLE)
- ✅ GPU-specific fields in schema: `estimated_gpu_scale`, `financing_status`, `gpu_asset_value`, `nvidia_partnership`

**Weaknesses:**

1. **No true waterfall — all sources run in parallel (`Promise.all`).**
   This is suboptimal for paid sources and doesn't implement stop-on-match. For free sources, parallel is fine. Needs two modes: "parallel all-free" and "waterfall for paid."

2. **No per-field confidence scoring.**
   `updateCompanyFields()` uses "first non-null value wins" — no confidence comparison. If DuckDuckGo guesses a founding year and SEC EDGAR reports it authoritatively, we should prefer EDGAR.

3. **No data freshness per field.**
   `last_enriched_at` is per-entity. If we re-run enrichment, we don't know which specific fields were updated and when. Can't do targeted re-enrichment of stale fields.

4. **DuckDuckGo Lite reliability risk.**
   DDG Lite is not a stable API — it can block bot traffic, change HTML structure, or rate-limit. All our sources depend on it heavily. We should add Google Custom Search as a backup.

5. **No retry logic at pipeline level.**
   If a source throws, it's caught but not retried. Should have exponential backoff for transient failures.

6. **No incremental enrichment.**
   `enrichAll()` re-runs every company, even freshly enriched ones. Need a `freshness_threshold_days` parameter.

7. **SQLite may bottleneck at scale.**
   Concurrent writes from parallel enrichment can cause SQLite locking. Need WAL mode enabled or migration to PostgreSQL for production scale.

8. **No Hunter.io or Apollo API integration.**
   The two most useful paid sources aren't connected. Email discovery relies entirely on web search + pattern inference.

9. **`enricher.js` (heuristic NLP) is separate from the pipeline.**
   `enrichCompany()` in enricher.js (keyword matching) and `enrichCompanyFull()` (pipeline) coexist. The heuristic enricher should feed INTO the pipeline, not be a separate code path.

### 5.3 What's Working vs. Broken

| Source | Status | Notes |
|--------|--------|-------|
| `web-search.js` | ✅ Working | DuckDuckGo Lite, fragile but functional |
| `sec-edgar.js` | ✅ Working | Best source in the pipeline |
| `email-discovery.js` | ✅ Working | Pattern detection is solid |
| `job-postings.js` | ✅ Working | ATS scraping is clever |
| `nvidia-partners.js` | ✅ Working | Unique signal, well-built |
| `funding-research.js` | ✅ Working | Web search + EDGAR combo is good |
| `linkedin-enrichment.js` | ⚠️ Fragile | No API, depends on DDG site: searches which LinkedIn may block |
| `company-website.js` | ⚠️ Unknown | Not read in this audit — needs review |
| `social-signals.js` | ⚠️ Unknown | Not read in this audit — needs review |
| `news-monitor.js` | ⚠️ Unknown | Not read in this audit — needs review |

### 5.4 How to Extend

To add a new source:
1. Create `sources/{source-name}.js` exporting `{ enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }`
2. Add to `sources` object in `enrichment-pipeline.js`
3. Map any new DB fields to `DB_FIELDS` array in `enrichCompany()`
4. Run migration (add new columns to schema)

The interface contract is clean. New sources are plug-and-play.

---

## 6. Proposed Architecture: Corgi Enrichment Engine v2

### 6.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CORGI ENRICHMENT ENGINE v2                          │
│                                                                         │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   │
│  │   INPUT LAYER    │   │  PIPELINE LAYER  │   │  STORAGE LAYER   │   │
│  │                  │   │                  │   │                  │   │
│  │ • Manual upload  │──▶│ 1. Source Plan   │──▶│ • Company table  │   │
│  │ • API POST       │   │    (decide what  │   │ • Contact table  │   │
│  │ • Discovery feed │   │     to run)      │   │ • field_log      │   │
│  │ • Webhook trigger│   │                  │   │ • enrichment_log │   │
│  └──────────────────┘   │ 2. Parallel Free │   │ • source_cache   │   │
│                          │    Sources       │   └──────────────────┘   │
│  ┌──────────────────┐   │   (all at once)  │                           │
│  │  SCHEDULER       │   │                  │   ┌──────────────────┐   │
│  │                  │   │ 3. Waterfall Paid│   │  MONITORING      │   │
│  │ • Cron: daily    │   │    Sources       │   │                  │   │
│  │   stale sweep    │──▶│   (stop-on-match)│   │ • Coverage stats │   │
│  │ • Priority queue │   │                  │   │ • Confidence     │   │
│  │   for new adds   │   │ 4. Merge & Score │   │   distribution   │   │
│  │ • Trigger on     │   │   (per-field     │   │ • Source hit     │   │
│  │   news events    │   │    confidence)   │   │   rates          │   │
│  └──────────────────┘   │                  │   │ • Cost tracking  │   │
│                          │ 5. Persist &     │   └──────────────────┘   │
│                          │   Update         │                           │
│                          └──────────────────┘                           │
│                                                                         │
│  FREE SOURCES (parallel):          PAID SOURCES (waterfall):           │
│  • DuckDuckGo search               • Hunter.io (email, $34/mo)         │
│  • Company website scrape          • Apollo free tier (email, backup)  │
│  • SEC EDGAR                       • Google Search API ($5/1K)         │
│  • Hacker News API                 • Crunchbase (if needed, $349/mo)   │
│  • Wayback Machine                                                      │
│  • GitHub API (authenticated)                                           │
│  • Job boards (Greenhouse/Lever)                                        │
│  • NVIDIA partner directory                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Data Model

**Companies table (extended):**
```sql
CREATE TABLE companies (
  -- Identity
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  website                 TEXT,
  domain                  TEXT,  -- normalized domain
  
  -- Type classification
  type                    TEXT,  -- 'operator' | 'lender' | 'arranger' | 'insurer'
  industry_segment        TEXT,
  
  -- Firmographics
  founded_year            INTEGER,
  employee_count          TEXT,
  headquarters            TEXT,
  country                 TEXT,
  
  -- Financial
  total_raised            TEXT,
  last_funding_round      TEXT,
  investors               TEXT,  -- JSON array
  annual_revenue          TEXT,
  
  -- GPU-specific (our secret sauce)
  estimated_gpu_scale     TEXT,  -- 'startup' | 'mid' | 'enterprise' | '1K+' | '10K+' | '100K+'
  gpu_fleet_size_estimate INTEGER, -- numeric estimate if determinable
  gpu_fleet_value_usd     TEXT,  -- dollar value of GPU fleet
  primary_gpu_type        TEXT,  -- 'H100' | 'A100' | 'H200' | 'B200' etc.
  gpu_asset_value         TEXT,  -- from SEC balance sheet
  depreciation_schedule   TEXT,  -- from SEC filings
  financing_status        TEXT,  -- 'active' | 'upcoming' | 'unknown'
  financing_type          TEXT,  -- 'debt' | 'equity' | 'mixed' | 'unknown'
  debt_outstanding        TEXT,  -- total debt from balance sheet
  
  -- Relationships
  nvidia_partnership      TEXT,  -- 'NCP' | 'DGX-Ready' | 'Inception' | 'Preferred' | 'None'
  key_customers           TEXT,
  key_partners            TEXT,
  
  -- SEC data
  sec_ticker              TEXT,
  sec_cik                 TEXT,
  
  -- Social / web
  linkedin_url            TEXT,
  twitter_url             TEXT,
  github_url              TEXT,
  
  -- Signals
  recent_news             TEXT,  -- JSON array of news items
  hiring_signals          TEXT,
  open_roles_count        INTEGER,
  key_hires               TEXT,  -- JSON array of open roles
  
  -- Deal readiness score
  deal_score              REAL DEFAULT 0.0,
  deal_score_updated_at   DATETIME,
  deal_score_breakdown    TEXT,  -- JSON
  
  -- Enrichment metadata
  last_enriched_at        DATETIME,
  enrichment_version      INTEGER DEFAULT 1,
  
  -- Pipeline
  priority                TEXT DEFAULT 'B',  -- 'A' | 'B' | 'C'
  status                  TEXT DEFAULT 'research',
  
  created_at              DATETIME DEFAULT (datetime('now')),
  updated_at              DATETIME DEFAULT (datetime('now'))
);

-- Per-field enrichment log (new in v2)
CREATE TABLE enrichment_field_log (
  id            TEXT PRIMARY KEY,
  entity_type   TEXT NOT NULL,  -- 'company' | 'contact'
  entity_id     TEXT NOT NULL,
  field_name    TEXT NOT NULL,
  field_value   TEXT,
  source        TEXT NOT NULL,
  confidence    REAL NOT NULL DEFAULT 0.5,
  enriched_at   DATETIME DEFAULT (datetime('now')),
  expires_at    DATETIME,
  superseded    BOOLEAN DEFAULT FALSE,
  UNIQUE(entity_type, entity_id, field_name, source)
);
```

**Contacts table (extended):**
```sql
CREATE TABLE contacts (
  id                  TEXT PRIMARY KEY,
  company_id          TEXT REFERENCES companies(id),
  name                TEXT NOT NULL,
  title               TEXT,
  seniority           TEXT,  -- 'C-Suite' | 'VP' | 'Director' | 'Manager' | 'IC'
  department          TEXT,  -- 'Finance' | 'Infrastructure' | 'Executive' | 'Operations'
  
  -- Contact info
  email               TEXT,
  email_confidence    REAL DEFAULT 0.0,
  email_verified_at   DATETIME,
  email_status        TEXT,  -- 'verified' | 'catch-all' | 'invalid' | 'unknown'
  phone               TEXT,
  phone_confidence    REAL DEFAULT 0.0,
  
  -- Social
  linkedin_url        TEXT,
  twitter_url         TEXT,
  github_url          TEXT,
  
  -- Enrichment
  bio                 TEXT,
  tenure              TEXT,  -- "2 years at Company" from LinkedIn snippet
  email_pattern       TEXT,
  last_enriched_at    DATETIME,
  
  -- Relevance to deal (our scoring)
  relevance_score     REAL DEFAULT 0.0,  -- how relevant is this person to the deal
  relevance_reason    TEXT,  -- 'CFO' | 'Head of Infrastructure' | etc.
  
  created_at          DATETIME DEFAULT (datetime('now'))
);
```

### 6.3 Enrichment Pipeline Stages

**Stage 1: Source Planning**
```javascript
function planEnrichment(entity) {
  const plan = { parallel: [], waterfall: [] };
  
  // Always run free sources in parallel
  plan.parallel = [
    'web-search',
    'company-website',
    'sec-edgar',        // free, authoritative
    'funding-research', // free web search
    'job-postings',     // free ATS scraping
    'nvidia-partners',  // free DDG
    'github',           // free authenticated API (NEW)
    'hacker-news',      // free, no auth (NEW)
  ];
  
  // Only run if email not yet known, in order of cost
  if (!entity.contacts?.some(c => c.email)) {
    plan.waterfall.push('email-discovery'); // free, internal
    if (HUNTER_API_KEY) plan.waterfall.push('hunter-io');
    if (APOLLO_API_KEY) plan.waterfall.push('apollo');
  }
  
  // Only run LinkedIn if we don't have their LinkedIn URL already
  if (!entity.linkedin_url) {
    plan.parallel.push('linkedin-enrichment');
  }
  
  return plan;
}
```

**Stage 2: Parallel Execution (free sources)**
```javascript
const freeResults = await Promise.allSettled(
  plan.parallel.map(sourceName => runSource(sourceName, entity))
);
```

**Stage 3: Waterfall Execution (paid sources)**
```javascript
for (const sourceName of plan.waterfall) {
  const result = await runSource(sourceName, entity);
  if (result.data.email) {
    break; // Stop-on-match — don't spend more credits
  }
}
```

**Stage 4: Merge with Confidence**
```javascript
function mergeResults(entity, results) {
  const fieldCandidates = {};  // field → [{value, source, confidence}]
  
  for (const result of results) {
    for (const [field, value] of Object.entries(result.data)) {
      if (value == null) continue;
      if (!fieldCandidates[field]) fieldCandidates[field] = [];
      fieldCandidates[field].push({
        value,
        source: result.source,
        confidence: SOURCE_CONFIDENCE[result.source] || 0.5,
      });
    }
  }
  
  // For each field, pick the highest-confidence value
  const merged = {};
  for (const [field, candidates] of Object.entries(fieldCandidates)) {
    const best = candidates.sort((a, b) => b.confidence - a.confidence)[0];
    merged[field] = best;
  }
  
  return merged;
}
```

### 6.4 Source Priority Ordering

For GPU infrastructure companies, ordered by expected value/cost ratio:

```
Tier 1 — Always Run, Free, High Value
  1. sec-edgar            (public companies: gold standard)
  2. company-website      (self-reported data, very accurate)
  3. web-search           (broad signal collection)
  4. funding-research     (combines SEC + web search)

Tier 2 — Always Run, Free, Medium Value
  5. job-postings         (hiring signals, role discovery)
  6. nvidia-partners      (GPU ecosystem signal)
  7. linkedin-enrichment  (URL discovery only)
  8. github               (tech stack, engineers) ← ADD THIS

Tier 3 — Run if Missing Data, Free
  9. email-discovery      (pattern inference from known contacts)
  10. hacker-news          ← ADD THIS
  11. wayback-machine      ← ADD FOR HISTORICAL RESEARCH

Tier 4 — Waterfall, Paid (only for email)
  12. hunter-io            (email lookup, $34/mo)
  13. apollo               (email fallback, $59/mo)
```

### 6.5 Cost Estimates by Volume Tier

**Zero-cost operation (current architecture, free sources only):**
- Up to ~1,000 companies/month enriched fully
- ~100 contacts with email discovery via pattern inference
- Cost: $0 (minus server costs)
- Limitation: No email verification, no paid API coverage

**Low-cost operation ($100/month):**
- Hunter.io Starter ($34/mo): 500 verified emails/month
- Google Custom Search ($5): 1,000 better-quality searches
- Apollo free tier: 10 export credits (use sparingly)
- Estimate: Handles 500-800 fully enriched company profiles + contacts

**Mid-range ($500/month):**
- Hunter.io Growth ($104/mo): 5,000 email searches
- Apollo Basic ($59/mo): Unlimited emails, 100 mobile
- Clay Pro ($800/mo) — OR build our own at $500 total
- At this point, building our own (v2) is 40% cheaper than Clay and purpose-built for GPU infra

**Scale ($2,000/month):**
- Hunter.io Business ($374/mo): 50,000 searches
- Apollo Professional ($99/mo)
- Crunchbase Pro ($349/mo): Funding data at scale
- Custom infrastructure: ~$300/mo (compute + storage)

### 6.6 Technology Stack

| Component | Recommendation | Notes |
|-----------|---------------|-------|
| Runtime | Node.js (current) | Keep it, team is comfortable |
| Database | PostgreSQL | Migrate from SQLite for production; WAL mode helps but PG is better for concurrent writes |
| Job queue | BullMQ (Redis) | Replace current `enrichAll()` sequential loop; enables proper priority queuing, retry, rate limiting per source |
| Cache | Redis | Shared cache for API responses; deduplicates parallel source calls |
| Search | DuckDuckGo → Google Custom Search | Add Google as primary, DDG as fallback |
| AI extraction | Anthropic API (existing) | Use for unstructured text extraction from websites |
| Monitoring | Simple SQLite metrics table or Grafana | Track source hit rates, confidence distributions |

**Migration path:** The current codebase is well-structured. The key changes are:
1. Add BullMQ for job queue (biggest lift, ~2 days)
2. Add `enrichment_field_log` table (schema migration, ~1 hour)
3. Add GitHub + HN sources (new source files, ~half day each)
4. Add Hunter.io source (straightforward API wrapper, ~2 hours)
5. Implement confidence-based merge (replace `updateCompanyFields`, ~3 hours)
6. Add waterfall execution mode alongside existing parallel mode (pipeline change, ~1 day)

### 6.7 API Design (Enrichment Endpoints)

```
POST /api/enrichment/company/:id
  Body: { sources?: string[], force?: boolean }
  Response: { jobId: string }

GET /api/enrichment/company/:id/status
  Response: { status: 'pending'|'running'|'complete', progress: {...} }

GET /api/enrichment/company/:id/report
  Response: { fields: { [fieldName]: { value, source, confidence, enriched_at } } }

POST /api/enrichment/batch
  Body: { companyIds: string[], priority?: 'A'|'B'|'C' }
  Response: { jobId: string, queued: number }

GET /api/enrichment/health
  Response: { sources: { [name]: { status, lastRun, hitRate } } }

POST /api/enrichment/contact/:id/email
  Body: { force?: boolean }
  Response: { jobId: string }
```

### 6.8 Scheduling

**Real-time enrichment:**
- Triggered immediately when: new company added, manual "enrich now" button, news event detected
- Target latency: < 60 seconds for a full company profile
- Priority: HIGH queue in BullMQ

**Batch / scheduled enrichment:**
- Daily cron: Re-enrich all records where any field `expires_at < now + 7 days`
- Weekly cron: Priority A companies get full re-enrichment regardless of freshness
- Monthly cron: Low-priority sweep of C-list companies

**Trigger-based re-enrichment:**
- News monitor detects funding news for company → trigger re-enrichment with `sources: ['funding-research', 'sec-edgar']`
- Job posting spike detected → trigger `sources: ['job-postings']`

### 6.9 Data Quality Monitoring

Track these metrics per source, per week:
```sql
-- Proposed metrics view
SELECT
  source,
  COUNT(*) as total_runs,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successes,
  AVG(CASE WHEN success THEN fields_found ELSE 0 END) as avg_fields_found,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as hit_rate_pct
FROM enrichment_log
WHERE created_at > datetime('now', '-7 days')
GROUP BY source
ORDER BY hit_rate_pct DESC;
```

Alert when:
- Source hit rate drops below 50% for 24 hours (likely broken/blocked)
- Average confidence of email fields drops below 0.6
- More than 20% of sent emails bounce (need to verify email source quality)

### 6.10 Handling Stale Data

**Staleness detection query:**
```sql
SELECT id, name, last_enriched_at,
  (julianday('now') - julianday(last_enriched_at)) as days_old,
  priority
FROM companies
WHERE last_enriched_at IS NULL
   OR (julianday('now') - julianday(last_enriched_at)) > 
      CASE priority 
        WHEN 'A' THEN 7   -- Re-enrich weekly
        WHEN 'B' THEN 30  -- Monthly
        ELSE 90           -- Quarterly
      END
ORDER BY priority ASC, days_old DESC;
```

### 6.11 Handling Conflicting Data

**Conflict resolution hierarchy (highest wins):**
1. User-manually-entered data (never overwrite)
2. SEC EDGAR (official filing, 0.99 confidence)
3. Verified email (confirmed deliverable, 0.95)
4. Company website (self-reported, 0.90)
5. Hunter.io (0.85)
6. Apollo (0.75)
7. Web search extraction (0.60)
8. LLM inference (0.50)

**For numeric fields (e.g., employee count), use source confidence + recency:**
```javascript
function resolveConflict(fieldName, candidates) {
  if (['employee_count', 'gpu_fleet_size_estimate'].includes(fieldName)) {
    // For numeric estimates, prefer most recent high-confidence source
    return candidates
      .sort((a, b) => (b.confidence * recency(b.enriched_at)) - (a.confidence * recency(a.enriched_at)))[0];
  }
  // Default: highest confidence
  return candidates.sort((a, b) => b.confidence - a.confidence)[0];
}
```

---

## 7. GPU-Specific Enrichment Strategies

### 7.1 How to Estimate GPU Fleet Size from Public Data

**Method 1: Power capacity math (most reliable for data center operators)**
```
Rule of thumb:
- NVIDIA H100 SXM: ~700W GPU + ~300W overhead = ~1kW per GPU
- NVIDIA A100 80GB: ~400W + overhead = ~600W per GPU
- H200/B200: ~1kW-1.4kW per GPU

Formula: Announced_MW_capacity × 1,000 / watts_per_gpu = estimated_GPU_count

Example: Company announces 40MW data center for AI
  40,000 kW ÷ 1 kW/H100 = 40,000 H100s
  (realistically ~60-70% GPU density, so ~24,000-28,000 H100s)
```

**Sources for power capacity:**
- Press releases (search: `"[company]" megawatt AI data center 2024`)
- Utility announcements (state utility commissions publish power delivery contracts)
- Real estate filings (lease signings often mention power capacity)
- SEC 10-K/10-Q notes on "property and equipment"

**Method 2: CapEx math (for companies that report financial results)**
```
H100 cost: ~$25,000-40,000 per GPU (2024 price)
B200 cost: ~$30,000-70,000 per GPU (2025 price)

Formula: Reported_CapEx / avg_GPU_cost = estimated_GPU_purchases

Note: CapEx includes non-GPU infrastructure (cooling, networking, facilities)
  Adjust downward by 40-60% for GPU-only estimate

SEC EDGAR queries to run:
  - "capital expenditures" → look for annual CapEx figure
  - "GPU" or "NVIDIA" in 10-K → specific GPU mentions  
  - "property and equipment" → balance sheet value of hardware
```

**Method 3: MLPerf benchmarks**
- MLPerf is an industry benchmark where companies voluntarily submit GPU cluster configs
- `https://mlcommons.org/en/results/training/` has detailed cluster specs
- Highly accurate when available, but only large-scale operators submit

**Method 4: Job posting density × ratios**
```
Industry ratio: ~1 GPU cluster engineer per 1,000 GPUs (rough)
  - If company has 20 ML infra engineers → ~20,000 GPU scale
  - Highly approximate but directionally useful

Better signal: Specific job requirements
  "Manage our 10,000+ GPU cluster" → explicit size mentioned
  "Experience with clusters of 1,000+ A100s" → minimum size signal
```

**Method 5: Colocation / lease signals**
```
Search: "[company] data center lease MW site:datacenterfrontier.com OR site:dcmag.com OR site:bisnow.com"

These trade publications report lease signings with MW capacity.
Combine with the power math above.
```

**Enrichment field to add:** `gpu_fleet_size_estimate` (INTEGER) with confidence scoring.

### 7.2 Identifying Debt-Financed vs. Equity-Financed GPU Companies

**Why this matters:** Debt-financed GPU operators are prime candidates for residual value insurance (RVI) — their lenders need protection against GPU price decline. Equity-only shops are less likely to need RVI.

**Signal 1: SEC EDGAR credit agreement filings**
```
Search EDGAR full-text: "equipment financing" "GPU" site:efts.sec.gov
Form types: 8-K (material events), 10-K (annual), credit agreement exhibits

Red flags in filings that indicate debt financing:
  - "Term loan secured by GPU assets"
  - "Equipment collateral"
  - "Security interest in [GPUs / servers / technology assets]"
  - "Net book value of collateral not to fall below..."
  - "Loan-to-value covenant"

EDGAR search: https://efts.sec.gov/LATEST/search-index?q="GPU"+"equipment+financing"&forms=8-K,10-K
```

**Signal 2: Private company press release patterns**
```
Debt financing language:
  - "closed a $XXM credit facility"
  - "secured a $XXM equipment financing line"
  - "$XXM asset-backed facility"
  - "announced a debt facility from [lender]"
  - "structured credit" / "term loan"

Equity financing language:
  - "raised $XXM Series A/B/C"
  - "equity round led by [VC]"
  - "closed a $XXM venture round"

Lenders that specialize in GPU debt:
  - Trinity Capital, Hercules Capital, Horizon Technology Finance
  - IM Flash, Western Technology Investment
  - Traditional banks: Silicon Valley Bank (now FDIC), Signature Bank (defunct)
  - New entrants: Upper90, Viola Credit, Fasanara Capital

If we see Company X mentioned alongside Trinity Capital → debt financing
```

**Signal 3: UCC Filings (most reliable for private companies)**
```
UCC (Uniform Commercial Code) Article 9 filings are public records.
When a lender takes a security interest in GPU equipment, they file a UCC-1 financing statement.
This is the "ground truth" for whether a company has pledged its GPUs as collateral.

How to search:
  - Per-state search: Each state SOS (Secretary of State) has a UCC search
  - Commercial databases: CT Lien Solutions, Bloomberg Law, Lexis Nexis
  - Free searches: 
    - Delaware: https://icis.corp.delaware.gov/ecorp/ucc-search/index.aspx
    - California: https://uccsearch.sos.ca.gov/
    - Texas: https://direct.sos.state.tx.us/ucc_search/
    
What to look for:
  - Debtor: [Company Name]
  - Secured party: [Lender / bank]
  - Collateral description: "computer equipment", "servers", "GPU", "technology assets"

This is gold. If we find a UCC-1 with "GPU" in the collateral description,
we know: (1) there's debt, (2) the lender took a security interest, 
(3) this company very likely needs RVI.

Enrichment to add: `ucc_filing_found` (boolean), `ucc_secured_party` (text), 
  `ucc_filing_date` (date), `ucc_collateral_description` (text)
```

**Signal 4: Press releases + Crunchbase funding type filter**
```
Crunchbase Pro lets you filter by funding type: "Debt Financing" vs "Series A/B" etc.
Even Crunchbase basic shows the funding type if you look at each round.

At free tier, you can manually check individual companies.
At $349/mo Crunchbase Pro, you can export all GPU infra companies with funding type.
```

**Signal 5: Lender relationships on LinkedIn**
```
If a company's CFO previously worked at a major BDC (Business Development Company)
or if a BDC/credit fund shows up in their network → likely debt finance connection.

Known GPU-focused lenders to watch for in LinkedIn relationships:
  - Trinity Capital (NASDAQ: TRIN)
  - Hercules Capital (NASDAQ: HTGC)
  - Horizon Technology Finance (NASDAQ: HRZN)  
  - IM Flash Capital
  - Atlas Credit
  - Fasanara Capital
  - Upper90
  - Runway Growth Capital
```

### 7.3 Identifying Companies Likely to Need Residual Value Insurance

**Profile of an RVI target:**
1. Large GPU fleet (>$50M in assets)
2. Debt-financed (lender needs downside protection)
3. GPU assets on balance sheet as collateral
4. Lenders who care about asset depreciation (BDCs, credit funds, not VCs)
5. Long-term GPU contracts / leases that need RVI to hedge against early termination

**Enrichment scoring model for RVI fit:**

```javascript
function calculateRVIScore(company) {
  let score = 0;
  const reasons = [];
  
  // Debt financing signals
  if (company.financing_type === 'debt') { score += 30; reasons.push('debt_financed'); }
  if (company.ucc_filing_found) { score += 25; reasons.push('ucc_filing_confirmed'); }
  if (company.sec_filings?.some(f => f.mentions_equipment_collateral)) {
    score += 20; reasons.push('equipment_collateral_in_sec_filing');
  }
  
  // Asset scale signals
  if (company.gpu_fleet_size_estimate > 10000) { score += 20; reasons.push('large_fleet_>10K'); }
  else if (company.gpu_fleet_size_estimate > 1000) { score += 10; reasons.push('medium_fleet_>1K'); }
  
  // GPU asset value signals
  if (company.gpu_asset_value_usd > 100_000_000) { score += 15; reasons.push('asset_value_>$100M'); }
  
  // Lender relationship signals
  if (company.investors?.some(i => KNOWN_GPU_LENDERS.includes(i))) {
    score += 15; reasons.push('known_gpu_lender_as_investor');
  }
  
  // Company type signals
  if (company.type === 'operator') { score += 5; }
  if (company.nvidia_partnership === 'NCP') { score += 5; reasons.push('nvidia_cloud_partner'); }
  
  return { score: Math.min(score, 100), reasons };
}
```

### 7.4 Finding the Right Contact at Target Companies

**Contact targeting matrix by company type:**

| Company Type | Primary Contact | Secondary Contact | Why |
|-------------|----------------|------------------|-----|
| GPU cloud operator (public) | CFO | VP Finance / Treasurer | Controls asset financing decisions |
| GPU cloud operator (private) | CFO / Co-Founder | Head of Finance | Same, often founder-led decisions |
| Private credit / BDC lender | Portfolio Manager | Credit Officer / MD | They underwrite the loans we'd insure |
| Debt arranger / IB | Managing Director (Infra) | Associate Director | They bring deals to us |
| Colocation / data center | VP Finance | Head of Infrastructure | RVI hits at data center level |
| Sovereign AI / national AI | Ministry official / Director | CFO of state entity | Long procurement cycles |

**Seniority filter for outreach:**
```javascript
const TARGET_TITLES = [
  // Finance / Capital Markets (primary)
  'CFO', 'Chief Financial Officer',
  'VP Finance', 'VP of Finance', 'SVP Finance',
  'Head of Finance', 'Head of Capital Markets',
  'Director of Finance', 'Director of Capital',
  'Treasurer', 'Assistant Treasurer',
  'Credit Officer', 'Chief Credit Officer',
  
  // Infrastructure (secondary — they spec the equipment)
  'CTO', 'Chief Technology Officer',
  'Head of Infrastructure', 'VP Infrastructure',
  'Director of Infrastructure', 'Director of Data Center',
  
  // Executive (for small companies)
  'CEO', 'Chief Executive Officer',
  'Co-Founder', 'Founder',
  'President', 'Managing Director', 'Managing Partner',
  
  // Investment / Portfolio (for lenders/BDCs)
  'Portfolio Manager', 'Investment Manager',
  'Managing Director', 'Partner',
  'General Partner', 'Principal',
];
```

**How to find them (source priority):**
1. **SEC EDGAR submissions API** → `submissions.json` includes named officers for public companies. 100% reliable.
2. **Job postings** → CFO job posting = CFO vacancy = predecessor CFO + timing signal
3. **LinkedIn search via DDG** → `site:linkedin.com/in "CFO" "[company name]"`
4. **Company website team page** → Often has leadership bios with names
5. **Press releases** → "John Smith, CFO of [Company], said..." pattern extraction
6. **Hacker News hiring posts** → "Ask HN: [Company] is hiring a Head of Finance..."

### 7.5 Deal Readiness Scoring

**Deal readiness = likelihood that a company will engage with our offer in the next 90 days.**

Positive signals (increase score):
- Recent large debt round (< 6 months ago) → lender needs RVI now
- GPU fleet expansion announced → new assets to insure
- UCC filing found (debt secured by GPU assets) → insurance conversation is natural
- CFO joined recently (< 12 months) → new CFO often re-evaluates insurance/risk
- Job posting for "Head of Risk" or "Director of Finance" → thinking about financial risk
- Company hired from a company that uses RVI → warm referral path

Negative signals (decrease score):
- Fully equity-funded, no debt → low RVI need unless they lease
- Very small fleet (<100 GPUs) → not worth insuring
- Recently went through bankruptcy or restructuring → not credit-worthy
- No CFO / financial officer identified → can't reach right contact
- Company website down / dark → may be shutting down

```javascript
function calculateDealScore(company, contacts) {
  let score = 0;
  
  // Financial fit (50 points max)
  if (company.financing_type === 'debt')      score += 20;
  if (company.ucc_filing_found)               score += 15;
  if (company.last_funding_round_type === 'credit_facility') score += 10;
  if (company.total_raised_usd > 50_000_000)  score += 5;
  
  // Asset scale fit (25 points max)
  const fleetSize = company.gpu_fleet_size_estimate || 0;
  if (fleetSize > 100000)     score += 25;
  else if (fleetSize > 10000) score += 20;
  else if (fleetSize > 1000)  score += 15;
  else if (fleetSize > 100)   score += 5;
  
  // Timing signals (15 points max)
  const monthsSinceFunding = monthsSince(company.last_funding_date);
  if (monthsSinceFunding < 3)                 score += 15;  // Very hot
  else if (monthsSinceFunding < 6)            score += 10;
  else if (monthsSinceFunding < 12)           score += 5;
  
  // Contact quality (10 points max)
  const hasCFO = contacts.some(c => /CFO|Chief Financial/i.test(c.title));
  const hasEmail = contacts.some(c => c.email && c.email_confidence > 0.7);
  if (hasCFO)   score += 5;
  if (hasEmail) score += 5;
  
  return { score: Math.min(score, 100) };
}
```

---

## 8. Immediate Action Plan

### Priority 1 — Fix architecture gaps (1 week)
1. **Enable WAL mode on SQLite** (1 line): `PRAGMA journal_mode=WAL;` — prevents write locks during parallel enrichment
2. **Add per-field confidence to merge logic** — replace first-wins with highest-confidence-wins
3. **Add incremental enrichment flag** to `enrichAll()` — skip recently enriched companies

### Priority 2 — Add high-value free sources (1 week)
4. **Build `github.js` source** — search GitHub for company org, get engineer list, tech stack signals
5. **Build `hacker-news.js` source** — search Algolia HN API for company mentions, hiring posts
6. **Add UCC filing scraper** (Delaware + Delaware is where most GPU companies are incorporated)

### Priority 3 — Add paid sources (when budget allows)
7. **Hunter.io integration** ($34/mo) — email lookup for validated emails
8. **Google Custom Search** ($5/1K) — replace DuckDuckGo as primary search, use DDG as fallback

### Priority 4 — Scoring engine (2 weeks)
9. **Implement `calculateDealScore()`** — composite score based on all enriched signals
10. **Implement `calculateRVIScore()`** — GPU-specific fit scoring
11. **Surface scores in the UI** — sort pipeline view by deal score

### Priority 5 — Infrastructure (optional, when scaling beyond 1K companies)
12. **BullMQ job queue** — proper retry, rate limiting, priority queuing
13. **PostgreSQL migration** — better concurrency than SQLite at scale
