/**
 * sources/website-vibe-scorer.js — Company website "vibe score" enrichment
 *
 * Detects whether a company website looks "vibe coded" — built by a small/scrappy
 * startup using website builders, has template aesthetics, thin content, and
 * early-stage energy. Score: 0-100.
 *
 * Signals:
 *   +25: Website builder platform detected (Webflow, Framer, Squarespace, Wix, Carrd)
 *   +10: .io or .ai domain TLD
 *   +10: Sitemap has < 10 pages (or no sitemap found)
 *   +10: No pricing page OR only demo/contact CTAs
 *   +15: Hero text is vague/aspirational (Claude API or keyword heuristic)
 *   +10: < 5 blog posts
 *   +10: No careers page or < 3 job listings
 *   +10: Few customer logos / "Trusted by" with < 5 logos
 *
 * No external dependencies — native fetch, AbortController, regex-based HTML parsing.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TIMEOUT_MS = 10000;
const USER_AGENT = 'Mozilla/5.0 (compatible; ResearchBot/1.0)';

// ── Helpers ────────────────────────────────────────────────────────────────

function extractDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

function normalizeUrl(website) {
  if (!website) return null;
  if (website.startsWith('http://') || website.startsWith('https://')) return website;
  return `https://${website}`;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml,*/*', ...options.headers },
      redirect: 'follow',
      ...options,
    });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// ── Signal detectors ───────────────────────────────────────────────────────

/**
 * Detect website builder platform from HTML.
 * Returns { fired: bool, detail: string }
 */
function detectWebsiteBuilder(html) {
  const checks = [
    { pattern: /data-wf-site|data-wf-page|\.webflow\.com/i, name: 'Webflow' },
    { pattern: /framer\.com\/m\/|__framer__|data-framer-|framer\.website/i, name: 'Framer' },
    { pattern: /sqsp\.com|sqsp-|squarespace\.com|static1\.squarespace/i, name: 'Squarespace' },
    { pattern: /wix\.com\/|wixsite\.com|wixstatic\.com|_wixCIDX|yoavgilaigmailcom/i, name: 'Wix' },
    { pattern: /carrd\.co|data-page-id.*carrd/i, name: 'Carrd' },
  ];
  for (const { pattern, name } of checks) {
    if (pattern.test(html)) return { fired: true, detail: name };
  }
  return { fired: false, detail: null };
}

/**
 * Count URLs in a sitemap XML string.
 */
function countSitemapUrls(xml) {
  const matches = xml.match(/<loc>/gi) || [];
  return matches.length;
}

/**
 * Detect pricing page link in HTML.
 */
