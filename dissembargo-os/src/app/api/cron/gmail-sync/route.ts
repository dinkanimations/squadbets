import { NextResponse } from "next/server";
import { syncAllGmailConnections } from "@/lib/gmail/sync";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results = await syncAllGmailConnections();

    return NextResponse.json({
      syncedAt: new Date().toISOString(),
      connections: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
