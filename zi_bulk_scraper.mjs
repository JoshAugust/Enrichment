import { chromium } from 'playwright';
import fs from 'fs';
import sqlite3Pkg from 'better-sqlite3';

// Config
const BATCH_SIZE = 50;
const DELAY_BETWEEN = 3000; // 3s between searches
const MAX_COMPANIES = 5000;
const STORAGE_PATH = 'jordan.ai/zi_storage.json';
const DB_PATH = 'jordan.ai/pipeline/master.db';
const LOG_PATH = 'jordan.ai/zi_enrichment_log.jsonl';
const PROGRESS_PATH = 'jordan.ai/zi_enrichment_progress.json';

// We'll use raw sqlite3 via CLI since better-sqlite3 may not be installed
import { execSync } from 'child_process';

function dbQuery(sql) {
  try {
    const result = execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8', timeout: 10000 });
    return result.trim().split('\n').filter(l => l);
  } catch(e) {
    return [];
  }
}

function dbExec(sql) {
  try {
    execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { timeout: 10000 });
  } catch(e) {
    console.error('DB error:', e.message.substring(0, 200));
  }
}

async function scrapeCompanyProfile(page, domain, companyName) {
  const result = { domain, companyName, found: false, data: {} };
  
  try {
    // Search using the quick search bar
    const searchInput = await page.$('input[aria-label="Quick Search"]');
    if (!searchInput) {
      // Navigate back to home to get search bar
      await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(3000);
    }
    
    const input = await page.$('input[aria-label="Quick Search"]');
    if (!input) { result.error = 'no_search_bar'; return result; }
    
    // Search by company name or domain
    const searchTerm = companyName || domain.replace(/\.(com|io|ai|co|app|dev|net|org)$/, '');
    await input.click();
    await input.fill('');
    await input.type(searchTerm, { delay: 30 });
    await page.waitForTimeout(2000);
    
    // Check for autocomplete suggestions - click first company result
    const suggestions = await page.$$('[class*="search-suggestion"], [class*="result-item"], [class*="quick-search"] a');
    let clicked = false;
    for (const s of suggestions) {
      const text = await s.textContent();
      if (text.toLowerCase().includes(searchTerm.toLowerCase().substring(0, 5))) {
        await s.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      // Press Enter for full search
      await page.keyboard.press('Enter');
    }
    
    await page.waitForTimeout(4000);
    
    // Check if we're on a company profile page
    const url = page.url();
    if (!url.includes('/profile/company/')) {
      // We might be on search results - look for the company
      result.error = 'not_on_profile';
      result.url = url;
      return result;
    }
    
    // Extract data from the profile page
    const bodyText = await page.textContent('body');
    const clean = bodyText.replace(/\s+/g, ' ');
    
    // Parse key data points
    const patterns = {
      revenue: /\$[\d,.]+\s*(?:Million|Billion|Thousand|K|M|B)/i,
      employees: /(\d[\d,]*)\s*(?:employees?|Employees?)|Employee count by location/i,
      employeeRange: /(\d+)\s*-\s*(\d+)\s*(?:employees?)?/i,
      yearFounded: /Year Founded:\s*(\d{4})/i,
      founded: /Founded\s*:?\s*(\d{4})/i,
      industry: /Industries?\s+([A-Z][^\n]{5,60})/,
      hq: /Location[^]*?(\d+[^]*?(?:\d{5}|\d{5}-\d{4}))/,
      sicCodes: /SIC Codes?\s+([\d,\s]+)/i,
      naicsCodes: /NAICS Codes?\s+([\d,\s]+)/i,
    };
    
    // Revenue
    const revMatch = clean.match(patterns.revenue);
    if (revMatch) {
      result.data.revenue = revMatch[0];
      // Parse to number (thousands USD)
      let rev = revMatch[0].replace(/[$,]/g, '');
      const num = parseFloat(rev);
      if (rev.match(/billion/i)) result.data.revenue_th = num * 1000000;
      else if (rev.match(/million/i)) result.data.revenue_th = num * 1000;
      else if (rev.match(/thousand|K/i)) result.data.revenue_th = num;
      else result.data.revenue_th = num;
    }
    
    // Employee count
    const empRangeMatch = clean.match(/(\d+)\s*-\s*(\d+)/);
    if (empRangeMatch) {
      result.data.employee_range = `${empRangeMatch[1]}-${empRangeMatch[2]}`;
      result.data.employee_count = Math.round((parseInt(empRangeMatch[1]) + parseInt(empRangeMatch[2])) / 2);
    }
    
    // Year Founded
    const foundedMatch = clean.match(/Year Founded:?\s*(\d{4})/i) || clean.match(/Founded\s*:?\s*(\d{4})/i);
    if (foundedMatch) result.data.year_founded = parseInt(foundedMatch[1]);
    
    // SIC
    const sicMatch = clean.match(/SIC Codes?\s*([\d,\s]+)/i);
    if (sicMatch) result.data.sic_codes = sicMatch[1].trim();
    
    // NAICS
    const naicsMatch = clean.match(/NAICS Codes?\s*([\d,\s]+)/i);
    if (naicsMatch) result.data.naics_codes = naicsMatch[1].trim();
    
    // Location - look for state
    const stateMatch = clean.match(/(?:Phoenixville|Location[^]*?)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s*([A-Z]{2})\s*(\d{5})/);
    if (stateMatch) {
      result.data.city = stateMatch[1];
      result.data.state = stateMatch[2];
      result.data.zip = stateMatch[3];
    }
    
    // Description
    const descMatch = clean.match(/Company Details\s+(.*?)(?:Show More|Corporate Hierarchy)/i);
    if (descMatch) result.data.description = descMatch[1].trim().substring(0, 500);
    
    result.found = Object.keys(result.data).length > 0;
    result.raw_length = clean.length;
    
  } catch(e) {
    result.error = e.message.substring(0, 200);
  }
  
  return result;
}

async function main() {
  console.log('=== ZoomInfo Bulk Scraper ===');
  console.log(`Delay: ${DELAY_BETWEEN}ms | Max: ${MAX_COMPANIES}`);
  
  // Load progress
  let progress = { completed: 0, found: 0, not_found: 0, errors: 0, domains_done: [] };
  if (fs.existsSync(PROGRESS_PATH)) {
    progress = JSON.parse(fs.readFileSync(PROGRESS_PATH));
    console.log(`Resuming from ${progress.completed} completed`);
  }
  
  // Get domains to enrich
  const doneSet = new Set(progress.domains_done);
  const rows = dbQuery(`SELECT domain, company_name FROM companies WHERE icp_grade = 'A' AND (bvd_employees IS NULL OR bvd_employees = '') AND (linkedin_employees IS NULL OR linkedin_employees = '') AND domain NOT LIKE '%.vercel.app' AND domain NOT LIKE '%.framer.app' AND domain NOT LIKE '%.streamlit.app' AND domain NOT LIKE '%.netlify.app' AND domain NOT LIKE '%.herokuapp.com' AND domain NOT LIKE '%.webflow.io' ORDER BY icp_score DESC LIMIT ${MAX_COMPANIES}`);
  
  const companies = rows
    .map(r => { const [d, ...rest] = r.split('|'); return { domain: d, name: rest.join('|') }; })
    .filter(c => !doneSet.has(c.domain));
  
  console.log(`Companies to process: ${companies.length}`);
  
  if (companies.length === 0) {
    console.log('Nothing to do!');
    return;
  }
  
  // Launch browser
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const context = await browser.newContext({ storageState: STORAGE_PATH });
  const page = await context.newPage();
  
  // Navigate to home
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  if (page.url().includes('login')) {
    console.log('ERROR: Session expired - need new cookies');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Logged in. Starting scrape...\n');
  
  let batchCount = 0;
  for (const company of companies) {
    const result = await scrapeCompanyProfile(page, company.domain, company.name);
    
    // Log result
    fs.appendFileSync(LOG_PATH, JSON.stringify({ ...result, ts: new Date().toISOString() }) + '\n');
    
    // Update DB if we got data
    if (result.found && result.data) {
      const updates = [];
      if (result.data.employee_count) updates.push(`bvd_employees = ${result.data.employee_count}`);
      if (result.data.revenue_th) updates.push(`revenue_th_usd = ${result.data.revenue_th}`);
      if (result.data.year_founded) updates.push(`date_of_incorporation = '${result.data.year_founded}'`);
      if (result.data.description) updates.push(`description = '${result.data.description.replace(/'/g, "''")}'`);
      
      if (updates.length > 0) {
        const sql = `UPDATE companies SET ${updates.join(', ')}, enrichment_sources = COALESCE(enrichment_sources,'') || ',zoominfo' WHERE domain = '${company.domain}'`;
        dbExec(sql);
      }
    }
    
    // Update progress
    progress.completed++;
    progress.domains_done.push(company.domain);
    if (result.found) progress.found++;
    else if (result.error) progress.errors++;
    else progress.not_found++;
    
    // Log every 10
    if (progress.completed % 10 === 0) {
      console.log(`[${progress.completed}/${companies.length}] Found: ${progress.found} | Not found: ${progress.not_found} | Errors: ${progress.errors} | Last: ${company.domain}`);
      fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
      
      // Re-save cookies periodically
      await context.storageState({ path: STORAGE_PATH });
    }
    
    // Delay between requests
    await page.waitForTimeout(DELAY_BETWEEN);
    batchCount++;
    
    // Longer pause every 50
    if (batchCount % 50 === 0) {
      console.log('--- Batch pause (30s) ---');
      await page.waitForTimeout(30000);
    }
  }
  
  // Final save
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
  console.log(`\n=== COMPLETE ===`);
  console.log(`Processed: ${progress.completed} | Found: ${progress.found} | Not found: ${progress.not_found} | Errors: ${progress.errors}`);
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
