import { chromium } from 'playwright';

const CODE = process.argv[2];
if (!CODE) { console.error('Usage: node zi_go.mjs <2fa_code>'); process.exit(1); }

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto('https://login.zoominfo.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  
  // Remove cookie overlay
  await page.evaluate(() => { document.getElementById('onetrust-consent-sdk')?.remove(); });
  
  // Login
  await page.fill('#usernameInput', 'jordan@dane.insure');
  await page.fill('#pwInput', 'Asshole2323!');
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) { if (b.textContent.includes('Log In') && b.offsetParent !== null) { b.click(); break; } }
  });
  
  await page.waitForTimeout(5000);
  await page.evaluate(() => { document.getElementById('onetrust-consent-sdk')?.remove(); });
  
  // Enter 2FA
  console.log('Entering code:', CODE);
  await page.fill('input[placeholder*="123456"]', CODE);
  await page.evaluate(() => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => { if (cb.offsetParent !== null) cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles:true})); });
  });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) { if (b.textContent.includes('Verify') && b.offsetParent !== null) { b.click(); break; } }
  });
  
  await page.waitForTimeout(8000);
  console.log('URL:', page.url());
  
  if (!page.url().includes('login')) {
    console.log('✅ SUCCESS - LOGGED IN');
    await page.context().storageState({ path: 'jordan.ai/zi_storage.json' });
    console.log('Session cookies saved');
    await page.screenshot({ path: 'jordan.ai/zi_success.png' });
    
    const text = await page.textContent('body');
    console.log('Page:', text.substring(0, 2000));
  } else {
    console.log('❌ Failed');
    await page.screenshot({ path: 'jordan.ai/zi_fail.png' });
  }
  await browser.close();
}
main().catch(e => { console.error(e.message); process.exit(1); });
