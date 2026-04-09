import { chromium } from 'playwright';
import fs from 'fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
  const context = await browser.newContext({ storageState: 'jordan.ai/zi_storage.json' });
  const page = await context.newPage();
  
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  const input = await page.$('input[aria-label="Quick Search"]');
  await input.click();
  await input.type('statusgator.com', { delay: 30 });
  await page.waitForTimeout(2500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(5000);
  
  // Get ALL links on the page
  const links = await page.$$eval('a[href]', els => els.map(e => ({ href: e.href, text: e.textContent.trim().substring(0, 100), visible: e.offsetParent !== null })));
  console.log('Links with domains:');
  for (const l of links.filter(l => l.visible && l.href.includes('.'))) {
    if (!l.href.includes('zoominfo') && !l.href.includes('javascript') && !l.href.includes('google')) {
      console.log(`  ${l.text} → ${l.href}`);
    }
  }
  
  // Get all text that looks like a domain
  const text = await page.textContent('body');
  const domainMatches = text.match(/(?:www\.)?[\w-]+\.(com|io|ai|app|co|dev|net|org)\b/gi) || [];
  const unique = [...new Set(domainMatches)].filter(d => !d.includes('zoominfo') && !d.includes('google'));
  console.log('\nDomains found in page text:');
  for (const d of unique) console.log(`  ${d}`);
  
  // Try getting the website element specifically
  const websiteEls = await page.$$eval('[class*="website"], [data-testid*="website"], a[target="_blank"]', 
    els => els.map(e => ({ text: e.textContent?.trim(), href: e.href, class: e.className?.substring(0, 50) })));
  console.log('\nWebsite elements:');
  for (const w of websiteEls.filter(w => w.text?.includes('.'))) {
    console.log(`  ${w.text} | ${w.href} | ${w.class}`);
  }
  
  await browser.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
