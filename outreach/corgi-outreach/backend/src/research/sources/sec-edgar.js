/**
 * sources/sec-edgar.js — SEC EDGAR enrichment source
 *
 * Queries the SEC EDGAR full-text search and submissions APIs to surface:
 *   - Public company filing metadata (10-K, 10-Q)
 *   - GPU/equipment asset values from balance sheets
 *   - Depreciation schedules and capex mentions
 *   - Debt covenants referencing equipment
 *   - Named officers
 *   - Revenue figures
 *
 * Free — no API key required.
 * EDGAR User-Agent policy: must identify your application + contact email.
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');
const { rateLimiter } = require('./rate-limiter');

const TIMEOUT_MS = 15000;
const USER_AGENT = 'CorgiOutreach/1.0 (josh@corgi.com)';

// ── EDGAR API helpers ─────────────────────────────────────────────────────────

/**
 * Search EDGAR full-text search index for a company + form types.
 * Returns the raw hits array.
 */
async function edgarSearch(companyName, forms = '10-K,10-Q') {
  return rateLimiter.run(async () => {
    const q = encodeURIComponent(`"${companyName}"`);
    const url = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=${forms}&dateRange=custom&startdt=2023-01-01&enddt=2026-12-31`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) {
        console.warn(`[sec-edgar] EDGAR search HTTP ${res.status} for "${companyName}"`);
        return [];
      }
      const data = await res.json();
      return data?.hits?.hits || [];
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[sec-edgar] EDGAR search failed for "${companyName}": ${err.message}`);
      return [];
    }
  });
}

/**
 * Fetch company submissions (filings list + entity metadata) from EDGAR.
 * @param {string} cik  Zero-padded 10-digit CIK string, e.g. "0001234567"
 */
async function fetchSubmissions(cik) {
  return rateLimiter.run(async () => {
    const paddedCik = cik.padStart(10, '0');
    const url = `https://data.sec.gov/submissions/CIK${paddedCik}.json`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[sec-edgar] Submissions fetch failed for CIK ${cik}: ${err.message}`);
      return null;
    }
  });
}

/**
 * Search full-text EDGAR for GPU/equipment terms in context of a company.
 */
async function edgarFullTextSearch(companyName, term) {
  return rateLimiter.run(async () => {
    const q = encodeURIComponent(`"${term}" "${companyName}"`);
    const url = `https://efts.sec.gov/LATEST/search-index?q=${q}&forms=10-K,10-Q&dateRange=custom&startdt=2023-01-01&enddt=2026-12-31`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      });
      clearTimeout(timer);
      if (!res.ok) return [];
      const data = await res.json();
      return data?.hits?.hits || [];
    } catch (err) {
      clearTimeout(timer);
      return [];
    }
  });
}

// ── Parsers ───────────────────────────────────────────────────────────────────

/**
 * Extract dollar amounts preceded by context keywords.
 */
function extractAmountsWithContext(text) {
  const results = [];
  const re = /([^.]{0,80})(\$[\d,]+(?:\.\d+)?\s*(?:million|billion|thousand|mn|bn|[BMK])?)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    results.push({ context: m[1].trim(), amount: m[2].trim() });
  }
  return results.slice(0, 10);
}

/**
 * Pull named officers from EDGAR submissions JSON.
 */
function extractOfficers(submissions) {
  if (!submissions?.officers) return [];
  return submissions.officers.map(o => ({
    name: o.name,
    title: o.title,
  }));
}

/**
 * Build a structured filings list from hits.
 */
function parseFilings(hits) {
  return hits.slice(0, 10).map(h => ({
    form: h._source?.form_type || 'unknown',
    company: (h._source?.display_names || [])[0]?.name || null,
    cik: (h._source?.display_names || [])[0]?.id || null,
    filedAt: h._source?.file_date || null,
    periodOfReport: h._source?.period_of_report || null,
    accessionNo: h._source?.accession_no || null,
  }));
}

/**
 * Scan filing snippets for GPU/equipment signals.
 */
const GPU_RE = /gpu|graphics processing unit|nvidia|a100|h100|h200|b200|dgx|hgx/i;
const DEPRECIATION_RE = /depreciation|useful life|straight.line|accelerated depreciation/i;
const CAPEX_RE = /capital expenditure|capex|property and equipment purchases|purchases of property/i;
const COVENANT_RE = /covenant|equipment lien|collateral|pledged equipment|security interest/i;
const REVENUE_RE = /total revenue|net revenue|revenue of \$|revenues were \$|revenues totaled/i;

function scanSnippets(hits, label) {
  const matches = [];
  for (const h of hits) {
    const snippet = h._source?.file_summary || h._source?.period_of_report || '';
    const entityName = (h._source?.display_names || [])[0]?.name || '';
    if (snippet) {
      matches.push({
        term: label,
        entity: entityName,
        form: h._source?.form_type,
        date: h._source?.file_date,
        snippet: snippet.slice(0, 300),
      });
    }
  }
  return matches;
}

