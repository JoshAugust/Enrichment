# Nyne.ai — Deep Research Report
*Researched: March 2026*

---

## TL;DR

Nyne.ai is a **real-time people and business data platform** designed specifically as an intelligence layer for **AI agents**. It goes well beyond traditional contact enrichment by building a unified knowledge graph of real people from 250M+ public web sources, delivering confidence-scored, provenance-tracked data via API. The most notable differentiator: it's built *for machines* (AI agents, LLM workflows) rather than for humans browsing a dashboard. Also: they have a **Simulation API** that predicts how a specific person would respond to a given question — a genuinely unique and slightly unnerving capability.

**Stage:** Seed. **Funding:** $5.3M. **ARR:** ~$1M pre-announcement. **Team:** ~9 people.

---

## 1. Product Overview

Nyne positions itself as **"The People Data Company"** — an API-first intelligence layer that gives AI agents structured context about real people and organisations. It aggregates, resolves, and structures public data about individuals into a unified knowledge graph accessible in real time.

### What It Actually Does

- **Contact Enrichment**: Given an email, phone, LinkedIn URL, or name+company, Nyne returns a full profile: contact details (work + personal email, phone), social profiles, work history, education, bio, location, interests.
- **Identity Resolution**: The core technical challenge. Nyne stitches together a person's scattered digital footprints — LinkedIn, Instagram, GitHub, Strava, SoundCloud, Facebook, public records — and confirms they all belong to the same human. It mixes deterministic signals (verified emails, phone hashes) with probabilistic ones (handles, bios, device patterns, behavioural signatures).
- **Real-Time Intent Signals**: Detects life events and buying signals as they happen — job changes, promotions, location moves, social post content, conference attendance.
- **Person-Level, Not Account-Level**: Unlike legacy tools that track company-level intent, Nyne tracks *individuals*. This is a significant architectural difference.
- **AI-Ready Output**: Data is packaged as "agent-ready" snapshots with confidence scores, timestamps, reason codes, and source provenance. Built to feed LLM workflows, not just populate a CRM.

### Full API Surface (24 APIs as of March 2026)

**Person APIs (15):**
| API | What It Does |
|-----|-------------|
| Person Enrichment | Full profile from email/phone/LinkedIn/name |
| Person Search | Find people by name, company, title, location |
| Deep Research | AI-generated intelligence dossier combining enrichment + social data + article mentions |
| Social Newsfeed | Recent posts + engagement metrics from a person's profiles |
| Person Discover | Find professionals matching keywords + location |
| Person Leads | Generate lead lists from natural language descriptions |
| Person Events | Find people linked to key events (fundraises, conferences) |
| Discovery | Open-web NL query → structured results |
| Social Profiles | Find all social profiles given one email or URL |
| Social Interactions | Map social graph (followers, following, engagement patterns) |
| Single Social Lookup | Cross-platform profile resolution from any identifier |
| Article Search | Find articles by/about a specific person |
| Personal Interests | Infer sports, politics, entertainment, hobby interests from social graph |
| **Simulation API** ⚠️ | **Predict how a person would respond to a given question using AI** |
| Competitor Engagements | Track what content a profile engages with; identify competitor interest |

**Company APIs (8):**
| API | What It Does |
|-----|-------------|
| Company Search | Find companies by industry/location/size/keywords |
| Company Enrichment | Full company profile from domain or name |
| CheckSeller | Verify if a company sells a specific product/service (yes/no + evidence + confidence) |
| Feature Checker | Detect technology stack from a company's website |
| Company Needs | AI-summarised pain points and buying signals from public filings |
| Company Funding | Funding rounds, investors, amounts, valuations |
| Investor Lookup | VC funds, angels, portfolio companies, fund size |
| Company Discovery | NL query → matching companies with source citations |

---

## 2. Data Collection & Sourcing

### How They Build the Graph

Nyne deploys **tens of millions of autonomous AI agents** across 250M+ public websites to collect signals. Sources include:

- Major social networks: LinkedIn, Twitter/X, Instagram, Facebook
- Developer platforms: GitHub (commits, activity)
- Niche/lifestyle apps: Strava, SoundCloud
- Discussion forums
- Government/public records
- Online review platforms
- News and article databases

### Identity Resolution Process

1. **Deterministic anchoring**: Verified emails and phone hashes establish identity with certainty
2. **Probabilistic enrichment**: Handles, bios, locations, device patterns, behavioural signatures raise/lower confidence scores
3. **Graph stitching**: Signals are linked to a unified person node across platforms
4. **Continuous updates**: Event-driven architecture — signals are captured as they happen, not in periodic batch refreshes

