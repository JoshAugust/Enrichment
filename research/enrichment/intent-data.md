# Intent Data & Buying Signal Tools

> Research compiled for GPU operator risk management outreach targeting.

---

## Table of Contents

1. [How Intent Data Works Technically](#how-intent-data-works-technically)
2. [Bombora](#1-bombora)
3. [G2 Buyer Intent](#2-g2-buyer-intent)
4. [6sense](#3-6sense)
5. [TechTarget Priority Engine](#4-techtarget-priority-engine)
6. [Demandbase](#5-demandbase)
7. [Free/Cheap Intent Proxies](#6-freecheap-intent-proxies)
8. [Signals That Predict GPU Operator Readiness for Risk Mgmt](#7-signals-that-predict-gpu-operator-readiness-for-risk-management)

---

## How Intent Data Works Technically

Intent data captures the digital research trail of B2B buyers to identify accounts actively evaluating solutions. There are three main collection methods:

### Collection Methods

| Method | How It Works | Pros | Cons |
|--------|-------------|------|------|
| **Co-op / Publisher Network** | JavaScript tags on consenting publisher sites track page views, downloads, form fills. Activity mapped to companies via reverse-IP or logged-in identity. | Consent-based, high quality, exclusive data | Expensive, limited to co-op member sites |
| **Bidstream** | Ad pixels on pages capture user activity via programmatic ad exchanges. Provider scrapes keywords from pages where ads appear. | Massive scale, broad coverage | Poor accuracy — infers from ad placement, not page content. GDPR/CCPA compliance issues. |
| **First-party** | Your own website analytics, CRM engagement, email opens, content downloads. | Highest accuracy, free | Only sees accounts already aware of you |

### The Technical Pipeline

1. **Event capture** → User visits a B2B content page. A JS tag or ad pixel fires, logging: page URL, timestamp, referring source, session duration, content consumed.

2. **Identity resolution** → The visitor's IP address is reverse-matched against a commercial IP-to-company database (e.g., Digital Element, Clearbit). For co-op data, registered/logged-in users provide higher-fidelity mapping. Cookie/fingerprint matching supplements IP where available.

3. **Topic classification** → NLP/keyword extraction maps the content consumed to a topic taxonomy (Bombora uses ~12,000+ B2B topics). Each page visit is tagged with one or more topics.

4. **Baseline & surge scoring** → The provider establishes a **baseline** of normal research activity for each company-topic pair over a rolling window (typically 8-12 weeks). When an account's activity on a topic exceeds its baseline by a threshold (commonly 2 standard deviations), it's flagged as a **surge** — indicating active, above-normal research.

5. **Scoring & delivery** → Surge signals are scored (often 0-100 or low/medium/high) and delivered via API, flat file, or CRM integration. Some providers add firmographic enrichment, buying stage prediction, and buying group identification.

### Post-Cookie Reality

With third-party cookie deprecation accelerating:
- **Bidstream data** is losing reliability rapidly
- **Co-op/first-party data** is becoming more valuable (consent-based, not cookie-dependent)
- **IP-based resolution** still works for office networks but struggles with remote workers (residential IPs)
- Providers are investing in probabilistic matching, device graphs, and authenticated identity solutions

---

## 1. Bombora

**What it is:** The largest independent B2B intent data provider, built on a Data Cooperative of publishers.

### How They Collect Data

- **Data Co-op:** ~5,500+ B2B media sites across 200+ publishers and brands
- **JS tag:** Proprietary JavaScript tag on member sites captures: page views, downloads, form fills, registrations, time-on-page
- **Consent-first:** 100% consent collection on all events (GDPR/CCPA compliant)
- **Exclusivity:** 86% of their co-op data is exclusively shared with Bombora — no other intent provider has it
- **Scale:** ~4.9M unique domains tracked, 16.6B interactions/month
- **Topic taxonomy:** 12,000+ B2B topics

### Key Product: Company Surge®

Measures when a company's research activity on a topic significantly exceeds its historical baseline. Output is an account-level signal: "Company X is surging on Topic Y."

### Pricing

| Tier | Annual Cost | Notes |
|------|-------------|-------|
| Basic Company Surge | ~$30,000 | Starting point |
| Enhanced | $50,000–$100,000 | Most mid-market buyers |
| Full Audience Solutions | $100,000+ | Includes LinkedIn targeting, audience solutions |
| **Median (Vendr)** | ~$58,000 | Can reach $400K+ at scale |

- Annual contracts required
- Watch for 3-7% annual escalation clauses
- Cost driven by: data volume, topic count, refresh frequency, add-ons

### Relevance for Us

Bombora is the **most commonly integrated** intent source — 6sense, Demandbase, and others resell/integrate Bombora data. If budget allows one paid intent source, Bombora's Company Surge is the industry standard. But at $30K+ minimum, it's an investment.

---

## 2. G2 Buyer Intent

**What it is:** Second-party intent data from buyer activity on G2.com — the world's largest B2B software review marketplace.

### How It Works

G2 captures **verified, first-party signals** from buyers actively researching software on G2.com. This is not inferred or modeled — it's observed behavior on a high-intent destination.

### Signal Types

| Signal | What It Means | Intent Level |
|--------|--------------|-------------|
| **Category** | Company browsing a software category you're listed in | Low (awareness) |
| **Product Profile** | Someone from a company viewed YOUR product page | Medium (evaluation) |
| **Compare** | Buyer viewed a comparison page including your product | High (shortlist) |
| **Alternatives** | Buyer exploring alternatives to your product | High (evaluation) |
| **Pricing** | Buyer viewed your pricing page | Very high (decision) |

### Key Stats

- Comparison signals influence ~15% of closed deals per session (3x more than product signals, 5x more than category signals)
- Most valuable in **mid-to-late buying journey**
- Integrates with Salesforce, HubSpot, Marketo, and many ABM platforms

### Pricing

- Requires G2 Core plan: ~$10,000/yr base
- Buyer Intent add-on: ~$40,000–$50,000/yr
- Custom pricing based on signal volume, categories, granularity
- **Total cost: ~$50,000–$60,000/yr**

### Relevance for Us

Only useful if our product (or category) is listed on G2. For a new/niche product targeting GPU operators specifically, G2 may not have relevant category traffic yet. Better suited once we have a product with an established G2 profile. **Low priority for early-stage.**

---

## 3. 6sense

**What it is:** Enterprise ABM platform that aggregates intent signals from multiple sources and applies AI to predict buying stage.

### How It Works

- **Multi-source aggregation:** Combines Bombora, G2, TrustRadius, PeerSpot, your first-party data, and proprietary web signals
- **IP + fingerprint matching:** Maps activity to company accounts using IP resolution and digital fingerprints
- **AI-powered scoring:** "Signalverse" captures ~1 trillion signals daily; AI predicts buying stage and identifies in-market accounts
- **Keyword tracking:** Unlimited custom search keywords in 40+ languages
- **Topic clustering:** AI groups consumed content into topic clusters, scores research intensity

### Buying Stage Model

6sense maps accounts to stages: Target → Awareness → Consideration → Decision → Purchase. Claims to identify the ~10% of TAM that's actually in-market at any time.

### Pricing

| Tier | Annual Cost | What's Included |
|------|-------------|-----------------|
| Free | $0 | Buyer discovery, 50 credits/month |
| Team | Custom | + Technographics, psychographics |
| Growth | Custom | + 6sense Intent, advanced analytics |
| Enterprise | $100,000+ | Full AI, predictive analytics, custom integrations |
| **Median (Vendr)** | ~$55,000 | Can reach $130K+ |

- Typical range: $60,000–$300,000/yr
- Implementation: $5,000–$50,000 additional
- Data credits are a significant cost driver
- **Not viable for sub-six-figure marketing budgets**

### Relevance for Us

6sense is the Rolls-Royce of ABM platforms — powerful but expensive and complex. Overkill for early-stage targeting of a niche vertical. The **free tier** is worth exploring for basic buyer discovery. Full platform only makes sense once we have a larger sales team and established ICP.

---

## 4. TechTarget Priority Engine

**What it is:** First-party intent data from TechTarget's network of 150+ technology-focused editorial websites.

### How It Works

- **Owned media properties:** 220 media properties with 50M+ permissioned members (all IT/technology professionals)
- **First-party, opt-in:** Data comes from real, observed activity of known, opted-in users — not inferred
- **Content consumption:** Tracks what IT buyers read, download, watch across TechTarget's tech publications
- **Account + contact level:** Provides both account-level signals AND individual contact details (permissioned)

### Key Features

- Buying stage classification
- ICP match scoring
- Confirmed project identification
- Shows when accounts visit your banners, click ads, download your content on TechTarget sites

### Pricing

- Custom/enterprise pricing (not public)
- Typically sold as part of media + data packages
- Estimated $40,000–$100,000+/yr depending on topics and coverage

### Relevance for Us

**Highly relevant.** TechTarget's audience is IT infrastructure buyers — exactly the type who manage GPU fleets. If GPU operators are reading TechTarget content about GPU management, HPC, cloud infrastructure, or AI workloads, Priority Engine would surface them. Worth investigating which TechTarget properties cover GPU/AI infrastructure topics.

---

## 5. Demandbase

**What it is:** ABM platform with proprietary intent data from bidstream, partnerships, and first-party sources.

### How It Works

- **Bidstream access:** Direct access to programmatic ad bidstream data
- **NLP analysis:** Scans ~3M pages for keywords, classifies content using NLP
- **575,000+ intent keywords** monitored
- **Trending Intent:** Flags when an account's activity on a keyword increases by 2 standard deviations over the last 7 days vs. prior 8 weeks
- **Partner integrations:** Ingests Bombora, G2, TrustRadius data as additional signal sources
- **Identity resolution:** Patented ID technology maps activity to account + buying group members

### Scoring

- Low / Medium / High intensity based on relative activity strength
- Weekly aggregation and scoring refresh
- Person-based intent capability (not just account-level)

### Pricing

- Enterprise platform: typically $75,000–$200,000+/yr
- Intent data can be purchased as standalone data service
- Custom pricing based on features, volume, integrations

### Relevance for Us

Demandbase's broad keyword monitoring could capture GPU-related research signals. However, its reliance on bidstream data is a weakness (accuracy concerns). The Bombora/G2 integrations add quality. **Consider if we want a full ABM platform** — otherwise, going directly to Bombora for intent data is more cost-effective.

---

## 6. Free/Cheap Intent Proxies

For early-stage targeting on a budget, these signals serve as practical proxies for buying intent:

### A. Job Postings (Free – High Value)

**Why it works:** Hiring decisions precede technology purchases. A company hiring signals expansion, budget allocation, and operational gaps.

| Signal | What It Predicts | Intent Strength |
|--------|-----------------|-----------------|
| First-time role creation | 2-3x higher purchase intent than backfills | Very high |
| New department launch | Strategic priority shift, new tooling needed | Very high |
| Leadership change (new VP/CXO) | 90-day mandate to implement preferred tools | High |
| Hiring spike (multiple roles in 30 days) | Aggressive expansion, urgent needs | High |
| Specific role keywords | Direct correlation to tool needs | Medium-High |

**Where to find:**
- LinkedIn Jobs (free search, or Sales Navigator for alerts)
- Company career pages (monitor with a scraper)
- Indeed, Glassdoor (free)
- Apify "Hiring Intent Lead Scraper" (low-cost automation)

**Key advantage:** Very few competitors systematically monitor hiring patterns. Everyone buys the same Bombora data; almost nobody tracks job boards.

### B. Fundraising / Financial Events (Free – High Value)

**Why it works:** Companies that just raised money or went through M&A have budget and mandate to invest in infrastructure and tooling.

| Signal | Source | Intent |
|--------|--------|--------|
| Recent funding round | Crunchbase (free tier), PitchBook, SEC filings | High — budget unlocked |
| IPO/SPAC activity | SEC EDGAR, news | Medium — compliance needs increase |
| M&A announcement | News, press releases | High — integration = new tooling |
| Earnings mention of GPU/AI investment | Earnings transcripts, SEC filings | Very high — confirmed priority |

**Where to find:**
- Crunchbase (free tier: basic company data; paid: $29/mo for advanced)
- SEC EDGAR (free)
- Google News alerts (free)
- PitchBook (expensive but comprehensive)

### C. LinkedIn Activity (Free with Sales Navigator)

**Why it works:** What people post, share, and engage with reveals their priorities.

| Signal | What To Watch |
|--------|--------------|
| Posts about GPU challenges | Direct pain signal |
| Engagement with GPU/AI infrastructure content | Topic interest |
| Job changes (new role at GPU-heavy company) | Decision-maker in motion |
| Company page updates about AI/GPU initiatives | Organizational priority |
| Comments on risk/compliance/insurance content | Awareness of need |

**Tools:**
- LinkedIn Sales Navigator (~$100/mo): Saved searches, alerts, account tracking
- LinkedIn free: Manual monitoring
- Phantombuster: Automated LinkedIn activity tracking (~$69/mo)

### D. Technology Signals (Low Cost)

| Signal | Source | Cost |
|--------|--------|------|
| NVIDIA GPU purchases (BuiltWith, Wappalyzer) | Tech stack detection | Free–$300/mo |
| Cloud GPU usage (AWS, GCP, Azure GPU instances) | Job postings mentioning specific GPU cloud | Free |
| GitHub repos with GPU/CUDA code | GitHub search | Free |
| Conference attendance (GTC, SC, Hot Chips) | Speaker/attendee lists | Free |

### E. Regulatory / Compliance Signals (Free)

| Signal | Source |
|--------|--------|
| New compliance officer hired | Job postings |
| Mention in regulatory proceedings | Government databases |
| Industry regulation changes affecting GPUs | News, Federal Register |
| Data center permit applications | Local government filings |

### Cost Comparison

| Source | Annual Cost | Signal Quality | Coverage |
|--------|------------|----------------|----------|
| Job postings (DIY) | $0 | High | Targeted |
| Crunchbase (free) | $0 | Medium | Broad |
| LinkedIn Sales Nav | ~$1,200 | High | Targeted |
| Google Alerts | $0 | Low-Medium | Broad |
| Phantombuster | ~$830 | Medium | Automated |
| **Total DIY Stack** | **~$2,000/yr** | **Medium-High** | **Good** |
| Bombora (cheapest) | $30,000 | High | Broad |
| G2 Buyer Intent | $50,000 | High (if listed) | Narrow |
| 6sense | $60,000+ | Very High | Broad |

---

## 7. Signals That Predict GPU Operator Readiness for Risk Management

Based on the intent data landscape, these are the specific signals that predict a GPU operator is ready for risk management / insurance discussions:

### Tier 1: Strongest Signals (Act Immediately)

| Signal | Why It's Predictive | Where to Find |
|--------|-------------------|---------------|
| **Hiring a risk manager / compliance officer** | Direct indication they're building risk function | LinkedIn Jobs, company career pages |
| **Searching for "GPU insurance" or "data center risk"** | Actively researching solutions | Bombora/6sense (paid) |
| **Recent GPU cluster failure / outage** | Pain is real and recent | News, Hacker News, social media, Downdetector |
| **Regulatory inquiry or compliance requirement** | External pressure to manage risk | SEC filings, news |
| **RFP for insurance / risk management** | Active buying process | Industry networks, RFP databases |

### Tier 2: Strong Signals (Engage Within Days)

| Signal | Why It's Predictive | Where to Find |
|--------|-------------------|---------------|
| **Series B+ funding with AI/GPU focus** | Budget unlocked, need to protect investment | Crunchbase, PitchBook |
| **Expanding GPU fleet (job postings for GPU engineers)** | More GPUs = more risk exposure | Job boards |
| **New CTO/VP Infrastructure hired** | New leader evaluating risk posture | LinkedIn |
| **Earnings call mentioning GPU capex** | Board-level investment, need to protect it | Earnings transcripts |
| **Data center expansion announced** | Physical risk increasing | News, building permits |

### Tier 3: Early Signals (Nurture)

| Signal | Why It's Predictive | Where to Find |
|--------|-------------------|---------------|
| **Reading content about GPU reliability / failure modes** | Awareness building | TechTarget (paid), blog monitoring |
| **Attending conferences on AI infrastructure** | Category interest | Conference attendee/speaker lists |
| **LinkedIn engagement with risk/insurance content** | Topic awareness | LinkedIn Sales Navigator |
| **Peer company had a major GPU incident** | "Could happen to us" fear | News, industry forums |
| **Growing from <100 to 100+ GPUs** | Crossing the threshold where ad-hoc risk management breaks down | Job postings, tech stack data |

### Composite Scoring Model (DIY)

Assign points to build a simple intent score:

```
Tier 1 signal    = 30 points each
Tier 2 signal    = 15 points each
Tier 3 signal    = 5 points each

Score 30+  → Immediate outreach
Score 15-29 → Warm nurture sequence
Score 5-14  → Add to watch list
Score <5    → Cold — don't waste effort
```

### Recommended Starting Stack

For early-stage, budget-conscious outreach to GPU operators:

1. **LinkedIn Sales Navigator** (~$100/mo) — Track target accounts, monitor job changes, hiring signals
2. **Google Alerts** (free) — GPU failures, data center incidents, funding rounds for target accounts
3. **Crunchbase free tier** — Monitor funding events
4. **Job board monitoring** (free, scripted) — Track GPU-related hiring at target companies
5. **Manual TechTarget/Hacker News monitoring** (free) — Industry content consumption patterns

**Total: ~$1,200/yr** — roughly 25x cheaper than the cheapest paid intent tool.

Scale to Bombora Company Surge ($30K+) once the sales motion is proven and you need broader, automated signal coverage.

---

*Last updated: 2026-03-29*
