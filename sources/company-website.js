/**
 * sources/company-website.js — Deep company website scraper
 *
 * Scrapes multiple sub-pages of a company's website to extract:
 *   - About page: description, founding year, mission
 *   - Team/leadership page: names, titles, bios
 *   - Blog/news page: recent announcements
 *   - Careers page: hiring signals & open roles
 *   - Contact page: emails, phones, locations
 *   - Footer: social media links
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { rateLimiter } = require('./rate-limiter');

const TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)';

// Page types we want to find and their URL patterns
const PAGE_PATTERNS = {
  about:    [/\/about/i, /\/company/i, /\/who-we-are/i, /\/our-story/i],
  team:     [/\/team/i, /\/leadership/i, /\/people/i, /\/founders/i, /\/executives/i, /\/management/i],
  news:     [/\/news/i, /\/press/i, /\/blog/i, /\/announcements/i, /\/insights/i, /\/updates/i],
  careers:  [/\/careers/i, /\/jobs/i, /\/hiring/i, /\/work-with-us/i, /\/join/i],
  contact:  [/\/contact/i, /\/reach-us/i, /\/get-in-touch/i],
};

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchHtml(url) {
  return rateLimiter.run(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT },
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

// ── Link discovery ────────────────────────────────────────────────────────────

/**
 * Categorize all links on a page by page type (about, team, news, careers, contact).
 */
function discoverSubpageLinks($, baseUrl) {
  const discovered = {};

  $('a[href]').each((_, el) => {
    const href = cheerio.load('')(el).attr('href') || $(el).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

    let absolute;
    try {
      absolute = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    } catch {
      return;
    }

    // Only follow same-origin links
    try {
      const base = new URL(baseUrl);
      const link = new URL(absolute);
      if (link.hostname !== base.hostname) return;
    } catch {
      return;
    }

    for (const [type, patterns] of Object.entries(PAGE_PATTERNS)) {
      if (patterns.some(re => re.test(absolute))) {
        if (!discovered[type]) discovered[type] = [];
        if (!discovered[type].includes(absolute)) {
          discovered[type].push(absolute);
        }
      }
    }
  });

  // Take at most 1-2 URLs per type
  const result = {};
  for (const [type, urls] of Object.entries(discovered)) {
    result[type] = urls.slice(0, 2);
  }
  return result;
}

// ── Extractors ────────────────────────────────────────────────────────────────

/**
 * Extract social media links from the page (footer area preferred).
 */
function extractSocialLinks($, baseUrl) {
  const social = {};
  const patterns = {
    linkedin: /linkedin\.com\/company\//i,
    twitter:  /(?:twitter\.com|x\.com)\//i,
    github:   /github\.com\//i,
    facebook: /facebook\.com\//i,
    youtube:  /youtube\.com\//i,
  };

  // Prefer footer links
  const scope = $('footer, [class*="footer"], [id*="footer"]').length
    ? $('footer, [class*="footer"], [id*="footer"]')
    : $('body');

  scope.find('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, re] of Object.entries(patterns)) {
      if (!social[platform] && re.test(href)) {
        try {
          social[platform] = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        } catch {
          social[platform] = href;
        }
      }
    }
  });

  return social;
}

/**
 * Extract emails from text and href attributes.
 */
function extractEmails($) {
  const emails = new Set();
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

  // From mailto: links
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0].trim();
    if (email && !email.includes('example') && !email.includes('your@')) {
      emails.add(email.toLowerCase());
    }
  });

  // From visible text
  const bodyText = $('body').text();
  let m;
  while ((m = emailRe.exec(bodyText)) !== null) {
    const e = m[0].toLowerCase();
    if (!e.includes('example') && !e.includes('your@') && !e.endsWith('.png') && !e.endsWith('.jpg')) {
      emails.add(e);
    }
  }

  return [...emails].slice(0, 10);
}

/**
 * Extract phone numbers from visible text.
 */
function extractPhones($) {
  const text = $('body').text();
  const phoneRe = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;
  const phones = new Set();
  let m;
  while ((m = phoneRe.exec(text)) !== null) {
    phones.add(m[0].trim());
  }
  return [...phones].slice(0, 5);
}

/**
 * Extract team members from a leadership/team page.
 * Looks for common card/bio patterns.
 */
