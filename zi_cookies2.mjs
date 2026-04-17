import { chromium } from 'playwright';

const RAW = `_pxvid=fcc36c58-3055-11f1-9092-c53e9dfaacf0; pxcts=fd97c104-3055-11f1-9e89-5177fb36fb8f; doziUser=jordan%40dane.insure; parseSessionToken=1; userId=33287594; userEmail=jordan%40dane.insure; email=jordan%40dane.insure; name=Jordan%20Berra; firstname=Jordan; userZoomCompanyId=21451822; analyticsId=33287594; ziid=6TJepUmO2fQ02f1OF-3pbY4LYQZm9TxPnKGxrdJMBEqgDimFGLArO1iZmAnjrRXVvpq_iYKh3tNHRwXuL4X6kA; zisession=6TJepUmO2fQ02f1OF-3pbY4LYQZm9TxPnKGxrdJMBEqgDimFGLArO1iZmAnjrRXVvpq_iYKh3tNKTo2nT78bfg3SGGWHjsOYlsYp7vmf-7cxTtMfD-2XNKbersyAvwk0; zitokencachebust=1775420326; ziw-side-nav-expanded=true`;

function parseCookies(str, domain) {
  return str.split('; ').filter(s => s.includes('=')).map(pair => {
    const i = pair.indexOf('=');
    return { name: pair.substring(0, i), value: pair.substring(i + 1), domain, path: '/' };
  });
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const context = await browser.newContext();
  
  // Set cookies on .zoominfo.com
  const cookies = parseCookies(RAW, '.zoominfo.com');
  
  // Also add the access token separately (it has special chars)
  cookies.push({
    name: 'ziaccesstoken',
    value: 'eyJraWQiOiJKdThxUW1tTUx1SG9QSEFVQlJnUmhFOE9sMVVubmRRN2pveDFNYy1uVlFJIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULk5HdEJickVCQmhtR182bTVOUF9iOFBydVpGalo4WXVNTVB4dnFacEphWW8ub2FyM3YxNmg1NE1yanZIdlg2OTciLCJpc3MiOiJodHRwczovL29rdGEtbG9naW4uem9vbWluZm8uY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsInN1YiI6ImpvcmRhbkBkYW5lLmluc3VyZSIsImlhdCI6MTc3NTMzMzkyNiwiZXhwIjoxNzc1NDIwMzI2LCJjaWQiOiIwb2E5OWRzbWJuQXhsZXZGMzY5NiIsInVpZCI6IjAwdXoxejN4ZW96aUZSVml1Njk3Iiwic2NwIjpbIm9mZmxpbmVfYWNjZXNzIiwib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIl0sImF1dGhfdGltZSI6MTc3NTMzMzkyNCwibGFzdE5hbWUiOiJCZXJyYSIsInppU2Vzc2lvblR5cGUiOi0zLCJ6aUdyb3VwSWQiOjAsInppQ29tcGFueVByb2ZpbGVJZCI6IjUwMDA1OTk4NTciLCJ6aVBsYXRmb3JtcyI6WyJERVYgUE9SVEFMIiwiRE9aSSIsIkFETUlOIl0sInppQWRtaW5Sb2xlcyI6IkJBUUFBSUFBQUFBQUFBQUFBQVFRQUJBS0FBQkFBQUFBQUFBQUFBQUFBQUFBQUVBQUFBQUFBQUFRZ0NSQWtrZ0FBQUFBL3dNTSIsInppVXNlcm5hbWUiOiJqb3JkYW5AZGFuZS5pbnN1cmUiLCJmaXJzdE5hbWUiOiJKb3JkYW4iLCJ6aVJvbGVzIjoiSHF3NFRzODlnR1hVMEJ3QXdHWFpMUmdPd0FEQUlQOFRBQUJPUUFBQUFJQUFBT1FBQUFBQUFBQXdnQ1JBc2xrQWdBQUFBQUFCIiwiemlVdWlkIjoiMjg3YTMyMjgtODZjMi00Zjg5LTk5OTAtNWZkZWRmOGYxMDM2IiwiemlVc2VySWQiOjMzMjg3NTk0LCJzZkNvbnRhY3RJZCI6IjAwMzd5MDAwMDFvSGtuZ0FBQyIsInppSW5hY3Rpdml0eSI6NjA0ODAwLCJub0NvcGlsb3RXU0FjY2VzcyI6dHJ1ZSwiemlUZW5hbnRJZCI6MjE0NTE4MjIsImVtYWlsIjoiam9yZGFuQGRhbmUuaW5zdXJlIiwic2ZBY2NvdW50SWQiOiIwMDE3eTAwMDAxcFRpeFZBQVMiLCJ6aU1vbmdvVXNlcklkIjoiMzMyODc1OTQifQ.yIXW1Q2cGADweSYfpr0wrISNl91EN97uXztHBC-8bE-RY_fVVbtouwfSv4hp4RCQ_i3XS03HPCTx8EhIqqKCCJBxjOA-zdwogHo3eyo5WD0F45BGOUQUgBpfR1yPXhqcga-RNjS7U8VOwfp6oE6nYH8M4Qdyfdok1mti_8SOuvLNK16n57jtJxqLIxOAMDQv03ml40z6G_6-pkSXvp0rBe7WlL2aOwn1HM-g7wUfuglBRoXFbGoouQiDwBfxzjtJWfWt-R77rB1aZORo-X19ADRrKMz_VRjn6j9bI9B0PYvJhOyRBERvUuxE9FThm84fNxM9Be786NZnCPJC0ml4yA',
    domain: '.zoominfo.com', path: '/'
  });
  
  await context.addCookies(cookies);
  console.log(`Injected ${cookies.length} cookies`);
  
  const page = await context.newPage();
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  console.log('URL:', page.url());
  
  if (page.url().includes('login')) {
    console.log('❌ Redirected to login');
    await page.screenshot({ path: 'jordan.ai/zi_cookie_fail.png' });
  } else {
    console.log('✅ LOGGED IN!');
    await context.storageState({ path: 'jordan.ai/zi_storage.json' });
    await page.screenshot({ path: 'jordan.ai/zi_success.png' });
    const text = await page.textContent('body');
    console.log('Page (1500):', text.substring(0, 1500));
  }
  
  await browser.close();
}

main().catch(e => { console.error(e.message); process.exit(1); });