// ── Known public company tickers → CIK map (bootstrapped) ───────────────────
// CIKs are stable. These are pre-seeded for our target companies.
const KNOWN_CIKS = {
  'APLD':  '0001841514', // Applied Digital
  'HTGC':  '0001287286', // Hercules Capital
  'TRIN':  '0001590976', // Trinity Capital
  'HRZN':  '0001472614', // Horizon Technology Finance
  'SAR':   '0001377936', // Saratoga Investment
  // OVHcloud is a French company (Euronext) — not on SEC EDGAR
};

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData  - Must include at minimum: { name, sec_ticker? }
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'sec-edgar',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  // Only meaningful for companies
  if (entityType !== 'company') {
    result.success = true;
    result.skipped = true;
    return result;
  }

  const name = existingData.name;
  if (!name) {
    result.success = false;
    result.error = 'Company name required';
    return result;
  }

  console.log(`[sec-edgar] Enriching company: ${name}`);

  try {
    // 1. Determine CIK — check known map first, then search EDGAR
    let cik = existingData.sec_cik || null;
    let ticker = existingData.sec_ticker || null;

    // Look up by ticker if we have one
    if (!cik && ticker && KNOWN_CIKS[ticker.toUpperCase()]) {
      cik = KNOWN_CIKS[ticker.toUpperCase()];
    }

    // Try to find CIK from name if still not known
    let filingHits = [];
    if (!cik) {
      filingHits = await edgarSearch(name);
      if (filingHits.length > 0) {
        const firstCikRaw = (filingHits[0]._source?.display_names || [])[0]?.id;
        if (firstCikRaw) cik = firstCikRaw.padStart(10, '0');
      }
    } else {
      // We have CIK — fetch filings directly
      filingHits = await edgarSearch(name);
    }

    if (filingHits.length === 0 && !cik) {
      console.log(`[sec-edgar] ${name}: not found on EDGAR — likely private`);
      result.success = true;
      result.skipped = true;
      result.data = { not_public: true };
      return result;
    }

    const filings = parseFilings(filingHits);

    // 2. Fetch company submissions metadata (officers, latest filings)
    let submissions = null;
    let officers = [];
    if (cik) {
      submissions = await fetchSubmissions(cik);
      if (submissions) {
        officers = extractOfficers(submissions);
        if (!ticker && submissions.tickers?.length > 0) {
          ticker = submissions.tickers[0];
        }
      }
    }

    // 3. Full-text searches for financial signals (in parallel via rate limiter queue)
    const [gpuHits, deprecHits, capexHits, covenantHits, revenueHits] = await Promise.all([
      edgarFullTextSearch(name, 'GPU'),
      edgarFullTextSearch(name, 'depreciation'),
      edgarFullTextSearch(name, 'capital expenditures'),
      edgarFullTextSearch(name, 'equipment collateral'),
      edgarFullTextSearch(name, 'total revenue'),
    ]);

    const gpuSignals    = scanSnippets(gpuHits, 'GPU');
    const deprecSignals = scanSnippets(deprecHits, 'depreciation');
    const capexSignals  = scanSnippets(capexHits, 'capex');
    const covenantSigs  = scanSnippets(covenantHits, 'equipment-covenant');
    const revenueSignals= scanSnippets(revenueHits, 'revenue');

    // Pull amounts from revenue snippets
    const revenueAmounts = revenueSignals.flatMap(s =>
      extractAmountsWithContext(s.snippet)
        .filter(a => REVENUE_RE.test(a.context))
        .map(a => a.amount)
    );

    const gpuAssetValue = gpuSignals.length > 0
      ? gpuSignals.flatMap(s => extractAmountsWithContext(s.snippet).map(a => a.amount)).slice(0, 3)
      : [];

    result.data = {
      sec_filings:           filings,
      sec_ticker:            ticker || null,
      sec_cik:               cik || null,
      gpu_asset_value:       gpuAssetValue.length > 0 ? gpuAssetValue.join('; ') : null,
      depreciation_schedule: deprecSignals.length > 0 ? JSON.stringify(deprecSignals.slice(0, 3)) : null,
      capex:                 capexSignals.length > 0   ? JSON.stringify(capexSignals.slice(0, 3)) : null,
      equipment_covenants:   covenantSigs.length > 0   ? JSON.stringify(covenantSigs.slice(0, 3)) : null,
      officers:              officers.slice(0, 10),
      revenue:               revenueAmounts.slice(0, 3).join('; ') || null,
      gpu_signal_count:      gpuSignals.length,
      filing_count:          filings.length,
    };

    result.success = true;
    console.log(
      `[sec-edgar] ${name}: ${filings.length} filings, ${gpuSignals.length} GPU hits, ` +
      `${officers.length} officers, CIK=${cik}`
    );

  } catch (err) {
    console.error(`[sec-edgar] Failed for ${name}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich, edgarSearch, fetchSubmissions };
