# How Data Brokers & Contact Enrichment Companies Build Their Databases

> A technical deep-dive into the machinery behind companies like ZoomInfo, Apollo, Clearbit, Lusha, and People Data Labs.

---

## Table of Contents

1. [Web Scraping at Scale](#1-web-scraping-at-scale)
2. [Email Permutation Algorithms](#2-email-permutation-algorithms)
3. [User-Contributed Data Models](#3-user-contributed-data-models)
4. [Public Records Aggregation](#4-public-records-aggregation)
5. [Third-Party Data Purchases](#5-third-party-data-purchases)
6. [Email Verification](#6-email-verification)
7. [Phone Verification](#7-phone-verification)
8. [The Full Pipeline](#8-the-full-pipeline)

---

## 1. Web Scraping at Scale

### What They Scrape

| Source | Data Extracted | Difficulty |
|--------|---------------|------------|
| **LinkedIn** | Name, title, company, tenure, education, skills, connections | High (anti-bot, legal risk) |
| **Company websites** | Team pages, leadership bios, press releases, job postings | Medium |
| **SEC/EDGAR filings** | Officers, directors, compensation, org changes (10-K, DEF 14A) | Low (public, structured) |
| **GitHub** | Developer profiles, email from commits, org affiliations | Low-Medium |
| **Twitter/X** | Bios, follower graphs, company affiliations | Medium (rate limits) |
| **Conference attendee lists** | Name, title, company, sometimes email/phone | Low (often published as PDFs/pages) |
| **Patent databases** | Inventor names, company affiliations | Low |
| **Job boards** | Who's hiring for what (signals growth, tech stack, budget) | Medium |

### How They Scrape LinkedIn

LinkedIn is the crown jewel. Direct scraping violates LinkedIn's ToS (see *hiQ Labs v. LinkedIn*), so enrichment companies use a mix of approaches:

1. **Residential proxy rotation** — Rotate through millions of residential IPs to avoid detection.
2. **Browser fingerprint randomization** — Each request mimics a unique browser environment.
3. **Chrome extensions with user consent** — Users install an extension (e.g., ZoomInfo's, Lusha's) that reads the LinkedIn page they're viewing and sends structured data back.
4. **Licensed partnerships** — Some companies negotiate data-sharing agreements with LinkedIn (rare, expensive).
5. **Headless browser farms** — Puppeteer/Playwright clusters with stealth plugins.

```python
# Conceptual: Stealth scraping pattern (educational only)
import random
from playwright.async_api import async_playwright

PROXIES = [...]  # Pool of residential proxies
USER_AGENTS = [...]  # Rotated realistic UAs

async def scrape_profile(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            proxy={"server": random.choice(PROXIES)},
            headless=True
        )
        context = await browser.new_context(
            user_agent=random.choice(USER_AGENTS),
            viewport={"width": random.randint(1200, 1920),
                       "height": random.randint(800, 1080)},
            locale=random.choice(["en-US", "en-GB"]),
        )
        page = await context.new_page()

        # Randomized delays to mimic human behavior
        await page.goto(url)
        await page.wait_for_timeout(random.randint(2000, 5000))

        name = await page.text_content("h1.text-heading-xlarge")
        title = await page.text_content("div.text-body-medium")
        # ... extract structured fields

        await browser.close()
        return {"name": name, "title": title, "url": url}
```

### SEC/EDGAR Scraping

SEC filings are fully public and machine-readable (XBRL). This is a goldmine for executive-level contacts:

```python
import requests
from bs4 import BeautifulSoup

def get_company_officers(cik: str) -> list:
    """Pull officer names from SEC EDGAR DEF 14A (proxy statement) filings."""
    url = f"https://efts.sec.gov/LATEST/search-index?q=%22executive+officers%22&dateRange=custom&startdt=2024-01-01&forms=DEF+14A&ciks={cik}"

    # Or use the EDGAR full-text search API
    search_url = f"https://efts.sec.gov/LATEST/search-index?q=*&forms=DEF+14A&ciks={cik}"
    headers = {"User-Agent": "DataResearch research@example.com"}

    # Fetch the company filing index
    index_url = f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json"
    resp = requests.get(index_url, headers=headers)
    data = resp.json()

    officers = []
    for officer in data.get("officers", {}).get("data", []):
        # Each row: [name, title, age, yearBorn, ...]
        officers.append({
            "name": officer[0],
            "title": officer[1],
        })
    return officers

# Example: Apple Inc (CIK 0000320193)
# officers = get_company_officers("320193")
```

### GitHub Email Extraction

Git commits contain author emails. Public repos = public emails:

```bash
# Extract all unique author emails from a public repo
git log --format='%ae' | sort -u

# Or via the GitHub API (no clone needed)
curl -s "https://api.github.com/repos/{owner}/{repo}/commits?per_page=100" \
  | jq '.[].commit.author.email' | sort -u
```

Enrichment companies crawl GitHub org pages, correlate developer identities across repos, and extract work emails from commit metadata.

---

## 2. Email Permutation Algorithms

This is the core trick behind "we found the email for anyone at any company." It's pattern matching + brute-force guessing + verification.

### How It Works

1. **Input:** First name, last name, company domain
2. **Generate candidates:** Apply known email patterns
3. **Rank by domain pattern:** If you already know the pattern for `acme.com` is `{first}.{last}`, prioritize that
4. **Verify candidates** against the mail server (see Section 6)

### Standard Permutation Set

```python
def generate_email_permutations(first: str, last: str, domain: str) -> list[str]:
    """Generate all common email permutations for a person at a domain."""
    f = first.lower().strip()
    l = last.lower().strip()
    fi = f[0]  # first initial
    li = l[0]  # last initial

    patterns = [
        f"{f}.{l}",        # john.doe
        f"{f}{l}",         # johndoe
        f"{fi}{l}",        # jdoe
        f"{f}{li}",        # johnd
        f"{fi}.{l}",       # j.doe
        f"{f}.{li}",       # john.d
        f"{l}.{f}",        # doe.john
        f"{l}{f}",         # doejohn
        f"{l}{fi}",        # doej
        f"{f}_{l}",        # john_doe
        f"{f}-{l}",        # john-doe
        f"{l}_{f}",        # doe_john
        f"{fi}{li}",       # jd
        f"{f}",            # john
        f"{l}",            # doe
    ]

    return [f"{p}@{domain}" for p in patterns]

# >>> generate_email_permutations("John", "Doe", "acme.com")
# ['john.doe@acme.com', 'johndoe@acme.com', 'jdoe@acme.com', ...]
```

### Pattern Learning (The Multiplier)

The real power is **learning domain-specific patterns**. If you've already verified that `jane.smith@acme.com` is valid, you now know Acme uses `{first}.{last}`. Apply that pattern to every other contact at Acme:

```python
class DomainPatternLearner:
    """Learn and apply email patterns per domain."""

    PATTERNS = {
        "first.last":   lambda f, l: f"{f}.{l}",
        "firstlast":    lambda f, l: f"{f}{l}",
        "flast":        lambda f, l: f"{f[0]}{l}",
        "first.l":      lambda f, l: f"{f}.{l[0]}",
        "f.last":       lambda f, l: f"{f[0]}.{l}",
        "last.first":   lambda f, l: f"{l}.{f}",
        "first_last":   lambda f, l: f"{f}_{l}",
        "first-last":   lambda f, l: f"{f}-{l}",
        "first":        lambda f, l: f"{f}",
        "last":         lambda f, l: f"{l}",
    }

    def __init__(self):
        self.domain_patterns: dict[str, str] = {}  # domain -> pattern key

    def learn(self, email: str, first: str, last: str):
        """Reverse-engineer the pattern from a known-valid email."""
        local_part = email.split("@")[0].lower()
        domain = email.split("@")[1].lower()
        f, l = first.lower(), last.lower()

        for name, fn in self.PATTERNS.items():
            if fn(f, l) == local_part:
                self.domain_patterns[domain] = name
                return name
        return None

    def predict(self, first: str, last: str, domain: str) -> str | None:
        """Predict email for a new person at a known domain."""
        pattern = self.domain_patterns.get(domain.lower())
        if pattern and pattern in self.PATTERNS:
            local = self.PATTERNS[pattern](first.lower(), last.lower())
            return f"{local}@{domain.lower()}"
        return None

# Usage:
# learner = DomainPatternLearner()
# learner.learn("jane.smith@stripe.com", "Jane", "Smith")
#   -> learns Stripe uses "first.last"
# learner.predict("Patrick", "Collison", "stripe.com")
#   -> "patrick.collison@stripe.com"
```

At scale, enrichment companies have **pattern databases for millions of domains**. Once you know one email at a company, you can generate emails for everyone else there with high confidence.

---

## 3. User-Contributed Data Models

This is the most underrated data source — and the biggest one for companies like ZoomInfo.

### The Contributory Network (ZoomInfo's Model)

ZoomInfo's "Community Edition" offers free limited access in exchange for connecting your email account. Here's what happens technically:

1. **User connects Gmail/Outlook via OAuth** — grants read access to email metadata
2. **ZoomInfo parses email headers** — `To`, `From`, `CC` fields (not email body)
3. **Email signatures are extracted via ML** — Proprietary NLP parses:
   - Full name
   - Job title
   - Company
   - Phone number (direct dial, mobile)
   - Physical address
4. **Contact data is cross-referenced** with existing database records
5. **Updates propagate** — title changes, new phone numbers, company moves

**Scale:** ZoomInfo processes ~20 million email signatures monthly, updating data on 4 million people and 1 million companies daily. The contributory network accounts for an estimated **60-70% of ZoomInfo's high-quality data** and captures ~50 million records per day.

### Email Signature Parsing (Conceptual)

```python
import re

def parse_email_signature(text: str) -> dict:
    """Extract structured contact info from an email signature block."""
    result = {}

    # Phone patterns
    phone_pattern = r'[\+]?[\d\s\-\(\)]{10,}'
    phones = re.findall(phone_pattern, text)
    if phones:
        result["phones"] = [re.sub(r'[^\d+]', '', p) for p in phones]

    # Title heuristics (line after name, before company)
    title_keywords = [
        "CEO", "CTO", "VP", "Director", "Manager", "Engineer",
        "Head of", "Chief", "President", "Founder", "Partner"
    ]
    for line in text.split('\n'):
        line = line.strip()
        if any(kw.lower() in line.lower() for kw in title_keywords):
            result["title"] = line
            break

    # URL patterns
    urls = re.findall(r'https?://[^\s]+', text)
    if urls:
        result["urls"] = urls

    # LinkedIn
    linkedin = [u for u in urls if "linkedin.com" in u]
    if linkedin:
        result["linkedin"] = linkedin[0]

    return result
```

### Apollo's Model

Apollo has **2+ million data contributors** who share contact information. Their Chrome extension monitors:
- LinkedIn profiles you visit (with consent)
- Email interactions via connected accounts
- CRM data synced from Salesforce, HubSpot, etc.

### The Flywheel Effect

The more users contribute data, the better the database → the more valuable the product → more users sign up → more data contributed. This is why these companies offer generous free tiers — **you are the product**.

---

## 4. Public Records Aggregation

### Data Sources

| Record Type | Source | Data |
|------------|--------|------|
| **Voter registration** | State election boards | Name, address, DOB, party |
| **Property records** | County assessors | Ownership, address, value |
| **Court records** | PACER, state courts | Litigation, bankruptcy |
| **Business filings** | Secretary of State | Officers, registered agents |
| **Professional licenses** | State licensing boards | Licensed professionals, addresses |
| **FCC filings** | FCC databases | Company info, contacts |
| **Patent/trademark** | USPTO | Inventors, attorneys |
| **Campaign finance** | FEC | Donor names, employers, amounts |
| **Census / ACS** | Census Bureau | Demographics, income estimates |

### Technical Implementation

Most public records are available via:
1. **Bulk data downloads** — Many agencies offer downloadable databases (voter files, property records)
2. **FOIA requests** — Freedom of Information Act requests for records not online
3. **APIs** — EDGAR, PACER, USPTO all have APIs
4. **Screen scraping** — County assessor websites, court docket systems

```python
# Example: Scraping state business entity filings
# (Many states have searchable databases of LLC/Corp filings with officer names)

import requests
from bs4 import BeautifulSoup

def search_business_entity(state: str, name: str) -> list:
    """Search state secretary of state for business filings."""
    # Each state has its own system — this is conceptual
    url = f"https://sos.{state}.gov/business/search"
    resp = requests.get(url, params={"q": name})
    soup = BeautifulSoup(resp.text, "html.parser")

    results = []
    for row in soup.select("table.results tr"):
        cols = row.select("td")
        if len(cols) >= 3:
            results.append({
                "entity_name": cols[0].text.strip(),
                "agent": cols[1].text.strip(),     # Registered agent = real person
                "status": cols[2].text.strip(),
                "filing_date": cols[3].text.strip() if len(cols) > 3 else None,
            })
    return results
```

### Identity Resolution

The hard problem: linking `John D. Smith` from voter records to `John Smith` from LinkedIn to `jsmith@acme.com` from email patterns. This requires:

- **Probabilistic matching** — Fuzzy name matching + address proximity + employer match
- **Deterministic anchors** — Email address, phone number, or LinkedIn URL as unique keys
- **Graph-based resolution** — Build a graph of all signals, cluster into identities

```python
# Simplified identity resolution scoring
def identity_match_score(record_a: dict, record_b: dict) -> float:
    score = 0.0

    # Deterministic matches (high confidence)
    if record_a.get("email") == record_b.get("email"):
        score += 0.5
    if record_a.get("phone") == record_b.get("phone"):
        score += 0.4
    if record_a.get("linkedin_url") == record_b.get("linkedin_url"):
        score += 0.5

    # Probabilistic matches
    if fuzzy_name_match(record_a["name"], record_b["name"]) > 0.85:
        score += 0.2
    if record_a.get("company", "").lower() == record_b.get("company", "").lower():
        score += 0.15
    if record_a.get("city") == record_b.get("city"):
        score += 0.1

    return min(score, 1.0)  # Cap at 1.0
```

---

## 5. Third-Party Data Purchases

### The Data Supply Chain

Data flows through a supply chain:

```
[First-party collectors]  →  [Aggregators]  →  [Enrichment platforms]  →  [End users]
       ↓                          ↓                    ↓
  App SDKs, loyalty       Acxiom, Oracle Data     ZoomInfo, Apollo,
  cards, ISPs, telcos,    Cloud, LiveRamp,        Clearbit, Lusha
  credit bureaus          Experian Marketing
```

### What Gets Bought and Sold

| Data Type | Typical Sellers | Price Range |
|-----------|----------------|-------------|
| **Intent data** (what topics people research) | Bombora, G2, TrustRadius | $1,000-10,000/mo |
| **Technographic data** (what tech companies use) | BuiltWith, HG Insights | $500-5,000/mo |
| **Firmographic data** (company info, revenue, size) | D&B, Crunchbase | Varies widely |
| **Contact data** (emails, phones, titles) | Data brokers, contributor networks | $0.01-1.00 per record |
| **Mobile advertising IDs** (MAIDs) | SDK networks, ad exchanges | Bulk, pennies per record |
| **Location data** | Mobile apps, carrier data | $0.001-0.10 per data point |
| **Purchase/transaction data** | Credit card networks, POS systems | Premium pricing |

### Data Marketplace Infrastructure

Modern data exchange happens through:
- **Snowflake Marketplace** — SQL-queryable datasets that never leave the buyer's environment
- **AWS Data Exchange** — Subscribe to third-party datasets delivered to S3
- **Datarade** — Broker marketplace connecting data sellers and buyers
- **LiveRamp** — Identity resolution layer that connects disparate datasets

---

## 6. Email Verification

Once you've generated email candidates (from permutations, scraping, or contributor data), you need to verify them. Here's the technical stack:

### Step 1: Syntax Validation

```python
import re

def validate_email_syntax(email: str) -> bool:
    """RFC 5322 simplified check."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
```

### Step 2: MX Record Lookup

Check if the domain can actually receive email:

```python
import dns.resolver

def get_mx_records(domain: str) -> list[str]:
    """Get mail exchange servers for a domain, sorted by priority."""
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        mx_records = sorted(answers, key=lambda r: r.preference)
        return [str(r.exchange).rstrip('.') for r in mx_records]
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer,
            dns.resolver.NoNameservers):
        return []

# >>> get_mx_records("google.com")
# ['smtp.google.com', 'smtp2.google.com', ...]
```

### Step 3: SMTP Verification (RCPT TO Check)

The core technique. Connect to the mail server and ask "would you accept mail for this address?" without actually sending anything:

```python
import smtplib
import socket

def smtp_verify(email: str, mx_host: str, timeout: int = 10) -> dict:
    """
    Verify an email address via SMTP RCPT TO.

    Returns:
        dict with 'exists' (bool | None), 'catch_all' (bool), 'code' (int)
    """
    result = {"email": email, "exists": None, "catch_all": False, "code": 0}

    try:
        smtp = smtplib.SMTP(timeout=timeout)
        smtp.connect(mx_host, 25)
        smtp.ehlo("verify.example.com")

        # Some servers require STARTTLS
        if smtp.has_extn("STARTTLS"):
            smtp.starttls()
            smtp.ehlo("verify.example.com")

        # Set envelope sender
        smtp.mail("check@verify.example.com")

        # The key check: ask if the recipient exists
        code, message = smtp.rcpt(email)
        result["code"] = code

        if code == 250:
            result["exists"] = True
        elif code == 550:
            result["exists"] = False
        elif code == 451 or code == 452:
            result["exists"] = None  # Greylisting, try again later
        # 421 = too many connections, back off

        smtp.quit()
    except smtplib.SMTPServerDisconnected:
        pass  # Server dropped connection (rate limiting)
    except socket.timeout:
        pass
    except Exception as e:
        result["error"] = str(e)

    return result
```

### Step 4: Catch-All Detection

A catch-all domain accepts email for *any* address, even nonexistent ones. This makes SMTP verification useless for that domain. Detection method:

```python
import uuid

def detect_catch_all(domain: str, mx_host: str) -> bool:
    """
    Detect if a domain is configured as catch-all by testing
    a guaranteed-nonexistent address.
    """
    # Generate a random address that definitely doesn't exist
    fake_email = f"{uuid.uuid4().hex[:16]}@{domain}"

    result = smtp_verify(fake_email, mx_host)

    # If the server accepts a random address, it's catch-all
    if result["exists"] is True:
        return True
    return False

# If catch-all detected:
#   - SMTP verification is unreliable for this domain
#   - Must rely on other signals (engagement tracking, contributor data)
#   - Some services assign a "risky" or "accept-all" status
```

### Step 5: Advanced Signals

Beyond basic SMTP, modern verification services use:

- **Engagement data** — Has anyone on the platform successfully emailed this address and gotten a reply? (Apollo tracks this)
- **Bounce history** — Aggregate bounce data from millions of senders
- **Historical validity** — Was this address valid 6 months ago? (decaying confidence)
- **Provider-specific heuristics** — Google Workspace, Microsoft 365, etc. each have behavioral tells

### Verification Response Taxonomy

| Status | Meaning | Action |
|--------|---------|--------|
| `valid` | Mailbox exists, accepts mail | Safe to email |
| `invalid` | Mailbox doesn't exist (550) | Do not email |
| `catch-all` | Domain accepts everything | Risky — may or may not exist |
| `unknown` | Server didn't give a clear answer | Retry later or use other signals |
| `disposable` | Temporary email service | Likely garbage |
| `role` | Generic address (info@, sales@) | Usually not a person |

---

## 7. Phone Verification

### HLR Lookup (Home Location Register)

The gold standard for mobile number verification. Works by querying the SS7 signaling network that underpins global mobile infrastructure.

#### How It Works

1. **API call** with the phone number (MSISDN format: `+14155551234`)
2. **Query routed** through the SS7 network to the carrier's HLR database
3. **HLR responds** with subscriber status, carrier info, roaming state

```python
import requests

def hlr_lookup(phone: str, api_key: str) -> dict:
    """
    Perform HLR lookup via a verification API.

    Returns carrier, line type, validity, and roaming status.
    """
    # Example using a generic HLR API (Twilio, Vonage, etc.)
    resp = requests.get(
        f"https://api.hlr-provider.com/v1/lookup/{phone}",
        headers={"Authorization": f"Bearer {api_key}"}
    )
    data = resp.json()

    return {
        "number": phone,
        "valid": data.get("valid"),             # Is the number active?
        "carrier": data.get("carrier_name"),     # e.g., "T-Mobile"
        "line_type": data.get("line_type"),      # mobile, landline, voip
        "ported": data.get("ported"),            # Has it been ported?
        "roaming": data.get("roaming"),          # Currently roaming?
        "country": data.get("country_code"),     # ISO country
        "mcc": data.get("mcc"),                  # Mobile Country Code
        "mnc": data.get("mnc"),                  # Mobile Network Code
    }
```

#### What HLR Returns

| Field | Description |
|-------|-------------|
| `IMSI` | International Mobile Subscriber Identity |
| `MCC/MNC` | Country code + network code → identifies carrier |
| `Status` | Active, deactivated, never registered, temporarily unavailable |
| `Ported` | Whether the number moved to a different carrier |
| `Roaming` | Whether the subscriber is currently on a foreign network |

### Phone Number Intelligence Layers

Beyond HLR, enrichment companies use:

1. **CNAM Lookup** (Caller ID) — Maps number to registered name (US landlines/some mobile)
2. **Carrier API queries** — Identify if mobile, landline, or VoIP
3. **Reverse phone databases** — Aggregated from public records, white pages, user contributions
4. **Activity signals** — Ring-time analysis (does the phone ring or go straight to voicemail?)
5. **Cross-referencing** — Match phone against contributor data, public records, email signatures

```bash
# Quick phone type check via Twilio Lookup API
curl -X GET "https://lookups.twilio.com/v2/PhoneNumbers/+14155551234?Fields=line_type_intelligence" \
  -u "$TWILIO_SID:$TWILIO_TOKEN"

# Returns: { "line_type_intelligence": { "type": "mobile", "carrier_name": "T-Mobile" } }
```

### Direct Dial Discovery

Direct dials (personal work phone numbers, not company switchboard) are the most valuable phone data. Sources:

- **Email signatures** — Richest source via contributor networks
- **Conference badges/attendee lists** — Sometimes include mobile numbers
- **Public filings** — Some SEC filings, FCC filings include direct contacts
- **VOIP metadata** — SIP/RTP headers can leak extension mappings
- **Human research** — ZoomInfo employs teams that cold-call switchboards to discover direct dials

---

## 8. The Full Pipeline

Putting it all together — here's how a contact enrichment company builds a record:

```
┌─────────────────────────────────────────────────────────┐
│  DISCOVERY                                              │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐  │
│  │ LinkedIn │ │ Company  │ │ SEC/EDGAR │ │ GitHub   │  │
│  │ Scraping │ │ Websites │ │ Filings   │ │ Commits  │  │
│  └────┬─────┘ └────┬─────┘ └─────┬─────┘ └────┬─────┘  │
│       └─────────────┼─────────────┼────────────┘        │
│                     ▼                                   │
│              Raw Identity Signals                       │
│          (name, title, company, URLs)                   │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  ENRICHMENT                                             │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────┐  │
│  │ Email        │ │ Contributor   │ │ Public Records │  │
│  │ Permutation  │ │ Network Data  │ │ Aggregation    │  │
│  │ + Pattern DB │ │ (signatures)  │ │                │  │
│  └──────┬───────┘ └───────┬───────┘ └───────┬────────┘  │
│         └─────────────────┼─────────────────┘           │
│                           ▼                             │
│                 Candidate Contact Data                  │
│           (email guesses, phones, addresses)            │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  VERIFICATION                                           │
│  ┌────────────┐ ┌──────────┐ ┌────────────┐            │
│  │ MX + SMTP  │ │ Catch-All│ │ HLR Phone  │            │
│  │ Email Check│ │ Detection│ │ Lookup     │            │
│  └────────────┘ └──────────┘ └────────────┘            │
│                       ▼                                 │
│              Confidence-Scored Records                  │
│        (valid/invalid/risky + confidence %)             │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  IDENTITY RESOLUTION                                    │
│  Merge all signals into unified contact profiles        │
│  Deduplicate across sources                             │
│  Assign master record IDs                               │
│  Track changes over time (job changes, new phones)      │
└───────────────────────┬─────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────┐
│  DELIVERY                                               │
│  API, CRM sync, CSV export, Snowflake share             │
│  Real-time enrichment (webhook on form fill)            │
│  Batch enrichment (upload a list, get it back enriched) │
└─────────────────────────────────────────────────────────┘
```

### Key Numbers

| Metric | Approximate Scale |
|--------|-------------------|
| ZoomInfo database | ~300M contacts, 100M+ companies |
| Apollo database | ~200M+ contacts |
| ZoomInfo contributor records/day | ~50M records |
| Email signatures verified/month (ZoomInfo) | ~20M |
| Common email patterns per domain | 10-15 permutations |
| SMTP verification accuracy (non-catch-all) | ~95-98% |
| Catch-all domains (% of B2B) | ~15-20% |
| HLR lookup cost | $0.005-0.02 per lookup |
| Email verification cost | $0.001-0.01 per check |

---

## Legal & Ethical Notes

- **LinkedIn scraping** remains legally contested (hiQ v. LinkedIn went back and forth; CFAA implications vary)
- **GDPR (EU)** requires lawful basis for processing personal data — legitimate interest is commonly claimed but contested
- **CCPA/CPRA (California)** gives consumers right to opt out of sale of personal information
- **Contributor networks** operate in a gray area — users consent to share *their own* contacts, but those contacts never consented
- **Email verification via SMTP** is legal but many servers rate-limit or block it; aggressive verification can get your IPs blacklisted
- **HLR lookups** are legitimate telecom operations but regulated differently per jurisdiction

---

*Research compiled March 2026. Sources include ZoomInfo public documentation, Apollo.io help center, SEC EDGAR documentation, SMTP RFCs, and industry analysis.*
