import { createServiceClient } from "@/lib/supabase/service";
import {
  processInboxEmail,
  reprocessInboxEmail,
  type ProcessInboxResult,
} from "./process-inbox";

export type ReprocessScope = "unprocessed" | "all";

export type ReprocessImportedEmailsResult = {
  reset: number;
  processed: number;
  leadsFound: number;
  opportunitiesCreated: number;
  failed: number;
  results: ProcessInboxResult[];
};

const DEFAULT_BATCH_LIMIT = 25;

/** Unstick emails left in `processing` after a crashed server run. */
export async function resetStuckProcessingEmails(userId?: string): Promise<number> {
  const supabase = await createServiceClient();

  let query = supabase
    .from("inbox")
    .update({
      ai_processing_status: "pending",
      ai_processing_error: null,
    })
    .eq("ai_processing_status", "processing");

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/**
 * Re-run AI classification on imported emails without another Gmail sync.
 * - `unprocessed`: pending, failed, and stuck processing emails
 * - `all`: every imported email without a linked opportunity (full rerun)
 */
export async function reprocessImportedEmails(options?: {
  userId?: string;
  limit?: number;
  scope?: ReprocessScope;
}): Promise<ReprocessImportedEmailsResult> {
  const supabase = await createServiceClient();
  const limit = options?.limit ?? DEFAULT_BATCH_LIMIT;
  const scope = options?.scope ?? "unprocessed";

  const stuckReset = await resetStuckProcessingEmails(options?.userId);

  let reset = stuckReset;
  const results: ProcessInboxResult[] = [];
  let leadsFound = 0;
  let opportunitiesCreated = 0;
  let failed = 0;

  if (scope === "unprocessed") {
    let failedReset = supabase
      .from("inbox")
      .update({
        ai_processing_status: "pending",
        ai_processing_error: null,
      })
      .eq("ai_processing_status", "failed");

    if (options?.userId) {
      failedReset = failedReset.eq("user_id", options.userId);
    }

    const { data: failedRows } = await failedReset.select("id");
    reset += failedRows?.length ?? 0;

    let query = supabase
      .from("inbox")
      .select("id, ai_processing_status")
      .in("ai_processing_status", ["pending", "failed"])
      .order("imported_at", { ascending: true })
      .limit(limit);

    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }

    const { data: emails, error } = await query;
    if (error) throw error;

    for (const email of emails ?? []) {
      const result = await processInboxEmail(email.id);
      results.push(result);
      tallyResult(result, {
        leadsFound: (n) => {
          leadsFound += n;
        },
        opportunitiesCreated: (n) => {
          opportunitiesCreated += n;
        },
        failed: (n) => {
          failed += n;
        },
      });
    }
  } else {
    let query = supabase
      .from("inbox")
      .select("id")
      .is("opportunity_id", null)
      .order("imported_at", { ascending: true })
      .limit(limit);

    if (options?.userId) {
      query = query.eq("user_id", options.userId);
    }

    const { data: emails, error } = await query;
    if (error) throw error;
    reset += emails?.length ?? 0;

    for (const email of emails ?? []) {
      const result = await reprocessInboxEmail(email.id);
      results.push(result);
      tallyResult(result, {
        leadsFound: (n) => {
          leadsFound += n;
        },
        opportunitiesCreated: (n) => {
          opportunitiesCreated += n;
        },
        failed: (n) => {
          failed += n;
        },
      });
    }
  }

  return {
    reset,
    processed: results.length,
    leadsFound,
    opportunitiesCreated,
    failed,
    results,
  };
}

function tallyResult(
  result: ProcessInboxResult,
  counters: {
    leadsFound: (n: number) => void;
    opportunitiesCreated: (n: number) => void;
    failed: (n: number) => void;
  },
) {
  if (result.status === "failed") {
    counters.failed(1);
    return;
  }

  if (
    result.actionTaken === "potential_opportunity" ||
    result.actionTaken === "freelancer"
  ) {
    counters.leadsFound(1);
  }
}
