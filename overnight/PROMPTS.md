# Overnight Orchestrator Prompts
Copy-paste each of these into a separate Brock session.

---

## SESSION 2 PROMPT — Apollo Sourcer

```
OVERNIGHT JOB — Session 2: Apollo Sourcer

You are one of 5 orchestrator sessions running an overnight ICP company sourcing operation for Corgi Insurance. Read these files FIRST:
1. jordan.ai/overnight/ORCHESTRATION.md — full protocol
2. jordan.ai/pipeline/icp_score_v1.py — ICP scoring model (read the docstring)
3. TOOLS.md — Apollo API details

YOUR ROLE: Use Apollo's FREE People Search API to find founders/CTOs/engineers at small US tech companies, extract their company domains, dedup against HubSpot + master.db, and add qualifying companies to the shared database.

CRITICAL CONSTRAINTS:
- Apollo People Search is FREE (unlimited queries)
- You have EXACTLY 1,000 Apollo credits for enrichment (org enrichment = 1 credit each)
- Credit counter: jordan.ai/overnight/shared/apollo_credits.json — READ before every enrichment call, UPDATE after every call
- If credits reach 950, STOP enrichment and switch to free-only search mode
- Apollo API key: load from .config/apollo/config.json
- DO NOT use phone reveal (8 credits each)
- Log everything to jordan.ai/overnight/session_2/

SEARCH STRATEGY — spawn up to 10 sub-agents to parallelize:
1. Search Apollo for people with titles: "Founder", "CEO", "CTO", "Co-founder" at companies with 1-50 employees, in the US, in technology/software industries
2. Vary searches: by city (SF, NYC, Austin, Denver, Seattle, Boston, Miami, LA, Chicago, Atlanta, Raleigh, Portland, SLC, Phoenix, Nashville, DC), by industry sub-segment (SaaS, developer tools, cloud, cybersecurity, data analytics, AI/ML, fintech, healthtech software, martech, HR tech, edtech)
3. For each person found, extract their company domain
4. Check domain against: (a) jordan.ai/overnight/shared/hubspot_domains_current.json and (b) master.db — skip if already exists
5. For NEW domains, write to jordan.ai/overnight/shared/new_companies_queue.jsonl (append, one JSON per line):
   {"domain": "...", "company_name": "...", "source": "apollo_search", "employees": N, "city": "...", "state": "...", "industry": "...", "founder_name": "...", "founder_title": "...", "timestamp": "ISO"}
6. Use the 1,000 enrichment credits strategically on the most promising companies (small, clearly tech, US)

COORDINATION:
- Update jordan.ai/overnight/STATUS.md every 30 minutes with your progress
- Write detailed log to jordan.ai/overnight/session_2/log.md
- Save checkpoints to jordan.ai/overnight/session_2/checkpoint.json
- If you hit API rate limits, back off and retry

TARGET: Find 2,000+ new unique company domains not already in our DB or HubSpot.

Use opus for sub-agents. Set 8-hour timeouts. Work until you've exhausted useful search combinations.
```

---

## SESSION 3 PROMPT — Web Scraper Sourcer

