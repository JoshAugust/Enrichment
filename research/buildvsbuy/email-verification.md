# Email Verification & Deliverability — Deep Dive

> Last updated: 2026-03-29

---

## Table of Contents

1. [How SMTP Verification Works Technically](#1-how-smtp-verification-works-technically)
2. [Catch-All Domain Detection](#2-catch-all-domain-detection)
3. [Best Open-Source Email Verification Libraries](#3-best-open-source-email-verification-libraries)
4. [Commercial API Pricing Comparison](#4-commercial-api-pricing-comparison)
5. [Bounce Rate Thresholds & Blacklisting](#5-bounce-rate-thresholds--blacklisting)
6. [Warm-Up Strategies for New Sending Domains](#6-warm-up-strategies-for-new-sending-domains)
7. [Cold Email Infrastructure](#7-cold-email-infrastructure)

---

## 1. How SMTP Verification Works Technically

SMTP verification simulates sending an email **without actually delivering it**. The process validates whether a mailbox exists by walking through the SMTP handshake up to the `RCPT TO` step, then disconnecting.

### The 4-Step Process

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────────┐
│  1. DNS MX       │────▶│ 2. TCP Connect│────▶│ 3. SMTP         │────▶│ 4. Response    │
│     Lookup       │     │    Port 25    │     │    Handshake    │     │    Analysis    │
└─────────────────┘     └──────────────┘     └─────────────────┘     └────────────────┘
```

#### Step 1: DNS MX Lookup

Query DNS for the domain's MX (Mail Exchanger) records. If no MX records exist, fall back to A/AAAA records per RFC 5321.

```python
import dns.resolver

def get_mx_hosts(domain: str) -> list[str]:
    """Return MX hosts sorted by priority (lowest first)."""
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        return [str(r.exchange).rstrip('.') for r in sorted(answers, key=lambda r: r.preference)]
    except dns.resolver.NoAnswer:
        # Fallback: use A record
        answers = dns.resolver.resolve(domain, 'A')
        return [str(r) for r in answers]
    except dns.resolver.NXDOMAIN:
        return []  # Domain doesn't exist
```

#### Step 2: TCP Connect (Port 25)

Open a raw TCP connection to the highest-priority MX server on port 25 (SMTP).

#### Step 3: SMTP Handshake

Execute the SMTP command sequence — crucially **stopping before DATA**:

```
S: 220 mx.example.com ESMTP ready
C: EHLO verify.yourdomain.com
S: 250-mx.example.com Hello
C: MAIL FROM:<verify@yourdomain.com>
S: 250 OK
C: RCPT TO:<target@example.com>       ← THIS is the verification step
S: 250 OK                              ← Address accepted (exists)
   OR
S: 550 User unknown                    ← Address rejected (doesn't exist)
C: QUIT
```

#### Step 4: Response Code Analysis

| Code | Meaning | Verdict |
|------|---------|---------|
| `250` | Recipient OK | ✅ Valid (probably) |
| `251` | User not local, will forward | ✅ Valid |
| `450` | Mailbox busy / greylisting | ⚠️ Retry later |
| `451` | Local error in processing | ⚠️ Temporary failure |
| `452` | Insufficient storage | ⚠️ Temporary failure |
| `550` | Mailbox not found | ❌ Invalid |
| `551` | User not local | ❌ Invalid |
| `552` | Exceeded storage | ⚠️ Mailbox full |
| `553` | Mailbox name not allowed | ❌ Invalid |

### Full Python Implementation

```python
import socket
import dns.resolver
from dataclasses import dataclass
from enum import Enum

class VerifyResult(Enum):
    VALID = "valid"
    INVALID = "invalid"
    CATCH_ALL = "catch_all"
    UNKNOWN = "unknown"
    ERROR = "error"

@dataclass
class VerificationResponse:
    email: str
    result: VerifyResult
    smtp_code: int | None = None
    smtp_message: str = ""
    mx_host: str = ""

def smtp_verify(email: str, timeout: int = 10, helo_host: str = "verify.example.com") -> VerificationResponse:
    """
    Verify an email address via SMTP RCPT TO check.
    Does NOT send an actual email.
    """
    local, domain = email.rsplit("@", 1)

    # Step 1: MX Lookup
    try:
        mx_records = dns.resolver.resolve(domain, "MX")
        mx_hosts = sorted(mx_records, key=lambda r: r.preference)
        mx_host = str(mx_hosts[0].exchange).rstrip(".")
    except Exception:
        return VerificationResponse(email=email, result=VerifyResult.ERROR, smtp_message="No MX records")

    # Step 2-3: SMTP Handshake
    try:
        sock = socket.create_connection((mx_host, 25), timeout=timeout)
        response = sock.recv(1024).decode()

        # EHLO
        sock.sendall(f"EHLO {helo_host}\r\n".encode())
        response = sock.recv(1024).decode()

        # MAIL FROM
        sock.sendall(b"MAIL FROM:<verify@example.com>\r\n")
        response = sock.recv(1024).decode()

        # RCPT TO — the actual verification
        sock.sendall(f"RCPT TO:<{email}>\r\n".encode())
        response = sock.recv(1024).decode()
        code = int(response[:3])

        # QUIT
        sock.sendall(b"QUIT\r\n")
        sock.close()

        # Step 4: Interpret response
        if code == 250:
            return VerificationResponse(
                email=email, result=VerifyResult.VALID,
                smtp_code=code, smtp_message=response.strip(), mx_host=mx_host
            )
        elif code >= 550:
            return VerificationResponse(
                email=email, result=VerifyResult.INVALID,
                smtp_code=code, smtp_message=response.strip(), mx_host=mx_host
            )
        else:
            return VerificationResponse(
                email=email, result=VerifyResult.UNKNOWN,
                smtp_code=code, smtp_message=response.strip(), mx_host=mx_host
            )
    except Exception as e:
        return VerificationResponse(email=email, result=VerifyResult.ERROR, smtp_message=str(e))
```

### Known Limitations

| Provider | Behavior | Impact |
|----------|----------|--------|
| **Gmail** | Accepts all `RCPT TO` at SMTP stage; defers validation | Cannot verify individual Gmail addresses via SMTP |
| **Microsoft 365** | Varies by tenant config; often accepts all | Unreliable for Outlook/Hotmail |
| **Yahoo** | Rate limits aggressively; greylists | May get false `450` responses |
| **Catch-all domains** | Accept everything by design | See §2 |
| **Greylisting servers** | Return `450` on first attempt | Must retry after delay (typically 5–15 min) |

**Key takeaway:** SMTP verification is a useful *layer* in a multi-signal approach, but it's not sufficient alone. Major providers have made it increasingly unreliable.

---

## 2. Catch-All Domain Detection

### What Is a Catch-All Domain?

A catch-all (accept-all) domain accepts email to **any** address at that domain, regardless of whether a specific mailbox exists. E.g., `anything@catchall-domain.com` returns `250 OK`.

### Detection Technique

Send an SMTP `RCPT TO` for a **randomly generated, guaranteed-nonexistent address**. If the server responds `250`, it's catch-all.

```python
import uuid

def detect_catch_all(domain: str, timeout: int = 10) -> bool:
    """
    Detect if a domain is configured as catch-all.
    Sends RCPT TO for a random address — if accepted, it's catch-all.
    """
    random_local = f"verftest-{uuid.uuid4().hex[:12]}"
    fake_email = f"{random_local}@{domain}"
    result = smtp_verify(fake_email, timeout=timeout)
    return result.result == VerifyResult.VALID  # If fake address accepted → catch-all
```

### The Catch-All Problem

| Scenario | What Happens |
|----------|-------------|
| Valid address on catch-all domain | `250` — looks identical to any other address |
| Invalid address on catch-all domain | `250` — still accepted |
| Spam trap on catch-all domain | `250` — you just verified a trap |

**Bounce rate impact:** Industry data shows **~23% of catch-all addresses will hard bounce** when you actually send to them. Average bounce rate from catch-all lists: **~9%**.

### Advanced Detection Approaches

1. **Multi-probe testing**: Send several random addresses, then the target. If all return `250`, flag as catch-all.
2. **Behavioral/engagement analysis**: Track historical sends to the domain. Build a domain reputation score.
3. **Proprietary signal analysis**: Companies like BounceBan and Scrubby claim 85–95% accuracy on catch-all addresses via undisclosed methods (likely historical delivery data + engagement signals).
4. **Header analysis**: Some catch-all configs add specific headers or route to a shared inbox — detectable if you can inspect delivery.

### Recommendations for Catch-All Addresses

- **Segment them**: Don't mix catch-all addresses into your main sending list
- **Send conservatively**: Lower volume, monitor bounces per-domain
- **Verify via engagement**: Track opens/clicks; remove non-responsive after 2–3 sends
- **Use advanced verifiers**: BounceBan, Scrubby, or DeBounce for catch-all-specific verification

---

## 3. Best Open-Source Email Verification Libraries

### Python

#### `email-validator` — Syntax + Deliverability (Recommended)

- **GitHub**: [JoshData/python-email-validator](https://github.com/JoshData/python-email-validator)
- **License**: Unlicense (public domain)
- **Stars**: ~2.5k
- **Scope**: Syntax validation, IDNA, MX checks, DNS deliverability

```python
from email_validator import validate_email, EmailNotValidError

def validate(email: str) -> dict:
    try:
        result = validate_email(email, check_deliverability=True)
        return {
            "valid": True,
            "normalized": result.normalized,
            "local_part": result.local_part,
            "domain": result.ascii_domain,
            "mx": result.mx,
        }
    except EmailNotValidError as e:
        return {"valid": False, "error": str(e)}
```

#### `verify-email` — Full SMTP Verification

- **PyPI**: [verify-email](https://pypi.org/project/verify-email/)
- **License**: MIT
- **Scope**: Syntax + DNS + MX + SMTP `RCPT TO` check

```python
from verify_email import verify_email

# Single check
is_valid = verify_email("user@example.com")

# Batch (with asyncio)
emails = ["a@example.com", "b@test.com"]
results = verify_email(emails)
# Returns: [True, False]
```

#### `pyIsEmail` — RFC-Compliant Deep Syntax Check

- **PyPI**: [pyIsEmail](https://pypi.org/project/pyIsEmail/)
- **Scope**: Pure syntax validation per RFC 5321/5322

### Node.js

#### `deep-email-validator` (AfterShip) — Most Complete

- **GitHub**: [mfts/deep-email-validator](https://github.com/mfts/deep-email-validator)
- **License**: MIT
- **Stars**: ~8.4k
- **Scope**: Regex + typo detection + disposable filtering + DNS + SMTP

```javascript
import { validate } from 'deep-email-validator';

async function verifyEmail(email) {
  const result = await validate({
    email,
    sender: 'verify@yourdomain.com',
    validateRegex: true,
    validateMx: true,
    validateTypo: true,
    validateDisposable: true,
    validateSMTP: true,
  });

  return {
    valid: result.valid,
    reason: result.reason,      // e.g., "smtp", "disposable", "typo"
    validators: result.validators,
  };
}

// Usage
const result = await verifyEmail('test@gmail.com');
console.log(result);
```

#### `validator.js` — Syntax Only (Ultra-Fast)

- **GitHub**: [validatorjs/validator.js](https://github.com/validatorjs/validator.js)
- **License**: MIT
- **Stars**: ~23k
- **Scope**: RFC-compliant `isEmail()` syntax check; zero dependencies

```javascript
import validator from 'validator';
console.log(validator.isEmail('foo@bar.com')); // true
console.log(validator.isEmail('foo@bar'));      // false
```

### Cross-Platform / Self-Hosted

#### Reacher (`check-if-email-exists`) — Full Stack, Rust

- **GitHub**: [reacherhq/check-if-email-exists](https://github.com/reacherhq/check-if-email-exists)
- **License**: **AGPL-3.0** (commercial license available)
- **Language**: Rust
- **Scope**: Syntax + DNS + MX + SMTP + catch-all + disposable detection
- **Deployment**: Docker, CLI binary, Rust library, or hosted SaaS

```bash
# Docker (self-hosted)
docker run -p 8080:8080 reacherhq/backend:latest

# API call
curl -X POST http://localhost:8080/v0/check_email \
  -H "Content-Type: application/json" \
  -d '{"to_email": "user@example.com"}'
```

**⚠️ AGPL Warning**: If you embed Reacher in a proprietary product served over a network, you must open-source your code — or buy a commercial license (~$50–399/mo).

#### MailChecker — Disposable Domain Detection

- **GitHub**: [FGRibreau/mailchecker](https://github.com/FGRibreau/mailchecker)
- **License**: MIT
- **Languages**: Node.js, Python, Go, Ruby, Rust, PHP, Elixir, Clojure
- **Scope**: 55,000+ disposable email domain database

```python
import MailChecker
MailChecker.is_valid("user@mailinator.com")   # False
MailChecker.is_valid("user@gmail.com")         # True
```

### Library Comparison Matrix

| Library | Language | Syntax | DNS/MX | SMTP | Disposable | Catch-All | License | Best For |
|---------|----------|--------|--------|------|------------|-----------|---------|----------|
| `email-validator` | Python | ✅ | ✅ | ❌ | ❌ | ❌ | Unlicense | Form validation |
| `verify-email` | Python | ✅ | ✅ | ✅ | ❌ | ❌ | MIT | Backend verification |
| `deep-email-validator` | Node.js | ✅ | ✅ | ✅ | ✅ | ❌ | MIT | Full-stack apps |
| `validator.js` | Node.js | ✅ | ❌ | ❌ | ❌ | ❌ | MIT | Frontend/fast checks |
| **Reacher** | Rust | ✅ | ✅ | ✅ | ✅ | ✅ | AGPL-3.0 | Self-hosted service |
| MailChecker | Multi | ❌ | ❌ | ❌ | ✅ | ❌ | MIT | Disposable filtering |

---

## 4. Commercial API Pricing Comparison

### Side-by-Side (as of early 2025)

| Provider | Entry Price | Cost @ 10K | Cost @ 100K | Cost @ 1M | Free Tier | Credit Expiry | Catch-All Detection |
|----------|------------|-----------|------------|----------|-----------|--------------|-------------------|
| **ZeroBounce** | $18/2K emails | ~$0.008/ea | ~$0.005/ea | ~$0.00275/ea | 100/mo | Never | ✅ Flags only |
| **NeverBounce** | $8/1K emails | $0.008/ea | $0.005/ea | $0.003/ea | 1,000 free | 12 months | ✅ Flags only |
| **Reoon** | $9.95/500/day | ~$0.002/ea | ~$0.001/ea | ~$0.0005/ea | 600/mo | Never | ✅ Basic |
| **Mailcheck.ai** | ~$0.003/ea | ~$30 | ~$300 | ~$3,000 | Limited | Varies | ✅ |
| **Abstract API** | $19/10K/mo | $19/mo | $69/mo | ~$500/mo | 100/mo | Monthly reset | ✅ |

### Provider Deep Dives

#### ZeroBounce
- **Best for**: Enterprise; high accuracy; AI-powered scoring
- **Accuracy claim**: 99%+
- **Extras**: Email scoring, activity detection, inbox placement testing
- **API**: REST with batch upload support
- **Integration**: Zapier, HubSpot, Mailchimp, etc.

#### NeverBounce
- **Best for**: Mid-volume senders; clean SaaS API
- **Accuracy claim**: 99.9%
- **Extras**: Real-time JS widget, bulk API, auto-clean integrations
- **Owned by**: ZoomInfo (data synergies)

#### Reoon
- **Best for**: Budget-conscious teams; highest value per dollar
- **Unique**: Daily credit subscriptions (accumulate unused credits)
- **Speed**: ~50K verifications/hour on bulk
- **Pricing model**: Both pay-as-you-go and subscription

#### Abstract API
- **Best for**: Developers who want a simple REST API
- **Unique**: Part of a larger API suite (IP geo, phone validation, etc.)
- **Speed**: Real-time single-email focus
- **Pricing model**: Monthly subscription tiers

### Build vs. Buy Decision Matrix

| Factor | Build (Self-Hosted) | Buy (API) |
|--------|-------------------|-----------|
| **Cost at 10K/mo** | ~$5–20 (server costs) | $19–80 |
| **Cost at 1M/mo** | ~$50–100 (server costs) | $275–3,000 |
| **Accuracy** | 70–85% (SMTP limitations) | 95–99% (multi-signal) |
| **Catch-all handling** | Basic detection only | Advanced (some providers) |
| **Gmail/O365 accuracy** | Very low | Moderate–High |
| **Maintenance** | Ongoing (IP reputation, blocklists) | Zero |
| **IP reputation risk** | Your IPs get burned doing SMTP checks | Provider's problem |
| **Speed to production** | Days–weeks | Hours |
| **Data privacy** | Full control | Third-party processing |

**Verdict**: Build a basic syntax + DNS + disposable layer in-house. Buy SMTP-level verification from an API. The IP reputation risk alone makes self-hosted SMTP verification impractical at scale.

---

## 5. Bounce Rate Thresholds & Blacklisting

### Industry Thresholds (2024–2025)

| Bounce Rate | Status | Consequence |
|-------------|--------|-------------|
| **< 1%** | ✅ Excellent | Healthy sender reputation |
| **1–2%** | ⚠️ Warning | ISPs start watching; clean your list |
| **2–5%** | 🔴 Danger | Throttling begins; ESP may flag account |
| **> 5%** | 💀 Critical | Active blacklisting; ESP suspension likely |

### Hard vs. Soft Bounces

| Type | Cause | Action |
|------|-------|--------|
| **Hard bounce** (5xx) | Mailbox doesn't exist, domain invalid | **Immediately remove** — never retry |
| **Soft bounce** (4xx) | Mailbox full, server down, greylisting | Retry 2–3 times, then remove |

### What Triggers Blacklisting

1. **Hard bounce rate > 2%** across multiple sends
2. **Spam complaint rate > 0.1%** (Gmail threshold: 0.3%)
3. **Hitting spam traps** (recycled or pristine)
4. **Sudden volume spikes** without warm-up
5. **Poor authentication** (missing SPF/DKIM/DMARC)

### 2024 Provider Requirements (Mandatory)

**Gmail & Yahoo (Feb 2024)**:
- SPF + DKIM + DMARC required for 5K+ daily senders
- One-click unsubscribe header mandatory
- Spam complaint rate must stay below **0.3%**
- Non-compliant senders get **rejected outright** (not just spam-foldered)

**Microsoft Outlook (May 2025)**:
- Same requirements for 5K+ daily senders to Outlook.com addresses
- SPF, DKIM, DMARC enforcement
- Functional unsubscribe mechanisms

### Blacklist Monitoring

Major blacklists to monitor:
- **Spamhaus** (SBL, XBL, PBL) — most impactful
- **Barracuda** (BRBL)
- **SpamCop**
- **SORBS**
- **UCEProtect**

```bash
# Quick check if your IP is listed (use MXToolbox or manual DNS)
dig +short 2.0.168.192.zen.spamhaus.org
# Returns 127.0.0.x if listed; NXDOMAIN if clean
# (reverse your IP octets before the blacklist domain)
```

---

## 6. Warm-Up Strategies for New Sending Domains

### Why Warm-Up Matters

New domains and IPs have **zero reputation**. ISPs treat unknown senders with suspicion. Warm-up builds a positive signal history through controlled volume increases and engagement.

### Pre-Warmup Checklist

- [ ] **SPF record** configured
- [ ] **DKIM signing** enabled
- [ ] **DMARC policy** published (start with `p=none`)
- [ ] **Custom tracking domain** set up (avoid shared tracking domains)
- [ ] **Unsubscribe headers** implemented (List-Unsubscribe + List-Unsubscribe-Post)
- [ ] **Domain age**: Ideally 2+ weeks old before first send
- [ ] **rDNS (PTR record)** matches sending hostname

### Cold Email Warm-Up Schedule (6-Week)

| Week | Daily Volume | Target Audience | Key Metrics |
|------|-------------|-----------------|-------------|
| **1** | 5–10/day | Colleagues, friends, known contacts | Reply rate > 50% |
| **2** | 15–25/day | Warm leads, inbound inquiries | Reply rate > 30% |
| **3** | 30–50/day | Semi-warm prospects | Bounce < 2%, reply > 20% |
| **4** | 50–75/day | Mix of warm + cold prospects | Monitor spam complaints |
| **5** | 75–100/day | Cold prospects (verified list) | Bounce < 1% |
| **6+** | 100–150/day per inbox | Full cold outreach | Maintain all metrics |

### Marketing/Transactional Warm-Up Schedule (4-Week)

| Day | Volume | Notes |
|-----|--------|-------|
| 1–3 | 50/day | Most engaged subscribers (opened in last 30 days) |
| 4–7 | 100–200/day | Expand to 60-day engaged |
| 8–14 | 500–1,000/day | Increase by 50% daily max |
| 15–21 | 2,000–5,000/day | Monitor open rates closely |
| 22–30 | 10,000+/day | Full volume if metrics stable |

### Golden Rules

1. **Never increase more than 20% per day** (even with perfect engagement)
2. **Consistency > volume** — send daily, not in bursts
3. **Engagement signals are king**: Replies > Opens > Clicks
4. **Stop scaling if**: bounce rate > 2%, spam complaints > 0.1%, or sudden open rate drop
5. **Multi-inbox strategy**: Use 3–5 inboxes per domain, 50–100 emails/day per inbox

### Automated Warm-Up Tools

| Tool | Included With | How It Works |
|------|--------------|-------------|
| **Instantly.ai Warmup** | All Outreach plans | Peer-to-peer warm-up network; auto-reply generation |
| **Smartlead Warmup** | All plans | Similar peer network; engagement simulation |
| **Mailreach** | Standalone ($25/inbox/mo) | Large warm-up network; deliverability dashboard |
| **Warmup Inbox** | Standalone ($15/inbox/mo) | Network-based warm-up + reporting |
| **Lemwarm** | Included with Lemlist | Warm-up via Lemlist user network |

### Infrastructure Pattern: Multi-Domain Strategy

For serious cold outreach, use multiple domains to distribute reputation risk:

```
Primary brand: yourcompany.com (never use for cold email)

Cold outreach domains (3–5):
  ├── yourcompany-team.com
  ├── getyourcompany.com
  ├── tryyourcompany.com
  └── yourcompanymail.com

Per domain: 3 inboxes × 50 emails/day = 150 emails/day
5 domains × 150 = 750 cold emails/day capacity
```

---

## 7. Cold Email Infrastructure

### Platform Comparison

| Feature | Instantly.ai | Smartlead | Mailforge |
|---------|-------------|-----------|-----------|
| **Type** | All-in-one sending platform | All-in-one sending platform | Email infrastructure only |
| **Starting Price** | $37/mo (Growth) | $39/mo (Basic) | $3/mailbox/mo |
| **Email Accounts** | Unlimited | Unlimited | Unlimited (pay per mailbox) |
| **Warmup** | ✅ Included (unlimited) | ✅ Included (unlimited) | ❌ Needs external tool |
| **Campaign Management** | ✅ Built-in | ✅ Built-in | ❌ Needs Instantly/Smartlead |
| **Lead Database** | ✅ 450M+ contacts (separate plan) | ✅ Built-in | ❌ No |
| **CRM** | ✅ Separate plan ($47/mo) | ✅ Built-in | ❌ No |
| **Monthly Emails** | 10K (Growth) – 500K+ (Light Speed) | Based on plan | Unlimited |
| **Inbox Rotation** | ✅ | ✅ | N/A |
| **A/B Testing** | ✅ | ✅ | N/A |
| **API Access** | ✅ | ✅ | ✅ |

### Pricing Breakdown

#### Instantly.ai
| Plan | Monthly | Annual (per month) | Emails/mo | Contacts |
|------|---------|-------------------|-----------|----------|
| Growth | $37 | $30 | 10,000 | 2,000 |
| Hypergrowth | $97 | $77 | 125,000 | 25,000 |
| Light Speed | $358 | $286 | 500,000 | 100,000 |

**Add-ons**: SuperSearch leads ($47–197/mo), CRM ($47–97/mo)

#### Smartlead
| Plan | Monthly | Annual (per month) | Leads |
|------|---------|-------------------|-------|
| Basic | $39 | $32.50 | 2,000 |
| Pro | $94 | $78.30 | 30,000 |
| Custom | $174+ | — | Unlimited |

**Add-on**: Whitelabeling $29/client (Pro includes 1 free)

#### Mailforge
| Component | Cost |
|-----------|------|
| Mailboxes | $2–3/mailbox/mo |
| Domains (.com) | $14/year |
| SSL + Domain Masking | $2/mo or $6/yr per domain |
| Minimum | 10 mailboxes |

**Example**: 50 mailboxes + 10 domains = ~$150–190/mo + ~$140/yr domains

### Architecture Decision: When to Use What

```
┌────────────────────────────────────────────────────┐
│                  DECISION TREE                      │
├────────────────────────────────────────────────────┤
│                                                     │
│  Sending < 500 cold emails/day?                    │
│    → Instantly.ai Growth ($37/mo)                  │
│    → Simple, all-in-one, good warmup               │
│                                                     │
│  Sending 500–5,000/day?                            │
│    → Instantly Hypergrowth ($97/mo)                │
│    → OR Smartlead Pro ($94/mo)                     │
│                                                     │
│  Sending 5,000+/day (agency/scale)?               │
│    → Mailforge infra ($3/mailbox)                  │
│    → + Instantly/Smartlead for sending              │
│    → Multi-domain rotation strategy                 │
│                                                     │
│  Maximum cost optimization?                        │
│    → Mailforge ($3/box) + Smartlead Basic ($39)    │
│    → Roll your own SMTP + use open-source warmup   │
│                                                     │
└────────────────────────────────────────────────────┘
```

### Full Cold Email Stack (Production-Grade)

```
┌─────────────────────────────────────────────────┐
│                 LEAD SOURCING                    │
│  Apollo.io / Instantly SuperSearch / Clay.com    │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│              EMAIL VERIFICATION                  │
│  Layer 1: In-house (syntax + DNS + disposable)  │
│  Layer 2: API (ZeroBounce / NeverBounce / Reoon)│
│  Layer 3: Catch-all handling (BounceBan/Scrubby)│
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│             EMAIL INFRASTRUCTURE                 │
│  Domains: 5–10 (via Mailforge or manual)         │
│  Inboxes: 3–5 per domain (Google Workspace /     │
│           Mailforge / Outlook)                    │
│  Authentication: SPF + DKIM + DMARC per domain   │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│               WARM-UP (2–6 weeks)                │
│  Instantly / Smartlead built-in warmup           │
│  OR Mailreach / Warmup Inbox (standalone)        │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│              SENDING PLATFORM                    │
│  Instantly.ai / Smartlead                        │
│  Features: Inbox rotation, sequences,            │
│  A/B testing, auto-follow-ups                    │
└──────────────────────┬──────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────┐
│             MONITORING & HYGIENE                 │
│  Bounce tracking (auto-remove hard bounces)      │
│  Blacklist monitoring (Spamhaus, Barracuda)       │
│  Domain reputation (Google Postmaster Tools)      │
│  Engagement tracking (opens, replies, clicks)     │
└─────────────────────────────────────────────────┘
```

### Node.js: Verification + Sending Integration Example

```javascript
import { validate } from 'deep-email-validator';
import dns from 'dns/promises';

class EmailVerificationPipeline {
  constructor(apiKey) {
    this.apiKey = apiKey; // For commercial API fallback
    this.disposableDomains = new Set(); // Load from MailChecker
  }

  async verify(email) {
    const results = {
      email,
      syntax: false,
      dns: false,
      smtp: false,
      disposable: false,
      catchAll: 'unknown',
      verdict: 'unknown',
    };

    // Layer 1: Syntax + DNS (free, in-house)
    const basicCheck = await validate({
      email,
      validateRegex: true,
      validateMx: true,
      validateTypo: true,
      validateDisposable: true,
      validateSMTP: false, // Don't burn our IPs
    });

    results.syntax = basicCheck.validators.regex?.valid ?? false;
    results.dns = basicCheck.validators.mx?.valid ?? false;
    results.disposable = !(basicCheck.validators.disposable?.valid ?? true);

    if (!results.syntax || !results.dns || results.disposable) {
      results.verdict = 'invalid';
      return results;
    }

    // Layer 2: Commercial API for SMTP verification
    // (Don't do SMTP checks from your own infrastructure)
    try {
      const apiResult = await this.verifyViaAPI(email);
      results.smtp = apiResult.deliverable;
      results.catchAll = apiResult.catchAll ? 'yes' : 'no';
      results.verdict = apiResult.deliverable ? 'valid' :
                        apiResult.catchAll ? 'risky' : 'invalid';
    } catch (err) {
      results.verdict = 'unknown';
    }

    return results;
  }

  async verifyViaAPI(email) {
    // Example: ZeroBounce API
    const res = await fetch(
      `https://api.zerobounce.net/v2/validate?api_key=${this.apiKey}&email=${email}`
    );
    const data = await res.json();
    return {
      deliverable: data.status === 'valid',
      catchAll: data.status === 'catch-all',
      subStatus: data.sub_status,
    };
  }

  async verifyBatch(emails) {
    // Process in batches of 50 to respect rate limits
    const batchSize = 50;
    const results = [];
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(e => this.verify(e)));
      results.push(...batchResults);
      // Rate limit: 100ms between batches
      await new Promise(r => setTimeout(r, 100));
    }
    return results;
  }
}

// Usage
const pipeline = new EmailVerificationPipeline('your-zerobounce-key');
const result = await pipeline.verify('prospect@company.com');
console.log(result);
// {
//   email: 'prospect@company.com',
//   syntax: true,
//   dns: true,
//   smtp: true,
//   disposable: false,
//   catchAll: 'no',
//   verdict: 'valid'
// }
```

---

## TL;DR — Recommendations

| Need | Recommendation |
|------|---------------|
| **Syntax validation** | `email-validator` (Python) or `validator.js` (Node) — free, fast |
| **Full self-hosted verification** | Reacher (Rust/Docker) — but mind AGPL license |
| **Commercial API (budget)** | Reoon — best cost per verification at any volume |
| **Commercial API (enterprise)** | ZeroBounce — most features, best accuracy |
| **Catch-all verification** | BounceBan or Scrubby (specialized) |
| **Cold email platform (simple)** | Instantly.ai — best warmup + all-in-one |
| **Cold email platform (agency)** | Smartlead + Mailforge infra |
| **Verification architecture** | In-house syntax/DNS layer → Commercial API for SMTP → Segment catch-alls separately |
