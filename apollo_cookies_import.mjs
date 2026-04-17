import { chromium } from 'playwright';
import fs from 'fs';

const RAW = `app_token=4f0abde2e3fd57736f744c079aa59430; intercom-device-id-dyws6i9m=0149e9fa-a901-4ebc-bc4f-6b743114a63f; ZP_LATEST_LOGIN_PRICING_VARIANT=25Q2_UC_AB59; ZP_Pricing_Split_Test_Variant=25Q2_UC_AB59; AMP_MKTG_122a93c7d9=JTdCJTdE; intercom-session-dyws6i9m=UmpyVENnbmErcVpERkFyV2VsdTl6VWZaOXFCNHpUZkc5d0JnMk9yalpITzFpTHF0SmtXbkdDdWRhalVTQzRtT1hYTnFRejNQdTQ0c2V5MURsNDY1MFBONlpQYUdFRUFPMGYxQWJ4TVJKRmxPSGlZc1hJYTdiaW5ndGdzOHI4M0RPSEVDUlJ1bmNZaElMUEVTZTZqc20zL3Q2Wko3QWdOYVB1OVJVenVkWHo0WTRUeE1NT250cVpCczV4dFJTTThHMlVRRzZqMHV6QllMNHV1MGhobXhpZDliaGM3TDBOeXVBTzY0azFYcUhqYnpoTElQRjBqMkFkUC80ZlZxUHJEK3VxeDZDSFl5OUpCRG5tTWhnUkpQdUFtb3FZWWxRZmtKL2lqMU9IOHNQNlk9LS1qWEVyVnM3dmo0RlZFZlhRNFFWUFdRPT0=--629e192f51656b6c4b919fd2032f29368d9204f0; X-CSRF-TOKEN=3uNSks2Oeono7ci0rt5UA3ibpIAODtv4TkAfZiXuyOWxgq8hVkMWW5VKyolZDx9DK86U55aziRREWUuP149CVA; AMP_122a93c7d9=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIwNmQzZDEzNS02Y2NjLTQzMzctYTY3NS1jOTc0ZDgyZGMxZDAlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjI2OWMxMzFkNDBmMDIxMDAwMjE1MmJlZGYlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzc1MzM1NTk1NzAwJTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTc3NTMzNTU5NjMyNyUyQyUyMmxhc3RFdmVudElkJTIyJTNBMTkwJTJDJTIycGFnZUNvdW50ZXIlMjIlM0EwJTdE`;

const cookies = RAW.split('; ').filter(s => s.includes('=')).map(pair => {
  const i = pair.indexOf('=');
  return { name: pair.substring(0, i), value: pair.substring(i + 1), domain: '.apollo.io', path: '/' };
});

// Save as storage state
fs.writeFileSync('jordan.ai/apollo_storage.json', JSON.stringify({ cookies, origins: [] }, null, 2));
console.log(`Saved ${cookies.length} cookies`);

// Test
async function test() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const context = await browser.newContext({ storageState: 'jordan.ai/apollo_storage.json' });
  const page = await context.newPage();
  
  await page.goto('https://app.apollo.io/#/people', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('❌ Not logged in');
  } else {
    console.log('✅ LOGGED IN!');
    await context.storageState({ path: 'jordan.ai/apollo_storage.json' });
    
    // Test search - look up a company
    await page.goto('https://app.apollo.io/#/companies?sortByField=company_name&sortAscending=true&organizationSearchName=StatusGator', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(5000);
    
    console.log('Search URL:', page.url());
    const text = await page.textContent('body');
    console.log('Page (2000):', text.replace(/\s+/g, ' ').substring(0, 2000));
    await page.screenshot({ path: 'jordan.ai/apollo_search_test.png' });
  }
  
  await browser.close();
}

test().catch(e => { console.error(e.message); process.exit(1); });
