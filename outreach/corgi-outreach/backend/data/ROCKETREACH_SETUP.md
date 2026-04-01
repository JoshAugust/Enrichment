# RocketReach API — Setup Guide

## What Is It?

RocketReach is a B2B contact-data platform providing verified professional email addresses, phone numbers, and company firmographic data. It's one of the most accurate email-finder services available, with a database of 700 M+ professionals across 60 M+ companies.

The Corgi integration uses the **RocketReach API v2** to:
- Enrich **companies** with employee count, industry, revenue band, headquarters, and LinkedIn URL
- Enrich **contacts** with verified emails, direct-dial phone numbers, LinkedIn URL, and current title

---

## Getting an API Key

### Free Trial (5 lookups/month, no credit card)

1. Go to **https://rocketreach.co** and click **Sign Up Free**
2. Verify your email
3. Navigate to **Settings → API** (or **https://rocketreach.co/account/api**)
4. Copy your API key

### Paid Plan Required for Serious Use

Full API access is included on the **Ultimate Plan** ($2,099/year or ~$209/month).
See pricing section below.

---

## Environment Variable

Add to your `.env` file (or export in your shell):

```bash
ROCKETREACH_API_KEY=your_api_key_here
```

The integration reads `process.env.ROCKETREACH_API_KEY` and **gracefully skips** enrichment if the key is not set — no crashes, no broken pipeline.

---

## What Data It Returns

### Company Enrichment (`entityType = 'company'`)

Calls `GET /api/v2/company/lookup?name=<name>&domain=<domain>`

| Field            | Pipeline Column    | Example                    |
|------------------|--------------------|----------------------------|
| `description`    | `description`      | "Cloud analytics platform" |
| `num_employees`  | `employee_count`   | "250"                      |
| `industry`       | `industry_segment` | "Software"                 |
| `city`/`country` | `headquarters`     | "San Francisco, US"        |
| `linkedin_url`   | `linkedin_url`     | https://linkedin.com/...   |
| `twitter_url`    | `twitter_url`      | https://twitter.com/...    |
| `revenue`        | `total_raised`     | "$10M-$50M"                |
| `funding_stage`  | `financing_status` | "Series B"                 |
| `founded`        | `founded_year`     | 2018                       |

Additionally, if fewer than 3 contacts exist for the company, the integration calls `POST /api/v2/person/search` (free, no credits) to find senior contacts (CEO, CTO, VP, Director, etc.) and returns them in `result.contacts[]`.

> ⚠️ **Company Lookup requires "Company Export" credits**, which are a separate add-on purchased via RocketReach sales (`sales@rocketreach.co`). Without them, the company lookup returns 402 and is gracefully skipped.

### Contact Enrichment (`entityType = 'contact'`)

Calls `GET /api/v2/person/lookup?name=<name>&current_employer=<company>`

| Field             | Pipeline Column    | Notes                            |
|-------------------|--------------------|----------------------------------|
| `emails[].email`  | `email`            | Verified professional email      |
| `emails[].valid`  | `email_confidence` | 0.95 if verified, 0.6 if unverified |
| `phones[].number` | `phone`            | Direct dial (Pro/Ultimate only)  |
| `linkedin_url`    | `linkedin_url`     | Profile URL                      |
| `current_title`   | `title`            | Current job title                |
| `summary`         | `bio`              | Professional bio                 |

> ⚠️ **Person lookups charge 1 credit per verified result.** The integration automatically skips contacts that already have an email to avoid unnecessary credit usage.

---

## Pricing Summary (2025)

| Plan         | Price              | Annual Lookups | API Access | Notes                          |
|--------------|--------------------|----------------|------------|--------------------------------|
| **Free**     | $0                 | 5/month        | ❌         | No credit card needed          |
| **Essentials** | $399/yr (~$33/mo) | 1,200/yr      | ❌         | Email only                     |
| **Pro**      | $899/yr (~$75/mo)  | 3,600/yr       | ❌         | Adds phones, bulk lookups      |
| **Ultimate** | $2,099/yr (~$175/mo) | 10,000/yr   | ✅         | Full API, Salesforce, org charts |
| **Enterprise** | $6,000+/yr       | Custom         | ✅         | Custom SLA, dedicated support  |

**Credit system:**
- 1 lookup credit = 1 person profile that returns ≥1 verified email or phone
- Overage: $0.30–$0.45 per lookup
- Person **search** (browsing profiles) = **free**, no credits deducted
- Company lookups require **Company Exports** credits (separate SKU — contact sales)

---

## Rate Limits

- **General limit**: ~5 requests/second per API key
- **429 Too Many Requests**: check `Retry-After` header; integration automatically backs off
- **Best practice**: don't parallelize more than 3–4 lookups simultaneously

The integration implements:
- Exponential backoff on 429 (respects `Retry-After`, max 4 retries)
- Exponential backoff on 5xx errors
- Async person lookup polling (up to 8 attempts, 3s apart)

---

## Useful Links

- **API Docs**: https://docs.rocketreach.co/reference/rocketreach-api
- **Pricing**: https://rocketreach.co/pricing
- **Rate Limits**: https://docs.rocketreach.co/reference/rate-limits
- **Sign Up / API Key**: https://rocketreach.co/account/api
- **Sales (Company Exports)**: sales@rocketreach.co

---

## Testing the Integration

```bash
# Verify your key works
node -e "
  process.env.ROCKETREACH_API_KEY = 'your_key';
  const rr = require('./src/research/sources/rocketreach');
  rr.getAccountInfo().then(console.log).catch(console.error);
"

# Test a person lookup
node -e "
  process.env.ROCKETREACH_API_KEY = 'your_key';
  const rr = require('./src/research/sources/rocketreach');
  rr.lookupPerson('your_key_here', { name: 'Elon Musk', currentEmployer: 'Tesla' }).then(console.log);
"
```

Or use the enrichment pipeline directly:

```bash
node -e "
  process.env.ROCKETREACH_API_KEY = 'your_key';
  const p = require('./src/research/enrichment-pipeline');
  p.enrichCompany('COMPANY_ID_HERE', { sourcesToRun: ['rocketreach'] }).then(console.log);
"
```
