# RocketReach — Deep Research Report

> Researched: 2026-03-29  
> Purpose: Evaluating RocketReach as a B2B contact enrichment tool

---

## 1. Company Overview

- **Founded:** ~2015 (celebrated 10-year anniversary June 2025)
- **Co-founders:** Andrew Tso & Amit Shanbhag (both experienced software engineers)
- **CEO:** Scott Kim
- **Headquarters:** San Francisco, CA
- **Scale:** 26M+ users, 700M+ professional profiles, 60M+ companies, customers in 100+ countries
- **Customers:** Claims 95% of S&P Fortune 500 use it

RocketReach positions itself as a B2B lead intelligence platform — its core product is a searchable database of professional contact data (emails, phones, social profiles), plus features for prospecting, enrichment, and outreach automation.

---

## 2. How They Collect Contact Data

### Primary Sources

| Source | Details |
|--------|---------|
| **Web Scraping** | Automated crawling of company websites, press releases, staff directories, LinkedIn, Twitter/X, and other public web sources. Co-founders built a "fast and efficient search engine to process vast amounts of public web data" as their founding technology. |
| **Social Media Scraping** | LinkedIn profiles, Twitter/X, GitHub, AngelList, CrunchBase, Quora are all listed as scraped sources. LinkedIn explicitly prohibits this in its ToS; RocketReach has faced backlash for it. |
| **Third-Party Data Partnerships** | Partners with "trusted data vendors" to fill gaps. Notable partnership with **Five by Five (5x5 Data)**, a "member-driven collaborative data provider." Also partnered with **Intentsify** for B2B intent data. |
| **User-Contributed Data** | Browser extensions used by their 26M+ user base passively contribute/validate contact data as users browse the web. |
| **Proprietary Algorithms** | Machine learning to predict, infer, and generate email patterns from known company email formats (e.g., `first.last@company.com`). |
| **Continuous Verification** | SMTP checks and catch-all verification run against email addresses to grade their confidence level (A/A-/B grades). |

### Data Pipeline Architecture (inferred from AWS blog)
- Data is ingested at large scale, stored in **Amazon Aurora (PostgreSQL-compatible)**
- Two data paths: some data is "served directly to customers," while other models are "aggregated, processed, and stored to create compiled records that include metadata information like organizational charts, popular employees, and email format summaries"
- Heavy I/O workload — they moved to **Aurora I/O-Optimized** in ~2023, reducing DB costs by 60%

### Critical Note on LinkedIn
RocketReach scrapes LinkedIn profiles. LinkedIn's User Agreement explicitly prohibits scraping. Unlike Apollo and Seamless.AI (which were reportedly banned by LinkedIn in early 2025), RocketReach has not been publicly confirmed as banned — but individual users using the Chrome extension have reported account risks. One Medium post documented RocketReach scraping LinkedIn data that had been previously exposed in a breach, then re-surfacing those leaked personal emails.

---

## 3. Pricing Tiers & Cost Per Contact (2025–2026)

### Free Tier
- **5 lookups/month**, no credit card required

### Individual Plans

| Plan | Monthly Billing | Annual Billing | Included Lookups |
|------|----------------|----------------|-----------------|
| **Essentials** | ~$80/mo | ~$53/mo ($636/yr) | 100/mo (monthly) or 1,200/yr (annual) |
| **Pro** | ~$179/mo | ~$126/mo | 250/mo (monthly) or 3,600/yr (annual) |
| **Ultimate** | ~$359/mo | ~$252/mo | 500/mo (monthly) or 10,000/yr (annual) |

_Note: Some sources cite slightly different figures (e.g., Essentials annual at $36/mo). Prices appear to fluctuate; check rocketreach.co/pricing directly._

### Team Plans
- Start at ~$83/user/month (billed annually)
- Custom enterprise pricing available

### Cost Per Contact
- **Annual plans:** Roughly $0.025–$0.063 per lookup depending on plan
- **Overage / additional lookups:** ~$0.30–$0.45 per lookup beyond plan limits
- **Essentials plan only covers email** — phone numbers require Pro or above

### What's Included by Plan
- Email access: All paid plans
- Phone (direct dial / mobile): Pro and above
- API access: Available (separate pricing / enterprise)
- CRM integrations: Salesforce, HubSpot, etc. — higher tiers

---

## 4. Claimed Data Accuracy

### Official Claims

