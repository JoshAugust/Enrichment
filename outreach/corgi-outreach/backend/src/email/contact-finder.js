'use strict';

/**
 * contact-finder.js — Contact discovery for Corgi Outreach
 *
 * Given a company name and website, attempts to find key decision-maker
 * contacts and plausible email addresses using:
 *   1. Website scraping (team/about pages via existing cheerio dependency)
 *   2. Pattern-based email guessing from known domain
 *
 * ⚠️  Does NOT send any email to verify addresses.
 *     All results are pattern-based estimates with confidence scores.
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

// ── Target titles (in priority order) ────────────────────────────────────────
const TARGET_TITLES = [
  'CFO',
  'Chief Financial Officer',
  'VP Finance',
  'VP Infrastructure',
  'VP Engineering',
  'Head of Infrastructure',
  'Head of Finance',
  'Treasurer',
  'Treasury',
  'CEO',
  'Chief Executive Officer',
  'COO',
  'President',
  'Managing Director',
  'Partner',
  'Principal',
  'Director of Finance',
  'Director of Infrastructure',
  'Director of Engineering',
];

// ── Common team page paths to try ─────────────────────────────────────────────
const TEAM_PAGE_PATHS = [
  '/team',
  '/about',
  '/about-us',
  '/company',
  '/company/team',
  '/leadership',
  '/people',
  '/who-we-are',
  '/our-team',
];

// ── Email pattern generators ──────────────────────────────────────────────────

/**
 * Generate plausible email format variants for a person at a domain.
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} domain
 * @returns {Array<{email: string, pattern: string, confidence: number}>}
 */
function generateEmailPatterns(firstName, lastName, domain) {
  const f = firstName.toLowerCase().trim();
  const l = lastName.toLowerCase().trim();

  if (!f || !l || !domain) return [];

  return [
    { email: `${f}.${l}@${domain}`,       pattern: 'first.last',  confidence: 0.75 },
    { email: `${f}${l}@${domain}`,         pattern: 'firstlast',   confidence: 0.55 },
    { email: `${f}@${domain}`,             pattern: 'first',       confidence: 0.50 },
    { email: `${f[0]}${l}@${domain}`,      pattern: 'flast',       confidence: 0.60 },
    { email: `${f[0]}.${l}@${domain}`,     pattern: 'f.last',      confidence: 0.55 },
    { email: `${f}.${l[0]}@${domain}`,     pattern: 'first.l',     confidence: 0.35 },
    { email: `${l}.${f}@${domain}`,        pattern: 'last.first',  confidence: 0.30 },
  ];
}

/**
 * Score a title against our priority list.
 * @param {string} title
 * @returns {number} 0-100
 */
function scoreTitleRelevance(title) {
  if (!title) return 0;
  const t = title.toLowerCase();

  if (t.includes('cfo') || t.includes('chief financial')) return 95;
  if (t.includes('treasurer') || t.includes('treasury')) return 90;
  if (t.includes('vp finance') || t.includes('vice president finance')) return 88;
  if (t.includes('vp infra') || t.includes('head of infra')) return 85;
  if (t.includes('director of finance')) return 82;
  if (t.includes('ceo') || t.includes('chief executive')) return 80;
  if (t.includes('coo') || t.includes('chief operating')) return 75;
  if (t.includes('vp engineer') || t.includes('head of engineer')) return 70;
  if (t.includes('managing director') || t.includes('partner')) return 65;
  if (t.includes('principal')) return 60;
  if (t.includes('director')) return 55;
  if (t.includes('president')) return 50;
  return 20;
}

// ── Web scraping ──────────────────────────────────────────────────────────────

/**
 * Fetch a URL with a timeout. Returns null on failure.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<string|null>}
 */
async function _fetchSafe(url, timeoutMs = 8000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch (_) {
    return null;
  }
}

/**
 * Extract the primary domain from a website URL.
 * @param {string} website
 * @returns {string}
 */
function extractDomain(website) {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch (_) {
    return website.replace(/^(?:https?:\/\/)?(?:www\.)?/, '').split('/')[0];
  }
}

/**
 * Parse person cards from a page's HTML.
 * Looks for patterns like name + title in cards/divs.
 *
 * @param {string} html
 * @param {string} domain
 * @returns {Array<Object>} raw contact candidates
 */
