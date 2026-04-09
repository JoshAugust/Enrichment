import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const domain = process.argv[2] || 'evisions.com';

const browser = await chromium.launchPersistentContext('/tmp/zi-rev-test', {
  headless: true,
  viewport: { width: 1280, height: 800 }
});

const state = JSON.parse(readFileSync('jordan.ai/zi_storage.json', 'utf8'));
const page = await browser.newPage();
if (state.cookies) {
  await page.context().addCookies(state.cookies);
}

// Search ZI for the domain
const searchUrl = `https://app.zoominfo.com/#/apps/search/v2/results/company?query=${encodeURIComponent(domain)}`;
console.log(`Searching: ${searchUrl}`);
await page.goto(searchUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

const content = await page.content();
const clean = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// Revenue
const revMatches = clean.match(/\$([\d,.]+)\s*(Million|Billion|Thousand)/gi) || [];
console.log('Revenue mentions:', revMatches.slice(0, 5).join(' | '));

// Employee ranges
const empMatches = clean.match(/(\d{1,5})\s*-\s*(\d{1,5})/g) || [];
console.log('Employee ranges:', empMatches.slice(0, 5).join(' | '));

// Company website element
const websiteEls = await page.$$('[class*="company-website"]');
for (const el of websiteEls) {
  console.log('Website el:', (await el.textContent()).trim());
}

// Also try the profile page directly
const links = await page.$$('a[href*="/c/"]');
let profileUrl = null;
for (const link of links.slice(0, 5)) {
  const href = await link.getAttribute('href');
  if (href && href.includes('/c/') && !href.includes('/search/')) {
    profileUrl = href;
    break;
  }
}

if (profileUrl) {
  console.log(`\nNavigating to profile: ${profileUrl}`);
  if (!profileUrl.startsWith('http')) profileUrl = 'https://app.zoominfo.com' + profileUrl;
  await page.goto(profileUrl, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  
  const profileContent = await page.content();
  const profileClean = profileContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  
  const profRevMatches = profileClean.match(/\$([\d,.]+)\s*(Million|Billion|Thousand)/gi) || [];
  console.log('Profile Revenue:', profRevMatches.slice(0, 5).join(' | '));
  
  const profEmpMatches = profileClean.match(/(\d{1,5})\s*-\s*(\d{1,5})/g) || [];
  console.log('Profile Employee ranges:', profEmpMatches.slice(0, 5).join(' | '));
  
  // Find the actual revenue and employee sections
  const revSection = profileClean.match(/Revenue[:\s]*([\$\d,.\s]*(Million|Billion|K|M))/i);
  console.log('Revenue section:', revSection ? revSection[0] : 'not found');
  
  const empSection = profileClean.match(/Employees?[:\s]*(\d[\d,]*)/i);
  console.log('Employee section:', empSection ? empSection[0] : 'not found');
  
  // Website shown on profile
  const websiteMatch = profileClean.match(/(?:Website|Company Website)[:\s]*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  console.log('Profile website:', websiteMatch ? websiteMatch[1] : 'not found');
}

await browser.close();
