import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/db";
import { leads, exports } from "@/db/schema";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { and, eq, gte, lte } from "drizzle-orm";

const ExportFiltersSchema = z.object({
  status: z.string().optional(),
  state: z.string().optional(),
  verified: z.boolean().optional(),
  minScore: z.number().optional(),
  maxScore: z.number().optional(),
}).optional();

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function POST(request: NextRequest) {
  if (!validateApiKey(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ExportFiltersSchema.safeParse(body);
    const filters = parsed.success ? parsed.data : undefined;
    const conditions = [];

    if (filters?.status) conditions.push(eq(leads.status, filters.status));
    if (filters?.state) conditions.push(eq(leads.state, filters.state));
    if (filters?.verified !== undefined) conditions.push(eq(leads.verified, filters.verified));
    if (filters?.minScore !== undefined) conditions.push(gte(leads.quality_score, filters.minScore));
    if (filters?.maxScore !== undefined) conditions.push(lte(leads.quality_score, filters.maxScore));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db.select().from(leads).where(where).orderBy(leads.company_name);

    const headers = [
      "id", "status", "company_name", "website", "domain", "contact_name",
      "contact_title", "mobile_phone", "phone_hq", "email", "city", "state",
      "states_served", "specialization", "is_independent", "carrier_partners",
      "estimated_size", "quality_score", "source", "source_url", "discovered_by",
      "verified", "verified_at", "verified_by", "human_notes", "last_touch_date",
      "agent_notes", "created_at", "updated_at",
    ];

    const csvRows = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map((h) => escapeCSV(row[h as keyof typeof row]));
      csvRows.push(values.join(","));
    }

    const csv = csvRows.join("\n");
    const filename = `corgi-leads-${new Date().toISOString().split("T")[0]}.csv`;

    await db.insert(exports).values({
      export_type: "csv",
      row_count: rows.length,
      destination: filename,
    });

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("POST /api/export/csv error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