function extractTeamMembers($) {
  const members = [];

  // Common card selectors
  const cardSelectors = [
    '[class*="team"] [class*="member"]',
    '[class*="team"] [class*="card"]',
    '[class*="leader"] [class*="card"]',
    '[class*="people"] [class*="card"]',
    '[class*="person"]',
    '[class*="bio"]',
    '[class*="staff"]',
    'article',
  ];

  const titleKeywords = /CEO|CTO|CFO|COO|President|Founder|Partner|Director|VP|SVP|EVP|Head|Principal|Manager|Officer/i;

  for (const sel of cardSelectors) {
    const cards = $(sel);
    if (cards.length === 0) continue;

    cards.each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length < 5 || text.length > 500) return;

      // Try to parse name + title from the card text
      const lines = text.split(/\n|·|•|\|/).map(l => l.trim()).filter(Boolean);
      const name = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l) && l.length < 60);
      const title = lines.find(l => titleKeywords.test(l) && l.length < 100);

      if (name && title && name !== title) {
        members.push({ name: name.slice(0, 80), title: title.slice(0, 100), source: 'company-website' });
      }
    });

    if (members.length > 0) break; // Found something, stop trying selectors
  }

  // Deduplicate by name
  const seen = new Set();
  return members.filter(m => {
    if (seen.has(m.name)) return false;
    seen.add(m.name);
    return true;
  }).slice(0, 20);
}

/**
 * Extract founding year from text.
 */
function extractFoundingYear(text) {
  // "founded in YYYY", "established YYYY", "since YYYY"
  const re = /(?:founded|established|incorporated|started|launched)\s+(?:in\s+)?(\d{4})/i;
  const m = re.exec(text);
  if (m) {
    const year = parseInt(m[1], 10);
    if (year >= 1990 && year <= new Date().getFullYear()) return year;
  }
  return null;
}

/**
 * Extract employee count signals from text.
 */
function extractEmployeeCount(text) {
  const patterns = [
    /(\d+(?:,\d+)?)\+?\s+employees/i,
    /team of (\d+(?:,\d+)?)/i,
    /over (\d+(?:,\d+)?)\s+(?:people|employees|staff|professionals)/i,
    /(\d+(?:,\d+)?)\s+(?:people|professionals|experts)\s+(?:strong|across|worldwide)/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) return m[1].replace(/,/g, '');
  }
  return null;
}

/**
 * Extract office/headquarters location from contact page.
 */
function extractLocation($) {
  // Look for address-like blocks
  const addrSelectors = ['address', '[class*="address"]', '[class*="location"]', '[class*="office"]'];
  for (const sel of addrSelectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().replace(/\s+/g, ' ').trim();
      if (text.length > 5 && text.length < 200) return text.slice(0, 150);
    }
  }
  return null;
}

/**
 * Extract hiring signals from careers page.
 */
function extractHiringSignals($) {
  const text = $('body').text();
  const openRolesRe = /(\d+)\s+(?:open|available)?\s*(?:positions?|roles?|jobs?|openings?)/i;
  const rolesMatch = openRolesRe.exec(text);
  const openCount = rolesMatch ? parseInt(rolesMatch[1], 10) : null;

  // Extract department areas from job titles listed
  const deptKeywords = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Operations',
    'Product', 'Design', 'Infrastructure', 'Data', 'Research', 'Legal', 'HR'];
  const departments = deptKeywords.filter(d => new RegExp(d, 'i').test(text));

  const isHiring = /we(?:'re| are) hiring|join (?:our|the) team|open position|current opening/i.test(text);

  return {
    isHiring,
    openRoles: openCount,
    departments: departments.slice(0, 8),
    signal: isHiring ? (openCount ? `${openCount} open roles` : 'actively hiring') : 'not clearly hiring',
  };
}

/**
 * Extract recent news/blog post titles from a news/blog page.
 */
function extractNewsItems($) {
  const items = [];
  const titleSelectors = ['h1', 'h2', 'h3', 'article h2', 'article h3', '[class*="post"] h2', '[class*="blog"] h2'];

  for (const sel of titleSelectors) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && text.length < 200) {
        items.push(text);
      }
    });
    if (items.length >= 5) break;
  }

  // Deduplicate
  return [...new Set(items)].slice(0, 8);
}

// ── Main enrich function ──────────────────────────────────────────────────────

async function scrapeSinglePage(url) {
  try {
    const html = await fetchHtml(url);
    return { success: true, html, url };
  } catch (err) {
    return { success: false, error: err.message, html: '', url };
  }
}

