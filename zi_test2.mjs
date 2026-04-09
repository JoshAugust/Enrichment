import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const context = await chromium.launchPersistentContext('/tmp/zi-test-v6', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  const page = await context.newPage();

  // Intercept API responses
  const apiResults = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api.zoominfo.com') || url.includes('dozi') || url.includes('search')) {
      try {
        const status = response.status();
        const ct = response.headers()['content-type'] || '';
        if (ct.includes('json') || ct.includes('text')) {
          const text = await response.text();
          apiResults.push({ url: url.substring(0, 120), status, snippet: text.substring(0, 300) });
        }
      } catch {}
    }
  });

  // Load ZI — use the Advanced Search > Companies tab approach
  // Filter by company website domain
  console.log('Loading ZI Advanced Search...');
  await page.goto('https://app.zoominfo.com/#/apps/search/v2/results/company', {
    timeout: 30000, waitUntil: 'domcontentloaded'
  });
  await page.waitForTimeout(12000);

  console.log('URL:', page.url());
  const visText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Visible:', visText.substring(0, 300));

  // Look for Company Name filter input
  console.log('\nLooking for Company Name input...');
  const companyNameInput = await page.$('input[placeholder*="Company Name" i]');
  if (companyNameInput) {
    console.log('Found Company Name input');
    await companyNameInput.click();
    await companyNameInput.fill('Stripe');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);
  } else {
    // Try "Open Search" link or search functionality
    console.log('No Company Name input. Trying Open Search...');
    const openSearch = await page.$('text=Open Search');
    if (openSearch) {
      await openSearch.click();
      await page.waitForTimeout(3000);
    }
  }

  // Check API calls
  console.log('\nAPI calls intercepted:', apiResults.length);
  for (const r of apiResults.slice(-10)) {
    console.log(`  [${r.status}] ${r.url}`);
    if (r.snippet.includes('"data"') || r.snippet.includes('companyId')) {
      console.log('    Data:', r.snippet.substring(0, 200));
    }
  }

  // Check visible results
  const resultsText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
  // Look for result count or company names
  const resultLines = resultsText.split('\n').filter(l => l.trim().length > 0);
  console.log('\nVisible results (filtered):');
  for (const line of resultLines.slice(0, 30)) {
    if (line.includes('Stripe') || line.includes('result') || line.includes('Revenue') || 
        line.includes('Employee') || line.includes('company') || line.match(/\d+\s*(results|Companies)/i)) {
      console.log(' ', line.trim().substring(0, 100));
    }
  }

  await context.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
