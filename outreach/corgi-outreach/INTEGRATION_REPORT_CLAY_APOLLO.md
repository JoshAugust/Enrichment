# Integration Report: Clay + Apollo.io
_Built: March 2026_

---

## Summary

Researched both Clay and Apollo.io extensively. Built a full Apollo.io integration into the Corgi enrichment pipeline. Documented Clay strategy. **Apollo is now a live source in the pipeline.**

---

## 1. Clay Research Findings

### What Clay Is
Clay (clay.com) is a B2B enrichment platform that aggregates **150+ data providers** (Apollo, Hunter, Clearbit, ZoomInfo, LinkedIn, PDL, and more) into a spreadsheet-like UI. Its core value proposition is **waterfall enrichment** — trying data sources sequentially until one returns a result.

### Does Clay Have a Public API?
**No.** As of early 2026, Clay has no public REST API for external programmatic access. Integration options are:

| Method | Available On | Notes |
|---|---|---|
| Inbound webhooks (push data into Clay) | Explorer+ ($349/mo) | Clay processes records and enriches them |
| HTTP API outbound (Clay calls your API) | Explorer+ | Clay's "Sculptor" generates API configs from plain English |
| Enterprise API (Clay's own data layer) | Enterprise only | Domain → company, email → person — not the full waterfall |
| Make/Zapier connector | Any plan | UI-based automation, no code |

### Clay Pricing
| Plan | Monthly | Credits | Notable Features |
|---|---|---|---|
| Free | $0 | 100/mo | Basic enrichment |
| Starter | $149 | 2,000/mo | Core enrichment |
| Explorer | $349 | 10,000/mo | Webhooks, HTTP API |
| Pro | $800 | 50,000/mo | CRM sync |
| Enterprise | Custom | Custom | Enterprise API |

### Clay's Waterfall Enrichment Model
Clay's killer feature: it queries multiple data sources **sequentially**, stopping at the first hit. This maximizes email coverage while minimizing credit spend. Example:

```
Domain: target-company.com
→ Try Apollo          → Not found ❌
→ Try Hunter.io       → Not found ❌ 
→ Try Clearbit        → Found ✅ → STOP (only Clay credits used, not all three)
```

This concept is documented in `backend/data/CLAY_STRATEGY.md`.

### Corgi + Clay Recommendation
**Use Clay manually, not programmatically:**
- No API = no clean code integration
- Best for one-off list enrichment campaigns by sales/marketing
- Reconsider if they release a proper API or if email coverage drops below 40%
- Future option: push records to Clay via webhook, receive enriched data via callback

---

## 2. Apollo.io Research Findings

### What Apollo Is
Apollo.io is an all-in-one B2B prospecting platform with a **280M+ contact database** and a well-documented REST API. Unlike Clay, Apollo has a proper API that works great for code-level integration.

### API Endpoints Used

#### Organization Enrichment
```
GET https://api.apollo.io/api/v1/organizations/enrich?domain=<domain>
Header: x-api-key: YOUR_KEY
```
Returns: industry, employee count, HQ address, funding, LinkedIn URL, phone, founded year, etc.
**Cost: 1 credit per call**

#### People API Search (Decision-Makers)
```
POST https://api.apollo.io/api/v1/mixed_people/api_search
Body: {
  organization_domains: ["target.com"],
  person_titles: ["CEO", "CTO", "CFO", ...],
  per_page: 25
}
```
Returns: names, titles, LinkedIn URLs, seniority  
**Cost: FREE — does not consume credits**  
**Note: Does NOT return email addresses (those require enrichment credits)**

#### People Enrichment (Email Discovery)
```
POST https://api.apollo.io/api/v1/people/match
Body: { first_name, last_name, organization_name, domain, linkedin_url }
```
Returns: email, phone, full profile  
**Cost: 1 credit per call**

### Authentication
All requests require: `x-api-key` header (or `api_key` in request body)

### Free Tier Limits
| Metric | Free Tier |
|---|---|
| Credits/month | 100 (or 10,000 with verified corporate domain) |
| API calls/day | 600 |
| API calls/min | 50 |
| People Search | Free (unlimited, no credits) |
| Org enrichment | 1 credit per call |
| People enrichment | 1 credit per call |

### Paid Tier Limits
| Plan | Price | Credits | Calls/day |
|---|---|---|---|
| Basic | $49/user/mo | 5,000 | 2,000 |
| Professional | $79/user/mo | 10,000 | 2,000 |
| Organization | $119/user/mo | 15,000 | Higher |

---

## 3. What Was Built

### File: `backend/src/research/sources/apollo.js`

**Full-featured Apollo enrichment source with:**

1. **`enrichOrganization(domain)`** — GET `/organizations/enrich`
   - Normalizes domain (strips protocol/trailing slashes)
   - Maps Apollo fields → Corgi DB schema
   - Returns: description, industry, employee_count, headquarters, total_raised, last_funding_round, linkedin_url, phone, founded_year

2. **`findDecisionMakers(domain, orgName)`** — POST `/mixed_people/api_search`
   - Searches for 20 specific decision-maker titles (CEO, CTO, CFO, VP Finance, Head of Infrastructure, etc.)
   - **Free call — zero credits consumed**
   - Returns: name, title, linkedin_url, seniority (emails empty unless enrichment done)

3. **`enrichPerson(params)`** — POST `/people/match`
   - Enriches a specific contact by name + company
   - Returns: email, phone, title, linkedin_url
   - Called for contacts missing emails (1 credit each)

4. **`enrich(entityType, entityId, existingData)`** — Pipeline interface
   - Company flow: runs org enrichment + decision-maker discovery
   - Contact flow: runs people enrichment only if email is missing
   - Gracefully handles: missing API key (skips cleanly), rate limits (429), auth errors, timeouts
   - Returns: `{ success, data, contacts, skipped, skipReason, error }`

**Decision-maker titles searched:**
CEO, Chief Executive Officer, CTO, Chief Technology Officer, CFO, Chief Financial Officer, VP Finance, Vice President Finance, VP of Finance, Head of Finance, Head of Infrastructure, VP Infrastructure, VP Engineering, CIO, Chief Information Officer, COO, Chief Operating Officer, VP Operations, Head of Operations, President, Co-Founder, Founder

### File: `backend/src/research/enrichment-pipeline.js` (modified)

Two changes:

**1. Apollo added to sources object:**
```javascript
const sources = {
  // ... existing sources ...
  'apollo': require('./sources/apollo'),
};
```

**2. `applyApolloContacts(companyId, contacts)` function added:**
- Upserts Apollo-discovered contacts into the `contacts` table
- Handles contacts with **no email** (Apollo search returns names/titles/LinkedIn without emails)
- Deduplicates by email (if present) and by name (case-insensitive)
- Updates existing contacts' title/linkedin_url if those fields are empty
- Does NOT overwrite existing good data
- Called when `sourceName === 'apollo' && result.contacts.length > 0`

### File: `backend/data/CLAY_STRATEGY.md` (new)

Complete strategy document covering:
- What Clay is and how it works
- API access options (or lack thereof)
- Waterfall enrichment model explained
- Clay vs Apollo comparison table
- Corgi-specific recommendations
- Future integration path (webhooks)
- Pseudocode for a true waterfall implementation

---

## 4. Configuration

To enable Apollo enrichment, set the environment variable:

```bash
APOLLO_API_KEY=your_key_here
```

Get a free API key at: https://app.apollo.io/settings/integrations/api

**If the key is not set**, the source silently skips with `{ skipped: true, skipReason: 'APOLLO_API_KEY not configured' }` — no errors, no broken pipeline.

---

## 5. Verification

```
✅ apollo.js syntax valid (node -e "require('./...')")
✅ Pipeline loads with 'apollo' in sources list
✅ applyApolloContacts function added to pipeline
✅ Pipeline status shows 12 sources (was 11)
```

---

## 6. Recommended Next Steps

1. **Get Apollo API key** — Free tier at app.apollo.io/settings/integrations/api
2. **Test on a single company**: 
   ```bash
   APOLLO_API_KEY=xxx node -e "
   const p = require('./backend/src/research/enrichment-pipeline.js');
   p.enrichCompany('COMPANY_ID', { sourcesToRun: ['apollo'] }).then(console.log);
   "
   ```
3. **Prioritize credit usage** — Use People Search (free) for prospecting; save People Enrichment credits for top-priority contacts only
4. **Monitor credit burn** — Apollo dashboard shows usage at app.apollo.io/settings/integrations/api
5. **Consider Pro/Basic plan** ($49/mo) once free tier proves value — unlocks 5,000 credits/mo

---

## 7. Apollo vs Clay: Final Verdict for Corgi

| Criterion | Apollo | Clay |
|---|---|---|
| Code integration | ✅ Excellent REST API | ❌ No public API |
| Free tier | ✅ 100-10k credits/mo | ✅ 100 credits/mo |
| Decision-maker data | ✅ 280M contacts | ✅ 150+ sources |
| Waterfall enrichment | ❌ Single source | ✅ Native feature |
| Programmatic access | ✅ Fully scriptable | ❌ Webhooks only |
| Best for Corgi | **Primary API source** | **Manual campaigns** |

**Apollo is built and wired. Clay is documented for when we need manual list enrichment at scale.**
