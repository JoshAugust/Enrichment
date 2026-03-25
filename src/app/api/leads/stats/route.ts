import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { sql, isNotNull, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
  void request; // satisfy linter
  // Allow unauthenticated read access for frontend UI

  const db = getDb();

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

    const [
      totalResult,
      byStatusResult,
      byStateResult,
      verifiedResult,
      avgScoreResult,
      addedTodayResult,
      addedThisWeekResult,
      byIndustryResult,
      avgCompletenessResult,
      enrichedCountResult,
      unenrichedCountResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(leads),
      db
        .select({ status: leads.status, count: sql<number>`count(*)` })
        .from(leads)
        .groupBy(leads.status),
      db
        .select({ state: leads.state, count: sql<number>`count(*)` })
        .from(leads)
        .where(isNotNull(leads.state))
        .groupBy(leads.state)
        .orderBy(sql`count(*) DESC`)
        .limit(20),
      db
        .select({ verified: leads.verified, count: sql<number>`count(*)` })
        .from(leads)
        .groupBy(leads.verified),
      db
        .select({ avg: sql<number>`avg(${leads.quality_score})` })
        .from(leads)
        .where(isNotNull(leads.quality_score)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(gte(leads.created_at, startOfToday)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(gte(leads.created_at, startOfWeek)),
      // V2: industry breakdown
      db
        .select({ industry: leads.industry, count: sql<number>`count(*)` })
        .from(leads)
        .groupBy(leads.industry)
        .orderBy(sql`count(*) DESC`),
      // V2: avg enrichment completeness
      db
        .select({ avg: sql<number>`avg(${leads.enrichment_completeness})` })
        .from(leads),
      // V2: enriched count (has last_enriched_at)
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(isNotNull(leads.last_enriched_at)),
      // V2: unenriched count
      db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(sql`last_enriched_at is null`),
    ]);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusResult) byStatus[row.status ?? "Unknown"] = Number(row.count);

    const byState: Record<string, number> = {};
    for (const row of byStateResult) byState[row.state ?? "Unknown"] = Number(row.count);

    let verified = 0;
    let unverified = 0;
    for (const row of verifiedResult) {
      if (row.verified) verified = Number(row.count);
      else unverified = Number(row.count);
    }

    const byIndustry: Record<string, number> = {};
    for (const row of byIndustryResult) {
      byIndustry[row.industry ?? "unknown"] = Number(row.count);
    }

    return NextResponse.json({
      total: Number(totalResult[0]?.count ?? 0),
      byStatus,
      byState,
      byIndustry,
      verified,
      unverified,
      avgScore: avgScoreResult[0]?.avg ? Math.round(Number(avgScoreResult[0].avg)) : null,
      addedToday: Number(addedTodayResult[0]?.count ?? 0),
      addedThisWeek: Number(addedThisWeekResult[0]?.count ?? 0),
      enrichment: {
        avgCompleteness: avgCompletenessResult[0]?.avg
          ? Math.round(Number(avgCompletenessResult[0].avg))
          : 0,
        enrichedCount: Number(enrichedCountResult[0]?.count ?? 0),
        unenrichedCount: Number(unenrichedCountResult[0]?.count ?? 0),
      },
    });
  } catch (error) {
    console.error("GET /api/leads/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
