import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

type StatRow = {
  userId: string;
  name: string;
  total: number;
  called: number;
  remaining: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const db = getDb();

    const result = await db.execute(sql.raw(`
      SELECT
        u.id AS "userId",
        u.name,
        COUNT(a.id)::int AS total,
        COUNT(a.id) FILTER (WHERE a.called = true)::int AS called,
        COUNT(a.id) FILTER (WHERE a.called = false OR a.called IS NULL)::int AS remaining
      FROM call_sheet_users u
      LEFT JOIN call_sheet_assignments a ON a.assigned_to = u.id AND a.assigned_date = '${date}'
      WHERE u.active = true
      GROUP BY u.id, u.name
      ORDER BY u.role DESC, u.name ASC
    `));

    const stats = Array.from(result) as unknown as StatRow[];

    return NextResponse.json({ stats, date });
  } catch (err) {
    console.error("GET /api/call-sheets/stats error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