function _parseTeamPage(html, domain) {
  const $ = cheerio.load(html);
  const candidates = [];

  // Common team card selectors
  const cardSelectors = [
    '.team-member', '.team-card', '.person', '.staff-member',
    '.bio', '.employee', '[class*="team"]', '[class*="person"]',
    '[class*="member"]', '[class*="leadership"]', '[class*="people"]',
    'article', '.card',
  ];

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const $el = $(el);
      const text = $el.text();

      // Try to find a name (usually in h2/h3/h4 or a strong tag)
      const nameEl = $el.find('h1, h2, h3, h4, h5, strong, .name, [class*="name"]').first();
      const name = nameEl.text().trim();
      if (!name || name.length < 3 || name.length > 60) return;

      // Name should look like a person (two+ words, mostly alpha)
      const nameParts = name.split(/\s+/).filter(Boolean);
      if (nameParts.length < 2) return;
      if (!/^[A-Za-z\s\-'.]+$/.test(name)) return;

      // Try to find title
      const titleEl = $el.find(
        '.title, .role, .position, [class*="title"], [class*="role"], [class*="position"], p, span'
      ).first();
      const title = titleEl.text().trim().replace(/\s+/g, ' ');

      const relevance = scoreTitleRelevance(title);

      candidates.push({
        name,
        firstName: nameParts[0],
        lastName: nameParts[nameParts.length - 1],
        title: title || 'Unknown',
        relevanceScore: relevance,
        source: 'website_scrape',
        domain,
      });
    });
  }

  // Deduplicate by name
  const seen = new Set();
  return candidates.filter(c => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });
}

/**
 * Scrape a company website for team/leadership contacts.
 *
 * @param {string} website
 * @returns {Promise<Array<Object>>}
 */
async function scrapeWebsiteContacts(website) {
  if (!website) return [];

  const domain = extractDomain(website);
  const base = website.startsWith('http') ? website.replace(/\/$/, '') : `https://${domain}`;
  const candidates = [];

  for (const pagePath of TEAM_PAGE_PATHS) {
    const url = `${base}${pagePath}`;
    const html = await _fetchSafe(url);
    if (!html) continue;

    const found = _parseTeamPage(html, domain);
    candidates.push(...found);

    if (candidates.length >= 10) break; // enough candidates
  }

  return candidates;
}

// ── Main discovery function ───────────────────────────────────────────────────

/**
 * Discover contacts for a company.
 *
 * @param {string} companyId  — companies.id in the database
 * @param {Object} [options]
 * @param {boolean} [options.saveToDb]      — save discovered contacts to DB (default: false)
 * @param {boolean} [options.scrapeWebsite] — attempt website scraping (default: true)
 * @returns {Promise<Array<Object>>} contact candidates with email guesses
 */
async function discoverContacts(companyId, options = {}) {
  const { saveToDb = false, scrapeWebsite = true } = options;

  const company = db.prepare(`SELECT * FROM companies WHERE id = ?`).get(companyId);
  if (!company) throw new Error(`Company not found: ${companyId}`);

  const domain = company.website ? extractDomain(company.website) : null;

  console.log(`[contact-finder] Discovering contacts for ${company.name} (${domain || 'no domain'})`);

  let rawCandidates = [];

  // 1. Scrape website
  if (scrapeWebsite && company.website) {
    try {
      const scraped = await scrapeWebsiteContacts(company.website);
      rawCandidates.push(...scraped);
      console.log(`[contact-finder] Scraped ${scraped.length} candidates from ${company.website}`);
    } catch (err) {
      console.warn(`[contact-finder] Scrape failed for ${company.website}: ${err.message}`);
    }
  }

  // 2. Check existing contacts in DB for this company as baseline
  const existing = db
    .prepare(`SELECT name, title FROM contacts WHERE company_id = ?`)
    .all(companyId);

  for (const c of existing) {
    const parts = c.name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && domain) {
      rawCandidates.push({
        name: c.name,
        firstName: parts[0],
        lastName: parts[parts.length - 1],
        title: c.title || '',
        relevanceScore: scoreTitleRelevance(c.title),
        source: 'database',
        domain,
      });
    }
  }

  // 3. Enrich each candidate with email patterns and confidence scores
  const results = rawCandidates
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10) // top 10
    .map(candidate => {
      const emailOptions = domain
        ? generateEmailPatterns(candidate.firstName, candidate.lastName, domain)
        : [];

      const bestEmail = emailOptions[0] || null;

      return {
        name: candidate.name,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        title: candidate.title,
        relevanceScore: candidate.relevanceScore,
        source: candidate.source,
        domain,
        emailGuess: bestEmail ? bestEmail.email : null,
        emailPattern: bestEmail ? bestEmail.pattern : null,
        emailConfidence: bestEmail ? bestEmail.confidence : 0,
        emailOptions,
        isDecisionMaker: candidate.relevanceScore >= 70,
      };
    });

  // 4. Optionally persist to DB (as unverified contacts)
  if (saveToDb && results.length > 0) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO contacts (id, company_id, name, title, email, source, verified, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))
    `);

    const tx = db.transaction(() => {
      for (const r of results) {
        if (r.emailGuess) {
          insert.run(
            uuidv4(),
            companyId,
            r.name,
            r.title,
            r.emailGuess,
            `pattern_guess_${r.emailPattern}`
          );
        }
      }
    });
    tx();
    console.log(`[contact-finder] Saved ${results.filter(r => r.emailGuess).length} guessed contacts to DB`);
  }

  return results;
}

module.exports = {
  discoverContacts,
  scrapeWebsiteContacts,
  generateEmailPatterns,
  extractDomain,
  scoreTitleRelevance,
};
