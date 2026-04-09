import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const context = await chromium.launchPersistentContext('/tmp/zi-test-api', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  const page = await context.newPage();

  // Load ZI first to establish session
  console.log('Loading ZI app...');
  await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(10000);
  console.log('URL:', page.url());

  // Now make API calls FROM the browser context (cookies auto-attached)
  for (const domain of ['stripe.com', 'statusgator.com', 'tightknit.com']) {
    console.log(`\nSearching: ${domain}`);
    const result = await page.evaluate(async (d) => {
      try {
        // Try the search API with cookies (browser auto-attaches them)
        const resp = await fetch('https://api.zoominfo.com/search/company', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ companyWebsite: d, rpp: 1 })
        });
        const status = resp.status;
        const text = await resp.text();
        return { status, body: text.substring(0, 500) };
      } catch (e) {
        return { error: e.message };
      }
    }, domain);
    
    console.log(`  Status: ${result.status || 'ERROR'}`);
    console.log(`  Body: ${(result.body || result.error || '').substring(0, 200)}`);
  }

  // Also try the internal DOZI search endpoint that the SPA uses
  console.log('\n--- Trying DOZI internal search ---');
  const doziResult = await page.evaluate(async () => {
    try {
      // The SPA uses this endpoint internally
      const resp = await fetch('https://app.zoominfo.com/anura/v2/search/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyWebsite: 'stripe.com',
          rpp: 1,
          outputFields: ['id', 'companyName', 'website', 'revenue', 'employeeCount']
        })
      });
      return { status: resp.status, body: (await resp.text()).substring(0, 500) };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('DOZI:', doziResult.status || doziResult.error);
  console.log('Body:', (doziResult.body || '').substring(0, 300));

  await context.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
