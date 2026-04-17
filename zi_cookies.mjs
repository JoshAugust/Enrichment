import { chromium } from 'playwright';

const RAW_COOKIES = `_pxvid=fcc36c58-3055-11f1-9092-c53e9dfaacf0; pxcts=fd97c104-3055-11f1-9e89-5177fb36fb8f; _fbp=fb.1.1775328131374.950214395184594358; OptanonAlertBoxClosed=2026-04-04T18:42:16.327Z; nonhttponlysstestcookie=value1; nonhttponlynsstestcookie=value2; doziUser=jordan%40dane.insure; oktaMachineId=a4a918e3-2cbb-1c71-03cb-cf5d7a238115; parseSessionToken=1; userId=33287594; userEmail=jordan%40dane.insure; email=jordan%40dane.insure; name=Jordan%20Berra; firstname=Jordan; userZoomCompanyId=21451822; analyticsId=33287594; ssoredirecturl=https%253A%252F%252Fadmin.zoominfo.com%252F%2523%252Fapi-and-webhooks%253FnavigationSource%253Dside_nav_menu_click; OptanonConsent=isGpcEnabled=0&datestamp=Sat+Apr+04+2026+21%3A18%3A41+GMT%2B0100+(British+Summer+Time)&version=202409.1.0&browserGpcFlag=0&isIABGlobal=false&hosts=&consentId=f968fcb4-d470-45cf-bf46-6bf7eff413ae&interactionCount=1&isAnonUser=1&landingPath=NotLandingPage&groups=C0002%3A0%2CC0001%3A1%2CC0004%3A0%2CC0003%3A0&intType=2&geolocation=GB%3BENG&AwaitingReconsent=false; ziid=6TJepUmO2fQ02f1OF-3pbY4LYQZm9TxPnKGxrdJMBEqgDimFGLArO1iZmAnjrRXVvpq_iYKh3tNHRwXuL4X6kA; zisession=6TJepUmO2fQ02f1OF-3pbY4LYQZm9TxPnKGxrdJMBEqgDimFGLArO1iZmAnjrRXVvpq_iYKh3tNKTo2nT78bfg3SGGWHjsOYlsYp7vmf-7cxTtMfD-2XNKbersyAvwk0; ziaccesstoken=eyJraWQiOiJKdThxUW1tTUx1SG9QSEFVQlJnUmhFOE9sMVVubmRRN2pveDFNYy1uVlFJIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULk5HdEJickVCQmhtR182bTVOUF9iOFBydVpGalo4WXVNTVB4dnFacEphWW8ub2FyM3YxNmg1NE1yanZIdlg2OTciLCJpc3MiOiJodHRwczovL29rdGEtbG9naW4uem9vbWluZm8uY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsInN1YiI6ImpvcmRhbkBkYW5lLmluc3VyZSIsImlhdCI6MTc3NTMzMzkyNiwiZXhwIjoxNzc1NDIwMzI2LCJjaWQiOiIwb2E5OWRzbWJuQXhsZXZGMzY5NiIsInVpZCI6IjAwdXoxejN4ZW96aUZSVml1Njk3Iiwic2NwIjpbIm9mZmxpbmVfYWNjZXNzIiwib3BlbmlkIiwicHJvZmlsZSIsImVtYWlsIl0sImF1dGhfdGltZSI6MTc3NTMzMzkyNCwibGFzdE5hbWUiOiJCZXJyYSIsInppU2Vzc2lvblR5cGUiOi0zLCJ6aUdyb3VwSWQiOjAsInppQ29tcGFueVByb2ZpbGVJZCI6IjUwMDA1OTk4NTciLCJ6aVBsYXRmb3JtcyI6WyJERVYgUE9SVEFMIiwiRE9aSSIsIkFETUlOIl0sInppQWRtaW5Sb2xlcyI6IkJBUUFBSUFBQUFBQUFBQUFBQVFRQUJBS0FBQkFBQUFBQUFBQUFBQUFBQUFBQUVBQUFBQUFBQUFRZ0NSQWtrZ0FBQUFBL3dNTSIsInppVXNlcm5hbWUiOiJqb3JkYW5AZGFuZS5pbnN1cmUiLCJmaXJzdE5hbWUiOiJKb3JkYW4iLCJ6aVJvbGVzIjoiSHF3NFRzODlnR1hVMEJ3QXdHWFpMUmdPd0FEQUlQOFRBQUJPUUFBQUFJQUFBT1FBQUFBQUFBQXdnQ1JBc2xrQWdBQUFBQUFCIiwiemlVdWlkIjoiMjg3YTMyMjgtODZjMi00Zjg5LTk5OTAtNWZkZWRmOGYxMDM2IiwiemlVc2VySWQiOjMzMjg3NTk0LCJzZkNvbnRhY3RJZCI6IjAwMzd5MDAwMDFvSGtuZ0FBQyIsInppSW5hY3Rpdml0eSI6NjA0ODAwLCJub0NvcGlsb3RXU0FjY2VzcyI6dHJ1ZSwiemlUZW5hbnRJZCI6MjE0NTE4MjIsImVtYWlsIjoiam9yZGFuQGRhbmUuaW5zdXJlIiwic2ZBY2NvdW50SWQiOiIwMDE3eTAwMDAxcFRpeFZBQVMiLCJ6aU1vbmdvVXNlcklkIjoiMzMyODc1OTQifQ.yIXW1Q2cGADweSYfpr0wrISNl91EN97uXztHBC-8bE-RY_fVVbtouwfSv4hp4RCQ_i3XS03HPCTx8EhIqqKCCJBxjOA-zdwogHo3eyo5WD0F45BGOUQUgBpfR1yPXhqcga-RNjS7U8VOwfp6oE6nYH8M4Qdyfdok1mti_8SOuvLNK16n57jtJxqLIxOAMDQv03ml40z6G_6-pkSXvp0rBe7WlL2aOwn1HM-g7wUfuglBRoXFbGoouQiDwBfxzjtJWfWt-R77rB1aZORo-X19ADRrKMz_VRjn6j9bI9B0PYvJhOyRBERvUuxE9FThm84fNxM9Be786NZnCPJC0ml4yA; zitokencachebust=1775420326; _mkto_trk=id:237-LUZ-493&token:_mch-zoominfo.com-36d19041a2f876b8e15a51fd2eb00e1; _biz_uid=73f3ed6254bc4374c785251be6eb447a; sa-user-id=s%253A0-be28da94-8815-5b93-7b11-9e6dce3a9f63.dY2oPDL3VqYcpGMHJ1j7g89uKAnwlVvFRLYzd4xyUMA; sa-user-id-v2=s%253AvijalIgVW5N7EZ5tzjqfY9TdtVE.XsiaeOzF7hP9Nz5ACNd1J%252Bxedcpubss2EBmAOrtiRXg; sa-user-id-v3=s%253AAQAKINs2xFwAHqZIPlT5J6Lwen4dKFZvwouqEEWzHR4ZIeVpEMABGAQgueTFzgYwAToEkxnLiEIEgblz_w.nO%252Ft%252FkXEdDxB2EqOX5OgzA4WZMYG6CvUAp6paZdK5y4; _biz_flagsA=%7B%22Version%22%3A1%2C%22Mkto%22%3A%221%22%2C%22ViewThrough%22%3A%221%22%2C%22XDomain%22%3A%221%22%7D; ziw-side-nav-expanded=true; AMP_b497e086f6=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIwZjljYjBjYy01NjYzLTQyZGItOTFmYi1kMjA4Y2U5MTI5YzIlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIlMjIlMkMlMjJzZXNzaW9uSWQlMjIlM0ExNzc1MzMzOTQ1OTAwJTJDJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJsYXN0RXZlbnRUaW1lJTIyJTNBMTc3NTMzMzk0NzA1NyUyQyUyMmxhc3RFdmVudElkJTIyJTNBMyUyQyUyMnBhZ2VDb3VudGVyJTIyJTNBMCU3RA==; _ga_PP03JV8JP3=GS2.1.s1775333947$o1$g0$t1775333947$j60$l0$h0; _ga=GA1.1.670223861.1775333948;__stripe_mid=0e7eb9a3-d255-475d-987c-85cd81e037cb42f8ef; __stripe_sid=13c30695-68a7-423d-bbdc-d6a7ce34fabc0aabe0; AMP_14ff67f4fc=JTdCJTIyZGV2aWNlSWQlMjIlM0ElMjIyN2M4Y2IyMC05OGJlLTQwMDItYmY5MC0wNzEwZTNkYmVmNWIlMjIlMkMlMjJ1c2VySWQlMjIlM0ElMjIzMzI4NzU5NCUyMiUyQyUyMnNlc3Npb25JZCUyMiUzQTE3NzUzMzM5Mjk0NzYlMkMlMjJvcHRPdXQlMjIlM0FmYWxzZSUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNzc1MzMzOTQ4MDM1JTJDJTIybGFzdEV2ZW50SWQlMjIlM0EzOCUyQyUyMnBhZ2VDb3VudGVyJTIyJTNBMCU3RA==; _biz_nA=3; _biz_pendingA=%5B%5D; _dd_s=rum=0&expire=1775334928977`;

