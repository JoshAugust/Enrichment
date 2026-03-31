# UCC Filings as a Data Source for GPU-Backed Lending Intelligence

> **Purpose:** UCC-1 financing statements are public filings that reveal which companies have pledged GPU hardware as collateral, which lenders hold security interests, and the approximate scale of GPU-backed debt. This is hard, verifiable data — not rumors or estimates.

---

## 1. What Is a UCC Filing & Why It Matters for GPU Intelligence

When a lender takes a security interest in a borrower's assets (like GPU hardware), they file a **UCC-1 financing statement** with the relevant Secretary of State to "perfect" their lien. This is a **public record** that discloses:

| Field | What It Reveals |
|-------|----------------|
| **Debtor** | The entity pledging GPUs (often an SPV like "CoreWeave Compute Acquisition Co. VII, LLC") |
| **Secured Party** | The lender(s) — e.g., Blackstone, Magnetar, U.S. Bank as collateral agent |
| **Collateral Description** | What's pledged — can be as specific as GPU serial numbers or as broad as "all tangible assets" |
| **Filing Date** | When the security interest was created |
| **Filing Number** | Unique identifier for tracking amendments, continuations, terminations |
| **Filing Jurisdiction** | Where the entity is organized (Delaware for most tech SPVs) |
| **Amendments (UCC-3)** | Changes — assignment to new lenders, collateral additions, terminations |

### Why GPUs Specifically?

GPU-backed lending has become a **$20B+ market**. UCC-1 statements are now filed **down to individual GPU serial numbers** in many deals. Lenders require:
- Serial number inventories of pledged GPUs
- Restrictions on moving hardware without consent
- Telemetry feeds proving GPUs are powered on and doing permitted work
- Typical LTV ratios of 50–70% of appraised fair market value
- Interest rates of SOFR + 4% to SOFR + 6.5% (roughly 8–12%)

---

## 2. Known GPU-Backed Debt Deals (Searchable via UCC)

| Company | GPU-Backed Debt | Key Lenders / Secured Parties | SPV / Filing Entity | Jurisdiction |
|---------|----------------|-------------------------------|---------------------|-------------|
| **CoreWeave** | ~$14.2B total debt | Blackstone, Magnetar, Coatue, U.S. Bank (collateral agent) | CoreWeave Compute Acquisition Co. IV, V, VI, VII LLC | Delaware |
| **Lambda Labs** | $500M | Macquarie Group, Industrial Development Funding | TBD (search needed) | Delaware (likely) |
| **Crusoe Energy** | $425M+ | Upper90, JPMorgan (broader facility) | TBD — ~20,000 H100s as collateral | Delaware (likely) |
| **Fluidstack** | $10B+ (reported) | Unknown — search UCC filings | TBD | TBD |
| **Applied Digital** | $2.35B senior secured notes + Macquarie facility | Macquarie Group, Nvidia (equity participant) | TBD | TBD |

### CoreWeave Filing Details (from SEC/Justia filings)
- Credit Agreement borrower: **CoreWeave Compute Acquisition Co. IV, LLC**
- UCC-1 filed with **Delaware Secretary of State**
- Administrative & Collateral Agent: **U.S. Bank Trust Company**
- Secured by "substantially all now owned or at any time hereafter acquired tangible and intangible assets"
- Multiple SPVs (Co. IV through Co. VII+) suggest separate tranches/facilities — each would have its own UCC-1

### Key Pattern: SPV Structure
Most GPU-backed deals use **Special Purpose Vehicles (SPVs)**:
1. Parent company creates an SPV (e.g., "CoreWeave Compute Acquisition Co. VII, LLC")
2. GPU assets are transferred to the SPV
3. Lenders take security interest in SPV assets
4. UCC-1 filed against the SPV as debtor

**Intelligence implication:** Search for entity names containing patterns like "[Company] Compute", "[Company] Acquisition", "[Company] Assets", "[Company] Capital" to find SPVs.

---

## 3. How to Search UCC Filings

### Free State-Level Searches (Direct)

Most states offer online UCC search portals. Key states for GPU companies:

