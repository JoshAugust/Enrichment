import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { getPipelineStatus } from "@/enrichment/pipeline";

export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  try {
    const status = await getPipelineStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("GET /api/enrichment/status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