// Parse cookie string into Playwright format
function parseCookies(cookieStr, domains) {
  return cookieStr.split('; ').map(pair => {
    const eqIdx = pair.indexOf('=');
    const name = pair.substring(0, eqIdx);
    const value = pair.substring(eqIdx + 1);
    return domains.map(domain => ({
      name, value, domain, path: '/', 
      httpOnly: false, secure: true, sameSite: 'None'
    }));
  }).flat();
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true, args: ['--no-sandbox', '--disable-gpu']
  });
  
  const context = await browser.newContext();
  
  // Inject cookies for all ZoomInfo domains
  const cookies = parseCookies(RAW_COOKIES, ['.zoominfo.com', 'app.zoominfo.com', 'login.zoominfo.com', 'admin.zoominfo.com']);
  await context.addCookies(cookies);
  console.log(`Injected ${cookies.length} cookies`);
  
  const page = await context.newPage();
  
  // Go straight to the app
  await page.goto('https://app.zoominfo.com/#/apps/home-page', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  
  const url = page.url();
  console.log('URL:', url);
  
  if (url.includes('login')) {
    console.log('❌ Cookies did not work - redirected to login');
    await page.screenshot({ path: 'jordan.ai/zi_cookie_fail.png' });
    await browser.close();
    return;
  }
  
  console.log('✅ LOGGED IN via cookies!');
  
  // Save storage state for future use
  await context.storageState({ path: 'jordan.ai/zi_storage.json' });
  console.log('Session saved');
  
  // Test search - search for StatusGator by navigating
  await page.screenshot({ path: 'jordan.ai/zi_home_ok.png' });
  
  // Get page content
  const text = await page.textContent('body');
  console.log('Page text (1500):', text.substring(0, 1500));
  
  await browser.close();
  console.log('Done!');
}

main().catch(e => { console.error(e.message); process.exit(1); });
