/**
 * Wappalyzer-style tech stack detection — pure HTML analysis, no API key needed.
 * Fetches the company website and detects technologies from scripts, meta tags,
 * HTTP headers, and known URL/attribute patterns.
 */

import * as cheerio from "cheerio";
import { rateLimiter } from "./rate-limiter";
import { EnrichmentResult } from "./web-search";

const TIMEOUT_MS = 15000;
const USER_AGENT = "Mozilla/5.0 (compatible; CorgiResearchBot/1.0)";

// ── Tech signatures ───────────────────────────────────────────────────────────

interface TechSignature {
  name: string;
  category: string;
  scripts?: RegExp[];
  meta?: Array<{ name: RegExp; content?: RegExp }>;
  html?: RegExp[];
  headers?: Array<{ name: string; value?: RegExp }>;
  cookies?: RegExp[];
  urls?: RegExp[];
  attributes?: RegExp[];
}

const TECH_SIGNATURES: TechSignature[] = [
  // ── CMS ──────────────────────────────────────────────────────────────────
  {
    name: "WordPress",
    category: "CMS",
    scripts: [/wp-content\//, /wp-includes\//],
    html: [/wp-content\/uploads/, /\/wp-json\//],
    meta: [{ name: /generator/i, content: /wordpress/i }],
    headers: [{ name: "x-powered-by", value: /wordpress/i }],
    cookies: [/wordpress_/],
  },
  {
    name: "Drupal",
    category: "CMS",
    scripts: [/\/sites\/default\/files\//, /drupal\.js/],
    html: [/Drupal\.settings/, /drupal-settings-json/],
    meta: [{ name: /generator/i, content: /drupal/i }],
    headers: [{ name: "x-generator", value: /drupal/i }],
  },
  {
    name: "Squarespace",
    category: "CMS",
    scripts: [/squarespace\.com\//, /static\.squarespace\.com\//],
    html: [/squarespace-cdn/, /squarespacecdn/, /data-squarespace/],
    meta: [{ name: /generator/i, content: /squarespace/i }],
  },
  {
    name: "Wix",
    category: "CMS",
    scripts: [/static\.parastorage\.com\//, /wix\.com\//, /wixstatic\.com\//],
    html: [/wixsite\.com/, /X-Wix-Meta-Site-Id/],
    meta: [{ name: /generator/i, content: /wix/i }],
  },
  {
    name: "Webflow",
    category: "CMS",
    scripts: [/webflow\.js/, /assets\.website-files\.com\//],
    html: [/data-wf-page/, /data-wf-site/],
    meta: [{ name: /generator/i, content: /webflow/i }],
  },
  {
    name: "Ghost",
    category: "CMS",
    meta: [{ name: /generator/i, content: /ghost/i }],
    html: [/ghost\/content\//],
    headers: [{ name: "x-ghost-cache-status" }],
  },

  // ── Analytics ─────────────────────────────────────────────────────────────
  {
    name: "Google Analytics",
    category: "Analytics",
    scripts: [/google-analytics\.com\/analytics\.js/, /googletagmanager\.com\/gtag/, /UA-\d{4,}/],
    html: [/gtag\('config'/, /ga\('create'/, /_gaq\.push/],
  },
  {
    name: "Google Tag Manager",
    category: "Analytics",
    scripts: [/googletagmanager\.com\/gtm\.js/],
    html: [/GTM-[A-Z0-9]+/],
  },
  {
    name: "Mixpanel",
    category: "Analytics",
    scripts: [/cdn\.mxpnl\.com\/libs\/mixpanel/, /mixpanel\.com\/libs\//],
    html: [/mixpanel\.init\(/, /mixpanel\.track\(/],
  },
  {
    name: "Segment",
    category: "Analytics",
    scripts: [/cdn\.segment\.com\/analytics\.js/, /cdn\.segment\.io\/analytics\.js/],
    html: [/analytics\.load\(/, /analytics\.page\(/],
  },
  {
    name: "Hotjar",
    category: "Analytics",
    scripts: [/static\.hotjar\.com\/c\/hotjar/, /script\.hotjar\.com\//],
    html: [/hj\('trigger'/, /hjid:/, /hjsv:/],
  },
  {
    name: "Amplitude",
    category: "Analytics",
    scripts: [/cdn\.amplitude\.com\/libs\/amplitude/],
    html: [/amplitude\.getInstance\(\)/, /amplitude\.init\(/],
  },
  {
    name: "Heap",
    category: "Analytics",
    scripts: [/cdn\.heapanalytics\.com\/js\/heap/],
    html: [/heap\.load\(/, /heap\.identify\(/],
  },
  {
    name: "Plausible",
    category: "Analytics",
    scripts: [/plausible\.io\/js\/plausible/],
    attributes: [/data-domain/],
  },

  // ── CRM ───────────────────────────────────────────────────────────────────
  {
    name: "HubSpot",
    category: "CRM",
    scripts: [/js\.hs-scripts\.com\//, /js\.hubspot\.com\//, /forms\.hsforms\.com\//],
    html: [/hubspot\.com\//, /hs-analytics-script/, /hbspt\.forms/],
    cookies: [/__hstc/, /hubspotutk/],
  },
  {
    name: "Salesforce",
    category: "CRM",
    scripts: [/salesforce\.com\//, /pardot\.com\//, /force\.com\//],
    html: [/salesforce-live-agent/, /liveagent\.init/],
  },
  {
    name: "Intercom",
    category: "CRM",
    scripts: [/widget\.intercom\.io\//, /js\.intercomcdn\.com\//],
    html: [/intercomSettings/, /Intercom\('boot'/],
  },
  {
    name: "Drift",
    category: "CRM",
    scripts: [/js\.driftt\.com\//, /drift\.com\/include/],
    html: [/drift\.load\(/, /driftt\.com\//],
  },
  {
    name: "Zendesk",
    category: "CRM",
    scripts: [/static\.zdassets\.com\/ekr\//, /v2\.zopim\.com\//],
    html: [/zE\(/, /zopim\(/],
    cookies: [/__zlcmid/],
  },
  {
    name: "Freshdesk",
    category: "CRM",
    scripts: [/freshdesk\.com\/js\/freshwidget/, /wchat\.freshchat\.com\//],
  },

  // ── E-commerce ────────────────────────────────────────────────────────────
  {
    name: "Shopify",
    category: "E-commerce",
    scripts: [/cdn\.shopify\.com\/s\/files\//, /Shopify\.shop/, /\/shopify\/shopify\.js/],
    html: [/Shopify\.theme/, /shopify-payment-button/, /cdn\.shopifycloud\.com\//],
    meta: [{ name: /generator/i, content: /shopify/i }],
  },
  {
    name: "WooCommerce",
    category: "E-commerce",
    scripts: [/\/wp-content\/plugins\/woocommerce\//],
    html: [/woocommerce/, /is-woocommerce/],
    cookies: [/woocommerce_/],
  },
  {
    name: "Magento",
    category: "E-commerce",
    scripts: [/mage\/require/, /requirejs\/require\.js/],
    html: [/Mage\.Cookies/, /Magento_/, /X-Magento/],
    meta: [{ name: /generator/i, content: /magento/i }],
  },
  {
    name: "BigCommerce",
    category: "E-commerce",
    scripts: [/cdn\d*\.bigcommerce\.com\//],
    html: [/BigCommerce\.createCatalog/],
    meta: [{ name: /generator/i, content: /bigcommerce/i }],
  },
  {
    name: "Stripe",
    category: "E-commerce",
    scripts: [/js\.stripe\.com\/v\d/],
    html: [/Stripe\(/, /data-stripe/],
  },

  // ── Hosting / Infrastructure ──────────────────────────────────────────────
  {
    name: "Cloudflare",
    category: "Hosting",
    headers: [{ name: "cf-ray" }, { name: "server", value: /cloudflare/i }],
    cookies: [/__cfduid/, /__cf_bm/],
    scripts: [/cdnjs\.cloudflare\.com\//],
  },
  {
    name: "Vercel",
    category: "Hosting",
    headers: [{ name: "x-vercel-id" }, { name: "server", value: /vercel/i }],
    html: [/__NEXT_DATA__/],
    scripts: [/_vercel\/insights\/script/],
  },
  {
    name: "Netlify",
    category: "Hosting",
    headers: [{ name: "x-nf-request-id" }, { name: "server", value: /netlify/i }],
    html: [/netlify-identity-widget/],
  },
  {
    name: "AWS (Amplify/CloudFront)",
    category: "Hosting",
    headers: [
      { name: "x-amz-cf-id" },
      { name: "x-amz-request-id" },
      { name: "via", value: /cloudfront/i },
    ],
  },
  {
    name: "GitHub Pages",
    category: "Hosting",
    headers: [{ name: "server", value: /github\.com/i }],
  },
  {
    name: "Fastly",
    category: "Hosting",
    headers: [{ name: "x-fastly-request-id" }, { name: "fastly-restarts" }],
  },

  // ── Marketing ─────────────────────────────────────────────────────────────
  {
    name: "Mailchimp",
    category: "Marketing",
    scripts: [/chimpstatic\.com\/mcjs-connected\/js\/users\//, /list-manage\.com\//],
    html: [/mc\.us\d+\.list-manage\.com\//, /mailchimp/i],
  },
  {
    name: "Marketo",
    category: "Marketing",
    scripts: [/munchkin\.marketo\.net\/munchkin/, /app\.marketo\.com\//],
    html: [/Munchkin\.init\(/],
  },
  {
    name: "Pardot",
    category: "Marketing",
    scripts: [/pi\.pardot\.com\/pd\.js/, /cdn\.pardot\.com\//],
    html: [/piTracker\(/, /pd\.js/],
  },
  {
    name: "ActiveCampaign",
    category: "Marketing",
    scripts: [/trackcmp\.net\//, /harvestapp\.com\//],
    html: [/vgo\(/],
  },
  {
    name: "Klaviyo",
    category: "Marketing",
    scripts: [/static\.klaviyo\.com\/onsite\/js\/klaviyo\.js/],
    html: [/klaviyo\.identify\(/],
  },

  // ── Frameworks ────────────────────────────────────────────────────────────
  {
    name: "React",
    category: "Framework",
    scripts: [/react(?:\.min)?\.js/, /react-dom(?:\.min)?\.js/],
    html: [/__reactFiber/, /__reactInternalInstance/, /data-reactroot/],
    attributes: [/__react/],
  },
  {
    name: "Next.js",
    category: "Framework",
    scripts: [/_next\/static\//, /\/_next\/chunks\//],
    html: [/__NEXT_DATA__/, /next\/head/],
  },
  {
    name: "Angular",
    category: "Framework",
    scripts: [/angular(?:\.min)?\.js/, /ng\.bootstrap/],
    html: [/ng-version/, /ng-app/, /data-ng-app/],
    attributes: [/ng-version/],
  },
  {
    name: "Vue.js",
    category: "Framework",
    scripts: [/vue(?:\.min)?\.js/, /vue\.runtime\.min\.js/],
    html: [/__vue__/, /data-v-[a-f0-9]+/],
  },
  {
    name: "Nuxt.js",
    category: "Framework",
    scripts: [/_nuxt\//, /nuxt\.js/],
    html: [/__NUXT__/],
  },
  {
    name: "Gatsby",
    category: "Framework",
    scripts: [/gatsby-runtime/, /gatsby-chunk-/],
    html: [/___gatsby/, /gatsby-focus-wrapper/],
  },
  {
    name: "Svelte",
    category: "Framework",
    scripts: [/svelte(?:\.min)?\.js/],
    attributes: [/svelte-[a-z0-9]+/],
  },
  {
    name: "jQuery",
    category: "Framework",
    scripts: [/jquery(?:-\d[\d.]+)?(?:\.min)?\.js/],
    html: [/jQuery\.fn\.jquery/],
  },
  {
    name: "Bootstrap",
    category: "Framework",
    scripts: [/bootstrap(?:\.min)?\.js/, /bootstrap(?:\.min)?\.css/],
    html: [/class="container(?:-fluid)?/, /class="row(?:\s|")/],
  },
  {
    name: "Tailwind CSS",
    category: "Framework",
    html: [/class="[^"]*(?:flex|grid|bg-|text-|p-\d|m-\d|w-\d|h-\d)[^"]*"/],
  },
];

// ── HTTP fetch with header capture ────────────────────────────────────────────

interface FetchResult {
  html: string;
  headers: Record<string, string>;
  cookies: string[];
  finalUrl: string;
}

async function fetchWithHeaders(url: string): Promise<FetchResult> {
  return rateLimiter.run(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
        redirect: "follow",
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const headers: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const setCookies = headers["set-cookie"] ? headers["set-cookie"].split(",") : [];

      const html = await res.text();
      return { html, headers, cookies: setCookies, finalUrl: res.url || url };
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

// ── Detection engine ──────────────────────────────────────────────────────────

interface DetectedTech {
  name: string;
  category: string;
  confidence: number;
}

function detectTechnologies(
  html: string,
  headers: Record<string, string>,
  cookies: string[]
): DetectedTech[] {
  const $ = cheerio.load(html);
  const detected: Map<string, DetectedTech> = new Map();

  // Collect all script srcs
  const scriptSrcs: string[] = [];
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    if (src) scriptSrcs.push(src);
  });

  // Collect inline script text
  const inlineScripts: string[] = [];
  $("script:not([src])").each((_, el) => {
    const text = $(el).html() || "";
    if (text) inlineScripts.push(text);
  });

  // Collect all HTML as text for pattern matching
  const fullHtml = html;

  // Collect link tags (stylesheets, etc.)
  const linkHrefs: string[] = [];
  $("link[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    if (href) linkHrefs.push(href);
  });

  // All resource URLs
  const allUrls = [...scriptSrcs, ...linkHrefs];

  function addDetection(sig: TechSignature, confidence: number) {
    const existing = detected.get(sig.name);
    if (!existing || existing.confidence < confidence) {
      detected.set(sig.name, { name: sig.name, category: sig.category, confidence });
    }
  }

  for (const sig of TECH_SIGNATURES) {
    // Script URL patterns
    if (sig.scripts) {
      for (const pattern of sig.scripts) {
        if (allUrls.some((u) => pattern.test(u))) {
          addDetection(sig, 90);
          break;
        }
        // Also check inline script content
        if (inlineScripts.some((s) => pattern.test(s))) {
          addDetection(sig, 75);
          break;
        }
      }
    }

    // HTML content patterns
    if (sig.html) {
      for (const pattern of sig.html) {
        if (pattern.test(fullHtml)) {
          addDetection(sig, 80);
          break;
        }
      }
    }

    // Meta tags
    if (sig.meta) {
      for (const metaSig of sig.meta) {
        $("meta").each((_, el) => {
          const nameAttr = ($(el).attr("name") || $(el).attr("property") || "").toLowerCase();
          const content = ($(el).attr("content") || "").toLowerCase();
          if (metaSig.name.test(nameAttr)) {
            if (!metaSig.content || metaSig.content.test(content)) {
              addDetection(sig, 95);
            }
          }
        });
      }
    }

    // HTTP headers
    if (sig.headers) {
      for (const headerSig of sig.headers) {
        const headerVal = headers[headerSig.name.toLowerCase()];
        if (headerVal !== undefined) {
          if (!headerSig.value || headerSig.value.test(headerVal)) {
            addDetection(sig, 92);
          }
        }
      }
    }

    // Cookies
    if (sig.cookies) {
      const cookieStr = cookies.join("; ") + (headers["cookie"] || "");
      for (const pattern of sig.cookies) {
        if (pattern.test(cookieStr)) {
          addDetection(sig, 85);
          break;
        }
      }
    }

    // Element attributes (scan raw HTML for attribute patterns)
    if (sig.attributes) {
      for (const pattern of sig.attributes) {
        if (pattern.test(fullHtml)) {
          addDetection(sig, 70);
          break;
        }
      }
    }
  }

  return [...detected.values()].sort((a, b) => b.confidence - a.confidence);
}

function summarizeByCategory(detected: DetectedTech[]): Record<string, string[]> {
  const summary: Record<string, string[]> = {};
  for (const tech of detected) {
    if (!summary[tech.category]) summary[tech.category] = [];
    summary[tech.category].push(tech.name);
  }
  return summary;
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "wappalyzer",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  if (entityType !== "lead") {
    result.success = true;
    result.skipped = true;
    return result;
  }

  const website = existingData.website as string | undefined;
  if (!website) {
    result.success = false;
    result.error = "No website URL available for tech stack detection";
    return result;
  }

  const baseUrl = website.startsWith("http") ? website : `https://${website}`;

  try {
    console.log(`[wappalyzer] Detecting tech stack for ${baseUrl}`);

    const { html, headers, cookies } = await fetchWithHeaders(baseUrl);
    const detected = detectTechnologies(html, headers, cookies);

    const techStack = detected.map((t) => ({
      name: t.name,
      category: t.category,
      confidence: t.confidence,
    }));

    const techCategories = summarizeByCategory(detected);

    result.data = {
      tech_stack: techStack,
      tech_categories: techCategories,
      tech_count: techStack.length,
      categories_detected: Object.keys(techCategories),
    };

    result.success = true;

    console.log(
      `[wappalyzer] Detected ${techStack.length} technologies for ${baseUrl}: ` +
        Object.entries(techCategories)
          .map(([cat, techs]) => `${cat}(${techs.join(", ")})`)
          .join("; ")
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[wappalyzer] Failed for ${baseUrl}:`, msg);
    result.success = false;
    result.error = msg;
  }

  return result;
}
