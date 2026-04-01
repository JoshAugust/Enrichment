/**
 * sources/hubspot-dedup.js — HubSpot CRM duplicate detection
 *
 * Fuzzy-matches a company against HubSpot to detect if it already exists.
 * Searches by name and by domain, then normalizes for comparison.
 *
 * Config: /Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/hubspot/config.json
 *   or    HUBSPOT_TOKEN env var
 *
 * Returns:
 *   data.hubspot_duplicate  — bool
 *   data.hubspot_match_id   — HubSpot company ID if matched, null otherwise
 *   data.hubspot_match_name — Company name in HubSpot if matched, null otherwise
 *
 * No external dependencies — native fetch.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TIMEOUT_MS = 10000;
const HUBSPOT_BASE = 'https://api.hubapi.com';

// ── Config ─────────────────────────────────────────────────────────────────

const CONFIG_PATHS = [
  // Workspace-level config (primary)
  '/Users/corgi12/.eragon-joshua_augustine/joshua_augustine_workspace/.config/hubspot/config.json',
  resolve(__dirname, '..', '..', '.config', 'hubspot', 'config.json'),
  resolve(__dirname, '..', '.config', 'hubspot', 'config.json'),
];

let _token = null;

function loadToken() {
  if (_token) return _token;

  if (process.env.HUBSPOT_TOKEN) {
    _token = process.env.HUBSPOT_TOKEN;
    return _token;
  }

  for (const cfgPath of CONFIG_PATHS) {
    try {
      if (existsSync(cfgPath)) {
        const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
        _token = cfg.access_token || cfg.token || cfg.api_key;
        if (_token) return _token;
      }
    } catch {
      // Try next path
    }
  }

  console.warn('[hubspot-dedup] No HubSpot token found');
  return null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize a company name for fuzzy comparison.
 * Strips legal suffixes, punctuation, and extra whitespace.
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(inc|llc|corp|co\.|ltd|limited|incorporated|corporation|gmbh|plc|sa|sas|bv|ag)\b\.?/gi, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract root domain from a website URL.
 */
function extractDomain(website) {
  if (!website) return null;
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].toLowerCase();
  }
}

/**
 * POST to HubSpot CRM search endpoint with timeout.
 */
async function hsSearch(endpoint, body, token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${HUBSPOT_BASE}${endpoint}`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    clearTimeout(timer);

    if (res.status === 401) {
      throw new Error('HubSpot authentication failed — check token');
    }
    if (res.status === 429) {
      console.warn('[hubspot-dedup] Rate limited by HubSpot');
      return null;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HubSpot API error ${res.status}: ${text.slice(0, 200)}`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('HubSpot request timed out');
    throw err;
  }
}

/**
 * Search HubSpot companies by name.
 */
async function searchByName(companyName, token) {
  const body = {
    filterGroups: [{
      filters: [{
        propertyName: 'name',
        operator: 'CONTAINS_TOKEN',
        value: companyName.split(/\s+/)[0], // Use first word for broad match
      }],
    }],
    properties: ['name', 'domain', 'hs_object_id'],
    limit: 20,
  };

  try {
    return await hsSearch('/crm/v3/objects/companies/search', body, token);
  } catch (err) {
    console.warn(`[hubspot-dedup] Name search failed: ${err.message}`);
    return null;
  }
}

/**
 * Search HubSpot companies by domain.
 */
async function searchByDomain(domain, token) {
  const body = {
    filterGroups: [{
      filters: [{
        propertyName: 'domain',
        operator: 'EQ',
        value: domain,
      }],
    }],
    properties: ['name', 'domain', 'hs_object_id'],
    limit: 5,
  };

  try {
    return await hsSearch('/crm/v3/objects/companies/search', body, token);
  } catch (err) {
    console.warn(`[hubspot-dedup] Domain search failed: ${err.message}`);
    return null;
  }
}

// ── Main enrich function ───────────────────────────────────────────────────

export async function enrich(entityType, entityId, existingData) {
  if (entityType !== 'company') {
    return { success: true, skipped: true, data: {}, reason: 'hubspot-dedup only checks companies' };
  }

  const companyName = existingData.name;
  if (!companyName) {
    return { success: false, data: {}, error: 'No company name to deduplicate' };
  }

  const token = loadToken();
  if (!token) {
    return {
      success: false,
      skipped: true,
      data: {
        hubspot_duplicate: false,
        hubspot_match_id: null,
        hubspot_match_name: null,
      },
      error: 'No HubSpot token configured',
    };
  }

  const normalizedTarget = normalizeName(companyName);
  const website = existingData.website || existingData.url;
  const targetDomain = extractDomain(website);

  let matchId = null;
  let matchName = null;
  let isDuplicate = false;

  // ── Search by name ──────────────────────────────────────────────────────
  const nameResults = await searchByName(companyName, token);
  if (nameResults?.results?.length) {
    for (const result of nameResults.results) {
      const props = result.properties || {};
      const hsName = props.name || '';
      const hsDomain = props.domain || '';
      const hsId = result.id || props.hs_object_id;

      // Check normalized name match
      if (normalizeName(hsName) === normalizedTarget) {
        isDuplicate = true;
        matchId = hsId;
        matchName = hsName;
        break;
      }

      // Check domain match as fallback
      if (targetDomain && hsDomain) {
        const hsDomainClean = hsDomain.replace(/^www\./, '').toLowerCase();
        if (hsDomainClean === targetDomain) {
          isDuplicate = true;
          matchId = hsId;
          matchName = hsName;
          break;
        }
      }
    }
  }

  // ── Search by domain if not found by name ───────────────────────────────
  if (!isDuplicate && targetDomain) {
    const domainResults = await searchByDomain(targetDomain, token);
    if (domainResults?.results?.length) {
      const first = domainResults.results[0];
      const props = first.properties || {};
      isDuplicate = true;
      matchId = first.id || props.hs_object_id;
      matchName = props.name || null;
    }
  }

  if (isDuplicate) {
    console.log(`[hubspot-dedup] 🔁 Duplicate found: "${companyName}" → HS: "${matchName}" (id: ${matchId})`);
  } else {
    console.log(`[hubspot-dedup] ✅ No duplicate found for "${companyName}"`);
  }

  return {
    success: true,
    data: {
      hubspot_duplicate: isDuplicate,
      hubspot_match_id: matchId,
      hubspot_match_name: matchName,
    },
    source: 'hubspot-dedup',
    fieldsFound: isDuplicate ? 3 : 1,
  };
}

export default { enrich };
