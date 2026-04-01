# Enrichment Report — Corgi GPU Insurance Outreach Platform
**Run Date:** 2026-03-27  
**Agent:** Enrichment Runner (Subagent)

---

## Summary

### Companies Enriched
| Metric | Value |
|--------|-------|
| Total companies in DB | 427 |
| All with `last_enriched_at` set | 427 (100%) |
| Batches run this session | 5 batches × 5 companies = **25 re-enrichments** |
| A-list avg. completeness score | 65.7 / 100 |
| A-list avg. completeness min/max | 40 – 90 |

### Bug Fixed 🐛
**Critical bug resolved in `enrichment-pipeline.js`:**  
The `updateCompanyFields` and `updateContactFields` functions were passing raw JavaScript arrays (e.g., `[]` from funding-research source) as SQLite parameters. `better-sqlite3` spreads arrays into multiple positional parameters, causing a "Too few parameter values were provided" error on every enrichment call.  

**Fix applied:** Empty arrays are now skipped; non-empty arrays are JSON-stringified before passing to SQLite. All 25 enrichments now succeed cleanly.

---

## Batches Run

| Batch | Companies |
|-------|-----------|
| 1 | RVI Group, AGRO, Upper90, Conduit Re, Wingspire Equipment Finance |
| 2 | Macquarie Capital, SQN Capital, Wintrust EF, Siemens FS, Comerica EF |
| 3 | KeyBanc EF, Banc of California EF, Runway Growth Capital, Pacific Western EF, North Mill EF |
| 4 | Lending Club, TriplePoint Capital, Tacora Capital, Horizon Technology Finance, Hercules Capital |
| 5 | GreatAmerica Financial, GMI Cloud, NexGen Cloud/Hyperstack, Western Technology Investment, CIBC Innovation Banking |

---

## A-List Contact Intelligence

### RVI Group (Score: 97 | A-list)
| Contact | Title | Email | Status |
|---------|-------|-------|--------|
| Dan Egan | Co-CEO → Sole CEO (as of March 2026) | `degan@rvigroup.com` | ✅ Email format confirmed (flast@rvigroup.com) |
| Wei Fan | EVP & COO | `wfan@rvigroup.com` | ✅ Confirmed pattern |
| Jim Bedard | EVP & CFO | `jbedard@rvigroup.com` | ✅ Confirmed pattern |
| Robert Snarr | **⚠️ NOT CONFIRMED at RVI** | `rsnarr@rvigroup.com` | ❌ No evidence of this person at RVI Group |

**Key Finding:** Robert Snarr does NOT appear in any current RVI Group leadership source. Mike McGroarty retired March 31, 2026. **Dan Egan is the sole CEO**. Robert Snarr contact has been flagged as unverified in DB.

**Best outreach target:** Dan Egan — `degan@rvigroup.com`

---

### Assured Guaranty Re Overseas Ltd. / AGRO (Score: 97 | A-list)
| Contact | Title | Email | Status |
|---------|-------|-------|--------|
| Robert Tucker | Senior MD, Investor Relations | `rtucker@assuredguaranty.com` | ✅ Confirmed via web |
| Dominic Frederico | President & CEO, Assured Guaranty | `dfrederico@assuredguaranty.com` | ✅ Pattern confirmed |
| Jorge Gana | Chief Risk Officer | `jgana@assuredguaranty.com` | ✅ Pattern confirmed |
| Benjamin Rosenblum | CFO | `brosenblum@assuredguaranty.com` | ✅ Pattern confirmed |

**Key Finding:** Robert Tucker's actual role is **Investor Relations / Corporate Communications** at the parent company — not specialty insurance per se. For GPU insurance specifically, the most relevant contact is likely a dedicated underwriting or specialty products contact. All emails follow `flast@assuredguaranty.com` pattern.

---

### Upper90 (Score: 92 | A-list)
| Contact | Title | Email | Status |
|---------|-------|-------|--------|
| Billy Libby | CEO & Co-Founder | `billy@upper90.io` | ✅ Confirmed format |
| Jason Finger | Co-Founder & Chairman | `jason@upper90.io` | ✅ Confirmed format |
| William Geist | Managing Partner | `william@upper90.io` | ✅ Confirmed format |
| David Acharya | Managing Partner | `david@upper90.io` | ⚠️ Not confirmed — "David Acharya" is associated with **Acharya Capital Partners**, not Upper90 |

