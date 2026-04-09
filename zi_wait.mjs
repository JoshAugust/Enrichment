import { chromium } from 'playwright';
import fs from 'fs';
import http from 'http';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.goto('https://login.zoominfo.com', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { document.getElementById('onetrust-consent-sdk')?.remove(); });
  
  await page.fill('#usernameInput', 'jordan@dane.insure');
  await page.fill('#pwInput', 'Asshole2323!');
  await page.evaluate(() => {
    for (const b of document.querySelectorAll('button')) 
      if (b.textContent.includes('Log In') && b.offsetParent !== null) { b.click(); break; }
  });
  
  await page.waitForTimeout(5000);
  await page.evaluate(() => { document.getElementById('onetrust-consent-sdk')?.remove(); });
  
  console.log('LOGIN_DONE - 2FA page loaded. Waiting for code on port 19850...');
  
  // Start tiny HTTP server to receive the code
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const code = url.searchParams.get('code');
    if (!code) { res.end('send ?code=123456'); return; }
    
    console.log('Got code:', code);
    
    try {
      await page.fill('input[placeholder*="123456"]', code);
      await page.evaluate(() => {
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => { 
          if (cb.offsetParent !== null) { cb.checked = true; cb.dispatchEvent(new Event('change', {bubbles:true})); }
        });
      });
      await page.waitForTimeout(300);
      await page.evaluate(() => {
        for (const b of document.querySelectorAll('button'))
          if (b.textContent.includes('Verify') && b.offsetParent !== null) { b.click(); break; }
      });
      
      await page.waitForTimeout(8000);
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
      
      if (!finalUrl.includes('login')) {
        await page.context().storageState({ path: 'jordan.ai/zi_storage.json' });
        console.log('✅ SESSION SAVED');
        res.end('SUCCESS');
      } else {
        await page.screenshot({ path: 'jordan.ai/zi_fail2.png' });
        res.end('FAILED - still on login');
      }
    } catch(e) {
      console.error(e.message);
      res.end('ERROR: ' + e.message);
    }
    
    server.close();
    await browser.close();
  });
  
  server.listen(19850, () => console.log('READY on :19850'));
  
  // Auto-close after 3 minutes
  setTimeout(async () => { server.close(); await browser.close(); console.log('Timeout'); process.exit(1); }, 180000);
}
main().catch(e => { console.error(e.message); process.exit(1); });
