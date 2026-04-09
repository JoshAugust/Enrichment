#!/usr/bin/env node
/**
 * ZI Revenue Scraper v4 — Zero Credits
 * 
 * Strategy:
 * 1. Use ZI API search (FREE — 0 uniqueId credits) to get exact company ID by domain
 * 2. Use Chrome + ZI cookies to load profile page directly by ID
 * 3. Extract revenue + employees from the profile page
 * 
 * No fuzzy matching. No credit consumption. Exact domain → exact profile.
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const DB_PATH = process.argv[2] || 'jordan.ai/pipeline/master.db';
const LIMIT = parseInt(process.argv[3] || '50');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Load ZI config
let JWT;
try {
  const ziConfig = JSON.parse(readFileSync('.config/zoominfo/config.json', 'utf8'));
  JWT = ziConfig.jwt;
} catch {
  JWT = null;
}

// Load ZI access token from cookies as fallback
if (!JWT) {
  try {
    const cookies = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8')).cookies;
    const accessCookie = cookies.find(c => c.name === 'ziaccesstoken');
    if (accessCookie) JWT = accessCookie.value;
  } catch {}
}
if (!JWT) {
  console.error('FATAL: No ZI JWT found in config or cookies');
  process.exit(1);
}

// Load ZI cookies
const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));

async function searchZI(domain) {
  // FREE API search — returns company ID without consuming uniqueId credits
  const resp = await fetch('https://api.zoominfo.com/search/company', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${JWT}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      companyWebsite: domain,
      rpp: 1
    })
  });
  
  if (resp.ok) {
    const data = await resp.json();
    if (data.data && data.data.length > 0) {
      return { id: data.data[0].id, name: data.data[0].name };
    }
  }
  return null;
}

async function main() {
  // Get domains that need ZI enrichment
  const domainsRaw = execSync(
    `sqlite3 "${DB_PATH}" "SELECT domain FROM companies WHERE mk2_grade = 'A' AND mk2_dq_reason IS NULL AND (revenue_th_usd IS NULL OR revenue_th_usd = 0) AND enrichment_status NOT LIKE '%liveness_dead%' ORDER BY mk2_score DESC LIMIT ${LIMIT}"`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);
  
  console.log(`Got ${domainsRaw.length} Grade A domains to enrich via ZI`);
  
  // Launch browser with system Chrome
  const context = await chromium.launchPersistentContext('/tmp/zi-scrape-v4', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  // Inject ZI cookies
  if (storageState.cookies) {
    await context.addCookies(storageState.cookies);
  }
  
  const page = await context.newPage();
  let processed = 0, enriched = 0, noData = 0, errors = 0;
  
  for (const domain of domainsRaw) {
    processed++;
    
    try {
      // Step 1: FREE API search to get company ID
      const match = await searchZI(domain);
      if (!match) {
        noData++;
        console.log(`  ${domain}: no ZI match`);
        continue;
      }
      
      // Step 2: Navigate to profile page directly
      const profileUrl = `https://app.zoominfo.com/#/apps/profile/company/${match.id}`;
      await page.goto(profileUrl, { timeout: 20000, waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      
      // Step 3: Extract data from profile
      const content = await page.content();
      const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      
      // Revenue
      let revenue_th = null;
      const revMatch = clean.match(/\$([\d,.]+)\s*(Million|Billion|Thousand)/i);
      if (revMatch) {
        const num = parseFloat(revMatch[1].replace(/,/g, ''));
        const unit = revMatch[2].toLowerCase();
        if (unit === 'billion') revenue_th = num * 1000000;
        else if (unit === 'million') revenue_th = num * 1000;
        else revenue_th = num;
      }
      
      // Employees — multiple patterns for ZI DOM changes
      let empCount = null;
      const empPatterns = [
        /(\d{1,5})\s*-\s*(\d{1,5})\s*(?:employees|Employees)/,
        /(\d{1,5})\s*to\s*(\d{1,5})\s*(?:employees|Employees)/i,
        /Employees\s*[:.]?\s*(\d{1,5})\s*-\s*(\d{1,5})/i,
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
      
      // Website verification
      const websiteEl = clean.match(/(?:company-website|Company Website)[^>]*>?\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      const profileWebsite = websiteEl ? websiteEl[1] : null;
      
      if (revenue_th || empCount) {
        // Write to DB — only update if we got data, and only ZI revenue if no existing revenue
        const updates = [];
        if (revenue_th) {
          updates.push(`revenue_th_usd = CASE WHEN revenue_th_usd IS NULL OR revenue_th_usd = 0 THEN ${revenue_th} ELSE revenue_th_usd END`);
        }
        if (empCount && empCount < 100) {
          updates.push(`bvd_employees = ${empCount}`);
        }
        updates.push(`enrichment_sources = COALESCE(enrichment_sources,'') || ',zoominfo_v4'`);
        
        execSync(`sqlite3 "${DB_PATH}" "UPDATE companies SET ${updates.join(', ')} WHERE domain = '${domain}'"`, { timeout: 10000 });
        enriched++;
        console.log(`  ✅ ${domain}: rev=${revenue_th ? '$' + (revenue_th/1000).toFixed(1) + 'M' : '?'} emp=${empCount || '?'} (ZI ID: ${match.id})`);
      } else {
        noData++;
        console.log(`  ⚪ ${domain}: ZI ID ${match.id} but no rev/emp extracted from profile`);
      }
      
    } catch (e) {
      errors++;
      console.log(`  ❌ ${domain}: ${e.message.substring(0, 80)}`);
      // If page/context crashed, recreate it
      if (e.message.includes('closed') || e.message.includes('Target') || e.message.includes('crashed')) {
        console.log('  🔧 Browser context crashed — recreating...');
        try { await page.close(); } catch {}
        try {
          page = await context.newPage();
          if (storageState.cookies) await context.addCookies(storageState.cookies);
          console.log('  ✅ Browser recovered');
        } catch (e2) {
          console.error('  💀 Cannot recover browser:', e2.message);
          break;
        }
      }
    }
    
    // Progress
    if (processed % 10 === 0) {
      console.log(`\n  Progress: ${processed}/${domainsRaw.length} | ✅${enriched} ⚪${noData} ❌${errors}\n`);
    }
    
    await page.waitForTimeout(2000); // Rate limit
  }
  
  console.log(`\n=== DONE ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Enriched: ${enriched}`);
  console.log(`No data: ${noData}`);
  console.log(`Errors: ${errors}`);
  
  await context.close();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
