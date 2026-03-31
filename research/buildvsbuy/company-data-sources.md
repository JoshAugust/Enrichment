# Company Intelligence Data Sources — Build vs Buy Research

_Last updated: 2026-03-29_

---

## 1. Crunchbase (API)

### Pricing
| Tier | Cost | Notes |
|------|------|-------|
| **Free / Basic API** | $0 | 3 endpoints only: Org Search, Org Entity Lookup, Autocomplete. Limited fields. |
| **Pro** | $99/mo ($49/mo billed annually) | Web access, saved searches, alerts. No API. |
| **Business** | $199/mo billed annually ($2,388/yr) | CSV exports, CRM integrations. |
| **Enterprise (API access)** | ~$50,000+/yr (custom quote) | Full API, bulk CSV exports, custom data feeds, dedicated support. |

### API Details
- **Rate limit:** 200 calls/min
- **Format:** REST / JSON
- **Authentication:** API key

### Key Data Fields
- **Organizations:** name, description, HQ address, founding date, status, categories, industry, employee count, website, social links
- **Funding rounds:** date, amount, currency, round type, investors, lead investor
- **Acquisitions:** acquirer, acquiree, date, price, terms
- **People:** name, title, org relationships, social profiles
- **Advanced (Enterprise):** financials, company insights, Mosaic scores, funding predictions, news analytics, employee change predictions

### Verdict
Enterprise API is expensive (~$50K+/yr). Free tier is very limited (3 endpoints, basic fields only). For a niche GPU-focused tracker, the cost is hard to justify unless you need broad cross-industry data at scale.

---

## 2. PitchBook

### Pricing
| Configuration | Reported Cost |
|---------------|--------------|
| 3 users, standard | ~$25,000/yr |
| 5 users, investment banking | ~$45,000/yr |
| 7 users, private equity | ~$60,000/yr |
| 1 user (credit union quote) | ~$40,000/yr |
| Enterprise (100+ users) | $50,000+ implementation alone |

- No public pricing page — all custom quotes
- Auto-renewal with 5–10% annual increases
- API access, Excel plug-in, custom exports are add-ons
- Modular subscription: you pick data modules

### Capabilities
- Deep deal and valuation data
- Fund performance, LP/GP relationships
- Comp tables, cap tables
- Strong in PE/VC deal flow

### Verdict
Extremely expensive for a startup. $25K–$60K/yr minimum. Designed for institutional investors, not for powering a niche data product. API access is an add-on to already expensive plans. Not viable for a build-your-own approach.

---

## 3. CB Insights

### Capabilities
- 11M+ companies, 1,600+ market taxonomies, 1B+ data points
- **ChatCBI™** — natural language queries against their database
- **Mosaic Score** — NSF-backed predictive scoring (commercial maturity, exit probability)
- **Company Scouting Reports** — AI-generated on-demand
- Funding deals, cap tables, M&A, IPO tracking
- Business relationships (partnerships, client/vendor, licensing)
- Management team contacts, headcount, job openings
- Integrations: Salesforce, Microsoft Copilot, Snowflake Marketplace

### Pricing
- **Custom quotes only** — no published pricing
- **Annual contracts** only
- Widely described as "quite pricey" — enterprise-oriented
- No free plan
- Discounted for universities/academic institutions

### Verdict
Powerful intelligence platform but black-box pricing (likely $50K–$100K+/yr for enterprise). Overkill for a focused GPU company tracker. The Mosaic Score and predictive analytics are unique but locked behind expensive contracts.

---

## 4. Free / Low-Cost Alternatives

### 4a. OpenCorporates
- **Coverage:** 200M+ companies across 140+ jurisdictions
- **Data:** Company name, registration number, status, directors, registered address, corporate relationships
- **Free tier:** Available for open-data/public-benefit projects (academics, NGOs, journalists, nonprofits)
- **Paid plans:**
  - Essentials: £2,250/yr
  - Starter: £6,600/yr
  - Basic: £12,000/yr
  - Enterprise: custom
- **API limits:** 500 calls/month on free tier
- **Best for:** Corporate structure, registration data, KYB. **Not** for funding rounds or financials.

### 4b. Companies House API (UK)
- **Cost:** Completely free. No subscription, no per-call charges.
- **Rate limit:** 600 requests per 5-minute window (~2 req/sec)
- **Data available:**
  - Company profile (name, number, status, creation date, SIC codes)
  - Registered office address
  - Officers and appointments
  - Filing history and documents
  - Persons with Significant Control (PSC / beneficial ownership)
  - Charges and insolvency
  - Accounts info (reference dates, types, overdue status)
- **Streaming API** also available for real-time change notifications
- **Best for:** UK-registered companies. Essential for any UK GPU/semiconductor company tracking. Excellent for ownership chains and director networks.

### 4c. SEC EDGAR API (US)
- **Cost:** Completely free. No API key required for basic access.
- **Rate limit:** 10 requests/second
- **Key endpoints:**
  - `/api/xbrl/companyfacts/CIK{number}.json` — all XBRL financial data for a company
  - `/api/xbrl/companyconcept/` — specific financial concepts (e.g., revenue, net income)
  - `/api/xbrl/frames/` — cross-company comparison for a given financial metric and period
  - Submissions API — all filings metadata
- **Bulk download:** `companyfacts.zip` contains all XBRL data
- **Data:** 10-K, 10-Q, 8-K filings, financial statements (XBRL/iXBRL), insider transactions, proxy statements
- **Best for:** Public US companies. NVIDIA, AMD, Intel, Qualcomm — all their financials are here in structured XBRL. Excellent for automated financial analysis.

