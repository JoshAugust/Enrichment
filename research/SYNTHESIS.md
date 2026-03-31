# FINAL SYNTHESIS — Corgi Insurance GPU RVG Intelligence Operation
**Operation Duration:** 11 hours (2026-03-28 20:04 PDT → 2026-03-29 08:22 PDT)  
**Model:** claude-opus-4-6  
**Total Agents Deployed:** 60+ subagents across 6 waves + Creativity Engine (33-agent pipeline)  
**Total Research Files:** 107 files, ~1.5MB  
**Compiled by:** Brock  
**Date:** 2026-03-29

---

## EXECUTIVE SUMMARY

Over 11 hours, 60+ parallel research agents built a comprehensive intelligence picture for Corgi Insurance's GPU Residual Value Guarantee (RVG) product launch. The findings:

1. **The market gap is confirmed and urgent.** $20B+ in GPU-backed debt exists with no standalone commercial RVG product. Lenders contractually require collateral insurance that doesn't adequately exist. CoreWeave alone has $12.4B in GPU-backed debt.
2. **~300 unique companies identified** across GPU operators, lenders, reinsurers, and adjacent players. **64 priority-scored**, with 3 Tier-S targets ready for immediate outreach.
3. **Don't buy ZoomInfo.** A $197/month DIY stack (Apollo free + Hunter.io + Coresignal + Reoon + Instantly.ai) delivers 85-90% of ZoomInfo's data quality for niche B2B at 1.5% of the cost.
4. **Build a trigger-detection system, not a contact database.** Import records, UCC filings, and job postings reveal buying intent before prospects self-identify — signals ZoomInfo doesn't capture.
5. **33 verified email contacts** found, **4 gateway contacts** with deep dossiers, **23 companies** with confirmed email patterns.

---

## SECTION 1: PLATFORM ANALYSIS — RocketReach vs ZoomInfo vs Nyne.ai

### 1.1 How Each Collects Data

| Dimension | RocketReach | ZoomInfo | Nyne.ai |
|-----------|------------|----------|---------|
| **Primary method** | Web scraping + social media crawling + ML email pattern inference | Contributory data model (scans email signatures of 20M users/month) + web crawling + human research teams | Autonomous AI agents crawling 250M+ public web sources; identity graph stitching |
| **Database size** | 700M+ professionals, 60M+ companies | 260M+ professionals, 100M+ companies, 135M+ verified phones | Undisclosed (seed-stage); claims real-time crawling rather than static DB |
| **Unique source** | Browser extension from 26M+ users passively validates data | "Community Edition" — users trade inbox access for free tier; ZoomInfo scans all their email contacts' signatures | Social platform stitching (LinkedIn, GitHub, Strava, SoundCloud, Instagram → unified person node) |
| **Verification** | SMTP checks + catch-all detection; A/B grading system | AI/ML cross-referencing + NeverBounce integration + human researchers | Confidence-scored with provenance tracking; timestamps on every signal |
| **Refresh cadence** | Periodic batch processing | Daily (~4M people, ~1M companies) | Event-driven (real-time on signal detection) |
| **Intent data** | None native (Intentsify partnership) | Native Bombora-powered intent + bidstream data | Person-level intent from social activity + job changes + content engagement |

### 1.2 Accuracy — Claims vs Reality

| Metric | RocketReach | ZoomInfo | Nyne.ai |
|--------|------------|----------|---------|
| **Claimed email accuracy** | 98% (A-grade) | 95% (company affiliation) | Not disclosed (confidence-scored per signal) |
| **Real-world email deliverability** | 80-90% for A-grade; some users report 56% overall | 75-85% in practice; NeverBounce scored 63% in Hunter's 2026 independent test | Too early to benchmark independently |
| **Phone fill rate** | 60%+ claimed | 70M+ direct dials; strongest differentiator | Not a focus (AI agent → API workflow, not phone calls) |
| **Geographic strength** | US/UK strongest; weak outside anglophone markets | US/Canada strongest; significant drop-off in EU/APAC | Claims global via web crawling; unverified |
| **Niche company coverage** | Weak for <50 employee firms; scraped data may be stale | Under-indexes SMBs; optimized for mid-market+ US companies | Potentially better for niche (real-time crawling vs static DB) but unproven |

### 1.3 Pricing

| Tier | RocketReach | ZoomInfo | Nyne.ai |
|------|------------|----------|---------|
| **Entry** | Free (5 lookups/mo) → $53/mo annual (1,200/yr) | No free tier; $14,995-18,000/yr minimum | $0.10/enrichment API call; pay-as-you-go |
| **Mid** | $126/mo annual (3,600 lookups/yr) | $24,995/yr (Advanced) | Volume discounts available |
| **Enterprise** | $252/mo annual (10,000/yr) | $35,000-60,000+/yr (Elite + add-ons) | Custom enterprise |
| **Cost per contact** | $0.025-0.063 (plan); $0.30-0.45 (overage) | ~$0.30-1.50 (depends on credits/plan) | $0.10/enrichment (transparent) |
| **Contract** | Monthly or annual | Annual only; auto-renewal; 10-20% renewal hikes common | Pay-as-you-go |
| **Hidden costs** | Phone numbers require Pro+ ($126+/mo) | Additional users ~$1,500 each; Global Passport ~$10K; Intent add-on extra | None known (seed-stage, pricing may change) |

