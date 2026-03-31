# Final Recommendation: Corgi Insurance B2B Contact Enrichment

> **Budget:** $200–2,000/month  
> **Targets:** GPU operators, mid-market lenders, offshore reinsurers  
> **Goal:** Find decision-maker emails at niche companies in under 10 minutes  
> **Date:** 2026-03-29

---

## Executive Summary

**Don't build a pipeline. Don't buy ZoomInfo. Run a lean hybrid stack.**

Your three target verticals — GPU operators, mid-market lenders, offshore reinsurers — share the same problem: they're niche. ZoomInfo under-indexes them ($15K+/yr for data that won't even have them). Full DIY pipelines take 3–5 weeks to build and 2–4 hours/week to maintain. Neither is justified at your volume.

The move: **Apollo.io free tier + Hunter.io + Coresignal + a cheap email verifier + Instantly.ai**. Total cost: **$220–$500/month** depending on volume. Scales to 2,000+ enriched contacts/month before you need to rethink anything.

---

## 1. Exact Tool Stack & Monthly Cost Breakdown

### Core Stack

| Tool | Plan | Monthly Cost | What It Does | Credits/Month |
|------|------|-------------|-------------|---------------|
| **Apollo.io** | Free | $0 | Contact discovery + email lookup. 275M+ contacts, API on free tier. | 100 data credits + unlimited email sends (corp domain) |
| **Hunter.io** | Starter (annual) | $34 | Email pattern discovery per domain + email verification. | 2,000 unified credits |
| **Coresignal** | Starter | $49 | LinkedIn-sourced employee data for niche companies not in Apollo. | 250 Collect + 500 Search |
| **Reoon** | Daily plan | $10 | Bulk email verification (catch-all handling). Cheapest per-email. | ~15,000 verifications |
| **Instantly.ai** | Growth | $37 | Cold email sending + warm-up. Unlimited email accounts. | 10,000 emails/mo |
| **Google Workspace** | Business Starter | $7/user × 3 inboxes | Sending infrastructure (3 inboxes on 1 outreach domain). | — |
| **Outreach domain** | 1 × .com | ~$1/mo (amortised) | Separate domain for cold email (never use primary). | — |

### Monthly Cost Summary

| Tier | Tools | Monthly Cost | Contacts/Month |
|------|-------|-------------|---------------|
| **Starter** | Apollo Free + Hunter + Reoon + Instantly + 3 GWS inboxes | **$102/mo** | ~200–300 |
| **Growth** | Above + Coresignal Starter | **$151/mo** | ~400–500 |
| **Scale** | Above + Apollo Basic ($49) + Hunter Growth ($104) | **$350/mo** | ~1,000–2,000 |
| **Full Budget** | Above + Coresignal Pro ($800) | **$1,000/mo** | ~5,000+ |

**Recommendation: Start at Growth tier ($151/mo). Upgrade tools individually as you hit limits.**

### What Each Tool Replaces

| ZoomInfo Feature ($15K+/yr) | Our Stack Equivalent | Cost |
|---|---|---|
| Contact search | Apollo.io free | $0 |
| Email verification | Hunter.io + Reoon | $44/mo |
| Company firmographics | Apollo.io + company websites | $0 |
| LinkedIn-sourced data | Coresignal | $49/mo |
| Cold email platform | Instantly.ai | $37/mo |
| Email warm-up | Instantly.ai (included) | $0 |

---

## 2. Step-by-Step Workflow: Decision Maker Email in Under 10 Minutes

### The Target
You have a company name (e.g., "CoreWeave" / "Clearwater Analytics" / "Artex Risk Solutions"). You need the VP of Risk, CFO, or Head of Infrastructure's verified email.

### Workflow

**Step 1: Identify the person (2 min)**

1. Open **Apollo.io** → People Search
2. Filter: Company = [target], Title contains = ["VP" OR "Head of" OR "Director" OR "Chief"] + relevant keywords ("risk", "underwriting", "infrastructure", "lending", "operations")
3. If Apollo returns results → grab the name, title, and Apollo's email. Move to Step 3.
4. If Apollo returns nothing (niche company not in their DB) → go to Step 2.

**Step 2: Coresignal fallback for niche companies (3 min)**