### Data Output Attributes

Every signal includes:
- **Timestamps** (when captured)
- **Confidence scores** ("high", "medium", "low" with probability scoring)
- **Reason codes** (why a signal was included)
- **Source provenance** (which sources contributed to each attribute)

This explainability-first approach lets developers govern when AI agents act autonomously vs. escalate for human confirmation.

### Privacy & Compliance

- GDPR and CPRA designed-in from day one
- Consent management, data minimisation, opt-out/deletion workflows
- Role-based access controls
- PII hashed or tokenised where possible
- Audit logs documenting signal provenance
- Focused on public data and utility for agent decisioning, *not* ad targeting
- No charge if a person cannot be located (no data = no bill)

---

## 3. Pricing

Nyne uses a **credit-based model**. Specific tier pricing (monthly plan costs) is not publicly listed — contact required for enterprise plans. Free trial available via API signup.

### Known Credit Costs

| Mode | Credits | What's Returned |
|------|---------|-----------------|
| Lite Enrichment | 3 credits | 5 fields only: displayname, firstname, lastname, first org, LinkedIn URL |
| Standard Enrichment | 6 credits | Full profile: contact info, social profiles, work history, education |
| AI-Enhanced Search add-on | 6 credits (same as standard, but slower) | Deeper search for additional social profiles; takes "up to several minutes" |
| Newsfeed add-on | +6 credits (only when data found) | Recent social posts from LinkedIn, Twitter, Instagram, GitHub, Facebook |
| No match | 0 credits | No data found = no charge |

### Rate Limits (Enrichment API)
- 60 requests/minute
- 1,000 requests/hour
- Monthly: plan-dependent

### Access Model
- API key + secret authentication
- Async processing: POST to submit → get `request_id` → poll GET until complete (or webhook callback)
- API documentation: `api.nyne.ai/documentation`
- Contact: `sales@nyne.ai`

---

## 4. Differentiators vs. Established Players

### Competitive Positioning Summary

| Dimension | Nyne.ai | RocketReach | ZoomInfo | Apollo.io |
|-----------|---------|-------------|---------|-----------|
| **Primary buyer** | AI agent developers | Sales reps | Enterprise sales/marketing | SMB sales teams |
| **Data freshness** | Real-time, event-driven | Periodic refresh | Periodic refresh | Periodic refresh |
| **Person vs. account** | Person-level intent | Contact lookup | Account-level intent | Contact lookup |
| **Identity resolution** | Cross-platform graph | Limited | Good | Limited |
| **AI-agent native** | ✅ Core design | ❌ | ❌ | ❌ |
| **Life event signals** | ✅ (pregnancy, relocation, etc.) | ❌ | Partial (job changes) | Partial |
| **Simulation API** | ✅ Unique | ❌ | ❌ | ❌ |
| **Confidence/provenance** | ✅ First-class | ❌ | Limited | ❌ |
| **Niche platform coverage** | ✅ (Strava, SoundCloud, etc.) | ❌ | ❌ | ❌ |
| **Pricing model** | Credit-based, pay-per-result | Credit/subscription | High-cost enterprise contract | Subscription tiers |
| **Database size** | Smaller (newer) | Large | Very large | Large |
| **UI/Dashboard** | Developer-first API | Full UI | Full UI | Full UI |

### Key Differentiators (Nyne's Own Claims)

1. **Event-driven architecture**: Data is captured and delivered as signals happen, not from a static database refreshed quarterly. For sales/recruiting this can be the difference between being first or being late.

2. **Person-level intent**: Apollo, ZoomInfo etc. mostly track *company* signals (hiring trends, tech stack, funding). Nyne tracks *individual people* — their posts, life events, interests, behavioural signals. This is harder to build but more valuable for personalised AI-agent actions.

3. **AI-agent native design**: Not a dashboard. Not CSV exports. Pure API with async processing, webhooks, confidence scores, and provenance metadata — packaged for programmatic consumption by AI systems.

4. **Cross-platform identity stitching**: Where RocketReach/Apollo primarily focus on professional profiles, Nyne reaches into lifestyle platforms (Strava, SoundCloud), niche forums, and public records. This enables richer interest/preference inference.

5. **Simulation API (⚠️ unique)**: Can predict how a specific individual would respond to a given question, using deep research data as context. No equivalent exists in competing platforms. Useful for AI agents needing to anticipate objections or personalise outreach. Also raises obvious privacy/ethics questions.

