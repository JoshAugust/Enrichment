#!/usr/bin/env node
/**
 * Browser Session Manager
 * 
 * Keeps browser sessions alive by:
 * 1. Storing cookies/storage state after every successful page load
 * 2. Auto-refreshing cookies before they expire (every 30 min)
 * 3. Detecting session expiry and alerting immediately
 * 4. Providing a clean API for scrapers to get a fresh, authenticated page
 * 
 * Usage:
 *   import { getAuthenticatedPage, refreshSession } from './browser_session_manager.mjs';
 *   const { page, context, browser } = await getAuthenticatedPage('zoominfo');
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SESSIONS_DIR = 'jordan.ai/browser_sessions';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Session configs
const CONFIGS = {
  zoominfo: {
    storageFile: 'jordan.ai/zi_storage.json',
    testUrl: 'https://app.zoominfo.com/#/apps/home-page',
    loginIndicator: 'login.zoominfo.com',
    refreshUrl: 'https://app.zoominfo.com/#/apps/home-page',
    cookieFile: 'jordan.ai/zi_cookies_backup.json',
  },
  apollo: {
    storageFile: 'jordan.ai/apollo_storage.json',
    testUrl: 'https://app.apollo.io/#/people',
    loginIndicator: '/login',
    refreshUrl: 'https://app.apollo.io/#/people',
    cookieFile: 'jordan.ai/apollo_cookies_backup.json',
  }
};

// Ensure sessions dir exists
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

/**
 * Get an authenticated Playwright page for a service
 */
export async function getAuthenticatedPage(service, options = {}) {
  const config = CONFIGS[service];
  if (!config) throw new Error(`Unknown service: ${service}. Available: ${Object.keys(CONFIGS).join(', ')}`);
  
  if (!fs.existsSync(config.storageFile)) {
    throw new Error(`No stored session for ${service}. Run cookie import first.`);
  }
  
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer']
  });
  
  const context = await browser.newContext({ 
    storageState: config.storageFile,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  // Test if session is valid
  await page.goto(config.testUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(4000);
  
  if (page.url().includes(config.loginIndicator)) {
    await browser.close();
    throw new Error(`SESSION_EXPIRED: ${service} session is no longer valid. Need fresh cookies.`);
  }
  
  // Session is good - save updated cookies
  await context.storageState({ path: config.storageFile });
  
  // Also backup cookies as raw JSON
  const cookies = await context.cookies();
  fs.writeFileSync(config.cookieFile, JSON.stringify(cookies, null, 2));
  
  return { page, context, browser, config };
}

/**
 * Refresh a session by navigating to the app (keeps session alive)
 */
export async function refreshSession(service) {
  try {
    const { page, context, browser, config } = await getAuthenticatedPage(service);
    
    // Navigate to refresh page to trigger cookie renewal
    await page.goto(config.refreshUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Save refreshed state
    await context.storageState({ path: config.storageFile });
    const cookies = await context.cookies();
    fs.writeFileSync(config.cookieFile, JSON.stringify(cookies, null, 2));
    
    await browser.close();
    
    const status = { service, status: 'alive', refreshedAt: new Date().toISOString(), cookieCount: cookies.length };
    fs.writeFileSync(`${SESSIONS_DIR}/${service}_status.json`, JSON.stringify(status, null, 2));
    
    return status;
  } catch(e) {
    const status = { service, status: 'expired', error: e.message, checkedAt: new Date().toISOString() };
    fs.writeFileSync(`${SESSIONS_DIR}/${service}_status.json`, JSON.stringify(status, null, 2));
    return status;
  }
}

/**
 * Import raw cookie string (from browser console copy(document.cookie))
 */
export function importCookies(service, rawCookieString) {
  const config = CONFIGS[service];
  if (!config) throw new Error(`Unknown service: ${service}`);
  
  const domain = service === 'zoominfo' ? '.zoominfo.com' : '.apollo.io';
  
  const cookies = rawCookieString.split('; ').filter(s => s.includes('=')).map(pair => {
    const i = pair.indexOf('=');
    return { name: pair.substring(0, i), value: pair.substring(i + 1), domain, path: '/' };
  });
  
  // Save as Playwright storage state format
  const storageState = { cookies, origins: [] };
  fs.writeFileSync(config.storageFile, JSON.stringify(storageState, null, 2));
  
  return { service, cookieCount: cookies.length, savedTo: config.storageFile };
}

/**
 * Check all sessions
 */
export async function checkAll() {
  const results = {};
  for (const service of Object.keys(CONFIGS)) {
    if (fs.existsSync(CONFIGS[service].storageFile)) {
      results[service] = await refreshSession(service);
    } else {
      results[service] = { status: 'not_configured' };
    }
  }
  return results;
}

// CLI mode
if (process.argv[2]) {
  const cmd = process.argv[2];
  if (cmd === 'refresh-all') {
    checkAll().then(r => console.log(JSON.stringify(r, null, 2)));
  } else if (cmd === 'refresh') {
    const svc = process.argv[3];
    refreshSession(svc).then(r => console.log(JSON.stringify(r, null, 2)));
  } else if (cmd === 'import') {
    const svc = process.argv[3];
    const cookies = process.argv[4] || fs.readFileSync('/dev/stdin', 'utf-8');
    console.log(JSON.stringify(importCookies(svc, cookies), null, 2));
  }
}
