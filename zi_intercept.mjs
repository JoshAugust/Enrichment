import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const context = await chromium.launchPersistentContext('/tmp/zi-intercept2', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  const page = await context.newPage();

  // Log ALL requests and responses
  const captured = [];
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('anura') && (req.method() === 'POST' || url.includes('search'))) {
      captured.push({
        type: 'req',
        method: req.method(),
        url,
        body: req.postData()?.substring(0, 300),
        headers: Object.fromEntries(
          Object.entries(req.headers()).filter(([k]) => 
            k.startsWith('x-') || k === 'content-type' || k === 'session-token'
          )
        )
      });
    }
  });

  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('anura') && url.includes('search')) {
      try {
        const text = await resp.text();
        captured.push({ type: 'resp', url, status: resp.status(), body: text.substring(0, 500) });
      } catch {}
    }
  });

  // Load app
  console.log('Loading ZI...');
  await page.goto('https://app.zoominfo.com/#/apps/search/v2/results/company', {
    timeout: 30000, waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(12000);

  // Type in the Company Name filter
  // The advanced search page has filter sections. We need "Company Name" input.
  // Let's type directly into the search experience
  console.log('Looking for search input...');
  
  // Try clicking "Company Name" in the filter panel
  const allInputs = await page.$$('input');
  console.log(`Found ${allInputs.length} inputs`);
  
  for (const inp of allInputs) {
    const placeholder = await inp.getAttribute('placeholder');
    const ariaLabel = await inp.getAttribute('aria-label');
    const name = await inp.getAttribute('name');
    if (placeholder || ariaLabel) {
      console.log(`  Input: placeholder="${placeholder}" aria="${ariaLabel}" name="${name}"`);
    }
  }

  // Also check for the top search bar
  const topSearch = await page.$('input[placeholder*="Enter search" i]');
  if (topSearch) {
    console.log('\nFound top search bar! Typing...');
    await topSearch.click();
    await topSearch.type('stripe.com', { delay: 50 });
    await page.waitForTimeout(2000);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);
  }

  // Print all captured requests
  console.log('\n=== Captured network calls ===');
  for (const c of captured) {
    if (c.type === 'req') {
      console.log(`\nREQ: ${c.method} ${c.url.substring(0, 120)}`);
      if (c.body) console.log(`  Body: ${c.body}`);
    } else {
      console.log(`\nRESP: [${c.status}] ${c.url.substring(0, 120)}`);
      console.log(`  Data: ${c.body.substring(0, 300)}`);
    }
  }

  await context.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
