# jordan.ai — Lead Enrichment & HubSpot Pipeline

## Vision
Fully automated lead discovery → enrichment → qualification → HubSpot delivery.
Team members open HubSpot and find fresh, maximally enriched, pre-qualified leads waiting for them.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISCOVERY LAYER                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Web       │  │ Crunch-  │  │ LinkedIn │  │ Manual   │       │
│  │ Scraping  │  │ base     │  │ Search   │  │ Lists    │       │
│  └─────┬─────┘  └─────┬────┘  └────┬─────┘  └────┬─────┘       │
│        └──────────────┴───────────┴────────────┘                │
│                         ▼                                        │
│              Raw Company List (XLSX/JSON)                         │
└──────────────────────────┬──────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ENRICHMENT LAYER                               │
│                                                                   │
│  Stage 1: AI Research (FREE — Claude sub-agents)                  │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ • Company verification (website, description, news)   │        │
│  │ • Contact discovery (C-suite, VP-level)               │        │
│  │ • Email pattern detection + construction              │        │
│  │ • LinkedIn URL lookup                                 │        │
│  │ • Industry classification                             │        │
│  │ • Qualification scoring                               │        │
│  │ • Hiring signals, recent funding, tech stack          │        │
│  └──────────────────────────┬───────────────────────────┘        │
│                              ▼                                    │
│  Stage 2: API Enrichment (CREDITS)                                │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ Source          │ What           │ Cost    │ Hit Rate │        │
│  │─────────────────┼────────────────┼─────────┼──────────│        │
│  │ Apollo (paid)   │ Emails         │ Plan    │ 76%      │        │
│  │ Apollo (paid)   │ Phone reveal   │ 8 cr/ea │ 77%      │        │
│  │ OS Google Maps  │ Company phone  │ 10 cr   │ 67%      │        │
│  │ OS person.get   │ Personal phone │ 275 cr  │ 25%      │        │
│  │ Hunter.io*      │ Email patterns │ Plan    │ ~40%?    │        │
│  │ RocketReach*    │ Email + phone  │ Credits │ ~30%?    │        │
│  │ GMaps API*      │ Company phone  │ $0.032  │ ~67%?    │        │
│  │ * = not tested yet                                    │        │
│  └──────────────────────────┬───────────────────────────┘        │
│                              ▼                                    │
│  Stage 3: Qualification & Scoring                                 │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ • Blueprint Score (0-100) based on profile fit        │        │
│  │ • Grade: A/B/C                                        │        │
│  │ • Auto-filter: non-tech, defunct, consultancies       │        │
│  │ • Contact role mapping (Decision Maker → Champion)    │        │
│  └──────────────────────────┬───────────────────────────┘        │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HUBSPOT DELIVERY LAYER                         │
│                                                                   │
│  hubspot-sync-v2.mjs                                              │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ • Upsert companies (domain-based dedup)               │        │
│  │ • Upsert contacts (email-based, name+company fallback)│        │
│  │ • Associate contacts → companies                      │        │
│  │ • Map to custom props: company_industry, funding_stage│        │
│  │ • Map contact_role from title (CEO→Decision Maker)    │        │
│  │ • Smart email handling (skip generic info@ emails)    │        │
│  │ • Checkpoint/resume for large syncs                   │        │
│  │ • Rate limiting (8 req/sec) + 429 retry               │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                   │
│  Property Mapping:                                                │
│  ┌──────────────────────────────────────────────────────┐        │
│  │ Our Data              → HubSpot Property              │        │
│  │ ─────────────────────────────────────────────────────  │        │
│  │ Company Name          → name                          │        │
│  │ Website               → domain + website              │        │
│  │ Description + Intel   → description (rich)            │        │
│  │ Industry / Vertical   → company_industry (enum map)   │        │
│  │ Revenue (USD M)       → annualrevenue (× 1M)          │        │
│  │ Employees             → numberofemployees             │        │
│  │ Founded               → founded_year                  │        │
│  │ Total Raised          → total_funding_amount          │        │
│  │ Funding Stage         → funding_stage (enum map)      │        │
│  │ LinkedIn              → linkedin_company_page         │        │
│  │ Phone                 → phone                         │        │
│  │ Business Model        → business_model_type (inferred)│        │
│  │ Contact Title         → contact_role (enum map)       │        │
│  │ Recent News           → trigger_event                 │        │
│  │ Lifecycle             → lead (auto)                   │        │
│  │ Lead Status           → NEW (auto)                    │        │
│  └──────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Current State

### What's Built & Working
| Component | Status | Location |
|-----------|--------|----------|
| AI enrichment pipeline (Claude sub-agents) | ✅ 130/139 batches done | `pipeline/enrichment-pipeline/` |
| HubSpot sync v1 | ✅ Tested, 69 companies pushed | `sources/hubspot-sync.mjs` |
| HubSpot sync v2 (full property mapping) | ✅ Built, dry-run tested | `sources/hubspot-sync-v2.mjs` |
| Apollo integration (paid) | ✅ 76% email hit rate | `data/apollo/` |
| Orange Slice Google Maps | ✅ 67% company phone hit rate | via `services.googleMaps.scrape` |
| Orange Slice person.contact.get | ✅ 25% personal phone hit rate | via `services.person.contact.get` |
| Enrichment source modules | ✅ 15 modules | `sources/` |
| DealScope v3 (US Software) | ✅ 1,380 companies, 3,321 contacts | `data/dealscope/DealScope_Enriched_v3.xlsx` |
| GPU Operators v3 | ✅ 69 companies, 77 contacts, 100% phone | `pipeline/gpu-operators/` |
| Lenders v2 | ✅ 121 companies | `data/dealscope/DealScope_Lenders_v2.xlsx` |