| State | Portal | Notes |
|-------|--------|-------|
| **Delaware** | Requires **authorized searcher** — no free public portal | $25/debtor + $25 expedited fee. Use authorized searchers: [corp.delaware.gov/uccauthsrch](https://corp.delaware.gov/uccauthsrch/) |
| **California** | [bizfileonline.sos.ca.gov/search/ucc](https://bizfileonline.sos.ca.gov/search/ucc) | Free online search |
| **New York** | [appext20.dos.ny.gov/pls/ucc_public](https://appext20.dos.ny.gov/pls/ucc_public/ucc_search) | Free online search |
| **Texas** | [direct.sos.state.tx.us](https://direct.sos.state.tx.us/help/help-ucc.asp) | Free online search |
| **Illinois** | [apps.ilsos.gov/uccsearch](https://apps.ilsos.gov/uccsearch/) | Free online search |
| **Colorado** | [sos.state.co.us/ucc](https://www.sos.state.co.us/ucc/) | Free online search |

**National directory:** [nass.org/business-services/ucc-filings](https://www.nass.org/business-services/ucc-filings)

### Search Methods
- **By Debtor Name** — search for the company or SPV name
- **By Secured Party Name** — search for the lender
- **By Filing Number** — if you have it from SEC filings or credit agreements

> ⚠️ **Delaware is critical** — most tech companies and SPVs are incorporated in Delaware, but Delaware does NOT have free public search. You must use an authorized searcher or a commercial service.

### Commercial UCC Search & Data Services

| Provider | Type | API? | Notes |
|----------|------|------|-------|
| **Wolters Kluwer (iLien / CT Corporation)** | Full-service search, filing, monitoring | Yes (iLien API) | Industry leader. Handles Delaware authorized searches. |
| **CSC (Corporation Service Company)** | Full-service | Yes | Processes millions of UCC searches/filings annually |
| **First Corporate Solutions (FCS / Ficoso)** | Full-service | Yes (JSON REST API) | Delaware direct access. Real-time monitoring. |
| **Middesk** | API-first platform | Yes (REST API) | Direct connections to all SoS offices. Daily refresh. Good for automated pipelines. |
| **MicroBilt** | API search | Yes | UCC record search across US states |
| **Dun & Bradstreet** | Via Direct 2.0 API | Yes | Requires D-U-N-S Number. UCC data as part of broader company data. |
| **LexisNexis** | Research platform | Limited | Good for one-off deep dives, less for automated monitoring |
| **Alogent** | State database aggregator | No | Links to every state UCC database |

### Bulk Data Downloads (State Level)

Several states sell bulk UCC data — useful for building a comprehensive search index:

| State | Offering | Frequency |
|-------|----------|-----------|
| **Kentucky** | Full UCC filings + collateral + images | Monthly (full), Daily/Weekly (new) |
| **Arkansas** | Bulk UCC records download | Available |
| **Minnesota** | Statewide UCC database purchase | Available |
| **South Dakota** | UCC Database + Bulk Image subscriptions | Available |
| **Connecticut** | All UCC financing statements via SharePoint | Monthly |
| **West Virginia** | UCC bulk data service | Available |

---

## 4. What Data Is Available in a UCC Filing

### UCC-1 (Initial Filing)
```
┌─────────────────────────────────────────────────┐
│ UCC FINANCING STATEMENT (Form UCC-1)            │
├─────────────────────────────────────────────────┤
│ Filing Number: 2024-XXXXXXX                     │
│ Filing Date: 2024-05-16                         │
│ Lapse Date: 2029-05-16 (5 years)               │
│                                                 │
│ DEBTOR:                                         │
│   CoreWeave Compute Acquisition Co. IV, LLC     │
│   [Address]                                     │
│   State of Organization: Delaware               │
│   Organization ID: XXXXXXX                      │
│                                                 │
│ SECURED PARTY:                                  │
│   U.S. Bank Trust Company, National Association │
│   (as Administrative Agent and Collateral Agent)│
│   [Address]                                     │
│                                                 │
│ COLLATERAL:                                     │
│   All assets of the Debtor, including but not   │
│   limited to all equipment, inventory, accounts,│
│   general intangibles, and proceeds thereof.    │
│   [May include specific GPU serial numbers]     │
└─────────────────────────────────────────────────┘
```

### UCC-3 (Amendment) — Tracks Changes
- **Assignment** — lender sells its position to another party
- **Continuation** — extends the filing beyond 5 years
- **Termination** — lien released (loan repaid or restructured)
- **Amendment** — collateral added/changed, debtor name change

### Intelligence Extractable from UCC Data

| Signal | What It Tells You |
|--------|-------------------|
| New UCC-1 filing by AI company SPV | New GPU-backed debt facility created |
| Secured party = Blackstone/Magnetar/etc. | Which Wall Street firms are lending |
| Collateral mentions "NVIDIA", "GPU", "H100", "accelerators" | Confirms GPU-backed deal |
| Multiple SPVs for same parent | Multiple debt tranches — scale of borrowing |
| UCC-3 termination | Loan repaid or refinanced |
| UCC-3 assignment | Debt sold to new holder — secondary market activity |
| Filing in new jurisdiction | Company expanding to new data center locations |
| Rapid succession of filings | Aggressive capital deployment |

---

## 5. Services That Monitor UCC Filings in Real-Time

### Dedicated UCC Monitoring Platforms

| Service | Key Features | Delivery |
|---------|-------------|----------|
| **CSC UCC Monitoring** | Automated alerts for name changes, new competing liens, bankruptcy, fraudulent terminations, continuation deadlines | Email alerts, dashboard |
| **First Corporate Solutions (FCS)** | Lien monitoring, bankruptcy, litigation, entity verification | Email, API |
| **Middesk** | Dashboard + API monitoring. Auto-enable for all businesses or rule-based. Daily data refresh from SoS offices | Dashboard, API, webhooks |
| **Bectran** | Integrated UCC management. Expiring filings trigger automated workflows | Dashboard, workflow automation |
| **Wolters Kluwer iLien** | Enterprise-grade. Real-time jurisdiction data validation. API integration | API, dashboard, email |

### What Monitoring Catches

- **New junior creditors** — someone else lending against same collateral
- **Fraudulent terminations** — unauthorized lien releases
- **Debtor name/entity changes** — could affect lien perfection
- **Bankruptcy filings** — immediate alert
- **Continuation deadlines** — 6 months before expiration
- **Good standing changes** — entity dissolution, tax delinquency

### Monitoring for Intelligence (Not Just Protection)

The above services are designed for *lenders* protecting their own liens. For *intelligence gathering*, you'd flip the use case:

1. **Monitor target companies** — set alerts on known GPU companies and their SPVs
2. **Monitor target lenders** — watch for new filings where Blackstone, Magnetar, etc. are secured parties
3. **Keyword monitoring** — watch for collateral descriptions containing GPU-related terms
4. **New entity monitoring** — watch for new SPVs created by known GPU companies

---

## 6. Building a UCC Monitoring Pipeline for GPU Intelligence

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  UCC GPU Intelligence Pipeline            │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  DATA SOURCES                                            │
│  ├─ Middesk API (all-state UCC search + monitoring)      │
│  ├─ State bulk data downloads (KY, AR, MN, CT, etc.)     │
│  ├─ Delaware authorized searcher (via FCS or CSC)        │
│  ├─ SEC EDGAR (credit agreements reference UCC filings)  │
│  └─ News/PR monitoring (new GPU debt announcements)      │
│                                                          │
│  WATCHLISTS                                              │
│  ├─ Known GPU companies (CoreWeave, Lambda, Crusoe...)   │
│  ├─ Known SPV patterns ("Compute Acquisition Co.",       │
│  │   "GPU Assets LLC", etc.)                             │
│  ├─ Known GPU lenders (Blackstone, Magnetar, Upper90,    │
│  │   Macquarie, JPMorgan, Pimco, Carlyle, BlackRock)     │
│  └─ Collateral keywords ("GPU", "NVIDIA", "H100",       │
│      "A100", "accelerator", "graphics processing")       │
│                                                          │
│  PROCESSING                                              │
│  ├─ NLP on collateral descriptions                       │
│  ├─ Entity resolution (SPV → parent company)             │
│  ├─ Cross-reference with SEC filings                     │
│  ├─ Cross-reference with state corporate records         │
│  └─ Lender network mapping                               │
│                                                          │
│  OUTPUTS                                                 │
│  ├─ GPU-backed deal tracker (company, amount, lender)    │
│  ├─ New deal alerts                                      │
│  ├─ Lender activity dashboard                            │
│  ├─ SPV creation alerts (new facilities)                 │
│  └─ Termination/refinancing alerts                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Implementation Steps

#### Phase 1: Manual Intelligence (Week 1)
1. **Compile target list** — all known GPU-backed lending companies + their SPVs
2. **Search free state portals** — CA, NY, TX, IL, CO for any filings
3. **Order Delaware searches** — use an authorized searcher (~$50-75 per search including service fees)
4. **Pull SEC filings** — search EDGAR for credit agreements mentioning UCC filings
5. **Document findings** — build initial database of known filings

#### Phase 2: Automated Monitoring (Week 2-3)
1. **Set up Middesk API** — monitor target entities for new filings
2. **Subscribe to state bulk data** — KY, AR, MN for comprehensive coverage
3. **Build collateral keyword scanner** — parse collateral descriptions for GPU terms
4. **Set up SEC EDGAR alerts** — new filings by known GPU companies
5. **Create alert pipeline** — Slack/email notifications for new GPU-related UCC filings

#### Phase 3: Advanced Intelligence (Month 2+)
1. **Entity resolution engine** — automatically link SPVs to parent companies
2. **Lender network graph** — map which lenders are connected to which GPU companies
3. **Historical analysis** — track growth of GPU-backed lending over time
4. **Predictive signals** — new SPV creation as leading indicator of upcoming debt raises
5. **Secondary market tracking** — UCC-3 assignments show debt changing hands

### Collateral Description Keywords to Monitor

```
Primary:
  GPU, GPUs, graphics processing unit(s)
  NVIDIA, Nvidia
  H100, H200, B100, B200, GB200
  A100, A10G
  accelerator(s), AI accelerator(s)
  compute equipment, compute hardware

Secondary:
  data center equipment
  server(s), server equipment  
  high-performance computing
  machine learning hardware
  artificial intelligence infrastructure
  networking equipment (often co-pledged with GPUs)
  InfiniBand (high-speed GPU interconnect)

Entity Name Patterns:
  "[Company] Compute"
  "[Company] Acquisition Co."
  "[Company] Assets"
  "[Company] Infrastructure"
  "[Company] Capital"
  "[Company] GPU"
```

### Cost Estimates

| Component | Cost | Frequency |
|-----------|------|-----------|
| Delaware authorized searches | $50-75 per debtor | Per search |
| Middesk API | Custom pricing (starts ~$500/mo) | Monthly |
| State bulk data subscriptions | $100-500 per state | Annual |
| CSC/FCS monitoring | $50-200 per entity/year | Annual |
| SEC EDGAR | Free | Continuous |
| Free state portal searches | Free | Ad hoc |

---

## 7. Complementary Data Sources

UCC filings don't exist in isolation. Cross-reference with:

| Source | What It Adds |
|--------|-------------|
| **SEC EDGAR** | Full credit agreements, prospectuses with UCC details, collateral schedules |
| **State corporate records** | SPV formation dates, registered agents, parent company links |
| **Bankruptcy court (PACER)** | If a GPU company defaults, filings show lender claims and collateral |
| **News/PR** | Debt announcements that reference amounts and lenders |
| **Credit rating agencies** | Moody's/S&P ratings on GPU-backed facilities |
| **TRACE (bond trading)** | If GPU-backed notes trade publicly, shows secondary market pricing |
| **Patent filings** | GPU-related IP pledged alongside hardware |

---

## 8. Key Risks & Limitations

- **Delaware bottleneck** — most GPU SPVs are in Delaware, which requires authorized searchers (no free public access)
- **Broad collateral descriptions** — many UCC filings say "all assets" rather than listing specific GPUs
- **SPV obscurity** — SPV names may not obviously link to parent companies
- **Filing lag** — there can be days-to-weeks delay between deal closing and UCC filing
- **Multi-state filings** — some deals file in multiple states
- **Cost** — comprehensive monitoring across all states + Delaware is not trivial

---

## 9. Immediate Action Items

1. **Search California SoS** for: CoreWeave, Lambda Labs, Crusoe Energy, Applied Digital, Fluidstack
2. **Search New York SoS** for same companies
3. **Order Delaware searches** for CoreWeave SPVs (Co. IV through VII) via authorized searcher
4. **Pull CoreWeave credit agreements from SEC EDGAR** — they contain exact UCC filing details
5. **Set up Middesk trial** for API-based monitoring
6. **Subscribe to Kentucky bulk UCC data** (cheap, comprehensive, daily updates)

---

*Last updated: 2026-03-29*
*Data sources: SEC EDGAR, state SoS portals, Blackstone/CoreWeave press releases, Justia contracts database, industry reporting*
