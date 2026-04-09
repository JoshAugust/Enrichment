# Jordan.AI Lead Generation Pipeline — Complete Reference

> **Last updated:** 2026-04-02
> **Master database:** `pipeline/master.db` (82,001 unique companies, 37.4 MB)

---

## Table of Contents

1. [DQ Parameters (Disqualification)](#1-dq-parameters-disqualification)
2. [Data Sources (Discovery)](#2-data-sources-discovery)
3. [Enrichment Pipeline (Ordered)](#3-enrichment-pipeline-ordered)
4. [Scoring System](#4-scoring-system)
5. [Tool Reference](#5-tool-reference)
6. [Known Issues & Lessons](#6-known-issues--lessons)
7. [Future Process (Recommended)](#7-future-process-recommended)
8. [Master Database Reference](#8-master-database-reference)

---

## 1. DQ Parameters (Disqualification)

A company is disqualified (DQ'd) from the pipeline if **any** of the following apply:

| # | DQ Rule | Source | Reliability | Notes |
|---|---------|--------|-------------|-------|
| 1 | **Employee count >100** | LinkedIn (via Apollo org enrichment) | ⭐⭐⭐⭐⭐ High | The primary employee filter. BvD counts are NOT used for DQ — only LinkedIn-verified counts. |
| 2 | **Revenue >$20M** | BvD (Bureau van Dijk) | ⭐⭐ Low | **Caveat:** BvD revenue data is unreliable for US startups. Many companies show $0 revenue or wildly incorrect figures. Use as a loose signal only, never as sole DQ reason. |
| 3 | **Dead/parked website** | Vibe scoring (website fetch) | ⭐⭐⭐⭐ High | Detected via domain parking keywords: "this domain is for sale", "buy this domain", GoDaddy/Sedo parking pages, blank pages, HTTP errors. Score = 0 with `fetched: false`. |
| 4 | **Zero tech signal score** | Blueprint v3 scoring | ⭐⭐⭐ Medium | A tech_score of 0 means no SIC tech codes, no tech keywords in description, no tech-related signals at all. These are non-tech businesses. |
| 5 | **YC-backed companies** | YC database | ⭐⭐⭐⭐⭐ | Separated into their own list (`yc_qualified.csv`). They're in the master DB but tagged. Not DQ'd per se — just handled separately with different outreach strategy. |
| 6 | **Acquired company** | Domain redirect detection | ⭐⭐⭐⭐ High | If a domain redirects to a completely different company's domain, the original company was likely acquired. Detected during vibe scoring / domain verification. |
| 7 | **Generic/duplicate DM emails** | Apollo people search | ⭐⭐⭐⭐ High | Emails like `info@`, `sales@`, `contact@`, `hello@`, `support@`, `admin@` are not decision-maker emails. These get flagged as `generic_email` in DQ reason. |
| 8 | **Already in HubSpot** | HubSpot API export | ⭐⭐⭐⭐⭐ High | Domain-matched against 78,511 existing HubSpot companies. Prevents duplicate outreach. Fuzzy name matching also used as secondary check. |

### DQ Stats (Master DB)

| DQ Reason | Count |
|-----------|-------|
| Generic email only | 10,415 |
| In HubSpot only | 8,619 |
| In HubSpot + generic email | 1,001 |
| Employees >100 + generic email | 295 |
| Employees >100 only | 224 |
| Employees >100 + in HubSpot + generic email | 39 |
| Employees >100 + in HubSpot | 34 |
| **Total DQ'd** | **20,627** |

---

## 2. Data Sources (Discovery)

### Primary Discovery Sources

| # | Source | What It Provides | Records | Reliability | Cost | Notes |
|---|--------|-----------------|---------|-------------|------|-------|
| 1 | **BvD (Bureau van Dijk) — 60K batch** | Company name, domain, state, employees, revenue, SIC code, entity type, incorporation date, description | 23,301 | ⭐⭐⭐ Medium | Paid (university license) | Employee/revenue data unreliable. Domain mappings sometimes wrong. Good for discovery, bad for qualification. |
| 2 | **BvD — 45K batch** | Same as above, earlier pull | 15,219 | ⭐⭐⭐ Medium | Paid | Overlaps significantly with 60K batch. |
| 3 | **Crunchbase** | Company name, domain, description, funding info | 32,430 | ⭐⭐⭐⭐ High | Via Orange Slice SQL queries | Largest single source. Good company descriptions and tech identification. |
| 4 | **US Software Companies** | Tech companies filtered by SIC/NAICS codes | 4,995 | ⭐⭐⭐ Medium | BvD subset | Pre-filtered for software SIC codes. |
| 5 | **Y Combinator** | YC portfolio companies with batch info | 3,518 | ⭐⭐⭐⭐⭐ High | Public + scraped | High-quality tech companies. Handled as separate pipeline. |
| 6 | **Product Hunt** | Launched products with websites | 1,041 | ⭐⭐⭐ Medium | Scraped | Good for finding early-stage products. Many dead/pivoted. |
| 7 | **Hacker News** | Companies mentioned/launched on HN | 830 | ⭐⭐⭐ Medium | Scraped | Technical founder companies. |
| 8 | **Tech Companies List** | Curated tech company list | 441 | ⭐⭐⭐⭐ High | Manual curation | Small but high quality. |
| 9 | **Accelerator Programs** | Graduates from Techstars, 500 Global, Plug & Play, Alchemist, etc. | 138 | ⭐⭐⭐⭐ High | Scraped program websites | 15+ accelerators covered. Small volume but high signal. |
| 10 | **AngelList** | Startup profiles | 70 | ⭐⭐⭐ Medium | Scraped | Limited volume. |
| 11 | **Silicon Valley List** | SV-based companies | 17 | ⭐⭐⭐ Medium | Manual | Tiny supplemental source. |

### Enrichment Data Sources

| # | Source | What It Provides | Records | Notes |
|---|--------|-----------------|---------|-------|
| 12 | **Apollo Org Enrichment** | LinkedIn employee count, industry, company name verification | 3,770 | 1 credit per lookup. The ONLY reliable employee count. |
| 13 | **Apollo People Search** | Decision-maker names, titles, LinkedIn URLs | ~4,000 | FREE (no credits). |
| 14 | **Apollo Phone Reveals** | Direct phone numbers for DMs | 470 | 1 credit per reveal. Only for top leads. |
| 15 | **Google Maps Places API** | Business phone, address, place name | 1,836 | FREE (10K requests/month). |
| 16 | **Vibe Scoring (website analysis)** | Website quality score (0-100), tech signals | 80,162 | FREE (self-hosted scraper + AI scoring). |
| 17 | **HubSpot Export** | Existing company domains for dedup | 78,511 | Via HubSpot API. |

---

## 3. Enrichment Pipeline (Ordered)

The pipeline runs in this exact order. Each step depends on the previous.

### Step 1: Discovery (Cast Wide Net)
- **Input:** Nothing
- **Output:** Raw company list with names + domains
- **Sources:** BvD (45K + 60K), Crunchbase (via Orange Slice SQL), Product Hunt, Hacker News, accelerator websites, AngelList, curated lists
- **Cost:** BvD = paid license; Crunchbase = Orange Slice credits; rest = free scraping
- **Volume:** ~82,000 unique domains collected across all sources

### Step 2: Domain Verification
- **Input:** Raw domains from discovery
- **Output:** Verified domains with redirect detection
- **Process:** HTTP HEAD/GET request to each domain. Follow redirects. If final domain ≠ original domain's company, flag as acquired. Detect parking pages.
- **Cost:** Free
- **Catches:** Acquired companies, parked domains, dead websites

### Step 3: Vibe Scoring (Website Analysis)
- **Input:** Verified domains
- **Output:** Vibe score (0-100) per domain
- **Process:** Fetch website HTML, analyze for signals (see [Scoring System](#4-scoring-system))
- **Cost:** Free (self-hosted)
- **Volume:** 80,162 domains scored across 6 batch runs (v1, v2, v4, v6, v7, yc)

### Step 4: Blueprint Scoring (Qualification)
- **Input:** All company data + vibe scores
- **Output:** Blueprint score (0-100), grade (A/B/C/D), tech/non-tech breakdown
- **Process:** Score based on tech signals (max 65 pts) + non-tech signals (max 35 pts). See [Scoring System](#4-scoring-system).
- **Cost:** Free
- **Volume:** 44,814 companies scored (41,182 qualified + 3,518 YC + 138 accelerator)

### Step 5: DQ Filtering
- **Input:** Scored companies
- **Output:** Qualified companies (passing all DQ rules)
- **Process:** Apply all DQ rules from [Section 1](#1-dq-parameters-disqualification)
- **Removes:** Dead websites, zero tech score, revenue >$20M

### Step 6: HubSpot Dedup
- **Input:** Qualified companies
- **Output:** New leads only (not already in HubSpot)
- **Process:** Match domains against 78,511 existing HubSpot companies. Fuzzy name matching as secondary check.
- **Cost:** Free (HubSpot API)
- **Removes:** ~9,693 companies already in HubSpot

### Step 7: Apollo Org Enrichment (LinkedIn Employees)
- **Input:** Qualified, deduped companies
- **Output:** LinkedIn-verified employee counts + industry
- **Process:** Apollo organization enrichment API. Returns LinkedIn employee count, industry, verified company name.
- **Cost:** 1 Apollo credit per company
- **Volume:** 3,770 companies enriched

### Step 8: Employee DQ (Remove >100 LinkedIn Employees)
- **Input:** LinkedIn-enriched companies
- **Output:** SMB-only leads (≤100 employees)
- **Process:** Filter out companies where LinkedIn employee count > 100
- **Removes:** ~224 companies (based on current data)

### Step 9: Google Maps Phone Enrichment
- **Input:** Employee-verified leads
- **Output:** Leads with business phone numbers
- **Process:** Google Maps Places API search by company name + location
- **Cost:** Free (10,000 requests/month on free tier)
- **Volume:** 1,836 lookups, many returned no phone

### Step 10: Apollo People Search + Phone Reveals
- **Input:** Top leads (A/B grade)
- **Output:** Decision-maker contacts with direct phones
- **Process:**
  1. People search by company domain + title filters (CEO, CTO, Founder, etc.) — **FREE**
  2. Phone reveal for matched people — **1 credit each**
- **Cost:** Phone reveals only for A/B grade leads
- **Volume:** 470 phone reveals completed

### Step 11: Email Verification
- **Input:** Leads with email addresses
- **Output:** Verified emails
- **Process:** Check for generic emails (info@, sales@, etc.), verify deliverability
- **Status:** Partially implemented. Generic email detection in place. Full deliverability check TBD.

### Step 12: Final XLSX Export
- **Input:** Fully enriched, verified leads
- **Output:** `top_leads_deduped.csv` (2,509 leads) — the final deliverable
- **Columns:** Company name, domain, grade, scores, DM contact info (up to 3 contacts), company phone, LinkedIn employees, enrichment sources

---

## 4. Scoring System

### Vibe Score (0-100)

Website quality analysis. Measures how "real" and active a company's web presence looks.

**How it works:**
1. Fetch the company's website HTML
2. Analyze for positive and negative signals
3. Sum signal weights to produce score

**Positive Signals (increase score):**
- `tld_io` / `tld_ai` — Modern tech TLDs
- `has_pricing` — Pricing page exists (indicates product-market fit)
- `has_careers` — Careers page (company is hiring = growing)
- `has_blog` / `many_blogs` — Content marketing (active company)
- `has_docs` — Documentation (real product)
- `customer_logos` / `many_logos` — Social proof
- `large_sitemap` — Lots of pages (established site)
- `clear_hero` — Clear value proposition on homepage
- `has_demo` / `has_signup` — Product is live and accessible
- `social_proof` — Testimonials, case studies, reviews

**Negative Signals (decrease score):**
- `no_sitemap` — No sitemap.xml (minimal web presence)
- `no_pricing` — No pricing page
- `vague_hero` — Unclear/generic homepage messaging
- `few_blogs` — Very few blog posts
- `no_careers` — No careers page
- `few_logos` — Few or no customer logos
- `parked` — Domain is parked / for sale
- `fetch_failed` — Website unreachable

**Score ranges:**
- **70-100:** Strong web presence, active product company
- **50-69:** Decent presence, may be early-stage
- **30-49:** Weak presence, possibly pre-launch or consulting
- **0-29:** Dead, parked, or not a real product company

### Blueprint Score v3 (0-100)

Composite qualification score with two components:

#### Tech Score (max 65 points)
- **SIC Code match** (e.g., 7371=Computer Services): +15-20 pts
- **Tech keywords in description** (software, platform, SaaS, AI, ML, cloud, API, etc.): +10-20 pts
- **High vibe score** (≥70): +10-15 pts
- **Modern TLD** (.io, .ai): +5 pts
- **Has software engineers** (from LinkedIn): +5 pts

#### Non-Tech Score (max 35 points)
- **Small entity** (≤20 employees): +5-10 pts
- **Recent incorporation** (2019-2024): +5-10 pts
- **Low revenue** (<$1M or $1-5M): +5 pts
- **Tech hub location** (CA, NY, MA, TX, WA, CO, etc.): +5 pts
- **Accelerator-backed**: +5 pts

#### Grade Thresholds
| Grade | Score Range | Meaning |
|-------|-----------|---------|
| **A** | ≥75 | High-priority lead. Multiple strong signals. |
| **B** | 50-74 | Good lead. Worth pursuing. |
| **C** | 25-49 | Marginal. May need manual review. |
| **D** | <25 | Low quality. Likely not a fit. |

#### Grade Distribution (Master DB)
| Grade | Count | % of Scored |
|-------|-------|-------------|
| A | 2,688 | 6.0% |
| B | 20,357 | 45.4% |
| C | 21,454 | 47.9% |
| D | 315 | 0.7% |
| Unscored | 37,187 | — |

---

## 5. Tool Reference

### Apollo.io

**What:** B2B contact and company data platform.

| Endpoint | What It Does | Cost | Rate Limit |
|----------|-------------|------|------------|
| **Org Enrichment** (`/organizations/enrich`) | LinkedIn employee count, industry, HQ, description | 1 credit | ~50 req/min (free), 100/min (paid) |
| **People Search** (`/mixed_people/search`) | Find people by company domain + title | **FREE** | 50 req/min |
| **People Enrichment** (`/people/match`) | Get email for a person | 1 credit | 50 req/min |
| **Phone Reveal** (via people enrichment) | Get direct phone number | 1 credit | 50 req/min |

**API Key:** Stored at `.config/apollo/config.json`
**Free tier:** 10,000 credits/month (resets monthly)
**Key lesson:** People SEARCH is free. Only enrichment/reveals cost credits. Always search first, then selectively reveal.

### Google Maps Places API

**What:** Find business phone numbers and addresses for free.

| Detail | Value |
|--------|-------|
| **Endpoint** | Places API (New) — Text Search |
| **Free tier** | $200/month credit = ~10,000 text searches |
| **Rate limit** | 600 requests/minute |
| **Fields used** | `nationalPhoneNumber`, `formattedAddress`, `displayName` |
| **Hit rate** | ~30-40% of companies found with phone numbers |

**Best for:** Filling phone gaps after Apollo. Free and fast.

### Orange Slice (B2B Enrichment SDK)

**What:** Multi-service B2B data aggregation SDK. Wraps Apollo, Crunchbase, Google Maps, LinkedIn, web scraping, and AI services.

| Service | Use | Credits |
|---------|-----|---------|
| `company.revenue()` | Revenue, employees, HQ, industry, funding | 2 |
| `person.contact.get()` | Email + phone from LinkedIn URL | 275 |
| `crunchbase.*` | SQL queries over Crunchbase data | varies |
| `googleMaps.scrape()` | Google Maps business search | 10/result |
| `web.search()` | SERP search | varies |
| `ai.*` | AI summaries, classification, scoring | varies |

**Current status:** ⚠️ **Credits depleted.** No more Orange Slice calls possible until credits are replenished. Crunchbase queries (32,430 companies) were the primary credit consumer.

### HubSpot

**What:** CRM containing existing company/contact records.

| Capability | Details |
|-----------|---------|
| **Domain export** | 78,511 company domains exported for dedup |
| **Dedup method** | Exact domain match (primary) + fuzzy company name match (secondary) |
| **Sync** | One-way currently: export from HubSpot for dedup. Import of new leads is manual XLSX upload. |

---

## 6. Known Issues & Lessons

### 🔴 BvD Employee Data is Unreliable

**The problem:** BvD employee counts for US tech companies are wildly inaccurate.

**The Substack example:**
- BvD reported: **6 employees**
- LinkedIn actual: **3,100 employees**
- That's a **516x discrepancy**

**Why:** BvD sources from SEC filings, credit bureaus, and self-reported data. US startups rarely file accurate employee counts with these sources. European data is better because of stricter reporting requirements.

**Impact:** If we had used BvD employee counts for DQ, we'd have included many large companies (false negatives) and potentially excluded small ones (false positives).

**Resolution:** We now use Apollo org enrichment to get LinkedIn-verified employee counts. BvD employee data is kept as `bvd_employees` but NEVER used for DQ decisions.

### 🔴 BvD Domain Mismatches

**The problem:** BvD sometimes maps tiny subsidiaries to their parent company's domain, or maps to completely wrong domains.

**Example:** A 3-person consulting LLC in Florida mapped to a Fortune 500 company's domain because BvD linked them through a shared registered agent.

**Impact:** Inflated our domain list with incorrect company-to-domain mappings.

**Resolution:** Domain verification step (Step 2) catches some of these. Apollo org enrichment cross-references the company name, catching more.

### 🟡 Generic Emails in DM Email Field

**The problem:** Apollo people search sometimes returns generic company emails (`info@company.com`, `sales@company.com`) as the DM's email address instead of their personal work email.

**Scale:** 10,415 companies have generic emails as their primary DM contact.

**Impact:** Lower outreach effectiveness — emails to `info@` almost never reach the decision maker.

**Resolution:** Flag as `generic_email` in DQ reasons. For A-grade leads with generic emails, attempt phone outreach instead.

### 🟡 Acquired Companies Not Caught Early

**The problem:** Many companies in BvD/Crunchbase data have been acquired. Their domains now redirect to the acquirer's website. We were scoring and enriching dead companies.

**Example:** Company X's domain redirects to BigCorp.com — the company no longer exists independently.

**Resolution:** Added redirect detection in the domain verification step (Step 2). If the resolved domain is a different company, flag as acquired. This was added mid-pipeline, so some acquired companies slipped through in early batches.

### 🟡 Orange Slice Credits Are Finite

**The problem:** Orange Slice credits were consumed primarily by Crunchbase SQL queries (32,430 lookups). No remaining credits for additional enrichment.

**Impact:** Cannot run additional Crunchbase queries, company revenue lookups, or `person.contact.get()` through Orange Slice.

**Resolution:** Switched to direct Apollo API calls (10K free credits/month) and Google Maps Places API (free tier) for remaining enrichment. Consider replenishing Orange Slice credits for future batches.

### 🟢 Vibe Scoring False Positives

**The problem:** Some companies with professional-looking websites (high vibe score) turned out to be large enterprises or non-tech companies.

**Resolution:** Vibe score is one signal among many. Blueprint v3 combines it with tech signals, employee count, and other factors. Never DQ or qualify on vibe score alone.

---

## 7. Future Process (Recommended)

The key lesson from this pipeline: **BvD is discovery-only.** Trust nothing from BvD except names and domains.

### Redesigned Pipeline

```
┌─────────────────────────────────────────────────┐
│  PHASE 1: DISCOVERY (Cast Wide Net)              │
│  BvD → names + domains only                      │
│  Crunchbase → names + domains + descriptions     │
│  Accelerators → names + domains + batch info     │
│  Product Hunt / HN → names + domains             │
│  ─────────────────────────────────────────────── │
│  Output: ~80K raw domains                        │
│  Cost: BvD license + Orange Slice credits        │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  PHASE 2: VERIFICATION (Free / Cheap)            │
│  1. Domain resolution (catch redirects/acquired) │
│  2. Vibe scoring (website quality, 0-100)        │
│  3. Apollo org enrichment (LinkedIn employees)   │
│  ─────────────────────────────────────────────── │
│  DQ here: dead sites, parked, >100 employees     │
│  Cost: 1 Apollo credit per org enrichment        │
│  Output: ~20K verified companies                 │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  PHASE 3: QUALIFICATION (Free)                   │
│  1. Blueprint scoring on VERIFIED data only      │
│     - LinkedIn employees (not BvD)               │
│     - Vibe score                                 │
│     - Domain/tech signals                        │
│  2. HubSpot dedup                                │
│  3. Grade assignment (A/B/C/D)                   │
│  ─────────────────────────────────────────────── │
│  Output: ~5K qualified leads (A + B grades)      │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  PHASE 4: PAID ENRICHMENT (A/B Grades Only)      │
│  1. Apollo people search (FREE — find DMs)       │
│  2. Google Maps phone lookup (FREE)              │
│  3. Apollo phone reveals (1 credit — A grade)    │
│  4. Email verification                           │
│  ─────────────────────────────────────────────── │
│  Cost: Minimal — only phone reveals for top leads│
│  Output: ~2.5K enriched, ready-to-contact leads  │
└─────────────────────┬───────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────┐
│  PHASE 5: EXPORT & SYNC                          │
│  1. Generate final XLSX/CSV                      │
│  2. HubSpot import (new leads only)              │
│  3. Update master.db with results                │
└─────────────────────────────────────────────────┘
```

### Key Changes from Current Process

1. **BvD employee/revenue data is NEVER used for scoring.** It's discovery-only.
2. **Apollo org enrichment moves UP** — do it before blueprint scoring, not after.
3. **Score on verified data only** — LinkedIn employees, not BvD employees.
4. **Paid enrichment is LAST** — only spend credits on already-qualified leads.
5. **HubSpot dedup before any paid enrichment** — don't pay to enrich leads we already have.

### Credit Budget (Monthly)

| Resource | Free Tier | Cost for Pipeline |
|----------|-----------|-------------------|
| Apollo credits | 10,000/month | ~4,000 for org enrichment + ~500 phone reveals |
| Google Maps | 10,000/month | ~3,000 lookups |
| Vibe scoring | Unlimited (self-hosted) | $0 |
| Blueprint scoring | Unlimited (local compute) | $0 |
| HubSpot dedup | Unlimited (API) | $0 |

---

## 8. Master Database Reference

### Location
```
jordan.ai/pipeline/master.db
```

### Schema

```sql
CREATE TABLE companies (
    domain TEXT PRIMARY KEY,           -- Normalized (lowercase, no www.)
    company_name TEXT,
    website TEXT,
    state TEXT,
    bvd_employees INTEGER,             -- BvD-reported (UNRELIABLE)
    linkedin_employees INTEGER,        -- LinkedIn-verified (RELIABLE)
    revenue_th_usd REAL,               -- BvD revenue in thousands USD
    description TEXT,
    blueprint_score REAL,              -- 0-100
    grade TEXT,                        -- A/B/C/D
    vibe_score REAL,                   -- From CSV (may be older)
    vibe_score_cached REAL,            -- From latest vibe JSON cache
    tech_score REAL,                   -- Blueprint tech component (max 65)
    non_tech_score REAL,               -- Blueprint non-tech component (max 35)
    signals TEXT,                      -- Pipe-delimited blueprint signals
    vibe_signals_cached TEXT,          -- Pipe-delimited vibe signals
    vibe_fetched INTEGER,              -- 1 if website was successfully fetched
    dm_name TEXT,                      -- Decision maker name
    dm_title TEXT,                     -- Decision maker title
    dm_email TEXT,                     -- Decision maker email
    dm_phone TEXT,                     -- Decision maker phone (Apollo reveal)
    dm_linkedin TEXT,                  -- Decision maker LinkedIn URL
    contact2_name TEXT,                -- Second contact
    contact2_title TEXT,
    contact2_email TEXT,
    contact2_phone TEXT,
    contact2_linkedin TEXT,
    contact3_name TEXT,                -- Third contact
    contact3_title TEXT,
    contact3_email TEXT,
    contact3_phone TEXT,
    contact3_linkedin TEXT,
    company_phone TEXT,                -- Main company phone
    apollo_phone TEXT,                 -- Phone from Apollo reveal
    gmaps_phone TEXT,                  -- Phone from Google Maps
    gmaps_address TEXT,
    gmaps_place_name TEXT,
    has_software_engineer INTEGER,
    recent_news TEXT,
    hiring_signal TEXT,
    tech_stack TEXT,                   -- Apollo tech stack UUIDs
    twitter TEXT,
    github TEXT,
    source TEXT,                       -- Source tag from CSV
    original_source TEXT,              -- First discovery source
    entity_type TEXT,                  -- BvD entity type
    sic_code TEXT,
    date_of_incorporation TEXT,
    enrichment_sources TEXT,           -- Comma-separated enrichment sources
    apollo_name TEXT,                  -- Company name per Apollo
    apollo_industry TEXT,              -- Industry per Apollo
    accelerator TEXT,                  -- Accelerator program name
    in_hubspot INTEGER,                -- 1 if domain exists in HubSpot
    linkedin_verified INTEGER,         -- 1 if Apollo org enrichment done
    has_phone INTEGER,                 -- 1 if any phone number exists
    has_email INTEGER,                 -- 1 if any email exists
    acquired INTEGER,                  -- 1 if company appears acquired
    enrichment_status TEXT,            -- Summary of enrichment done
    dq_reason TEXT,                    -- Pipe-delimited DQ reasons
    last_updated TEXT                  -- ISO timestamp
);
```

### Indexes
- `idx_grade` — Grade (A/B/C/D)
- `idx_blueprint_score` — Blueprint score
- `idx_source` — Source tag
- `idx_original_source` — First discovery source
- `idx_in_hubspot` — HubSpot match
- `idx_linkedin_verified` — LinkedIn verification
- `idx_has_phone` — Has phone number
- `idx_has_email` — Has email
- `idx_vibe_score` — Vibe score

### Quick Queries

```sql
-- Top A-grade leads not in HubSpot with phone numbers
SELECT domain, company_name, grade, blueprint_score, dm_name, dm_phone, company_phone
FROM companies
WHERE grade = 'A' AND in_hubspot = 0 AND has_phone = 1
ORDER BY blueprint_score DESC;

-- Companies with LinkedIn verification but no phone
SELECT domain, company_name, linkedin_employees, grade
FROM companies
WHERE linkedin_verified = 1 AND has_phone = 0 AND grade IN ('A', 'B')
ORDER BY blueprint_score DESC;

-- Source distribution for A-grade leads
SELECT source, COUNT(*) as cnt
FROM companies
WHERE grade = 'A'
GROUP BY source
ORDER BY cnt DESC;

-- Find companies needing enrichment (scored but not LinkedIn-verified)
SELECT domain, company_name, blueprint_score, grade
FROM companies
WHERE grade IN ('A', 'B') AND linkedin_verified = 0
ORDER BY blueprint_score DESC
LIMIT 100;
```

### Build Script
```
python3 jordan.ai/pipeline/build_master_db.py
```
Rebuilds the entire database from source CSVs and JSONs. Safe to re-run (drops and recreates).

---

*This document is the single source of truth for the Jordan.AI lead generation pipeline. Update it as the process evolves.*