/**
 * Enrich company data by deep-scraping its website.
 *
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'company-website',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  // Only relevant for companies
  if (entityType !== 'company') {
    result.success = true;
    result.skipped = true;
    result.data = {};
    return result;
  }

  const website = existingData.website;
  if (!website) {
    result.success = false;
    result.error = 'No website URL available';
    return result;
  }

  const baseUrl = website.startsWith('http') ? website : `https://${website}`;

  try {
    console.log(`[company-website] Scraping ${baseUrl}`);

    // ── Step 1: Scrape homepage to discover sub-pages ──
    const homepageResult = await scrapeSinglePage(baseUrl);
    if (!homepageResult.success) {
      throw new Error(`Homepage failed: ${homepageResult.error}`);
    }

    const $home = cheerio.load(homepageResult.html);

    // Get social links from homepage
    const socialLinks = extractSocialLinks($home, baseUrl);
    const subpageLinks = discoverSubpageLinks($home, baseUrl);

    console.log(`[company-website] Discovered subpages: ${Object.keys(subpageLinks).join(', ')}`);

    // Collect homepage text signals
    const homepageText = $home('body').text().replace(/\s+/g, ' ').trim();
    const foundingYear = extractFoundingYear(homepageText);
    const employeeCount = extractEmployeeCount(homepageText);
    const homepageEmails = extractEmails($home);
    const homepagePhones = extractPhones($home);

    // ── Step 2: Scrape targeted sub-pages in parallel (limited) ──
    const pagesToScrape = [];
    for (const type of ['about', 'team', 'news', 'careers', 'contact']) {
      if (subpageLinks[type] && subpageLinks[type].length > 0) {
        pagesToScrape.push({ type, url: subpageLinks[type][0] });
      }
    }

    // Limit to 4 sub-pages
    const subPageResults = {};
    for (const { type, url } of pagesToScrape.slice(0, 4)) {
      console.log(`[company-website] Scraping ${type} page: ${url}`);
      const pageResult = await scrapeSinglePage(url);
      if (pageResult.success) {
        subPageResults[type] = cheerio.load(pageResult.html);
      }
    }

    // ── Step 3: Extract data from each sub-page ──
    const data = {
      socialLinks,
      emails: homepageEmails,
      phones: homepagePhones,
    };

    if (foundingYear) data.founded_year = foundingYear;
    if (employeeCount) data.employee_count = employeeCount;

    if (subPageResults.about) {
      const $about = subPageResults.about;
      const aboutText = $about('body').text().replace(/\s+/g, ' ').trim();
      if (!foundingYear) {
        const yr = extractFoundingYear(aboutText);
        if (yr) data.founded_year = yr;
      }
      if (!employeeCount) {
        const ec = extractEmployeeCount(aboutText);
        if (ec) data.employee_count = ec;
      }
      data.description = aboutText.slice(0, 800);
    }

    if (subPageResults.team) {
      data.teamMembers = extractTeamMembers(subPageResults.team);
      console.log(`[company-website] Found ${data.teamMembers.length} team members`);
    }

    if (subPageResults.news) {
      data.newsItems = extractNewsItems(subPageResults.news);
      const newsEmails = extractEmails(subPageResults.news);
      data.emails = [...new Set([...data.emails, ...newsEmails])];
    }

    if (subPageResults.careers) {
      data.hiringSignals = extractHiringSignals(subPageResults.careers);
    }

    if (subPageResults.contact) {
      const $contact = subPageResults.contact;
      const contactEmails = extractEmails($contact);
      const contactPhones = extractPhones($contact);
      const location = extractLocation($contact);
      data.emails = [...new Set([...data.emails, ...contactEmails])];
      data.phones = [...new Set([...data.phones, ...contactPhones])];
      if (location) data.headquarters = location;

      // Also get social links from contact page
      const contactSocial = extractSocialLinks($contact, baseUrl);
      data.socialLinks = { ...contactSocial, ...data.socialLinks }; // prefer homepage social
    }

    // ── Step 4: Map to top-level DB fields ──
    if (data.socialLinks.linkedin && !existingData.linkedin_url) {
      data.linkedin_url = data.socialLinks.linkedin;
    }
    if (data.socialLinks.twitter && !existingData.twitter_url) {
      data.twitter_url = data.socialLinks.twitter;
    }
    if (data.socialLinks.github && !existingData.github_url) {
      data.github_url = data.socialLinks.github;
    }
    if (data.newsItems && data.newsItems.length > 0) {
      data.recent_news = JSON.stringify(data.newsItems.map(title => ({ title })));
    }
    if (data.hiringSignals) {
      data.hiring_signals = data.hiringSignals.signal;
    }

    result.data = data;
    result.success = true;

    console.log(`[company-website] Done for ${baseUrl}: ${data.teamMembers?.length || 0} team, ${data.emails.length} emails, founded ${data.founded_year || 'unknown'}`);

  } catch (err) {
    console.error(`[company-website] Failed for ${baseUrl}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich };
