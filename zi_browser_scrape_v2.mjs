#!/usr/bin/env node
/**
 * ZI Revenue Scraper v5 — Internal GraphQL API, Zero Credits
 * 
 * Uses ZI's internal quickSearch GraphQL endpoint (same as the SPA).
 * Requires valid session cookies only — no JWT/Bearer auth needed.
 * 
 * ZERO credits consumed. Uses the web app's search, not the paid API.
 */

import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const DB_PATH = process.argv[2] || 'jordan.ai/pipeline/master.db';
const LIMIT = parseInt(process.argv[3] || '100');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));

function parseRevenue(str) {
  // Parse "$X.X Billion" or "$X.X Million" etc.
  if (!str) return null;
  const m = str.match(/\$([\d,.]+)\s*(Billion|Million|Thousand|B|M|K)/i);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ''));
  const unit = m[2].toLowerCase();
  if (unit === 'billion' || unit === 'b') return num * 1000000;
  if (unit === 'million' || unit === 'm') return num * 1000;
  if (unit === 'thousand' || unit === 'k') return num;
  return null;
}

function parseEmployeeRange(str) {
  // Parse "1 - 10" or "5,000 - 10,000"
  if (!str) return null;
  const m = str.replace(/,/g, '').match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  return Math.round((parseInt(m[1]) + parseInt(m[2])) / 2);
}

