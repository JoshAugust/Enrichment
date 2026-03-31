/**
 * sources/social-signals.js — Social media presence & activity enrichment
 *
 * Discovers and measures social footprint via web search:
 *   - Twitter/X accounts and recent activity
 *   - GitHub repos (for tech companies)
 *   - Podcast appearances by executives
 *   - Conference speaker appearances
 *   - Blog posts by executives
 *
 * Exports: { enrich(entityType, entityId, existingData) → Promise<enrichmentResult> }
 */

'use strict';

const fetch = require('node-fetch');
const { ddgSearch } = require('./web-search');
const { rateLimiter } = require('./rate-limiter');

const TIMEOUT_MS = 12000;
const USER_AGENT = 'Mozilla/5.0 (compatible; CorgiResearchBot/1.0)';

// ── Twitter/X detection ───────────────────────────────────────────────────────

const TWITTER_URL_RE = /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,50})(?:[^A-Za-z0-9_]|$)/i;

function extractTwitterHandle(results) {
  for (const { url, snippet, title } of results) {
    // Direct URL match
    if (TWITTER_URL_RE.test(url)) {
      const m = TWITTER_URL_RE.exec(url);
      if (m && !['search', 'hashtag', 'home', 'explore', 'notifications', 'messages', 'i'].includes(m[1].toLowerCase())) {
        return { handle: `@${m[1]}`, url: `https://x.com/${m[1]}` };
      }
    }
    // URL in snippet or title
    const combined = `${title} ${snippet}`;
    const m2 = TWITTER_URL_RE.exec(combined);
    if (m2 && !['search', 'hashtag', 'home', 'explore'].includes(m2[1].toLowerCase())) {
      return { handle: `@${m2[1]}`, url: `https://x.com/${m2[1]}` };
    }
  }
  return null;
}

// ── GitHub detection ──────────────────────────────────────────────────────────

const GITHUB_URL_RE = /github\.com\/([A-Za-z0-9\-_]+)(?:\/([A-Za-z0-9\-_.]+))?/i;

function extractGitHubInfo(results) {
  const orgs = new Set();
  const repos = [];

  for (const { url } of results) {
    const m = GITHUB_URL_RE.exec(url);
    if (m && m[1] && !['search', 'topics', 'trending', 'explore', 'marketplace'].includes(m[1].toLowerCase())) {
      orgs.add(m[1]);
      if (m[2] && m[2] !== 'tree' && m[2] !== 'blob') {
        repos.push(`${m[1]}/${m[2]}`);
      }
    }
  }

  return {
    orgs: [...orgs].slice(0, 3),
    repos: [...new Set(repos)].slice(0, 5),
  };
}

// ── GitHub API for star/repo counts (public, no auth needed) ──────────────────

