# Session 5 — Pipeline Analysis Summary

**Generated:** 2026-04-04 05:15 PDT  
**Database:** master.db  
**Total Companies:** 86,002

---

## 1. Grade Distribution

| Grade | Count | Avg Score | Min | Max |
|-------|------:|----------:|----:|----:|
| **A** | 1,185 | 77.4 | 75 | 88 |
| **B** | 14,490 | 59.6 | 50 | 74 |
| **C** | 29,163 | 44.9 | 27 | 49 |
| **D** | 3 | 21.3 | 20 | 24 |
| **DQ** | 41,161 | 0.0 | 0 | 79 |

- **Grade A = 1.4%** of the total pipeline
- **A + B = 18.2%** pass the quality bar (15,675 companies)
- DQ dominates at 47.9% — nearly half the pipeline filtered out

---

## 2. Grade A by State (Top 15)

| State | Count | % of Grade A |
|-------|------:|-----------:|
| CA | 218 | 18.4% |
| VA | 116 | 9.8% |
| TX | 77 | 6.5% |
| GA | 75 | 6.3% |
| NY | 68 | 5.7% |
| FL | 66 | 5.6% |
| MN | 47 | 4.0% |
| PA | 46 | 3.9% |
| MA | 36 | 3.0% |
| MD | 32 | 2.7% |
| NJ | 31 | 2.6% |
| MI | 28 | 2.4% |
| DE | 26 | 2.2% |
| IL | 25 | 2.1% |
| OH | 24 | 2.0% |

**Key insight:** CA alone accounts for nearly 1 in 5 Grade A companies. The top 5 states (CA, VA, TX, GA, NY) represent **46.7%** of all Grade A.

---

## 3. Grade A by Source

| Source | Count | % of Grade A |
|--------|------:|-----------:|
| bvd_45k | 1,005 | 84.8% |
| bvd_60k | 166 | 14.0% |
| us_software | 11 | 0.9% |
| Betaworks | 2 | 0.2% |
| Techstars | 1 | 0.1% |
| Dreamit | 1 | 0.1% |
| 500 Global | 1 | 0.1% |

**Key insight:** BvD sources account for **98.8%** of all Grade A companies. The original 45K batch is by far the most productive source. Accelerator sources contributed minimally (5 total).

---

## 4. Grade A by Employee Range

| Employee Range | Count | % of Grade A |
|----------------|------:|-----------:|
| 1–9 | 985 | 83.1% |
| 10–24 | 201 | 17.0% |
| Unknown | 1 | 0.1% |

**Key insight:** The ICP strongly favors micro-companies (sub-10 employees). No Grade A companies have 25+ employees — the scoring model has a hard ceiling around that mark.

---

## 5. Grade A by Revenue Range

| Revenue Range | Count | % of Grade A |
|---------------|------:|-----------:|
| $1M–$5M | 982 | 82.9% |
| $100K–$500K | 168 | 14.2% |
| $5M–$10M | 28 | 2.4% |
| $500K–$1M | 6 | 0.5% |
| $10M–$50M | 2 | 0.2% |
| Unknown | 1 | 0.1% |

**Key insight:** The sweet spot is $1M–$5M revenue (82.9%). Almost all Grade A companies fall in the $100K–$5M band (97.1%).

---

## 6. DQ Reason Breakdown (Top 20)

| DQ Reason | Count | % of DQ |
|-----------|------:|--------:|
| no_tech_signal | 26,929 | 65.4% |
| in_hubspot | 13,144 | 31.9% |
| biotech_no_software | 52 | 0.1% |
| dq_employees_100 | 43 | 0.1% |
| dq_employees_150 | 42 | 0.1% |
| dq_employees_200 | 34 | 0.1% |
| dq_employees_120 | 29 | 0.1% |
| dq_employees_60 | 28 | 0.1% |
| dq_employees_140 | 26 | 0.1% |
| dq_employees_51 | 25 | 0.1% |
| dq_employees_180 | 25 | 0.1% |
| dq_employees_110 | 24 | 0.1% |
| dq_employees_55 | 23 | 0.1% |
| dq_employees_75 | 21 | 0.1% |
| dq_employees_160 | 21 | 0.1% |
| dq_employees_65 | 19 | <0.1% |
| gov_tech | 18 | <0.1% |
| dq_employees_80 | 18 | <0.1% |
| dq_employees_85 | 16 | <0.1% |
| dq_employees_70 | 16 | <0.1% |

