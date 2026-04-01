#!/usr/bin/env node
/**
 * phone-hunter.js — Targeted phone number finder for companies without phones.
 * Directly queries BBB, Manta, YellowPages without DDG intermediary.
 */
'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const TIMEOUT_MS = 10000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': UA, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    clearTimeout(timer);
    return null;
  }
}

const FAKE_PHONES = new Set(['0000000000','1111111111','2222222222','3333333333','4444444444','5555555555','6666666666','7777777777','8888888888','9999999999','1234567890']);
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
  while ((m = r.exec(text)) !== null) if (isValidPhone(m[0])) found.add(m[0].trim());
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
      const j = JSON.parse($(el).html() || '');
      const items = Array.isArray(j) ? j : [j];
      for (const item of items) {
        if (typeof item.telephone === 'string' && isValidPhone(item.telephone)) phones.add(item.telephone);
        if (item.contactPoint) {
          const cp = Array.isArray(item.contactPoint) ? item.contactPoint : [item.contactPoint];
          for (const c of cp) if (typeof c.telephone === 'string' && isValidPhone(c.telephone)) phones.add(c.telephone);
        }
      }
    } catch { }
  });
  for (const p of extractPhones($('body').text())) phones.add(p);
  return [...phones].slice(0, 5);
}

async function tryBBB(companyName, website) {
  // Try BBB search
  const query = encodeURIComponent(companyName.replace(/[^\w\s]/g, '').trim());
  const bbbSearchUrl = `https://www.bbb.org/search?find_text=${query}&find_loc=`;
  const html = await fetchHtml(bbbSearchUrl);
  if (!html) return null;
  const $ = cheerio.load(html);
  
  // Find company match in results
  const phones = extractPhonesFromPage($);
  if (phones.length > 0) return phones[0];
  
  // Try to find a specific BBB page link
  let bbbPageUrl = null;
  $('a[href*="/business-reviews/"]').each((_, el) => {
    if (!bbbPageUrl) {
      const href = $(el).attr('href') || '';
      if (href.includes('/business-reviews/')) bbbPageUrl = href.startsWith('http') ? href : `https://www.bbb.org${href}`;
    }
  });
  
  if (bbbPageUrl) {
    await sleep(1000);
    const bbbHtml = await fetchHtml(bbbPageUrl);
    if (bbbHtml) {
      const $bbb = cheerio.load(bbbHtml);
      const bbbPhones = extractPhonesFromPage($bbb);
      if (bbbPhones.length > 0) return bbbPhones[0];
    }
  }
  
  return null;
}

async function tryManta(companyName) {
  const query = encodeURIComponent(companyName.replace(/[^\w\s]/g, ' ').trim());
  const url = `https://www.manta.com/search?search_source=manta&opt=ab&search[name]=${query}`;
  const html = await fetchHtml(url);
  if (!html) return null;
  const phones = extractPhones(html);
  return phones.length > 0 ? phones[0] : null;
}

async function tryContactPages(website) {
  if (!website) return null;
  const baseUrl = website.startsWith('http') ? website : `https://${website}`;
  const base = baseUrl.replace(/\/$/, '');
  
  const urls = [
    `${base}/contact-us`,
    `${base}/contact-us/`,
    `${base}/about/contact`,
    `${base}/company/contact`,
    `${base}/support`,
    `${base}/get-in-touch`,
    `${base}/reach-us`,
  ];
  
  for (const url of urls) {
    const html = await fetchHtml(url);
    if (html) {
      const $ = cheerio.load(html);
      const phones = extractPhonesFromPage($);
      if (phones.length > 0) return phones[0];
    }
    await sleep(200);
  }
  return null;
}

async function tryBingSearch(companyName) {
  // Bing returns HTML - try to extract phone from knowledge card or local results
  const query = encodeURIComponent(`"${companyName}" phone number`);
  const url = `https://www.bing.com/search?q=${query}&form=QBLH&setlang=en-US`;
  const html = await fetchHtml(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  // Look for tel: links in results
  let phone = null;
  $('a[href^="tel:"]').each((_, el) => {
    if (!phone) {
      const n = ($(el).attr('href') || '').replace('tel:', '').trim();
      if (isValidPhone(n)) phone = n;
    }
  });
  if (phone) return phone;
  
  // Look in knowledge panel area (Bing entity box)
  const entitySelectors = ['#vs-entity-card', '.b_entityCard', '.b_vPanel', '.b_lBottom'];
  for (const sel of entitySelectors) {
    const text = $(sel).text();
    if (text) {
      const phones = extractPhones(text);
      if (phones.length > 0) return phones[0];
    }
  }
  
  // Look in snippets for phone patterns near "phone" keywords
  const fullText = $('body').text();
  const labelRe = /(?:phone|call|tel)[:\s]+([(\d][\d\s\-.()+]{7,}[\d])/gi;
  let m;
  while ((m = labelRe.exec(fullText)) !== null) {
    if (isValidPhone(m[1])) return m[1].trim();
  }
  
  return null;
}

async function findPhoneForCompany(company) {
  const name = company.name;
  process.stdout.write(`[${name}] `);
  
  // 1. Try more contact page variations
  const ctPhone = await tryContactPages(company.website);
  if (ctPhone) { process.stdout.write(`contact-page: ${ctPhone}\n`); return ctPhone; }
  
  // 2. Try Bing search
  await sleep(800);
  const bingPhone = await tryBingSearch(name);
  if (bingPhone) { process.stdout.write(`bing: ${bingPhone}\n`); return bingPhone; }
  
  // 3. Try BBB
  await sleep(1000);
  const bbbPhone = await tryBBB(name, company.website);
  if (bbbPhone) { process.stdout.write(`bbb: ${bbbPhone}\n`); return bbbPhone; }
  
  process.stdout.write(`not found\n`);
  return null;
}

async function main() {
  const db = new Database(DB_PATH);
  
  const companies = db.prepare(`
    SELECT id, name, website, type FROM companies 
    WHERE phone IS NULL
    ORDER BY priority ASC NULLS LAST, type DESC, name ASC
  `).all();
  
  console.log(`=== Phone Hunter ===`);
  console.log(`${companies.length} companies need phones.\n`);
  
  let found = 0;
  const now = new Date().toISOString();
  
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const phone = await findPhoneForCompany(company);
    
    if (phone) {
      db.prepare('UPDATE companies SET phone = ?, last_enriched_at = ? WHERE id = ?')
        .run(phone, now, company.id);
      found++;
    }
    
    // Pause every 10 companies
    if ((i + 1) % 10 === 0) {
      console.log(`\n--- ${i+1}/${companies.length} done, ${found} phones found ---\n`);
      await sleep(2000);
    } else {
      await sleep(500);
    }
  }
  
  const stats = db.prepare('SELECT COUNT(*) as t, COUNT(phone) as p FROM companies').get();
  console.log(`\n=== PHONE HUNTER DONE ===`);
  console.log(`Found: ${found} new phones`);
  console.log(`Total: ${stats.p}/${stats.t} companies with phones`);
  
  db.close();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