| Metric | Claimed Figure |
|--------|---------------|
| Email deliverability (A-grade) | **98%** |
| General data accuracy | **85%+** |
| Email fill rate | **85%+** |
| Phone fill rate | **60%+** |
| Database size | 700M+ professionals, 60M+ companies |

### Email Grading System
RocketReach grades emails:
- **A / A-**: High-confidence, SMTP-verified, real-time checked — claims 98% deliverability
- **B**: Lower confidence, not SMTP verified — lower deliverability
- **Catch-all**: Domain accepts all mail; can't verify individual address

### Independent & User-Reported Accuracy

| Source | Finding |
|--------|---------|
| Independent reviewers | 80–90% deliverability for high-confidence contacts |
| G2 / Capterra users | 20–30% bounce rates reported by some users |
| Specific user report | Company rep claimed 99% accuracy; actual deliverability was 56% |
| Phone numbers | Frequently outdated or incorrect, especially mobile |
| Job titles / current employer | Sometimes 12+ years out of date despite showing "Updated 4 days ago" |
| Regional accuracy | Worse outside North America |
| Small companies | More gaps vs. large enterprise contacts |

**Bottom line:** The 98% accuracy claim applies only to A-grade emails. Real-world average across all lookups is much lower — G2 reviews suggest expect 70–80% email accuracy at best, less for phones.

---

## 5. Data Fields Available

### Person Profiles

**Contact Information:**
- Email (Recommended Email, Work Email, Personal Email)
- Email grading (A, A-, B, catch-all)
- Phone: Best Phone, Mobile Phone, Office Phone, Other Phones

**Professional Identity:**
- Full Name
- Current Job Title
- Current Company
- Company Industry
- Company Size
- Location (city, state, country)
- Work Experience history
- Education history
- Skills

**Social / Web Profiles:**
- LinkedIn URL
- Twitter/X
- Facebook
- GitHub
- CrunchBase
- AngelList
- Quora

**Metadata:**
- Profile "confidence" score
- Last updated timestamp
- Tags & Notes (user-added)

### Company Profiles

- Company name, website, description
- Industry & SIC/NAICS codes
- Revenue range
- Employee count range
- Headquarters location
- Founded year
- Key executives list
- Org chart (where available)
- Technology stack (what tools/software the company uses)
- Employee growth trends
- Funding information (from public sources like CrunchBase)
- B2B Intent signals (via Intentsify partnership)

### Search Filters
100+ filters including: industry, title, seniority, location, company size, revenue, technology used, skills, keywords.

---

## 6. Legal Controversies & Privacy Issues

### Class Action Lawsuit (2021–2023): Krause v. RocketReach

**The case:**
- Filed April 2021 by Aimee Krause in US District Court for the Northern District of Illinois
- Case No. 1:2021cv01938
- Alleged violation of the **Illinois Right of Publicity Act (IRPA)**

**The allegation:**
RocketReach used Illinois residents' full names, employers, job titles, and social media links as marketing bait — displaying them on preview pages to entice visitors into buying paid subscriptions. Users could see a blurred "teaser" of their data to drive conversions. This is the core product mechanic — and the lawsuit argued it constituted commercial use of their identity without consent.

**Key ruling:**
In September 2021, Judge Elaine Bucklo **denied RocketReach's motion to dismiss**, ruling they had not established that IRPA exemptions protected them.

**Settlement:**
RocketReach agreed to pay **~$1.6 million** to resolve the class action. Benefits applied to Illinois residents whose names appeared on the site in connection with a "+Phone Plan" hyperlink **between April 12, 2020 and April 11, 2023**.

---

### LinkedIn Scraping Controversy

Multiple users have publicly accused RocketReach of:
- Scraping personal emails from LinkedIn **including emails leaked in the 2016 LinkedIn breach** (which were never intentionally made public)
- Making private professional details freely searchable without consent
- Collecting data "without the knowledge or consent of the individuals"

One widely-cited Medium post (by Kris Decoodt) documented RocketReach surfacing their private personal email (from the LinkedIn breach) associated with their public LinkedIn profile — data they never consented to share publicly.

---

### GDPR & CCPA Compliance

