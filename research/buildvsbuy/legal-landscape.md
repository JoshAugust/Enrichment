# Legal Landscape: Contact Data Scraping & Enrichment

> Last updated: 2026-03-29
> Status: Research complete — actionable guidance for build-vs-buy decision

---

## 1. hiQ vs LinkedIn — Final Outcome & Practical Implications

### What Happened
The landmark web scraping case ran from 2017–2022. The **Ninth Circuit twice ruled** that scraping publicly available data does not violate the Computer Fraud and Abuse Act (CFAA). The Supreme Court vacated and remanded in light of *Van Buren v. United States* (2021), but the Ninth Circuit **reaffirmed its position even more strongly** in April 2022.

### How It Actually Ended
LinkedIn won the **individual case** via settlement in December 2022:
- hiQ paid **$500k in damages**
- hiQ agreed to **destroy all scraped data**
- LinkedIn obtained a **permanent injunction**
- But: LinkedIn won on **contract and unfair competition claims**, NOT on CFAA grounds

### What This Means for You
**The Ninth Circuit precedent still stands:** Scraping publicly available data is **not a CFAA violation**. However:

| ✅ What's Likely OK | ⚠️ What's Risky |
|---|---|
| Scraping publicly visible profile data | Bypassing login walls or technical barriers |
| Collecting data visible to any visitor | Violating a site's Terms of Service (contract risk) |
| Using publicly available business info | Creating fake accounts to access data |
| Building on data people chose to make public | Scraping after receiving a cease & desist |

**Key nuance:** Not violating the CFAA doesn't mean no legal risk. You can still get hit with:
- **Breach of contract** (ToS violations)
- **Trespass to chattels** (overloading servers)
- **Unfair competition** claims
- **State privacy law** violations (CCPA, etc.)

**Bottom line:** The CFAA won't get you, but ToS + state privacy laws absolutely can.

---

## 2. GDPR & B2B Contact Data in Europe

### Legitimate Interest — What It Actually Means

Legitimate interest (Article 6(1)(f)) is the **standard legal basis** for B2B cold outreach in most of Europe. You don't need consent — but you do need documentation.

### The Three-Part Test (Legitimate Interest Assessment / LIA)

You must document all three:

1. **Purpose Test:** "We have a legitimate business interest in reaching potential customers whose roles align with our product"
2. **Necessity Test:** "Email outreach is a proportional, targeted method — we're not mass-blasting"
3. **Balancing Test:** "A VP of Engineering would reasonably expect to receive relevant B2B software pitches at their work email"

### Practical Requirements
- **Collect only essentials:** Name, work email, job title, company. That's it.
- **Source transparency:** Every email must explain where you got their data and why
- **Easy opt-out:** One-click unsubscribe, honored immediately
- **Documentation:** Keep records of your LIA, data sources, and processing activities
- **Data minimization:** Don't hoard — delete what you don't need

### ⚠️ Country-Level Variations (ePrivacy Directive)

This is where it gets messy. GDPR is EU-wide, but the ePrivacy Directive is implemented nationally:

| Country | B2B Cold Email | Notes |
|---|---|---|
| **UK** | ✅ Allowed for corporate subscribers | PECR exempts Ltd companies, LLPs, gov bodies. Sole traders and some partnerships are NOT exempt. GDPR still applies to personal data. |
| **France** | ✅ Generally allowed B2B | Must be relevant to recipient's role |
| **Netherlands** | ✅ Generally allowed B2B | Similar to France |
| **Germany** | ❌ Requires prior consent | UWG Section 7 — double opt-in required even for B2B. Strictest in Europe. |
| **Most other EU** | ✅ Allowed with legitimate interest | But check local implementation |

**Germany is the outlier.** If you're targeting German companies, cold email is essentially off the table without consent. LinkedIn outreach or phone calls are the workaround.

### GDPR Fines — What's Realistic
- **Maximum:** €20M or 4% of global revenue
- **Practical reality for startups:** Enforcement tends to target larger companies and egregious violations. But DPAs (Data Protection Authorities) can and do investigate complaints from individuals.
- **Real risk:** A single angry recipient filing a complaint with their DPA can trigger an investigation

---

## 3. CCPA / CPRA Implications

### Critical Change: B2B Exemption is GONE

The CCPA's B2B data exemption **expired January 1, 2023**. B2B contacts in California now have full consumer privacy rights.