6. **Competitor Engagements API**: Track which competitor content a specific person is engaging with — useful for real-time competitive intelligence on individual leads.

7. **Life event detection**: Can surface signals like "just moved to Austin" or "20 weeks pregnant" with verified contact info. Granular enough to power highly contextualised outreach from AI agents (travel booking, retail, healthcare outreach, etc.).

8. **CheckSeller + Feature Checker**: Programmatically verify if a company sells a specific product/service or uses specific tech — great for ICP filtering at scale without human research.

### Competitive Framing (from their own blog)

Nyne explicitly frames the incumbents as building on "static list architecture" — built to compile and sell lists, not to feed autonomous agents. Their bet is that the *architecture* mismatch between legacy data tools and AI agent workflows is a genuine gap they can own.

They compare their positioning to an "open web version of what Google does with its walled-garden data advantage" — acknowledging that Google's search data moat is uncrossable, but arguing the rest of the ecosystem needs an independent, portable, consent-aware alternative.

---

## 5. Funding & Company Background

### Founders

| Role | Name | Background |
|------|------|-----------|
| CEO | **Michael Fanous** | UC Berkeley CS + Data Science; former ML engineer at CareRev (healthcare workforce platform) |
| CTO | **Emad Fanous** | Veteran technology executive/CTO; Michael's father |

The father-son dynamic is notable. In a high-pressure, early-stage environment, they argue that the depth of trust accelerates decision-making and execution velocity. Michael has noted: *"If I have to ping him at 3am to finish a launch, I know he's going to still love me the next day."*

### Funding

| Round | Amount | Date | Lead(s) | Notable Angels |
|-------|--------|------|---------|----------------|
| Seed | $5.3M | March 2026 | Wischoff Ventures, South Park Commons | Gil Elbaz (Applied Semantics / Google AdSense pioneer), Karman Ventures, Soleio, Amr Al-Shihabi, Selin Kocalar, Danh Trang, Evan Tana, Aditya Agarwal |

**Gil Elbaz's involvement is strategically significant.** He co-founded Applied Semantics (acquired by Google, became the backbone of AdSense) — i.e., the person who built the infrastructure for contextual advertising at internet scale. His bet on Nyne signals belief that structured human context data for AI agents will become comparably foundational.

Nichole Wischoff (Wischoff Ventures) described the identity-resolution problem as "oddly hard" outside walled gardens — validating that this is genuinely difficult, not just a data warehousing exercise.

### Company Stats
- **HQ**: San Francisco, CA
- **Founded**: 2024 (some sources say 2025; appears to have been incorporated late 2024)
- **Employees**: ~9
- **ARR**: ~$1M (reported pre-seed-announcement — notably strong for a company this young)
- **Website**: nyne.ai | **API docs**: api.nyne.ai

---

## 6. Reviews & User Feedback

**Public reviews essentially don't exist yet.** As of March 2026, Nyne has no listings on G2, Capterra, or Product Hunt. No Reddit threads. No independent analyst coverage. Serchen.com lists them but with no reviews. StartupHub.ai scores them 21/100 (Traction: 34, Team: 30, Visibility: 19, Community: 0) — reflecting early-stage status.

**AI visibility**: One AI visibility analysis (Pendium.ai) scored them 0/100 — meaning they don't appear in AI model responses when queried about B2B data or contact enrichment. This is unsurprising for a company that announced its seed round ~2 weeks before this report was written.

**Traction signals (indirect):**
- ~$1M ARR before the seed round — real customers paying real money before any press
- Integration into Termo.ai as a named "skill" (a third-party AI workflow platform)
- Developer-focused API design suggests early adopters are builders embedding Nyne into their own products, not traditional sales reps

**What users will likely surface once reviews emerge:**
- **Async API pattern** (POST → poll) is unusual compared to synchronous enrichment APIs — could be friction for some
- Enrichment can take "up to several minutes" with AI-enhanced search mode
- Credit model is transparent (no charge for no-match) which is user-friendly
- No public pricing page — contact-required for plan details

---

## 7. Tech Approach

### Architecture

- **Event-driven, real-time**: Not batch ETL from a static database. Signals are captured as they occur and delivered via API/webhook.
- **Async processing**: Requests are queued (POST), processed, then retrievable (GET with `request_id`) or pushed via callback. This implies significant backend compute per request.
- **Agent-native delivery**: Structured JSON with confidence scores, timestamps, and source metadata. Designed to be consumed programmatically by LLM workflows.

### ML/AI Methods Used

