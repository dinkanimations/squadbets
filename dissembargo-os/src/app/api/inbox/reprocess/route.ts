import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { checkOpenAIHealth } from "@/lib/ai/health";
import { reprocessImportedEmails } from "@/lib/ai/reprocess-imported-emails";
import { getInboxSchemaHealth } from "@/lib/database/inbox-schema-health";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inboxSchema = await getInboxSchemaHealth();
  if (!inboxSchema.ready) {
    return NextResponse.json(
      {
        error:
          "Inbox database tables are not set up yet. Run the inbox migration SQL in Supabase first.",
      },
      { status: 503 },
    );
  }

  const health = await checkOpenAIHealth();
  if (health.status !== "ok") {
    return NextResponse.json(
      {
        error: health.message,
        errorCode: health.status,
        status: "error",
      },
      { status: health.status === "not_configured" ? 503 : 402 },
    );
  }

  let limit = 25;
  let scope: "unprocessed" | "all" = "unprocessed";

  try {
    const body = await request.json();
    if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 50) {
      limit = body.limit;
    }
    if (body?.scope === "all" || body?.scope === "unprocessed") {
      scope = body.scope;
    }
  } catch {
    // defaults
  }

  try {
    const result = await reprocessImportedEmails({
      userId: user.id,
      limit,
      scope,
    });

    return NextResponse.json({
      status: "success",
      ...result,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Reprocess failed";

    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
