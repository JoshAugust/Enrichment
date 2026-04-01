# Verification System Report

**Built:** 2026-03-27  
**Engineer:** Brock (Eragon sub-agent, verification-system-builder)  
**Status:** ✅ Production-deployed, all 427 companies scored

---

## Architecture Overview

The Corgi verification system scores each company 0-100 based on deterministic checks
against local database fields and live HTTP probes. It consists of:

```
backend/src/research/verification-engine.js   ← Core scoring engine
backend/src/api/verification-routes.js        ← REST API layer
frontend/src/components/VerificationBadge.jsx ← React badge component
frontend/src/pages/Companies.jsx              ← Badge wired into company list
frontend/src/pages/Dashboard.jsx              ← Verification Health stat card
backend/src/db.js                             ← Schema extended (verification_checks table)
backend/src/server.js                         ← Routes registered
```

### Scoring Logic

**Base score: 50**

| Check | Impact | Condition |
|-------|--------|-----------|
| `website_live` | +15 | HTTP 2xx/3xx response |
| `website_live` | -20 | Dead / unreachable / no domain |
| `company_exists` | +10 | Rich enrichment data or description > 100 chars |
| `company_exists` | +5 | Partial — description 20-100 chars |
| `linkedin_exists` | +10 | LinkedIn URL present |
| `contact_verified` | +10 | ≥1 contact with email in DB |
| `contact_verified` | -15 | No contacts at all |
| `funding_verified` | +5 | `total_raised` not null |
| `hq_verified` | +5 | `headquarters` present |
| `hq_verified` | -10 | `headquarters` missing |
| `data_cross_check` | +5 | Description > 50 chars |
| `data_cross_check` | -10 | Description missing or < 20 chars |
| `data_cross_check` | +5 | `founded_year` present |
| `data_cross_check` | -5 | `last_enriched_at` is null |
| **BONUS** `email_valid` | +10 | Contact with `email_verified=1` or `email_confidence > 0.7` |
| **BONUS** `contact_verified` | +5 | Contact has LinkedIn URL |
| **BONUS** `data_cross_check` | +5 | `recent_news` present |

**Score clamped to 0–100**

**Status mapping:**
- `0–30` → `flagged` 🔴
- `31–59` → `unverified` ⬜
- `60–79` → `partial` 🟡
- `80–100` → `verified` 🟢

---

## Files Created / Modified

### Created
| File | Purpose |
|------|---------|
| `backend/src/research/verification-engine.js` | Core engine: `verifyCompany()`, `verifyAll()`, `getVerificationSummary()` |
| `backend/src/api/verification-routes.js` | Express router: 4 REST endpoints + `companyVerificationRouter` |
| `frontend/src/components/VerificationBadge.jsx` | Colored shield badge (sm/md sizes, all 4 statuses) |
| `corgi-outreach/VERIFICATION_SYSTEM_REPORT.md` | This file |

### Modified
| File | Change |
|------|--------|
| `backend/src/db.js` | Added `verification_checks` table migration + 2 contacts columns (`verification_notes`, `agent_verified_at`) |
| `backend/src/server.js` | Registered `/api/verification` and `/api/companies/:id/verification` routes |
| `frontend/src/pages/Companies.jsx` | Imported `VerificationBadge`, renders badge in company card badges row |
| `frontend/src/pages/Dashboard.jsx` | Imported `VerificationBadge` + `ShieldCheck`, added Verification Health stat card, fetches `/api/verification/summary` |

---

## Score Distribution — Initial Run (427 companies, 0 errors)

| Status | Count | Avg Score |
|--------|-------|-----------|
| ✅ Verified (80-100) | **313** | 98.2 |
| 🟡 Partial (60-79) | **85** | 67.0 |
| ⬜ Unverified (31-59) | **25** | 48.0 |
| 🔴 Flagged (0-30) | **4** | 30.0 |
| **Total** | **427** | **88.4 avg** |

**Total verification_checks rows written:** 3,409  
**Score range:** 30–100  
**Overall avg score:** 88.4

---

## API Endpoints — QA Agent Reference

All endpoints are on the backend server (default port 3001).

### GET /api/verification/summary
Returns aggregate counts and average score.

```json
{
  "total": 427,
  "verified": 313,
  "partial": 85,
  "unverified": 25,
  "flagged": 4,
  "avgScore": 88.4
}
```

### POST /api/verification/company/:id
Re-run verification for a single company. Returns updated score.

```bash
curl -X POST http://localhost:3001/api/verification/company/{company_id}
```

```json
{
  "success": true,
  "companyId": "...",
  "name": "Acme Corp",
  "score": 85,
  "status": "verified",
  "checksRun": 9
}
```

### POST /api/verification/batch
Re-run verification for N companies (ordered by qualification_score DESC).

```bash
curl -X POST http://localhost:3001/api/verification/batch \
  -H "Content-Type: application/json" \
  -d '{"limit": 427}'
```

```json
{
  "success": true,
  "total": 427,
  "verified": 313,
  "partial": 85,
  "unverified": 25,
  "flagged": 4,
  "errors": 0
}
```

### GET /api/companies/:id/verification
Get all individual verification checks for a company.

```bash
curl http://localhost:3001/api/companies/{company_id}/verification
```

```json
{
  "company": {
    "id": "...",
    "name": "Acme Corp",
    "verification_score": 85,
    "verification_status": "verified",
    "verification_notes": null,
    "verified_at": "2026-03-27T..."
  },
  "checks": [
    {
      "id": "...",
      "company_id": "...",
      "check_type": "website_live",
      "result": "pass",
      "score_impact": 15,
      "notes": "HTTP 200 at https://acmecorp.com",
      "source": "agent_qa",
      "checked_at": "2026-03-27T..."
    },
    ...
  ]
}
```

### GET /api/verification/company/:id/checks
Alias for the above, mounted under `/api/verification/`.

---

## Notes for QA Agents

1. **Re-verify a company after manual QA:** `POST /api/verification/company/:id`
2. **Trigger full batch re-run after enrichment:** `POST /api/verification/batch` with `{ "limit": 427 }`
3. **Set `source` context:** The engine always writes `source: "agent_qa"`. Manual overrides should be written directly to `verification_checks` with `source: "manual"`.
4. **Email confidence bonus:** If you verify a contact email, set `email_verified = 1` or `email_confidence > 0.7` in the contacts table — the next re-verify will pick up +10 bonus points.
5. **LinkedIn bonus:** Populate `contacts.linkedin_url` to add +5 points on next re-verify.
6. **DB table:** `verification_checks` — individual check log. `companies.verification_score/status` — rolled-up scores.

---

## Issues Encountered

- `verification_log` table already existed in the DB with a different schema. The new `verification_checks` table was created separately to avoid conflicts — both tables coexist without interference.
- Some contacts already had `verification_score` and `email_verified` columns from a prior schema; the engine correctly reads those for the bonus email check.
- Website probes use a 5s HEAD timeout with up to 3 redirect follows. Companies with slow or redirecting domains may score conservatively (the `-20` for unreachable is only applied if the final probe fails entirely).
