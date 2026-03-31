/**
 * sources/job-postings.js — Job postings hiring signal enrichment
 *
 * Detects hiring signals by searching public job boards:
 *   - Greenhouse (greenhouse.io)
 *   - Lever (lever.co)
 *   - Ashby (ashbyhq.com)
 *
 * Extracts:
 *   - Total open role count (estimate)
 *   - Key leadership / decision-maker roles
 *   - Growth signals (many open roles)
 *   - Tech stack mentions (NVIDIA, GPU, CUDA, etc.)
 *   - Date of most recent posting
 *
 * Uses DuckDuckGo Lite (no API key). Falls back to direct ATS URL probing.
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { rateLimiter } = require('./rate-limiter');
const { ddgSearch } = require('./web-search');

const TIMEOUT_MS = 12000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0; +https://corgi.finance)';

// ── Role classification ───────────────────────────────────────────────────────

const DECISION_MAKER_ROLES = [
  /\b(cfo|chief financial officer)\b/i,
  /\b(cto|chief technology officer)\b/i,
  /\b(coo|chief operating officer)\b/i,
  /\b(cio|chief information officer)\b/i,
  /\bvp\s+(of\s+)?(finance|infrastructure|engineering|operations|technology|it)\b/i,
  /\bvice president\s+(of\s+)?(finance|infrastructure|engineering|operations|technology)\b/i,
  /\bhead of (finance|infrastructure|it|operations|engineering|technology|data center)\b/i,
  /\bdirector\s+(of\s+)?(finance|infrastructure|it|operations|engineering|technology)\b/i,
  /\bsvp\s+(finance|infrastructure|engineering|operations)\b/i,
  /\bmanaging director\b/i,
];

const GPU_TECH_MENTIONS = [
  /\bnvidia\b/i,
  /\bgpu\b/i,
  /\bcuda\b/i,
  /\ba100\b/i,
  /\bh100\b/i,
  /\bh200\b/i,
  /\bdgx\b/i,
  /\bhpc\b/i,
  /\bmachine learning infrastructure\b/i,
  /\bml infra\b/i,
  /\bai infrastructure\b/i,
  /\bdata center\b/i,
  /\baccelerator\b/i,
];

function isDecisionMakerRole(title) {
  return DECISION_MAKER_ROLES.some(re => re.test(title));
}

function detectTechMentions(text) {
  const found = [];
  for (const re of GPU_TECH_MENTIONS) {
    const m = text.match(re);
    if (m) found.push(m[0].toLowerCase());
  }
  return [...new Set(found)];
}

// ── ATS page fetchers ─────────────────────────────────────────────────────────

/**
 * Attempt to fetch the Greenhouse jobs board for a company slug.
 */
async function fetchGreenhouseJobs(slug) {
  return rateLimiter.run(async () => {
    const url = `https://boards.greenhouse.io/${slug}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const html = await res.text();
      const $ = cheerio.load(html);
      const jobs = [];
      // Greenhouse uses .opening elements
      $('.opening').each((_, el) => {
        const title = $(el).find('a').first().text().trim();
        const dept  = $(el).find('.department').text().trim();
        if (title) jobs.push({ title, department: dept || null, source: 'greenhouse' });
      });
      // Fallback: any <a> tags in job listing sections
      if (jobs.length === 0) {
        $('a[href*="/jobs/"]').each((_, el) => {
          const title = $(el).text().trim();
          if (title && title.length > 3) jobs.push({ title, department: null, source: 'greenhouse' });
        });
      }
      return jobs;
    } catch {
      clearTimeout(timer);
      return null;
    }
  });
}

/**
 * Attempt to fetch Lever jobs board for a company slug.
 */
async function fetchLeverJobs(slug) {
  return rateLimiter.run(async () => {
    const url = `https://jobs.lever.co/${slug}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const html = await res.text();
      const $ = cheerio.load(html);
      const jobs = [];
      // Lever uses .posting-title or .title
      $('.posting-title h5').each((_, el) => {
        const title = $(el).text().trim();
        if (title) jobs.push({ title, department: null, source: 'lever' });
      });
      if (jobs.length === 0) {
        $('a[href*="lever.co"]').each((_, el) => {
          const title = $(el).find('h5').text().trim() || $(el).text().trim();
          if (title && title.length > 3) jobs.push({ title, department: null, source: 'lever' });
        });
      }
      return jobs;
    } catch {
      clearTimeout(timer);
      return null;
    }
  });
}

/**
 * Generate plausible ATS slugs from a company name.
 * e.g. "Applied Digital Corp" → ["applied-digital", "applieddigital", "applied-digital-corp"]
 */
function generateSlugs(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\b(inc|corp|llc|ltd|co|the|group|holdings|capital|finance|technology|technologies)\b/gi, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const noHyphens = base.replace(/-/g, '');
  return [...new Set([base, noHyphens, base.slice(0, 20)])].filter(s => s.length > 2);
}

// ── DDG search for job postings ───────────────────────────────────────────────

