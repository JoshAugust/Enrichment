import { chromium } from 'playwright';

const ZOOMINFO_USER = 'jordan@dane.insure';
const ZOOMINFO_PASS = 'Asshole2323!';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to ZoomInfo login...');
  await page.goto('https://app.zoominfo.com/#/login', { waitUntil: 'networkidle', timeout: 30000 });
  
  // Accept cookies if present
  try {
    await page.click('button:has-text("Accept All Cookies")', { timeout: 3000 });
  } catch {}
  
  // Login
  console.log('Logging in...');
  await page.fill('input[placeholder="Username"], input[name="username"]', ZOOMINFO_USER);
  await page.fill('input[type="password"], input[name="password"]', ZOOMINFO_PASS);
  await page.click('button:has-text("Log In")');
  
  // Check for 2FA
  await page.waitForTimeout(3000);
  const url = page.url();
  console.log('Current URL:', url);
  
  const pageText = await page.textContent('body');
  if (pageText.includes('Email Authentication') || pageText.includes('enter code')) {
    console.log('2FA_REQUIRED');
    // We should already have the "don't challenge" cookie from earlier session
    // If 2FA appears, we need to handle it
    await browser.close();
    process.exit(1);
  }
  
  console.log('Logged in! Testing company search...');
  
  // Navigate to company search
  await page.goto('https://app.zoominfo.com/#/apps/search/v2/company/results', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  
  console.log('Page title:', await page.title());
  console.log('URL:', page.url());
  
  // Take a screenshot to see what we've got
  await page.screenshot({ path: '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/zi_screenshot.png', fullPage: false });
  console.log('Screenshot saved to jordan.ai/zi_screenshot.png');
  
  // Try searching for a company directly via URL
  // ZoomInfo search URL pattern
  await page.goto('https://app.zoominfo.com/#/apps/search/v2/company/results?query=statusgator', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/jordan.ai/zi_search.png', fullPage: false });
  console.log('Search screenshot saved');
  
  // Try to get the page content
  const content = await page.textContent('body');
  console.log('Page content (first 2000 chars):');
  console.log(content.substring(0, 2000));
  
  await browser.close();
  console.log('Done!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
