import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const context = await browser.newContext({ storageState: 'jordan.ai/zi_storage.json' });
  const page = await context.newPage();
  
  // Intercept API calls to capture data
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/search') || url.includes('/enrich') || url.includes('/company')) {
      try {
        const body = await response.json();
        apiResponses.push({ url, status: response.status(), body });
      } catch {}
    }
  });
  
  // Navigate to company search
  await page.goto('https://app.zoominfo.com/#/apps/search/v2/company/results', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  await page.screenshot({ path: 'jordan.ai/zi_search_page.png' });
  
  // Look for a search input
  const inputs = await page.$$('input');
  for (const inp of inputs) {
    const attrs = await inp.evaluate(el => ({
      type: el.type, placeholder: el.placeholder, ariaLabel: el.ariaLabel, 
      className: el.className, visible: el.offsetParent !== null
    }));
    if (attrs.visible) console.log('Visible input:', JSON.stringify(attrs));
  }
  
  // Try the global search
  // Look for search bar
  const searchBars = await page.$$('[class*="search"], [placeholder*="search"], [aria-label*="search"]');
  console.log('Search elements found:', searchBars.length);
  
  // Try clicking advanced search or company tab
  const text = await page.textContent('body');
  console.log('Page content (2000):', text.replace(/\s+/g, ' ').substring(0, 2000));
  
  // Check API responses
  console.log('\nAPI responses captured:', apiResponses.length);
  for (const r of apiResponses.slice(0, 3)) {
    console.log(`  ${r.url.substring(0, 100)} → ${r.status}`);
    console.log(`  Body keys: ${Object.keys(r.body || {}).join(', ')}`);
  }
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
