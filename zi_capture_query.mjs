import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';

const storageState = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const context = await chromium.launchPersistentContext('/tmp/zi-capture', {
    headless: true,
    executablePath: CHROME_PATH,
    viewport: { width: 1280, height: 800 },
    args: ['--disable-blink-features=AutomationControlled']
  });
  await context.addCookies(storageState.cookies);
  const page = await context.newPage();

  // Capture the EXACT request body and headers for quickSearch
  let capturedRequest = null;
  page.on('request', (req) => {
    if (req.url().includes('quickSearch') && req.method() === 'POST') {
      capturedRequest = {
        url: req.url(),
        method: req.method(),
        headers: req.headers(),
        body: req.postData()
      };
    }
  });

  // Load app
  await page.goto('https://app.zoominfo.com/', { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(12000);

  // Type in quick search to trigger the request
  const quickSearch = await page.$('input[name="quick-search-input"]');
  await quickSearch.click();
  await quickSearch.type('statusgator.com', { delay: 80 });
  await page.waitForTimeout(5000);

  if (capturedRequest) {
    console.log('=== CAPTURED REQUEST ===');
    console.log('URL:', capturedRequest.url);
    console.log('\nHEADERS:');
    for (const [k, v] of Object.entries(capturedRequest.headers)) {
      if (!['accept-encoding', 'accept-language', 'user-agent', 'sec-', 'referer'].some(x => k.startsWith(x))) {
        console.log(`  ${k}: ${v.substring(0, 200)}`);
      }
    }
    console.log('\nBODY:');
    console.log(capturedRequest.body);
    
    // Save for reuse
    writeFileSync('jordan.ai/zi_quicksearch_template.json', JSON.stringify({
      url: capturedRequest.url,
      headers: capturedRequest.headers,
      body: capturedRequest.body
    }, null, 2));
    console.log('\nSaved to zi_quicksearch_template.json');
  } else {
    console.log('No quickSearch request captured!');
  }

  await context.close();
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