async function searchJobPostings(companyName) {
  const queries = [
    `site:greenhouse.io "${companyName}" jobs`,
    `site:lever.co "${companyName}" jobs`,
    `site:ashbyhq.com "${companyName}" jobs`,
    `"${companyName}" careers jobs hiring 2024 2025`,
  ];

  const allResults = [];
  for (const query of queries) {
    const res = await ddgSearch(query);
    allResults.push(...res);
    await new Promise(r => setTimeout(r, 500));
  }

  // Deduplicate by URL
  const seen = new Set();
  return allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

/**
 * Extract role titles from DDG results.
 */
function extractRolesFromSnippets(results) {
  const roles = [];
  // Common role patterns
  const roleRe = /\b((?:(?:Senior|Staff|Principal|Lead|Head of|VP|SVP|Director of|Chief)\s+)?[A-Z][a-zA-Z\s]+(?:Engineer|Manager|Director|Officer|Analyst|Developer|Architect|Scientist|Designer|Lead|Specialist|Associate|Executive|Partner))\b/g;

  for (const { title, snippet } of results) {
    const text = `${title} ${snippet}`;
    let m;
    const re = new RegExp(roleRe.source, roleRe.flags);
    while ((m = re.exec(text)) !== null) {
      const role = m[1].trim();
      if (role.length > 5 && role.length < 80) {
        roles.push(role);
      }
    }
  }

  // Deduplicate
  const seen = new Set();
  return roles.filter(r => {
    if (seen.has(r)) return false;
    seen.add(r);
    return true;
  }).slice(0, 20);
}

/**
 * Count how many distinct job URLs appear in search results.
 */
function estimateJobCount(results) {
  const jobUrls = results.filter(r =>
    /greenhouse\.io|lever\.co|ashbyhq\.com|workday|bamboohr|indeed|linkedin\.com\/jobs/i.test(r.url)
  );
  return jobUrls.length;
}

/**
 * Try to extract a posting date from snippet text.
 */
function extractMostRecentDate(results) {
  const dateRe = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\b\d+ (day|week|hour|month)s? ago\b/gi;
  for (const { snippet } of results) {
    const m = snippet.match(dateRe);
    if (m) return m[0];
  }
  return null;
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData  - Must include at minimum: { name }
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'job-postings',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

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

  console.log(`[job-postings] Enriching company: ${name}`);

  try {
    // 1. DDG search for job postings
    const searchResults = await searchJobPostings(name);

    // 2. Attempt ATS direct scraping with generated slugs
    const slugs = generateSlugs(name);
    let directJobs = [];

    for (const slug of slugs.slice(0, 2)) {
      if (directJobs.length > 0) break;

      const ghJobs = await fetchGreenhouseJobs(slug);
      if (ghJobs && ghJobs.length > 0) {
        directJobs = ghJobs;
        break;
      }

      const lvJobs = await fetchLeverJobs(slug);
      if (lvJobs && lvJobs.length > 0) {
        directJobs = lvJobs;
        break;
      }
    }

    // 3. Parse roles from both sources
    const rolesFromSearch = extractRolesFromSnippets(searchResults);
    const allRoles = [
      ...directJobs.map(j => j.title),
      ...rolesFromSearch,
    ];

    const uniqueRoles = [...new Set(allRoles)].slice(0, 30);

    // 4. Classify roles
    const decisionMakerRoles = uniqueRoles.filter(r => isDecisionMakerRole(r));

    // 5. Detect tech mentions across all snippets + role titles
    const allText = [
      ...searchResults.map(r => `${r.title} ${r.snippet}`),
      ...uniqueRoles,
    ].join(' ');

    const techMentions = detectTechMentions(allText);

    // 6. Estimate total open roles
    const directCount = directJobs.length;
    const searchCount = estimateJobCount(searchResults);
    const totalOpenRoles = directCount > 0 ? directCount : searchCount;

    // 7. Growth signal heuristic
    let growthSignal = 'unknown';
    if (totalOpenRoles >= 20) growthSignal = 'rapid_growth';
    else if (totalOpenRoles >= 8)  growthSignal = 'growing';
    else if (totalOpenRoles >= 3)  growthSignal = 'stable';
    else if (totalOpenRoles > 0)   growthSignal = 'limited_hiring';
    else growthSignal = 'no_postings_found';

    const mostRecentDate = extractMostRecentDate(searchResults);

    result.data = {
      total_open_roles:       totalOpenRoles,
      open_roles_count:       totalOpenRoles,
      key_hires:              JSON.stringify(uniqueRoles.slice(0, 15)),
      growth_signal:          growthSignal,
      tech_mentions:          techMentions,
      decision_maker_hiring:  decisionMakerRoles.length > 0,
      decision_maker_roles:   decisionMakerRoles.slice(0, 5),
      most_recent_posting:    mostRecentDate,
      hiring_signals:         growthSignal !== 'no_postings_found' && growthSignal !== 'unknown'
        ? `${growthSignal} (${totalOpenRoles} open roles${decisionMakerRoles.length > 0 ? ', key hires: ' + decisionMakerRoles.slice(0, 2).join(', ') : ''})`
        : null,
      search_result_count:    searchResults.length,
      ats_source:             directJobs.length > 0 ? directJobs[0].source : 'search',
    };

    result.success = true;
    console.log(
      `[job-postings] ${name}: ~${totalOpenRoles} open roles, ` +
      `${decisionMakerRoles.length} decision-maker roles, ` +
      `growth=${growthSignal}, tech=${techMentions.join(',') || 'none'}`
    );

  } catch (err) {
    console.error(`[job-postings] Failed for ${name}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich, generateSlugs, isDecisionMakerRole };
