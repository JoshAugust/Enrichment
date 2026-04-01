/**
 * sources/funding-research.js — Funding & financial data enrichment
 *
 * Discovers funding rounds, investors, and financial signals via:
 *   - Web search for funding announcements and press releases
 *   - SEC EDGAR full-text search for public company filings
 *   - Crunchbase-style signals from search snippets
 *
 * No paid APIs — uses only public web data.
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { ddgSearch } = require('./web-search');
const { rateLimiter } = require('./rate-limiter');

const TIMEOUT_MS = 12000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)';

// ── Amount parsing ────────────────────────────────────────────────────────────

const AMOUNT_RE = /\$\s*(\d+(?:\.\d+)?)\s*(billion|million|bn|mn|[BMK])\b/gi;

/**
 * Parse dollar amounts from text into a canonical string.
 */
function parseAmounts(text) {
  const amounts = [];
  let m;
  const re = new RegExp(AMOUNT_RE.source, AMOUNT_RE.flags);
  while ((m = re.exec(text)) !== null) {
    const num = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    let usd;
    if (unit === 'billion' || unit === 'bn' || unit === 'b') usd = num * 1e9;
    else if (unit === 'million' || unit === 'mn' || unit === 'm') usd = num * 1e6;
    else if (unit === 'k') usd = num * 1e3;
    else usd = num;
    amounts.push({ raw: m[0].trim(), usd });
  }
  return amounts;
}

/**
 * Pick the largest amount from a list (likely to be total raise).
 */
function largestAmount(amounts) {
  if (!amounts || amounts.length === 0) return null;
  return amounts.reduce((max, a) => a.usd > max.usd ? a : max, amounts[0]);
}

// ── Round detection ───────────────────────────────────────────────────────────

const ROUND_RE = /\b(pre-seed|seed|series [a-f]|growth equity|growth round|debt round|credit facility|venture round|mezzanine|bridge round|ipo|spac)\b/gi;

function detectRounds(text) {
  const rounds = [];
  let m;
  const re = new RegExp(ROUND_RE.source, ROUND_RE.flags);
  while ((m = re.exec(text)) !== null) {
    rounds.push(m[1]);
  }
  return [...new Set(rounds)];
}

// ── Investor extraction ───────────────────────────────────────────────────────

const INVESTOR_PREFIXES = [
  'led by', 'led the round', 'invested by', 'backed by', 'investors include',
  'participation from', 'joined by', 'co-invested', 'with participation',
];

/**
 * Extract investor names from funding snippets.
 * Looks for patterns like "led by [VC Name]", "investors include X, Y".
 */
function extractInvestors(text) {
  const investors = [];

  // Pattern: "led by X Capital", "X Ventures led the round"
  const ledByRe = /(?:led by|backed by|invested by)\s+([A-Z][A-Za-z\s&]+(?:Capital|Ventures|Partners|Equity|Investments|Fund|Growth|Asset|Management)?)/g;
  let m;
  while ((m = ledByRe.exec(text)) !== null) {
    investors.push(m[1].trim().replace(/\s+/g, ' '));
  }

  // Pattern: "investors include X, Y, and Z"
  const includesRe = /investors? (?:include|included|participating)\s*:?\s*([^.]+)/gi;
  while ((m = includesRe.exec(text)) !== null) {
    // Split by commas and "and"
    const names = m[1]
      .split(/,\s*|\s+and\s+/)
      .map(n => n.trim())
      .filter(n => n.length > 2 && n.length < 60 && /^[A-Z]/.test(n));
    investors.push(...names);
  }

  // Deduplicate and clean
  const seen = new Set();
  return investors
    .map(i => i.replace(/\s+/g, ' ').trim())
    .filter(i => {
      if (seen.has(i) || i.length < 3) return false;
      seen.add(i);
      return true;
    })
    .slice(0, 10);
}

// ── SEC EDGAR search ──────────────────────────────────────────────────────────

/**
 * Search SEC EDGAR full-text search for a company name.
 * Returns recent filings metadata.
 */
async function searchEdgar(companyName) {
  return rateLimiter.run(async () => {
    const query = encodeURIComponent(companyName);
    const url = `https://efts.sec.gov/LATEST/search-index?q=%22${query}%22&dateRange=custom&startdt=2022-01-01&forms=8-K,10-K,S-1&hits.hits.total.value=true&hits.hits._source.period_of_report=true`;

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
      const hits = data?.hits?.hits || [];

      return hits.slice(0, 5).map(h => ({
        form: h._source?.form_type,
        company: h._source?.display_names?.[0]?.name,
        date: h._source?.file_date,
        description: h._source?.period_of_report,
      }));
    } catch {
      clearTimeout(timer);
      return [];
    }
  });
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'funding-research',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  // Only relevant for companies
  if (entityType !== 'company') {
    result.success = true;
    result.skipped = true;
    return result;
  }

  const { name, total_raised } = existingData;
  if (!name) {
    result.success = false;
    result.error = 'Company name required';
    return result;
  }

  console.log(`[funding-research] Enriching: ${name}`);

  try {
    // Run multiple searches in sequence (rate limited)
    const queries = [
      `"${name}" funding round raised 2023 2024 2025`,
      `"${name}" credit facility debt financing investors`,
      `"${name}" series funding valuation`,
    ];

    const allResults = [];
    for (const query of queries) {
      const res = await ddgSearch(query);
      allResults.push(...res);
    }

    // Aggregate all text
    const allText = allResults
      .map(r => `${r.title} ${r.snippet}`)
      .join('\n');

    const amounts = parseAmounts(allText);
    const rounds = detectRounds(allText);
    const investors = extractInvestors(allText);
    const largest = largestAmount(amounts);

    // Gather news items with funding categories
    const fundingNews = allResults
      .filter(r => /fund|rais|invest|capitaliz|credit facilit/i.test(`${r.title} ${r.snippet}`))
      .map(r => ({
        title: r.title.slice(0, 120),
        snippet: r.snippet.slice(0, 200),
        url: r.url,
      }))
      .slice(0, 5);

    // SEC EDGAR check for public filings
    const edgarFilings = await searchEdgar(name);

    result.data = {
      amounts,
      rounds,
      investors,
      largestRaise: largest ? largest.raw : null,
      fundingNews,
      edgarFilings,
      searchResultCount: allResults.length,
    };

    // Map to top-level DB fields (only if we found something and don't already have it)
    if (largest && !total_raised) {
      result.data.total_raised = largest.raw;
    }
    if (rounds.length > 0) {
      result.data.last_funding_round = rounds[rounds.length - 1];
    }
    if (investors.length > 0) {
      result.data.investors = investors.slice(0, 5).join(', ');
    }

    result.success = true;
    console.log(`[funding-research] ${name}: ${amounts.length} amounts, ${rounds.length} rounds, ${investors.length} investors, ${edgarFilings.length} EDGAR filings`);

  } catch (err) {
    console.error(`[funding-research] Failed for ${name}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich, parseAmounts, extractInvestors };