1. Search Coresignal by company website/name → get employee list
2. Filter by seniority/title keywords
3. Grab the name and LinkedIn URL
4. If still nothing: Google dork — `site:linkedin.com/in "[company name]" "VP" OR "Head of" OR "Director"`

**Step 3: Find the email (2 min)**

1. **Hunter.io Domain Search** → enter the company domain
2. Hunter shows the company's email pattern (e.g., `first.last@company.com`) and known employees
3. If your target appears → take the email directly
4. If not → use the discovered pattern + the person's name to construct the email
5. Alternatively: Apollo.io's email finder (1 credit per lookup)

**Step 4: Verify the email (1 min)**

1. Paste the email into **Hunter.io Email Verifier** (0.5 credits) or **Reoon** single verify
2. Check the result:
   - ✅ **Valid** → proceed to outreach
   - ⚠️ **Catch-all** → domain accepts everything; email format is likely correct but unverifiable. Add to a separate "catch-all" segment. Send cautiously.
   - ❌ **Invalid** → try alternative patterns (see permutation list below)

**Step 5: If email verification fails — pattern permutation (2 min)**

Try these patterns in order (covers 95% of B2B companies):

| Priority | Pattern | Example |
|----------|---------|---------|
| 1 | first.last@ | john.smith@company.com |
| 2 | first@ | john@company.com |
| 3 | firstlast@ | johnsmith@company.com |
| 4 | f.last@ | j.smith@company.com |
| 5 | flast@ | jsmith@company.com |
| 6 | first_last@ | john_smith@company.com |
| 7 | last.first@ | smith.john@company.com |

Verify each with Reoon (bulk verify is $0.0005/email — trying all 7 costs $0.0035).

### Total Time: 5–8 minutes. Total Cost: $0.01–$0.30 per contact.

### Automation Opportunity
Steps 3–5 can be scripted in <50 lines of Python using Hunter's API + Reoon's API. Reduce per-contact time to ~2 minutes (just Step 1–2 manual, rest automated).

---

## 3. Expected Data Quality vs ZoomInfo

### Email Accuracy

| Metric | This Stack | ZoomInfo | Notes |
|--------|-----------|----------|-------|
| **Email deliverability (verified)** | 85–92% | 90–95% | Gap closes when you layer Hunter + Reoon verification |
| **Email find rate** | 70–80% | 80–85% | Apollo's 275M DB + Hunter patterns + Coresignal covers most |
| **Catch-all handling** | Flag & segment | Better (NeverBounce integration) | Reoon flags catch-alls; send to separate segment with lower volume |
| **Bounce rate (on sends)** | 2–5% | 1–3% | Acceptable. Stay under 5% to maintain sender reputation |

### Coverage by Vertical

