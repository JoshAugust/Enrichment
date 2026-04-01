#!/usr/bin/env node
/**
 * full-enrichment.js
 * Enriches all 327 companies from the Corgi Outreach SQLite DB.
 * 
 * Sources used (standalone JS, no TypeScript needed):
 *   1. company-website  – scrape homepage + sub-pages for phone, email, team
 *   2. web-search       – DuckDuckGo search for news, funding, execs
 *   3. google-business  – DDG + BBB/Yelp for phone and address
 *   4. funding          – DDG search for funding amounts, investors
 * 
 * Writes enriched data back to the outreach SQLite DB.
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ── Rate limiter ─────────────────────────────────────────────────────────────

class RateLimiter {
  constructor({ maxConcurrent = 3, minDelayMs = 1200 } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.minDelayMs = minDelayMs;
    this.active = 0;
    this.queue = [];
    this.lastStarted = 0;
  }

  run(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this.queue.length > 0 && this.active < this.maxConcurrent) {
      const item = this.queue.shift();
      const now = Date.now();
      const wait = Math.max(0, this.lastStarted + this.minDelayMs - now);
      setTimeout(() => {
        this.active++;
        this.lastStarted = Date.now();
        item.fn()
          .then(item.resolve)
          .catch(item.reject)
          .finally(() => {
            this.active--;
            this._drain();
          });
      }, wait);
    }
  }
}

const rateLimiter = new RateLimiter({ maxConcurrent: 2, minDelayMs: 1500 });

// ── HTTP helpers ─────────────────────────────────────────────────────────────

async function fetchHtml(url, extraDelayMs = 0) {
  return rateLimiter.run(async () => {
    if (extraDelayMs > 0) await sleep(extraDelayMs);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (res.status === 429) throw new Error('Rate limited (429)');
      if (res.status === 403) throw new Error('Blocked (403)');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── DuckDuckGo search ────────────────────────────────────────────────────────

async function ddgSearch(query) {
  return rateLimiter.run(async () => {
    const encoded = encodeURIComponent(query);
    const url = `https://lite.duckduckgo.com/lite/?q=${encoded}&kl=us-en`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)', Accept: 'text/html' },
        redirect: 'follow',
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
      const html = await res.text();
      return parseDdgResults(html);
    } catch (err) {
      clearTimeout(timer);
      console.warn(`  [ddg] Query failed for "${query}": ${err.message}`);
      return [];
    }
  });
}

function parseDdgResults(html) {
  const $ = cheerio.load(html);
  const results = [];
  $('tr').each((_, row) => {
    const titleEl = $(row).find('a.result-link');
    const snippetEl = $(row).next('tr').find('.result-snippet');
    const title = titleEl.text().trim();
    const url = titleEl.attr('href') || '';
    const snippet = snippetEl.text().trim();
    if (title && (snippet || url)) results.push({ title, snippet, url });
  });
  if (results.length === 0) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      const text = $(el).text().trim();
      if (href.startsWith('http') && text.length > 10 && !href.includes('duckduckgo')) {
        const parentText = $(el).parent().text().trim();
        results.push({ title: text.slice(0, 120), snippet: parentText.slice(0, 300), url: href });
      }
    });
  }
  return results.slice(0, 10);
}

// ── Phone/email extractors ───────────────────────────────────────────────────

const PHONE_PATTERNS = [
  /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,
  /\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b/g,
  /\+1\s?\d{10}\b/g,
];

// Known fake/placeholder phone number digit strings
const FAKE_PHONE_DIGITS = new Set([
  '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
  '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
  '1234567890', '0987654321', '1231231234', '5555551234', '0000000001',
  '11111111111', '00000000000',
]);

function isValidPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return false;
  // Skip years (19xx, 20xx followed by 8 more digits)
  if (/^(19|20)\d{8}$/.test(digits)) return false;
  // Skip fake/placeholder numbers
  if (FAKE_PHONE_DIGITS.has(digits)) return false;
  // Skip all-same-digit numbers
  if (/^(\d)\1{9,}$/.test(digits)) return false;
  // Skip sequential digits
  if (['12345678901', '10987654321'].includes(digits)) return false;
  // 800/888/877/866/855/844/833 are valid toll-free
  // 900 numbers are premium - skip
  const areaCode = digits.length === 11 ? digits.slice(1, 4) : digits.slice(0, 3);
  if (areaCode === '900') return false;
  // Area code can't start with 0 or 1
  if (['0', '1'].includes(areaCode[0])) return false;
  return true;
}

function extractPhones(text) {
  const found = new Set();
  for (const re of PHONE_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    let m;
    while ((m = r.exec(text)) !== null) {
      const raw = m[0].trim();
      if (isValidPhone(raw)) found.add(raw);
    }
  }
  return [...found];
}

function extractPhonesFromPage($) {
  const phones = new Set();
  
  // tel: links (most reliable)
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const num = href.replace('tel:', '').replace(/\s/g, '');
    if (isValidPhone(num)) phones.add(num);
  });
  
  // JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        for (const key of ['telephone', 'phone', 'contactPoint']) {
          if (typeof item[key] === 'string') phones.add(item[key]);
          if (item[key]?.telephone) phones.add(item[key].telephone);
          if (Array.isArray(item[key])) {
            for (const cp of item[key]) { if (cp.telephone) phones.add(cp.telephone); }
          }
        }
      }
    } catch { }
  });
  
  // Footer/header selectors
  const selectors = ['footer', '[class*="footer"]', '[id*="footer"]', 'header', '[class*="header"]',
    '[class*="contact"]', '[class*="phone"]', '[class*="tel"]', '[itemprop="telephone"]'];
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const text = $(el).text();
      for (const p of extractPhones(text)) phones.add(p);
    });
  }
  
  // Full body scan
  const bodyText = $('body').text();
  for (const p of extractPhones(bodyText)) phones.add(p);
  
  return [...phones].slice(0, 10);
}

function extractEmailsFromPage($) {
  const emails = new Set();
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const email = href.replace('mailto:', '').split('?')[0].trim();
    if (email && !email.includes('example') && !email.includes('your@')) {
      emails.add(email.toLowerCase());
    }
  });
  
  const bodyText = $('body').text();
  let m;
  const re = new RegExp(emailRe.source, emailRe.flags);
  while ((m = re.exec(bodyText)) !== null) {
    const e = m[0].toLowerCase();
    if (!e.includes('example') && !e.includes('your@') && !e.endsWith('.png') && !e.endsWith('.jpg')) {
      emails.add(e);
    }
  }
  
  return [...emails].slice(0, 10);
}

function extractSocialLinks($, baseUrl) {
  const social = {};
  const patterns = {
    linkedin: /linkedin\.com\/company\//i,
    twitter: /(?:twitter\.com|x\.com)\//i,
    github: /github\.com\//i,
  };
  
  const scope = $('footer, [class*="footer"], [id*="footer"]').length
    ? $('footer, [class*="footer"], [id*="footer"]')
    : $('body');
  
  scope.find('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [platform, re] of Object.entries(patterns)) {
      if (!social[platform] && re.test(href)) {
        try {
          social[platform] = href.startsWith('http') ? href : new URL(href, baseUrl).href;
        } catch { social[platform] = href; }
      }
    }
  });
  return social;
}

function extractTeamMembers($) {
  const members = [];
  const cardSelectors = [
    "[class*='team'] [class*='member']", "[class*='team'] [class*='card']",
    "[class*='leader'] [class*='card']", "[class*='people'] [class*='card']",
    "[class*='person']", "[class*='bio']", "[class*='staff']",
  ];
  const titleKeywords = /CEO|CTO|CFO|COO|President|Founder|Partner|Director|VP|SVP|EVP|Head|Principal|Manager|Officer/i;
  
  for (const sel of cardSelectors) {
    const cards = $(sel);
    if (!cards.length) continue;
    cards.each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length < 5 || text.length > 500) return;
      const lines = text.split(/\n|·|•|\|/).map(l => l.trim()).filter(Boolean);
      const name = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l) && l.length < 60);
      const title = lines.find(l => titleKeywords.test(l) && l.length < 100);
      if (name && title && name !== title) {
        members.push({ name: name.slice(0, 80), title: title.slice(0, 100) });
      }
    });
    if (members.length > 0) break;
  }
  
  const seen = new Set();
  return members.filter(m => {
    if (seen.has(m.name)) return false;
    seen.add(m.name);
    return true;
  }).slice(0, 20);
}

function extractFoundingYear(text) {
  const re = /(?:founded|established|incorporated|started|launched)\s+(?:in\s+)?(\d{4})/i;
  const m = re.exec(text);
  if (m) {
    const year = parseInt(m[1], 10);
    if (year >= 1900 && year <= new Date().getFullYear()) return year;
  }
  return null;
}

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

function extractLocation($) {
  const selectors = ['address', '[class*="address"]', '[class*="location"]', '[class*="office"]'];
  for (const sel of selectors) {
    const el = $(sel).first();
    if (el.length) {
      const text = el.text().replace(/\s+/g, ' ').trim();
      if (text.length > 5 && text.length < 200) return text.slice(0, 150);
    }
  }
  return null;
}

// ── Page link discovery ──────────────────────────────────────────────────────

const PAGE_PATTERNS = {
  about: [/\/about/i, /\/company/i, /\/who-we-are/i, /\/our-story/i],
  team: [/\/team/i, /\/leadership/i, /\/people/i, /\/founders/i, /\/executives/i, /\/management/i],
  news: [/\/news/i, /\/press/i, /\/blog/i, /\/announcements/i],
  careers: [/\/careers/i, /\/jobs/i, /\/hiring/i, /\/join/i],
  contact: [/\/contact/i, /\/reach-us/i, /\/get-in-touch/i],
};

function discoverSubpageLinks($, baseUrl) {
  const discovered = {};
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    let absolute;
    try {
      absolute = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    } catch { return; }
    try {
      const base = new URL(baseUrl);
      const link = new URL(absolute);
      if (link.hostname !== base.hostname) return;
    } catch { return; }
    for (const [type, patterns] of Object.entries(PAGE_PATTERNS)) {
      if (patterns.some(re => re.test(absolute))) {
        if (!discovered[type]) discovered[type] = [];
        if (!discovered[type].includes(absolute)) discovered[type].push(absolute);
      }
    }
  });
  const result = {};
  for (const [type, urls] of Object.entries(discovered)) result[type] = urls.slice(0, 2);
  return result;
}

// ── Funding enrichment ───────────────────────────────────────────────────────

const AMOUNT_RE = /\$\s*(\d+(?:\.\d+)?)\s*(billion|million|bn|mn|[BMK])\b/gi;
const ROUND_RE = /\b(pre-seed|seed|series [a-f]|growth equity|growth round|debt round|credit facility|venture round|bridge round|ipo|spac)\b/gi;

function parseAmounts(text) {
  const amounts = [];
  let m;
  const re = new RegExp(AMOUNT_RE.source, AMOUNT_RE.flags);
  while ((m = re.exec(text)) !== null) {
    const num = parseFloat(m[1]);
    const unit = m[2].toLowerCase();
    let usd = num;
    if (unit === 'billion' || unit === 'bn' || unit === 'b') usd = num * 1e9;
    else if (unit === 'million' || unit === 'mn' || unit === 'm') usd = num * 1e6;
    else if (unit === 'k') usd = num * 1e3;
    amounts.push({ raw: m[0].trim(), usd });
  }
  return amounts;
}

function detectRounds(text) {
  const rounds = [];
  let m;
  const re = new RegExp(ROUND_RE.source, ROUND_RE.flags);
  while ((m = re.exec(text)) !== null) rounds.push(m[1]);
  return [...new Set(rounds)];
}

function extractInvestors(text) {
  const investors = [];
  const ledByRe = /(?:led by|backed by|invested by)\s+([A-Z][A-Za-z\s&]+(?:Capital|Ventures|Partners|Equity|Investments|Fund|Growth|Asset|Management)?)/g;
  let m;
  while ((m = ledByRe.exec(text)) !== null) investors.push(m[1].trim().replace(/\s+/g, ' '));
  const includesRe = /investors? (?:include|included|participating)\s*:?\s*([^.]+)/gi;
  while ((m = includesRe.exec(text)) !== null) {
    const names = m[1].split(/,\s*|\s+and\s+/).map(n => n.trim()).filter(n => n.length > 2 && n.length < 60 && /^[A-Z]/.test(n));
    investors.push(...names);
  }
  const seen = new Set();
  return investors.map(i => i.replace(/\s+/g, ' ').trim()).filter(i => {
    if (seen.has(i) || i.length < 3) return false;
    seen.add(i);
    return true;
  }).slice(0, 10);
}

// ── Executive hints from web search ─────────────────────────────────────────

function extractExecutiveHints(results) {
  const execs = [];
  const titleRe = /([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:the\s+)?(?:new\s+)?(CEO|CTO|CFO|COO|President|Founder|Managing Director|Managing Partner|Head of|VP|SVP|Director)/gi;
  for (const { snippet, title } of results) {
    const text = `${title} ${snippet}`;
    let match;
    while ((match = titleRe.exec(text)) !== null) {
      execs.push({ name: match[1].trim(), title: match[2].trim(), source: 'web-search' });
    }
  }
  const seen = new Set();
  return execs.filter(e => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  });
}

// ── Main enrichment per company ──────────────────────────────────────────────

async function enrichCompany(company) {
  const result = {
    companyId: company.id,
    name: company.name,
    // DB fields to update
    phone: null,
    headquarters: null,
    employee_count: null,
    founded_year: null,
    total_raised: null,
    last_funding_round: null,
    investors: null,
    linkedin_url: null,
    twitter_url: null,
    github_url: null,
    recent_news: null,
    hiring_signals: null,
    open_roles_count: null,
    // contacts to upsert
    contacts: [],
  };

  const website = company.website;
  const companyName = company.name;
  // If company already has phone, we still want other fields but skip phone sources
  const alreadyHasPhone = !!company.phone;
  
  // ── Source 1: Company website scraping ─────────────────────────────────────
  if (website) {
    const baseUrl = website.startsWith('http') ? website : `https://${website}`;
    try {
      console.log(`  [website] Scraping ${baseUrl}`);
      let homepageHtml;
      try {
        homepageHtml = await fetchHtml(baseUrl);
      } catch (e) {
        console.warn(`  [website] Homepage failed: ${e.message}`);
      }
      
      if (homepageHtml) {
        const $home = cheerio.load(homepageHtml);
        const socialLinks = extractSocialLinks($home, baseUrl);
        const subpageLinks = discoverSubpageLinks($home, baseUrl);
        const homepageText = $home('body').text().replace(/\s+/g, ' ').trim();
        
        const phones = extractPhonesFromPage($home);
        const emails = extractEmailsFromPage($home);
        
        if (!company.phone && phones.length > 0) result.phone = phones[0];
        if (!company.founded_year && !result.founded_year) {
          result.founded_year = extractFoundingYear(homepageText);
        }
        if (!company.employee_count && !result.employee_count) {
          result.employee_count = extractEmployeeCount(homepageText);
        }
        if (!company.linkedin_url && socialLinks.linkedin) result.linkedin_url = socialLinks.linkedin;
        if (!company.twitter_url && socialLinks.twitter) result.twitter_url = socialLinks.twitter;
        if (!company.github_url && socialLinks.github) result.github_url = socialLinks.github;
        
        // Scrape sub-pages
        const pagesToScrape = [];
        for (const type of ['about', 'team', 'news', 'careers', 'contact']) {
          if (subpageLinks[type]?.length > 0) {
            pagesToScrape.push({ type, url: subpageLinks[type][0] });
          }
        }
        
        const subPageResults = {};
        for (const { type, url } of pagesToScrape.slice(0, 4)) {
          try {
            console.log(`  [website] Scraping ${type} page: ${url}`);
            const html = await fetchHtml(url);
            subPageResults[type] = cheerio.load(html);
          } catch { /* non-fatal */ }
          await sleep(500);
        }
        
        if (subPageResults.team) {
          const members = extractTeamMembers(subPageResults.team);
          for (const m of members.slice(0, 10)) {
            result.contacts.push({
              name: m.name,
              title: m.title,
              source: 'company-website',
              email: null,
              phone: null,
              linkedin_url: null,
            });
          }
        }
        
        if (subPageResults.contact) {
          const $c = subPageResults.contact;
          const cPhones = extractPhonesFromPage($c);
          const cEmails = extractEmailsFromPage($c);
          const location = extractLocation($c);
          if (!result.phone && cPhones.length > 0) result.phone = cPhones[0];
          if (!result.headquarters && location) result.headquarters = location;
        }
        
        if (subPageResults.about) {
          const $a = subPageResults.about;
          const aboutText = $a('body').text().replace(/\s+/g, ' ').trim();
          if (!result.founded_year) result.founded_year = extractFoundingYear(aboutText);
          if (!result.employee_count) result.employee_count = extractEmployeeCount(aboutText);
        }
        
        if (subPageResults.news) {
          const $n = subPageResults.news;
          const items = [];
          $n('h1,h2,h3,article h2,article h3,[class*="post"] h2').each((_, el) => {
            const text = $n(el).text().trim();
            if (text.length > 10 && text.length < 200) items.push(text);
          });
          if (items.length > 0) result.recent_news = [...new Set(items)].slice(0, 5).join(' | ');
        }
        
        if (subPageResults.careers) {
          const $careers = subPageResults.careers;
          const careersText = $careers('body').text();
          const isHiring = /we(?:'re| are) hiring|join (?:our|the) team|open position|current opening/i.test(careersText);
          const rolesMatch = /(\d+)\s+(?:open|available)?\s*(?:positions?|roles?|jobs?|openings?)/i.exec(careersText);
          if (rolesMatch) result.open_roles_count = parseInt(rolesMatch[1], 10);
          result.hiring_signals = isHiring ? (rolesMatch ? `${rolesMatch[1]} open roles` : 'actively hiring') : null;
        }
      }
    } catch (err) {
      console.warn(`  [website] Error: ${err.message}`);
    }
  }
  
  // ── Source 2: Web search (DuckDuckGo) ─────────────────────────────────────
  try {
    console.log(`  [web-search] Searching for ${companyName}`);
    const queries = [
      `"${companyName}" news ${new Date().getFullYear()}`,
      `"${companyName}" CEO leadership team`,
      `"${companyName}" funding investment raised`,
    ];
    
    const allResults = [];
    for (const query of queries) {
      const res = await ddgSearch(query);
      allResults.push(...res);
      await sleep(800);
    }
    
    // Deduplicate
    const seen = new Set();
    const deduped = allResults.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });
    
    // Extract executives from web search
    const execs = extractExecutiveHints(deduped);
    for (const exec of execs.slice(0, 5)) {
      const existing = result.contacts.find(c => c.name === exec.name);
      if (!existing) {
        result.contacts.push({ name: exec.name, title: exec.title, source: 'web-search', email: null, phone: null, linkedin_url: null });
      }
    }
    
    // LinkedIn URL from search results
    if (!result.linkedin_url) {
      const liUrl = deduped.map(r => r.url).find(u => u.includes('linkedin.com/company/'));
      if (liUrl) result.linkedin_url = liUrl;
    }
    
    // News snippets
    if (!result.recent_news) {
      const newsItems = deduped.filter(r => r.snippet && r.snippet.length > 20).slice(0, 3);
      if (newsItems.length > 0) {
        result.recent_news = newsItems.map(r => r.title).join(' | ');
      }
    }
    
    // Phone from search snippets
    if (!result.phone) {
      const allText = deduped.map(r => `${r.title} ${r.snippet}`).join('\n');
      const phones = extractPhones(allText);
      if (phones.length > 0) result.phone = phones[0];
    }
    
    // Funding from search
    const allText = deduped.map(r => `${r.title} ${r.snippet}`).join('\n');
    if (!result.total_raised) {
      const amounts = parseAmounts(allText);
      if (amounts.length > 0) {
        const largest = amounts.reduce((max, a) => a.usd > (max?.usd || 0) ? a : max, null);
        if (largest) result.total_raised = largest.raw;
      }
    }
    if (!result.last_funding_round) {
      const rounds = detectRounds(allText);
      if (rounds.length > 0) result.last_funding_round = rounds[rounds.length - 1];
    }
    if (!result.investors) {
      const investors = extractInvestors(allText);
      if (investors.length > 0) result.investors = investors.slice(0, 5).join(', ');
    }
    
  } catch (err) {
    console.warn(`  [web-search] Error: ${err.message}`);
  }
  
  // ── Source 3: Direct contact page fetch + directory search ───────────────
  if (!result.phone && !alreadyHasPhone && website) {
    try {
      // Try /contact page directly (even if not discovered from homepage links)
      const baseUrl = website.startsWith('http') ? website : `https://${website}`;
      const contactUrls = [
        `${baseUrl.replace(/\/$/, '')}/contact`,
        `${baseUrl.replace(/\/$/, '')}/contact-us`,
        `${baseUrl.replace(/\/$/, '')}/contact-us/`,
        `${baseUrl.replace(/\/$/, '')}/contact/`,
      ];
      for (const cUrl of contactUrls) {
        try {
          console.log(`  [contact-page] Fetching: ${cUrl}`);
          const html = await fetchHtml(cUrl);
          const $ = cheerio.load(html);
          const phones = extractPhonesFromPage($);
          if (phones.length > 0) {
            console.log(`  [contact-page] Found phones: ${phones.join(', ')}`);
            result.phone = phones[0];
            break;
          }
        } catch { /* try next */ }
        await sleep(300);
      }
    } catch (err) {
      console.warn(`  [contact-page] Error: ${err.message}`);
    }
  }

  if (!result.phone && !alreadyHasPhone) {
    try {
      console.log(`  [directories] Searching directories for phone: ${companyName}`);
      
      // Try DDG search for phone directly
      const phoneQuery = `"${companyName}" phone number contact`;
      const phoneResults = await ddgSearch(phoneQuery);
      const allSnippets = phoneResults.map(r => `${r.title} ${r.snippet}`).join('\n');
      const phones = extractPhones(allSnippets);
      if (phones.length > 0) result.phone = phones[0];
      
      // Try BBB via DDG
      if (!result.phone) {
        await sleep(500);
        const bbbResults = await ddgSearch(`"${companyName}" site:bbb.org`);
        for (const r of bbbResults) {
          if (r.url.includes('bbb.org')) {
            const text = `${r.title} ${r.snippet}`;
            const phones2 = extractPhones(text);
            if (phones2.length > 0) { result.phone = phones2[0]; break; }
            // Fetch BBB page if we have a URL
            try {
              console.log(`  [bbb] Fetching: ${r.url}`);
              const bbbHtml = await fetchHtml(r.url, 500);
              const $bbb = cheerio.load(bbbHtml);
              const bbbPhones = extractPhonesFromPage($bbb);
              if (bbbPhones.length > 0) { result.phone = bbbPhones[0]; break; }
            } catch { }
          }
        }
      }

      // Try Yellow Pages via DDG
      if (!result.phone) {
        await sleep(500);
        const ypResults = await ddgSearch(`"${companyName}" site:yellowpages.com`);
        for (const r of ypResults) {
          if (r.url.includes('yellowpages.com')) {
            const text = `${r.title} ${r.snippet}`;
            const phones2 = extractPhones(text);
            if (phones2.length > 0) { result.phone = phones2[0]; break; }
          }
        }
      }
      
      // Headquarters from search if not found
      if (!result.headquarters) {
        const locQuery = `"${companyName}" headquarters address location`;
        await sleep(500);
        const locResults = await ddgSearch(locQuery);
        const locText = locResults.map(r => `${r.title} ${r.snippet}`).join('\n');
        const hqMatch = /(?:headquartered|based|located)\s+(?:in|at)\s+([A-Z][A-Za-z\s,]+(?:CA|NY|TX|FL|WA|MA|CO|GA|IL|VA|NC|AZ|OH|NJ|PA|MD|MN|WI|OR|TN|MO|IN|CT|NV|UT|KY|AL|SC|LA|IA|OK|KS|MS|AR|NE|NM|ID|ME|NH|WV|RI|MT|ND|SD|DE|AK|HI|VT|WY))/i.exec(locText);
        if (hqMatch) result.headquarters = hqMatch[1].trim();
      }
      
    } catch (err) {
      console.warn(`  [directories] Error: ${err.message}`);
    }
  }
  
  // ── Source 4: Dedicated funding search ────────────────────────────────────
  if (!result.total_raised) {
    try {
      console.log(`  [funding] Dedicated funding search: ${companyName}`);
      await sleep(300);
      const fundingResults = await ddgSearch(`"${companyName}" funding round raised investors`);
      const fundingText = fundingResults.map(r => `${r.title} ${r.snippet}`).join('\n');
      const amounts = parseAmounts(fundingText);
      if (amounts.length > 0) {
        const largest = amounts.reduce((max, a) => a.usd > (max?.usd || 0) ? a : max, null);
        if (largest) result.total_raised = largest.raw;
      }
      const rounds = detectRounds(fundingText);
      if (rounds.length > 0 && !result.last_funding_round) result.last_funding_round = rounds[rounds.length - 1];
      const investors = extractInvestors(fundingText);
      if (investors.length > 0 && !result.investors) result.investors = investors.slice(0, 5).join(', ');
    } catch (err) {
      console.warn(`  [funding] Error: ${err.message}`);
    }
  }
  
  return result;
}