### What This Means
California residents (even in B2B contexts) now have:
- **Right to know** what data you've collected
- **Right to delete** their personal information
- **Right to correct** inaccurate data
- **Right to opt out** of sale/sharing of their data

### Scraping-Specific Rules
- **Scraping = "collection"** under CCPA's broad definition ("obtaining or gathering by any means")
- **If you scrape for your own use:** No notice-at-collection required
- **If you scrape and sell/share the data:** Must provide notice at collection
- **Publicly available info** has some carve-outs, but the definition is narrow

### Compliance Requirements
1. **Privacy policy** that covers B2B data collection and processing
2. **Data subject request mechanism** — respond within 45 days
3. **Opt-out mechanism** if selling/sharing data
4. **Data mapping** — know what you collect and where it flows
5. **Reasonable security measures** for all personal data

### Penalties
- **$2,500 per unintentional violation**
- **$7,500 per intentional violation**
- California AG and CPPA (California Privacy Protection Agency) actively enforcing

---

## 4. CAN-SPAM Compliance for Outreach

CAN-SPAM is the **most permissive** major email regulation. It's opt-out, not opt-in — meaning you CAN cold email without prior permission.

### Hard Requirements (Every Email Must Have)

| Requirement | Details |
|---|---|
| **Accurate headers** | Real "From" name, email, and domain. No spoofing. |
| **Non-deceptive subject lines** | Must reflect actual content. No clickbait. |
| **Physical address** | Your real business address in every email |
| **Opt-out mechanism** | Clear, working unsubscribe link |
| **Honor opt-outs** | Within 10 days (best practice: same day) |
| **Identify as ad** | If the message is primarily commercial |

### 2024+ Technical Requirements
Gmail, Yahoo, and Microsoft now **reject or spam-folder** emails without:
- **SPF** (Sender Policy Framework)
- **DKIM** (DomainKeys Identified Mail)
- **DMARC** (Domain-based Message Authentication)

These aren't legally required but are effectively mandatory for deliverability.

### Penalties
- **Up to $53,088 per email violation**
- Multiple parties can be held liable (sender + the company whose product is promoted)

### What CAN-SPAM Does NOT Require
- Prior consent (opt-out model, not opt-in)
- Existing relationship
- Any B2B-specific treatment (applies equally to B2B and B2C)

---

## 5. How ZoomInfo & Apollo Handle Opt-Outs

Understanding how the big players do it reveals what "industry standard" compliance looks like.

