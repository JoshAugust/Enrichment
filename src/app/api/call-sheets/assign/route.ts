import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";

const API_KEY = process.env.API_KEY ?? "corgi-enrichment-2026";

interface AssignFilters {
  industry?: string;
  state?: string;
  minScore?: number;
  hasPhone?: boolean;
  status?: string;
}

interface AssignBody {
  userIds: string[];
  count?: number;
  date?: string;
  filters?: AssignFilters;
}

function buildWhereConditions(filters: AssignFilters, date: string): string[] {
  const conditions: string[] = [];

  // Always require phone for cold calling
  conditions.push(`(phone_hq IS NOT NULL AND phone_hq != '' OR mobile_phone IS NOT NULL AND mobile_phone != '')`);

  if (filters.industry) conditions.push(`industry = '${filters.industry.replace(/'/g, "''")}'`);
  if (filters.state) conditions.push(`state = '${filters.state.replace(/'/g, "''")}'`);
  if (filters.minScore !== undefined && filters.minScore > 0) conditions.push(`quality_score >= ${filters.minScore}`);
  if (filters.status) conditions.push(`status = '${filters.status.replace(/'/g, "''")}'`);

  // Exclude already assigned for this date
  conditions.push(`id NOT IN (SELECT lead_id FROM call_sheet_assignments WHERE assigned_date = '${date}')`);

  return conditions;
}

export async function GET(req: NextRequest) {
  // Preview: how many leads match the given filters?
  const { searchParams } = new URL(req.url);
  const filters: AssignFilters = {
    industry: searchParams.get("industry") || undefined,
    state: searchParams.get("state") || undefined,
    minScore: searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined,
    hasPhone: searchParams.get("hasPhone") === "true",
    status: searchParams.get("status") || undefined,
  };
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const db = getDb();
    const conditions = buildWhereConditions(filters, date);
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await db.execute(sql.raw(`SELECT COUNT(*)::int AS count FROM leads ${whereClause}`));
    const rows = Array.from(countResult) as unknown as { count: number }[];
    const count = rows[0]?.count ?? 0;

    return NextResponse.json({ available: count });
  } catch (err) {
    console.error("GET /api/call-sheets/assign error:", err);
    return NextResponse.json({ error: "Failed to count leads" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: AssignBody = await req.json();
    const {
      userIds,
      count = 600,
      date = new Date().toISOString().split("T")[0],
      filters = {},
    } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "userIds array is required" }, { status: 400 });
    }

    const db = getDb();

    // Build filter conditions
    const conditions = buildWhereConditions(filters, date);
    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const totalNeeded = count * userIds.length;

    const leadsResult = await db.execute(sql.raw(
      `SELECT id FROM leads ${whereClause} ORDER BY enrichment_completeness DESC NULLS LAST, quality_score DESC NULLS LAST LIMIT ${totalNeeded}`
    ));
    const leadRows = Array.from(leadsResult) as unknown as { id: string }[];
    const leadIds = leadRows.map((r) => r.id);

    if (leadIds.length === 0) {
      return NextResponse.json({ assigned: 0, perUser: [], message: "No leads matched the criteria" });
    }

    // Validate userIds
    const userIdList = userIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(", ");
    const usersResult = await db.execute(sql.raw(
      `SELECT id, name FROM call_sheet_users WHERE id IN (${userIdList}) AND active = true`
    ));
    const userRows = Array.from(usersResult) as unknown as { id: string; name: string }[];
    const usersMap = new Map(userRows.map((u) => [u.id, u.name]));

    if (usersMap.size === 0) {
      return NextResponse.json({ error: "No valid active users found" }, { status: 400 });
    }

    const validUserIds = userIds.filter((id) => usersMap.has(id));

    // Round-robin assignment
    const assignments: Array<{ lead_id: string; user_id: string }> = [];
    for (let i = 0; i < leadIds.length; i++) {
      const userIdx = i % validUserIds.length;
      assignments.push({ lead_id: leadIds[i], user_id: validUserIds[userIdx] });
    }

    // Batch insert
    const valuesSql = assignments
      .map((a) => `('${a.lead_id}', '${a.user_id}', '${date}')`)
      .join(", ");

    await db.execute(sql.raw(
      `INSERT INTO call_sheet_assignments (lead_id, assigned_to, assigned_date) VALUES ${valuesSql} ON CONFLICT (lead_id, assigned_date) DO NOTHING`
    ));

    // Build perUser summary
    const perUserCounts = new Map<string, number>();
    for (const a of assignments) {
      perUserCounts.set(a.user_id, (perUserCounts.get(a.user_id) ?? 0) + 1);
    }

    const perUser = validUserIds.map((userId) => ({
      userId,
      name: usersMap.get(userId) ?? userId,
      count: perUserCounts.get(userId) ?? 0,
    }));

    return NextResponse.json({
      assigned: assignments.length,
      perUser,
    });
  } catch (err) {
    console.error("POST /api/call-sheets/assign error:", err);
    return NextResponse.json({ error: "Failed to assign leads" }, { status: 500 });
  }
}