**Key insight:** Two reasons account for **97.3%** of all DQs:
- **no_tech_signal** (65.4%) — the single biggest filter
- **in_hubspot** (31.9%) — already in CRM, deduped out

Employee-based DQs are scattered across many specific thresholds. `gov_tech` and `biotech_no_software` are minor industry filters.

---

## 7. Contact Coverage — Grade A

| Metric | Count | % of 1,185 |
|--------|------:|-----------:|
| Has Email (flag) | 1,014 | 85.6% |
| Has DM Name | 1,118 | 94.4% |
| Has DM Email | 1,024 | 86.4% |
| Has Phone (flag) | 58 | 4.9% |
| Has DM Phone | 1 | 0.1% |
| Has DM LinkedIn | 11 | 0.9% |

**Key insight:** Email coverage is strong (86%), and decision-maker names are excellent (94%). **Phone coverage is critically weak** at under 5% — this is a major gap for outbound. DM LinkedIn URLs are nearly nonexistent (0.9%).

### Contact Gaps to Address
- 🔴 **Phone numbers**: Only 58 of 1,185 Grade A companies have any phone — needs enrichment pass
- 🟡 **DM LinkedIn**: Only 11 have LinkedIn URLs — limits social selling
- 🟢 **Email + Name**: Strong foundation for email outreach (86%+ coverage)

---

## 8. Top 20 Grade A Companies by Score

| Score | Company | Domain | State | Employees | Revenue ($K) |
|------:|---------|--------|-------|----------:|-----------:|
| 88 | OPEN SOLUTIONS GROUP | bigbear.io | VA | 4 | 340 |
| 87 | Intercom | intercom.com | CA | 7 | 410 |
| 86 | STELLARITE INC | stellarite.io | CA | 5 | 2,170 |
| 86 | SECURITYBRICKS INC | securitybricks.io | WA | 7 | 410 |
| 85 | COEUS USA LLC | bubble.io | CA | 4 | 260 |
| 85 | WRENO, INC. | wreno.io | AZ | 2 | 300 |
| 85 | CLAIRVOYANT AI | clairvoyant.ai | AZ | 2 | 300 |
| 84 | PIXM INC | pixm.net | NY | 6 | 3,350 |
| 84 | NEX TEAM INC. | homecourt.ai | CA | 8 | 8,730 |
| 84 | ELEMENT DATA | decisioncloud.io | WA | 7 | 3,160 |
| 84 | BLUVECTOR, INC. | bluvector.io | VA | 6 | 2,780 |
| 84 | BLUVECTOR, INC. | databee.ai | VA | 6 | 2,780 |
| 83 | CODESCAN ENTERPRISES | codescan.io | CA | 6 | 330 |
| 83 | CARROLCODE LLC | texas-biz.com | TX | 4 | 300 |
| 83 | RIDE IN TANDEM | usetandem.com | MI | 5 | 300 |
| 83 | ANCHOROCK SOLUTIONS | anchorock.com | CA | 6 | 330 |
| 83 | CUBIC COMPASS SOFTWARE | cubiccompass.com | OR | 4 | 280 |
| 83 | BRISK LABS CORPORATION | brisklabs.com | CA | 4 | 260 |
| 83 | DOXLY INC | doxly.com | IN | 3 | 380 |
| 83 | EVERSTAGE INC. | everstage.com | DE | 4 | 320 |

**Note:** BLUVECTOR appears twice with different domains (bluvector.io + databee.ai) — potential duplicate worth flagging.

---

## 9. Near-Miss Analysis (Score 70–74)

**1,356 companies** scored 70–74 (all graded B). These are the closest to the A threshold (75+).

These near-misses represent the largest opportunity for grade uplift. A small scoring adjustment or additional enrichment could push many into Grade A, potentially **more than doubling** the A pool.

**Recommendation:** Review whether any scoring signals could be refined to better differentiate true A-quality companies in this 70–74 band.

---

## Key Takeaways

1. **1,185 Grade A companies** — a focused, high-quality pool
2. **CA dominates** with 18.4% of Grade A; top 5 states = 46.7%
3. **BvD is the engine** — 98.8% of Grade A comes from BvD sources
4. **ICP sweet spot:** 1–9 employees, $1M–$5M revenue
5. **Email outreach ready** — 86% have email + 94% have DM names
6. **Phone is the gap** — only 4.9% have phone numbers (enrichment needed)
7. **1,356 near-misses** at score 70–74 could expand the A pool significantly
8. **65% of DQs** are due to no tech signal — the primary filter working as designed
