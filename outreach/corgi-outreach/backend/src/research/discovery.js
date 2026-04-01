/**
 * discovery.js — Discover new GPU infrastructure companies beyond the initial 20
 *
 * Constructs search queries targeting:
 *   - GPU cloud providers / AI infrastructure operators
 *   - Data center GPU financing participants
 *   - Private credit funds active in AI infra debt
 *
 * Uses web search via DuckDuckGo HTML endpoint (no API key required).
 * Returns an array of company candidates ready to be inserted into the DB.
 */

'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)';
const SEARCH_DELAY_MS = 1200; // polite delay between queries
const MAX_RESULTS_PER_QUERY = 8;

// ── Search Query Templates ────────────────────────────────────────────────────

const DISCOVERY_QUERIES = [
  // Operators
  'GPU cloud provider AI infrastructure startup 2024',
  'AI data center GPU cluster operator financing',
  'high performance computing cloud GPU fleet operator',
  'bare metal GPU cloud provider dedicated AI compute',
  // Lenders
  'data center GPU financing private credit fund 2024',
  'AI infrastructure debt facility equipment finance lender',
  'GPU-backed credit facility private credit firm',
  // Arrangers
  'AI infrastructure debt arranger structured finance',
  'GPU hardware financing advisory capital markets',
  // Specific signals
  'GPU residual value financing data center',
  '"credit facility" "GPU" "data center" 2024',
  '"equipment finance" "GPU" OR "AI infrastructure" fund',
];

// ── DuckDuckGo HTML scraper (fallback, no API key) ────────────────────────────

async function searchDuckDuckGo(query) {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html',
      },
      timeout: 8000,
    });
    if (!res.ok) return [];
    const html = await res.text();
    return parseDDGResults(html, query);
  } catch (err) {
    console.warn(`[discovery] DDG search failed for "${query}": ${err.message}`);
    return [];
  }
}

function parseDDGResults(html, query) {
  const $ = cheerio.load(html);
  const results = [];

  $('.result').each((_, el) => {
    const title = $(el).find('.result__title').text().trim();
    const snippet = $(el).find('.result__snippet').text().trim();
    const url = $(el).find('.result__url').text().trim();

    if (title && snippet) {
      results.push({ title, snippet, url, query });
    }
  });

  return results.slice(0, MAX_RESULTS_PER_QUERY);
}

// ── Result → Company Candidate ────────────────────────────────────────────────

/**
 * Heuristic: infer company type from search result title + snippet.
 */
function inferTypeFromSnippet(text) {
  const lower = text.toLowerCase();
  if (/private credit|lending|credit fund|equipment finance|debt fund/.test(lower)) return 'lender';
  if (/arranger|advisory|placement|structured finance|capital markets/.test(lower)) return 'arranger';
  return 'operator'; // default — most GPU companies we'll find are operators
}

/**
 * Infer priority — new discoveries start at C unless we see strong signals.
 */
function inferPriority(text) {
  const lower = text.toLowerCase();
  const strongSignals = ['series b', 'series c', '$100m', '$200m', '$500m', 'billion', 'large-scale'];
  if (strongSignals.some((s) => lower.includes(s))) return 'B';
  return 'C';
}

/**
 * Convert a raw search result into a company candidate record.
 * These are NOT yet in the database; they need human review before insertion.
 */
function resultToCandidate(result) {
  const combined = `${result.title} ${result.snippet}`;
  const type = inferTypeFromSnippet(combined);
  const priority = inferPriority(combined);

  // Attempt to extract a clean company name from the title
  // Title is often "Company Name - Description" or "Company Name | ..."
  const nameMatch = result.title.split(/[-|:]/)[0].trim();

  return {
    id: uuidv4(),
    name: nameMatch || result.title,
    type,
    website: result.url ? `https://${result.url.replace(/^https?:\/\//, '').split('/')[0]}` : null,
    description: result.snippet.slice(0, 500),
    priority,
    industry_segment: type === 'lender' ? 'Private Credit' : 'AI Infrastructure',
    estimated_gpu_scale: 'unknown',
    financing_status: 'unknown',
    qualification_score: 0,
    source_query: result.query,
    needs_review: true,       // flag: do not auto-insert without human review
  };
}

// ── Deduplication ─────────────────────────────────────────────────────────────

/**
 * Remove duplicate candidates by normalized name.
 * Also excludes names matching existing companies.
 */
function deduplicate(candidates, existingNames = []) {
  const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const seen = new Set(existingNames.map(normalize));
  const unique = [];

  for (const c of candidates) {
    const key = normalize(c.name);
    if (!seen.has(key) && key.length > 2) {
      seen.add(key);
      unique.push(c);
    }
  }

  return unique;
}

// ── Main discovery function ───────────────────────────────────────────────────

/**
 * Run all discovery queries and return de-duplicated company candidates.
 *
 * @param {string[]} existingCompanyNames - Names already in the DB (for dedup)
 * @param {string[]} [queries]            - Override default queries (optional)
 * @returns {Promise<CompanyCandidate[]>}
 */
async function discoverCompanies(existingCompanyNames = [], queries = DISCOVERY_QUERIES) {
  console.log(`[discovery] Starting discovery with ${queries.length} queries...`);
  const allResults = [];

  for (const query of queries) {
    const results = await searchDuckDuckGo(query);
    console.log(`[discovery] "${query}" → ${results.length} results`);
    allResults.push(...results);

    // Polite delay between queries
    await new Promise((r) => setTimeout(r, SEARCH_DELAY_MS));
  }

  console.log(`[discovery] Total raw results: ${allResults.length}`);

  const candidates = allResults.map(resultToCandidate);
  const unique = deduplicate(candidates, existingCompanyNames);

  console.log(`[discovery] Unique candidates after dedup: ${unique.length}`);
  return unique;
}

module.exports = { discoverCompanies, DISCOVERY_QUERIES };