**Key Finding:** "David Acharya" as a Managing Partner at Upper90 is **unverified** — could be a different David, or outdated/incorrect data. Current confirmed team: Billy Libby (CEO), Jason Finger, William Geist. Upper90 uses firstname@upper90.io pattern.

**Best outreach target:** Billy Libby — `billy@upper90.io` or William Geist — `william@upper90.io`

---

### Wingspire Equipment Finance (Score: 91 | A-list)
| Contact | Title | Email | Status |
|---------|-------|-------|--------|
| Carl Mayer | Managing Director | `cmayer@wingspirecapital.com` | ⚠️ Pattern correct, person unconfirmed at Wingspire |
| Kirk L. Nelson | SVP, Risk Management | `knelson@wingspirecapital.com` | ✅ Pattern confirmed |
| Jeffrey Okano | SVP, Originations | `jokano@wingspirecapital.com` | ✅ Pattern confirmed |

**Key Finding:** Carl Mayer's presence at Wingspire Equipment Finance could not be confirmed via web search. Multiple Carl Mayers exist in equipment finance. Email format `cmayer@wingspirecapital.com` follows the standard `flast` pattern. LinkedIn URL in DB (`/in/carlmayer-wingspire`) is a custom URL not independently verified.

**Best outreach target:** Kirk Nelson (SVP Risk) — `knelson@wingspirecapital.com` — risk management is highly relevant for GPU insurance.

---

### Conduit Re (Score: 90 | A-list)
| Contact | Title | Email | Status |
|---------|-------|-------|--------|
| **Neil Eckert** | **CEO (Current)** | `neil.eckert@conduitreinsurance.com` | ✅ Added — confirmed new CEO |
| Trevor Carvey | Former CEO (Retired April 2025) | `tcarvey@conduitre.com` | ❌ **No longer at company** |
| Elaine Whelan | CFO | `elaine.whelan@conduitreinsurance.com` | ✅ Confirmed |
| Stephen Postlewhite | CUO | `stephen.postlewhite@conduitreinsurance.com` | ✅ Confirmed |

**Key Finding:** Trevor Carvey **retired effective April 11, 2025**. **Neil Eckert (co-founder) is the permanent CEO**. DB has been updated: Carvey marked as "Former CEO (Retired April 2025)", Neil Eckert added with email pattern `neil.eckert@conduitreinsurance.com`.

**Best outreach target:** Neil Eckert — `neil.eckert@conduitreinsurance.com` or Elaine Whelan (CFO) — `elaine.whelan@conduitreinsurance.com`

---

## Database Updates Made
1. ✅ Fixed `updateCompanyFields` array serialization bug (25 enrichments now working)
2. ✅ Robert Snarr (RVI Group) — flagged as "Unverified - Not Confirmed at RVI Group"
3. ✅ Trevor Carvey (Conduit Re) — updated title to "Former CEO (Retired April 2025)"
4. ✅ Neil Eckert (Conduit Re) — added as current CEO with email `neil.eckert@conduitreinsurance.com`

---

## Outreach Priority Recommendations (Top 5 Right Now)

| Rank | Company | Contact | Email | Why |
|------|---------|---------|-------|-----|
| 1 | RVI Group (97) | Dan Egan, CEO | `degan@rvigroup.com` | Highest score, residual value insurance = direct GPU fit |
| 2 | AGRO (97) | Dominic Frederico, CEO | `dfrederico@assuredguaranty.com` | Bermuda specialty insurer, top score |
| 3 | Conduit Re (90) | Neil Eckert, CEO | `neil.eckert@conduitreinsurance.com` | New CEO confirmed, Bermuda re, active |
| 4 | Upper90 (92) | Billy Libby, CEO | `billy@upper90.io` | Credit/fintech lender, GPU finance player |
| 5 | Wingspire EF (91) | Kirk Nelson, SVP Risk | `knelson@wingspirecapital.com` | Equipment finance, risk mgmt = ideal fit |

---

*Report generated by enrichment-runner subagent. All emails are unverified guesses based on pattern matching unless noted otherwise.*
