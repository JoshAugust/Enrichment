# RocketReach Integration Report

**Date:** 2026-03-27  
**Author:** Brock (subagent: rocketreach-integration)  
**Status:** ✅ Complete — ready to activate with API key

---

## What Was Built

### Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `backend/src/research/sources/rocketreach.js` | ✅ Created | Full enrichment source module |
| `backend/src/research/enrichment-pipeline.js` | ✅ Modified | Added `'rocketreach'` to sources map |
| `backend/data/ROCKETREACH_SETUP.md` | ✅ Created | Setup guide with pricing, env vars, usage |

---

## The Integration (`rocketreach.js`)

### Architecture

The module follows the established enrichment source pattern:

```js
async function enrich(entityType, entityId, existingData) → enrichmentResult
```

It handles two entity types differently:

#### Company Enrichment Flow
1. Call `GET /api/v2/company/lookup?name=X&domain=Y` — returns firmographic data
2. Map response → `{ employee_count, industry_segment, headquarters, linkedin_url, description, founded_year, total_raised, financing_status }`
3. If `contacts.length < 3`: call `POST /api/v2/person/search` (free, no credits) to find senior contacts → returns in `result.contacts[]`

#### Contact Enrichment Flow
1. Guard: skip if contact already has email (preserves credits)
2. Call `GET /api/v2/person/lookup?name=X&current_employer=Y` — may be async
3. If `status: "searching"`: poll up to 8×, 3 seconds apart until `status: "complete"`
4. Map response → `{ email, email_confidence, phone, linkedin_url, title, bio }`

### Key Technical Details

**Retry/backoff strategy:**
- 429 Too Many Requests → honour `Retry-After` header, then exponential backoff (max 4 retries, max 30s wait)
- 5xx Server Errors → exponential backoff (1s → 2s → 4s → 8s)
- 402 Payment Required → log warning and gracefully skip (handles credit exhaustion / missing Company Exports add-on)
- 401/403 → throw with clear message pointing to `ROCKETREACH_API_KEY`

**Credit-preserving behaviour:**
- Contacts with existing emails are **skipped** (no credit wasted)
- Person search (company → contacts discovery) is **free** — only lookup deducts credits
- Company lookup requires separate "Company Export" credits; 402 is handled gracefully

**Async person lookup:**
- RocketReach lookups can return `status: "searching"` — the module polls every 3s, max 8 attempts (~24s timeout)

---

## What the RocketReach API Offers

### API Endpoints Used

| Endpoint | Method | Credits | What it returns |
|----------|--------|---------|-----------------|
| `/api/v2/company/lookup` | GET | Company Export credit | Firmographics (size, industry, HQ, revenue, LinkedIn) |
| `/api/v2/person/lookup` | GET | 1 lookup credit | Verified emails, phones, LinkedIn URL, title |
| `/api/v2/person/search` | POST | **Free** | Profile stubs (name, title, company, LinkedIn) — no contact data |
| `/api/v2/account/` | GET | Free | Account info, credits remaining |

### Data Quality Notes

- **Emails**: claimed 90%+ accuracy on verified emails (highest confidence in the industry)
- **Phones**: direct-dial numbers — only available on Pro/Ultimate plans
- **Company data**: employee count, industry, HQ, revenue band, LinkedIn URL, Twitter URL
- Person **search** returns profile stubs only — to get actual emails you must call **lookup** (credit-deducting)
- The async lookup pattern (`status: "searching"`) exists because email verification is done in real-time

---

## Pricing Summary

| Plan | Price | Lookups | API? |
|------|-------|---------|------|
| Free | $0/mo | 5/month | ❌ |
| Essentials | ~$33/mo (annual) | 1,200/yr | ❌ |
| Pro | ~$75/mo (annual) | 3,600/yr | ❌ |
| **Ultimate** | **~$175/mo (annual)** | **10,000/yr** | **✅ Full API** |
| Enterprise | $6,000+/yr | Custom | ✅ |

**Bottom line:** You need the **Ultimate plan ($2,099/yr)** for API access. Company lookups require an **additional "Company Exports" add-on** — contact `sales@rocketreach.co`.

Overage lookups: $0.30–$0.45 each.

---

## What's Needed to Activate

### Step 1: Get API Key
1. Sign up at https://rocketreach.co (free tier gives 5 lookups to test)
2. Upgrade to **Ultimate** for production API access
3. Go to **Settings → API** and copy your key

### Step 2: Set Environment Variable
```bash
# In .env file:
ROCKETREACH_API_KEY=your_api_key_here

# Or in shell:
export ROCKETREACH_API_KEY=your_api_key_here
```

### Step 3: Optionally Purchase Company Exports
Contact `sales@rocketreach.co` to add Company Export credits to your plan.  
Without this, company enrichment gracefully skips (returns empty data with a warning) and only contact enrichment runs.

### Step 4: Verify It Works
```bash
cd backend
node -e "
  process.env.ROCKETREACH_API_KEY = 'your_key';
  const rr = require('./src/research/sources/rocketreach');
  rr.getAccountInfo().then(info => {
    console.log('✅ Connected!', JSON.stringify(info, null, 2));
  }).catch(err => console.error('❌', err.message));
"
```

---

## Integration Quality Notes

- **Zero-crash on missing key**: returns `{ skipped: true }` cleanly
- **Zero-crash on 402**: logs warning, skips gracefully (credit exhaustion / missing add-on)
- **Matches existing source pattern**: identical result shape to apollo.js, hunter.js
- **Pipeline auto-picks it up**: the `sources` loop in `enrichment-pipeline.js` will run it alongside all other sources
- **Contact sources already used**: RocketReach runs after the free sources, so the `email` guard prevents duplicate credit spend if another source already found an email
- **Syntax verified**: `node --check` passes on both modified files

---

## Comparison to Existing Sources

| Source | Email Quality | Cost | Company Data | Contacts |
|--------|--------------|------|--------------|----------|
| Hunter (existing) | Good (pattern-based) | Free tier | ❌ | ✅ |
| Apollo (existing) | Good (database) | Free tier | ✅ | ✅ |
| **RocketReach (new)** | **Excellent (real-time verified)** | **$175/mo** | **✅** | **✅** |
| Email Discovery (local) | Pattern guessing | Free | ❌ | ✅ (generated) |

RocketReach is the highest-quality source for verified emails but also the most expensive. Recommend running it **only on priority-A contacts** (or gating it behind a flag) to manage credit spend.
