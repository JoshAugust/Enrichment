import { chromium } from 'playwright';
import fs from 'fs';

const STORAGE_PATH = 'jordan.ai/zi_storage.json';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  
  // Reuse storage state if available
  let context;
  if (fs.existsSync(STORAGE_PATH)) {
    console.log('Reusing saved session...');
    context = await browser.newContext({ storageState: STORAGE_PATH });
  } else {
    context = await browser.newContext();
  }
  
  const page = await context.newPage();
  
  // Try going straight to app
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);
  
  const url = page.url();
  console.log('URL:', url);
  
  if (url.includes('login')) {
    console.log('Need to login...');
    await page.fill('#okta-signin-username', 'jordan@dane.insure');
    await page.fill('#okta-signin-password', 'Asshole2323!');
    await page.click('#okta-signin-submit');
    await page.waitForTimeout(5000);
    
    const postUrl = page.url();
    console.log('Post-login URL:', postUrl);
    
    const body = await page.textContent('body');
    if (body.includes('Email Authentication') || body.includes('enter code')) {
      console.log('2FA_REQUIRED');
      await browser.close();
      return;
    }
  }
  
  // Should be logged in - save storage
  await context.storageState({ path: STORAGE_PATH });
  console.log('Session saved!');
  
  // Now search for StatusGator
  console.log('Searching for StatusGator...');
  
  // Use the global search bar
  await page.screenshot({ path: 'jordan.ai/zi_home.png' });
  
  // Try navigating to a company directly
  await page.goto('https://app.zoominfo.com/#/apps/search/v2/company/results?query=StatusGator&type=company', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'jordan.ai/zi_search_sg.png' });
  
  // Get all text content
  const content = await page.textContent('body');
  console.log('Content length:', content.length);
  console.log('First 3000 chars:', content.substring(0, 3000));
  
  await browser.close();
  console.log('Done');
}

main().catch(e => { console.error(e.message); process.exit(1); });
