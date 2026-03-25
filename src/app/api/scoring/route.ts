import { NextRequest, NextResponse } from "next/server";
import { scoreLead, scoreAllLeads } from "@/enrichment/scorer";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.leadId) {
      const result = await scoreLead(body.leadId);
      return NextResponse.json(result);
    }

    if (body.scoreAll) {
      const result = await scoreAllLeads(body.industry);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Provide leadId or scoreAll:true" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
