import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/auth";
import { enrichContact } from "@/enrichment/pipeline";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!validateApiKey(request)) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const result = await enrichContact(id);
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("not found")) return NextResponse.json({ error: msg }, { status: 404 });
    console.error("POST /api/enrichment/contact/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