async function main() {
  // Get domains needing ZI revenue
  const domainsRaw = execSync(
    `sqlite3 "${DB_PATH}" "SELECT domain FROM companies WHERE mk2_grade = 'A' AND mk2_dq_reason IS NULL AND (revenue_th_usd IS NULL OR revenue_th_usd = 0) AND (enrichment_status IS NULL OR enrichment_status NOT LIKE '%liveness_dead%') ORDER BY mk2_score DESC LIMIT ${LIMIT}"`,
    { encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean);

  console.log(`Got ${domainsRaw.length} Grade A domains to enrich via ZI internal API\n`);

  // Launch browser to establish session
  const context = await chromium.launchPersistentContext('/tmp/zi-scrape-v5-prod', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  let page = await context.newPage();

  // Load ZI app to establish full session context
  console.log('Establishing ZI session...');
  await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);

  if (page.url().includes('login') || page.url().includes('okta')) {
    console.error('SESSION EXPIRED — cookies need refresh');
    await context.close();
    process.exit(1);
  }
  console.log('Session established:', page.url());

  let processed = 0, enriched = 0, noMatch = 0, noData = 0, errors = 0, domainMismatch = 0;

  for (const domain of domainsRaw) {
    processed++;

    try {
      // Use quickSearch GraphQL from browser context (exact SPA format)
      const result = await page.evaluate(async (searchDomain) => {
        try {
          const resp = await fetch('/ziapi/connector-quick-search/profiles/graphql/quickSearch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-sourceid': 'ZI_FOR_SALES',
              'x-requested-with': 'XMLHttpRequest',
              'Accept': 'application/json, text/plain, */*'
            },
            credentials: 'include',
            body: JSON.stringify({
              operationName: 'quickSearch',
              variables: {
                quickSearch: searchDomain,
                rpp: 5,
                analytics: { suggestionsExist: false, source: 'SmartDash' },
                usePredictIntent: false,
                useReactGpiSearch: true,
                skipRedis: true,
                searchUUID: crypto.randomUUID()
              },
              query: `query quickSearch($rpp: Float!, $quickSearch: String, $analytics: QuickSeachAnalyticshArgs, $usePredictIntent: Boolean, $useReactGpiSearch: Boolean, $searchUUID: String, $skipRedis: Boolean) {
  quickSearch(rpp: $rpp, quickSearch: $quickSearch, analytics: $analytics, usePredictIntent: $usePredictIntent, useReactGpiSearch: $useReactGpiSearch, searchUUID: $searchUUID, skipRedis: $skipRedis) {
    companies {
      companiesCount
      data {
        companyDomain
        companyEmployeeRange
        companyID
        companyName
        companyRevenueRange
        industries { displayName }
        isDefunct
        location { City State CountryCode }
      }
    }
  }
}`
            })
          });

          if (!resp.ok) return { error: `HTTP ${resp.status}` };
          const data = await resp.json();
          return data;
        } catch (e) {
          return { error: e.message };
        }
      }, domain);

      if (result.error) {
        errors++;
        console.log(`  ❌ ${domain}: ${result.error}`);
        continue;
      }

      const companies = result?.data?.quickSearch?.companies?.data;
      if (!companies || companies.length === 0) {
        noMatch++;
        console.log(`  ⚪ ${domain}: no ZI match`);
        continue;
      }

      // Find exact domain match
      const domainClean = domain.replace(/^www\./, '').toLowerCase();
      let match = companies.find(c => {
        const cd = (c.companyDomain || '').replace(/^www\./, '').toLowerCase();
        return cd === domainClean || cd === `www.${domainClean}`;
      });

      // Fallback: first result if domain base matches
      if (!match) {
        const domainBase = domainClean.split('.')[0];
        match = companies.find(c => {
          const cd = (c.companyDomain || '').replace(/^www\./, '').toLowerCase().split('.')[0];
          return cd === domainBase;
        });
      }

      if (!match) {
        domainMismatch++;
        const ziDomains = companies.map(c => c.companyDomain).join(', ');
        console.log(`  ⚠️ ${domain}: ZI returned [${ziDomains}] — no domain match`);
        continue;
      }

      let revenue_th = parseRevenue(match.companyRevenueRange);
      const empCount = parseEmployeeRange(match.companyEmployeeRange);

      // If no revenue from quickSearch, fetch full profile via companySearch
      if (!revenue_th && match.companyID) {
        const profileResult = await page.evaluate(async (companyId) => {
          try {
            const resp = await fetch('/profiles/graphql/companySearch', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-sourceid': 'ZI_FOR_SALES',
                'x-requested-with': 'XMLHttpRequest',
                'Accept': 'application/json, text/plain, */*'
              },
              credentials: 'include',
              body: JSON.stringify({
                operationName: 'companySearch',
                variables: {
                  searchFacadeParams: {
                    companyIds: String(companyId),
                    rpp: 1,
                    excludeDefunctCompanies: false,
                    useUnifiedSearch: true
                  }
                },
                query: `query companySearch($searchFacadeParams: SearchFacadeParams) {
  companySearch(searchFacadeParams: $searchFacadeParams) {
    base {
      id
      name
      revenue
      revenueRange
      employeeCount
      employeeRange
      website
      city
      state
      country
    }
  }
}`
              })
            });
            if (!resp.ok) return { error: `HTTP ${resp.status}` };
            return await resp.json();
          } catch (e) {
            return { error: e.message };
          }
        }, match.companyID);

        if (!profileResult.error) {
          const base = profileResult?.data?.companySearch?.base?.[0];
          if (base) {
            if (base.revenue) {
              // ZI revenue is in raw number (e.g. "5100000000" for $5.1B)
              const rev = parseFloat(base.revenue);
              if (rev > 0) revenue_th = rev / 1000; // convert to thousands
            }
            if (!revenue_th && base.revenueRange) {
              revenue_th = parseRevenue(base.revenueRange);
            }
          }
        }
      }

      if (revenue_th) {
        // Only write revenue if we don't have it, and ZI revenue seems reasonable
        const escapedDomain = domain.replace(/'/g, "''");
        const sql = `UPDATE companies SET revenue_th_usd = CASE WHEN revenue_th_usd IS NULL OR revenue_th_usd = 0 THEN ${revenue_th} ELSE revenue_th_usd END, enrichment_sources = COALESCE(enrichment_sources,'') || ',zoominfo_v5' WHERE domain = '${escapedDomain}'`;
        execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { timeout: 10000 });
        enriched++;
        console.log(`  ✅ ${domain}: ${match.companyName} | rev=$${(revenue_th/1000).toFixed(1)}M | emp=${match.companyEmployeeRange || '?'} (ZI ID: ${match.companyID})`);
      } else if (empCount) {
        noData++;
        console.log(`  ⚪ ${domain}: ${match.companyName} | no revenue | emp=${match.companyEmployeeRange}`);
      } else {
        noData++;
        console.log(`  ⚪ ${domain}: ${match.companyName} | no rev/emp data`);
      }

    } catch (e) {
      errors++;
      console.log(`  ❌ ${domain}: ${e.message.substring(0, 80)}`);
      if (e.message.includes('closed') || e.message.includes('Target')) {
        console.log('  🔧 Recovering page...');
        try { await page.close(); } catch {}
        page = await context.newPage();
        await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(8000);
      }
    }

    if (processed % 20 === 0) {
      console.log(`\n  Progress: ${processed}/${domainsRaw.length} | ✅${enriched} ⚪match:${noMatch} data:${noData} ⚠️mismatch:${domainMismatch} ❌${errors}\n`);
    }

    // Light rate limit
    try { await page.waitForTimeout(1500); } catch {
      // Page died, recreate
      console.log('  🔧 Page died during wait, recreating...');
      try {
        page = await context.newPage();
        await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(10000);
      } catch (e2) {
        console.error('  💀 Cannot recover:', e2.message);
        break;
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log('ZI INTERNAL API SCRAPE COMPLETE');
  console.log('='.repeat(50));
  console.log(`Processed: ${processed}`);
  console.log(`Enriched: ${enriched} (${processed > 0 ? (enriched/processed*100).toFixed(1) : 0}%)`);
  console.log(`No match: ${noMatch}`);
  console.log(`No data: ${noData}`);
  console.log(`Domain mismatch: ${domainMismatch}`);
  console.log(`Errors: ${errors}`);
  console.log(`Credits used: 0`);

  await context.close();
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
