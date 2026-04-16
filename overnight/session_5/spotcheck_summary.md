# 🚨 Grade A Spot-Check Summary — Session 5

## ⚠️ CRITICAL QUALITY ALERT: 42% FALSE POSITIVE RATE

**Sample size:** 50 random Grade A companies
**Date:** 2026-04-04

| Verdict | Count | Percentage |
|---------|-------|------------|
| **FALSE_POSITIVE** | **21** | **42%** |
| SUSPECT | 20 | 40% |
| VERIFIED | 9 | 18% |

> **This is a severe quality issue.** Only 18% of the sample could be confidently verified as legitimate Grade A companies. The 42% false positive rate is more than double the 20% threshold.

---

## False Positive Breakdown (21 companies DQ'd)

### 🏢 Too Big / Domain Mismatch (7)
These are major companies where BvD employee counts are wildly wrong — off by 100x or more:

| Domain | BvD Employees | Actual Estimate | Issue |
|--------|--------------|-----------------|-------|
| perficient.com | 5 | ~7,000 | Publicly traded, acquired by EQT for $3B |
| bottomline.com | 2 | ~2,000 | Acquired by Thoma Bravo for $4.7B |
| cendyn.com | 10 | ~500 | Major hospitality tech company |
| unitrends.com | 4 | ~300 | Part of Kaseya |
| bubble.io | 4 | ~400 | Massive no-code platform, raised $100M+ |
| nexustek.com | 3 | ~250 | Major managed IT services provider |
| sourcepoint.com | 5 | ~150 | "30B monthly consumer touchpoints" |

**Root cause:** BvD is matching tiny LLCs to domains owned by massive companies. E.g., "COEUS USA LLC" (4 employees) matched to bubble.io, "OPTIO SOFTWARE LLC" (2 employees) matched to bottomline.com. The domain-to-company mapping is fundamentally broken for these.

### 💀 Dead/Parked Websites (9)
| Domain | Status |
|--------|--------|
| mtsa-jv.com | Fetch failed — domain doesn't resolve |
| get.downshiftit.com | DNS not found |
| gsystemsinc.com | DNS not found |
| cogentes.biz | DNS not found |
| prohawkgroup.com | DNS not found |
| certifyu.com | Fetch failed |
| aecinfosystems.com | "Under reconstruction" page |
| illuminys.com | "Coming Soon" since 2017 |
| mimics.us | IIS 403 error, abandoned hosting |

**Root cause:** No website liveness check in the pipeline. Many of these domains were probably valid years ago.

### 🚫 Not Tech (4)
| Domain | Actual Business |
|--------|----------------|
| ghcfairgrounds.com | Grays Harbor Fair & Events Center (fairground) |
| betzdesign.com | Graphic design studio |
| findit.com | BioRegenx — biotech/regenerative medicine holding co |
| washoecounty.gov | County government (.gov domain!) |

### 🌍 Not US (1)
| Domain | Actual Location |
|--------|----------------|
| agni-inc.blogspot.com | Malaysian company (bankrupt 2010, complaint blog) |

---

## Key Patterns & Systemic Issues

### 1. BvD Descriptions Are Frequently Wrong (~70%)
Almost every company had a BvD description that didn't match reality. Examples:
- **ghcfairgrounds.com** (fairground) → BvD says "online safety and AI"
- **betzdesign.com** (graphic design) → BvD says "E911 solutions"
- **agni-inc.blogspot.com** (dead Malaysian company) → BvD says "AI smart glasses manufacturer in CA"
- **perficient.com** (digital consultancy) → BvD says "automated trading platform"

**This suggests BvD descriptions are being randomly assigned or hallucinated.** The pipeline should NOT trust BvD descriptions for ICP classification.

### 2. Domain-to-Company Mapping is Unreliable
Multiple cases where the BvD company name has zero relationship to the domain:
- bubble.io ↔ COEUS USA LLC
- bottomline.com ↔ OPTIO SOFTWARE LLC  
- nexustek.com ↔ ALPHA ACTUAL LLC
- agilefleet.com ↔ DRTANGO INC

### 3. No Website Liveness Check
9 of 50 companies (18%) have completely dead websites. A simple DNS/HTTP check would catch these.

### 4. .gov Domains Should Be Auto-DQ'd
washoecounty.gov slipped through — government entities should be filtered by TLD.

### 5. Blogspot/Free Hosting Domains Should Be Flagged
agni-inc.blogspot.com is a free blogging platform, not a company website.

---

## Verified Companies (9)

These look like legitimate Grade A targets:
1. **gdmdata.com** — Agriculture research software (ARM)
2. **meytier.com** — AI hiring platform
3. **kw1.knowwho.com** — Government directory Salesforce app
4. **irissi.com** — Machine vision/automation
5. **dxcorr.com** — Custom semiconductor design
6. **acesoftwarellc.com** — IT consulting/software
7. **inresllc.com** — Engineering simulation software
8. **oakworks.io** — Small software dev shop
9. **mattersinmotion.com** — Legal tech consulting

---

## Recommendations

1. **Add website liveness check** — DNS resolution + HTTP 200 check before grading
2. **Auto-DQ .gov, .edu, .mil, and free hosting domains** (blogspot, wordpress.com, etc.)
3. **Do NOT trust BvD descriptions** for ICP scoring — they appear randomly assigned
4. **Validate domain↔company mapping** — cross-reference domain WHOIS or website content with company name
5. **Add employee count reality check** — if BvD says 5 employees but domain is a known enterprise, DQ
6. **Consider the SUSPECT pool** — 20 companies (40%) could not be confidently verified. Many are IT services/agencies rather than software product companies

---

## Database Updates

21 companies updated in master.db:
- `icp_grade` → `DQ`
- `icp_dq_reason` → specific verified reason (dead_website_verified, not_tech_verified, dq_employees_verified_N, not_us_verified)
