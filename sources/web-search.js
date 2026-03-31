/**
 * sources/web-search.js — Web search enrichment source
 *
 * Uses DuckDuckGo Lite (no API key required) to find:
 *   - Recent news about the company
 *   - Executive names/titles via web snippets
 *   - LinkedIn profile hints
 *   - Funding announcements
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { rateLimiter } = require('./rate-limiter');

const TIMEOUT_MS = 12000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0; +https://corgi.finance)';

// ── DuckDuckGo Lite search ────────────────────────────────────────────────────

/**
 * Search DuckDuckGo Lite and return text snippets.
 * @param {string} query
 * @returns {Promise<Array<{title, snippet, url}>>}
 */
async function ddgSearch(query) {
  return rateLimiter.run(async () => {
    const encoded = encodeURIComponent(query);
    const url = `https://lite.duckduckgo.com/lite/?q=${encoded}&kl=us-en`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html',
        },
        redirect: 'follow',
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);

      const html = await res.text();
      return parseDdgResults(html);
    } catch (err) {
      clearTimeout(timer);
      console.warn(`[web-search] DDG search failed for "${query}": ${err.message}`);
      return [];
    }
  });
}

/**
 * Parse DuckDuckGo Lite HTML into structured results.
 */
function parseDdgResults(html) {
  const $ = cheerio.load(html);
  const results = [];

  // DDG Lite uses <tr> rows with .result-link and .result-snippet
  $('tr').each((_, row) => {
    const titleEl = $(row).find('a.result-link');
    const snippetEl = $(row).next('tr').find('.result-snippet');

    const title = titleEl.text().trim();
    const url = titleEl.attr('href') || '';
    const snippet = snippetEl.text().trim();

    if (title && (snippet || url)) {
      results.push({ title, snippet, url });
    }
  });

  // Fallback: try generic link + description pattern
  if (results.length === 0) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href.startsWith('http') && text.length > 10 && !href.includes('duckduckgo')) {
        const parentText = $(el).parent().text().trim();
        results.push({
          title: text.slice(0, 120),
          snippet: parentText.slice(0, 300),
          url: href,
        });
      }
    });
  }

  return results.slice(0, 10);
}

// ── Extract signals from search results ──────────────────────────────────────

const NEWS_CATEGORIES = {
  funding: /fund(?:ing|ed|raise)|series [a-e]|raise[ds]?\s+\$|capital raise|investment round|secured \$|closed \$/i,
  partnership: /partner(?:ship|ed|s)|collaboration|alliance|joint venture|deal with|agreement with/i,
  executive: /appoint(?:ed|s)|hir(?:ed|es)|join(?:ed|s) as|named (?:ceo|cto|cfo|president)|promot(?:ed|ion)/i,
  product: /launch(?:ed|es)|announc(?:ed|es)|introduc(?:ed|es)|releas(?:ed|es)|new product|new platform/i,
  regulatory: /regulat(?:ory|ion|ed)|compliance|sec filing|approved by|licens(?:ed|e)/i,
  growth: /expan(?:d|ding|sion)|scal(?:e|ing)|grow(?:th|ing)|open(?:ing|ed) (?:new|office)/i,
};

function categorizeSnippet(text) {
  const categories = [];
  for (const [cat, re] of Object.entries(NEWS_CATEGORIES)) {
    if (re.test(text)) categories.push(cat);
  }
  return categories.length > 0 ? categories : ['general'];
}

/**
 * Extract potential executive names from text snippets.
 * Very heuristic — looks for "Name, Title" patterns.
 */
