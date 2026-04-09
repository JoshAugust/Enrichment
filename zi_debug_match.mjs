import { chromium } from 'playwright';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function debug(domain) {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.newContext({ storageState: 'jordan.ai/zi_storage.json' });
  const page = await context.newPage();
  
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  const input = await page.$('input[aria-label="Quick Search"]');
  await input.click();
  await input.type(domain, { delay: 30 });
  await page.waitForTimeout(2500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  
  console.log(`\n=== ${domain} ===`);
  console.log('URL:', page.url());
  
  // Get company-website elements
  const websites = await page.$$eval('[class*="company-website"], [class*="url"], a[target="_blank"]', 
    els => els.map(e => ({
      text: e.textContent?.trim(),
      href: e.href,
      class: e.className?.substring(0, 80),
      visible: e.offsetParent !== null
    })).filter(e => e.visible && e.text?.includes('.'))
  );
  
  console.log('Website elements:');
  for (const w of websites) {
    console.log(`  "${w.text}" | href=${w.href} | class=${w.class}`);
  }
  
  // Get the company name shown
  const h1 = await page.$eval('h1, [class*="company-name"], [class*="profile-name"]', el => el.textContent?.trim()).catch(() => 'N/A');
  console.log('Company name:', h1);
  
  await browser.close();
}

async function main() {
  for (const d of ['buttondown.com', 'glif.app']) {
    await debug(d);
    await new Promise(r => setTimeout(r, 2000));
  }
}
main().catch(console.error);
