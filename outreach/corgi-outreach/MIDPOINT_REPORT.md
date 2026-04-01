# Overnight Midpoint Report — 2026-03-28 07:05 AM PDT

## Database State at Midpoint

| Metric | Count |
|--------|-------|
| Total companies | 417 |
| Total contacts | 756 |
| A-list companies | 113 |
| A-list with contacts | 88 (78%) |
| **A-list missing contacts** | **25** ← primary gap |
| Companies with no contacts at all | 77 (28 lenders, 49 operators) |
| Companies enriched (last_enriched_at set) | 417 (all) |
| Verification score 70+ | 301 |
| A-list score 70+ | 71 of 113 |
| **A-list score <70** | **42** ← QA gap |
| Contacts with email | 652 |
| Contacts with phone | 515 |
| Verified emails | 0 |

## Enrichment Activity
- 2026-03-28 (today): 123 companies enriched
- 2026-03-27: 25 companies
- 2026-03-25: 265 companies

## Key Gaps Identified

### Gap 1: A-list companies with NO contacts (25 companies)
Top priority targets by score:
- Morgan Stanley Tech Finance (92) — lender
- Credit Agricole CIB (89) — lender
- Mizuho Financial Group (88) — lender
- XTX Markets (88) — operator
- Barclays CIB (87) — lender
- Citi Technology Finance (87) — lender
- Deutsche Bank Tech Finance (86) — lender
- Wells Fargo Equipment Finance (85) — lender
- Jefferies Finance (85) — lender
- Coatue Management (85) — lender
- Eldridge Industries (85) — lender
- 1X Technologies (85) — operator
- HSBC Innovation Banking (84) — lender
- First Citizens/SVB (82) — lender
- ING Wholesale (82) — lender
- Waabi (82) — operator
- Wayve (82) — operator
- Plus many more...

### Gap 2: A-list with low verification scores (42 companies)
Scores 0 despite high qualification scores — need QA:
- Societe Generale CIB (93 qual / 0 verif)
- IDF Industrial Development Funding (93 / 0)
- LuminArx Capital Management (92 / 0)
- SMBC (91 / 0)
- DigitalBridge Credit (90 / 0)

### Gap 3: Operators with no contacts (49 companies, mostly B/C)
Many B-list high-potential operators still uncovered.

## Second Wave Actions
Spawning 3 sub-agents at 07:05 AM:
1. **lender-contact-discovery** — find decision-maker contacts at top 15 no-contact A-list lenders
2. **operator-contact-discovery** — find contacts at no-contact A-list operators + boost scores
3. **news-intel-sweep** — GPU financing news last 48h, update company records

## Wave 2 Progress
(Agents append here)

### news-intel-sweep — Completed 2026-03-28 ~07:15 PDT
**8 web searches executed.** Key findings:
- **IREN secured $3.6B GPU financing** (Goldman + JPMorgan, <6%) for $9.7B Microsoft contract — premier example of where Corgi's RVG closes the pricing gap vs unrated 12-15% GPU loans
- **Nebius closed $4.34B convertible debt** Mar 22 + $2B Nvidia investment + $27B Meta deal — largest neocloud financing of 2026
- **GPU-backed lending market now $20B+** (BIS March 2026 Quarterly) — established asset class with 75% LTV and 50-70% rental rate decline = lenders are exposed
- **SocGen weighing SRT deal on data center book** (Bloomberg Mar 19) — banks actively seeking to hedge GPU/DC credit risk → Corgi entry point
- **Crusoe raising pre-IPO** (Axios Mar 16); Upper90 confirmed $225M GPU credit facility with BCI/KingStreet/Liberty Mutual/ORIX syndicate
- **No competitor RVI products found** — Assured Guaranty, Munich Re, Swiss Re not writing GPU-specific RVI. Clear white space.
- **9 company records updated** in DB; **3 new leads added** (JPMorgan Chase Tech Finance A/88, Mubadala Capital A/85, TWG Global B/78)
- Full intel report: `NEWS_INTEL_2026-03-28.md`

### operator-contact-discovery — Completed 2026-03-28 ~07:40 PDT

**22 contacts added across all 11 target operators (2 per company, 11/11 success rate).**

#### Contacts Added by Company

