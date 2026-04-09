import { chromium } from 'playwright';

async function searchCompany(page, companyName) {
  // Use the Quick Search bar
  const searchInput = await page.$('input[aria-label="Quick Search"]');
  if (!searchInput) throw new Error('Search input not found');
  
  await searchInput.click();
  await searchInput.fill('');
  await searchInput.type(companyName, { delay: 50 });
  await page.waitForTimeout(2000);
  
  // Take screenshot of search suggestions
  await page.screenshot({ path: `jordan.ai/zi_search_${companyName.replace(/\s/g,'_')}.png` });
  
  // Look for search results/suggestions
  const suggestions = await page.$$('[class*="suggestion"], [class*="result"], [class*="dropdown"] a, [class*="search-item"]');
  console.log(`Suggestions for "${companyName}": ${suggestions.length}`);
  
  // Get all visible text near search
  const dropdowns = await page.$$('[class*="dropdown"], [class*="overlay"], [class*="popover"], [class*="autocomplete"]');
  for (const dd of dropdowns) {
    const visible = await dd.isVisible();
    if (visible) {
      const text = await dd.textContent();
      if (text.trim().length > 5) {
        console.log('Dropdown text:', text.replace(/\s+/g, ' ').substring(0, 500));
      }
    }
  }
  
  // Press Enter to do full search
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  
  console.log('After search URL:', page.url());
  await page.screenshot({ path: `jordan.ai/zi_results_${companyName.replace(/\s/g,'_')}.png` });
  
  // Get page text
  const bodyText = await page.textContent('body');
  const clean = bodyText.replace(/\s+/g, ' ');
  console.log('Results text (3000):', clean.substring(0, 3000));
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const context = await browser.newContext({ storageState: 'jordan.ai/zi_storage.json' });
  const page = await context.newPage();
  
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  // Search for StatusGator
  await searchCompany(page, 'StatusGator');
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
