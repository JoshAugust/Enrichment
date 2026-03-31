# LinkedIn Data Extraction: Methods, Tools, Legal Landscape

> Last updated: 2026-03-29

---

## Table of Contents

1. [Proxycurl API](#1-proxycurl-api)
2. [PhantomBuster](#2-phantombuster)
3. [LinkedIn Sales Navigator](#3-linkedin-sales-navigator)
4. [Evaboot](#4-evaboot)
5. [hiQ Labs v LinkedIn — Legal Outcome](#5-hiq-labs-v-linkedin--legal-outcome)
6. [LinkedIn ToS Enforcement](#6-linkedin-tos-enforcement)
7. [Alternative Approaches](#7-alternative-approaches)
8. [Summary Comparison Table](#8-summary-comparison-table)
9. [Recommendations](#9-recommendations)

---

## 1. Proxycurl API

### What It Is

A REST API by Nubela that scrapes LinkedIn in real-time and returns structured JSON. No browser automation — you send an API call, get profile data back. Designed for developers building enrichment pipelines.

> **⚠️ Status (2025):** LinkedIn sued Proxycurl in January 2024. Proxycurl shut down, citing LinkedIn's "unlimited war chest" via Microsoft. The court entered a permanent injunction requiring Proxycurl to delete all LinkedIn data and cease unauthorized access. **Proxycurl is no longer operational as of early 2025.**

### Data Returned (50+ fields per person profile)

- **Basic:** First name, last name, headline, summary, profile picture, gender (inferred), salary range (inferred)
- **Experience:** Full work history — company, title, description, start/end dates
- **Education:** School, degree, field of study, dates
- **Skills & Certifications:** Languages, certifications with authorities
- **Extras:** Volunteer work, projects, recommendations, LinkedIn groups, interests
- **"People Also Viewed"** — related profiles
- **Contact info (extra credits):** Personal email, phone numbers, Twitter/Facebook/GitHub handles

Company profiles, job listings, and employee listing endpoints also available.

### Pricing (as of early 2025, before shutdown)

| Plan | Cost | Credits | Per-Credit Cost |
|------|------|---------|-----------------|
| Pay-as-you-go | From $10 | Variable | Higher per-credit |
| Starter | $49/mo | 2,500 | ~$0.02 |
| Growth | $199/mo | 10,000 | ~$0.02 |
| Enterprise | $3,000/mo | Custom | Negotiable |

- 1 credit = 1 person profile lookup
- Extra credits for email finder, phone, social handles
- Monthly plans require 12-month contract (auto-renews)

### Rate Limits

- **Default:** 300 requests/minute (burst: 1,500 per 5 minutes)
- **Max theoretical daily throughput:** ~432,000 requests
- **Average response time:** ~2 seconds per profile
- **Enterprise:** Custom rate limits; `use_cache=if-present` bypasses rate limiting

### Practical Usage

```bash
curl -X GET "https://nubela.co/proxycurl/api/v2/linkedin" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -G --data-urlencode "url=https://www.linkedin.com/in/someone/"
```

Python SDK: `proxycurl-py` on PyPI.

### Verdict

Was the cleanest developer-friendly option. Now dead due to LinkedIn legal action. **Do not build on this.**

---

## 2. PhantomBuster

### What It Is

A cloud-based automation platform. You configure "Phantoms" (pre-built automations) that log into LinkedIn using your session cookie and perform actions: scrape search results, extract profiles, send connection requests, etc.

### How It Works

1. Install the Chrome extension
2. Connect your LinkedIn session cookie
3. Configure a Phantom (e.g., "LinkedIn Search Export", "LinkedIn Profile Scraper")
4. Set pacing, limits, and scheduling
5. PhantomBuster runs it on their cloud and outputs CSV/JSON

### Pricing (2025)

| Plan | Monthly | Annual (per mo) | Execution Time | Slots |
|------|---------|-----------------|----------------|-------|
| Starter | $69 | ~$56 | 20h/mo | 5 |
| Pro | $159 | ~$128 | 80h/mo | 15 |
| Team | $439 | ~$352 | 300h/mo | 50 |

- 14-day free trial on all plans
- Also includes AI credits, email finder credits, URL finder credits
- Per-workspace pricing (not per user), up to 100 LinkedIn accounts per workspace
- **Gets expensive fast** when you need more execution time/slots for serious volume

### Ban Risk — The Real Talk

**LinkedIn actively detects and bans automation.** Risk factors:

- **High volume:** Sending 100+ connection requests/day will get flagged
- **Session cookies:** LinkedIn detects impossible travel (your cookie used from a US data center while your real account is in London)
- **Pattern detection:** Identical timing intervals, visiting profiles without reading them

**Safe operating parameters:**
- 25–40 connection requests/week (starting out)
- Max ~20 connection requests/day once warmed up
- Use a dedicated residential IP in your home city
- Randomize delays between actions
- Don't scrape more than ~80 profiles/day

**Consequence ladder:**
1. "Unusual activity" warning
2. Temporary restrictions (can't send connections for X days)
3. Account restricted (limited functionality)
4. **Permanent ban** (rare, but real — especially after ignoring warnings)

### Verdict

Useful for light-touch lead gen if you follow conservative limits. **Not suitable for bulk extraction** — too slow at safe speeds, too risky at fast speeds. The pricing gets steep for what you actually get.

---

## 3. LinkedIn Sales Navigator

### What It Is

LinkedIn's own premium product for sales professionals. Advanced search with 30+ filters, lead recommendations, InMail credits, CRM integrations.

### Pricing (2025–2026)

| Plan | Monthly | Annual (per mo) | Annual Total |
|------|---------|-----------------|--------------|
| **Core** | $119.99 | ~$89.99 | $1,079.88 |
| **Advanced** | $159.99 | ~$149.99 | $1,799.88 |
| **Advanced Plus** | Custom | ~$133/mo | ~$1,600/yr |

- All plans include a **30-day free trial**
- Prices exclude VAT/GST
- Advanced Plus pricing depends on team size, CRM needs, and onboarding

### What You Get

**Core:**
- 50 InMail credits/month
- Advanced lead and company search (30+ filters)
- Lead recommendations
- Custom lead/account lists
- Alerts on lead activity

**Advanced (adds):**
- TeamLink (see team's connections)
- Buyer intent signals
- Smart Links (trackable content sharing)
- CSV upload for account matching

**Advanced Plus (adds):**
- Deep CRM sync (Salesforce, Dynamics 365)
- Advanced enterprise admin
- Data validation

### What It Does NOT Do

- **No bulk export.** You cannot download search results as CSV natively.
- **No API access** for programmatic extraction (the official LinkedIn API is separate and very limited).
- **25 search pages max** (~2,500 results per search)

### Value Proposition

Sales Navigator's value is in **finding** the right people with precision filters — not in data extraction. It's the prerequisite for tools like Evaboot that do the extraction layer on top.

### Verdict

Essential if you're doing any serious LinkedIn prospecting. The search filters alone justify the cost. But it's a discovery tool, not an extraction tool.

---

## 4. Evaboot

### What It Is

A Chrome extension that sits on top of LinkedIn Sales Navigator and scrapes the search results you see. It cleans the data and finds/verifies email addresses.

### How It Works

1. Requires an active Sales Navigator subscription
2. Install the Evaboot Chrome extension
3. Run a search in Sales Navigator
4. Click the Evaboot button to extract results
5. Evaboot scrapes the visible results and enriches them

### Pricing (2025)

| Plan | Monthly Cost | Credits |
|------|-------------|---------|
| Starter | $9 | ~100 |
| Basic | $29 | ~500 |
| Pro | $49 | ~1,500 |
| Business | $99 | ~4,000 |
| Scale | $149 | ~8,000 |
| Agency | $299 | ~20,000 |
| Enterprise | $499 | ~50,000 |

**Critical detail:** Each lead costs **2 credits** (1 for extraction + 1 for email finder). So your actual lead count is roughly half the credit number.

**True total cost:** Evaboot ($49–$499/mo) + Sales Navigator ($90–$120/mo) = **$139–$619/mo minimum**.

### Data Quality

- **Email accuracy:** 75–80% for verified emails
- **Data cleaning:** Auto-removes special characters, outdated info
- **Phone numbers:** Available but less reliable
- Unused credits roll forward while subscription is active

### Verdict

Best-in-class for **Sales Navigator extraction specifically**. Clean, simple, and the credit-based model is fair. The hidden cost is the mandatory Sales Navigator subscription underneath.

---

## 5. hiQ Labs v LinkedIn — Legal Outcome

### The Full Timeline

| Date | Event |
|------|-------|
| 2017 | hiQ sues LinkedIn after receiving C&D letter; gets preliminary injunction |
| 2019 | Ninth Circuit upholds injunction — scraping public data doesn't violate CFAA |
| 2021 (Jun) | Supreme Court vacates and remands in light of *Van Buren v. United States* |
| 2022 (Apr) | Ninth Circuit again affirms: accessing publicly available data cannot violate CFAA |
| 2022 (Nov) | District Court rules hiQ breached LinkedIn's User Agreement |
| 2022 (Dec) | Settlement: $500K judgment against hiQ, permanent injunction |

### What Was Settled

- hiQ must **cease all LinkedIn scraping**
- hiQ must **destroy all source code, data, and algorithms** derived from scraped data
- $500,000 judgment against hiQ

### The Precedent That Survives

Despite hiQ losing on contract grounds, **the Ninth Circuit's CFAA ruling still stands:**

> **Scraping publicly accessible data does not violate the Computer Fraud and Abuse Act (CFAA).**

This means:
- ✅ LinkedIn **cannot** use the CFAA (a criminal statute) to stop scraping of public profiles
- ❌ LinkedIn **can** use breach-of-contract claims if you've agreed to their ToS
- ❌ LinkedIn **can** use state-law claims (trespass to chattels, unfair competition, etc.)

### Practical Implication

The legal risk from scraping LinkedIn is **primarily contractual, not criminal.** But if you have a LinkedIn account and agreed to the ToS, you're bound by that contract. The CFAA defense only helps if you're scraping without ever agreeing to LinkedIn's terms (e.g., scraping public profiles without logging in).

---

## 6. LinkedIn ToS Enforcement

### What the ToS Says

LinkedIn's User Agreement explicitly prohibits:
- Using bots, scrapers, or automated means to access the platform
- Scraping, crawling, or copying any data from LinkedIn
- Using data obtained from LinkedIn for unauthorized purposes
- Creating fake accounts

### How LinkedIn Enforces

**Technical enforcement:**
- Rate limiting and CAPTCHAs
- Session cookie detection (impossible travel, device fingerprinting)
- Detection of known automation tool signatures
- IP-based blocking and throttling

**Account enforcement:**
- Warning messages ("unusual activity detected")
- Temporary restrictions (connection limits, search limits)
- Account suspension
- Permanent bans

**Legal enforcement (escalating pattern):**
- Cease-and-desist letters
- Federal lawsuits (breach of contract + state law claims)
- Permanent injunctions + damages

### Recent Legal Actions

| Target | Year | Outcome |
|--------|------|---------|
| hiQ Labs | 2017–2022 | $500K + injunction + data destruction |
| Proxycurl | 2024–2025 | Permanent injunction; Proxycurl shut down |
| ProAPIs | 2025–2026 | Settlement (terms undisclosed); "industrial-scale" fake accounts alleged |

### LinkedIn's Enforcement Stance (2025)

LinkedIn is **actively and aggressively** pursuing scrapers through legal channels. The Proxycurl shutdown and ProAPIs lawsuit signal that LinkedIn (backed by Microsoft's legal budget) will target not just scrapers but **the tools that enable scraping**. This is a meaningful deterrent for any service that builds its business on LinkedIn data extraction.

---

## 7. Alternative Approaches

### 7.1 Google Dorks for LinkedIn Profiles

Google indexes public LinkedIn profiles. You can search them without logging into LinkedIn (no ToS agreement, no CFAA risk for accessing public data via Google).

**Basic dorks:**

```
site:linkedin.com/in/ "software engineer" "San Francisco"
site:linkedin.com/in/ "CTO" "fintech" "London"
site:linkedin.com/in/ "product manager" "Series A" "startup"
site:linkedin.com/company/companyname
```

**Advanced techniques:**

```
# Boolean operators
site:linkedin.com/in/ "data scientist" ("Python" OR "R") "machine learning"

# Exclude roles
site:linkedin.com/in/ "engineer" -"senior" -"staff" "startup"

# Find by company
site:linkedin.com/in/ "works at Stripe" "engineering"

# Combine with other sites for cross-referencing
site:linkedin.com/in/ "John Smith" "Acme Corp" site:github.com "John Smith"
```

**Limitations:**
- Google caches are often stale (weeks/months old)
- Limited data visible without clicking through (which requires LinkedIn)
- No structured data — you get search results, not JSON
- Google rate-limits automated searches (use SerpAPI or similar for programmatic access)
- LinkedIn increasingly restricts what Google can index

**Practical tip:** Use Google dorks for **discovery** (finding WHO to target), then enrich through other means.

### 7.2 GitHub Profiles

Many engineers and technical folks link their LinkedIn from GitHub, or vice versa.

**Extraction approach:**
```bash
# GitHub API — search users by location/company
curl -H "Authorization: token YOUR_TOKEN" \
  "https://api.github.com/search/users?q=location:london+language:python"

# Get profile details (often includes company, blog, email)
curl -H "Authorization: token YOUR_TOKEN" \
  "https://api.github.com/users/username"
```

**What GitHub gives you:**
- Name, company, location, bio, blog URL, email (if public)
- Contribution history, repos, languages used
- Often links to LinkedIn, personal sites, Twitter

**Rate limits:** 30 search requests/minute (authenticated), 5,000 general requests/hour.

**Best for:** Technical roles (engineers, data scientists, DevOps). Useless for sales, marketing, or executive roles.

### 7.3 Personal Websites & Portfolios

Many professionals maintain personal sites that contain richer data than LinkedIn:

**Discovery methods:**
```
# Google dork for personal sites mentioning a company
"works at Stripe" -site:linkedin.com -site:twitter.com "about me"

# Find portfolio sites
"software engineer" "portfolio" "contact" site:*.dev OR site:*.io

# Find resumes/CVs posted publicly
filetype:pdf "resume" "software engineer" "London"
```

**Common patterns:**
- `about.me/username`
- `username.github.io`
- Personal domains with `/about` or `/resume` pages

### 7.4 LinkedIn's Own Data Export

If someone is already a 1st-degree connection:
- **Settings → Data Privacy → Get a copy of your data** exports your connections as CSV
- Fields: First Name, Last Name, Email, Company, Position, Connected On
- Limited to your network, but **zero risk** since it's a native LinkedIn feature

### 7.5 LinkedIn Official API (Marketing/Compliance)

LinkedIn does have official APIs, but they're heavily restricted:
- **Marketing API:** For ad campaigns, not profile data
- **Compliance API:** For archiving, limited to enterprise
- **Sign In with LinkedIn:** Only returns basic profile of the authenticated user
- **No general-purpose "look up any profile" API**

### 7.6 Data Enrichment Vendors (Non-Scraping)

Companies that maintain their own databases (often from a mix of public data, data partnerships, and user contributions):

- **Apollo.io** — Large B2B database, email/phone lookup, free tier available
- **Clearbit (now Breeze by HubSpot)** — Company/person enrichment API
- **People Data Labs** — 1.5B+ person records, API-based, ~$0.01–0.10/record
- **ZoomInfo** — Enterprise-grade, expensive ($15K+/yr), very comprehensive
- **Lusha** — Chrome extension + API, credit-based

These vendors take on the legal risk of data collection themselves, and you use their API to query their database. This is the **safest commercial approach** — you never touch LinkedIn directly.

---

## 8. Summary Comparison Table

| Method | Cost | Data Quality | Volume | Risk Level | Best For |
|--------|------|-------------|--------|------------|----------|
| **Proxycurl** | ~~$49–3K/mo~~ | High | High | **DEAD** (sued) | N/A |
| **PhantomBuster** | $69–439/mo | Medium | Low–Med | ⚠️ Medium (ban) | Light lead gen |
| **Sales Navigator** | $90–160/mo | High (search) | Med | ✅ Low | Finding targets |
| **Evaboot** | $9–499/mo + SN | Medium-High | Med–High | ⚠️ Medium | SN data export |
| **Google Dorks** | Free | Low | Low | ✅ None | Initial discovery |
| **GitHub API** | Free | Med (tech only) | Med | ✅ None | Technical roles |
| **Data Vendors** | $50–1K+/mo | Med–High | High | ✅ Low | Scalable enrichment |
| **LinkedIn Export** | Free | High | Low | ✅ None | Your connections |

---

## 9. Recommendations

### If building a product that needs LinkedIn data at scale:

1. **Use a data enrichment vendor** (Apollo, People Data Labs, Clearbit). They've already solved the legal/technical problem. You query their API, not LinkedIn's.

2. **Use Sales Navigator + Evaboot** for ad-hoc prospecting and building targeted lists. Accept the Sales Nav subscription as a cost of doing business.

3. **Google dorks + GitHub API** for free discovery of technical candidates. Layer enrichment vendors on top for contact details.

4. **Do not build your own LinkedIn scraper.** LinkedIn is actively suing scraping services and has Microsoft's legal budget behind them. The Proxycurl and ProAPIs cases make this crystal clear.

### If doing light personal prospecting:

1. Sales Navigator Core ($90/mo annual) is sufficient
2. LinkedIn's built-in CSV export for your connections
3. Manual research supplemented by Google dorks

### Legal bottom line:

- Scraping public data isn't a CFAA violation (per Ninth Circuit)
- But if you have a LinkedIn account, you've agreed to the ToS, which prohibits scraping
- LinkedIn will pursue **breach of contract** claims aggressively
- The safest path is using vendors who take on that risk, or using LinkedIn's own export features