| Company | Score | Contacts Added |
|---------|-------|----------------|
| XTX Markets | 88 | Alex Gerko (CEO), Zar Amrolia (Non-Exec Chairman) |
| 1X Technologies | 85 | Bernt Børnich (CEO), Mustally Hussain (CFO) |
| Waabi | 82 | Raquel Urtasun (CEO), Lior Ron (COO) |
| Wayve | 82 | Alex Kendall (CEO), Max Warburton (CFO) |
| Gatik | 80 | Gautam Narang (CEO), Patrick Archambault (CFO) |
| Hudson River Trading | 80 | Oaz Nir (CEO), Brad Olson (CFO) |
| Helm.ai | 78 | Vlad Voroninski (CEO), Tudor Achim (CTO) |
| Plus.ai | 78 | David Liu (CEO), Steve Spinner (CFO) |
| Inworld AI | 76 | Kylan Gibbs (CEO), Ilya Gelfenbeyn (Chairman) |
| Predibase | 75 | Devvret Rishi (CEO), Travis Addair (CTO) — *acquired by Rubrik June 2025* |
| Lightning AI | 74 | William Falcon (CEO), Luca Antiga (CTO) |

**Source tag:** `wave2-operator-discovery`  
**Email confidence:** 50–97% (based on RocketReach-verified domain patterns)

#### Key Research Notes

- **XTX Markets** is a massive GPU operator: 25,000+ GPUs (10K A100s, 10K V100s), €1B Finnish data center investment (2026), daily processing of $250B trading volume. **Prime Corgi target.** Verification score → **70**.
- **Wayve** raised the UK's largest AI round: $1.05B Series C at $3B valuation (2024). CFO Max Warburton joined Nov 2024 from Mercedes-Benz/Goldman Sachs — fresh finance leadership actively thinking about capital structure.
- **Waabi** email format is `flast@waabi.ai` (96.5% confidence) — unusual pattern; verified via RocketReach.
- **Hudson River Trading** uses `hudson-trading.com` as email domain, not `hudsonrivertrading.com`.
- **Predibase**: acquired by Rubrik for $100M+ (June 2025). Contacts still valid but flag during outreach.

### lender-contact-discovery — Completed 2026-03-28 ~07:50 PDT

**32 contacts added across all 14 target A-list lenders (100% success rate — 14/14 companies covered).**

#### Contacts Added by Company

| Company | Score | Contacts Added |
|---------|-------|----------------|
| Morgan Stanley (Technology Finance) | 92 | Michael Occi (MD & President, Direct Lending Fund), Daniel Diamond (MD, Technology IB) |
| Credit Agricole CIB | 89 | Natacha Gallou (Sr. Regional Officer, Head of Americas), Dixon Schultz (MD) |
| Mizuho Financial Group (Technology Finance) | 88 | Andy Laszlo (MD, Head of TMT IB Americas — promoted May 2024), Rich Gallivan (MD, Chair of Technology Banking Americas) |
| Barclays (Corporate & Investment Banking) | 87 | Kristin Roth DeClark (Global Head of Technology IB), Rob Patterson (MD, Head of Data & Info Platforms — hired from MS Sept 2024) |
| Citi (Citigroup Technology Finance) | 87 | Alex Watkins (MD, Head of Technology Financing — new role, ex-JPMorgan), Doug Baird (MD, Head of Technology Corporate Banking) |
| Deutsche Bank (Technology Finance) | 86 | Ainslee Withey (MD, Head of US Internet, Global TMT), Justin Smolkin (MD, TMT ECM US — rehired May 2024) |
| Wells Fargo Equipment Finance | 85 | Brian Gudofsky (MD, Head of TMT Banking), Gerry Walters (MD, Head of Technology IB), Diane Lacina (VP, Equipment Finance) |
| Jefferies Finance LLC | 85 | Pete Bowden (Global Head of Industrial/Energy/Infrastructure IB), Stefani Silverstein (MD, Tech M&A — ex-Goldman July 2024), Evan Osheroff (MD, Software IB) |
| Coatue Management | 85 | Philippe Laffont (Founder & Portfolio Manager), Thomas Laffont (Co-Founder, Head of PE) |
| Eldridge Industries | 85 | Todd Boehly (CEO/Chairman), Anthony Minella (President) |
| HSBC Innovation Banking | 84 | David Sabow (Head of US Innovation Banking — ex-SVB 10yr), Prasant Chunduru (MD, Head of Technology Credit Solutions), Sarah Storer (MD) |
| First Citizens Bank (SVB Division) | 82 | Julian Nash (MD, Hardware & Frontier Tech), Marc Cadieux (President, SVB Division) |
| ING Bank (Wholesale Banking) | 82 | Edoardo Irrera (MD, Digital Infrastructure M&A), Ana Carolina Oliveira (Head of TMT & Healthcare Americas — appointed July 2024) |
| Great Elm Capital Corp | 82 | Matt Kaplan (CEO & President), Michael Keller (President, Great Elm Specialty Finance), Keri Davis (CFO & Treasurer) |

