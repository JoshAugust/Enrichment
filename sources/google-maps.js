/**
 * sources/google-maps.js — Native Google Maps Places API enrichment source
 *
 * Uses Google Maps Places API directly (10K free requests/month) to find:
 *   - Company phone numbers (main line)
 *   - Headquarters / office addresses
 *   - Website URL, business status, rating
 *
 * Replaces Orange Slice Google Maps wrapper (10 credits/result).
 * OS kept as fallback later in pipeline.
 *
 * API Key: .config/google-maps/config.json or GOOGLE_MAPS_API_KEY env
 * Dependencies: none (native fetch)
 */

import { resolve, dirname } from 'path';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Config ────────────────────────────────────────────────────────────────────

const CONFIG_PATHS = [
  resolve(__dirname, '..', '.config', 'google-maps', 'config.json'),
  resolve(__dirname, '..', '..', '.config', 'google-maps', 'config.json'),
];

let API_KEY = null;

function loadApiKey() {
  if (API_KEY) return API_KEY;
  try {
    for (const cfgPath of CONFIG_PATHS) {
      if (existsSync(cfgPath)) {
        const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
        API_KEY = cfg.api_key;
        return API_KEY;
      }
    }
    if (process.env.GOOGLE_MAPS_API_KEY) {
      API_KEY = process.env.GOOGLE_MAPS_API_KEY;
      return API_KEY;
    }
  } catch (err) {
    console.warn('[google-maps] Failed to load API key:', err.message);
  }
  return null;
}

const TIMEOUT_MS = 10000;

// ── Places Text Search ────────────────────────────────────────────────────────

export async function searchPlace(query) {
  const key = loadApiKey();
  if (!key) {
    console.warn('[google-maps] No API key configured — skipping');
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Google Maps HTTP ${res.status}`);

    const data = await res.json();
    if (data.status !== 'OK' || !data.results?.length) return null;

    return data.results[0];
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[google-maps] Text search failed for "${query}": ${err.message}`);
    return null;
  }
}

// ── Place Details ─────────────────────────────────────────────────────────────

export async function getPlaceDetails(placeId) {
  const key = loadApiKey();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const fields = [
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'formatted_address',
      'business_status',
      'rating',
      'user_ratings_total',
      'name',
      'types',
    ].join(',');

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${key}`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`Google Maps Details HTTP ${res.status}`);

    const data = await res.json();
    if (data.status !== 'OK' || !data.result) return null;

    return data.result;
  } catch (err) {
    clearTimeout(timer);
    console.warn(`[google-maps] Place details failed for "${placeId}": ${err.message}`);
    return null;
  }
}

// ── Enrichment interface ──────────────────────────────────────────────────────

export async function enrich(entityType, entityId, existingData) {
  if (entityType !== 'company') {
    return { success: true, skipped: true, data: {}, reason: 'google-maps only enriches companies' };
  }

  if (existingData.phone && existingData.phone.trim() !== '') {
    return { success: true, skipped: true, data: {}, reason: 'company already has phone' };
  }

  const key = loadApiKey();
  if (!key) {
    return { success: false, skipped: true, data: {}, error: 'No Google Maps API key configured' };
  }

  const companyName = existingData.name;
  if (!companyName) {
    return { success: false, data: {}, error: 'No company name' };
  }

  // Build search query with industry hint for better match accuracy
  let query = companyName;
  if (existingData.industry_segment) {
    query += ` ${existingData.industry_segment}`;
  } else if (existingData.type) {
    query += ` ${existingData.type}`;
  }
  if (!query.toLowerCase().match(/company|inc|corp|llc|ltd/)) {
    query += ' company';
  }

  console.log(`[google-maps] 🗺️  Searching: "${query}"`);

  // Step 1: Text search
  const place = await searchPlace(query);
  if (!place) {
    return { success: true, data: {}, reason: `No Google Maps results for "${companyName}"` };
  }

  // Step 2: Get place details (phone, address, etc.)
  const details = await getPlaceDetails(place.place_id);

  // Step 3: Build result
  const result = {
    phones: [],
    headquarters: null,
  };

  // Phone — the main prize
  if (details?.international_phone_number) {
    result.phones.push(details.international_phone_number);
  } else if (details?.formatted_phone_number) {
    result.phones.push(details.formatted_phone_number);
  }

  // Address
  if (details?.formatted_address || place.formatted_address) {
    result.headquarters = details?.formatted_address || place.formatted_address;
  }

  const phoneCount = result.phones.length;
  console.log(`[google-maps] ✅ ${companyName}: ${phoneCount} phone(s), address: ${result.headquarters ? 'yes' : 'no'}`);

  return {
    success: true,
    data: result,
    source: 'google-maps',
    fieldsFound: Object.values(result).filter(v => v !== null && !(Array.isArray(v) && v.length === 0)).length,
  };
}

// Default export for CJS-style pipeline require()
export default { enrich, searchPlace, getPlaceDetails };
