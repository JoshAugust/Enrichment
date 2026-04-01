# Corgi Outreach — Lead Verification System

> **Version:** 1.0 · **Built:** 2026-03-26

---

## Overview

Every company in the Corgi Outreach database receives a **Verification Score** (0–100) composed of four equally-weighted sub-scores. The system catches data gaps, stale records, and low-contact companies before they waste outreach budget.

---

## Score Breakdown

### Overall Formula

```
verification_score = (
  data_completeness_score * 0.25 +
  data_freshness_score    * 0.25 +
  data_accuracy_score     * 0.25 +
  contact_quality_score   * 0.25
)
```

---

### 1. `data_completeness_score` (0–100) — *25% weight*

Measures how many key profile fields are filled in.

| Field | Weight |
|---|---|
| Website URL | 12% |
| Description | 12% |
| Total Raised | 10% |
| Headquarters | 8% |
| Phone | 8% |
| LinkedIn URL | 8% |
| Last Funding Round | 8% |
| Investors | 8% |
| Industry Segment | 8% |
| GPU Scale Estimate | 8% |
| Founded Year | 5% |
| Employee Count | 5% |

**Interpretation:**
- `100` — all fields present, fully profiled
- `70–99` — most data present, minor gaps
- `40–69` — several key fields missing
- `<40` — skeleton record, needs heavy enrichment

---

### 2. `data_freshness_score` (0–100) — *25% weight*

Measures how recently the company was enriched via `last_enriched_at`.

| Days Since Last Enrichment | Score |
|---|---|
| 0–7 days | 100 |
| 8–30 days | 90 |
| 31–60 days | 70 |
| 61–90 days | 50 |
| 91–180 days | 30 |
| 180+ days | 10 |
| Never enriched | 0 |

**Interpretation:**
- High score → data is current; outreach can proceed immediately
- Low score → data may be stale; re-enrich before high-value outreach

---

### 3. `data_accuracy_score` (0–100) — *25% weight*

Cross-checks the data itself for correctness. Runs up to 8 automated checks:

| Check | Points | What it validates |
|---|---|---|
| `website_format` | 10 | URL is a valid parseable URI |
| `website_alive` | 30 | Live HTTP HEAD request returns 2xx/3xx |
| `linkedin_format` | 10 | URL contains `linkedin.com/company` |
| `phone_format` | 10 | Phone digit count is 10–15 |
| `description_quality` | 10 | Description ≥ 80 characters |
| `funding_cross_ref` | 15 | Both `total_raised` + `last_funding_round` present |
| `founded_year_valid` | 5 | Year is between 1990 and current year |
| `headquarters_valid` | 10 | HQ string has ≥ 3 characters |

**Interpretation:**
- `90–100` — high confidence; data checks out
- `60–89` — mostly good with some caveats (missing URL, short description)
- `<60` — significant accuracy concerns; manual review recommended

---

### 4. `contact_quality_score` (0–100) — *25% weight*

Rates the quality and coverage of known contacts at this company.

| Metric | Max Points |
|---|---|
| Contact count (8pts per contact, max 25) | 25 |
| % of contacts with email | 35 |
| % of contacts with phone | 20 |
| % of contacts with title | 20 |

**Interpretation:**
- `80+` — multiple named contacts with emails; highly reachable
- `50–79` — some contacts but gaps (missing emails, phones)
- `<50` — few or low-quality contacts; prospect is harder to reach

---

## Status Thresholds

| Score Range | `verification_status` | Meaning |
|---|---|---|
| **80–100** | `verified` | 🟢 **Strong lead** — data is complete, fresh, and accurate; ready for outreach |
| **50–79** | `pending` | 🟡 **Needs work** — usable but enrichment recommended before priority outreach |
| **0–49** | `flagged` | 🔴 **Review required** — significant data gaps, stale, or unreachable; do not prioritize |

---

## `verification_log` Table

Every check writes a row to `verification_log`:

```sql
SELECT * FROM verification_log
WHERE entity_id = '<company_id>'
ORDER BY created_at DESC;
```

| Column | Description |
|---|---|
| `entity_type` | `company` or `contact` |
| `entity_id` | UUID of the record |
| `check_type` | e.g. `website_alive`, `data_completeness`, `contact_reachable` |
| `result` | `pass` / `fail` / `warning` / `skip` |
| `details` | Human-readable explanation |
| `score_impact` | Points this check contributed |
| `created_at` | Timestamp of the check |

---

## Running the Verifier

```bash
# Verify all companies (with live HTTP checks)
node backend/scripts/verify-leads.js

# Verify all companies (skip live HTTP, faster)
node backend/scripts/verify-leads.js --no-http

# Verify a single company
node backend/scripts/verify-leads.js --id <company_uuid>

# Dry run (no DB writes)
node backend/scripts/verify-leads.js --dry-run

# Verbose output (per-check details)
node backend/scripts/verify-leads.js --verbose

# JSON output (pipe to file)
node backend/scripts/verify-leads.js --json > results.json
```

---

## Useful Queries

```sql
-- Top leads by score
SELECT name, type, priority, verification_score, verification_status
FROM companies ORDER BY verification_score DESC LIMIT 20;

-- Flagged companies needing review
SELECT name, verification_score, verification_notes
FROM companies WHERE verification_status = 'flagged' ORDER BY verification_score ASC;

-- Score distribution
SELECT
  CASE
    WHEN verification_score >= 80 THEN '80-100 (verified)'
    WHEN verification_score >= 50 THEN '50-79 (pending)'
    ELSE '0-49 (flagged)'
  END as bucket,
  COUNT(*) as count
FROM companies GROUP BY bucket;

-- Companies with no contacts
SELECT c.name, c.verification_score
FROM companies c
LEFT JOIN contacts ct ON ct.company_id = c.id
WHERE ct.id IS NULL;

-- Recent verification activity
SELECT entity_id, check_type, result, details, created_at
FROM verification_log ORDER BY created_at DESC LIMIT 50;
```

---

## Recommended Workflow

1. **Run verifier** after each enrichment batch: `node backend/scripts/verify-leads.js --no-http`
2. **Prioritize outreach** to `verified` (80+) companies first
3. **Re-enrich** `pending` companies (50–79) before next outreach wave
4. **Review `flagged`** companies manually — some may need to be removed or researched further
5. **Re-run weekly** to catch freshness decay (data aging lowers `data_freshness_score`)

---

*Generated by the Corgi Outreach Verification System · Brock (AI)*
