import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { rescanFailedInboxEmails } from "@/lib/ai/process-inbox";
import { checkOpenAIHealth, formatAiProcessingError } from "@/lib/ai/health";
import { SYNC_RESCAN_FAILED_LIMIT } from "@/lib/gmail/constants";
import { getInboxSchemaHealth } from "@/lib/database/inbox-schema-health";

export const maxDuration = 60;

export async function POST() {
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

  try {
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

    const results = await rescanFailedInboxEmails({
      userId: user.id,
      limit: SYNC_RESCAN_FAILED_LIMIT,
    });

    const leadsFound = results.filter(
      (result) =>
        result.actionTaken === "potential_opportunity" ||
        result.actionTaken === "client_communication",
    ).length;
    const failed = results.filter((result) => result.status === "failed").length;
    const firstFailure = results.find((result) => result.error)?.error ?? null;
    const failureInfo = firstFailure
      ? formatAiProcessingError(firstFailure)
      : null;

    return NextResponse.json({
      processed: results.length,
      leadsFound,
      failed,
      errorCode: failureInfo?.code ?? null,
      error: failureInfo?.userMessage ?? null,
      status: "success",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Mailbox scan failed";

    return NextResponse.json({ error: message, status: "error" }, { status: 500 });
  }
}
