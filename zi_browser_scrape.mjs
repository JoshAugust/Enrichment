#!/usr/bin/env node
/**
 * ZI Revenue Scraper v5 — Browser-Only, Zero Credits
 * 
 * Strategy: Use browser cookies (no API JWT needed)
 * 1. Navigate to ZI company search by domain
 * 2. Click into company profile 
 * 3. Extract revenue from profile page
 * 
 * No API calls. No credits. Pure browser scraping with valid session cookies.
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const DB_PATH = process.argv[2] || 'jordan.ai/pipeline/master.db';
const LIMIT = parseInt(process.argv[3] || '50');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Load ZI cookies
const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));

async function extractProfileData(page) {
  await page.waitForTimeout(4000);
  const content = await page.content();
  const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  
  // Revenue — multiple patterns
  let revenue_th = null;
  const revPatterns = [
    /\$([\d,.]+)\s*(Billion|Million|Thousand|B|M|K)/i,
    /Revenue\s*[:.]?\s*\$([\d,.]+)\s*(Billion|Million|Thousand|B|M|K)/i,
    /Annual\s*Revenue\s*[:.]?\s*\$([\d,.]+)\s*(Billion|Million|Thousand|B|M|K)/i,
  ];
  for (const pat of revPatterns) {
    const m = clean.match(pat);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      const unit = m[2].toLowerCase();
      if (unit === 'billion' || unit === 'b') revenue_th = num * 1000000;
      else if (unit === 'million' || unit === 'm') revenue_th = num * 1000;
      else if (unit === 'thousand' || unit === 'k') revenue_th = num;
      break;
    }
  }
  
  // Employees — multiple patterns  
  let empCount = null;
  const empPatterns = [
    /(\d{1,5})\s*-\s*(\d{1,5})\s*(?:employees|Employees)/,
    /(\d{1,5})\s*to\s*(\d{1,5})\s*(?:employees|Employees)/i,
    /Employees?\s*[:.]?\s*(\d{1,5})\s*-\s*(\d{1,5})/i,
    /Employee\s*Count\s*[:.]?\s*(\d{1,5})/i,
    /headcount\s*[:.]?\s*(\d{1,5})/i,
  ];
  for (const pat of empPatterns) {
    const m = clean.match(pat);
    if (m) {
      empCount = m[2] ? Math.round((parseInt(m[1]) + parseInt(m[2])) / 2) : parseInt(m[1]);
      break;
    }
  }
  
  // Website from profile for domain verification
  const websiteMatch = clean.match(/(?:Website|Company Website)\s*[:.]?\s*(https?:\/\/)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+)/i);
  const profileWebsite = websiteMatch ? websiteMatch[2].toLowerCase().replace(/^www\./, '') : null;
  
  return { revenue_th, empCount, profileWebsite };
}

async function main() {
  // Get domains that need ZI enrichment — Mk2 Grade A, missing revenue, not dead
  const domainsRaw = execSync(
    `sqlite3 "${DB_PATH}" "SELECT domain FROM companies WHERE mk2_grade = 'A' AND mk2_dq_reason IS NULL AND (revenue_th_usd IS NULL OR revenue_th_usd = 0) AND (enrichment_status IS NULL OR enrichment_status NOT LIKE '%liveness_dead%') ORDER BY mk2_score DESC LIMIT ${LIMIT}"`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);
  
  console.log(`Got ${domainsRaw.length} Grade A domains to enrich via ZI browser`);
  
  // Launch browser
  const context = await chromium.launchPersistentContext('/tmp/zi-scrape-v5', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  await context.addCookies(storageState.cookies);
  let page = await context.newPage();
  
  let processed = 0, enriched = 0, noMatch = 0, noData = 0, errors = 0, domainMismatch = 0;
  
  for (const domain of domainsRaw) {
    processed++;
    
    try {
      // Search by domain on ZI website
      const searchUrl = `https://app.zoominfo.com/#/apps/search/v2/results/company?query=${encodeURIComponent(domain)}`;
      await page.goto(searchUrl, { timeout: 25000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      
      // Check if any results appeared
      const content = await page.content();
      
      // Look for company profile link in search results
      const profileLinkMatch = content.match(/\/apps\/profile\/company\/(\d+)/);
      if (!profileLinkMatch) {
        noMatch++;
        console.log(`  ⚪ ${domain}: no ZI search results`);
        continue;
      }
      
      const companyId = profileLinkMatch[1];
      
      // Navigate to profile
      const profileUrl = `https://app.zoominfo.com/#/apps/profile/company/${companyId}`;
      await page.goto(profileUrl, { timeout: 25000, waitUntil: 'domcontentloaded' });
      
      const data = await extractProfileData(page);
      
      // Domain verification — if ZI profile website doesn't match our domain, skip
      if (data.profileWebsite && data.profileWebsite !== domain.replace(/^www\./, '')) {
        const domainBase = domain.replace(/^www\./, '').split('.')[0];
        const profileBase = data.profileWebsite.split('.')[0];
        if (domainBase !== profileBase) {
          domainMismatch++;
          console.log(`  ⚠️ ${domain}: ZI profile is for ${data.profileWebsite} — SKIPPING (domain mismatch)`);
          continue;
        }
      }
      
      if (data.revenue_th || data.empCount) {
        // Write to DB — only update revenue if no existing revenue
        const updates = [];
        if (data.revenue_th) {
          updates.push(`revenue_th_usd = CASE WHEN revenue_th_usd IS NULL OR revenue_th_usd = 0 THEN ${data.revenue_th} ELSE revenue_th_usd END`);
        }
        updates.push(`enrichment_sources = COALESCE(enrichment_sources,'') || ',zoominfo_v5'`);
        
        const sql = `UPDATE companies SET ${updates.join(', ')} WHERE domain = '${domain.replace(/'/g, "''")}'`;
        execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { timeout: 10000 });
        enriched++;
        console.log(`  ✅ ${domain}: rev=${data.revenue_th ? '$' + (data.revenue_th/1000).toFixed(1) + 'M' : '?'} emp=${data.empCount || '?'} (ZI ID: ${companyId})`);
      } else {
        noData++;
        console.log(`  ⚪ ${domain}: ZI profile found but no rev/emp extracted`);
      }
      
    } catch (e) {
      errors++;
      console.log(`  ❌ ${domain}: ${e.message.substring(0, 80)}`);
      // Recover from crash
      if (e.message.includes('closed') || e.message.includes('Target') || e.message.includes('crashed')) {
        console.log('  🔧 Browser crashed — recreating page...');
        try { await page.close(); } catch {}
        try {
          page = await context.newPage();
          console.log('  ✅ Browser recovered');
        } catch (e2) {
          console.error('  💀 Cannot recover browser:', e2.message);
          break;
        }
      }
    }
    
    // Progress
    if (processed % 10 === 0) {
      console.log(`\n  Progress: ${processed}/${domainsRaw.length} | ✅${enriched} ⚪match:${noMatch} data:${noData} ⚠️mismatch:${domainMismatch} ❌${errors}\n`);
    }
    
    await page.waitForTimeout(2500); // Rate limit
  }
  
  console.log(`\n${'='.repeat(50)}`);
  console.log(`ZI BROWSER SCRAPE COMPLETE`);
  console.log(`${'='.repeat(50)}`);
  console.log(`Processed: ${processed}`);
  console.log(`Enriched: ${enriched} (${(enriched/processed*100).toFixed(1)}%)`);
  console.log(`No match: ${noMatch}`);
  console.log(`No data: ${noData}`);
  console.log(`Domain mismatch: ${domainMismatch}`);
  console.log(`Errors: ${errors}`);
  
  await context.close();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