```
OVERNIGHT JOB — Session 3: Web Scraper Sourcer

You are one of 5 orchestrator sessions running an overnight ICP company sourcing operation for Corgi Insurance. Read these files FIRST:
1. jordan.ai/overnight/ORCHESTRATION.md — full protocol
2. jordan.ai/pipeline/icp_score_v1.py — ICP scoring model (read the docstring)

YOUR ROLE: Scrape free web directories, accelerator portfolios, and startup lists to find small US tech/SaaS companies. Extract company names + domains, dedup against HubSpot + master.db, add qualifying ones to the shared queue.

NO PAID APIs. Everything you do must be free (web_fetch, web_search).

SOURCES TO SCRAPE — spawn up to 10 sub-agents, one per source cluster:

**Accelerator/Fund Portfolios:**
1. TinySeed portfolio (tinyseed.com/portfolio) — 151 companies, all small SaaS
2. Earnest Capital portfolio (earnestcapital.com) — bootstrapped SaaS companies
3. Calm Company Fund (calmfund.com) — indie SaaS
4. SureSwift Capital portfolio (sureswiftcapital.com) — acquired SaaS companies
5. Indie.vc portfolio — bootstrapped companies
6. Techstars portfolio pages (by city — techstars.com/portfolio)

**Directories & Lists:**
7. IndieHackers top products (indiehackers.com/products) — scrape company names/domains
8. MicroConf speaker companies (microconf.com/speakers) — bootstrapped SaaS founders
9. SaaS company directories: getlatka.com (has revenue + employee data), saashub.com, alternativeto.net (for finding small competitors)
10. "Bootstrapped SaaS" blog posts and listicles — search for "best bootstrapped SaaS companies 2024 2025" type articles

**Product Directories:**
11. Product Hunt recent launches (filter for SaaS/dev tools, US-based)
12. G2 / Capterra small vendor listings for SaaS categories
13. GitHub trending → trace back to companies behind popular repos

**Search-Based Discovery:**
14. Web search queries like: "small SaaS startup [city] founded 2022 2023 2024", "bootstrapped software company [state]", "[category] startup seed round 2024 under 20 employees"

FOR EACH COMPANY FOUND:
1. Extract: company name, domain, any available employee count, location, description
2. Check domain against: (a) jordan.ai/overnight/shared/hubspot_domains_current.json and (b) master.db — skip if exists
3. Quick sanity check: does this look like a US tech company?
4. Write to jordan.ai/overnight/shared/new_companies_queue.jsonl:
   {"domain": "...", "company_name": "...", "source": "SOURCE_NAME", "employees": N_or_null, "city": "...", "state": "...", "description": "...", "source_url": "...", "timestamp": "ISO"}

COORDINATION:
- Update jordan.ai/overnight/STATUS.md every 30 minutes
- Write detailed log to jordan.ai/overnight/session_3/log.md
- Track which sources you've completed in jordan.ai/overnight/session_3/sources_completed.json
- Don't duplicate effort — check what's already in the queue

TARGET: Find 3,000+ new unique company domains from free sources.

Use opus for sub-agents. Set 8-hour timeouts. Be creative with sources — the more diverse, the better the coverage.
```

---

## SESSION 4 PROMPT — Maps + Directory Sourcer

```
OVERNIGHT JOB — Session 4: Maps + Directory Sourcer

You are one of 5 orchestrator sessions running an overnight ICP company sourcing operation for Corgi Insurance. Read these files FIRST:
1. jordan.ai/overnight/ORCHESTRATION.md — full protocol
2. jordan.ai/pipeline/icp_score_v1.py — ICP scoring model (read the docstring)
3. TOOLS.md — Orange Slice SDK details

YOUR ROLE: Use Google Maps scraping (via Orange Slice SDK) and other directory sources to find small US tech/SaaS companies by geographic search. Also mine Crunchbase and business registries.

ORANGE SLICE BUDGET:
- services.googleMaps.scrape() = 10 credits per result
- Budget: ~1,000 results max (~10,000 credits)
- HOME env must be set to workspace dir for auth resolution
- SDK: import { services } from "orangeslice" (Node.js .mjs scripts)
- Run with: HOME=/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace node script.mjs

GOOGLE MAPS SEARCH STRATEGY — spawn sub-agents per city cluster:

**Tier 1 Cities (most results expected):**
- San Francisco, New York, Austin, Seattle, Boston, Denver, Los Angeles

**Tier 2 Cities:**
- Chicago, Atlanta, Miami, Raleigh-Durham, Portland, Salt Lake City, Phoenix, Nashville, San Diego, Minneapolis, Pittsburgh, Detroit

**Search Queries per city:**
- "software company [city]"
- "SaaS startup [city]"
- "tech startup [city]"
- "software development [city]"
- "app development company [city]"

For each Google Maps result:
1. Extract: business name, domain (from website field), phone, address, category
2. Filter: skip if category is clearly non-tech (restaurant, retail, etc.)
3. Check domain against HubSpot + master.db — skip if exists
4. Write to jordan.ai/overnight/shared/new_companies_queue.jsonl:
   {"domain": "...", "company_name": "...", "source": "gmaps_[city]", "phone": "...", "address": "...", "gmaps_category": "...", "city": "...", "state": "...", "timestamp": "ISO"}

ALSO DO — Crunchbase-style sourcing (free web searches):
- Search for "seed round 2024 [category] startup US" across tech categories
- Search for companies on builtwith.com, stackshare.io by tech stack
- Search state business registries for recently incorporated SIC 7371-7379 companies

COORDINATION:
- Update jordan.ai/overnight/STATUS.md every 30 minutes
- Write detailed log to jordan.ai/overnight/session_4/log.md
- Track Google Maps credit usage in jordan.ai/overnight/session_4/gmaps_credits.json
- Save all raw Google Maps results in jordan.ai/overnight/session_4/gmaps_raw/

TARGET: Find 2,000+ new unique company domains from geographic and directory sources.

Use opus for sub-agents. Set 8-hour timeouts. Spread searches across cities to maximize diversity.
```