function extractExecutiveHints(snippets) {
  const execs = [];
  const titleRe = /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:the\s+)?(?:new\s+)?(CEO|CTO|CFO|COO|President|Founder|Managing Director|Managing Partner|Head of|VP|SVP|Director)/gi;

  for (const { snippet, title } of snippets) {
    const text = `${title} ${snippet}`;
    let match;
    while ((match = titleRe.exec(text)) !== null) {
      execs.push({
        name: match[1].trim(),
        title: match[2].trim(),
        source: 'web-search',
      });
    }
  }

  // Deduplicate by name
  const seen = new Set();
  return execs.filter(e => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

/**
 * Extract LinkedIn URLs from results.
 */
function extractLinkedInUrls(results) {
  const urls = [];
  for (const { url } of results) {
    if (url.includes('linkedin.com/company/') || url.includes('linkedin.com/in/')) {
      urls.push(url);
    }
  }
  return [...new Set(urls)];
}

/**
 * Extract funding mentions from results.
 */
function extractFundingMentions(results) {
  const funding = [];
  const amountRe = /\$(\d+(?:\.\d+)?)\s*(?:million|billion|mn|bn|M|B)\b/gi;

  for (const { snippet, title } of results) {
    const text = `${title} ${snippet}`;
    if (NEWS_CATEGORIES.funding.test(text)) {
      const amounts = [];
      let m;
      while ((m = amountRe.exec(text)) !== null) {
        amounts.push(m[0]);
      }
      funding.push({
        headline: title.slice(0, 120),
        amounts,
        snippet: snippet.slice(0, 200),
      });
    }
  }
  return funding;
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * Enrich a company or contact using web search.
 *
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData  - Current DB record with at minimum { name, website? }
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'web-search',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === 'company') {
      const companyName = existingData.name;
      if (!companyName) throw new Error('Company name required for web search');

      console.log(`[web-search] Enriching company: ${companyName}`);

      // Build and run multiple queries
      const queries = [
        `"${companyName}" news 2024 2025 2026`,
        `"${companyName}" CEO CTO CFO leadership team`,
        `"${companyName}" funding investment raised`,
        `"${companyName}" partnership deal announcement`,
        `"${companyName}" phone number contact`,
      ];

      const allResults = [];
      for (const query of queries) {
        const res = await ddgSearch(query);
        allResults.push(...res);
        // Small polite delay between queries
        await new Promise(r => setTimeout(r, 800));
      }

      // Deduplicate by URL
      const seen = new Set();
      const deduped = allResults.filter(r => {
        if (seen.has(r.url)) return false;
        seen.add(r.url);
        return true;
      });

      // Categorize news
      const news = deduped
        .filter(r => r.snippet && r.snippet.length > 20)
        .map(r => ({
          title: r.title,
          snippet: r.snippet,
          url: r.url,
          categories: categorizeSnippet(`${r.title} ${r.snippet}`),
        }))
        .slice(0, 15);

      const executiveHints = extractExecutiveHints(deduped);
      const linkedinUrls = extractLinkedInUrls(deduped);
      const fundingMentions = extractFundingMentions(deduped);

      // Extract phone numbers from all search snippets
      const phoneRe = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;
      const phonesFound = new Set();
      for (const { snippet, title } of deduped) {
        const text = `${title} ${snippet}`;
        let m;
        while ((m = phoneRe.exec(text)) !== null) {
          const cleaned = m[0].replace(/[\s\-.()]/g, '');
          if (cleaned.length >= 10) phonesFound.add(m[0].trim());
        }
      }
      const phones = [...phonesFound].slice(0, 5);
      if (phones.length > 0) {
        console.log(`[web-search] Found ${phones.length} phone(s) for ${companyName}: ${phones.join(', ')}`);
      }

      result.data = {
        news,
        executiveHints,
        linkedinUrls,
        fundingMentions,
        phones,
        searchResultCount: deduped.length,
      };

      // Surface top-level fields for DB update
      if (linkedinUrls.length > 0 && !existingData.linkedin_url) {
        const companyLinkedIn = linkedinUrls.find(u => u.includes('linkedin.com/company/'));
        if (companyLinkedIn) result.data.linkedin_url = companyLinkedIn;
      }

      if (fundingMentions.length > 0) {
        result.data.recent_news = JSON.stringify(
          news.filter(n => n.categories.includes('funding')).slice(0, 5)
        );
      }

      console.log(`[web-search] Company ${companyName}: ${news.length} news items, ${executiveHints.length} exec hints, ${fundingMentions.length} funding mentions`);

    } else if (entityType === 'contact') {
      const { name, company_name } = existingData;
      if (!name) throw new Error('Contact name required for web search');

      console.log(`[web-search] Enriching contact: ${name} @ ${company_name || 'unknown'}`);

      const queries = [
        company_name
          ? `"${name}" "${company_name}" linkedin`
          : `"${name}" linkedin`,
        company_name
          ? `"${name}" "${company_name}" profile`
          : `"${name}" professional profile`,
      ];

      const allResults = [];
      for (const query of queries) {
        const res = await ddgSearch(query);
        allResults.push(...res);
        await new Promise(r => setTimeout(r, 600));
      }

      const linkedinUrls = extractLinkedInUrls(allResults);
      const personalLinkedIn = linkedinUrls.find(u => u.includes('linkedin.com/in/'));

      // Try to find bio snippets
      const bioSnippets = allResults
        .filter(r => r.snippet && r.snippet.length > 30)
        .map(r => r.snippet)
        .slice(0, 3);

      result.data = {
        linkedinUrls,
        bioSnippets,
        searchResultCount: allResults.length,
      };

      if (personalLinkedIn && !existingData.linkedin_url) {
        result.data.linkedin_url = personalLinkedIn;
      }

      if (bioSnippets.length > 0 && !existingData.bio) {
        result.data.bio = bioSnippets[0].slice(0, 500);
      }

      console.log(`[web-search] Contact ${name}: ${linkedinUrls.length} LinkedIn URLs found`);
    }

    result.success = true;
  } catch (err) {
    console.error(`[web-search] Enrichment failed for ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich, ddgSearch };