1. **Identity Resolution (deterministic + probabilistic hybrid)**:
   - Deterministic: email hash, phone number → high-certainty anchor
   - Probabilistic: username patterns, bio text matching, location inference, device fingerprints, behavioural signatures → confidence score building

2. **Web crawling at scale**:
   - "Tens of millions of autonomous AI agents" across 250M+ sites
   - Implies a distributed crawler fleet with platform-specific parsers/scrapers
   - Structured extraction from semi-structured and unstructured sources

3. **NLP for intent/interest inference**:
   - Social post analysis for life events (pregnancy signals, job changes, location moves)
   - Interest/hobby extraction from content engagement patterns
   - Brand affinity detection from post interactions

4. **AI-Enhanced Search mode**:
   - LLM-powered deep search to discover additional social profiles for sparse-data individuals
   - Significantly longer processing time (up to several minutes) suggests multi-step reasoning chains

5. **Simulation API**:
   - Uses deep research data to build a person-model, then queries that model with a given question
   - Effectively: "given everything we know about this person, how would they respond to X?"
   - Likely powered by RAG (retrieval-augmented generation) over the person's knowledge graph node

6. **Company Needs API**:
   - AI-summarised pain points from public filings (likely 10-K/10-Q parsing, press releases, LinkedIn posts by employees)
   - AI extraction → structured buying signal output

7. **Natural Language Query**:
   - Person Leads and Discovery APIs accept plain English descriptions → convert to optimised search queries
   - "Find Series A fintech founders in NYC who post about credit scoring" type queries

### Technical Stack (inferred)
- Backend: API-first, webhook support, async job queue
- Data layer: Knowledge graph database (likely graph DB + vector embeddings for similarity matching)
- Delivery: REST JSON APIs with key+secret auth
- Processing: Distributed ML pipeline for identity resolution at scale

---

## 8. Strategic Assessment

### What's Genuinely Interesting/Novel

- **The Simulation API is genuinely unique** in the contact intelligence space. Predicting how a named individual would respond to a specific question has no parallel in RocketReach, ZoomInfo, or Apollo. It's arguably the most controversial feature too — raises real questions about consent, accuracy, and misuse.

- **The "picks and shovels for AI agents" thesis is well-timed.** As agentic AI proliferates, the demand for structured human context that AI agents can consume will grow. Nyne is positioning early. The Gil Elbaz bet is interesting — he's essentially saying "this is what AdSense was for advertising, but for AI agents."

- **Life event detection at the person level** (not just account/company) is powerful for use cases beyond sales: fintech onboarding, travel AI, healthcare AI, e-commerce personalisation. This is a broader market than traditional B2B sales intelligence.

- **$1M ARR with 9 people before press coverage** is genuinely impressive signal. Something is working.

### Risks & Unknowns

- **Privacy/regulatory risk**: Aggregating life event signals like pregnancy, location moves, relationship status from public data is legally fraught in multiple jurisdictions. GDPR enforcement could be a headache. The Simulation API (predicting a named individual's responses) is especially vulnerable to scrutiny.
- **Scale and data quality**: Building a real-time identity graph across 250M sites with 9 people is an ambitious engineering challenge. Current database breadth likely doesn't match ZoomInfo's or Apollo's (no public stats on person coverage).
- **No UI/no dashboard**: Developer-only product means Nyne can't easily sell to non-technical buyers without partners building on top of them. This limits direct sales reach.
- **Pricing opacity**: No public pricing page is a conversion friction for self-serve developers.
- **Very early**: No public reviews. No independent validation of data quality. $1M ARR is real but small.

---

## Sources

- [nyne.ai](https://nyne.ai) — official homepage
- [api.nyne.ai/documentation](https://api.nyne.ai/documentation) — full API docs
- [TechCrunch, March 13 2026](https://techcrunch.com/2026/03/13/nyne-founded-by-a-father-son-duo-gives-ai-agents-the-human-context-theyre-missing/)
- [TechFront360 deep dive](https://techfront360.com/the-founder-building-the-people-graph-for-ai-agents-inside-michael-fanous-and-nyne-ais-5-3m-bet/)
- [FindArticles seed funding report](https://www.findarticles.com/nyne-raises-5-3m-to-give-ai-agents-human-context/)
- [Termo.ai Nyne enrichment skill docs](https://termo.ai/skills/nyne-enrichment)
- [StartupHub.ai](https://www.startuphub.ai/startups/nyne)
- [Nyne.ai blog — Apollo Alternatives](https://nyne.ai/blog/apollo-alternatives-real-time-b2b-data-enrichment-2026/)
- ZoomInfo company listing, Pendium.ai AI visibility report
