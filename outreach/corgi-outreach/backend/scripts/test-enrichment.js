#!/usr/bin/env node
/**
 * test-enrichment.js - Test enrichment on 3 companies
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../data/corgi_outreach.db');
const TIMEOUT_MS = 15000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

class RateLimiter {
  constructor({ maxConcurrent = 2, minDelayMs = 1500 } = {}) {
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
        item.fn().then(item.resolve).catch(item.reject).finally(() => {
          this.active--;
          this._drain();
        });
      }, wait);
    }
  }
}

const rateLimiter = new RateLimiter({ maxConcurrent: 2, minDelayMs: 1500 });

async function fetchHtml(url, extraDelayMs = 0) {
  return rateLimiter.run(async () => {
    if (extraDelayMs > 0) await sleep(extraDelayMs);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html', 'Accept-Language': 'en-US,en;q=0.5' },
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

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function ddgSearch(query) {
  return rateLimiter.run(async () => {
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}&kl=us-en`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)', Accept: 'text/html' },
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      const results = [];
      $('tr').each((_, row) => {
        const titleEl = $(row).find('a.result-link');
        const snippetEl = $(row).next('tr').find('.result-snippet');
        const title = titleEl.text().trim();
        const url2 = titleEl.attr('href') || '';
        const snippet = snippetEl.text().trim();
        if (title && (snippet || url2)) results.push({ title, snippet, url: url2 });
      });
      return results.slice(0, 10);
    } catch (err) {
      clearTimeout(timer);
      console.warn(`  [ddg] Failed: ${err.message}`);
      return [];
    }
  });
}

const PHONE_PATTERNS = [
  /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,
  /\+1\s?\d{10}\b/g,
];

function extractPhones(text) {
  const found = new Set();
  for (const re of PHONE_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    let m;
    while ((m = r.exec(text)) !== null) {
      const raw = m[0].trim();
      const digits = raw.replace(/\D/g, '');
      if (digits.length >= 10 && digits.length <= 11 && !/^(19|20)\d{8}$/.test(digits)) found.add(raw);
    }
  }
  return [...found];
}

function extractPhonesFromPage($) {
  const phones = new Set();
  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const num = href.replace('tel:', '').replace(/\s/g, '');
    if (num.replace(/\D/g, '').length >= 10) phones.add(num);
  });
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        for (const key of ['telephone', 'phone']) {
          if (typeof item[key] === 'string') phones.add(item[key]);
        }
      }
    } catch { }
  });
  const bodyText = $('body').text();
  for (const p of extractPhones(bodyText)) phones.add(p);
  return [...phones].slice(0, 5);
}

async function testCompany(company) {
  console.log(`\n--- Testing: ${company.name} (${company.website}) ---`);
  const result = { phone: null, contacts: [], total_raised: null };
  
  // Website scrape
  if (company.website) {
    const baseUrl = company.website.startsWith('http') ? company.website : `https://${company.website}`;
    try {
      const html = await fetchHtml(baseUrl);
      const $ = cheerio.load(html);
      const phones = extractPhonesFromPage($);
      console.log(`  Website phones found: ${phones.join(', ') || 'none'}`);
      if (phones.length > 0) result.phone = phones[0];
      
      // Social links
      const liMatch = html.match(/linkedin\.com\/company\/([^"'\s/]+)/i);
      if (liMatch) console.log(`  LinkedIn: https://linkedin.com/company/${liMatch[1]}`);
    } catch (e) {
      console.warn(`  Website error: ${e.message}`);
    }
  }
  
  // DDG search
  await sleep(1000);
  const q = `"${company.name}" phone contact`;
  const res = await ddgSearch(q);
  const allText = res.map(r => `${r.title} ${r.snippet}`).join('\n');
  const phones = extractPhones(allText);
  console.log(`  DDG phones: ${phones.slice(0, 3).join(', ') || 'none'}`);
  if (!result.phone && phones.length > 0) result.phone = phones[0];
  
  console.log(`  → Final phone: ${result.phone || 'NOT FOUND'}`);
  return result;
}

async function main() {
  const db = new Database(DB_PATH);
  const companies = db.prepare('SELECT id, name, website, phone FROM companies WHERE phone IS NULL LIMIT 5').all();
  console.log(`Testing on ${companies.length} companies without phones...\n`);
  
  for (const c of companies) {
    await testCompany(c);
    await sleep(2000);
  }
  
  db.close();
  console.log('\nTest complete!');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
