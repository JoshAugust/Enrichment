/**
 * sources/linkedin-enrichment.js — LinkedIn data via web search (no API)
 *
 * Uses public web search (DuckDuckGo) to find:
 *   - Company LinkedIn page URL
 *   - Key personnel LinkedIn profiles
 *   - Title/tenure info from Google snippets
 *   - Connection count estimates from snippets
 *
 * No LinkedIn API, no scraping of gated content — only public search snippets.
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const { ddgSearch } = require('./web-search');

// LinkedIn URL patterns
const COMPANY_LI_RE  = /linkedin\.com\/company\/([a-zA-Z0-9\-_]+)/i;
const PERSON_LI_RE   = /linkedin\.com\/in\/([a-zA-Z0-9\-_]+)/i;

// Titles we care about for outreach
const RELEVANT_TITLES = [
  'CEO', 'CTO', 'CFO', 'COO', 'President', 'Founder', 'Co-Founder',
  'Managing Director', 'Managing Partner', 'General Partner', 'Partner',
  'Head of Finance', 'Head of Capital', 'Head of Infrastructure',
  'VP Finance', 'VP of Finance', 'SVP Finance', 'EVP Finance',
  'Director of Finance', 'Director of Capital Markets',
  'Chief Financial Officer', 'Chief Technology Officer',
  'Chief Executive Officer', 'Chief Operating Officer',
  'Treasurer', 'Controller', 'Credit Officer', 'Portfolio Manager',
  'Infrastructure Lead', 'Capital Markets',
];

const TITLE_RE = new RegExp(
  '(' + RELEVANT_TITLES.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')',
  'i'
);

/**
 * Extract LinkedIn company URL from search results.
 */
function findCompanyLinkedIn(results, companyName) {
  for (const { url, snippet, title } of results) {
    if (COMPANY_LI_RE.test(url)) {
      return url;
    }
    // Sometimes LinkedIn URL is in the snippet text
    const combined = `${title} ${snippet}`;
    const m = COMPANY_LI_RE.exec(combined);
    if (m) return `https://www.linkedin.com/company/${m[1]}`;
  }
  return null;
}

/**
 * Extract individual LinkedIn profile URLs and associated info.
 */
function extractPersonProfiles(results) {
  const profiles = [];
  for (const { url, snippet, title } of results) {
    if (PERSON_LI_RE.test(url)) {
      // Try to extract name and title from snippet
      const nameMatch = /^([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/.exec(title);
      const titleMatch = TITLE_RE.exec(`${title} ${snippet}`);

      profiles.push({
        linkedinUrl: url,
        name: nameMatch ? nameMatch[1] : null,
        title: titleMatch ? titleMatch[1] : null,
        snippet: snippet.slice(0, 200),
      });
    }
  }
  return profiles;
}

/**
 * Extract follower/connection count from snippet text.
 * LinkedIn snippets sometimes say "X followers" or "500+ connections".
 */
function extractFollowerCount(snippets) {
  const followerRe = /(\d[\d,]+)\s+followers?/i;
  const connectionRe = /(\d[\d,]+)\+?\s+connections?/i;

  for (const s of snippets) {
    let m = followerRe.exec(s);
    if (m) return { type: 'followers', count: parseInt(m[1].replace(/,/g, ''), 10) };
    m = connectionRe.exec(s);
    if (m) return { type: 'connections', count: m[1] + '+' };
  }
  return null;
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
    source: 'linkedin-enrichment',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === 'company') {
      const { name, linkedin_url } = existingData;
      if (!name) throw new Error('Company name required');

      console.log(`[linkedin] Enriching company: ${name}`);

      // If we already have a LinkedIn URL, skip search but still fetch page info
      let companyLinkedIn = linkedin_url || null;

      if (!companyLinkedIn) {
        // Search for company LinkedIn page
        const results = await ddgSearch(`site:linkedin.com/company "${name}"`);
        companyLinkedIn = findCompanyLinkedIn(results, name);
      }

      // Search for key personnel at the company
      const execResults = await ddgSearch(`site:linkedin.com/in "${name}" (CEO OR CTO OR CFO OR "Managing Director" OR Partner OR Founder)`);
      const profiles = extractPersonProfiles(execResults);
      const followerInfo = extractFollowerCount(execResults.map(r => r.snippet));

      result.data = {
        companyLinkedIn,
        personnelProfiles: profiles,
        followerInfo,
        searchResultCount: execResults.length,
      };

      if (companyLinkedIn && !existingData.linkedin_url) {
        result.data.linkedin_url = companyLinkedIn;
      }

      console.log(`[linkedin] Company ${name}: ${companyLinkedIn ? 'found page' : 'no page'}, ${profiles.length} profiles`);

    } else if (entityType === 'contact') {
      const { name, company_name, linkedin_url } = existingData;
      if (!name) throw new Error('Contact name required');

      console.log(`[linkedin] Enriching contact: ${name}`);

      if (linkedin_url) {
        // Already have LinkedIn URL — try to get more info from search snippets
        const results = await ddgSearch(`"${name}" linkedin.com/in`);
        const followerInfo = extractFollowerCount(results.map(r => r.snippet));

        result.data = { linkedinUrl: linkedin_url, followerInfo };
        result.success = true;
        return result;
      }

      // Search for this person's LinkedIn profile
      const query = company_name
        ? `site:linkedin.com/in "${name}" "${company_name}"`
        : `site:linkedin.com/in "${name}"`;

      const results = await ddgSearch(query);
      const profiles = extractPersonProfiles(results);
      const best = profiles.find(p => p.name && p.name.toLowerCase().includes(name.split(' ')[0].toLowerCase()));

      result.data = {
        profiles,
        bestMatch: best || profiles[0] || null,
      };

      if (best && best.linkedinUrl && !existingData.linkedin_url) {
        result.data.linkedin_url = best.linkedinUrl;
      }
      if (best && best.title && !existingData.title) {
        result.data.title = best.title;
      }

      console.log(`[linkedin] Contact ${name}: ${profiles.length} profiles found`);
    }

    result.success = true;
  } catch (err) {
    console.error(`[linkedin] Failed for ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich };
