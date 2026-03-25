import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

type SheetRow = {
  assignment_id: string;
  called: boolean;
  called_at: string | null;
  assignment_notes: string | null;
  assigned_date: string;
  id: string;
  company_name: string;
  phone_hq: string | null;
  mobile_phone: string | null;
  email: string | null;
  state: string | null;
  city: string | null;
  industry: string | null;
  quality_score: number | null;
  enrichment_completeness: number | null;
  status: string | null;
  contact_name: string | null;
  contact_title: string | null;
  website: string | null;
  domain: string | null;
  total_raised: string | null;
  last_funding_round: string | null;
  agent_notes: string | null;
  enrichment_data: Record<string, unknown> | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const db = getDb();

    const result = await db.execute(sql.raw(`
      SELECT
        a.id AS assignment_id,
        a.called,
        a.called_at,
        a.notes AS assignment_notes,
        a.assigned_date,
        l.id,
        l.company_name,
        l.phone_hq,
        l.mobile_phone,
        l.email,
        l.state,
        l.city,
        l.industry,
        l.quality_score,
        l.enrichment_completeness,
        l.status,
        l.contact_name,
        l.contact_title,
        l.website,
        l.domain,
        l.total_raised,
        l.last_funding_round,
        l.agent_notes,
        l.enrichment_data
      FROM call_sheet_assignments a
      JOIN leads l ON a.lead_id = l.id
      WHERE a.assigned_to = '${userId.replace(/'/g, "''")}'
        AND a.assigned_date = '${date}'
      ORDER BY
        a.called ASC,
        l.quality_score DESC NULLS LAST,
        l.enrichment_completeness DESC NULLS LAST
    `));

    const rows = Array.from(result) as unknown as SheetRow[];
    const total = rows.length;
    const called = rows.filter((r) => r.called).length;
    const remaining = total - called;

    return NextResponse.json({
      leads: rows,
      stats: { total, called, remaining },
      date,
    });
  } catch (err) {
    console.error("GET /api/call-sheets/my-sheet error:", err);
    return NextResponse.json({ error: "Failed to fetch call sheet" }, { status: 500 });
  }
}