- RocketReach is **registered as a data broker** in California (CA AG Data Broker Registry #187542)
- Maintains a CCPA opt-out/deletion process at rocketreach.co/ccpa
- Claims GDPR compliance for EU residents
- Users report **delays and friction** in the opt-out/removal process
- Registered as a **data broker under Texas law** as well
- California's CPPA began enforcement actions against data brokers in late 2024 (broader industry pressure)

---

### General Privacy Criticisms

- Data collected **without consent** is the fundamental critique — RocketReach relies on "publicly available" framing, but users argue that aggregating and selling it is different from publishing
- Mobile phone numbers appearing in profiles with users having no idea how they were obtained
- Profiles showing data that is 10+ years stale
- Opt-out requests not always honored promptly
- Chrome extension implicitly harvests browsing context from users who install it

---

## 7. Technology Stack

### Confirmed / High-Confidence

| Layer | Technology |
|-------|-----------|
| **Cloud Infrastructure** | Amazon Web Services (AWS) |
| **Compute** | Amazon EC2 |
| **Database** | Amazon Aurora (PostgreSQL-compatible) — migrated from Amazon RDS for PostgreSQL in mid-2022 |
| **CDN / Security** | Cloudflare |
| **Core data pipeline** | Heavy I/O workload — bulk data ingestion at scale |

### Inferred / Likely (from job postings & engineering context)
- **Languages:** Python (primary for data processing & ML), likely JavaScript/TypeScript for frontend
- **ML/AI:** Machine learning for email pattern inference, NLP for profile parsing, AI-powered search recommendations
- **Search:** Likely Elasticsearch or similar for their 700M+ record search capability
- **Frontend:** React (common for SaaS at their scale)
- **API:** REST API (publicly documented at rocketreach.co/api)

### Product Features Indicating Tech Choices
- Real-time SMTP email verification → requires custom mail verification infrastructure
- Chrome extension → JavaScript/TypeScript
- Salesforce/HubSpot integrations → REST APIs with OAuth
- "Saved searches auto-update when contact information changes" → event-driven architecture or polling with change detection
- Org chart generation → graph database or relational modeling

---

## 8. Competitive Position & Summary Assessment

### Strengths
- Very large database (700M professionals claimed)
- Broad coverage across industries and geographies
- Affordable entry-level pricing vs. ZoomInfo
- Good integrations (Salesforce, HubSpot, etc.)
- API available

### Weaknesses
- **Data accuracy is overstated** — 98% claim applies only to best-case A-grade emails; real-world accuracy closer to 70–80% for email, much lower for phones
- Phone data is particularly unreliable
- Data freshness issues — "recently updated" labels can be misleading
- Privacy controversy is real and ongoing — $1.6M settlement, active user complaints
- Customer support issues (slow response, billing disputes)
- Coverage gaps outside North America

### vs. Competitors
| Competitor | RocketReach Edge | RocketReach Gap |
|-----------|-----------------|----------------|
| ZoomInfo | Much cheaper | Lower data quality, less frequent updates |
| Apollo.io | Similar price range, sometimes more accurate | Apollo has more outreach automation features |
| Hunter.io | RocketReach has more fields (phone, social) | Hunter more specialized for email only |
| Clearbit/Breeze | RocketReach cheaper | Clearbit better for real-time enrichment API |
| Lusha | Comparable pricing | Lusha better for GDPR-compliant EU phone data |

---

## 9. Key Stats at a Glance

| Metric | Value |
|--------|-------|
| Database size (people) | 700M+ |
| Database size (companies) | 60M+ |
| Users | 26M+ |
| Fortune 500 penetration | Claims 95% of S&P 500 |
| Countries | 100+ |
| Email accuracy (A-grade, claimed) | 98% |
| Email accuracy (real-world, typical) | ~70–85% |
| Phone fill rate (claimed) | 60%+ |
| Class action settlement | $1.6M (2023) |
| Entry price (annual) | ~$53/mo (~$636/yr) |
| Cost per overage lookup | $0.30–$0.45 |

---

## Sources

- AWS Database Blog: RocketReach Aurora case study
- RocketReach Knowledge Base (knowledgebase.rocketreach.co)
- California AG Data Broker Registry (#187542)
- Justia: Krause v. RocketReach, LLC, No. 1:2021cv01938
- Top Class Actions settlement coverage
- Cook County Record: $1.6M settlement report
- G2, Capterra, Trustpilot user reviews
- Cognism, SalesIntel, UpLead competitive comparisons
- Medium: Kris Decoodt on LinkedIn scraping controversy
- RocketReach 10th anniversary blog post (June 2025)
- PR Newswire: 5x5 Data partnership announcement
