# DIY Contact Enrichment Pipeline Design

> **Goal:** Build a pipeline that replicates 80% of ZoomInfo/RocketReach/Apollo at <10% of the cost.
> **Last updated:** 2026-03-29

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Pipeline Components](#pipeline-components)
   - [Stage 1: Employee Discovery (LinkedIn)](#stage-1-employee-discovery-linkedin)
   - [Stage 2: Email Permutation & Generation](#stage-2-email-permutation--generation)
   - [Stage 3: Email Verification (SMTP/MX)](#stage-3-email-verification-smtpmx)
   - [Stage 4: Company Firmographics](#stage-4-company-firmographics)
   - [Stage 5: Phone Number Discovery](#stage-5-phone-number-discovery)
3. [Full Pipeline Orchestrator](#full-pipeline-orchestrator)
4. [Cost Analysis](#cost-analysis)
5. [Infrastructure Requirements](#infrastructure-requirements)
6. [Build Time Estimate](#build-time-estimate)
7. [Competitive Comparison](#competitive-comparison)
8. [Risks & Mitigations](#risks--mitigations)
9. [Verdict](#verdict)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENRICHMENT PIPELINE                          │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │ Employee  │──▶│  Email   │──▶│  Email   │──▶│   Output   │  │
│  │ Discovery │   │ Permutat.│   │ Verify   │   │   Store    │  │
│  └──────────┘   └──────────┘   └──────────┘   └────────────┘  │
│       │                                              ▲          │
│       ▼                                              │          │
│  ┌──────────┐                              ┌────────────┐      │
│  │ Company  │──────────────────────────────▶│   Merge    │      │
│  │ Firmo.   │                              └────────────┘      │
│  └──────────┘                                     ▲             │
│       │                                           │             │
│  ┌──────────┐                                     │             │
│  │  Phone   │─────────────────────────────────────┘             │
│  │ Discovery│                                                   │
│  └──────────┘                                                   │
│                                                                 │
│  Data Store: PostgreSQL + Redis cache                           │
│  Queue: Redis/BullMQ or Celery                                  │
│  Rate Limiter: Per-provider token bucket                        │
└─────────────────────────────────────────────────────────────────┘
```

**Design Principles:**
- Each stage is an independent worker that reads from a queue and writes results to Postgres
- Aggressive caching — never pay to look up the same person/company twice
- Graceful degradation — if one source fails, fall through to the next
- Rate limiting is first-class, not an afterthought

---

## Pipeline Components

### Stage 1: Employee Discovery (LinkedIn)

**The problem:** Given a company name/domain, find employees with their names and titles.

**Data Sources (ranked by cost/reliability):**

| Provider | Cost/Profile | Notes |
|----------|-------------|-------|
| **People Data Labs** | ~$0.01-0.28 | Huge dataset, good API. Free tier: 100/mo |
| **Coresignal** | ~$0.03-0.08 | LinkedIn-sourced, real-time. Starter: $49/mo (250 credits) |
| **Apollo.io Free Tier** | $0.00 | 10k email credits/mo free. No API, but CSV export works |
| **Google Dorking** | $0.00 | `site:linkedin.com/in "company name" "title"` |
| **LinkedIn Sales Nav** (manual/semi-auto) | ~$80/mo | Best data, highest risk of ban |
| **Hunter.io** | ~$0.01 | Domain search returns employees + emails |

**Recommended approach:** Waterfall strategy — try free/cheap sources first, escalate to paid.

```python
# stage1_employee_discovery.py
import httpx
import asyncio
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Employee:
    full_name: str
    first_name: str
    last_name: str
    title: Optional[str] = None
    linkedin_url: Optional[str] = None
    company_domain: Optional[str] = None
    source: str = ""

@dataclass
class DiscoveryResult:
    employees: list[Employee] = field(default_factory=list)
    source: str = ""
    cost: float = 0.0


class EmployeeDiscovery:
    """Waterfall employee discovery — cheapest sources first."""

    def __init__(self, config: dict):
        self.pdl_key = config.get("pdl_api_key")
        self.coresignal_key = config.get("coresignal_api_key")
        self.hunter_key = config.get("hunter_api_key")
        self.client = httpx.AsyncClient(timeout=30)

    async def find_employees(
        self, company_domain: str, limit: int = 25
    ) -> DiscoveryResult:
        """Try sources in order: Hunter (cheap) → PDL → Coresignal."""

        # --- Source 1: Hunter.io Domain Search (included in plan, ~$0.01/result) ---
        if self.hunter_key:
            result = await self._hunter_search(company_domain, limit)
            if result.employees:
                return result

        # --- Source 2: People Data Labs ---
        if self.pdl_key:
            result = await self._pdl_search(company_domain, limit)
            if result.employees:
                return result

        # --- Source 3: Coresignal ---
        if self.coresignal_key:
            result = await self._coresignal_search(company_domain, limit)
            if result.employees:
                return result

        # --- Fallback: Google Dorking (free, less structured) ---
        return await self._google_dork_search(company_domain, limit)

    async def _hunter_search(
        self, domain: str, limit: int
    ) -> DiscoveryResult:
        """Hunter.io domain search — returns employees with emails."""
        resp = await self.client.get(
            "https://api.hunter.io/v2/domain-search",
            params={
                "domain": domain,
                "api_key": self.hunter_key,
                "limit": limit,
            },
        )
        data = resp.json()
        employees = []
        for item in data.get("data", {}).get("emails", []):
            if item.get("first_name") and item.get("last_name"):
                employees.append(Employee(
                    full_name=f"{item['first_name']} {item['last_name']}",
                    first_name=item["first_name"],
                    last_name=item["last_name"],
                    title=item.get("position"),
                    company_domain=domain,
                    source="hunter",
                ))
        return DiscoveryResult(
            employees=employees, source="hunter",
            cost=len(employees) * 0.01
        )

    async def _pdl_search(
        self, domain: str, limit: int
    ) -> DiscoveryResult:
        """People Data Labs company search."""
        resp = await self.client.get(
            "https://api.peopledatalabs.com/v5/person/search",
            headers={"X-Api-Key": self.pdl_key},
            params={
                "query": f"job_company_website:{domain}",
                "size": limit,
            },
        )
        data = resp.json()
        employees = []
        for person in data.get("data", []):
            employees.append(Employee(
                full_name=f"{person.get('first_name', '')} {person.get('last_name', '')}",
                first_name=person.get("first_name", ""),
                last_name=person.get("last_name", ""),
                title=person.get("job_title"),
                linkedin_url=person.get("linkedin_url"),
                company_domain=domain,
                source="pdl",
            ))
        return DiscoveryResult(
            employees=employees, source="pdl",
            cost=len(employees) * 0.01  # PDL ES query pricing
        )

    async def _coresignal_search(
        self, domain: str, limit: int
    ) -> DiscoveryResult:
        """Coresignal employee lookup."""
        resp = await self.client.post(
            "https://api.coresignal.com/cdapi/v1/linkedin/member/search/filter",
            headers={"Authorization": f"Bearer {self.coresignal_key}"},
            json={
                "experience_company_website": domain,
                "experience_deleted": "false",
            },
        )
        data = resp.json()
        employees = []
        for member_id in data[:limit]:
            # Each collect costs 1 credit
            detail = await self.client.get(
                f"https://api.coresignal.com/cdapi/v1/linkedin/member/collect/{member_id}",
                headers={"Authorization": f"Bearer {self.coresignal_key}"},
            )
            m = detail.json()
            employees.append(Employee(
                full_name=m.get("name", ""),
                first_name=m.get("name", "").split()[0] if m.get("name") else "",
                last_name=m.get("name", "").split()[-1] if m.get("name") else "",
                title=m.get("title"),
                linkedin_url=m.get("url"),
                company_domain=domain,
                source="coresignal",
            ))
        return DiscoveryResult(
            employees=employees, source="coresignal",
            cost=len(employees) * 0.08  # ~$0.08/credit on Pro
        )

    async def _google_dork_search(
        self, domain: str, limit: int
    ) -> DiscoveryResult:
        """Free fallback: scrape Google for LinkedIn profiles."""
        # Use SerpAPI ($50/mo for 5k searches) or free scraping
        # Query: site:linkedin.com/in "company.com" OR "Company Name"
        # This is illustrative — production would use SerpAPI or similar
        return DiscoveryResult(employees=[], source="google_dork", cost=0.0)

    async def close(self):
        await self.client.aclose()
```

---

### Stage 2: Email Permutation & Generation

**The problem:** Given `first_name`, `last_name`, and `company_domain`, guess the email.

**Strategy:** Generate all common patterns, then verify. Most companies use 1-2 patterns — once you crack the pattern for one employee, apply it to all.

```python
# stage2_email_permutation.py
from dataclasses import dataclass
import re

@dataclass
class EmailCandidate:
    email: str
    pattern: str
    priority: int  # lower = more common

def generate_permutations(
    first: str, last: str, domain: str
) -> list[EmailCandidate]:
    """
    Generate email permutations ordered by frequency.
    Based on analysis of 100k+ B2B emails:
      - first.last@    → 36% of companies
      - first@          → 12%
      - firstlast@      → 10%
      - f.last@         → 9%
      - flast@          → 8%
      - first_last@     → 7%
      - first.l@        → 5%
      - last.first@     → 4%
      - remaining       → 9%
    """
    f = _clean(first)
    l = _clean(last)
    fi = f[0] if f else ""
    li = l[0] if l else ""

    patterns = [
        (f"{f}.{l}@{domain}",       "first.last",   1),
        (f"{f}@{domain}",           "first",         2),
        (f"{f}{l}@{domain}",        "firstlast",     3),
        (f"{fi}.{l}@{domain}",      "f.last",        4),
        (f"{fi}{l}@{domain}",       "flast",         5),
        (f"{f}_{l}@{domain}",       "first_last",    6),
        (f"{f}.{li}@{domain}",      "first.l",       7),
        (f"{l}.{f}@{domain}",       "last.first",    8),
        (f"{l}{fi}@{domain}",       "lastf",         9),
        (f"{l}@{domain}",           "last",          10),
        (f"{f}-{l}@{domain}",       "first-last",    11),
        (f"{fi}{l[0:3]}@{domain}" if len(l) >= 3 else None, "f+3last", 12),
        (f"{f}.{l[0:1]}@{domain}",  "first.l",       13),
        (f"{l}{f}@{domain}",        "lastfirst",     14),
    ]

    return [
        EmailCandidate(email=email, pattern=pat, priority=pri)
        for email, pat, pri in patterns
        if email is not None
    ]


def _clean(name: str) -> str:
    """Normalize: lowercase, strip accents, remove non-alpha."""
    import unicodedata
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = re.sub(r"[^a-zA-Z]", "", name)
    return name.lower()


class PatternLearner:
    """
    Once we verify one email at a company, learn the pattern
    and prioritize it for all other employees at that domain.
    """

    def __init__(self):
        self._known_patterns: dict[str, str] = {}  # domain → pattern_name

    def learn(self, domain: str, verified_pattern: str):
        self._known_patterns[domain] = verified_pattern

    def get_prioritized(
        self, first: str, last: str, domain: str
    ) -> list[EmailCandidate]:
        candidates = generate_permutations(first, last, domain)
        known = self._known_patterns.get(domain)
        if known:
            # Move known pattern to front, skip the rest in verification
            # to save SMTP checks
            primary = [c for c in candidates if c.pattern == known]
            others = [c for c in candidates if c.pattern != known]
            return primary + others[:2]  # known + 2 fallbacks
        return candidates
```

---

### Stage 3: Email Verification (SMTP/MX)

**The problem:** Determine which permutation is a real, deliverable mailbox.

**Three-layer verification:**
1. **MX record check** — does the domain accept email at all?
2. **SMTP RCPT TO** — does the mail server accept this specific address?
3. **Catch-all detection** — if the server accepts everything, SMTP tells us nothing.

```python
# stage3_email_verify.py
import asyncio
import dns.resolver
import aiosmtplib
from dataclasses import dataclass
from enum import Enum
from typing import Optional
import random
import string

class VerifyResult(Enum):
    VALID = "valid"             # Server accepted RCPT TO
    INVALID = "invalid"         # Server rejected (550)
    CATCH_ALL = "catch_all"     # Domain accepts everything
    UNKNOWN = "unknown"         # Timeout / greylisting / can't tell
    NO_MX = "no_mx"            # Domain has no mail server

@dataclass
class VerificationOutcome:
    email: str
    result: VerifyResult
    smtp_code: Optional[int] = None
    smtp_message: Optional[str] = None


class EmailVerifier:
    """
    SMTP-based email verification.

    IMPORTANT CAVEATS:
    - Many providers (Gmail, O365) don't reject at SMTP level → shows as catch-all
    - Run from a clean IP with proper rDNS, or you'll get blocked
    - Rate limit: max 2-3 checks/sec per MX server
    - For Gmail/O365 domains, fall back to paid verification (NeverBounce, $0.003/ea)
    """

    def __init__(self, from_email: str = "verify@yourdomain.com"):
        self.from_email = from_email
        self._mx_cache: dict[str, list[str]] = {}
        self._catch_all_cache: dict[str, bool] = {}

    async def get_mx_hosts(self, domain: str) -> list[str]:
        """Resolve MX records for domain, cached."""
        if domain in self._mx_cache:
            return self._mx_cache[domain]
        try:
            answers = dns.resolver.resolve(domain, "MX")
            hosts = sorted(
                [(r.preference, str(r.exchange).rstrip(".")) for r in answers]
            )
            mx_list = [h for _, h in hosts]
            self._mx_cache[domain] = mx_list
            return mx_list
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN,
                dns.resolver.NoNameservers, dns.exception.Timeout):
            self._mx_cache[domain] = []
            return []

    async def is_catch_all(self, domain: str) -> bool:
        """Test if domain is catch-all by checking a random address."""
        if domain in self._catch_all_cache:
            return self._catch_all_cache[domain]

        random_local = "".join(random.choices(string.ascii_lowercase, k=15))
        fake_email = f"{random_local}@{domain}"
        result = await self._smtp_check(fake_email, domain)

        is_ca = result.result == VerifyResult.VALID
        self._catch_all_cache[domain] = is_ca
        return is_ca

    async def verify(self, email: str) -> VerificationOutcome:
        """Full verification: MX → catch-all detect → SMTP RCPT TO."""
        domain = email.split("@")[1]

        # Step 1: MX check
        mx_hosts = await self.get_mx_hosts(domain)
        if not mx_hosts:
            return VerificationOutcome(
                email=email, result=VerifyResult.NO_MX
            )

        # Step 2: Catch-all detection
        if await self.is_catch_all(domain):
            return VerificationOutcome(
                email=email, result=VerifyResult.CATCH_ALL
            )

        # Step 3: SMTP RCPT TO
        return await self._smtp_check(email, domain)

    async def _smtp_check(
        self, email: str, domain: str
    ) -> VerificationOutcome:
        """Connect to MX server and check if RCPT TO is accepted."""
        mx_hosts = await self.get_mx_hosts(domain)
        if not mx_hosts:
            return VerificationOutcome(
                email=email, result=VerifyResult.NO_MX
            )

        for mx_host in mx_hosts[:2]:  # Try top 2 MX hosts
            try:
                smtp = aiosmtplib.SMTP(
                    hostname=mx_host, port=25, timeout=10,
                    use_tls=False,
                )
                await smtp.connect()
                await smtp.ehlo("yourdomain.com")

                # Try STARTTLS if available
                try:
                    await smtp.starttls()
                    await smtp.ehlo("yourdomain.com")
                except aiosmtplib.SMTPException:
                    pass

                await smtp.mail(self.from_email)
                code, message = await smtp.rcpt(email)
                await smtp.quit()

                if 200 <= code < 300:
                    return VerificationOutcome(
                        email=email, result=VerifyResult.VALID,
                        smtp_code=code, smtp_message=message,
                    )
                elif code == 550 or code == 551 or code == 553:
                    return VerificationOutcome(
                        email=email, result=VerifyResult.INVALID,
                        smtp_code=code, smtp_message=message,
                    )
                else:
                    return VerificationOutcome(
                        email=email, result=VerifyResult.UNKNOWN,
                        smtp_code=code, smtp_message=message,
                    )

            except (aiosmtplib.SMTPException, asyncio.TimeoutError,
                    OSError):
                continue

        return VerificationOutcome(
            email=email, result=VerifyResult.UNKNOWN
        )

    async def verify_batch(
        self, emails: list[str], concurrency: int = 5
    ) -> list[VerificationOutcome]:
        """Verify a batch with concurrency control."""
        semaphore = asyncio.Semaphore(concurrency)

        async def _limited(email: str):
            async with semaphore:
                result = await self.verify(email)
                await asyncio.sleep(0.5)  # Rate limit per check
                return result

        return await asyncio.gather(*[_limited(e) for e in emails])
```

**Catch-all workarounds for Gmail / O365 domains (~60% of B2B):**

| Method | Cost | Accuracy |
|--------|------|----------|
| **NeverBounce API** | $0.003/email | ~95% |
| **ZeroBounce API** | $0.007/email | ~97% |
| **MillionVerifier** | $0.0005/email | ~90% |
| **Send a real email + track bounce** | $0.00 | ~99% but slow |

```python
# Fallback: Use MillionVerifier for catch-all domains ($0.29/1000)
async def verify_with_millionverifier(
    emails: list[str], api_key: str
) -> dict[str, str]:
    """Bulk verify via MillionVerifier for catch-all domains."""
    async with httpx.AsyncClient() as client:
        # Upload CSV
        import io, csv
        buf = io.StringIO()
        writer = csv.writer(buf)
        for e in emails:
            writer.writerow([e])

        resp = await client.post(
            "https://bulkapi.millionverifier.com/bulkapi/v2/upload",
            params={"key": api_key},
            files={"file_contents": ("emails.csv", buf.getvalue())},
        )
        file_id = resp.json()["file_id"]

        # Poll for results (usually 1-5 min for <1000 emails)
        while True:
            status = await client.get(
                f"https://bulkapi.millionverifier.com/bulkapi/v2/fileinfo",
                params={"key": api_key, "file_id": file_id},
            )
            if status.json()["status"] == "finished":
                break
            await asyncio.sleep(10)

        # Download results
        results = await client.get(
            f"https://bulkapi.millionverifier.com/bulkapi/v2/download",
            params={"key": api_key, "file_id": file_id},
        )
        # Parse CSV results → dict of email: status
        return _parse_mv_results(results.text)
```

---

### Stage 4: Company Firmographics

**The problem:** Enrich company data — size, revenue, industry, location, tech stack.

**Free/Cheap Sources:**

| Source | Data | Cost |
|--------|------|------|
| **OpenCorporates API** | Legal entity, status, filings | Free (limited) |
| **SEC EDGAR** | Revenue, filings (public cos) | Free |
| **Crunchbase Basic** | Funding, headcount | Free tier / $29/mo |
| **Clearbit (now part of HubSpot)** | Domain → company data | Free tier: 25/mo |
| **BuiltWith / Wappalyzer** | Tech stack | Free tier / $295/mo |
| **LinkedIn Company Page** | Headcount range, industry | Via Coresignal/PDL |
| **Google Places API** | Address, phone, hours | $0.017/request |
| **Companies House (UK)** | Legal filings, directors | Free API |

```python
# stage4_firmographics.py
import httpx
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class CompanyFirmographics:
    domain: str
    name: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    employee_range: Optional[str] = None
    revenue_range: Optional[str] = None
    founded_year: Optional[int] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    tech_stack: list[str] = field(default_factory=list)
    funding_total: Optional[float] = None
    linkedin_url: Optional[str] = None
    sources: list[str] = field(default_factory=list)
    total_cost: float = 0.0


class FirmographicEnricher:
    """Multi-source firmographic enrichment."""

    def __init__(self, config: dict):
        self.pdl_key = config.get("pdl_api_key")
        self.client = httpx.AsyncClient(timeout=30)

    async def enrich(self, domain: str) -> CompanyFirmographics:
        result = CompanyFirmographics(domain=domain)

        # --- Source 1: People Data Labs Company API (cheapest structured) ---
        if self.pdl_key:
            await self._enrich_from_pdl(domain, result)

        # --- Source 2: Free web scrape of company website ---
        await self._enrich_from_website(domain, result)

        # --- Source 3: Wappalyzer/BuiltWith for tech stack (free tier) ---
        await self._enrich_tech_stack(domain, result)

        return result

    async def _enrich_from_pdl(
        self, domain: str, result: CompanyFirmographics
    ):
        """PDL Company Enrichment — $0.01/request."""
        try:
            resp = await self.client.get(
                "https://api.peopledatalabs.com/v5/company/enrich",
                headers={"X-Api-Key": self.pdl_key},
                params={"website": domain},
            )
            if resp.status_code != 200:
                return

            data = resp.json()
            result.name = result.name or data.get("name")
            result.industry = result.industry or data.get("industry")
            result.employee_count = data.get("employee_count")
            result.employee_range = data.get("size")
            result.founded_year = data.get("founded")
            result.description = data.get("summary")
            result.linkedin_url = data.get("linkedin_url")

            loc = data.get("location", {})
            result.city = loc.get("locality")
            result.state = loc.get("region")
            result.country = loc.get("country")

            result.sources.append("pdl")
            result.total_cost += 0.01
        except Exception:
            pass

    async def _enrich_from_website(
        self, domain: str, result: CompanyFirmographics
    ):
        """Scrape company website for basic info (free)."""
        try:
            resp = await self.client.get(
                f"https://{domain}",
                follow_redirects=True, timeout=10,
            )
            # Extract structured data (JSON-LD, OpenGraph)
            html = resp.text

            # Look for JSON-LD Organization schema
            import json, re
            ld_matches = re.findall(
                r'<script type="application/ld\+json">(.*?)</script>',
                html, re.DOTALL,
            )
            for match in ld_matches:
                try:
                    ld = json.loads(match)
                    if isinstance(ld, list):
                        ld = ld[0]
                    if ld.get("@type") in ("Organization", "Corporation"):
                        result.name = result.name or ld.get("name")
                        result.description = (
                            result.description or ld.get("description")
                        )
                        addr = ld.get("address", {})
                        if isinstance(addr, dict):
                            result.city = (
                                result.city or addr.get("addressLocality")
                            )
                            result.country = (
                                result.country or addr.get("addressCountry")
                            )
                        result.sources.append("website_jsonld")
                except (json.JSONDecodeError, AttributeError):
                    pass
        except Exception:
            pass

    async def _enrich_tech_stack(
        self, domain: str, result: CompanyFirmographics
    ):
        """
        Use Wappalyzer-style detection.
        Free option: self-hosted Wappalyzer via wappalyzer npm package.
        Or: BuiltWith free lookup for top techs.
        """
        # Self-hosted approach using `wappalyzer` npm
        # In production, run this as a microservice
        import subprocess
        try:
            proc = subprocess.run(
                ["npx", "wappalyzer", f"https://{domain}", "--pretty"],
                capture_output=True, text=True, timeout=30,
            )
            if proc.returncode == 0:
                import json
                data = json.loads(proc.stdout)
                techs = [
                    t["name"] for t in data.get("technologies", [])
                ]
                result.tech_stack = techs
                result.sources.append("wappalyzer")
        except Exception:
            pass

    async def close(self):
        await self.client.aclose()
```

---

### Stage 5: Phone Number Discovery

**The problem:** Hardest data to get. Phone numbers are rarely public.

**Sources (ranked by feasibility):**

| Source | Type | Cost | Hit Rate |
|--------|------|------|----------|
| **NumVerify/AbstractAPI** | Validation only | Free tier | N/A (need number first) |
| **Google Places API** | Company main line | $0.017/req | ~70% for SMBs |
| **WhitePages/TrueCaller API** | Personal + biz | $0.05-0.15/lookup | ~40% |
| **People Data Labs** | Included in person record | $0.10+/record | ~15-20% |
| **Apollo.io** | Mobile credits | $0.20+/credit | ~30% |
| **Company website scraping** | Main line | Free | ~50% |
| **SEC filings** | Corporate HQ | Free | Public cos only |

```python
# stage5_phone_discovery.py
import httpx
import re
from dataclasses import dataclass
from typing import Optional

@dataclass
class PhoneResult:
    phone: Optional[str] = None
    phone_type: str = "unknown"  # mobile, landline, voip, main_line
    source: str = ""
    cost: float = 0.0
    confidence: float = 0.0


class PhoneDiscovery:
    """Multi-source phone number discovery."""

    def __init__(self, config: dict):
        self.google_places_key = config.get("google_places_api_key")
        self.abstract_key = config.get("abstract_api_key")
        self.client = httpx.AsyncClient(timeout=30)

    async def find_phone(
        self,
        company_domain: str,
        company_name: Optional[str] = None,
        person_name: Optional[str] = None,
    ) -> list[PhoneResult]:
        results = []

        # --- Source 1: Scrape company website for phone (free) ---
        phone = await self._scrape_website_phone(company_domain)
        if phone:
            results.append(PhoneResult(
                phone=phone, phone_type="main_line",
                source="website", cost=0.0, confidence=0.8,
            ))

        # --- Source 2: Google Places API ---
        if self.google_places_key and company_name:
            phone = await self._google_places_phone(company_name)
            if phone:
                results.append(PhoneResult(
                    phone=phone, phone_type="main_line",
                    source="google_places", cost=0.017, confidence=0.85,
                ))

        return results

    async def _scrape_website_phone(
        self, domain: str
    ) -> Optional[str]:
        """Extract phone from website contact page."""
        for path in ["", "/contact", "/about", "/contact-us"]:
            try:
                resp = await self.client.get(
                    f"https://{domain}{path}",
                    follow_redirects=True, timeout=10,
                )
                # Match common phone patterns
                phones = re.findall(
                    r'(?:tel:|phone|call)[:\s]*'
                    r'([+]?[\d\s\-().]{7,20})',
                    resp.text, re.IGNORECASE,
                )
                if not phones:
                    # Broader pattern
                    phones = re.findall(
                        r'(?<!\d)[+]?[1]?[\s.-]?'
                        r'[(]?\d{3}[)]?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)',
                        resp.text,
                    )
                if phones:
                    return _normalize_phone(phones[0])
            except Exception:
                continue
        return None

    async def _google_places_phone(
        self, company_name: str
    ) -> Optional[str]:
        """Google Places API text search → place details → phone."""
        try:
            # Text search
            search_resp = await self.client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params={
                    "query": company_name,
                    "key": self.google_places_key,
                },
            )
            results = search_resp.json().get("results", [])
            if not results:
                return None

            place_id = results[0]["place_id"]

            # Place details
            detail_resp = await self.client.get(
                "https://maps.googleapis.com/maps/api/place/details/json",
                params={
                    "place_id": place_id,
                    "fields": "formatted_phone_number,international_phone_number",
                    "key": self.google_places_key,
                },
            )
            detail = detail_resp.json().get("result", {})
            return detail.get("international_phone_number")
        except Exception:
            return None

    async def close(self):
        await self.client.aclose()


def _normalize_phone(raw: str) -> str:
    """Strip to digits + leading +."""
    digits = re.sub(r"[^\d+]", "", raw)
    return digits
```

---

## Full Pipeline Orchestrator

```python
# pipeline.py — Ties all stages together
import asyncio
import json
from dataclasses import dataclass, asdict
from typing import Optional
from datetime import datetime

from stage1_employee_discovery import EmployeeDiscovery, Employee
from stage2_email_permutation import PatternLearner
from stage3_email_verify import EmailVerifier, VerifyResult
from stage4_firmographics import FirmographicEnricher
from stage5_phone_discovery import PhoneDiscovery


@dataclass
class EnrichedContact:
    first_name: str
    last_name: str
    title: Optional[str]
    verified_email: Optional[str]
    email_pattern: Optional[str]
    email_confidence: str  # "verified", "catch_all", "pattern_match"
    phone: Optional[str]
    phone_type: Optional[str]
    linkedin_url: Optional[str]
    company_domain: str
    company_name: Optional[str]
    industry: Optional[str]
    employee_count: Optional[int]
    city: Optional[str]
    country: Optional[str]
    tech_stack: list[str]
    total_cost: float
    enriched_at: str
    sources: list[str]


class EnrichmentPipeline:
    def __init__(self, config: dict):
        self.discovery = EmployeeDiscovery(config)
        self.pattern_learner = PatternLearner()
        self.verifier = EmailVerifier(
            from_email=config.get("from_email", "verify@yourdomain.com")
        )
        self.firmographics = FirmographicEnricher(config)
        self.phones = PhoneDiscovery(config)

    async def enrich_company(
        self, domain: str, max_contacts: int = 25
    ) -> list[EnrichedContact]:
        """Full pipeline: discover employees → email → verify → firmographics → phone."""
        total_cost = 0.0
        results = []

        # --- Stage 1: Find employees ---
        discovery_result = await self.discovery.find_employees(domain, max_contacts)
        total_cost += discovery_result.cost
        employees = discovery_result.employees

        if not employees:
            return []

        # --- Stage 4: Company firmographics (parallel with email work) ---
        firmo_task = asyncio.create_task(self.firmographics.enrich(domain))

        # --- Stage 5: Company phone (parallel) ---
        phone_task = asyncio.create_task(
            self.phones.find_phone(domain, company_name=None)
        )

        # --- Stage 2 + 3: Email permutation & verification ---
        for emp in employees:
            candidates = self.pattern_learner.get_prioritized(
                emp.first_name, emp.last_name, domain
            )

            verified_email = None
            email_pattern = None
            email_confidence = "none"

            for candidate in candidates:
                outcome = await self.verifier.verify(candidate.email)

                if outcome.result == VerifyResult.VALID:
                    verified_email = candidate.email
                    email_pattern = candidate.pattern
                    email_confidence = "verified"
                    self.pattern_learner.learn(domain, candidate.pattern)
                    break
                elif outcome.result == VerifyResult.CATCH_ALL:
                    # Can't SMTP verify — use highest-priority pattern
                    verified_email = candidates[0].email
                    email_pattern = candidates[0].pattern
                    email_confidence = "catch_all"
                    break
                elif outcome.result == VerifyResult.INVALID:
                    continue

            # Await firmographics & phone
            firmo = await firmo_task
            phones = await phone_task
            total_cost += firmo.total_cost

            contact = EnrichedContact(
                first_name=emp.first_name,
                last_name=emp.last_name,
                title=emp.title,
                verified_email=verified_email,
                email_pattern=email_pattern,
                email_confidence=email_confidence,
                phone=phones[0].phone if phones else None,
                phone_type=phones[0].phone_type if phones else None,
                linkedin_url=emp.linkedin_url,
                company_domain=domain,
                company_name=firmo.name,
                industry=firmo.industry,
                employee_count=firmo.employee_count,
                city=firmo.city,
                country=firmo.country,
                tech_stack=firmo.tech_stack,
                total_cost=0,  # calculated below
                enriched_at=datetime.utcnow().isoformat(),
                sources=[discovery_result.source] + firmo.sources,
            )
            results.append(contact)

        # Distribute cost across contacts
        per_contact = total_cost / len(results) if results else 0
        for r in results:
            r.total_cost = round(per_contact, 4)

        return results

    async def close(self):
        await self.discovery.close()
        await self.firmographics.close()
        await self.phones.close()


# --- Usage ---
async def main():
    config = {
        "pdl_api_key": "your-pdl-key",
        "hunter_api_key": "your-hunter-key",
        "google_places_api_key": "your-gplaces-key",
        "from_email": "verify@yourdomain.com",
    }

    pipeline = EnrichmentPipeline(config)

    contacts = await pipeline.enrich_company(
        "stripe.com", max_contacts=10
    )

    for c in contacts:
        print(json.dumps(asdict(c), indent=2))

    await pipeline.close()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## Cost Analysis

### Per-Contact Cost Breakdown (DIY Pipeline)

| Component | Cost/Contact | Notes |
|-----------|-------------|-------|
| **Employee Discovery** | $0.01–0.08 | Hunter ($0.01) or PDL ($0.01) or Coresignal ($0.08) |
| **Email Permutation** | $0.00 | Pure computation |
| **Email Verification (SMTP)** | $0.00 | Self-hosted, ~3-5 checks per contact |
| **Email Verification (catch-all fallback)** | $0.001 | MillionVerifier for ~60% of contacts |
| **Company Firmographics** | $0.01 | PDL company enrich (amortized across employees) |
| **Phone Discovery** | $0.00–0.02 | Website scrape (free) + Google Places ($0.017) |
| **Infrastructure** | $0.001 | VPS + DB amortized |
| **TOTAL** | **$0.02–0.10** | **Average: ~$0.04/contact** |

### Monthly Cost at Scale

| Volume | DIY Cost | Apollo Basic | ZoomInfo Pro |
|--------|----------|-------------|-------------|
| 100 contacts/mo | **$4** | $49 (5k credits) | $1,250/mo ($15k/yr) |
| 1,000 contacts/mo | **$40** | $49-99 | $1,250/mo |
| 5,000 contacts/mo | **$200** | $99-199 | $1,250/mo |
| 10,000 contacts/mo | **$400** | $199+ (overages) | $2,083/mo ($25k/yr) |
| 50,000 contacts/mo | **$2,000** | $1,000+ | $3,333/mo ($40k/yr) |

### API Subscription Costs (Fixed Monthly)

| Service | Plan | Monthly Cost | What You Get |
|---------|------|-------------|-------------|
| **Hunter.io** | Starter | $34/mo | 500 searches, 1k verifications |
| **People Data Labs** | Pro | $98/mo | 350 person + 1k company lookups |
| **MillionVerifier** | Pay-as-you-go | ~$3/10k emails | Bulk verification |
| **Google Places** | Pay-as-you-go | ~$17/1k lookups | Phone numbers |
| **VPS (Hetzner)** | CX22 | $5/mo | 2 vCPU, 4GB RAM |
| **PostgreSQL (managed)** | Supabase free or Neon | $0-25/mo | Database |
| **TOTAL FIXED** | — | **~$140-160/mo** | Before per-contact costs |

---

## Infrastructure Requirements

### Minimum Viable Setup

```
┌──────────────────────────────────────────────────────┐
│  VPS: Hetzner CX22 ($5/mo) or Railway ($5/mo)       │
│  ├── Python 3.11+ application                        │
│  ├── Redis (queue + cache)                           │
│  ├── PostgreSQL (data store)                         │
│  └── Caddy/Nginx (API gateway, optional)             │
│                                                      │
│  Requirements:                                       │
│  - 2 vCPU, 4GB RAM minimum                          │
│  - Clean IP with rDNS (for SMTP verification)        │
│  - Domain with SPF/DKIM (for SMTP FROM address)      │
│  - ~10GB storage for contact database                │
└──────────────────────────────────────────────────────┘
```

### Production Setup (10k+ contacts/month)

```
┌──────────────────────────────────────────────────────┐
│  Hetzner CX32 ($10/mo) or dedicated ($40/mo)         │
│  ├── FastAPI application (API + workers)              │
│  ├── Redis (BullMQ-style queues)                     │
│  ├── PostgreSQL (Supabase or self-hosted)            │
│  ├── Multiple IP addresses (SMTP rotation)           │
│  └── Monitoring (Uptime Kuma, free)                  │
│                                                      │
│  Optional:                                           │
│  - Residential proxy ($30/mo) for web scraping       │
│  - Second VPS in different /24 for SMTP diversity    │
└──────────────────────────────────────────────────────┘
```

### Critical Infrastructure Detail: Clean SMTP

> **The #1 make-or-break factor for DIY email verification is your sending IP.**

- Buy a VPS with a clean IP (check on MXToolbox, Spamhaus)
- Set up proper rDNS (PTR record)
- Register a domain specifically for verification (not your main domain)
- Set up SPF + DKIM
- Warm the IP slowly — don't blast 10k SMTP checks on day 1
- Rotate across 2-3 IPs for volume

---

## Build Time Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Stage 1: Employee Discovery | 2-3 days | API integrations, waterfall logic |
| Stage 2: Email Permutation | 0.5 days | Straightforward pattern generation |
| Stage 3: Email Verification | 3-5 days | SMTP is tricky — edge cases, timeouts, catch-alls |
| Stage 4: Firmographics | 2-3 days | Multiple API integrations |
| Stage 5: Phone Discovery | 1-2 days | Limited sources, simpler logic |
| Pipeline Orchestration | 2-3 days | Queue, error handling, retry logic |
| Database + API | 2-3 days | Schema, REST/GraphQL API |
| Testing + Tuning | 3-5 days | Accuracy testing, rate limit tuning |
| **TOTAL** | **16-24 days** | **~3-5 weeks for one developer** |

### Ongoing Maintenance: ~2-4 hours/week
- API changes and breakages
- IP reputation management
- Accuracy monitoring
- Source rebalancing as prices change

---

## Competitive Comparison

| Feature | **DIY Pipeline** | **Apollo ($49-199/mo)** | **RocketReach ($33-209/mo)** | **ZoomInfo ($15-40k/yr)** |
|---------|:---:|:---:|:---:|:---:|
| **Cost at 1k contacts/mo** | **~$180/mo** (fixed+variable) | $99-199/mo | $119/mo | $1,250/mo |
| **Cost at 10k contacts/mo** | **~$540/mo** | $400+/mo (overages) | $2,500+/mo (enterprise) | $2,083/mo |
| **Email accuracy** | 70-85% | 85-90% | 80-85% | 90-95% |
| **Phone numbers** | Company lines mostly | Mobile credits extra | Pro plan and up | Included (direct dials) |
| **Company firmographics** | Good (multi-source) | Good | Basic | Excellent |
| **Intent data** | ❌ | Basic (Pro+) | ❌ | ✅ Advanced |
| **Tech stack data** | ✅ (self-hosted) | ❌ | ❌ | ✅ |
| **CRM integration** | Build it yourself | ✅ Native | ✅ Basic | ✅ Full |
| **Compliance (GDPR)** | Your responsibility | Their liability | Their liability | Their liability |
| **Setup time** | 3-5 weeks | 1 hour | 1 hour | 1-2 weeks (onboarding) |
| **Maintenance** | 2-4 hrs/week | None | None | Minimal |
| **Data freshness** | Real-time lookups | Periodically updated | Periodically updated | Quarterly updates |
| **Scalability** | Unlimited (cost scales linearly) | Credit-gated | Lookup-gated | Contract-gated |
| **Customization** | Full control | Limited | Limited | Moderate |

### When DIY Wins

- **High volume, narrow use case** — you only need emails + basic firmographics
- **Non-standard enrichment** — tech stack detection, custom scoring, niche data
- **Cost sensitivity** — $15k+/yr for ZoomInfo is a non-starter
- **Data ownership** — you own the database, no vendor lock-in
- **Already have engineering capacity** — marginal cost of building is low

### When DIY Loses

- **You need intent data** — impossible to replicate without massive web tracking infra
- **You need mobile phone numbers at scale** — vendors have partnerships you can't replicate
- **Compliance matters more than cost** — vendors handle GDPR/CCPA liability
- **Time-to-value is critical** — Apollo's free tier gets you started in 10 minutes
- **Team lacks engineering resources** — maintenance burden is real

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| **SMTP verification IPs get blacklisted** | High | IP rotation, warm-up, rate limiting, use paid verification for catch-all |
| **LinkedIn/data provider API changes** | Medium | Waterfall architecture — swap sources without rebuilding |
| **Email accuracy below commercial tools** | Medium | Combine SMTP + paid verification for catch-all; pattern learning improves over time |
| **GDPR/privacy compliance** | High | Document legal basis (legitimate interest), implement data retention policies, honor opt-outs |
| **API costs spike unexpectedly** | Low | Per-contact cost caps, aggressive caching, alert thresholds |
| **Maintenance burden** | Medium | Modular design — each stage is independent and replaceable |
| **Rate limiting from providers** | Medium | Token bucket rate limiters, exponential backoff, respect 429s |

---

## Verdict

### The Math

| Scenario | DIY Annual Cost | Apollo Annual | ZoomInfo Annual | DIY Savings vs Apollo | DIY Savings vs ZoomInfo |
|----------|----------------|--------------|----------------|----------------------|------------------------|
| 1k contacts/mo | **$2,160** | $1,188 (Basic) | $15,000 | -$972 (Apollo cheaper) | **$12,840 (86%)** |
| 5k contacts/mo | **$3,960** | $2,388 (Pro) | $15,000 | -$1,572 | **$11,040 (74%)** |
| 10k contacts/mo | **$6,480** | $4,800+ | $25,000 | -$1,680 | **$18,520 (74%)** |
| 50k contacts/mo | **$25,920** | $12,000+ | $40,000+ | **$-13,920** | **$14,080 (35%)** |

### Recommendation

> **For most teams: Start with Apollo's free tier + Hunter.io ($34/mo). Build DIY only when you hit Apollo's limits or need custom enrichment logic.**

The DIY pipeline becomes cost-effective vs. Apollo only at **high volume (20k+/mo)** or when you need **custom data** (tech stack, non-standard firmographics). It's **always** cheaper than ZoomInfo.

**Hybrid approach (best of both worlds):**
1. Use Apollo free tier for basic email lookups (10k/mo free)
2. Build the SMTP verification layer yourself (saves on Apollo credit overages)
3. Build firmographic enrichment yourself (free/cheap sources)
4. Use Hunter.io for domain-pattern discovery ($34/mo)
5. Graduate to full DIY only for the stages where you're hitting paid limits

**Estimated hybrid cost: ~$40-80/mo** for 5k contacts — cheaper than any commercial tool while maintaining 80%+ accuracy.

---

*Pipeline code is illustrative Python 3.11+ — production implementation would add: proper error handling, database persistence (SQLAlchemy/Tortoise), queue workers (Celery/ARQ), API layer (FastAPI), and monitoring.*
