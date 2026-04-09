import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const context = await chromium.launchPersistentContext('/tmp/zi-final-test', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  const page = await context.newPage();

  // Capture search API calls
  const apiCalls = [];
  page.on('request', (req) => {
    const url = req.url();
    if (req.method() === 'POST' && (url.includes('search') || url.includes('company'))) {
      apiCalls.push({ url, body: req.postData(), headers: req.headers() });
    }
  });
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.includes('search') || url.includes('company')) {
      try {
        const ct = resp.headers()['content-type'] || '';
        if (ct.includes('json')) {
          const text = await resp.text();
          if (text.length > 10) {
            apiCalls.push({ url, status: resp.status(), response: text.substring(0, 1000) });
          }
        }
      } catch {}
    }
  });

  // Load app
  console.log('Loading ZI...');
  await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);

  // Use Quick Search
  const quickSearch = await page.$('input[name="quick-search-input"]');
  if (!quickSearch) {
    console.log('ERROR: Quick search input not found');
    await context.close();
    return;
  }

  console.log('Typing stripe.com into quick search...');
  await quickSearch.click();
  await page.waitForTimeout(500);
  await quickSearch.type('stripe.com', { delay: 80 });
  await page.waitForTimeout(3000);

  // Check for autocomplete dropdown
  const visText = await page.evaluate(() => document.body.innerText);
  const stripeLines = visText.split('\n').filter(l => l.toLowerCase().includes('stripe'));
  console.log('Lines with "stripe":');
  for (const l of stripeLines.slice(0, 10)) {
    console.log('  ' + l.trim().substring(0, 100));
  }

  // Press Enter to search
  await page.keyboard.press('Enter');
  await page.waitForTimeout(8000);

  // Check URL
  console.log('\nURL after search:', page.url());

  // Check visible results
  const afterText = await page.evaluate(() => document.body.innerText);
  const resultLines = afterText.split('\n').filter(l => 
    l.includes('Stripe') || l.includes('Revenue') || l.includes('Employee') ||
    l.includes('result') || l.includes('company') || l.match(/\$[\d,]+/)
  );
  console.log('\nRelevant visible text:');
  for (const l of resultLines.slice(0, 20)) {
    console.log('  ' + l.trim().substring(0, 120));
  }

  // Check for profile links
  const links = await page.$$eval('a[href*="profile"]', els =>
    els.map(el => ({ href: el.getAttribute('href'), text: el.textContent.trim().substring(0, 50) }))
  );
  console.log('\nProfile links:', links.length);
  for (const l of links.slice(0, 5)) {
    console.log('  ', l.href, '—', l.text);
  }

  // Print captured API calls
  console.log('\n=== API Calls ===');
  for (const c of apiCalls) {
    if (c.response) {
      console.log(`RESP [${c.status}]: ${c.url.substring(0, 100)}`);
      console.log(`  ${c.response.substring(0, 300)}`);
    } else if (c.body) {
      console.log(`REQ: ${c.url.substring(0, 100)}`);
      console.log(`  ${c.body.substring(0, 200)}`);
    }
  }

  await context.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
