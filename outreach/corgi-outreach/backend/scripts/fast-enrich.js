#!/usr/bin/env node
/**
 * fast-enrich.js — Website-only enrichment, fast, concurrent.
 * Focuses on: phone, email, social links, team members, hiring signals.
 * Skips DDG (rate-limited). Resumes from where we left off.
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const TIMEOUT_MS = 8000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const CONCURRENCY = 3; // process 3 companies at once
const DELAY_BETWEEN_BATCHES_MS = 1000; // 1s between batches

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── HTTP fetch ───────────────────────────────────────────────────────────────

async function fetchHtml(url) {
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
    if (res.status === 404 || res.status === 410) return null; // not found, skip
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return null; // timeout = not found
    throw err;
  }
}

// ── Phone validation ─────────────────────────────────────────────────────────

const FAKE_PHONES = new Set([
  '0000000000','1111111111','2222222222','3333333333','4444444444',
  '5555555555','6666666666','7777777777','8888888888','9999999999',
  '1234567890','0987654321','1231231234','5555551234',
]);

function isValidPhone(raw) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return false;
  if (/^(19|20)\d{8}$/.test(digits)) return false;
  if (FAKE_PHONES.has(digits)) return false;
  if (/^(\d)\1{9,}$/.test(digits)) return false;
  const ac = digits.length === 11 ? digits.slice(1, 4) : digits.slice(0, 3);
  if (ac === '900') return false;
  if (['0', '1'].includes(ac[0])) return false;
  return true;
}

const PHONE_RE = /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;

function extractPhones(text) {
  const found = new Set();
  const r = new RegExp(PHONE_RE.source, PHONE_RE.flags);
  let m;
  while ((m = r.exec(text)) !== null) {
    if (isValidPhone(m[0])) found.add(m[0].trim());
  }
  return [...found];
}

function extractPhonesFromPage($) {
  const phones = new Set();
  
  $('a[href^="tel:"]').each((_, el) => {
    const num = ($(el).attr('href') || '').replace('tel:', '').trim();
    if (isValidPhone(num)) phones.add(num);
  });
  
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        for (const key of ['telephone', 'phone']) {
          if (typeof item[key] === 'string' && isValidPhone(item[key])) phones.add(item[key]);
        }
        if (item.contactPoint) {
          const cp = Array.isArray(item.contactPoint) ? item.contactPoint : [item.contactPoint];
          for (const c of cp) if (typeof c.telephone === 'string' && isValidPhone(c.telephone)) phones.add(c.telephone);
        }
      }
    } catch { }
  });
  
  // Elements with phone semantics
  const selectors = ['a[href^="tel:"]', '[class*="phone"]', '[class*="tel"]', '[id*="phone"]',
    '[itemprop="telephone"]', 'footer', 'header', '[class*="footer"]', '[class*="header"]',
    '[class*="contact"]', '[class*="cta"]'];
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      for (const p of extractPhones($(el).text())) phones.add(p);
    });
  }
  
  // Body scan
  for (const p of extractPhones($('body').text())) phones.add(p);
  
  return [...phones].slice(0, 10);
}

function extractEmailsFromPage($) {
  const emails = new Set();
  $('a[href^="mailto:"]').each((_, el) => {
    const email = ($(el).attr('href') || '').replace('mailto:', '').split('?')[0].trim().toLowerCase();
    if (email && !email.includes('example') && !email.includes('your@')) emails.add(email);
  });
  return [...emails].slice(0, 5);
}

function extractSocialLinks($, baseUrl) {
  const social = {};
  const patterns = {
    linkedin: /linkedin\.com\/company\//i,
    twitter: /(?:twitter\.com|x\.com)\//i,
    github: /github\.com\//i,
  };
  const scope = $('footer,[class*="footer"],[id*="footer"]').length
    ? $('footer,[class*="footer"],[id*="footer"]')
    : $('body');
  scope.find('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    for (const [p, re] of Object.entries(patterns)) {
      if (!social[p] && re.test(href)) {
        try { social[p] = href.startsWith('http') ? href : new URL(href, baseUrl).href; }
        catch { social[p] = href; }
      }
    }
  });
  // Also check full page for LinkedIn
  if (!social.linkedin) {
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (!social.linkedin && /linkedin\.com\/company\//i.test(href)) {
        try { social.linkedin = href.startsWith('http') ? href : new URL(href, baseUrl).href; }
        catch { social.linkedin = href; }
      }
    });
  }
  return social;
}

function extractTeamMembers($) {
  const members = [];
  const titleRe = /CEO|CTO|CFO|COO|President|Founder|Partner|Director|VP|SVP|EVP|Head|Principal|Manager|Officer/i;
  const selectors = [
    "[class*='team'] [class*='member']", "[class*='team'] [class*='card']",
    "[class*='leader'] [class*='card']", "[class*='people'] [class*='card']",
    "[class*='person']", "[class*='bio']", "[class*='executive']",
  ];
  for (const sel of selectors) {
    const cards = $(sel);
    if (!cards.length) continue;
    cards.each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length < 5 || text.length > 500) return;
      const lines = text.split(/\n|·|•|\|/).map(l => l.trim()).filter(Boolean);
      const name = lines.find(l => /^[A-Z][a-z]+ [A-Z][a-z]+/.test(l) && l.length < 60);
      const title = lines.find(l => titleRe.test(l) && l.length < 100);
      if (name && title && name !== title) members.push({ name: name.slice(0, 80), title: title.slice(0, 100) });
    });
    if (members.length > 0) break;
  }
  const seen = new Set();
  return members.filter(m => { if (seen.has(m.name)) return false; seen.add(m.name); return true; }).slice(0, 15);
}

function extractFoundingYear(text) {
  const m = /(?:founded|established|incorporated|started|launched)\s+(?:in\s+)?(\d{4})/i.exec(text);
  if (m) { const yr = parseInt(m[1], 10); if (yr >= 1900 && yr <= 2026) return yr; }
  return null;
}

function extractEmployeeCount(text) {
  const patterns = [
    /(\d+(?:,\d+)?)\+?\s+employees/i,
    /team of (\d+(?:,\d+)?)/i,
    /over (\d+(?:,\d+)?)\s+(?:people|employees|staff)/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m) return m[1].replace(/,/g, '');
  }
  return null;
}

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
    try { absolute = href.startsWith('http') ? href : new URL(href, baseUrl).href; }
    catch { return; }
    try {
      const base = new URL(baseUrl), link = new URL(absolute);
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
  for (const [type, urls] of Object.entries(discovered)) result[type] = urls.slice(0, 1); // only first
  return result;
}

// ── Enrich one company ────────────────────────────────────────────────────────

async function enrichCompany(company) {
  const result = {
    companyId: company.id,
    name: company.name,
    phone: null,
    headquarters: null,
    employee_count: null,
    founded_year: null,
    linkedin_url: null,
    twitter_url: null,
    github_url: null,
    hiring_signals: null,
    open_roles_count: null,
    recent_news: null,
    contacts: [],
  };
  
  if (!company.website) return result;
  
  const baseUrl = company.website.startsWith('http') ? company.website : `https://${company.website}`;
  const alreadyHasPhone = !!company.phone;
  
  // ── Homepage ─────────────────────────────────────────────────────────────
  let homepageHtml;
  try {
    homepageHtml = await fetchHtml(baseUrl);
  } catch (e) {
    process.stdout.write(`  ✗ Homepage error: ${e.message}\n`);
    return result;
  }
  if (!homepageHtml) return result;
  
  const $home = cheerio.load(homepageHtml);
  const socialLinks = extractSocialLinks($home, baseUrl);
  const subpageLinks = discoverSubpageLinks($home, baseUrl);
  const homepageText = $home('body').text().replace(/\s+/g, ' ').trim();
  
  if (!alreadyHasPhone) {
    const phones = extractPhonesFromPage($home);
    if (phones.length > 0) result.phone = phones[0];
  }
  
  if (!company.founded_year) result.founded_year = extractFoundingYear(homepageText);
  if (!company.employee_count) result.employee_count = extractEmployeeCount(homepageText);
  if (!company.linkedin_url) result.linkedin_url = socialLinks.linkedin || null;
  if (!company.twitter_url) result.twitter_url = socialLinks.twitter || null;
  if (!company.github_url) result.github_url = socialLinks.github || null;
  
  // ── Sub-pages (max 3 total, prioritize contact for phones) ───────────────
  const pagePriority = ['contact', 'team', 'about', 'news', 'careers'];
  const pagesToFetch = [];
  for (const type of pagePriority) {
    if (subpageLinks[type]?.length > 0) {
      pagesToFetch.push({ type, url: subpageLinks[type][0] });
    }
    if (pagesToFetch.length >= 3) break;
  }
  
  // Also try /contact directly if not discovered
  if (!alreadyHasPhone && !result.phone && !pagesToFetch.find(p => p.type === 'contact')) {
    const contactUrl = `${baseUrl.replace(/\/$/, '')}/contact`;
    pagesToFetch.unshift({ type: 'contact_direct', url: contactUrl });
  }
  
  for (const { type, url } of pagesToFetch.slice(0, 4)) {
    try {
      const html = await fetchHtml(url);
      if (!html) continue;
      const $ = cheerio.load(html);
      
      if ((type === 'contact' || type === 'contact_direct') && !alreadyHasPhone && !result.phone) {
        const phones = extractPhonesFromPage($);
        if (phones.length > 0) result.phone = phones[0];
        const loc = extractLocation($);
        if (loc && !result.headquarters) result.headquarters = loc;
        const emails = extractEmailsFromPage($);
        // Store HQ email if found
        if (emails.length > 0 && !result._email) result._email = emails[0];
      }
      
      if (type === 'team') {
        const members = extractTeamMembers($);
        for (const m of members.slice(0, 10)) {
          result.contacts.push({ name: m.name, title: m.title, source: 'company-website' });
        }
      }
      
      if (type === 'about') {
        const aboutText = $('body').text().replace(/\s+/g, ' ').trim();
        if (!result.founded_year) result.founded_year = extractFoundingYear(aboutText);
        if (!result.employee_count) result.employee_count = extractEmployeeCount(aboutText);
      }
      
      if (type === 'careers') {
        const careersText = $('body').text();
        const isHiring = /we(?:'re| are) hiring|join (?:our|the) team|open position|current opening/i.test(careersText);
        const rolesMatch = /(\d+)\s+(?:open|available)?\s*(?:positions?|roles?|jobs?|openings?)/i.exec(careersText);
        if (rolesMatch && !result.open_roles_count) result.open_roles_count = parseInt(rolesMatch[1], 10);
        if (isHiring && !result.hiring_signals) {
          result.hiring_signals = rolesMatch ? `${rolesMatch[1]} open roles` : 'actively hiring';
        }
      }
      
      if (type === 'news') {
        const titles = [];
        $('h1,h2,h3,[class*="post"] h2,[class*="blog"] h2,article h2').each((_, el) => {
          const t = $(el).text().trim();
          if (t.length > 10 && t.length < 200) titles.push(t);
        });
        if (titles.length > 0 && !result.recent_news) {
          result.recent_news = [...new Set(titles)].slice(0, 5).join(' | ');
        }
      }
      
    } catch { /* non-fatal */ }
  }
  
  return result;
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

