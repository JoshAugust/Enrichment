import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { isNotNull, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const domains = await db
      .select({ domain: leads.domain })
      .from(leads)
      .where(isNotNull(leads.domain))
      .orderBy(sql`${leads.domain} ASC`);

    return NextResponse.json(domains.map((d) => d.domain));
  } catch (error) {
    console.error("GET /api/leads/domains error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
