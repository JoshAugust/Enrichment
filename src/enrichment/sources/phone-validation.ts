/**
 * Phone validation source — uses Abstract API (phonevalidation.abstractapi.com).
 * Validates phone numbers found on leads/contacts.
 * Rate limit: 1 request per second (conservative).
 * Requires env var: ABSTRACT_API_KEY
 */

import { EnrichmentResult } from "./web-search";

const TIMEOUT_MS = 10000;
const API_BASE = "https://phonevalidation.abstractapi.com/v1/";

// ── Conservative rate limiter (1 req/sec, serialized) ─────────────────────────

class PhoneRateLimiter {
  private queue: Array<() => void> = [];
  private running = false;

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.drain();
    });
  }

  private async drain() {
    if (this.running) return;
    this.running = true;
    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
      if (this.queue.length > 0) {
        // 1 second between requests
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    this.running = false;
  }
}

const phoneRateLimiter = new PhoneRateLimiter();

// ── Abstract API types ────────────────────────────────────────────────────────

interface AbstractPhoneResponse {
  phone: string;
  valid: boolean;
  format: {
    international: string;
    local: string;
  };
  country: {
    code: string;
    name: string;
    prefix: string;
  };
  location: string;
  type: string; // "mobile" | "landline" | "voip" | "unknown"
  carrier: string;
}

// ── Validation helper ─────────────────────────────────────────────────────────

async function validatePhone(phone: string, apiKey: string): Promise<AbstractPhoneResponse | null> {
  return phoneRateLimiter.run(async () => {
    const encoded = encodeURIComponent(phone);
    const url = `${API_BASE}?api_key=${apiKey}&phone=${encoded}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      clearTimeout(timer);

      if (res.status === 429) {
        console.warn("[phone-validation] Rate limited by Abstract API");
        return null;
      }
      if (!res.ok) {
        throw new Error(`Abstract API HTTP ${res.status}`);
      }

      const data = (await res.json()) as AbstractPhoneResponse;
      return data;
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  });
}

function normalizePhone(raw: string): string {
  // Strip whitespace/dashes/parens but keep leading +
  return raw.replace(/[\s\-().]/g, "").trim();
}

function isPlausiblePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

// ── Collect phone numbers from entity data ────────────────────────────────────

function collectPhones(existingData: Record<string, unknown>): string[] {
  const candidates: string[] = [];

  // Direct phone fields
  const phoneFields = ["phone", "phone_hq", "mobile_phone", "phone_direct", "phone_number"];
  for (const field of phoneFields) {
    const val = existingData[field];
    if (typeof val === "string" && val.trim()) {
      candidates.push(val.trim());
    }
  }

  // Phones found by other enrichment sources (web-search / company-website store these)
  const phones = existingData.phones;
  if (Array.isArray(phones)) {
    for (const p of phones) {
      if (typeof p === "string" && p.trim()) candidates.push(p.trim());
    }
  }

  // Deduplicate by normalized form
  const seen = new Set<string>();
  return candidates.filter((p) => {
    const norm = normalizePhone(p);
    if (!isPlausiblePhone(norm)) return false;
    if (seen.has(norm)) return false;
    seen.add(norm);
    return true;
  });
}

// ── Main enrich function ──────────────────────────────────────────────────────

export async function enrich(
  entityType: string,
  entityId: string,
  existingData: Record<string, unknown>
): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    source: "phone-validation",
    entityType,
    entityId,
    success: false,
    data: {},
    enrichedAt: new Date().toISOString(),
  };

  const apiKey = process.env.ABSTRACT_API_KEY;
  if (!apiKey) {
    result.success = false;
    result.error = "ABSTRACT_API_KEY environment variable not set";
    return result;
  }

  const phones = collectPhones(existingData);
  if (phones.length === 0) {
    result.success = true;
    result.skipped = true;
    result.data = { message: "No phone numbers found to validate" };
    return result;
  }

  // Cap at 3 numbers to stay conservative on rate limits
  const toValidate = phones.slice(0, 3);
  console.log(`[phone-validation] Validating ${toValidate.length} phone number(s) for ${entityType} ${entityId}`);

  const validationResults: Array<{
    original: string;
    valid: boolean;
    format_international: string | null;
    format_local: string | null;
    country: string | null;
    country_code: string | null;
    carrier: string | null;
    type: string | null;
    location: string | null;
  }> = [];

  let firstValidPhone: string | null = null;
  let firstValidData: AbstractPhoneResponse | null = null;

  for (const phone of toValidate) {
    try {
      const response = await validatePhone(phone, apiKey);
      if (!response) {
        // Rate limit hit — skip remaining
        console.warn("[phone-validation] Stopping early due to rate limit");
        break;
      }

      const entry = {
        original: phone,
        valid: response.valid,
        format_international: response.format?.international ?? null,
        format_local: response.format?.local ?? null,
        country: response.country?.name ?? null,
        country_code: response.country?.code ?? null,
        carrier: response.carrier || null,
        type: response.type || null,
        location: response.location || null,
      };

      validationResults.push(entry);

      if (response.valid && !firstValidPhone) {
        firstValidPhone = response.format?.international || phone;
        firstValidData = response;
      }

      console.log(
        `[phone-validation] ${phone} → valid=${response.valid}, type=${response.type || "unknown"}, country=${response.country?.name || "unknown"}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[phone-validation] Failed to validate ${phone}: ${msg}`);
      validationResults.push({
        original: phone,
        valid: false,
        format_international: null,
        format_local: null,
        country: null,
        country_code: null,
        carrier: null,
        type: null,
        location: null,
      });
    }
  }

  result.data = {
    phone_validations: validationResults,
    valid_phone_count: validationResults.filter((v) => v.valid).length,
    total_validated: validationResults.length,
  };

  // Surface the best valid phone number into a canonical field
  if (firstValidPhone) {
    result.data.validated_phone = firstValidPhone;
    if (firstValidData) {
      result.data.phone_country = firstValidData.country?.name ?? null;
      result.data.phone_type = firstValidData.type ?? null;
      result.data.phone_carrier = firstValidData.carrier ?? null;
    }
  }

  // Map to DB field names so pipeline.ts can persist them
  if (entityType === "lead" && firstValidPhone && !existingData.phone_hq) {
    result.data.phone_hq = firstValidPhone;
  }
  if (entityType === "contact" && firstValidPhone && !existingData.phone) {
    result.data.phone = firstValidPhone;
  }

  result.success = true;
  return result;
}