async function fetchGitHubOrgStats(orgName) {
  return rateLimiter.run(async () => {
    const url = `https://api.github.com/orgs/${encodeURIComponent(orgName)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        name: data.name,
        description: data.description,
        publicRepos: data.public_repos,
        followers: data.followers,
        blog: data.blog,
        location: data.location,
      };
    } catch {
      clearTimeout(timer);
      return null;
    }
  });
}

// ── Podcast appearance detection ──────────────────────────────────────────────

const PODCAST_PATTERNS = [
  /podcast/i, /episode/i, /interview/i, /listen/i, /spotify\.com/i,
  /apple\.com\/podcasts/i, /buzzsprout/i, /anchor\.fm/i, /podbean/i,
];

function detectPodcastAppearances(results, name) {
  return results
    .filter(r => PODCAST_PATTERNS.some(re => re.test(`${r.title} ${r.snippet} ${r.url}`)))
    .map(r => ({
      title: r.title.slice(0, 120),
      url: r.url,
      snippet: r.snippet.slice(0, 150),
    }))
    .slice(0, 5);
}

// ── Conference speaker detection ──────────────────────────────────────────────

const CONFERENCE_KEYWORDS = [
  'conference', 'summit', 'forum', 'keynote', 'speaker', 'panel', 'talk',
  'supercomputing', 'ai summit', 'fintech', 'davos', 'sxsw',
];

function detectConferenceAppearances(results) {
  return results
    .filter(r => CONFERENCE_KEYWORDS.some(k => `${r.title} ${r.snippet}`.toLowerCase().includes(k)))
    .map(r => ({
      title: r.title.slice(0, 120),
      url: r.url,
      snippet: r.snippet.slice(0, 150),
    }))
    .slice(0, 5);
}

// ── Main enrich function ──────────────────────────────────────────────────────

/**
 * @param {'company'|'contact'} entityType
 * @param {string} entityId
 * @param {object} existingData
 * @returns {Promise<enrichmentResult>}
 */
async function enrich(entityType, entityId, existingData) {
  const result = {
    source: 'social-signals',
    entityType,
    entityId,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  try {
    if (entityType === 'company') {
      const { name, github_url, twitter_url } = existingData;
      if (!name) throw new Error('Company name required');

      console.log(`[social-signals] Enriching company: ${name}`);

      // Twitter search
      const twitterResults = await ddgSearch(`site:twitter.com OR site:x.com "${name}"`);
      const twitterInfo = extractTwitterHandle(twitterResults);

      // GitHub search
      const githubResults = await ddgSearch(`site:github.com "${name}"`);
      const githubInfo = extractGitHubInfo(githubResults);

      // Fetch GitHub org stats if we found one
      let githubStats = null;
      if (githubInfo.orgs.length > 0 && !github_url) {
        githubStats = await fetchGitHubOrgStats(githubInfo.orgs[0]);
      }

      // Podcast & conference search
      const mediaResults = await ddgSearch(`"${name}" podcast OR conference OR speaker OR keynote 2024 2025`);
      const podcasts = detectPodcastAppearances(mediaResults, name);
      const conferences = detectConferenceAppearances(mediaResults);

      result.data = {
        twitterInfo,
        githubInfo,
        githubStats,
        podcastAppearances: podcasts,
        conferenceAppearances: conferences,
      };

      // Map to top-level DB fields
      if (twitterInfo && !twitter_url) {
        result.data.twitter_url = twitterInfo.url;
      }
      if (githubInfo.orgs.length > 0 && !github_url) {
        result.data.github_url = `https://github.com/${githubInfo.orgs[0]}`;
      }

      console.log(`[social-signals] ${name}: Twitter=${!!twitterInfo}, GitHub=${githubInfo.orgs.length} orgs, ${podcasts.length} podcasts, ${conferences.length} conferences`);

    } else if (entityType === 'contact') {
      const { name, company_name, github_url, twitter_url } = existingData;
      if (!name) throw new Error('Contact name required');

      console.log(`[social-signals] Enriching contact: ${name}`);

      // Search for this person's social presence
      const query = company_name
        ? `"${name}" "${company_name}" (twitter OR github OR podcast OR conference OR speaker)`
        : `"${name}" (twitter OR github OR podcast OR conference OR speaker)`;

      const results = await ddgSearch(query);

      const twitterInfo = extractTwitterHandle(results);
      const githubInfo = extractGitHubInfo(results);
      const podcasts = detectPodcastAppearances(results, name);
      const conferences = detectConferenceAppearances(results);

      result.data = {
        twitterInfo,
        githubInfo,
        podcastAppearances: podcasts,
        conferenceAppearances: conferences,
      };

      if (twitterInfo && !twitter_url) result.data.twitter_url = twitterInfo.url;
      if (githubInfo.orgs.length > 0 && !github_url) {
        result.data.github_url = `https://github.com/${githubInfo.orgs[0]}`;
      }

      console.log(`[social-signals] Contact ${name}: Twitter=${!!twitterInfo}, GitHub orgs=${githubInfo.orgs.length}`);
    }

    result.success = true;
  } catch (err) {
    console.error(`[social-signals] Failed for ${entityType} ${entityId}:`, err.message);
    result.success = false;
    result.error = err.message;
  }

  return result;
}

module.exports = { enrich };
