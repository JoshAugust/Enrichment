import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  await page.goto('https://login.zoominfo.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // Kill cookie banner FIRST
  await page.evaluate(() => {
    const el = document.getElementById('onetrust-consent-sdk');
    if (el) el.remove();
  });
  
  await page.fill('#usernameInput', 'jordan@dane.insure');
  await page.fill('#pwInput', 'Asshole2323!');
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    const visible = await btn.isVisible();
    if (text.includes('Log In') && visible) { await btn.click(); break; }
  }
  
  await page.waitForTimeout(6000);
  console.log('Post-login URL:', page.url());
  
  // Kill cookie banner again if it reappears
  await page.evaluate(() => {
    const el = document.getElementById('onetrust-consent-sdk');
    if (el) el.remove();
  });
  
  const body = await page.textContent('body');
  if (body.includes('Email Authentication') || body.includes('enter code')) {
    console.log('Entering 2FA...');
    await page.fill('input[placeholder*="123456"]', '512572');
    
    // Check don't challenge checkbox via JS
    await page.evaluate(() => {
      const cbs = document.querySelectorAll('input[type="checkbox"]');
      cbs.forEach(cb => { if (cb.offsetParent !== null) cb.checked = true; });
    });
    
    // Click verify via JS to bypass overlay
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const b of btns) {
        if (b.textContent.includes('Verify') && b.offsetParent !== null) { b.click(); break; }
      }
    });
    
    await page.waitForTimeout(8000);
    console.log('Post-2FA URL:', page.url());
  }
  
  if (!page.url().includes('login')) {
    console.log('✅ LOGGED IN!');
    await page.context().storageState({ path: 'jordan.ai/zi_storage.json' });
    console.log('Session saved to zi_storage.json');
    
    await page.waitForTimeout(2000);
    const text = await page.textContent('body');
    console.log('Dashboard text (1500):', text.substring(0, 1500));
    await page.screenshot({ path: 'jordan.ai/zi_success.png' });
  } else {
    console.log('❌ Still on login');
    await page.screenshot({ path: 'jordan.ai/zi_stuck.png' });
    const text = await page.textContent('body');
    console.log('Page:', text.substring(0, 1000));
  }
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