// ── DB write-back ─────────────────────────────────────────────────────────────

function writeResultToDB(db, result) {
  const now = new Date().toISOString();
  const fieldMap = {
    phone: result.phone,
    headquarters: result.headquarters,
    employee_count: result.employee_count,
    founded_year: result.founded_year,
    linkedin_url: result.linkedin_url,
    twitter_url: result.twitter_url,
    github_url: result.github_url,
    hiring_signals: result.hiring_signals,
    open_roles_count: result.open_roles_count,
    recent_news: result.recent_news,
  };
  
  const updates = [], vals = [];
  for (const [field, value] of Object.entries(fieldMap)) {
    if (value !== null && value !== undefined && value !== '') {
      updates.push(`${field} = COALESCE(${field}, ?)`);
      vals.push(value);
    }
  }
  
  updates.push('last_enriched_at = ?');
  vals.push(now);
  vals.push(result.companyId);
  
  db.prepare(`UPDATE companies SET ${updates.join(', ')} WHERE id = ?`).run(...vals);
  
  for (const contact of result.contacts) {
    if (!contact.name) continue;
    const existing = db.prepare('SELECT id FROM contacts WHERE company_id = ? AND name = ?').get(result.companyId, contact.name);
    if (!existing) {
      db.prepare(`INSERT INTO contacts (id, company_id, name, title, email, phone, linkedin_url, source, verified, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`)
        .run(uuidv4(), result.companyId, contact.name, contact.title || null, null, null, null, contact.source || 'enrichment', now);
    }
  }
  
  db.prepare(`INSERT INTO enrichment_log (id, entity_type, entity_id, source, data_found, created_at)
              VALUES (?, 'company', ?, 'fast-enrich', ?, ?)`)
    .run(uuidv4(), result.companyId, JSON.stringify({ phone: result.phone, contacts: result.contacts.length, linkedin: result.linkedin_url }), now);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const forceAll = args.includes('--all');
  
  console.log('=== Corgi Fast Enrichment (website-only) ===');
  const db = new Database(DB_PATH);
  
  // Process companies that haven't been enriched yet (or --all flag)
  const whereClause = forceAll ? '' : 'WHERE last_enriched_at IS NULL';
  const companies = db.prepare(`
    SELECT id, name, website, type, phone, headquarters, employee_count, founded_year,
           linkedin_url, twitter_url, github_url
    FROM companies ${whereClause}
    ORDER BY priority ASC NULLS LAST, name ASC
  `).all();
  
  console.log(`Found ${companies.length} companies to enrich (${forceAll ? 'all' : 'unenriched only'}).\n`);
  
  if (companies.length === 0) {
    console.log('Nothing to do!');
    db.close();
    return;
  }
  
  let processed = 0, phonesFound = 0, contactsFound = 0, linkedinFound = 0;
  const startTime = Date.now();
  
  // Process in batches of CONCURRENCY
  for (let i = 0; i < companies.length; i += CONCURRENCY) {
    const batch = companies.slice(i, i + CONCURRENCY);
    
    await Promise.all(batch.map(async (company) => {
      const idx = i + batch.indexOf(company) + 1;
      const pct = ((idx / companies.length) * 100).toFixed(1);
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = companies.length - idx;
      const eta = remaining > 0 ? Math.round((elapsed / idx) * remaining) : 0;
      
      process.stdout.write(`[${idx}/${companies.length}] ${company.name}\n`);
      
      const result = await enrichCompany(company);
      writeResultToDB(db, result);
      
      const gotPhone = result.phone && !company.phone;
      const gotLi = result.linkedin_url && !company.linkedin_url;
      if (gotPhone) phonesFound++;
      if (result.contacts.length > 0) contactsFound++;
      if (gotLi) linkedinFound++;
      processed++;
      
      const summary = [
        result.phone ? `📞 ${result.phone}` : '',
        result.linkedin_url ? '🔗 LinkedIn' : '',
        result.contacts.length > 0 ? `👤 ${result.contacts.length} contacts` : '',
      ].filter(Boolean);
      
      if (summary.length > 0) {
        process.stdout.write(`  → ${summary.join(' | ')}\n`);
      }
    }));
    
    if (i + CONCURRENCY < companies.length) await sleep(DELAY_BETWEEN_BATCHES_MS);
    
    // Progress report every 30 companies
    if ((i + CONCURRENCY) % 30 === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      const stats = db.prepare('SELECT COUNT(*) as t, COUNT(phone) as p, COUNT(linkedin_url) as l FROM companies').get();
      console.log(`\n--- Progress after ${processed} companies (${elapsed}m elapsed) ---`);
      console.log(`  DB: ${stats.p}/${stats.t} phones, ${stats.l}/${stats.t} LinkedIn`);
      console.log(`  This run: +${phonesFound} phones, +${contactsFound} companies with contacts, +${linkedinFound} LinkedIn\n`);
    }
  }
  
  const finalStats = db.prepare(`
    SELECT COUNT(*) as total, COUNT(phone) as with_phone, COUNT(headquarters) as with_hq,
           COUNT(employee_count) as with_emp, COUNT(total_raised) as with_funding,
           COUNT(linkedin_url) as with_linkedin, COUNT(twitter_url) as with_twitter
    FROM companies`).get();
  const totalContacts = db.prepare('SELECT COUNT(*) as cnt FROM contacts').get();
  
  console.log('\n=== FAST ENRICHMENT COMPLETE ===');
  console.log(`Processed: ${processed} companies`);
  console.log(`New phones: +${phonesFound}`);
  console.log(`New LinkedIn: +${linkedinFound}`);
  console.log(`Companies with new contacts: ${contactsFound}`);
  console.log('\nFinal DB stats:');
  console.log(`  With phone:    ${finalStats.with_phone}/${finalStats.total}`);
  console.log(`  With HQ:       ${finalStats.with_hq}/${finalStats.total}`);
  console.log(`  With funding:  ${finalStats.with_funding}/${finalStats.total}`);
  console.log(`  With LinkedIn: ${finalStats.with_linkedin}/${finalStats.total}`);
  console.log(`  With Twitter:  ${finalStats.with_twitter}/${finalStats.total}`);
  console.log(`  Total contacts: ${totalContacts.cnt}`);
  
  db.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
