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
  
  await page.fill('#usernameInput', 'jordan@dane.insure');
  await page.fill('#pwInput', 'Asshole2323!');
  
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    const visible = await btn.isVisible();
    if (text.includes('Log In') && visible) {
      await btn.click();
      break;
    }
  }
  
  await page.waitForTimeout(6000);
  console.log('Post-login URL:', page.url());
  
  const body = await page.textContent('body');
  if (body.includes('Email Authentication') || body.includes('enter code')) {
    console.log('Entering 2FA code...');
    await page.fill('input[placeholder*="123456"]', '512572');
    
    // Check "don't challenge" 
    try {
      const checkboxes = await page.$$('input[type="checkbox"]');
      for (const cb of checkboxes) {
        const visible = await cb.isVisible();
        if (visible) { await cb.check(); break; }
      }
    } catch {}
    
    // Click verify
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      const text = await btn.textContent();
      const visible = await btn.isVisible();
      if (text.includes('Verify') && visible) { await btn.click(); break; }
    }
    
    await page.waitForTimeout(8000);
    console.log('Post-2FA URL:', page.url());
  }
  
  if (!page.url().includes('login')) {
    console.log('LOGGED IN!');
    const context = page.context();
    await context.storageState({ path: 'jordan.ai/zi_storage.json' });
    console.log('Session saved!');
    
    // Test: go to home
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'jordan.ai/zi_home.png' });
    
    // Get page text
    const text = await page.textContent('body');
    console.log('Page text (2000):', text.substring(0, 2000));
  } else {
    console.log('Still on login page');
    await page.screenshot({ path: 'jordan.ai/zi_fail.png' });
    const text = await page.textContent('body');
    console.log('Page text:', text.substring(0, 1000));
  }
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