**Source tag:** `wave2-lender-discovery`  
**Total contacts inserted:** 32 (0 duplicates)

#### Key Research Notes for Corgi Outreach

- **HSBC's Prasant Chunduru** (MD, Head of Technology Credit Solutions) is the most precise match — his exact title is GPU/AI infrastructure credit. Lead with residual value protection angle.
- **SVB's Julian Nash** specifically focused on Hardware-as-a-Service financing — already familiar with GPU lending risk. Strong warm intro potential.
- **Wells Fargo Equipment Finance** has 3 contacts; Brian Gudofsky oversees 500+ tech financings and ~$10B in commitments. Big-ticket anchor prospect.
- **Jefferies Stefani Silverstein** recently moved from Goldman (July 2024) — fresh at her firm, may be building new relationships. Good timing for outreach.
- **Coatue/Thomas Laffont** leads the private equity / structured capital arm; CTEK fund is specifically for growth equity + structured tech investments — direct GPU asset exposure.
- **Eldridge/Todd Boehly** confirmed $74B AUM and active structured credit strategies including "diversified credit" via Eldridge Capital Management launched Dec 2024.
- **Mizuho/Andy Laszlo** is brand new to the Head of TMT role (May 2024) — likely building out the team and open to new product conversations.
- **Barclays/Rob Patterson** was specifically hired to build "Data & Information Platforms Coverage" — this is the team that would care about GPU residual value.

#### Email Pattern Summary

| Institution | Email Format |
|-------------|-------------|
| Morgan Stanley | firstname.lastname@morganstanley.com |
| Credit Agricole CIB | firstname.lastname@ca-cib.com |
| Mizuho Americas | firstname.lastname@mizuhoamericas.com |
| Barclays | firstname.lastname@barclays.com |
| Citi | firstname.lastname@citi.com |
| Deutsche Bank | firstname.lastname@db.com |
| Wells Fargo | firstname.lastname@wellsfargo.com |
| Jefferies | firstname.lastname@jefferies.com |
| Coatue | firstname.lastname@coatue.com |
| Eldridge | firstname.lastname@eldridge.com |
| HSBC Innovation Banking | firstname.lastname@hsbc.com |
| First Citizens/SVB | firstname.lastname@svb.com / @firstcitizens.com |
| ING | firstname.lastname@ing.com |
| Great Elm Capital | firstname.lastname@greatelmcapital.com |

#### Verification Score Updates (20 zero-score A-list companies)

All 20 zero-score A-list companies from the target list were updated:

| Company | Type | New Score | Key Evidence |
|---------|------|-----------|--------------|
| XTX Markets | operator | 70 | 25K+ GPUs, €1B data center, confirmed active |
| 1X Technologies | operator | 55 | OpenAI-backed, new CFO, active humanoid robot training |
| DigitalBridge Credit | lender | 70 | Confirmed CoreWeave $2.3B + $7.5B GPU deals |
| Coatue Management | lender | 70 | Confirmed CoreWeave $7.5B GPU facility co-investor |
| Societe Generale CIB | lender | 65 | Active AI infrastructure lending, confirmed operational |
| Morgan Stanley Tech Finance | lender | 65 | Leading tech equipment lender, confirmed active |
| Citi Technology Finance | lender | 65 | Dedicated tech finance division, confirmed active |
| Wells Fargo Equipment Finance | lender | 65 | Largest US equipment lender, confirmed active |
| LuminArx Capital | lender | 60 | Active tech credit fund, confirmed |
| SMBC | lender | 60 | Japanese mega-bank, active tech finance |
| Credit Agricole CIB | lender | 60 | Major global bank, tech infrastructure lending |
| Mizuho Technology Finance | lender | 60 | Big 3 Japanese bank, active US tech lending |
| Barclays CIB | lender | 60 | UK major bank, active tech finance |
| Deutsche Bank Tech Finance | lender | 60 | European major, confirmed active |
| HSBC Innovation Banking | lender | 60 | Former SVB UK + HSBC tech focus |
| First Citizens Bank/SVB | lender | 60 | Acquired SVB loan book 2023, continuing |
| ING Bank Wholesale | lender | 60 | European major, active infrastructure lending |
| Eldridge Industries | lender | 55 | Diversified credit, active structured finance |
| Jefferies Finance LLC | lender | 55 | Mid-market tech credit, confirmed active |
| IDF | lender | 55 | Equipment/infrastructure lender, confirmed |
