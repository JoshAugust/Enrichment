import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { extractDomain, normalizeName } from "@/lib/dedup";
import { and, eq } from "drizzle-orm";

const DedupCheckSchema = z.object({
  domain: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json();
    const parsed = DedupCheckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { domain: rawDomain, company_name, state } = parsed.data;

    if (rawDomain) {
      const domain = extractDomain(rawDomain);
      if (domain) {
        const existing = await db
          .select({ id: leads.id })
          .from(leads)
          .where(eq(leads.domain, domain))
          .limit(1);

        if (existing.length > 0) {
          return NextResponse.json({ exists: true, match_type: "domain", existing_id: existing[0].id });
        }
      }
    }

    if (company_name && state) {
      const name_normalized = normalizeName(company_name);
      if (name_normalized) {
        const existing = await db
          .select({ id: leads.id })
          .from(leads)
          .where(and(eq(leads.name_normalized, name_normalized), eq(leads.state, state)))
          .limit(1);

        if (existing.length > 0) {
          return NextResponse.json({ exists: true, match_type: "name", existing_id: existing[0].id });
        }
      }
    }

    return NextResponse.json({ exists: false, match_type: null, existing_id: null });
  } catch (error) {
    console.error("POST /api/leads/dedup-check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