| Vertical | This Stack | ZoomInfo | Winner |
|----------|-----------|----------|--------|
| **GPU operators** (CoreWeave, Lambda, etc.) | ⭐⭐⭐⭐ Strong — tech companies are well-indexed by Apollo + Coresignal | ⭐⭐⭐ Decent for larger ones; weak on <50 employee shops | **This stack** — cheaper, comparable coverage |
| **Mid-market lenders** (specialty, non-bank) | ⭐⭐⭐ Good — Apollo covers most; Hunter patterns fill gaps | ⭐⭐⭐⭐ Better for traditional finance contacts | **ZoomInfo** — but marginal, not worth $15K |
| **Offshore reinsurers** (Bermuda, Cayman, Lloyd's) | ⭐⭐ Weakest vertical — small companies, non-US, niche titles | ⭐⭐ Also weak — ZoomInfo optimised for US mid-market+ | **Tie** — both are weak. Manual research + Coresignal + Hunter patterns is your best bet |

### Phone Numbers

| Metric | This Stack | ZoomInfo |
|--------|-----------|----------|
| **Direct dial availability** | Low (~15–20% from Apollo free) | High (70M+ direct dials) |
| **Mobile numbers** | Very low | Moderate (94M+ claimed) |
| **Company main lines** | Moderate (website scraping + Google) | High |

**Honest assessment:** Phone numbers are where ZoomInfo genuinely beats this stack. If cold calling is a significant channel, add **Lusha** ($20–$52/mo) for phone credits in NA/UK. For offshore reinsurers, phone data is poor everywhere — use LinkedIn InMail or warm intros instead.

### Overall Quality Comparison

| Dimension | This Stack vs ZoomInfo |
|-----------|----------------------|
| Email accuracy | **90% of ZoomInfo quality at 3% of cost** |
| Company firmographics | **Comparable** (Apollo + public sources) |
| Phone numbers | **50% of ZoomInfo quality** (add Lusha if needed) |
| Data freshness | **Comparable** — Apollo/Coresignal update regularly |
| Niche company coverage | **Better for small/niche** — ZoomInfo under-indexes SMBs |
| Intent data | **Not available** — ZoomInfo's genuine differentiator. Irrelevant at your current stage. |

---

## 4. Email Verification Workflow

### Three-Layer Architecture

```
Email candidate
    │
    ▼
┌─────────────────────────────────────┐
│  Layer 1: Syntax + Disposable       │  FREE (in-house or Hunter)
│  - Valid format?                     │
│  - Known disposable domain?         │
│  - MX records exist?                │
│  Result: Pass / Hard Fail           │
└──────────────┬──────────────────────┘
               │ Pass
               ▼
┌─────────────────────────────────────┐
│  Layer 2: SMTP Verification         │  $0.0005/email (Reoon)
│  - Reoon bulk verify                │  OR $0.008/email (NeverBounce)
│  - Returns: Valid / Invalid /       │
│    Catch-All / Unknown              │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    Valid          Catch-All
        │             │
        ▼             ▼
┌──────────────┐  ┌───────────────────┐
│ Send with    │  │ Layer 3: Segment  │  MANUAL PROCESS
│ confidence   │  │ - Lower send vol  │
│              │  │ - Monitor bounces │
│ ✅ Outreach  │  │ - Remove after 2  │
│ list         │  │   bounces         │
└──────────────┘  │ ⚠️ Cautious list  │
                  └───────────────────┘
```

### Practical Process

**Before any campaign:**

1. **Bulk verify** your list through Reoon ($0.0005/email = $0.50 per 1,000 emails)
2. **Remove** all "Invalid" results immediately
3. **Segment** "Catch-all" into a separate list (expect ~15–25% of B2B domains)
4. **Flag** "Unknown" for manual review or re-verification in 48 hours

**During campaigns:**

5. **Monitor** bounce rates per-domain in Instantly.ai
6. **Auto-remove** any hard bounce (5xx) — never retry
7. **Pause sending** to any domain with >5% bounce rate
8. **Weekly re-verify** your active sending list (costs ~$2–5 for 5,000 emails)

**Catch-all domain strategy:**

- Send at **50% of normal volume** to catch-all addresses
- Track engagement (opens/replies) — if zero engagement after 2 sends, remove
- Common catch-all domains in your verticals: many small reinsurers and GPU startups use Google Workspace (catch-all by default)
- If a catch-all domain is critical (e.g., a top target), verify manually: send a test email and check for NDR within 24h

### Budget for Verification

| Volume | Reoon Cost | NeverBounce Cost |
|--------|-----------|-----------------|
| 1,000/mo | $0.50 | $8 |
| 5,000/mo | $2.50 | $40 |
| 10,000/mo | $5.00 | $80 |

**Recommendation:** Reoon for routine bulk verification. NeverBounce if you need higher accuracy on critical lists (it's a ZoomInfo subsidiary with access to delivery signals).

---

## 5. Cold Email Infrastructure Recommendation

### Domain & Inbox Setup

```
Primary brand:  corgiinsurance.com  ← NEVER use for cold email

Outreach domains (buy 2–3):
  ├── corgiinsurance-team.com
  ├── getcorgiinsurance.com
  └── trycorgi.com

Per domain: 3 Google Workspace inboxes
  ├── josh@corgiinsurance-team.com
  ├── team@corgiinsurance-team.com
  └── hello@corgiinsurance-team.com

Total: 3 domains × 3 inboxes = 9 sending addresses
Capacity: 9 × 50 emails/day = 450 cold emails/day (after warm-up)
```

### Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| 3 × .com domains | $42/yr ($3.50/mo) | Via Cloudflare Registrar or Namecheap |
| 9 × Google Workspace | $63/mo ($7/inbox) | Business Starter plan |
| Instantly.ai Growth | $37/mo | Sending platform + warm-up |
| **Total infrastructure** | **$104/mo** | Before enrichment costs |

### Authentication Checklist (per domain)

- [ ] SPF record: `v=spf1 include:_spf.google.com ~all`
- [ ] DKIM: Enable in Google Workspace Admin → Gmail → Authenticate email
- [ ] DMARC: `v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com` (start with `p=none`, move to `p=quarantine` after 30 days)
- [ ] Custom tracking domain in Instantly.ai (avoid shared tracking domains)
- [ ] rDNS/PTR record (automatic with Google Workspace)

### Warm-Up Schedule

| Week | Daily Volume Per Inbox | Total Daily (9 inboxes) | Activity |
|------|----------------------|------------------------|----------|
| 1 | 3–5 | 27–45 | Instantly.ai auto-warmup only. No cold sends. |
| 2 | 5–10 | 45–90 | Continue warmup. Test 5–10 cold emails to warm contacts. |
| 3 | 10–20 | 90–180 | Begin cold outreach. Verified list only. Monitor bounces. |
| 4 | 20–30 | 180–270 | Scale if bounce < 2% and complaint < 0.1%. |
| 5 | 30–40 | 270–360 | Approaching steady state. |
| 6+ | 40–50 | 360–450 | Full capacity. |

**Critical rules:**
- Never send more than 50/day per inbox
- Never increase more than 20% per day
- If bounce rate exceeds 3% — pause, clean list, investigate
- Keep warm-up running even after reaching full volume

### Sending Strategy by Vertical

| Vertical | Approach | Volume | Notes |
|----------|----------|--------|-------|
| **GPU operators** | Direct cold email | High (100+ targets) | Tech-savvy; concise, technical emails work. Reference specific infrastructure or compliance needs. |
| **Mid-market lenders** | Cold email + LinkedIn | Medium (50–100 targets) | More formal. Reference regulatory requirements. Subject lines mentioning compliance/risk outperform. |
| **Offshore reinsurers** | LinkedIn first, email second | Low (20–50 targets) | Tight-knit industry; warm intros > cold email. Use email for follow-up after LinkedIn connection. Consider industry events as touchpoints. |

---

## 6. Automate vs Manual

### Automate These

| Task | Tool | Why Automate |
|------|------|-------------|
| Email pattern discovery per domain | Hunter.io API | Same API call every time. Script once, reuse forever. |
| Email permutation generation | Custom script (50 lines Python) | Pure computation. The 7-pattern list never changes. |
| Bulk email verification | Reoon API | $0.0005/email. Upload CSV, get results. No human judgment needed. |
| Email sending + follow-ups | Instantly.ai | Sequences, A/B tests, auto-follow-up on day 3/7/14. |
| Warm-up | Instantly.ai | Fully automated peer-to-peer warm-up network. |
| Bounce processing | Instantly.ai | Auto-removes hard bounces. Flags domains. |
| Domain health monitoring | Google Postmaster Tools | Free dashboard. Check weekly. |

### Keep Manual

| Task | Why Manual |
|------|-----------|
| **Target company identification** | Knowing which GPU operators, lenders, or reinsurers to target requires industry knowledge and judgment. No API replaces this. Build and maintain a curated target list in a spreadsheet or Airtable. |
| **Decision maker identification** | For niche companies with <50 employees, Apollo/Coresignal may not have the right person. LinkedIn manual search (or Sales Nav if volume justifies $90/mo) is often faster than debugging API results. |
| **Email copy** | Write 3–5 templates per vertical. A/B test in Instantly. But the initial writing needs a human who understands insurance. |
| **Catch-all domain decisions** | When Reoon flags a domain as catch-all, a human decides: is this target valuable enough to risk a potential bounce? |
| **Reply handling** | When someone responds to your cold email, a human takes over. No automation for the actual sales conversation. |
| **Offshore reinsurer outreach** | This vertical is small enough (~50–100 companies globally) that manual LinkedIn research + warm intros will outperform any automation. |
| **Opt-out/compliance management** | Review opt-out requests. Maintain suppression list. Check monthly. |

### Semi-Automate (Human-in-the-Loop)

| Task | Approach |
|------|----------|
| **Weekly target list refresh** | Script pulls new companies from Crunchbase/news. Human reviews and approves additions. |
| **Enrichment for new targets** | Script runs Apollo → Hunter → Reoon pipeline. Human reviews results before adding to send list. |
| **Campaign performance review** | Instantly.ai dashboards. Human reviews weekly: open rates, reply rates, bounce rates. Adjusts copy/targeting. |

---

## 7. Compliance Checklist (Non-Negotiable)

Since Corgi Insurance operates in the insurance/financial services space, compliance hygiene matters more than average:

- [ ] **Privacy policy** on corgiinsurance.com covering data collection for outreach
- [ ] **Working unsubscribe** in every cold email (Instantly.ai handles this)
- [ ] **Physical business address** in every email (CAN-SPAM requirement)
- [ ] **Suppression list** — opted-out contacts never re-added, persists across campaigns
- [ ] **Legitimate Interest Assessment** documented for UK/EU targets
- [ ] **Avoid Germany** for cold email (requires prior consent under UWG Section 7)
- [ ] **SPF + DKIM + DMARC** on all sending domains (Gmail/Yahoo/Outlook reject without these)
- [ ] **Data source documentation** — record where each contact's data came from
- [ ] **45-day response** to any CCPA data subject request
- [ ] **Honour opt-outs within 24 hours** (industry standard, even though CAN-SPAM allows 10 days)

---

## 8. Implementation Timeline

| Week | Action | Cost |
|------|--------|------|
| **1** | Register 2–3 outreach domains. Set up Google Workspace (3 inboxes per domain). Configure SPF/DKIM/DMARC. Sign up for Instantly.ai and start warm-up. | ~$100 one-time + $100/mo |
| **2** | Sign up for Apollo.io (free), Hunter.io (Starter), Reoon. Build target company list (50–100 companies across 3 verticals). Start manual enrichment workflow. | ~$44/mo added |
| **3** | Write 3 email templates per vertical (9 total). Set up sequences in Instantly.ai (3-email sequences with follow-ups on day 3 and 7). Begin sending to first 50 verified contacts. | $0 (writing time only) |
| **4** | Review results. Optimise templates based on open/reply rates. Add Coresignal if Apollo's coverage is insufficient for niche targets. Scale to 100+ contacts/week. | +$49/mo if adding Coresignal |
| **6** | Assess: Is volume high enough to justify Apollo Basic ($49/mo) or Hunter Growth ($104/mo)? Upgrade only what you're hitting limits on. | Variable |

**Time to first cold email sent: ~3 weeks** (2 weeks warm-up + 1 week list building/enrichment).

---

## 9. What This Stack Cannot Do

Be honest about the gaps:

1. **Intent data** — You won't know who's actively researching insurance solutions. ZoomInfo/Bombora provide this; it's their genuine moat. At your stage, this doesn't matter. Intent data helps at scale (10K+ prospects); you're working a curated list of <500.

2. **Mobile phone numbers at scale** — If cold calling becomes a channel, add Lusha ($20–52/mo). The rest of the stack doesn't solve this.

3. **Real-time CRM enrichment** — Auto-enriching every new CRM contact requires Clearbit/Breeze (HubSpot lock-in) or ZoomInfo. At your volume, manual enrichment when a lead enters your CRM takes 2 minutes and costs nothing.

4. **Full org charts** — ZoomInfo maps reporting structures. You won't have this. For <50 employee companies (most of your targets), the org chart is simple enough to figure out from LinkedIn.

---

## TL;DR — The Stack

| Layer | Tool | Cost/mo |
|-------|------|---------|
| Discovery | Apollo.io (free) | $0 |
| Email patterns | Hunter.io Starter | $34 |
| Niche LinkedIn data | Coresignal Starter | $49 |
| Email verification | Reoon | $10 |
| Sending platform + warmup | Instantly.ai Growth | $37 |
| Sending infrastructure | 3 domains + 9 GWS inboxes | $67 |
| **Total** | | **$197/mo** |

**$197/month gets you the capability that ZoomInfo charges $15,000+/year for — at 85–90% of the data quality, with better coverage of niche companies.**

Upgrade path is clear: bump individual tools as you hit their limits. The whole stack stays under $500/mo up to ~2,000 contacts/month. You'll know it's time to rethink when you consistently exhaust Apollo and Hunter credits before month-end.
