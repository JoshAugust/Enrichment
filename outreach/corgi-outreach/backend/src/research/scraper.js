/**
 * scraper.js — Web scraper for company research
 *
 * Given a company name and website URL, attempts to extract:
 *   - Description / about text
 *   - Team/contact page links
 *   - Any recent news snippets
 *   - Notable technologies/keywords
 *
 * Uses cheerio for HTML parsing and node-fetch for HTTP.
 * Respects a configurable timeout and handles failures gracefully.
 */

'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');

const DEFAULT_TIMEOUT_MS = 10000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)';

/**
 * Fetch a URL with a timeout.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<string>} raw HTML
 */
async function fetchHtml(url, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Extract visible text from a cheerio-loaded document.
 * Strips scripts, styles, and nav clutter.
 */
function extractVisibleText($) {
  $('script, style, noscript, nav, footer, header, aside').remove();
  return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);
}

/**
 * Extract all internal links matching patterns like /team, /about, /contact, /news.
 */
function extractInterestingLinks($, baseUrl) {
  const patterns = [/about/i, /team/i, /contact/i, /news/i, /press/i, /blog/i, /leadership/i];
  const links = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (patterns.some((re) => re.test(href))) {
      try {
        const absolute = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        links.add(absolute);
      } catch {
        // ignore malformed URLs
      }
    }
  });

  return [...links].slice(0, 6); // cap at 6 sub-pages to stay polite
}

/**
 * Extract meta description and Open Graph description.
 */
function extractMetaDescription($) {
  return (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    ''
  );
}

/**
 * Scrape a single page and return a structured result.
 * @param {string} url
 * @returns {Promise<{url, text, metaDescription, links}>}
 */
async function scrapePage(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    return {
      url,
      success: true,
      text: extractVisibleText($),
      metaDescription: extractMetaDescription($),
      links: extractInterestingLinks($, url),
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url,
      success: false,
      error: err.message,
      text: '',
      metaDescription: '',
      links: [],
      scrapedAt: new Date().toISOString(),
    };
  }
}

/**
 * Main scrape function for a company.
 * Scrapes homepage + up to 2 sub-pages (team/about/contact).
 *
 * @param {string} companyName
 * @param {string} website — e.g. "https://voltagepark.com"
 * @returns {Promise<ScrapedCompany>}
 */
async function scrapeCompany(companyName, website) {
  if (!website) {
    return {
      companyName,
      website: null,
      pages: [],
      error: 'No website provided',
    };
  }

  // Normalize URL
  const baseUrl = website.startsWith('http') ? website : `https://${website}`;

  const result = {
    companyName,
    website: baseUrl,
    pages: [],
    scrapedAt: new Date().toISOString(),
  };

  // 1. Scrape homepage
  const homepage = await scrapePage(baseUrl);
  result.pages.push(homepage);

  // 2. Scrape up to 2 interesting sub-pages
  if (homepage.success && homepage.links.length > 0) {
    const subpages = homepage.links.slice(0, 2);
    for (const link of subpages) {
      // Small delay to be polite
      await new Promise((r) => setTimeout(r, 500));
      const page = await scrapePage(link);
      result.pages.push(page);
    }
  }

  return result;
}

/**
 * Collapse all scraped page text into a single summary string.
 * Useful for passing to enricher.
 */
function collapseScrapedText(scraped) {
  // WARN-010 / BUG-005 fix: strip URL prefix artifacts so summaries stay clean
  return scraped.pages
    .filter((p) => p.success)
    .map((p) => {
      const parts = [p.metaDescription, p.text].filter(Boolean).join('\n');
      return parts;
    })
    .join('\n\n---\n\n')
    .replace(/^\[https?:\/\/[^\]]*\]\s*/gm, '')
    .trim()
    .slice(0, 10000);
}

module.exports = { scrapeCompany, scrapePage, collapseScrapedText };