function hasPricingPage(html) {
  return /href=["'][^"']*\/pricing[/"']/i.test(html) ||
         /href=["'][^"']*\/plans[/"']/i.test(html) ||
         /href=["'][^"']*\/pricing\b/i.test(html);
}

/**
 * Check if CTAs are demo-only (no pricing link, only demo/contact/waitlist).
 */
function isDemoOnlyCta(html) {
  if (hasPricingPage(html)) return false;
  // Check for demo/contact/waitlist CTA patterns
  const demoCtas = /book\s+a\s+demo|schedule\s+a\s+demo|request\s+a\s+demo|contact\s+us|join\s+waitlist|get\s+early\s+access/i;
  return demoCtas.test(html);
}

/**
 * Extract hero text (first prominent heading/paragraph near top of body).
 */
function extractHeroText(html) {
  // Try to find text in first h1, h2, hero section
  const heroPatterns = [
    /<h1[^>]*>([\s\S]*?)<\/h1>/i,
    /<section[^>]*(?:hero|banner|jumbotron)[^>]*>[\s\S]*?<h[12][^>]*>([\s\S]*?)<\/h[12]>/i,
    /<div[^>]*(?:hero|banner|headline)[^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const pat of heroPatterns) {
    const m = html.match(pat);
    if (m) {
      // Strip HTML tags
      return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
    }
  }
  return null;
}

/**
 * Heuristic: does hero text sound vague/aspirational?
 */
function isVagueHeroHeuristic(text) {
  if (!text) return false;
  const vagueKeywords = [
    /revolutioni[sz]e/i, /reimagine/i, /supercharge/i, /the\s+future\s+of/i,
    /made\s+easy/i, /simplified/i, /effortless/i, /transform/i, /empower/i,
    /unlock\s+the/i, /next[\s-]gen/i, /cutting[\s-]edge/i, /game[\s-]changer/i,
    /disrupt/i, /innovate/i, /leverage\s+ai/i, /harness\s+the\s+power/i,
    /end[\s-]to[\s-]end/i, /seamlessly/i, /world[\s-]class/i, /best[\s-]in[\s-]class/i,
    /10x\s+your/i, /scale\s+your/i, /powered\s+by\s+ai/i, /ai[\s-]powered/i,
    /built\s+for\s+the\s+future/i, /modern\s+way\s+to/i, /rethink/i,
  ];
  return vagueKeywords.filter(kw => kw.test(text)).length >= 1;
}

/**
 * Attempt Claude API classification of hero text.
 * Falls back to heuristic if API unavailable.
 */
async function classifyHeroText(heroText) {
  if (!heroText) return { fired: false, detail: 'no hero text', usedAI: false };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 10,
          messages: [{
            role: 'user',
            content: `Is this startup headline vague or aspirational (uses generic buzzwords, unclear value prop)? Answer "yes" or "no" only.\n\n"${heroText}"`,
          }],
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const answer = data.content?.[0]?.text?.trim().toLowerCase() || '';
        if (answer.startsWith('yes')) return { fired: true, detail: 'vague hero text (AI)', usedAI: true };
        if (answer.startsWith('no')) return { fired: false, detail: 'clear hero text (AI)', usedAI: true };
      }
    } catch (err) {
      // Fall through to heuristic
      console.warn('[website-vibe-scorer] Claude API failed, using heuristic:', err.message);
    }
  }

  // Heuristic fallback
  const vague = isVagueHeroHeuristic(heroText);
  return { fired: vague, detail: vague ? 'vague hero text (heuristic)' : 'clear hero text (heuristic)', usedAI: false };
}

/**
 * Count blog posts: check /blog page and sitemap for blog-like URLs.
 */
