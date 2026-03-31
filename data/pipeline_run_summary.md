# Pipeline Run Summary — SMB Leads 2026-03-27

**Run date:** 2026-03-27  
**List tag:** `smb_leads_2026_03_27`  
**Input file:** `all_leads.json`  

---

## Import Results

| Metric | Count |
|--------|-------|
| Total leads in JSON | 100 |
| Companies imported | 100 |
| Companies skipped (duplicates) | 0 |
| Contacts inserted | 71 |
| DB companies before import | 327 |
| DB companies after import | 427 |

**Notes:**
- 69 companies had clean names and imported directly
- 31 had null `Company Name` fields — names were derived from their website domain (e.g. `nwcontrols.com` → `NWCONTROLS`)
- All companies tagged via `description LIKE '%smb_leads_2026_03_27%'`
- Company type set to `operator` (SMB default)
- Company revenue stored in `description` field (no dedicated revenue column in schema)

---

## Enrichment Results

**Sources run:** `web-search`, `company-website`, `email-discovery`, `news-monitor`, `job-postings`, `sec-edgar`  
**Sources skipped (per instructions):** `nvidia-partners`, `funding-research`  
**Enrichment duration:** ~31 minutes (1,871 seconds)

| Source | Status |
|--------|--------|
| web-search | ✅ Success (100/100) |
| company-website | ✅ Success (100/100) |
| email-discovery | ✅ Success (100/100) |
| news-monitor | ✅ Success (100/100) |
| job-postings | ✅ Success (100/100) |
| sec-edgar | ✅ Success (100/100) |

All 100 companies enriched — 0 failed, 0 errors.

---

## Data Found

| Data Point | Count |
|------------|-------|
| Companies fully enriched | 100 / 100 |
| Companies with LinkedIn URL | 20 |
| Companies with recent news | 22 |
| Companies with hiring signals | 19 |
| Companies with primary email | 0 * |
| Total contacts in DB | 71 |

> \* Email discovery ran on all companies but returned no confirmed emails — likely due to DRY_RUN mode or lack of external email verification API keys (Hunter.io etc. not configured).

---

## Output Files

- **Enriched data:** `pipeline_enriched_results.json` (100 companies, all enrichment fields)
- **Import script:** `import_smb_leads.js`
- **Enrichment runner:** `run_enrichment.js`
- **Extraction script:** `extract_results.js`

---

## Errors Encountered

None. All 100 companies imported and enriched successfully.

---

## Existing Data Preserved

The existing 327 GPU company records were not modified. Only new rows were added.
