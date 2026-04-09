import { chromium } from 'playwright';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  await page.goto('https://login.zoominfo.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // Use the visible custom inputs (usernameInput / pwInput)
  await page.fill('#usernameInput', 'jordan@dane.insure');
  await page.fill('#pwInput', 'Asshole2323!');
  
  // Click remember me
  try { await page.check('#undefined'); } catch {}
  
  // Find and click the visible login button
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    const visible = await btn.isVisible();
    if (text.includes('Log In') && visible) {
      console.log('Clicking visible Log In button');
      await btn.click();
      break;
    }
  }
  
  await page.waitForTimeout(6000);
  console.log('Post-login URL:', page.url());
  
  const body = await page.textContent('body');
  if (body.includes('Email Authentication') || body.includes('enter code')) {
    console.log('2FA REQUIRED - saving state for code entry');
    await page.screenshot({ path: 'jordan.ai/zi_2fa.png' });
    // Wait for user to provide code via stdin
    process.stdout.write('ENTER_2FA_CODE: ');
    const code = await new Promise(r => {
      process.stdin.once('data', d => r(d.toString().trim()));
    });
    await page.fill('input[placeholder*="123456"]', code);
    // Check "don't challenge" box
    try {
      const checkbox = await page.$('input[type="checkbox"]');
      if (checkbox) await checkbox.check();
    } catch {}
    // Click verify
    const verifyBtns = await page.$$('button');
    for (const btn of verifyBtns) {
      const text = await btn.textContent();
      if (text.includes('Verify')) { await btn.click(); break; }
    }
    await page.waitForTimeout(5000);
    console.log('Post-2FA URL:', page.url());
  }
  
  if (!page.url().includes('login')) {
    console.log('LOGGED IN!');
    // Save session
    const context = page.context();
    await context.storageState({ path: 'jordan.ai/zi_storage.json' });
    console.log('Session saved to zi_storage.json');
    
    // Quick test - search a company
    await page.goto('https://app.zoominfo.com/#/apps/search/v2/company/results', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'jordan.ai/zi_dashboard.png' });
    console.log('Dashboard screenshot saved');
    
    // Get visible text
    const text = await page.textContent('body');
    console.log('Dashboard text (2000):', text.substring(0, 2000));
  }
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
