import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  // Try with whatever storage we have
  let context;
  if (fs.existsSync('jordan.ai/apollo_storage.json')) {
    context = await browser.newContext({ storageState: 'jordan.ai/apollo_storage.json' });
  } else {
    context = await browser.newContext();
  }
  
  const page = await context.newPage();
  await page.goto('https://app.apollo.io/#/people', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('❌ Not logged in - need cookies from Josh');
  } else {
    console.log('✅ Logged in!');
    const text = await page.textContent('body');
    console.log('Page (1000):', text.replace(/\s+/g, ' ').substring(0, 1000));
  }
  
  await page.screenshot({ path: 'jordan.ai/apollo_state.png' });
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