### ZoomInfo's Approach
- **Proactive notification:** Sends a "notice of data collection" to every contact with an email in their database
- **Self-service opt-out:** Trust Center portal where anyone can request removal
- **Process:** Submit work email → receive confirmation code → profile removed within 24 hours (14 days if email doesn't match)
- **Suppression list:** Opted-out contacts are permanently suppressed from re-addition
- **Customer notification:** Shares opt-outs with customers so they can honor them within 30 days
- **Google de-indexing:** Requests removal of profiles from Google search results
- **Registered data broker** in required states

### Apollo's Approach
- **Privacy Center:** Self-service portal for access requests and opt-outs
- **Process:** Submit business email → confirmation link → removal within 24 hours
- **Suppression list:** Permanent suppression of opted-out records
- **Customer obligation:** Requires customers to cease processing on valid deletion/opt-out requests
- **Activity logs:** Makes opt-out info available in customer account logs
- **Registered data broker** in California and all required states
- **GDPR compliant** as both Data Processor and Data Controller

### What This Tells You About Building Your Own

If you're doing your own enrichment, you need **at minimum:**
1. A **public-facing opt-out/privacy page** with a working removal process
2. A **suppression list** that persists across re-enrichment runs
3. **Processing of removal requests** within 24 hours (industry standard, even if law allows longer)
4. **Documentation** of your data sources and processing activities
5. A **privacy policy** that explains what data you collect and why
6. **Data broker registration** if operating in California (and growing number of other states)

---

## 6. Practical Risk Assessment for a Startup

### Risk Matrix

| Activity | Legal Risk | Practical Risk | Notes |
|---|---|---|---|
| Scraping public LinkedIn profiles | Medium | Medium-High | ToS violation; LinkedIn actively litigates |
| Scraping public company websites | Low | Low | Mostly fine if you respect robots.txt |
| Enriching with publicly available data | Low-Medium | Low | Standard practice; document sources |
| Email verification/validation | Low | Low | Just confirming deliverability |
| Cold email to US contacts | Low | Low | CAN-SPAM compliant = you're fine |
| Cold email to UK contacts | Low-Medium | Low | Corporate subscribers exempt under PECR |
| Cold email to EU contacts (non-Germany) | Medium | Low-Medium | Legitimate interest + LIA required |
| Cold email to German contacts | High | Medium-High | Consent required; enforcement active |
| Storing enriched data without privacy policy | Medium | Medium | Easy to fix; hard to defend if caught |
| No opt-out mechanism | High | High | Violation under basically every framework |
| Selling/sharing enriched data | High | High | Triggers data broker registration + additional obligations |

### What Enforcement Actually Looks Like

**In practice, regulators focus on:**
- Companies with large-scale, consumer-facing violations
- Repeat offenders who ignore complaints
- Companies that fail to respond to data subject requests
- Egregious violations (no opt-out, no privacy policy, deceptive practices)

**Startups generally fly under the radar IF:**
- They have basic compliance infrastructure (privacy policy, opt-out, documentation)
- They honor opt-out requests promptly
- They're not doing anything overtly deceptive
- They're doing targeted outreach, not mass spam

**But one complaint can trigger an investigation.** A single German recipient filing with their DPA could become a headache.

### Actionable Recommendations

#### Must-Do (Non-Negotiable)
1. **Privacy policy** on your website covering data collection and processing
2. **Working opt-out mechanism** — even a simple form + email workflow
3. **Suppression list** — people who opt out stay out permanently
4. **CAN-SPAM compliance** in every email (address, unsubscribe, honest headers)
5. **Document your data sources** — "we found this person's work email on their company's About page"
6. **Honor data subject requests** within required timeframes (45 days CCPA, 30 days GDPR)

#### Should-Do (Significantly Reduces Risk)
1. **Legitimate Interest Assessment** documented for EU outreach
2. **Data source disclosure** in emails ("We're contacting you because…")
3. **Automated opt-out processing** (not manual)
4. **Data retention policy** — don't keep data forever
5. **SPF/DKIM/DMARC** on your sending domains
6. **Segment by geography** — different compliance rules for US/UK/EU/Germany

#### Consider (If Scaling)
1. **Data broker registration** in California + other required states
2. **DPA (Data Processing Agreement)** template for any data you share
3. **Cookie consent** on your website if you're tracking visitors
4. **Regular data audits** — what do you have, do you still need it
5. **Legal review** of your enrichment pipeline before scaling aggressively

### Build vs Buy — Legal Angle

| Factor | Build Your Own | Buy (ZoomInfo/Apollo) |
|---|---|---|
| **Compliance liability** | 100% on you | Shared — vendor handles collection compliance |
| **Opt-out infrastructure** | You must build it | Built in |
| **Data broker registration** | Your responsibility if selling/sharing | Vendor handles their own; you may still need to register |
| **GDPR compliance** | You need LIA, privacy policy, DPA | Vendor has these; you need your own for outreach |
| **Enforcement risk** | Higher if infrastructure is immature | Lower — vendor absorbs collection-phase risk |
| **Cost of compliance** | Engineering time + legal review | Included in subscription |
| **Control** | Full control over sources and methods | Black box — you inherit vendor's compliance posture |

**The honest answer:** For a startup, the legal compliance overhead of DIY enrichment is manageable but non-trivial. The baseline requirements (privacy policy, opt-out, suppression list, CAN-SPAM compliance) take maybe 1-2 weeks to set up properly. The ongoing burden is honoring data subject requests and maintaining documentation.

Using a vendor like Apollo doesn't eliminate your compliance obligations — you still need your own privacy policy, opt-out mechanism, and CAN-SPAM compliance for actual outreach. But it does shift the **data collection** compliance burden to the vendor and gives you a "we used a reputable, registered data broker" defense if questioned.

---

## TL;DR

1. **Scraping public data is not a CFAA crime** (hiQ precedent), but ToS violations and state privacy laws can still bite
2. **GDPR legitimate interest works for B2B** in most of Europe — document your LIA, be transparent, honor opt-outs. **Avoid Germany** for cold email.
3. **CCPA now covers B2B data** — California contacts have full privacy rights since 2023
4. **CAN-SPAM is your friend** — opt-out model, just follow the checklist
5. **ZoomInfo/Apollo have set the compliance bar** — privacy portals, suppression lists, proactive notices, data broker registration
6. **For a startup:** Risk is low-to-medium if you have basic compliance infrastructure. Skip it entirely and risk is high. The delta is maybe 2 weeks of setup work.