function countBlogPosts(html, sitemapXml) {
  let count = 0;

  // From sitemap
  if (sitemapXml) {
    const blogUrls = sitemapXml.match(/<loc>[^<]*\/blog\/[^<]+<\/loc>/gi) || [];
    const postUrls = sitemapXml.match(/<loc>[^<]*\/post\/[^<]+<\/loc>/gi) || [];
    const articleUrls = sitemapXml.match(/<loc>[^<]*\/articles?\/[^<]+<\/loc>/gi) || [];
    count = blogUrls.length + postUrls.length + articleUrls.length;
  }

  // From HTML — look for blog post links
  if (count === 0) {
    const articleLinks = html.match(/href=["'][^"']*\/(blog|post|articles?|news)\/[^"']+["']/gi) || [];
    count = new Set(articleLinks).size;
  }

  return count;
}

/**
 * Detect careers page and count job listings.
 */
function detectCareers(html) {
  const hasCareersPage = /href=["'][^"']*\/(careers|jobs|hiring|join-us|work-with-us)[/"']/i.test(html);
  // Count job listing entries — look for repeated job title patterns
  const jobEntries = html.match(/(?:open\s+role|job\s+opening|position|<li[^>]*>[\s\S]*?(?:engineer|designer|manager|developer|analyst)[^<]*<\/li>)/gi) || [];
  return { hasCareersPage, jobCount: jobEntries.length };
}

/**
 * Count customer logos in "Trusted by" / logos section.
 */
function countCustomerLogos(html) {
  // Look for trusted-by / customers / logos section
  const trustedSection = html.match(/(?:trusted\s+by|our\s+customers|customers|used\s+by|logos?)[^<]*[\s\S]{0,2000}/i);
  if (!trustedSection) return 0;

  const section = trustedSection[0];
  // Count img tags in the section (logo images)
  const imgCount = (section.match(/<img[^>]+>/gi) || []).length;
  // Count SVG usage elements (inline logo SVGs)
  const svgCount = (section.match(/<use[^>]+>/gi) || []).length;
  return imgCount + svgCount;
}

// ── Main enrich function ───────────────────────────────────────────────────

export async function enrich(entityType, entityId, existingData) {
  if (entityType !== 'company') {
    return { success: true, skipped: true, data: {}, reason: 'website-vibe-scorer only enriches companies' };
  }

  const website = existingData.website || existingData.url;
  if (!website) {
    return {
      success: true,
      skipped: true,
      data: { vibe_score: 0, vibe_signals: [] },
      reason: 'No website URL available',
    };
  }

  const baseUrl = normalizeUrl(website);
  const domain = extractDomain(website);

  let html = '';
  let sitemapXml = null;
  const signals = [];
  let score = 0;

  // ── Fetch homepage ──────────────────────────────────────────────────────
  try {
    const res = await fetchWithTimeout(baseUrl);
    if (res.ok) {
      html = await res.text();
    } else {
      console.warn(`[website-vibe-scorer] Homepage returned ${res.status} for ${domain}`);
    }
  } catch (err) {
    console.warn(`[website-vibe-scorer] Failed to fetch homepage for ${domain}: ${err.message}`);
  }

  // ── Fetch sitemap ───────────────────────────────────────────────────────
  try {
    const sitemapRes = await fetchWithTimeout(`${baseUrl.replace(/\/$/, '')}/sitemap.xml`);
    if (sitemapRes.ok && sitemapRes.headers.get('content-type')?.includes('xml')) {
      sitemapXml = await sitemapRes.text();
    }
  } catch {
    // Sitemap not found — that itself is a signal
  }

  // ── Signal 1: Website builder (+25) ────────────────────────────────────
  if (html) {
    const builder = detectWebsiteBuilder(html);
    if (builder.fired) {
      score += 25;
      signals.push(`website_builder:${builder.detail}`);
    }
  }

  // ── Signal 2: .io or .ai domain (+10) ──────────────────────────────────
  if (domain && /\.(io|ai)$/.test(domain)) {
    score += 10;
    signals.push('io_or_ai_domain');
  }

  // ── Signal 3: Sitemap < 10 pages or no sitemap (+10) ───────────────────
  if (!sitemapXml) {
    score += 10;
    signals.push('no_sitemap');
  } else {
    const urlCount = countSitemapUrls(sitemapXml);
    if (urlCount < 10) {
      score += 10;
      signals.push(`small_sitemap:${urlCount}_pages`);
    }
  }

  // ── Signal 4: No pricing page or demo-only CTA (+10) ───────────────────
  if (html && (!hasPricingPage(html) || isDemoOnlyCta(html))) {
    score += 10;
    signals.push('no_pricing_or_demo_only_cta');
  }

  // ── Signal 5: Vague/aspirational hero text (+15) ────────────────────────
  if (html) {
    const heroText = extractHeroText(html);
    const heroResult = await classifyHeroText(heroText);
    if (heroResult.fired) {
      score += 15;
      signals.push(`vague_hero_text${heroResult.usedAI ? ':ai' : ':heuristic'}`);
    }
  }

  // ── Signal 6: < 5 blog posts (+10) ─────────────────────────────────────
  if (html) {
    const blogCount = countBlogPosts(html, sitemapXml);
    if (blogCount < 5) {
      score += 10;
      signals.push(`few_blog_posts:${blogCount}`);
    }
  }

  // ── Signal 7: No careers page or < 3 job listings (+10) ─────────────────
  if (html) {
    const { hasCareersPage, jobCount } = detectCareers(html);
    if (!hasCareersPage || jobCount < 3) {
      score += 10;
      signals.push(hasCareersPage ? `few_job_listings:${jobCount}` : 'no_careers_page');
    }
  }

  // ── Signal 8: Few customer logos (+10) ─────────────────────────────────
  if (html) {
    const logoCount = countCustomerLogos(html);
    if (logoCount < 5) {
      score += 10;
      signals.push(`few_customer_logos:${logoCount}`);
    }
  }

  // Cap at 100
  score = Math.min(100, score);

  console.log(`[website-vibe-scorer] 🎯 ${existingData.name || domain}: vibe_score=${score}, signals=[${signals.join(', ')}]`);

  return {
    success: true,
    data: {
      vibe_score: score,
      vibe_signals: signals,
    },
    source: 'website-vibe-scorer',
    fieldsFound: 2,
  };
}

export default { enrich };