### 4d. Other Free Sources
| Source | What You Get | Cost |
|--------|-------------|------|
| **Dealroom** | EU-focused startup/funding data | Free community plan; Pro ~€6K/yr |
| **OpenVC** | 10K+ verified investors, direct pitch submission | Free |
| **Tracxn** | 4.9M+ companies, 3K+ sector taxonomies | Free tier available; paid from ~$500/mo |
| **SemiEngineering.com** | Quarterly semiconductor startup funding reports | Free articles |
| **SIA (Semiconductor Industry Association)** | Industry investment data, policy reports | Free reports |
| **Apollo.io / ZoomInfo Lite** | Contact & company data | Free tiers available |

---

## 5. GPU / Semiconductor Company Public Data

### What's Freely Available

**Public companies (NVIDIA, AMD, Intel, Qualcomm, Broadcom, etc.):**
- Full financials via SEC EDGAR (XBRL structured data)
- 10-K/10-Q filings with segment breakdowns, R&D spend, capex
- Insider transactions, executive compensation
- Proxy statements with board composition
- Real-time stock data from free APIs (Yahoo Finance, Alpha Vantage)

**Private GPU/AI chip startups (Cerebras, Tenstorrent, Etched, Groq, etc.):**
- Funding rounds typically announced via press releases and covered by:
  - TechCrunch, The Information, SemiEngineering
  - Company blogs and PR wire services
- Key recent raises (publicly reported):
  - Cerebras: $1.1B Series G (Fidelity, Atreides)
  - Tenstorrent: $693M+ Series D (Samsung Securities, AFW Partners)
  - Etched: $500M (Stripes, Peter Thiel)
  - Mythic: $125M (DCVC)
- Crunchbase free tier shows basic profiles and some funding data

**Industry-level data:**
- US semiconductor startup funding: $6.2B in 2025 (+85% YoY, record high)
- AI/ML semiconductor VC: $8.4B in 2025 (+75% vs 2024)
- Deal count declining (174 in 2025 vs 214 in 2024) — consolidation trend
- NVIDIA participated in 50 venture deals by Oct 2025

### Key Insight for GPU Tracker
The GPU/semiconductor space is a **relatively small universe** (~100–200 relevant companies). Most meaningful data can be assembled from:
1. SEC EDGAR for public companies
2. Press releases + news monitoring for private company funding
3. Companies House for UK entities
4. Manual curation + web scraping of company websites

You don't need Crunchbase/PitchBook for this niche — the universe is small enough to track manually with automation assistance.

---

## 6. Free Funding Data via News Monitoring

### Strategy: RSS + NLP Pipeline

**Primary RSS Sources:**
| Source | Feed | What It Catches |
|--------|------|-----------------|
| TechCrunch Startups | `techcrunch.com/category/startups/feed/` | Funding rounds, startup news |
| Business Wire Funding | `businesswire.com/newsroom/subject/funding` | Press releases on raises |
| SemiEngineering | `semiengineering.com/feed/` | Semiconductor-specific startup news |
| Crunchbase News | `news.crunchbase.com/feed/` | Funding announcements, analysis |
| The Information | Manual / newsletter | Deep semiconductor scoops |
| VentureBeat | `venturebeat.com/feed/` | AI/tech funding coverage |

**Pipeline Approach:**
1. **Ingest** RSS feeds on a schedule (every 15–60 min)
2. **Filter** for semiconductor/GPU/AI chip keywords
3. **Extract** structured data via LLM: company name, amount, round type, investors, valuation
4. **Deduplicate** across sources
5. **Enrich** with SEC EDGAR data (if public) or Companies House (if UK)
6. **Store** in your own database

**Advantages over paid APIs:**
- Zero marginal cost per query
- Real-time (faster than Crunchbase data entry lag)
- Customizable extraction — you define what fields matter
- No vendor lock-in or rate limits

**Disadvantages:**
- Requires NLP/LLM extraction (but cheap with local models or GPT-4o-mini)
- Won't catch undisclosed/stealth rounds
- Historical data requires backfill from other sources
- Needs ongoing maintenance of feed sources

### Additional Free Monitoring Tools
- **Google Alerts** — keyword-based email alerts (free, zero-effort)
- **Feedspot** — RSS aggregator with 100+ startup feeds curated
- **GitHub: awesome-tech-rss** — curated list of tech/startup RSS feeds

---

## 7. Summary & Recommendations

### For a GPU-Focused Company Tracker

| Approach | Cost | Completeness | Effort |
|----------|------|-------------|--------|
| **Crunchbase Enterprise** | ~$50K/yr | High (broad) | Low |
| **PitchBook** | ~$25K–60K/yr | Very high (deep financials) | Low |
| **Build: SEC EDGAR + Companies House + News RSS + LLM extraction** | ~$0–50/mo (LLM costs) | Medium-high for this niche | Medium |
| **Build + Crunchbase Basic API** | ~$0/mo | Medium | Medium |
| **Dealroom + Manual** | ~€6K/yr | Medium (EU-heavy) | Medium |

### Recommendation
**Build it.** For a focused GPU/semiconductor tracker (~100–200 companies):
1. SEC EDGAR (free) handles all public company financials
2. Companies House (free) handles UK entity data
3. RSS + LLM extraction (near-free) catches funding announcements in real-time
4. Manual curation is feasible at this universe size
5. Crunchbase free tier can supplement with basic company profiles

The paid platforms ($25K–$100K/yr) are designed for broad cross-industry intelligence at scale. For a niche vertical tracker, you'd be paying for 95% of data you don't need.
