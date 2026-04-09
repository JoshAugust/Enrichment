#!/usr/bin/env node
/**
 * ZoomInfo Bulk Scraper v2 — crash-resilient
 * 
 * Key difference from v1: launches a FRESH browser for every single lookup.
 * Slower but bulletproof — if Chrome crashes, we just skip that domain and move on.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import { execSync } from 'child_process';

const STORAGE_PATH = 'jordan.ai/zi_storage.json';
const DB_PATH = 'jordan.ai/pipeline/master.db';
const LOG_PATH = 'jordan.ai/zi_enrichment_log.jsonl';
const PROGRESS_PATH = 'jordan.ai/zi_enrichment_progress.json';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const DELAY_BETWEEN = 4000; // 4s between searches
const MAX_CONSECUTIVE_ERRORS = 10;
const BATCH_PAUSE_EVERY = 30;
const BATCH_PAUSE_MS = 20000;

function dbQuery(sql) {
  try {
    const result = execSync(`sqlite3 -separator '|' "${DB_PATH}" "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf-8', timeout: 10000 });
    return result.trim().split('\n').filter(l => l);
  } catch { return []; }
}

function dbExec(sql) {
  try {
    execSync(`sqlite3 "${DB_PATH}" "${sql.replace(/"/g, '\\"')}"`, { timeout: 10000 });
    return true;
  } catch(e) {
    console.error('DB error:', e.message.substring(0, 100));
    return false;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function lookupOneCompany(domain, companyName) {
  let browser;
  const result = { domain, companyName, found: false, data: {}, ts: new Date().toISOString() };
  
  try {
    browser = await chromium.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-dev-shm-usage'],
      timeout: 15000
    });
    
    const context = await browser.newContext({ storageState: STORAGE_PATH });
    const page = await context.newPage();
    
    // Go to ZoomInfo home
    await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(3000);
    
    // Check if logged in
    if (page.url().includes('login')) {
      result.error = 'SESSION_EXPIRED';
      await browser.close();
      return result;
    }
    
    // Search by domain first (more precise), fall back to company name
    const searchTerm = domain;
    const input = await page.$('input[aria-label="Quick Search"]');
    if (!input) { result.error = 'no_search_bar'; await browser.close(); return result; }
    
    await input.click();
    await input.type(searchTerm, { delay: 30 });
    await page.waitForTimeout(2500);
    
    // Press Enter for search
    await page.keyboard.press('Enter');
    await page.waitForTimeout(5000);
    
    const url = page.url();
    
    if (url.includes('/profile/company/')) {
      // We're on a company profile — extract data
      const text = await page.textContent('body');
      const clean = text.replace(/\s+/g, ' ');
      
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
      
      // Employee range (e.g., "1 - 10" or "11 - 50")
      const empMatch = clean.match(/(\d{1,5})\s*-\s*(\d{1,5})/);
      if (empMatch) {
        const lo = parseInt(empMatch[1]);
        const hi = parseInt(empMatch[2]);
        if (hi <= 100000) { // sanity check
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
        result.data.zip = locMatch[3];
      }
      
      // Description
      const descMatch = clean.match(/Company Details\s+(.*?)(?:Show More|Corporate Hierarchy|Domain Rank)/i);
      if (descMatch) result.data.description = descMatch[1].trim().substring(0, 500);
      
      // Industry
      const indMatch = clean.match(/Industries?\s+([A-Z][^\d]{5,80}?)(?:Clear|Products|Company Codes)/i);
      if (indMatch) result.data.industry = indMatch[1].trim();
      
      result.found = Object.keys(result.data).length > 0;
      result.zi_id = url.match(/company\/(\d+)/)?.[1];
      
      // Save refreshed cookies
      await context.storageState({ path: STORAGE_PATH });
      
    } else {
      // Search results page - company not found or ambiguous
      result.error = 'not_found_or_ambiguous';
      result.url = url.substring(0, 200);
    }
    
    await browser.close();
  } catch(e) {
    result.error = e.message.substring(0, 200);
    try { await browser?.close(); } catch {}
  }
  
  return result;
}

async function main() {
  console.log('=== ZoomInfo Bulk Scraper v2 (crash-resilient) ===');
  console.log('Each lookup gets a fresh browser. Slow but stable.\n');
  
  // Load progress
  let progress = { completed: 0, found: 0, not_found: 0, errors: 0, session_expired: false, domains_done: [], started: new Date().toISOString() };
  if (fs.existsSync(PROGRESS_PATH)) {
    try { progress = JSON.parse(fs.readFileSync(PROGRESS_PATH)); } catch {}
  }
  const doneSet = new Set(progress.domains_done || []);
  console.log(`Resuming: ${doneSet.size} already done`);
  
  // Get domains
  const rows = dbQuery(`SELECT domain, company_name FROM companies WHERE icp_grade = 'A' AND (bvd_employees IS NULL OR bvd_employees = '') AND (linkedin_employees IS NULL OR linkedin_employees = '') AND domain NOT LIKE '%.vercel.app' AND domain NOT LIKE '%.framer.app' AND domain NOT LIKE '%.streamlit.app' AND domain NOT LIKE '%.netlify.app' AND domain NOT LIKE '%.herokuapp.com' AND domain NOT LIKE '%.webflow.io' ORDER BY icp_score DESC`);
  
  const companies = rows
    .map(r => { const i = r.indexOf('|'); return { domain: r.substring(0, i), name: r.substring(i + 1) }; })
    .filter(c => c.domain && !doneSet.has(c.domain));
  
  console.log(`To process: ${companies.length}\n`);
  
  let consecutiveErrors = 0;
  let batchCount = 0;
  
  for (const company of companies) {
    const result = await lookupOneCompany(company.domain, company.name);
    
    // Check for session expiry — fatal
    if (result.error === 'SESSION_EXPIRED') {
      console.log('\n🔴 SESSION EXPIRED — stopping. Need fresh cookies.');
      progress.session_expired = true;
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
      process.exit(2);
    }
    
    // Log
    fs.appendFileSync(LOG_PATH, JSON.stringify(result) + '\n');
    
    // Update DB
    if (result.found && result.data) {
      const updates = [];
      if (result.data.employee_count) updates.push(`bvd_employees = ${result.data.employee_count}`);
      if (result.data.revenue_th) updates.push(`revenue_th_usd = ${result.data.revenue_th}`);
      if (result.data.year_founded && !result.data.year_founded.toString().match(/^(19|20)\d{2}$/)) {} 
      else if (result.data.year_founded) updates.push(`date_of_incorporation = '${result.data.year_founded}'`);
      if (result.data.description) updates.push(`description = '${result.data.description.replace(/'/g, "''").substring(0, 400)}'`);
      if (result.data.industry) updates.push(`apollo_industry = '${result.data.industry.replace(/'/g, "''").substring(0, 100)}'`);
      
      if (updates.length > 0) {
        dbExec(`UPDATE companies SET ${updates.join(', ')}, enrichment_sources = COALESCE(enrichment_sources,'') || ',zoominfo' WHERE domain = '${company.domain}'`);
      }
      consecutiveErrors = 0;
    } else if (result.error) {
      consecutiveErrors++;
    } else {
      consecutiveErrors = 0; // not_found is not an error
    }
    
    // Update progress
    progress.completed++;
    progress.domains_done.push(company.domain);
    if (result.found) progress.found++;
    else if (result.error) progress.errors++;
    else progress.not_found++;
    progress.lastDomain = company.domain;
    progress.lastResult = result.found ? 'found' : (result.error || 'not_found');
    progress.lastUpdate = new Date().toISOString();
    
    // Print every 5
    if (progress.completed % 5 === 0 || result.found) {
      const emoji = result.found ? '✅' : (result.error ? '❌' : '⬜');
      console.log(`[${progress.completed}] ${emoji} ${company.domain} | Found: ${progress.found} | Err: ${progress.errors} | Total: ${progress.completed}`);
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
    }
    
    // Too many errors in a row
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      console.log(`\n🔴 ${MAX_CONSECUTIVE_ERRORS} consecutive errors — stopping.`);
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
      process.exit(3);
    }
    
    // Delay
    await sleep(DELAY_BETWEEN);
    batchCount++;
    
    // Batch pause
    if (batchCount % BATCH_PAUSE_EVERY === 0) {
      console.log(`--- Batch pause (${BATCH_PAUSE_MS/1000}s) after ${batchCount} ---`);
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
      await sleep(BATCH_PAUSE_MS);
    }
  }
  
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
  console.log(`\n=== DONE ===\nProcessed: ${progress.completed} | Found: ${progress.found} | Not found: ${progress.not_found} | Errors: ${progress.errors}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
