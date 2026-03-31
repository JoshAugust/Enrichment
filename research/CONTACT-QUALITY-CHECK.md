# Contact Data Quality Check
**Run date:** 2026-03-29  
**Scope:** First 10 companies in contacts-gpu-operators.md  
**Method:** Domain match check + web search verification per key contact  
**Checked by:** Brock (subagent, wave5-contact-quality)

> ✅ = Confirmed good  
> ⚠️ = Flag / issue found  
> ❓ = Unverified (low-quality source, couldn't confirm)  
> ❌ = Outdated / incorrect  

---

## Summary of Critical Flags

| # | Issue | Severity |
|---|-------|----------|
| 1 | **Voltage Park no longer exists** — merged with Lightning AI on Jan 21, 2026. All @voltagepark.com emails defunct. | 🔴 Critical |
| 2 | **Crusoe CFO is outdated** — Matthew DeNezza moved to advisory role Dec 2025. New CFO is Michael Gordon (also COO). | 🔴 Critical |
| 3 | **Iris Energy rebranded to IREN** — primary domain is now iren.com, not irisenergy.co. Emails may still route but risky. | 🟡 Medium |
| 4 | **Lambda/Crusoe/Together AI secondary contacts** (COO, VP Finance etc.) sourced from exa.ai/RocketReach — low confidence. | 🟡 Medium |
| 5 | **Kasi Cloud sub-CEO contacts** (Rico Besse, Alexis Orjiako, Victor Lawson) all sourced from RocketReach only — unverified. | 🟡 Medium |

---

## Detailed Results

### 1. CoreWeave (`coreweave.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Michael Intrator | CEO & Co-Founder | ✅ | ✅ | Confirmed CEO & Chairman; IPO'd NASDAQ Mar 2025. coreweave.com/leadership |
| Nitin Agrawal | CFO | ✅ | ✅ | CFO since March 2024; fmr Google Cloud VP Finance. coreweave.com/leadership |
| Peter Salanki | CTO | ✅ | ✅ | CTO since March 2024 (fmr VP Engineering). Also a co-founder per Bloomberg/Wikipedia. |
| Jeff Baker | Chief Accounting Officer | ✅ | ❓ | Sourced from PR Newswire Aug 2024; no LinkedIn listed. Role plausible but low-confidence. |
| Brian Venturo | CSO & Co-Founder | ✅ | ✅ | Co-founder confirmed; CSO role consistent with coreweave.com/leadership. |
| Brannin McBee | CDO & Co-Founder | ✅ | ✅ | Co-founder confirmed; CDO role consistent with coreweave.com/leadership. |
| Sachin Jain | COO | ✅ | ❓ | Sourced from PR Newswire Aug 2024; no LinkedIn listed. Plausible but unverified independently. |

**Overall: 5/7 high-confidence. Domain ✅ all round. No red flags.**

---

### 2. Lambda Labs (`lambdalabs.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Stephen Balaban | CEO & Co-Founder | ✅ | ✅ | Confirmed CEO; founded Lambda Mar 2012. LinkedIn + lambda.ai/leadership. Nov 2025: raised $1.5B. |
| Michael Balaban | CTO & Co-Founder | ✅ | ✅ | Co-founder; CTO role consistent with lambda.ai/leadership. LinkedIn confirmed. |
| Peter Seibold | CFO | ✅ | ✅ | CFO since April 2024; BusinessWire announcement. Fmr SparkCognition CFO, Goldman Sachs MD. |
| Mitesh Agrawal | COO | ✅ | ❓ | Sourced from exa.ai directory only. No LinkedIn listed. Low confidence. |
| Paul Miltenberger | VP Finance | ✅ | ❓ | Sourced from exa.ai directory only. No LinkedIn listed. Low confidence. |

**Overall: 3/5 high-confidence. Seibold CFO solid. Agrawal + Miltenberger need independent verification.**

---

### 3. Crusoe Cloud (`crusoe.ai`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Chase Lochmiller | CEO & Co-Founder | ✅ | ✅ | Confirmed CEO & Chairman. MIT/Stanford. crusoe.ai/about/leadership. |
| Cully Cavness | President & Co-Founder | ✅ | ✅ | Co-founder confirmed; search also shows COO title used alongside President. |
| Matthew DeNezza | CFO | ✅ | ❌ **OUTDATED** | **CFO role ended Dec 2025.** Now in advisory role through 2026. Replaced by Michael Gordon (new CFO+COO). Update contact to Michael Gordon. |
| Nitin Perumbeti | CTO | ✅ | ❓ | Listed on crusoe.ai/about/leadership per source; no independent web verification found. |
| Chris Dolan | Chief Data Center Officer | ✅ | ❓ | Sourced from crusoe.ai newsroom; no LinkedIn listed. Low confidence. |
| Jamey Seely | General Counsel | ✅ | ❓ | Listed on crusoe.ai/about/leadership per source; unverified independently. |

**⚠️ Action required: Replace DeNezza with Michael Gordon (michael.gordon@crusoe.ai permutations) as CFO+COO.**

---

### 4. Nebius Group (`nebius.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Arkady Volozh | CEO & Founder | ✅ | ✅ | Confirmed CEO; fmr Yandex founder. NASDAQ:NBIS. EU sanctions removed Mar 2024. |
| Maria del Dado Alonso Sanchez | CFO | ✅ | ❓ | Sourced from Bloomberg profile only. Name is unusual. No LinkedIn listed. Moderate risk — verify before outreach. |
| Danila Shtan | CTO | ✅ | ❓ | Sourced from simplywall.st management page only. Low-confidence source. |
| Ophir Nave | COO & Executive Director | ✅ | ❓ | Listed on nebius.com/board-of-directors per source. Plausible but unverified via web search. |
| Roman Chernin | Chief Business Officer | ✅ | ❓ | Sourced from nebius.com + LinkedIn posts. Moderate confidence. |
| Marc Boroditsky | CRO | ✅ | ❓ | Sourced from "nebius.com newsroom May 2025". Plausible; fmr Twilio CRO. Moderate confidence. |

**Overall: 1/6 high-confidence (Volozh only). Nebius contacts need deeper verification. The CFO name "Maria del Dado Alonso Sanchez" is unusual — double-check spelling.**

---

### 5. Together AI (`together.ai`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Vipul Ved Prakash | CEO & Co-Founder | ✅ | ✅ | Confirmed CEO; fmr Apple/Topsy. together.ai/about-us + Wikipedia. |
| Ce Zhang | CTO & Co-Founder | ✅ | ✅ | Co-founder & CTO confirmed on together.ai/about-us. Renowned ML researcher (fmr ETH Zurich). |
| Meicheng Shi | SVP Finance | ✅ | ❓ | Listed on together.ai/about-us per source; no independent web verification. |
| Charles Zedlewski | Chief Product Officer | ✅ | ❓ | Listed on together.ai/about-us per source; fmr Cloudera executive. Plausible. |
| Kai Mak | CRO | ✅ | ❓ | Listed on together.ai/about-us per source; unverified. |
| Tri Dao | Chief Scientist & Co-Founder | ✅ | ✅ | Highly verifiable — inventor of FlashAttention; Stanford PhD; well-documented co-founder. |

**Overall: 3/6 high-confidence. CEOs/founders solid. Finance/sales leads lower confidence.**

---

### 6. Voltage Park (`voltagepark.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Ozan Kaya | CEO | ✅ (was) | ❌ **OUTDATED** | **Voltage Park merged with Lightning AI on Jan 21, 2026.** Ozan Kaya is now President of Lightning AI. @voltagepark.com emails likely defunct. |
| Saurabh Giri | CPTO | ✅ (was) | ❌ **OUTDATED** | Now CPTO of Lightning AI (lightning.ai). @voltagepark.com emails defunct. |
| Cameron Huang | VP Finance | ✅ (was) | ❓ **OUTDATED** | Voltage Park no longer independent. Current Lightning AI status unknown. |
| Elliot Darvick | SVP People & Operations | ✅ (was) | ❓ **OUTDATED** | Same — Lightning AI merger means domain + org unknown. |
| Jesica Church | VP Marketing | ✅ (was) | ❓ **OUTDATED** | Same — Lightning AI merger. |

**🔴 CRITICAL: Voltage Park ceased to exist as independent entity Jan 21, 2026. Replace with Lightning AI (lightning.ai) as the company. Contact Ozan Kaya at new Lightning AI email (ozan.kaya@lightning.ai permutations). Discard all @voltagepark.com emails.**

---

### 7. Applied Digital Corporation (`applieddigital.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Wes Cummins | Chairman & CEO | ✅ | ✅ | Confirmed founder, CEO & Chairman. NASDAQ:APLD. $16B contracted revenue. applieddigital.com/leadership. |
| Saidal Mohmand | CFO | ✅ | ✅ | CFO since October 15, 2024. Fmr EVP Finance at Applied Digital itself. SEC filings confirm. |
| Laura Laltrello | COO | ✅ | ❓ | Listed on applieddigital.com/leadership per source; no independent verification found. |
| Erin Kraxberger | CMO | ✅ | ❓ | Listed on applieddigital.com/leadership per source; no independent verification found. |
| Nick Phillips | EVP External Affairs | ✅ | ❓ | Listed on applieddigital.com/leadership per source; no independent verification found. |

**Overall: 2/5 high-confidence (Cummins, Mohmand). CTO noted as vacant since Jan 2025 — accurate per source file.**

---

### 8. Iris Energy / IREN (`irisenergy.co` → now `iren.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Daniel Roberts | Co-CEO & Co-Founder | ⚠️ Domain risk | ✅ | Role confirmed; company rebranded to IREN Nov 2024. Primary domain now iren.com. Emails may need to be @iren.com. |
| Will Roberts | Co-CEO & Co-Founder | ⚠️ Domain risk | ✅ | Same as Daniel. Both brothers confirmed co-CEOs. Shares +500% in 2025. |
| Anthony Lewis | CFO | ⚠️ Domain risk | ✅ | CFO since Sep 8, 2025 (confirmed Globe & Mail + TipRanks). Replaced Belinda Nucifora. Recent appointment — accurate. |
| Denis Skrinnikoff | CTO | ⚠️ Domain risk | ❓ | Listed on iren.com/leadership-team per source. No independent web verification found. |
| Lindsay Ward | President | ⚠️ Domain risk | ❓ | Listed on iren.com/leadership-team per source. No independent verification. |
| Kent Draper | CCO | ⚠️ Domain risk | ❓ | Listed on iren.com/leadership-team per source. No independent verification. |

**⚠️ Domain issue: Company is now IREN Limited (since Nov 2024). Primary website is iren.com. Use @iren.com email permutations, not @irisenergy.co. The irisenergy.co domain still exists for IR comms but iren.com is primary.**

---

### 9. Hut 8 (`hut8.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Asher Genoot | CEO | ✅ | ✅ | CEO since Feb 6, 2024. Forbes 30 Under 30. Also Executive Chairman of American Bitcoin Corp. |
| Sean Glennan | CFO | ✅ | ✅ | CFO since Aug 21, 2024. Fmr Citigroup MD (13 years). Globe Newswire + The Block confirmed. |
| Michael Ho | Chief Strategy Officer | ✅ | ❓ | Listed on hut8.com/about-us per source. No independent verification found. |
| Victor Semah | Chief Legal Officer | ✅ | ✅ | Confirmed in search — hired alongside Glennan in 2024 as CLO. hut8.com/about-us. |

**Overall: 3/4 high-confidence. Solid team. Note: no CTO at company level — Highrise AI (subsidiary) CTO is Mark Mendelman (as noted in source).**

---

### 10. Kasi Cloud (`kasicloud.com`)

| Contact | Role | Domain Match? | Web Verified? | Notes |
|---------|------|---------------|---------------|-------|
| Johnson Agogbua | CEO & Founder | ✅ | ✅ | Confirmed. Fmr Facebook, Console Connect. Lagos data center groundbreaking Apr 2022. Expected launch before H2 2026. |
| Rico Besse | VP Operations | ✅ | ❓ | Sourced from RocketReach only. No LinkedIn or other source listed. Low confidence — may be outdated. |
| Alexis Orjiako | GM Key Account Sales | ✅ | ❓ | Sourced from RocketReach only. No LinkedIn listed. Low confidence. |
| Victor Lawson | Senior Legal Counsel | ✅ | ❓ | Sourced from RocketReach only. No LinkedIn listed. Low confidence. |

**Overall: 1/4 high-confidence (Agogbua only). Sub-CEO contacts are RocketReach-only — verify before outreach. Small team (~50 employees); data center not yet launched (expected H2 2026).**

---

## Quality Score by Company

| Company | High Confidence | Low Confidence | Outdated/Flagged | Overall |
|---------|----------------|----------------|------------------|---------|
| CoreWeave | 5 | 2 | 0 | 🟢 Good |
| Lambda Labs | 3 | 2 | 0 | 🟢 Good |
| Crusoe Cloud | 2 | 3 | **1 (DeNezza CFO)** | 🟡 Fix CFO |
| Nebius Group | 1 | 5 | 0 | 🟡 Verify |
| Together AI | 3 | 3 | 0 | 🟢 Good |
| Voltage Park | 0 | 0 | **5 (ALL)** | 🔴 Replace |
| Applied Digital | 2 | 3 | 0 | 🟢 Good |
| Iris Energy/IREN | 3 | 3 | 0 | 🟡 Fix domain |
| Hut 8 | 3 | 1 | 0 | 🟢 Good |
| Kasi Cloud | 1 | 3 | 0 | 🟡 Verify |

---

## Recommended Actions

1. **🔴 Voltage Park**: Delete all contacts. Replace entity with "Lightning AI" (lightning.ai). Primary contacts: Ozan Kaya (President) and Saurabh Giri (CPTO). Use @lightning.ai domain permutations.

2. **🔴 Crusoe CFO**: Replace Matthew DeNezza with **Michael Gordon** (CFO + COO since Dec 2025). Email: michael.gordon@crusoe.ai / mgordon@crusoe.ai.

3. **🟡 Iris Energy**: Update domain to `@iren.com` for all email permutations. The @irisenergy.co domain is legacy/IR-only.

4. **🟡 Nebius contacts**: CFO (Maria del Dado Alonso Sanchez) and CTO (Danila Shtan) need deeper verification — sourced from low-quality sources. Check nebius.com directly or LinkedIn.

5. **🟡 Lambda/Crusoe/Together AI secondary contacts** (COOs, VPs Finance): Sourced from exa.ai/RocketReach/craft.co. Treat as low-confidence until verified via LinkedIn or company website.

6. **🟡 Kasi Cloud sub-CEO contacts**: RocketReach-only. Verify before outreach. Company is pre-revenue (data center not yet launched).

---
*Research completed: 2026-03-29 | Verification method: web search + domain analysis*
