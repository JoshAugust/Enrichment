# Corgi Outreach — Launch Checklist

Generated: 2026-03-22

---

## Platform Readiness

- [x] **Email templates loaded** — 7 templates seeded
  - Cold Intro — GPU Operator
  - Cold Intro — Lender
  - Cold Intro — Reinsurer/Arranger
  - Follow-Up 1 (Day 3)
  - Follow-Up 2 (Day 7)
  - Follow-Up 3 / Break-Up (Day 14)
  - Warm Intro

- [x] **Call scripts loaded** — 49 A-tier company scripts seeded (73 total in DB)
  - Version A (Cheaper Capital) → operators
  - Version B (Better Debt Structure) → operators (alt)
  - Version C (Lender Angle) → lenders
  - Version D (Operator Pain) → operators (alt)
  - Version E (Simple CTA) → arrangers / reinsurers / fallback

- [x] **A-tier email drafts generated** — 67 personalized drafts created
  - 49 A-tier companies covered
  - Drafts matched to buyer type (operator / lender / arranger)
  - Merge fields rendered: contact_name, company_name, gpu_fleet_scale, contact_title
  - All drafts in `status = 'draft'` (not sent)

- [x] **Pipeline pre-filled** — 49 A-tier companies set to `outreach_status = 'queued'`

---

## Before You Fire

- [ ] **Gmail SMTP configured** — needs Josh's app password in `.env`
  ```
  SMTP_USER=joshua.m.augustine@gmail.com
  SMTP_PASS=<16-char app password from myaccount.google.com/apppasswords>
  ```

- [ ] **DRY_RUN mode disabled** — currently everything is read-only / draft status
  ```
  DRY_RUN=false   # in backend/.env
  ```

- [ ] **From-email / signature configured**
  ```
  FROM_EMAIL=joshua.m.augustine@gmail.com
  FROM_NAME=Corgi Team
  ```

- [ ] **First batch reviewed and approved by Josh**
  - Open the dashboard → Email Drafts
  - Review 5-10 drafts across operator / lender / arranger buckets
  - Approve drafts you want to send: `status = 'approved'`

- [ ] **Send first 10 emails**
  - Start with 10 highest-confidence A-tier contacts
  - Suggested order: operators first (TensorWave, Upper90 lenders, Victory Park)
  - Monitor opens before sending next batch

---

## DB State (at last seed run)

| Table           | Count |
|-----------------|-------|
| email_templates | 7     |
| call_scripts    | 73    |
| email_drafts    | 76    |
| companies (A)   | 49    |
| queued (A-tier) | 49    |

---

## Positioning Reminder

> All copy uses **cost of capital** framing — not insurance.  
> Say "Guaranty" not "Guarantee".  
> Stay in the capital-markets frame: debt structure · collateral · residual value floor · underwriting confidence.  
> Never mention: reinsurance · Cayman · Lloyd's · captive · policy wording · put option.
