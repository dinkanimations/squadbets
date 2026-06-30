import { createServiceClient } from "@/lib/supabase/service";
import { checkOpenAIHealth } from "@/lib/ai/health";
import { formatAiProcessingError } from "@/lib/ai/health";

export type PipelineDiagnostics = {
  gmailImported: number;
  waitingForProcessing: number;
  processing: number;
  classified: number;
  ignored: number;
  needsReview: number;
  failed: number;
  stagedLeads: number;
  freelancersCreated: number;
  acceptedLeads: number;
  opportunitiesCreated: number;
  companiesCreated: number;
  contactsCreated: number;
  clientsCreated: number;
  failureReasons: Record<string, number>;
  openaiStatus: string;
  openaiMessage: string;
  pipelineBlocked: boolean;
  pipelineBlockedReason: string | null;
};

export async function getPipelineDiagnostics(
  userId?: string,
): Promise<PipelineDiagnostics> {
  const supabase = await createServiceClient();
  const health = await checkOpenAIHealth();

  const withUser = <T extends { eq: (col: string, val: string) => T }>(
    query: T,
  ) => (userId ? query.eq("user_id", userId) : query);

  const [
    { count: gmailImported },
    { count: pending },
    { count: failed },
    { count: processing },
    { count: classified },
    { count: ignored },
    { count: needsReview },
    { count: stagedLeads },
    { count: freelancersCreated },
    { count: acceptedLeads },
    { count: opportunitiesCreated },
    { count: companiesCreated },
    { count: contactsCreated },
    { count: clientsCreated },
    { data: failedRows },
  ] = await Promise.all([
    withUser(supabase.from("inbox").select("id", { count: "exact", head: true })),
    withUser(
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "pending"),
    ),
    withUser(
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "failed"),
    ),
    withUser(
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "processing"),
    ),
    withUser(
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "completed"),
    ),
    withUser(
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "ignored"),
    ),
    withUser(
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending_review"),
    ),
    withUser(
      supabase
        .from("potential_opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    withUser(
      supabase.from("freelancers").select("id", { count: "exact", head: true }),
    ),
    withUser(
      supabase
        .from("potential_opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted"),
    ),
    withUser(
      supabase.from("opportunities").select("id", { count: "exact", head: true }),
    ),
    withUser(
      supabase.from("companies").select("id", { count: "exact", head: true }),
    ),
    withUser(
      supabase.from("contacts").select("id", { count: "exact", head: true }),
    ),
    withUser(
      supabase.from("clients").select("id", { count: "exact", head: true }),
    ),
    withUser(
      supabase
        .from("inbox")
        .select("ai_processing_error")
        .eq("ai_processing_status", "failed")
        .not("ai_processing_error", "is", null),
    ),
  ]);

  const failureReasons: Record<string, number> = {};
  for (const row of failedRows ?? []) {
    const raw = row.ai_processing_error?.trim() || "Unknown error";
    const formatted = formatAiProcessingError(raw).userMessage;
    failureReasons[formatted] = (failureReasons[formatted] ?? 0) + 1;
  }

  const pipelineBlocked = health.status !== "ok";
  const pipelineBlockedReason = pipelineBlocked ? health.message : null;

  return {
    gmailImported: gmailImported ?? 0,
    waitingForProcessing: (pending ?? 0) + (failed ?? 0) + (processing ?? 0),
    processing: processing ?? 0,
    classified: classified ?? 0,
    ignored: ignored ?? 0,
    needsReview: needsReview ?? 0,
    failed: failed ?? 0,
    stagedLeads: stagedLeads ?? 0,
    freelancersCreated: freelancersCreated ?? 0,
    acceptedLeads: acceptedLeads ?? 0,
    opportunitiesCreated: opportunitiesCreated ?? 0,
    companiesCreated: companiesCreated ?? 0,
    contactsCreated: contactsCreated ?? 0,
    clientsCreated: clientsCreated ?? 0,
    failureReasons,
    openaiStatus: health.status,
    openaiMessage: health.message,
    pipelineBlocked,
    pipelineBlockedReason,
  };
}