// ── Database write-back ──────────────────────────────────────────────────────

function writeResultToDB(db, result) {
  const now = new Date().toISOString();
  
  // Use COALESCE to only fill in NULL fields (never overwrite existing data)
  const updateFields = [];
  const updateValues = [];
  
  const companyFieldMap = {
    phone: result.phone,
    headquarters: result.headquarters,
    employee_count: result.employee_count,
    founded_year: result.founded_year,
    total_raised: result.total_raised,
    last_funding_round: result.last_funding_round,
    investors: result.investors,
    linkedin_url: result.linkedin_url,
    twitter_url: result.twitter_url,
    github_url: result.github_url,
    recent_news: result.recent_news,
    hiring_signals: result.hiring_signals,
    open_roles_count: result.open_roles_count,
  };
  
  for (const [field, value] of Object.entries(companyFieldMap)) {
    if (value !== null && value !== undefined && value !== '') {
      // COALESCE: only set if the existing value is NULL
      updateFields.push(`${field} = COALESCE(${field}, ?)`);
      updateValues.push(value);
    }
  }
  
  if (updateFields.length > 0) {
    updateFields.push('last_enriched_at = ?');
    updateValues.push(now);
    updateValues.push(result.companyId);
    db.prepare(`UPDATE companies SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
  }
  
  // Upsert contacts
  for (const contact of result.contacts) {
    if (!contact.name) continue;
    // Check if contact already exists by name + company
    const existing = db.prepare('SELECT id FROM contacts WHERE company_id = ? AND name = ?').get(result.companyId, contact.name);
    if (!existing) {
      const contactId = uuidv4();
      db.prepare(`INSERT INTO contacts (id, company_id, name, title, email, phone, linkedin_url, source, verified, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`)
        .run(contactId, result.companyId, contact.name, contact.title || null, contact.email || null, contact.phone || null, contact.linkedin_url || null, contact.source || 'enrichment', now);
    } else {
      // Update existing contact with any new info
      const updates = [];
      const vals = [];
      if (contact.title) { updates.push('title = ?'); vals.push(contact.title); }
      if (contact.email) { updates.push('email = ?'); vals.push(contact.email); }
      if (contact.phone) { updates.push('phone = ?'); vals.push(contact.phone); }
      if (contact.linkedin_url) { updates.push('linkedin_url = ?'); vals.push(contact.linkedin_url); }
      if (updates.length > 0) {
        vals.push(existing.id);
        db.prepare(`UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
      }
    }
  }
  
  // Log enrichment
  db.prepare(`INSERT INTO enrichment_log (id, entity_type, entity_id, source, data_found, created_at)
              VALUES (?, 'company', ?, 'full-enrichment', ?, ?)`)
    .run(uuidv4(), result.companyId, JSON.stringify({
      phone: result.phone,
      headquarters: result.headquarters,
      contacts_found: result.contacts.length,
      total_raised: result.total_raised,
    }), now);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Corgi Full Enrichment Pipeline ===');
  console.log(`DB: ${DB_PATH}`);
  
  const db = new Database(DB_PATH);
  
  const companies = db.prepare(`
    SELECT id, name, website, type, phone, headquarters, employee_count, founded_year,
           total_raised, investors, linkedin_url, twitter_url, github_url, last_enriched_at
    FROM companies
    ORDER BY priority ASC NULLS LAST, name ASC
  `).all();
  
  console.log(`\nFound ${companies.length} companies to enrich.\n`);
  
  let processed = 0;
  let withPhone = 0;
  let withContacts = 0;
  let withFunding = 0;
  const errors = [];
  
  for (const company of companies) {
    processed++;
    const pct = ((processed / companies.length) * 100).toFixed(1);
    console.log(`\n[${processed}/${companies.length}] (${pct}%) ${company.name}`);
    console.log(`  Website: ${company.website || 'none'} | Phone: ${company.phone || 'none'}`);
    
    try {
      const result = await enrichCompany(company);
      
      // Merge with existing data (don't overwrite what's already there)
      if (company.phone && !result.phone) result.phone = null; // already set
      
      writeResultToDB(db, result);
      
      const gotPhone = result.phone && !company.phone;
      const gotContacts = result.contacts.length > 0;
      const gotFunding = result.total_raised && !company.total_raised;
      
      if (gotPhone) withPhone++;
      if (gotContacts) withContacts++;
      if (gotFunding) withFunding++;
      
      console.log(`  → phone: ${result.phone || '(none)'} | contacts: ${result.contacts.length} | funding: ${result.total_raised || '(none)'}`);
      
    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`);
      errors.push({ company: company.name, error: err.message });
    }
    
    // Rate limiting: 2 seconds between companies
    if (processed < companies.length) {
      await sleep(2000);
    }
  }
  
  // Final stats
  const finalStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(phone) as with_phone,
      COUNT(headquarters) as with_hq,
      COUNT(employee_count) as with_emp,
      COUNT(total_raised) as with_funding,
      COUNT(linkedin_url) as with_linkedin
    FROM companies
  `).get();
  
  const totalContacts = db.prepare('SELECT COUNT(*) as cnt FROM contacts').get();
  
  console.log('\n=== ENRICHMENT COMPLETE ===');
  console.log(`Processed: ${processed} companies`);
  console.log(`New phones found: ${withPhone}`);
  console.log(`New contacts found: ${withContacts} companies had contacts`);
  console.log(`New funding data: ${withFunding}`);
  console.log(`Errors: ${errors.length}`);
  console.log('\nFinal DB stats:');
  console.log(`  Total companies: ${finalStats.total}`);
  console.log(`  With phone: ${finalStats.with_phone}`);
  console.log(`  With HQ: ${finalStats.with_hq}`);
  console.log(`  With employee count: ${finalStats.with_emp}`);
  console.log(`  With funding: ${finalStats.with_funding}`);
  console.log(`  With LinkedIn: ${finalStats.with_linkedin}`);
  console.log(`  Total contacts: ${totalContacts.cnt}`);
  
  if (errors.length > 0) {
    console.log('\nErrors:');
    for (const e of errors) console.log(`  - ${e.company}: ${e.error}`);
  }
  
  db.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