### 1.4 Honest Verdict for Niche B2B (GPU Operators / Reinsurers)

**None of them are good enough for your use case. Here's why:**

| Platform | Verdict | Why |
|----------|---------|-----|
| **ZoomInfo** | ❌ Overpriced, under-delivers for niche | $15K+/yr for a database that under-indexes GPU startups (<50 employees), offshore reinsurers (non-US, small), and specialty lenders. You'd pay enterprise prices for mid-market US coverage you don't need. The contributory model means their data is strongest where sales teams already operate — not in your niche. |
| **RocketReach** | ⚠️ Decent for initial lookups, not a system | Good for one-off email lookups at $0.03-0.06/contact. But no intent data, weak outside US/UK, and accuracy degrades fast for niche companies. Useful as one tool in a stack, not as the stack. |
| **Nyne.ai** | 🔮 Most architecturally promising, too early | Built for the right future (AI agents, real-time signals, person-level intent). The Simulation API is genuinely novel. But: seed-stage ($5.3M raised), ~9 people, ~$1M ARR. Production reliability unproven. Worth watching and testing their API on 10-20 targets, but not betting the pipeline on. |

**The actual answer:** Build a lean hybrid stack for $197-350/month (see Section 2) and supplement with manual research for the ~50 highest-priority targets.

### 1.5 Hidden Weaknesses & Controversies

**ZoomInfo:**
- The "Community Edition" contributory model scrapes contacts from *everyone a user emails with* — without those contacts' consent. Multiple lawsuits filed (class actions in CA, IL).
- SEC filing admits they "cannot verify" where some third-party data originated or whether it was collected in compliance with privacy laws.
- NeverBounce (ZoomInfo's own email verifier) scored 63.17% in Hunter's independent 2026 benchmark — bottom third of 15 tools tested.
- Renewal price hikes of 10-20% are standard. Annual-only contracts with auto-renewal. Users report difficulty cancelling.

**RocketReach:**
- Scrapes LinkedIn profiles in violation of LinkedIn's Terms of Service. Individual users report LinkedIn account risks from the Chrome extension.
- Medium post documented RocketReach surfacing personal emails that had been exposed in data breaches.
- 20-30% bounce rates reported by multiple G2/Capterra reviewers. One user reported 56% actual deliverability vs 99% claimed.

**Nyne.ai:**
- Simulation API ("predict how a person would respond to a question") is genuinely unsettling from a privacy/ethics perspective. No regulatory framework exists for this capability.
- Seed-stage company — could pivot, fold, or get acquired at any time.
- Deploys "tens of millions of autonomous AI agents" across social platforms — likely violating ToS of most platforms it crawls.

---

## SECTION 2: HOW TO DO IT BETTER AND CHEAPER

### 2.1 Recommended DIY Enrichment Stack

| Layer | Tool | Monthly Cost | Function |
|-------|------|-------------|----------|
| **Discovery** | Apollo.io (free tier) | $0 | Contact search across 275M+ profiles; 100 credits/mo |
| **Email patterns** | Hunter.io (Starter) | $34 | Domain email pattern discovery + verification; 2,000 credits/mo |
| **Niche LinkedIn data** | Coresignal (Starter) | $49 | LinkedIn-sourced employee data for companies not in Apollo |
| **Email verification** | Reoon | $10 | Bulk SMTP verification; ~15,000 verifications/mo |
| **Sending + warmup** | Instantly.ai (Growth) | $37 | Cold email platform + peer-to-peer inbox warm-up |
| **Infrastructure** | 3 domains + 9 Google Workspace inboxes | $67 | Outreach domains (never use primary brand for cold email) |
| **TOTAL** | | **$197/mo** | |

**Growth tier** (add when hitting limits): +$49 Coresignal Starter = **$246/mo**  
**Scale tier** (1,000-2,000 contacts/mo): +Apollo Basic ($49) + Hunter Growth ($104) = **$350/mo**  
**Full budget**: +Coresignal Pro = **~$1,000/mo** for 5,000+ contacts/month

### 2.2 Cost Comparison

| Capability | ZoomInfo Cost | DIY Stack Cost | Quality Delta |
|-----------|-------------|---------------|--------------|
| Contact search | $15,000+/yr | $0 (Apollo free) | 90% equivalent |
| Email verification | Included (NeverBounce — 63% accuracy) | $44/mo (Hunter + Reoon — better accuracy) | **DIY wins** |
| Company firmographics | Included | $0 (Apollo + public sources) | Comparable |
| LinkedIn-sourced data | Included | $49/mo (Coresignal) | 85% equivalent |
| Cold email platform | Not included (need separate) | $37/mo (Instantly) | N/A |
| Intent data | Included (genuine moat) | Not available | ZoomInfo wins — but irrelevant at <500 prospects |
| Phone numbers | Included (70M+ direct dials) | Limited (~15-20% from Apollo) | ZoomInfo wins — add Lusha $20-52/mo if needed |
| **Annual total** | **$15,000-60,000** | **$2,364-4,200** | **85-90% quality at 3-15% of cost** |

### 2.3 Step-by-Step Build Guide

**Week 1 — Infrastructure ($100 one-time + $104/mo ongoing)**
1. Register 2-3 outreach domains (e.g., corgiinsurance-team.com, getcorgiinsurance.com)
2. Set up 3 Google Workspace inboxes per domain (9 total)
3. Configure SPF, DKIM, DMARC on all domains
4. Sign up for Instantly.ai Growth; begin inbox warm-up (2 weeks before first send)

**Week 2 — Enrichment Tools ($44/mo added)**
1. Create Apollo.io free account; import target company list
2. Sign up for Hunter.io Starter; begin domain email pattern discovery
3. Sign up for Reoon; test bulk verification on 50 known emails
4. Build master spreadsheet: Company | Contact | Title | Email | Source | Verified? | Outreach Status

**Week 3 — First Campaign**
1. Write 3 email templates per vertical (GPU operators, lenders, reinsurers = 9 total)
2. Set up 3-email sequences in Instantly.ai (initial + day 3 follow-up + day 7 value-add)
3. Send first wave: 50 verified contacts
4. Monitor bounce rates (<3%) and engagement

**Week 4 — Optimize & Scale**
1. Review open/reply rates; A/B test subject lines
2. Add Coresignal ($49/mo) if Apollo coverage insufficient for niche targets
3. Scale to 100+ contacts/week
4. Begin import record monitoring (ImportGenius, $99/mo — see Section 5)

### 2.4 Creative Signal Sources They Don't Use

These are the asymmetric intelligence sources that no platform captures:

| Signal Source | Cost | What It Reveals | Why Competitors Miss It |
|-------------|------|----------------|----------------------|
| **ImportGenius** (GPU HS codes) | $99/mo | Which companies are importing GPU hardware, when, and how much | ZoomInfo/RocketReach don't index customs data |
| **UCC-1 filings** (state databases) | $5-25/search | Which GPU operators have equipment liens; which lenders hold them | Requires state-by-state manual searches; no aggregated API |
| **SEC EDGAR full-text search** | Free | GPU fleet sizes, depreciation schedules, debt structures, lender names | Buried in 10-K footnotes; requires reading actual filings |
| **Bermuda Monetary Authority registry** | Free | New ILS structures, captive formations, reinsurer registrations | Niche regulatory source; only relevant to offshore insurance specialists |
| **Job posting velocity** (LinkedIn/Indeed alerts) | Free | Companies hiring GPU infrastructure roles = capacity expansion = insurance trigger | Hiring intent isn't captured by contact databases |
| **NVIDIA Partner Network announcements** | Free | New NPN Elite/Preferred partners = confirmed GPU operators | Scattered across press releases; no aggregated feed |
| **Conference speaker archives (GTC, SC, Monte Carlo)** | Free | Named decision-makers with titles, companies, and topics — from 2022-2026 | Public but rarely scraped; most sales teams use only current year |
| **Patent/IP filings** (Google Patents) | Free | GPU cooling, rack design, power management patents = infrastructure buildout | Too technical for sales teams; strong signal for insurance timing |
| **Utility commission filings** | Free | Large power load applications = data center construction = future GPU deployment | Local government records; invisible to national databases |

---

## SECTION 3: LEGAL CONFIDENCE

### 3.1 What You CAN Do

| Activity | Legal Basis | Risk Level |
|----------|-----------|------------|
| Scrape publicly visible company websites | hiQ v LinkedIn (Ninth Circuit): scraping public data ≠ CFAA violation | 🟢 Low |
| Collect business contact info from press releases, SEC filings, company contact pages | Publicly available information; standard B2B practice | 🟢 Low |
| Send B2B cold emails (US targets) | CAN-SPAM: legal with unsubscribe link + physical address + honest subject lines | 🟢 Low |
| Send B2B cold emails (UK targets) | PECR: corporate subscribers exempt; GDPR legitimate interest applies | 🟢 Low |
| Send B2B cold emails (France, Netherlands, most EU) | Generally allowed under legitimate interest with relevant B2B content | 🟡 Low-Medium |
| Use Apollo/Hunter/Coresignal for enrichment | Standard B2B practice; they handle data collection compliance | 🟢 Low |
| Monitor UCC filings, SEC EDGAR, import records | Public government records | 🟢 Negligible |
| Cross-reference publicly available data sources | No legal issue with combining public data | 🟢 Low |

### 3.2 What You CANNOT Do

| Activity | Legal Risk | Consequence |
|----------|-----------|-------------|
| Cold email German companies (without prior consent) | ❌ UWG Section 7 requires double opt-in even for B2B | Fines; use LinkedIn or phone instead |
| Scrape LinkedIn behind login walls / create fake accounts | ❌ ToS violation + potential CFAA risk if bypassing authentication | Account ban; potential lawsuit |
| Continue emailing after opt-out | ❌ CAN-SPAM ($46,517/violation); GDPR (€20M or 4% revenue) | Fines + reputational damage |
| Collect personal (non-business) email addresses for B2B outreach in EU | ❌ GDPR applies to personal data regardless of B2B context | DPA investigation; fines |
| Ignore CCPA data subject requests from California contacts | ❌ B2B exemption expired Jan 2023; full consumer rights apply | Fines; 45-day response required |
| Sell/share scraped contact data without notice | ❌ CCPA requires notice at collection if data is sold/shared | Regulatory action |

### 3.3 GDPR Compliance Approach for European Targets

**Legal basis:** Legitimate Interest (Article 6(1)(f)) — the standard basis for B2B cold outreach in most of Europe.

**Required documentation (Legitimate Interest Assessment):**
1. **Purpose test:** "We have a legitimate business interest in contacting decision-makers at companies whose GPU infrastructure creates insurance needs our product specifically addresses."
2. **Necessity test:** "Targeted email outreach is proportionate — we contact only named individuals in relevant roles, not mass lists."
3. **Balancing test:** "A VP of Infrastructure at a GPU cloud company would reasonably expect to receive relevant insurance product information at their work email."

**Practical compliance checklist:**
- [ ] Collect only essentials: name, work email, job title, company
- [ ] Every outreach email explains where you got their data and why
- [ ] One-click unsubscribe, honored within 24 hours
- [ ] Maintain written LIA documentation
- [ ] Record data sources for every contact
- [ ] Delete data you no longer need
- [ ] **Germany exception:** Do not cold email. Use LinkedIn InMail or phone only.
- [ ] **Sole traders/partnerships in UK:** PECR treats these as individuals, not corporate subscribers — need consent

### 3.4 Safe Harbor Approaches

1. **Preference for business emails over personal:** Always target work email addresses; never personal Gmail/Outlook
2. **Source documentation:** Maintain a log of where each contact's data came from (press release URL, SEC filing, company website)
3. **Easy opt-out:** Include unsubscribe in every message; honor immediately; maintain permanent suppression list
4. **Data minimization:** Don't hoard — delete contacts that don't engage after 3 sequences
5. **Separate outreach domains:** Never cold email from your primary brand domain
6. **Privacy policy:** Publish a clear privacy policy on corgiinsurance.com covering B2B outreach data collection

---

## SECTION 4: TARGET DATABASE SUMMARY

### 4.1 Total Universe

| Metric | Count |
|--------|------:|
| **Total unique companies identified** | ~300 |
| **Priority-scored (0-100 composite)** | 64 |
| **Tier S (90-100) — Act Now** | 3 |
| **Tier 1 (80-89) — High Priority** | 11 |
| **Tier 2 (70-79) — Strong Pipeline** | 15 |
| **Tier 3 (60-69) — Qualified Prospects** | 19 |
| **Tier 4 (50-59) — Watch List** | 16 |
| **Contacts with confirmed/high-confidence email** | 33 |
| **Gateway contacts with deep dossiers** | 4 |
| **Companies with confirmed email domain patterns** | 23 |

### 4.2 By Category

| Category | Companies | Tier A (75+) | Key Insight |
|----------|----------:|:------------:|-------------|
| GPU Cloud Operators (Neo-clouds) | 38 | 12 | Primary RVG buyers; ~$40-60B in GPU hardware on balance sheets |
| Sovereign AI / Government GPU | 22 | 8 | Middle East + India dominate; government financing reduces lender-mandated insurance pressure |
| Telecom GPU Operators | 15 | 6 | Strong in KR, JP, DE, FR, SG; UK telecoms avoid GPU ownership |
| European GPU Operators | 16 | 5 | nscale leading; Nebius exploding (NVIDIA $2B + Meta $12B) |
| APAC GPU Operators | 18 | 4 | India strongest; SE Asia thin; Firmus AU outstanding |
| Africa GPU Operators | 10 | 3 | Cassava/ADC confirmed live March 2026 |
| LATAM GPU Operators | 10 | 2 | Brazil dominant; rest underdeveloped |
| Energy Companies (GPU/HPC) | 9 | 2 | Aramco Digital best prospect |
| GPU Lenders & Equipment Finance | 30 | 10 | **Distribution channel** — if one major lender mandates RVG in covenants, Corgi gets customers as a side effect |
| Bermuda / Offshore Reinsurers | 27 | 8 | Primary capacity market for RVG product; build these relationships first |
| Lloyd's Syndicates (Tech) | 11 | 3 | Beazley, Canopius, Ascot top picks |
| Specialty Tech Insurers / MGAs | 22 | 5 | ATA ($750M facility), Shepherd ($42M Series B), FM Global |
| Reinsurance Brokers | 10 | 5 | Lockton Re = #1 priority for first call |

### 4.3 Geographic Breakdown

| Region | Companies | Key Markets |
|--------|----------:|-------------|
| North America (USA/Canada) | ~95 | CoreWeave, Crusoe, Lambda, xAI/Valor, Applied Digital, Hut 8 |
| Europe | ~55 | nscale (UK), Nebius (NL), Deutsche Telekom (DE), Orange (FR) |
| Middle East | ~25 | HUMAIN (SA), G42 (UAE), Aramco Digital (SA), NEOM (SA) |
| Asia-Pacific | ~45 | Yotta (IN), Firmus (AU), SK Telecom (KR), SoftBank (JP), Singtel (SG) |
| Africa | ~15 | Cassava/ADC (Pan-Africa), Kasi Cloud (NG), iXAfrica (KE) |
| LATAM | ~15 | Elea (BR), Omnia/Pátria (BR) |
| Bermuda/Cayman (reinsurers) | ~35 | Everest Re, RenaissanceRe, AXIS, Arch, Fidelis, Convex |
| Lloyd's Market | ~15 | Beazley, Canopius, Ascot, Hiscox |

### 4.4 Top 30 Priority Targets

#### TIER S — ACT NOW

| # | Company | Country | Category | Score | Est GPU Value | Key Contact | Best Route |
|---|---------|---------|----------|:-----:|--------------|-------------|------------|
| 1 | **CoreWeave** | USA | GPU Cloud | 95 | $7.5B+ (250K+ GPUs) | Michael Intrator (CEO), Nitin Agrawal (CFO) | press@coreweave.com ✅ |
| 2 | **nscale** | UK/Europe | GPU Cloud | 90 | $6B+ (200K GB300) | Viet Dinh (CEO) | press@nscale.com, IR@nscale.com ✅ |
| 3 | **Crusoe Energy** | USA | GPU Cloud | 90 | $3B+ (100K GPUs) | Chase Lochmiller (CEO), Michael Gordon (CFO) | saxelrod@crusoeenergy.com ✅ (flast@ pattern) |

#### TIER 1 — HIGH PRIORITY

| # | Company | Country | Category | Score | Est GPU Value | Key Contact | Best Route |
|---|---------|---------|----------|:-----:|--------------|-------------|------------|
| 4 | **HUMAIN** | Saudi Arabia | Sovereign AI | 85 | $10B+ (600K GPU plan) | Tareq Amin (CEO) | Warm intro required (PIF-backed) |
| 5 | **G42 / Core42** | UAE | Sovereign AI | 85 | $3B+ (82K GPUs) | Peng Xiao (CEO) | Warm intro required |
| 6 | **Lambda Labs** | USA | GPU Cloud | 85 | $1.5B+ | Stephen Balaban (CEO) | pr@lambda.ai ✅ |
| 7 | **Stargate JV** | USA | AI Infrastructure | 85 | $50B+ (450K+ GB200) | No direct contact | Via Oracle/SoftBank/OpenAI channels |
| 8 | **Deutsche Telekom** | Germany | Telecom/AI | 80 | $500M+ | Tim Höttges (CEO) | Public company IR portal |
| 9 | **Orange Group** | France | Telecom/AI | 80 | $500M+ | Christel Heydemann (CEO) | Public company IR portal |
| 10 | **Yotta Data** | India | DC/AI Cloud | 80 | $500M+ (16K+ H100) | Sunil Gupta (CEO) | Warm intro preferred |
| 11 | **Cassava / Africa DC** | Pan-Africa | DC/AI Cloud | 80 | $500M+ | Strive Masiyiwa (Founder) | enquiries@africadatacentres.com ✅ |
| 12 | **Nebius Group** | Netherlands | GPU Cloud | 80 | $2B+ (95K GPUs) | Arkady Volozh (CEO) | media@nebius.com ✅ |
| 13 | **xAI / Valor Compute** | USA | AI/GPU Fund | 80 | $5B+ | Antonio Gracias (VCI CEO) | Apollo financial channels |
| 14 | **Oracle Cloud** | USA | Hyperscaler | 80 | $10B+ | Safra Catz (CEO) | Public company; challenging reach |

#### TIER 2 — STRONG PIPELINE

| # | Company | Country | Category | Score | Est GPU Value | Key Contact | Best Route |
|---|---------|---------|----------|:-----:|--------------|-------------|------------|
| 15 | **SK Telecom** | South Korea | Telecom/AI | 75 | $300M+ | Ryu Young-sang (CEO) | Public company |
| 16 | **SoftBank Corp** | Japan | Telecom/AI | 75 | $500M+ | Junichi Miyakawa (CEO) | Public company |
| 17 | **Aramco Digital** | Saudi Arabia | Energy/AI | 75 | $500M+ | Nabil Al-Nuaim (CEO) | Warm intro |
| 18 | **Firmus Technologies** | Australia | GPU Cloud | 75 | $1B+ (54K GB300) | Unknown | NVIDIA channels (equity investor) |
| 19 | **FluidStack** | UK | GPU Cloud | 75 | $1B+ | Unknown | $10B Macquarie facility; limited contact data |
| 20 | **Applied Digital** | USA | HPC/DC | 70 | $250-500M | Wes Cummins (CEO) | jsa_applied@jsa.net (PR agency) ✅ |
| 21 | **IREN Ltd** | Australia/USA | GPU Cloud | 70 | $50-100M | Kane Doyle (IR) | kane.doyle@iren.com ✅ |
| 22 | **Together AI** | USA | AI/GPU Cloud | 70 | $100M+ | Rajan Sheth (CMO) | rajan@together.ai ✅ |
| 23 | **Vultr** | USA | GPU Cloud | 70 | $200M+ | J.J. Kardwell (CEO) | Private; limited data |
| 24 | **Singtel / Nxera** | Singapore | Telecom/GPU | 70 | $200M+ | Bill Chang (CEO Nxera) | Enterprise portal |
| 25 | **NTT Group** | Japan | Telecom/AI | 70 | $300M+ | Akira Shimada (CEO) | Public company |
| 26 | **NEOM / TONOMUS** | Saudi Arabia | Sovereign AI | 70 | $500M+ | Unknown | Warm intro required |
| 27 | **Qai / QCRI** | Qatar | Sovereign AI | 70 | $500M+ | Unknown | Brookfield JV channels |
| 28 | **Lightning AI** *(ex-Voltage Park)* | USA | GPU Cloud | 70 | $600M+ (35K+ GPUs) | Ozan Kaya (President) | lightning.ai (Voltage Park merged Jan 2026) |
| 29 | **Hut 8 Corp** | USA | GPU Cloud | 65 | $30-80M | Asher Genoot (CEO) | Public company |
| 30 | **ExxonMobil** | USA | Energy/HPC | 65 | $200M+ | M.P. Zamora (Tech President) | Public company; niche GPU dept |

### 4.5 Data Quality Scores

| Enrichment Level | Contact Count | % of Top 64 |
|-----------------|:------------:|:-----------:|
| 🟢 8-10 (Excellent — verified email + phone + LinkedIn) | 5 | 5% |
| 🟡 6-7 (Good — confirmed email pattern + contacts ID'd) | 14 | 22% |
| 🟠 4-5 (Moderate — contacts ID'd, no email) | 18 | 28% |
| 🔴 2-3 (Weak — C-suite name only) | 22 | 34% |
| ⚫ 0-1 (Minimal — company name only) | 7 | 11% |

**Average enrichment score: 4.3/10** — strongest for US GPU operators and London/Bermuda insurers; weakest for sovereign AI entities and private companies.

### 4.6 Critical Data Corrections

| Issue | Details |
|-------|---------|
| **Voltage Park no longer exists** | Merged with Lightning AI (Jan 21, 2026). All @voltagepark.com emails defunct. |
| **Crusoe CFO changed** | Matthew DeNezza → Michael Gordon (Dec 2025). All CFO templates need updating. |
| **IREN domain migration** | irisenergy.co → iren.com (Nov 2024). Old emails may not route. |
| **Nebius underscored** | Should be 90+ after NVIDIA $2B investment + Meta $12B contract (March 2026). |

---

## SECTION 5: CREATIVITY ENGINE INSIGHTS

### 5.1 The Headline Insight

> **"Build a trigger-detection system, not a contact database."**
> — First Principles Destructor Agent

Contact data is a byproduct of commercial activity, not a product. Every GPU purchase leaves traces: import manifests, UCC filings, hiring patterns, power applications. These traces exist whether you pay ZoomInfo or not. The real competitive advantage is in detecting *triggers* — the moments when a company enters a buying window — not in maintaining a static list of emails.

### 5.2 Best Ideas from the 33-Agent Creative Pipeline

**1. Import Record Monitoring (Highest Leverage)**
- ImportGenius ($99/mo) alerts for GPU hardware HS codes (8471.50, 8473.30)
- Companies importing $200K+ in GPU hardware = involuntary broadcast of expansion intent
- Cross-reference company names against LinkedIn within 48 hours of customs clearance
- **Why it's asymmetric:** ZoomInfo doesn't index customs data. You'd be the only one there.

**2. UCC-1 Filing Intelligence**
- GPU lenders must file security interests in equipment as collateral
- Search by debtor (GPU operators) to find their lenders
- Search by secured party (lenders) to find all their GPU borrowers
- Delaware, Texas, California are the key filing jurisdictions

**3. Reverse the Funnel (Let Targets Come to You)**
- Build a free "GPU Insurance Calculator" or "Residual Value Estimator" on the Corgi website
- GPU operators researching coverage find it via SEO
- They self-qualify by entering their fleet details
- Convert inbound leads instead of chasing outbound

**4. Conference Badge-Scanning Strategy**
- 3-4 critical conferences: GTC (NVIDIA), SuperComputing, Monte Carlo Rendez-Vous (reinsurance), SIRC
- Speaker rosters and sponsor logos are public archives going back years
- Conference attendance = self-selection into the relevant universe

**5. The "Sighting Network"**
- Borrowed from birdwatching citizen science (eBird model)
- Befriend 5-10 GPU conference regulars, reinsurance brokers, equipment lessors
- Offer market intel in exchange for tips on new deals
- One referral from an insider beats 50 cold emails

**6. Submarine Wake Tracking**
- GPU operators can't hide their hiring wake (ML infra roles), power wake (utility filings), or vendor wake (NVIDIA partner announcements)
- Set alerts on the wakes, not the targets themselves

### 5.3 Signal-Based Buying Indicator Framework

| Signal | Source | Cost | Lead Time | Confidence |
|--------|--------|------|-----------|-----------|
| GPU hardware import cleared customs | ImportGenius | $99/mo | 30-90 days before deployment | 🟢 High |
| UCC-1 filing with GPU as collateral | State filing databases | $5-25/search | Concurrent with financing | 🟢 High |
| 3+ GPU infrastructure job postings in 60 days | LinkedIn/Indeed alerts | Free | 60-120 days before deployment | 🟡 Medium |
| New NVIDIA NPN partner announcement | NVIDIA press releases | Free | ~30 days after partnership | 🟡 Medium |
| SEC 10-K discloses GPU fleet value >$100M | EDGAR full-text search | Free | Annual (earnings cycle) | 🟢 High |
| Data center construction permit filed | Local government records | Free | 12-24 months before GPU install | 🟡 Medium |
| Utility interconnection for >10MW load | Utility commission filings | Free | 6-18 months before operational | 🟡 Medium |
| Conference speaker from target company | GTC/SC/reinsurance archives | Free | Event-driven | 🟡 Medium |
| Debt facility announced in press release | News alerts (Google/BusinessWire) | Free | Concurrent with financing | 🟢 High |

### 5.4 The Revenue Killer Warning

From the Monetisation Architect agent:

> *"Building the system instead of using it. Teams spend six months perfecting their data pipeline, never making calls. The system becomes the work. Revenue comes from conversations, not spreadsheets. Ship ugly, call fast."*

**90-day revenue target:** £75,000 in quoted premium, £15,000 bound. Based on 20 qualified triggers → 10 conversations → 4 quotes → 1-2 closes.

---

## SECTION 6: IMMEDIATE ACTION PLAN

### 6.1 Tomorrow Morning — 3 Specific Actions

**ACTION 1: Set Up the Lean Enrichment Stack (2 hours)**
1. Sign up for Apollo.io (free) — import the top 30 companies
2. Sign up for Hunter.io Starter ($34/mo) — verify email patterns for CoreWeave, nscale, Crusoe, Lambda
3. Sign up for Reoon ($10/mo) — bulk verify any emails you have
4. **Immediate test:** Look up CoreWeave on Apollo → find VP of Risk or Head of Insurance → verify the email via Hunter → verify via Reoon

**ACTION 2: Send 3 Warm Outreach Emails to Gateway Contacts (30 minutes)**
These 4 people are the highest-leverage contacts in the entire database because they're *in the RVG/equipment insurance world already*:

| Contact | Company | Why First | Email |
|---------|---------|-----------|-------|
| **Nick Hester** | Matrix Specialty (Head of RVI) | Direct RVI competitor/partner; can validate product design | nhester@matrixspecialty.com ✅ + phone: +44 203 457 0916 |
| **Robert Prince** | Iris Insurance Brokers (Divisional Director, RVI) | Lloyd's RVI broker; can open doors to syndicates | rprince@irisib.com ✅ |
| **Awbury Insurance** (Bermuda/London/USA) | Specialty RVI insurer | 7 individual emails confirmed; most approachable capacity provider | nick.cook@awbury.com / schuyler.edwards@awbury.com / emil.petrov@awbury.com ✅ |

**ACTION 3: Register ImportGenius Trial (15 minutes)**
1. Go to importgenius.com — 14-day free trial
2. Set alerts for HS code 8471.50 (GPU hardware) + "NVIDIA" + "H100" + "A100" + "B200"
3. Pull 30-day historical data — identify which companies imported GPU hardware recently
4. Cross-reference against your target list to validate and discover new prospects

### 6.2 Tools to Sign Up For (Priority Order)

| Tool | URL | Cost | Priority |
|------|-----|------|----------|
| Apollo.io | apollo.io | Free | Do today |
| Hunter.io | hunter.io | $34/mo | Do today |
| Reoon | reoon.com | $10/mo | Do today |
| ImportGenius | importgenius.com | Free trial → $99/mo | Do today |
| Instantly.ai | instantly.ai | $37/mo | Week 1 (after domains) |
| Google Workspace (outreach domains) | workspace.google.com | $7/inbox/mo | Week 1 |
| Coresignal | coresignal.com | $49/mo | Week 2 (if Apollo insufficient) |
| LinkedIn Sales Navigator | linkedin.com/sales | $90/mo | Week 3 (if manual research insufficient) |

### 6.3 First Outreach Targets (In Order)

| Priority | Target | Reason | Channel |
|----------|--------|--------|---------|
| 1 | **Nick Hester** (Matrix Specialty) | RVI market insider; can validate product + provide market intel | Email + phone call |
| 2 | **Awbury Insurance** (Bermuda) | Most likely capacity provider; 7 verified emails | Email to relevant regional lead |
| 3 | **Robert Prince** (Iris Insurance Brokers) | Lloyd's broker who can place GPU RVI business | Email |
| 4 | **CoreWeave** (via press@) | Largest single target; $12.4B in GPU debt; proof of concept client | Email (introduce via press/IR, request risk/insurance contact) |
| 5 | **Lambda Labs** (via pr@) | Issued first GPU ABS ($1.1B); used 40% RV floor — they *already needed* an RVG product | Email |
| 6 | **Lockton Re** (reinsurance broker) | #1 priority reinsurance broker; can open entire capacity market | LinkedIn + email |
| 7 | **nscale** (via IR@) | $1.4B PIMCO/Blue Owl debt; European GPU leader; UK-based | Email |
| 8 | **IREN Ltd** (via kane.doyle@iren.com) | Verified contact; $3.6B Goldman/JPM GPU financing; public company | Email |
| 9 | **Together AI** (via rajan@together.ai) | Verified email; growing GPU fleet; tech-forward | Email |
| 10 | **Nebius Group** (via media@) | NVIDIA $2B + Meta $12B; becoming CoreWeave-scale in Europe | Email |

---

## APPENDIX: KEY METRICS

| Metric | Value |
|--------|-------|
| Research files produced | 107 |
| Subagents deployed | 60+ |
| Creativity Engine agents | 15 (of 33-agent pipeline) |
| Total tokens consumed (Creativity Engine alone) | 66,636 |
| Creativity Engine cost | $1.18 |
| Companies identified | ~300 |
| Companies priority-scored | 64 |
| Confirmed email contacts | 33 |
| Gateway contacts with dossiers | 4 |
| Companies with confirmed email patterns | 23 |
| Estimated GPU-backed debt in market | $20B+ |
| Estimated addressable GPU hardware value | $100B+ |

---

## APPENDIX: KEY MARKET FINDINGS

**The GPU-Backed Lending Market Is Exploding:**
- CoreWeave: $12.4B in GPU-backed debt (Blackstone, Magnetar, Coatue)
- nscale: $1.4B delayed draw term loan (PIMCO, Blue Owl, LuminArx)
- IREN: $3.6B GPU financing (Goldman Sachs, JPMorgan)
- Apollo/xAI: $7B GPU lease structure
- Lambda: $1.1B GPU ABS (first ever, AAA-rated, 40% RV floor)
- FluidStack: $10B Macquarie GPU financing facility
- 5C Group: $835M Brookfield infrastructure debt
- Crusoe: $750M Brookfield + $225M Upper90
- **Total disclosed GPU-backed financing: $30B+**

**No Standalone Commercial GPU RVG Product Exists:**
- Lambda's ABS used a negotiated one-off 40% residual value guarantee — improvised because no product exists
- ATA's $750M facility bundles property + hardware + cyber but doesn't offer standalone RVG
- Shepherd ($42M Series B, March 2026) insures AI infrastructure construction risk but not residual value
- Aon's $2.5B Data Center Lifecycle Program covers property, not GPU-specific RVG
- Ornn Compute Exchange is the closest competitor — a GPU marketplace that could enable price discovery for RVG actuarial models

**This is Corgi's window. The market is being built around a product that doesn't exist yet.**

---

*Generated 2026-03-29 08:22 PDT | Brock | Corgi Insurance GPU RVG Intelligence Operation — Final Synthesis*
