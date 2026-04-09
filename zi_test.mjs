import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const context = await chromium.launchPersistentContext('/tmp/zi-test-v5', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  const page = await context.newPage();
  
  // Load ZI app
  console.log('Loading ZI...');
  await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);
  console.log('URL:', page.url());
  
  // Intercept XHR responses to catch search results
  const searchResults = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/search/') || url.includes('/enrich/') || url.includes('/lookup/')) {
      try {
        const text = await response.text();
        if (text.includes('companyId') || text.includes('"id"')) {
          searchResults.push({ url, body: text.substring(0, 500) });
        }
      } catch {}
    }
  });
  
  // Use search bar
  console.log('Searching for stripe.com...');
  const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i]');
  if (!searchInput) {
    console.log('No search input — trying all inputs');
    const inputs = await page.$$('input');
    console.log('Found', inputs.length, 'inputs');
    for (const inp of inputs.slice(0, 5)) {
      const ph = await inp.getAttribute('placeholder');
      const type = await inp.getAttribute('type');
      console.log('  Input:', type, ph);
    }
    await context.close();
    return;
  }
  
  await searchInput.click();
  await page.waitForTimeout(500);
  await searchInput.fill('stripe.com');
  await page.waitForTimeout(1000);
  await page.keyboard.press('Enter');
  
  // Wait for SPA to render results
  console.log('Waiting for results...');
  await page.waitForTimeout(10000);
  
  // Check intercepted XHR
  console.log('Intercepted responses:', searchResults.length);
  for (const r of searchResults) {
    console.log('  URL:', r.url.substring(0, 100));
    console.log('  Body:', r.body.substring(0, 200));
  }
  
  // Check DOM for any company links/cards
  const links = await page.$$eval('a[href*="profile/company"]', els => 
    els.map(el => ({ href: el.getAttribute('href'), text: el.textContent.trim().substring(0, 50) }))
  );
  console.log('Company profile links:', links.length);
  for (const l of links.slice(0, 5)) {
    console.log('  ', l.href, '—', l.text);
  }
  
  // If no links, take a screenshot and dump visible text
  if (links.length === 0) {
    const visibleText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('Visible text:', visibleText.substring(0, 1000));
  }
  
  await context.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
