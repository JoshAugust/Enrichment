import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const page = await browser.newPage();
  await page.goto('https://app.apollo.io/#/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(3000);
  
  // Remove cookie banners
  await page.evaluate(() => {
    document.querySelectorAll('[class*="cookie"], [class*="consent"], [id*="cookie"], [id*="consent"]').forEach(el => el.remove());
  });
  
  console.log('URL:', page.url());
  
  // Find inputs
  const inputs = await page.$$('input');
  for (const inp of inputs) {
    const attrs = await inp.evaluate(el => ({
      type: el.type, name: el.name, placeholder: el.placeholder, id: el.id, visible: el.offsetParent !== null
    }));
    if (attrs.visible) console.log('Input:', JSON.stringify(attrs));
  }
  
  // Try filling email
  try {
    await page.fill('input[name="email"], input[type="email"], input[placeholder*="email" i]', 'jordan@dane.insure');
    await page.fill('input[name="password"], input[type="password"]', 'Asshole2323!');
    
    // Click login button
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button, input[type="submit"]')];
      for (const b of btns) {
        if (b.textContent?.match(/log\s*in|sign\s*in/i) && b.offsetParent !== null) { b.click(); break; }
      }
    });
    
    await page.waitForTimeout(6000);
    console.log('Post-login URL:', page.url());
    
    if (!page.url().includes('login')) {
      console.log('✅ LOGGED IN!');
      await page.context().storageState({ path: 'jordan.ai/apollo_storage.json' });
      const text = await page.textContent('body');
      console.log('Page (1000):', text.replace(/\s+/g, ' ').substring(0, 1000));
    } else {
      console.log('Still on login');
      await page.screenshot({ path: 'jordan.ai/apollo_login_result.png' });
      const text = await page.textContent('body');
      console.log('Page:', text.replace(/\s+/g, ' ').substring(0, 500));
    }
  } catch(e) {
    console.log('Error:', e.message.substring(0, 300));
    await page.screenshot({ path: 'jordan.ai/apollo_login_debug.png' });
  }
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
