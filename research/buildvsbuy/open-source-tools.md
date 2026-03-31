# Open-Source & Self-Hostable Contact Enrichment Tools & APIs

> **Last updated:** 2026-03-29
> **Purpose:** Evaluate tools for contact/company enrichment — cost, coverage, data quality, ease of integration, and self-host viability.

---

## Table of Contents

1. [Company Data: OpenCorporates API](#1-opencorporates-api)
2. [Person Enrichment: People Data Labs](#2-people-data-labs)
3. [LinkedIn Data: Proxycurl (⚠️ DEFUNCT)](#3-proxycurl--defunct)
4. [Contact Enrichment: Clearbit / Breeze Intelligence](#4-clearbit--breeze-intelligence)
5. [LinkedIn Datasets: Coresignal](#5-coresignal)
6. [Email Verification APIs](#6-email-verification-apis)
7. [Open-Source / DIY GitHub Tools](#7-open-source--diy-github-tools)
8. [Comparison Matrix](#8-comparison-matrix)
9. [Recommendations](#9-recommendations)

---

## 1. OpenCorporates API

**What it is:** The world's largest open database of company information — 200M+ companies across global registries.

### Pricing

| Plan | Price | Limits |
|------|-------|--------|
| Free (no key) | £0 | 500 requests/month |
| Essentials | £2,250/year (~£188/mo) | Higher limits |
| Starter | £6,600/year (~£550/mo) | Higher limits |
| Basic | £12,000/year (~£1,000/mo) | Higher limits |
| Enterprise | Custom | Negotiated |
| Academic/NGO/Press | Free (apply) | Open public licence |

### Data Provided
- Company name, registration number, status, jurisdiction
- Officer/director information
- Corporate relationships and networks
- Industry classifications
- Filings and documents

### ⚠️ Limitations
- **No financial data** — no standardized financial statements
- **No beneficial ownership tracking**
- **~50% of registry sources reportedly no longer actively updated** (third-party assessment)
- Company data only — no person/contact enrichment

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Cost** | ⭐⭐⭐ | Free tier exists; paid plans start reasonably for company data |
| **Coverage** | ⭐⭐⭐⭐ | 200M+ companies globally, best for corporate registry data |
| **Integration** | ⭐⭐⭐⭐ | Clean REST API, well-documented |
| **Data Quality** | ⭐⭐⭐ | Registry data is authoritative but freshness is mixed |

### Verdict
**Best for:** Company verification, KYB, due diligence, corporate structure mapping. **Not for:** Contact enrichment or person-level data.

---

## 2. People Data Labs

**What it is:** B2B data provider with a massive person dataset (1.5B+ profiles). Offers API enrichment and bulk data licensing.

### Pricing

| Plan | Price | Credits |
|------|-------|---------|
| Free | $0 | 100 person/company lookups + 25 IP lookups/mo |
| Pro (Person) | From $98/mo | 350 person enrichment credits |
| Pro (Company) | From $100/mo | 1,000 company lookups |
| Enterprise | ~$2,500+/mo | Custom, unlimited credits |
| Bulk Licensing | Custom | Full dataset or subsets via AWS/GCP/Snowflake |

**Cost per record:** ~$0.28 on Pro plan. Enterprise volume discounts available. 20% discount on annual contracts.

### Data Quality
- **90%+ accuracy** for core fields (name, company, title)
- **85-95% email accuracy** for verified addresses
- **1.5B+ unique individuals**, 10B+ data points processed monthly
- Records refreshed within 30-90 days (monthly default cycle)
- Strict source vetting: reject ~3 sources for every 1 accepted

### User Satisfaction (2025 survey, n=89)
- Enterprise (500+ employees): **78% satisfied**
- Mid-market (50-500): **61% satisfied**
- SMB (<50): **43% satisfied** — cost is the main barrier

### ⚠️ Limitations
- Expensive at small volumes ($0.28/record on Pro)
- Data freshness concerns from some reviewers
- Learning curve for API integration
- Free tier is very limited (100 lookups)

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Cost** | ⭐⭐ | Expensive for small volumes; competitive at enterprise scale |
| **Coverage** | ⭐⭐⭐⭐⭐ | 1.5B profiles — one of the largest datasets |
| **Integration** | ⭐⭐⭐⭐ | Well-documented REST API, bulk API, data licensing |
| **Data Quality** | ⭐⭐⭐⭐ | 90%+ on core fields; email accuracy 85-95% |

### Verdict
**Best for:** High-volume enrichment at enterprise scale, or bulk data licensing for building your own enrichment layer. **Not ideal for:** Bootstrapped startups doing low-volume enrichment.

---

## 3. Proxycurl (⚠️ DEFUNCT)

**Status: SHUT DOWN — July 2025**

LinkedIn filed a lawsuit in January 2025 alleging Proxycurl operated "hundreds of thousands" of fake accounts. Proxycurl shut down in July 2025 after legal pressure. CEO Steven Goh confirmed continuation was untenable.

### Historical Context
- Was a ~$10M revenue business
- Pricing was $49/mo for ~1,000-2,500 API calls
- Hidden costs reported: annual contract disguised as monthly, per-endpoint charges
- $0.49 per API call on entry plan — expensive

### What This Means
- **Do not build on Proxycurl.** It no longer exists.
- LinkedIn is aggressively litigating scrapers — any tool doing unauthorized LinkedIn scraping carries legal risk.
- Alternatives: People Data Labs, Coresignal (licensed data), Apollo.io (SaaS), Bright Data (proxy-based).

---

## 4. Clearbit / Breeze Intelligence

**Status: Clearbit free tier DISCONTINUED — April 30, 2025. Now "Breeze Intelligence" under HubSpot.**

### What Changed
- Free Clearbit Platform, Weekly Visitor Report, Clearbit Connect, TAM Calculator, and Slack integration all **discontinued April 30, 2025**
- No new free accounts being created
- Standalone API access progressively restricted; existing keys work with limited support but no new features, eventual sunset
- Logo API sunset December 1, 2025

### Current Pricing (Breeze Intelligence)

| Requirement | Cost |
|-------------|------|
| HubSpot Starter | Required ($30/mo baseline) |
| Breeze Intelligence add-on | $45/mo annual / $50/mo monthly |
| **Real entry cost** | **~$75/mo for 100 enrichments** |
| Credit cost | 1 enrichment = 10 HubSpot credits; $10 per 1,000 credits |
| Effective cost/enrichment | ~$0.10 per enrichment at scale |

### ⚠️ Limitations
- **HubSpot lock-in** — requires HubSpot subscription
- Credits reset monthly, no rollover
- No longer a standalone API product for developers
- Sunset trajectory for standalone API keys

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Cost** | ⭐⭐ | $75/mo minimum for 100 enrichments; HubSpot tax |
| **Coverage** | ⭐⭐⭐ | Good US/tech company coverage; weaker internationally |
| **Integration** | ⭐⭐ | HubSpot-only now; standalone API being sunset |
| **Data Quality** | ⭐⭐⭐⭐ | Historically excellent for company + person enrichment |

### Verdict
**Only viable if you're already on HubSpot.** For everyone else, Clearbit is effectively dead as an independent enrichment tool.

---

## 5. Coresignal

**What it is:** Licensed LinkedIn/professional data provider. Offers both API access and bulk dataset purchases. Focuses on company data, employee data, and job postings.

### Pricing

| Plan | Price | Credits |
|------|-------|---------|
| Free Trial | $0 | 200 Collect + 400 Search (14 days) |
| Starter | $49/mo | 250 Collect + 500 Search |
| Pro | $800/mo | 10,000 Collect + 20,000 Search |
| Premium | $1,500/mo | 50,000 Collect + 150,000 Search |
| Datasets | From $1,000 | Bulk data, priced by scope/region/tier |

**Credit system:** 1 Collect credit = 1 profile/enrichment. Multi-source company records = 2 credits. 1 Search query = 1 credit.

### Data Categories
- **Company data** — firmographic, tech stack signals
- **Employee data** — professional profiles, job history
- **Job posting data** — real-time and historical
- Three processing levels: base, clean, multi-source

### Ratings

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Cost** | ⭐⭐⭐ | Reasonable entry ($49/mo); datasets from $1K |
| **Coverage** | ⭐⭐⭐⭐ | Good LinkedIn-derived professional data |
| **Integration** | ⭐⭐⭐⭐ | REST API, dataset delivery, real-time refresh |
| **Data Quality** | ⭐⭐⭐⭐ | Licensed data, real-time database refresh |

### Verdict
**Best LinkedIn data alternative post-Proxycurl.** Licensed approach is legally safer. Good for enriching professional profiles at scale. The Starter plan ($49/mo) is a low-risk entry point.

---

## 6. Email Verification APIs

### Comparison Table

| Provider | Min Purchase | Cost/email (low vol) | Cost/email (high vol) | Free Tier | Accuracy Claim | API | Notes |
|----------|-------------|---------------------|----------------------|-----------|---------------|-----|-------|
| **ZeroBounce** | 2,000 credits ($39) | $0.0195 | $0.0039 (125K) | 100/mo free | 99.6% | REST | No charge for dupes/unknowns. Subscription: $99/mo for 10K credits ($79/mo annual) |
| **NeverBounce** | 1,000 credits ($8) | $0.008 | $0.001 (10M) | None listed | 99.6% | REST | ZoomInfo subsidiary. Sync feature for automated list cleaning ($10-$999/mo). Best rates at high volume |
| **Reoon** | Free tier available | $0.0005 (daily plan) | $0.0005 | 600/mo free | Not stated | REST | Cheapest option. Daily credits model (500-20K/day from $9.95/mo). Lifetime credits from $11.90/10K |
| **Mailcheck.ai** | Unknown | Not publicly listed | Not publicly listed | Trial only (no free version) | Not stated | REST | 4 plans (Pro/Agency/Enterprise/Custom). Must contact for pricing. Less transparent |

### Detailed Breakdown

#### ZeroBounce
- **Strengths:** Generous free tier (100/mo, never expire), no charge for duplicates/unknowns, AI scoring, inbox placement testing
- **Weaknesses:** Higher minimum purchase ($39 for 2K), expensive at low volume
- **Best for:** Teams needing extras (deliverability testing, AI scoring) alongside verification

#### NeverBounce
- **Strengths:** Low minimum ($8 for 1K), best bulk pricing at scale ($0.001/email at 10M), automated Sync feature
- **Weaknesses:** No free tier, owned by ZoomInfo (enterprise-focused)
- **Best for:** High-volume verification, automated list hygiene

#### Reoon
- **Strengths:** Cheapest per-verification ($0.0005), free tier (600/mo), lifetime credits option, daily renewable credits
- **Weaknesses:** Smaller/newer provider, less market presence, accuracy claims less documented
- **Best for:** Budget-conscious teams, early-stage startups

#### Mailcheck.ai
- **Strengths:** AI-powered predictions
- **Weaknesses:** Opaque pricing, no free version, limited public documentation
- **Best for:** Unknown — hard to recommend without transparent pricing

### 🏆 Email Verification Recommendation
- **Budget pick:** Reoon ($0.0005/email, free tier)
- **Balanced pick:** NeverBounce ($0.008/email entry, scales well)
- **Premium pick:** ZeroBounce (extras like AI scoring, deliverability tools)

---

## 7. Open-Source / DIY GitHub Tools

### A. Fire Enrich ⭐ (Best Overall OSS Option)
- **GitHub:** 650+ stars
- **What:** Multi-agent AI enrichment system — deploys specialized agents for company research, fundraising intelligence, people/leadership, product/tech analysis
- **Self-host cost:** Only OpenAI API usage (~$0.01-0.05 per enrichment)
- **Limitations:** Public demo limited to 15 rows/5 columns; self-hosted removes restrictions
- **Best for:** Company enrichment, leadership research, fundraising signals

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Cost** | ⭐⭐⭐⭐⭐ | ~$0.01-0.05/enrichment (OpenAI API only) |
| **Coverage** | ⭐⭐⭐ | AI-dependent; only as good as public web data |
| **Integration** | ⭐⭐⭐ | Self-hosted, requires setup |
| **Data Quality** | ⭐⭐⭐ | AI-generated; needs verification |

### B. user-email-enrichment
- **GitHub:** [taitems/user-email-enrichment](https://github.com/taitems/user-email-enrichment)
- **What:** Free identity resolution by email — searches publicly shared info only (no proprietary databases)
- **Sources:** Public profiles, gravatar, social accounts
- **Best for:** Lightweight email → identity lookups

### C. Buster
- **GitHub:** [sham00n/buster](https://github.com/sham00n/buster)
- **What:** Email OSINT reconnaissance — gets social accounts from email using Gravatar, About.me, Myspace, Skype, GitHub, LinkedIn, breach databases
- **Best for:** Security research, OSINT investigations

### D. EmailFinder
- **GitHub:** [rix4uni/EmailFinder](https://github.com/rix4uni/EmailFinder)
- **What:** Email OSINT — collects emails from Google, DuckDuckGo, Bing, Yahoo, Yandex, GitHub
- **Best for:** Finding email addresses associated with domains

### E. Email-Finder (mfrye)
- **GitHub:** [mfrye/email-finder](https://github.com/mfrye/email-finder)
- **What:** Heroku-deployable email finder with easy IP rotation
- **Best for:** Quick self-hosted email discovery

### OSS Reality Check
Most open-source tools are **OSINT-grade** — they aggregate publicly available data. They won't match commercial providers on:
- Data completeness (no proprietary databases)
- Email accuracy (no SMTP verification built-in)
- Freshness (no continuous crawling infrastructure)
- Legal compliance (scraping carries risk)

**Fire Enrich is the exception** — using AI agents to synthesize public data into structured enrichment is the most viable DIY approach.

---

## 8. Comparison Matrix

| Tool | Type | Cost Entry | Cost/Record | Coverage | Data Quality | Self-Hostable | Legal Risk |
|------|------|-----------|-------------|----------|-------------|--------------|------------|
| **OpenCorporates** | Company registry | Free (500/mo) | ~£0.02-0.10 | 200M+ companies | ⭐⭐⭐ | No (API only) | Low |
| **People Data Labs** | Person + Company | Free (100/mo) | $0.28 (Pro) | 1.5B people | ⭐⭐⭐⭐ | No (API/bulk license) | Low |
| **Proxycurl** | LinkedIn scraping | ❌ DEFUNCT | N/A | N/A | N/A | N/A | ⚠️ High |
| **Clearbit/Breeze** | Person + Company | $75/mo (HubSpot) | ~$0.10 | Good (US/tech) | ⭐⭐⭐⭐ | No (HubSpot only) | Low |
| **Coresignal** | LinkedIn (licensed) | $49/mo | ~$0.03-0.20 | Good professional | ⭐⭐⭐⭐ | No (API/datasets) | Low |
| **ZeroBounce** | Email verification | Free (100/mo) | $0.008-0.02 | N/A (verification) | ⭐⭐⭐⭐ | No | Low |
| **NeverBounce** | Email verification | $8 (1K) | $0.001-0.008 | N/A (verification) | ⭐⭐⭐⭐ | No | Low |
| **Reoon** | Email verification | Free (600/mo) | $0.0005 | N/A (verification) | ⭐⭐⭐ | No | Low |
| **Fire Enrich** | AI enrichment | Free (self-host) | $0.01-0.05 | Web-dependent | ⭐⭐⭐ | ✅ Yes | Low-Med |
| **Buster/EmailFinder** | OSINT | Free | $0 | Public data only | ⭐⭐ | ✅ Yes | Medium |

---

## 9. Recommendations

### For a bootstrapped startup building contact enrichment:

1. **Company enrichment:** Start with **OpenCorporates** free tier for company verification + **Fire Enrich** (self-hosted) for AI-powered company research. Total cost: ~$0.01-0.05/record.

2. **Person enrichment:** **Coresignal Starter** ($49/mo) for professional data. Supplement with **People Data Labs** free tier (100/mo) for testing. Scale to PDL Pro or Coresignal Pro when volume justifies it.

3. **Email verification:** **Reoon** for budget verification ($0.0005/email). Upgrade to **NeverBounce** if you need automated list hygiene at scale.

4. **DIY layer:** Deploy **Fire Enrich** for AI-based enrichment from public sources. Cheapest per-record cost and fully self-hosted. Build email pattern generation (firstname.lastname@company.com) and verify with Reoon/NeverBounce.

5. **Avoid:**
   - Clearbit/Breeze unless you're on HubSpot already
   - Any Proxycurl-style unauthorized LinkedIn scraping
   - Mailcheck.ai (opaque pricing, limited value proposition)

### Cost-Optimized Stack (Estimated)

| Component | Tool | Monthly Cost | Records/mo |
|-----------|------|-------------|------------|
| Company enrichment | OpenCorporates Free + Fire Enrich | ~$5 (OpenAI API) | ~500 |
| Person enrichment | Coresignal Starter | $49 | 250 profiles |
| Email verification | Reoon daily plan | $9.95 | 15,000/mo |
| **Total** | | **~$64/mo** | **Enough for early-stage** |

### Scale Stack (When Revenue Justifies)

| Component | Tool | Monthly Cost | Records/mo |
|-----------|------|-------------|------------|
| Person + Company | People Data Labs Pro | $198 | 350 person + 1K company |
| LinkedIn profiles | Coresignal Pro | $800 | 10,000 profiles |
| Email verification | NeverBounce | ~$250 | 50,000 emails |
| **Total** | | **~$1,248/mo** | **Growth-stage volume** |