---

## SESSION 5 PROMPT — Verifier + QA

```
OVERNIGHT JOB — Session 5: Verifier + QA

You are one of 5 orchestrator sessions running an overnight ICP company sourcing operation for Corgi Insurance. Read these files FIRST:
1. jordan.ai/overnight/ORCHESTRATION.md — full protocol
2. jordan.ai/pipeline/icp_score_v1.py — ICP scoring model (read the docstring)
3. jordan.ai/pipeline/vibe_score_v6.py — website vibe scoring

YOUR ROLE: Verify and quality-check companies found by other sessions. Scrape websites, check if they're real tech companies, run ICP scoring, and build the final verified list.

YOUR WORKFLOW (runs continuously, polling for new work):

**Phase 1: Validate existing DB (first 2 hours)**
1. Pull all companies from master.db that are: Grade A or B on blueprint_v3, NOT in HubSpot, NOT DQ'd, have ≤50 employees
2. Run icp_score_v1.py on each one (use the heuristic scorer — no LLM needed for bulk)
3. Write ICP scores back to master.db (add icp_score and icp_grade columns if they don't exist)
4. This should process ~20,000+ companies and find the core of our 5,000

**Phase 2: Verify new companies (ongoing)**
1. Poll jordan.ai/overnight/shared/new_companies_queue.jsonl every 15 minutes for new entries
2. For each new company:
   a. Fetch website with web_fetch — confirm it's live, not parked/dead
   b. Extract: what the company does, any team/about page info, tech signals
   c. Run ICP heuristic scoring
   d. If Grade A or B: add to master.db with source tag and icp_score
   e. If DQ: log reason and skip
3. Spawn sub-agents to parallelize — each sub-agent handles a batch of 50-100 companies

**Phase 3: Spot-check quality (every 2 hours)**
1. Random sample 20 companies from the Grade A pile
2. Deep verify: scrape their actual website, check LinkedIn for employee count, confirm US
3. If >20% fail verification: flag the source and tighten filtering

**Phase 4: Build final output (last hour)**
1. Export all Grade A companies from master.db to jordan.ai/overnight/FINAL_OUTPUT.xlsx
   Columns: domain, company_name, description, employees, revenue, state, icp_score, icp_grade, source, tech_signals, dm_name, dm_email, company_phone
2. Generate jordan.ai/overnight/FINAL_REPORT.md with:
   - Total companies in DB
   - Total Grade A (the headline number)
   - Grade A by source breakdown
   - Grade A by state breakdown
   - Grade A by employee range breakdown
   - Quality spot-check results
   - Issues found

COORDINATION:
- Update jordan.ai/overnight/STATUS.md every 30 minutes
- Write detailed log to jordan.ai/overnight/session_5/log.md
- Save verification results to jordan.ai/overnight/session_5/verification_results.json

TARGET: Verify and ICP-score everything. Produce a clean final output of 5,000+ Grade A companies.

Use opus for sub-agents. Set 8-hour timeouts. Quality > speed — every Grade A company should be defensible.
```