### What's In Progress
| Component | Status | Notes |
|-----------|--------|-------|
| Enrichment batches 131-139 | 🔄 Running now | 3 sub-agents processing 9 batches (~213 companies) |

### What's Not Built Yet
| Component | Needed For | Priority |
|-----------|-----------|----------|
| Hunter.io integration | Better email coverage | HIGH — need API key |
| RocketReach integration | Email + phone backup | MEDIUM — need API key |
| Google Maps API (direct) | Cheaper phone lookup | MEDIUM — need GCP key |
| Automated discovery cron | Periodic new lead feed | HIGH — needs profile spec |
| HubSpot property creation | Custom DealScope fields | LOW — existing props sufficient |
| Lead dedup across datasets | Prevent duplicates | MEDIUM |
| Enrichment quality re-run | Batches 1-60 email gap | LOW |

---

## HubSpot Integration Details

### Existing CRM (READ-ONLY audit)
- **72,887 companies** already in HubSpot
- **72,595 contacts** already in HubSpot
- **1 pipeline**: Sales Pipeline (Booked → Discovery → Quoted → Won/Lost)
- **Office owners**: Dane, Corgi Corp, Corgi Tech
- **Team using**: Lead sources include Apollo, Origami, YC Directory, a16z, Crunchbase
- **Instantly campaigns** running (Gavin): General A/B, New Funding, YC Alumni, Fintech, Healthtech, AI/ML

### Safe Sync Strategy
To avoid disrupting the live system:

1. **Add "DealScope" as a lead_source option** (both company + contact) — so all our imports are tagged and filterable
2. **Use `--skip-existing`** flag on first sync — only push NEW companies that don't already exist
3. **Domain-based dedup** — if `lambda.ai` already exists in HubSpot, we update (not duplicate)
4. **Email-based contact dedup** — contacts matched by email, generic emails skipped
5. **Office owner tagging** — `--owner "Corgi Corp"` to separate from Dane leads
6. **Checkpoint files** — resume interrupted syncs without re-processing

### Recommended Custom Properties to Add
To fully leverage our enrichment data:

**Company:**
- `dealscope_score` (number) — Blueprint/RVG score
- `dealscope_grade` (enum: A, B, C) — Lead grade
- `gpu_fleet` (string) — GPU hardware details
- `financing_profile` (string) — Debt/equity profile
- `data_quality_score` (number) — Enrichment confidence

**Contact:**
- `email_confidence` (enum: Verified, High, Medium, Low)
- `phone_source` (string) — Where phone was found
- `linkedin_url` (string) — already exists? check...

---

## The Churning Engine (Proposed)

### Concept
A scheduled job that:
1. Discovers new companies matching the target profile
2. Enriches them through the full pipeline
3. Pushes qualified leads into HubSpot automatically
4. Runs daily/weekly, drip-feeding fresh leads

### Implementation Plan
```
Cron (daily/weekly)
  ├── Discovery Agent
  │   ├── Search Crunchbase for recent funding rounds
  │   ├── Search news for GPU/AI infrastructure companies
  │   ├── Search LinkedIn for new companies in target sectors
  │   └── Output: raw_leads.json
  │
  ├── Enrichment Pipeline
  │   ├── Stage 1: Claude AI research (free)
  │   ├── Stage 2: Apollo email enrichment
  │   ├── Stage 3: Google Maps phone lookup
  │   └── Stage 4: Qualification scoring
  │
  ├── Dedup Check
  │   ├── Check against HubSpot (domain search)
  │   ├── Check against local DB (already processed)
  │   └── Only new, unique companies proceed
  │
  └── HubSpot Push
      ├── Create companies + contacts
      ├── Tag with lead_source="DealScope Auto"
      ├── Set lifecycle=lead, status=NEW
      └── Notify team via Slack/email
```

### What I Need From You
1. **Target profile** — What makes a company a good lead? (industry, size, funding, geography, tech stack)
2. **API keys** — Hunter.io and/or RocketReach for better email coverage
3. **HubSpot permissions** — Confirm I can add custom properties (need super admin)
4. **Cadence** — How often should the engine run? Daily? Weekly?
5. **Team notification** — How should the team be alerted to new leads?

---

## Data Inventory

| Dataset | Companies | Contacts | Emails | Phones | Score |
|---------|-----------|----------|--------|--------|-------|
| DealScope v3 (US Software) | 1,380 | 3,321 | 39% personal | 0% direct | ✅ |
| GPU Operators v3 | 69 | 77 | 100% (generic) | 100% direct | ✅ |
| Lenders v2 | 121 | 146 | partial | 6 company | ✅ |
| Outreach DB (SQLite) | 327 | 415 | partial | partial | ✅ |
| Enrichment Pipeline (pending) | ~213 | ~213+ | TBD | TBD | 🔄 |

---

*Last updated: 2026-03-31*
