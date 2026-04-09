#!/usr/bin/env node
/**
 * ZoomInfo Scraper v3 — Domain-Verified
 * 
 * Key fix: After landing on a company profile, verifies the profile's domain
 * matches our target domain BEFORE extracting any data.
 * Also intercepts ZI's internal API responses for cleaner data extraction.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import { execSync } from 'child_process';

const STORAGE_PATH = 'jordan.ai/zi_storage.json';
const DB_PATH = 'jordan.ai/pipeline/master.db';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function lookupCompany(domain) {
  let browser;
  const result = { domain, found: false, data: {}, ts: new Date().toISOString() };
  
  try {
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
      timeout: 15000
    });
    
    const context = await browser.newContext({ storageState: STORAGE_PATH });
    const page = await context.newPage();
    
    // Intercept ZI's internal API calls to get clean JSON data
    let profileData = null;
    page.on('response', async (resp) => {
      const url = resp.url();
      if (url.includes('/profile/company/') && url.includes('/details') || 
          url.includes('companyprofile') || 
          url.includes('/ziapi/') && url.includes('company')) {
        try {
          const body = await resp.json();
          if (body && (body.data || body.company || body.name)) {
            profileData = body.data || body.company || body;
          }
        } catch {}
      }
    });
    
    // Go to home
    await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);
    
    if (page.url().includes('login')) {
      result.error = 'SESSION_EXPIRED';
      await browser.close();
      return result;
    }
    
    // Wait for search bar with retries
    let input = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      input = await page.$('input[aria-label="Quick Search"]');
      if (input) break;
      await page.waitForTimeout(2000);
    }
    if (!input) { result.error = 'no_search_bar'; await browser.close(); return result; }
    
    await input.click();
    await input.type(domain, { delay: 30 });
    await page.waitForTimeout(2500);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    const url = page.url();
    
    if (!url.includes('/profile/company/')) {
      result.error = 'no_profile_match';
      await browser.close();
      return result;
    }
    
    // === DOMAIN VERIFICATION ===
    // Extract the page text and verify the domain/website shown matches our target
    const bodyText = await page.textContent('body');
    const clean = bodyText.replace(/\s+/g, ' ');
    
    // Look for the website shown on the profile
    const baseDomain = domain.replace(/^www\./, '').toLowerCase();
    const domainParts = baseDomain.split('.');
    const domainRoot = domainParts.slice(0, -1).join('.'); // e.g., "statusgator" from "statusgator.com"
    
    const ziId = url.match(/company\/(\d+)/)?.[1];
    
    // === DOMAIN VERIFICATION via the actual company-website element ===
    let profileWebsite = '';
    try {
      const websiteEl = await page.$('[class*="company-website"], a[class*="url"]');
      if (websiteEl) {
        profileWebsite = (await websiteEl.textContent())?.trim()?.toLowerCase()?.replace(/^(https?:\/\/)?(www\.)?/, '') || '';
      }
    } catch {}
    
    // Fallback: check all external links
    if (!profileWebsite) {
      try {
        const links = await page.$$eval('a[target="_blank"]', els => 
          els.filter(e => e.offsetParent !== null && !e.href.includes('zoominfo') && !e.href.includes('google') && !e.href.includes('linkedin'))
            .map(e => e.textContent?.trim()?.toLowerCase())
        );
        profileWebsite = links.find(l => l?.includes('.')) || '';
        profileWebsite = profileWebsite.replace(/^(https?:\/\/)?(www\.)?/, '');
      } catch {}
    }
    
    // Strict match: the ZI profile's website must match our target domain
    // e.g. "buttondownsf.com" does NOT match "buttondown.com"
    // e.g. "gliffy.com" does NOT match "glif.app"
    // We normalize both and do exact or near-exact domain comparison
    const profileDomainRoot = profileWebsite.split('/')[0]?.split('.').slice(0, -1).join('.') || '';
    const domainInProfile = profileWebsite.startsWith(baseDomain) || 
                           profileWebsite.startsWith(domainRoot + '.') ||
                           baseDomain === profileWebsite.split('/')[0];
    
    if (!domainInProfile) {
      result.error = 'domain_mismatch';
      result.zi_profile_website = profileWebsite;
      result.zi_id = ziId;
      await browser.close();
      return result;
    }
    
    // === VERIFIED — Extract data ===
    result.verified = true;
    result.zi_id = ziId;
    
    // Revenue
    const revMatch = clean.match(/\$([\d,.]+)\s*(Million|Billion|Thousand)/i);
    if (revMatch) {
      const num = parseFloat(revMatch[1].replace(/,/g, ''));
      const unit = revMatch[2].toLowerCase();
      result.data.revenue_raw = `$${revMatch[1]} ${revMatch[2]}`;
      if (unit === 'billion') result.data.revenue_th = num * 1000000;
      else if (unit === 'million') result.data.revenue_th = num * 1000;
      else result.data.revenue_th = num;
    }
    
    // Employee range
    const empMatch = clean.match(/(\d{1,5})\s*-\s*(\d{1,5})/);
    if (empMatch) {
      const lo = parseInt(empMatch[1]);
      const hi = parseInt(empMatch[2]);
      if (hi <= 100000 && lo < hi) {
        result.data.employee_range = `${lo}-${hi}`;
        result.data.employee_count = Math.round((lo + hi) / 2);
      }
    }
    
    // Year Founded
    const foundedMatch = clean.match(/Year Founded:?\s*(\d{4})/i);
    if (foundedMatch) result.data.year_founded = parseInt(foundedMatch[1]);
    
    // SIC / NAICS
    const sicMatch = clean.match(/SIC Codes?\s*([\d,\s]+)/i);
    if (sicMatch) result.data.sic_codes = sicMatch[1].trim();
    const naicsMatch = clean.match(/NAICS Codes?\s*([\d,\s]+)/i);
    if (naicsMatch) result.data.naics_codes = naicsMatch[1].trim();
    
    // Location
    const locMatch = clean.match(/([A-Z][a-z]+(?:\s[A-Z][a-z]+)*),?\s*([A-Z]{2})\s+(\d{5})/);
    if (locMatch) {
      result.data.city = locMatch[1];
      result.data.state_code = locMatch[2];
    }
    
    // Industry
    const indMatch = clean.match(/Industries?\s+([A-Z][^\d]{5,80}?)(?:Clear|Products|Company Codes)/i);
    if (indMatch) result.data.industry = indMatch[1].trim();
    
    // Description
    const descMatch = clean.match(/Company Details\s+(.*?)(?:Show More|Corporate Hierarchy|Domain Rank)/i);
    if (descMatch) result.data.description = descMatch[1].trim().substring(0, 500);
    
    result.found = Object.keys(result.data).length > 0;
    
    // Save refreshed cookies
    await context.storageState({ path: STORAGE_PATH });
    await browser.close();
    
  } catch(e) {
    result.error = e.message.substring(0, 200);
    try { await browser?.close(); } catch {}
  }
  
  return result;
}

// Test mode
async function test() {
  const testDomains = [
    { domain: 'statusgator.com', expect: { emp_range: '1-10', year: 2014 } },
    { domain: 'tuple.app', expect: { year: 2018 } },
    { domain: 'buttondown.com', expect: {} },
    { domain: 'glif.app', expect: { note: 'small startup - should NOT match 1300 emp company' } },
    { domain: 'basecamp.com', expect: { note: 'well known - should find' } },
    { domain: 'logsnag.com', expect: { note: 'tiny startup' } },
  ];
  
  console.log('=== ZoomInfo Scraper v3 — Domain Verification Test ===\n');
  
  for (const t of testDomains) {
    const result = await lookupCompany(t.domain);
    const status = result.found ? '✅ FOUND' : (result.error === 'domain_mismatch' ? '🔶 MISMATCH' : `❌ ${result.error}`);
    console.log(`${status} | ${t.domain}`);
    if (result.found) {
      console.log(`  emp=${result.data.employee_range || '?'} | rev=${result.data.revenue_raw || '?'} | year=${result.data.year_founded || '?'}`);
      if (result.data.employee_count > 100) console.log(`  ⚠️ WARNING: ${result.data.employee_count} employees — verify manually`);
    }
    if (result.error === 'domain_mismatch') {
      console.log(`  ZI showed: ${result.zi_profile_website} (not ${t.domain})`);
    }
    console.log();
    await sleep(4000);
  }
}

async function bulk() {
  const LOG = 'jordan.ai/zi_enrichment_v3_log.jsonl';
  const PROGRESS = 'jordan.ai/zi_enrichment_v3_progress.json';
  const DELAY = 5000;
  const BATCH_PAUSE_EVERY = 25;
  const BATCH_PAUSE_MS = 20000;
  const MAX_CONSECUTIVE_ERRORS = 15;
  
  let progress = { completed: 0, found: 0, mismatched: 0, not_found: 0, errors: 0, domains_done: [], started: new Date().toISOString() };
  if (fs.existsSync(PROGRESS)) {
    try { progress = JSON.parse(fs.readFileSync(PROGRESS)); } catch {}
  }
  const doneSet = new Set(progress.domains_done || []);
  
  // Get all Grade A+B companies (prioritize A)
  const rows = execSync(`sqlite3 -separator '|' "${DB_PATH}" "SELECT domain, company_name FROM companies WHERE icp_grade IN ('A','B') AND domain NOT LIKE '%.vercel.app' AND domain NOT LIKE '%.framer.app' AND domain NOT LIKE '%.streamlit.app' AND domain NOT LIKE '%.netlify.app' AND domain NOT LIKE '%.herokuapp.com' AND domain NOT LIKE '%.webflow.io' ORDER BY CASE icp_grade WHEN 'A' THEN 0 ELSE 1 END, icp_score DESC"`, { encoding: 'utf-8', timeout: 30000 });
  
  const companies = rows.trim().split('\n').filter(l => l)
    .map(r => { const i = r.indexOf('|'); return { domain: r.substring(0, i), name: r.substring(i + 1) }; })
    .filter(c => c.domain && !doneSet.has(c.domain));
  
  console.log(`=== ZoomInfo Scraper v3 — Bulk Mode ===`);
  console.log(`Resuming from ${doneSet.size} done. ${companies.length} remaining.\n`);
  
  let consecutiveErrors = 0;
  let batchCount = 0;
  
  for (const company of companies) {
    const result = await lookupCompany(company.domain);
    
    if (result.error === 'SESSION_EXPIRED') {
      console.log('🔴 SESSION EXPIRED');
      progress.session_expired = true;
      fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
      process.exit(2);
    }
    
    fs.appendFileSync(LOG, JSON.stringify(result) + '\n');
    
    // Update DB only for verified matches
    if (result.found && result.verified && result.data) {
      const updates = [];
      if (result.data.employee_count) updates.push(`bvd_employees = ${result.data.employee_count}`);
      if (result.data.revenue_th) updates.push(`revenue_th_usd = CASE WHEN revenue_th_usd IS NULL THEN ${result.data.revenue_th} ELSE revenue_th_usd END`);
      if (result.data.year_founded) updates.push(`date_of_incorporation = CASE WHEN date_of_incorporation IS NULL OR date_of_incorporation = '' THEN '${result.data.year_founded}' ELSE date_of_incorporation END`);
      if (result.data.industry) updates.push(`apollo_industry = CASE WHEN apollo_industry IS NULL OR apollo_industry = '' THEN '${result.data.industry.replace(/'/g, "''")}' ELSE apollo_industry END`);
      
      if (updates.length > 0) {
        try {
          execSync(`sqlite3 "${DB_PATH}" "UPDATE companies SET ${updates.join(', ')}, enrichment_sources = COALESCE(enrichment_sources,'') || ',zoominfo_v3' WHERE domain = '${company.domain}'"`, { timeout: 10000 });
        } catch(e) { console.error('DB:', e.message.substring(0, 80)); }
      }
      consecutiveErrors = 0;
    } else if (result.error === 'domain_mismatch') {
      consecutiveErrors = 0; // mismatch is expected, not an error
    } else if (result.error) {
      consecutiveErrors++;
    } else {
      consecutiveErrors = 0;
    }
    
    progress.completed++;
    progress.domains_done.push(company.domain);
    if (result.found) progress.found++;
    else if (result.error === 'domain_mismatch') progress.mismatched++;
    else if (result.error) progress.errors++;
    else progress.not_found++;
    progress.lastDomain = company.domain;
    progress.lastUpdate = new Date().toISOString();
    
    if (progress.completed % 5 === 0 || result.found) {
      const emoji = result.found ? '✅' : (result.error === 'domain_mismatch' ? '🔶' : '❌');
      console.log(`[${progress.completed}] ${emoji} ${company.domain} | ✅${progress.found} 🔶${progress.mismatched} ❌${progress.errors}`);
      fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
    }
    
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.log(`🔴 ${MAX_CONSECUTIVE_ERRORS} consecutive errors`);
      fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
      process.exit(3);
    }
    
    await sleep(DELAY);
    batchCount++;
    if (batchCount % BATCH_PAUSE_EVERY === 0) {
      console.log(`--- Pause (${BATCH_PAUSE_MS/1000}s) ---`);
      fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
      await sleep(BATCH_PAUSE_MS);
    }
  }
  
  fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
  console.log(`\n=== DONE === Found:${progress.found} Mismatch:${progress.mismatched} NotFound:${progress.not_found} Errors:${progress.errors}`);
}

// Run mode
if (process.argv[2] === 'test') {
  test().catch(e => { console.error(e.message); process.exit(1); });
} else if (process.argv[2] === 'bulk') {
  bulk().catch(e => { console.error(e.message); process.exit(1); });
} else {
  console.log('Usage: node zi_scraper_v3.mjs [test|bulk]');
}
