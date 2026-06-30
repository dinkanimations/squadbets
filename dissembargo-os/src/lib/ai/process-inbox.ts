import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail, InboxAttachment } from "@/types/database";
import { classifyEmail } from "./classify-email";
import { createPotentialOpportunityFromInbox } from "./create-potential-opportunity";
import { createFreelancerFromInbox } from "./create-freelancer-from-inbox";
import {
  AUTO_CLASSIFY_MIN_CONFIDENCE,
  CRM_ROUTE_LABELS,
  isAutoClassifyConfidence,
  routeToLegacyCategory,
  type AiActionTaken,
  type AiEmailCategory,
} from "./constants";
import { logAiClassification } from "@/lib/database/ai-logs";
import { logPipelineEvent } from "./pipeline-logger";
import {
  formatThreadContext,
  inboxEmailToThreadContext,
} from "./thread-context";

export type ProcessInboxResult = {
  inboxId: string;
  status: "completed" | "failed";
  actionTaken?: AiActionTaken;
  error?: string;
};

async function getInboxById(inboxId: string): Promise<InboxEmail | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("inbox")
    .select("*")
    .eq("id", inboxId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getThreadContextForInbox(
  inbox: InboxEmail,
): Promise<string | null> {
  if (!inbox.thread_id) return null;

  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("inbox")
    .select("*")
    .eq("user_id", inbox.user_id)
    .eq("thread_id", inbox.thread_id)
    .neq("id", inbox.id)
    .order("date_received", { ascending: true })
    .limit(10);

  if (error || !data?.length) return null;

  return formatThreadContext(data.map(inboxEmailToThreadContext));
}

export async function processInboxEmail(
  inboxId: string,
): Promise<ProcessInboxResult> {
  const supabase = await createServiceClient();

  const inbox = await getInboxById(inboxId);

  if (!inbox) {
    return { inboxId, status: "failed", error: "Inbox email not found" };
  }

  if (
    inbox.ai_processing_status === "completed" ||
    inbox.ai_processing_status === "processing"
  ) {
    return { inboxId, status: "completed", actionTaken: "classified_only" };
  }

  await supabase
    .from("inbox")
    .update({
      ai_processing_status: "processing",
      ai_processing_error: null,
    })
    .eq("id", inboxId);

  await logPipelineEvent({
    userId: inbox.user_id,
    inboxId,
    gmailMessageId: inbox.gmail_message_id,
    stage: "ai_sent",
    message: `Sending to OpenAI: ${inbox.subject ?? "(no subject)"}`,
    metadata: { senderEmail: inbox.sender_email },
  });

  try {
    const threadContext = await getThreadContextForInbox(inbox);

    const attachments = (inbox.attachments as InboxAttachment[] | null) ?? [];

    const { result, rawResponse } = await classifyEmail({
      subject: inbox.subject,
      senderName: inbox.sender_name,
      senderEmail: inbox.sender_email,
      bodyPlain: inbox.body_plain,
      bodyHtml: inbox.body_html,
      threadContext,
      attachments,
    });

    const autoCreate = isAutoClassifyConfidence(result.confidence);
    let recordCreated = false;

    await logPipelineEvent({
      userId: inbox.user_id,
      inboxId,
      stage: "ai_classified",
      message: `${CRM_ROUTE_LABELS[result.route]} (${result.confidence}%) — ${result.reasoning}`,
      metadata: {
        route: result.route,
        classification: CRM_ROUTE_LABELS[result.route],
        confidence: result.confidence,
        reasoning: result.reasoning,
        summary: result.summary,
        autoCreate,
        threshold: AUTO_CLASSIFY_MIN_CONFIDENCE,
      },
    });

    let actionTaken: AiActionTaken = "ignored";
    let reviewStatus:
      | "pending_review"
      | "approved"
      | "rejected"
      | "auto_created"
      | "ignored"
      | null = "ignored";

    const isPotentialOpportunity = result.route === "potential_opportunity";
    const isFreelancer = result.route === "freelancer";

    if (isPotentialOpportunity && autoCreate) {
      await createPotentialOpportunityFromInbox(inbox, result);
      actionTaken = "potential_opportunity";
      recordCreated = true;
      reviewStatus = null;

      await logPipelineEvent({
        userId: inbox.user_id,
        inboxId,
        stage: "potential_opportunity_created",
        message: `Potential Opportunity created — ${result.summary}`,
        metadata: { confidence: result.confidence, reasoning: result.reasoning },
      });
    } else if (isFreelancer && autoCreate) {
      await createFreelancerFromInbox(inbox, result);
      actionTaken = "freelancer";
      recordCreated = true;
      reviewStatus = null;

      await logPipelineEvent({
        userId: inbox.user_id,
        inboxId,
        stage: "freelancer_created",
        message: `Freelancer profile created — ${result.summary}`,
        metadata: { confidence: result.confidence, reasoning: result.reasoning },
      });
    } else if (isPotentialOpportunity || isFreelancer) {
      actionTaken = "needs_review";
      reviewStatus = "pending_review";

      await logPipelineEvent({
        userId: inbox.user_id,
        inboxId,
        stage: "needs_review",
        status: "skipped",
        message: `Needs review (${result.confidence}% < ${AUTO_CLASSIFY_MIN_CONFIDENCE}%): ${result.reasoning}`,
        metadata: {
          route: result.route,
          classification: CRM_ROUTE_LABELS[result.route],
          confidence: result.confidence,
          reasoning: result.reasoning,
          recordCreated: false,
        },
      });
    } else {
      reviewStatus = "ignored";
      actionTaken = "ignored";

      await logPipelineEvent({
        userId: inbox.user_id,
        inboxId,
        stage: "ignored",
        status: "skipped",
        message: `Other — ${result.reasoning}`,
        metadata: {
          route: result.route,
          confidence: result.confidence,
          reasoning: result.reasoning,
          recordCreated: false,
        },
      });
    }

    const legacyCategory = routeToLegacyCategory(result.route);

    await supabase
      .from("inbox")
      .update({
        ai_category: legacyCategory,
        ai_confidence: result.confidence,
        ai_summary: result.summary,
        ai_reasoning: result.reasoning,
        ai_signature: result.signature,
        detected_company_name: result.company_name,
        detected_website: result.website,
        ai_processed_at: new Date().toISOString(),
        ai_processing_status: "completed",
        ai_processing_error: null,
        review_status: reviewStatus,
      })
      .eq("id", inboxId);

    await logAiClassification({
      inboxId,
      userId: inbox.user_id,
      aiCategory: legacyCategory,
      aiConfidence: result.confidence,
      aiSummary: result.summary,
      aiReasoning: result.reasoning,
      rawResponse: {
        ...rawResponse,
        route: result.route,
        classification: CRM_ROUTE_LABELS[result.route],
        record_created: recordCreated,
        needs_review: actionTaken === "needs_review",
      },
      actionTaken,
    });

    console.info(
      `[ai-classification] inbox=${inboxId} route=${result.route} confidence=${result.confidence}% record_created=${recordCreated} reasoning="${result.reasoning}"`,
    );

    return { inboxId, status: "completed", actionTaken };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI processing failed";

    await logPipelineEvent({
      userId: inbox.user_id,
      inboxId,
      stage: "failed",
      status: "failed",
      message,
    });

    await supabase
      .from("inbox")
      .update({
        ai_processing_status: "failed",
        ai_processing_error: message,
        ai_processed_at: new Date().toISOString(),
      })
      .eq("id", inboxId);

    await logAiClassification({
      inboxId,
      userId: inbox.user_id,
      aiCategory: null,
      aiConfidence: null,
      aiSummary: null,
      aiReasoning: null,
      rawResponse: { error: message },
      actionTaken: "processing_failed",
    });

    return { inboxId, status: "failed", error: message };
  }
}

export async function processPendingInboxEmails(
  limit = 20,
  options?: { userId?: string },
) {
  const supabase = await createServiceClient();

  let query = supabase
    .from("inbox")
    .select("id, ai_processing_status")
    .in("ai_processing_status", ["pending", "failed"])
    .order("imported_at", { ascending: true })
    .limit(limit);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }

  const { data: pendingEmails, error } = await query;

  if (error) throw error;

  const results = [];

  for (const email of pendingEmails ?? []) {
    const result =
      email.ai_processing_status === "failed"
        ? await reprocessInboxEmail(email.id)
        : await processInboxEmail(email.id);
    results.push(result);
  }

  return results;
}

/** Reset failed AI scans and reprocess emails (e.g. after fixing OpenAI key or migrations). */
export async function rescanFailedInboxEmails(options?: {
  userId?: string;
  limit?: number;
}) {
  const supabase = await createServiceClient();
  const limit = options?.limit ?? 25;

  let resetQuery = supabase
    .from("inbox")
    .update({
      ai_processing_status: "pending",
      ai_processing_error: null,
    })
    .eq("ai_processing_status", "failed");

  if (options?.userId) {
    resetQuery = resetQuery.eq("user_id", options.userId);
  }

  await resetQuery;

  return processPendingInboxEmails(limit, { userId: options?.userId });
}

export async function backfillPotentialOpportunities(options?: {
  userId?: string;
  limit?: number;
}): Promise<{
  processed: number;
  potentialOpportunities: number;
  failed: number;
  results: ProcessInboxResult[];
}> {
  const supabase = await createServiceClient();
  const limit = options?.limit ?? 30;

  let potentialQuery = supabase.from("potential_opportunities").select("inbox_id");
  if (options?.userId) {
    potentialQuery = potentialQuery.eq("user_id", options.userId);
  }

  const { data: existingPotentials, error: potentialError } =
    await potentialQuery;

  if (potentialError) throw potentialError;

  const stagedInboxIds = new Set(
    (existingPotentials ?? []).map((row) => row.inbox_id),
  );

  let inboxQuery = supabase
    .from("inbox")
    .select("id, ai_processing_status, review_status, opportunity_id")
    .is("opportunity_id", null)
    .order("date_received", { ascending: false })
    .limit(limit * 4);

  if (options?.userId) {
    inboxQuery = inboxQuery.eq("user_id", options.userId);
  }

  const { data: inboxRows, error: inboxError } = await inboxQuery;

  if (inboxError) throw inboxError;

  const candidates = (inboxRows ?? []).filter((row) => {
    if (stagedInboxIds.has(row.id)) return false;
    if (row.review_status === "rejected") return false;
    return true;
  }).slice(0, limit);

  const results: ProcessInboxResult[] = [];
  let potentialOpportunities = 0;
  let failed = 0;

  for (const row of candidates) {
    try {
      const result =
        row.ai_processing_status === "completed"
          ? await reprocessInboxEmail(row.id)
          : row.ai_processing_status === "failed"
            ? await reprocessInboxEmail(row.id)
            : await processInboxEmail(row.id);

      results.push(result);

      if (result.status === "failed") {
        failed += 1;
      } else if (
        result.actionTaken === "potential_opportunity" ||
        result.actionTaken === "freelancer"
      ) {
        potentialOpportunities += 1;
      }
    } catch (error) {
      failed += 1;
      results.push({
        inboxId: row.id,
        status: "failed",
        error:
          error instanceof Error
            ? error.message
            : "Backfill processing failed",
      });
    }
  }

  return {
    processed: results.length,
    potentialOpportunities,
    failed,
    results,
  };
}

export async function reprocessInboxEmail(inboxId: string) {
  const supabase = await createServiceClient();

  await supabase.from("potential_opportunities").delete().eq("inbox_id", inboxId);
  await supabase.from("freelancers").delete().eq("inbox_id", inboxId);

  await supabase
    .from("inbox")
    .update({
      ai_processing_status: "pending",
      ai_processing_error: null,
      review_status: null,
      opportunity_id: null,
      company_id: null,
      linked_quote_id: null,
      linked_project_id: null,
    })
    .eq("id", inboxId);

  return processInboxEmail(inboxId);
}

export { reprocessImportedEmails, resetStuckProcessingEmails } from "./reprocess-imported-emails";

export async function updateInboxAiCategory(
  inboxId: string,
  category: AiEmailCategory,
  options?: { recordFeedback?: boolean; userId?: string },
) {
  const supabase = await createServiceClient();
  const inbox = await getInboxById(inboxId);

  if (!inbox) throw new Error("Inbox email not found");

  const originalCategory = inbox.ai_category;

  let reviewStatus:
    | "pending_review"
    | "approved"
    | "rejected"
    | "auto_created"
    | "ignored"
    | null = "ignored";

  if (
    category === "new_business_opportunity" ||
    category === "existing_client"
  ) {
    reviewStatus = "pending_review";
  }

  const { data, error } = await supabase
    .from("inbox")
    .update({
      ai_category: category,
      review_status: reviewStatus,
    })
    .eq("id", inboxId)
    .select()
    .single();

  if (error) throw error;

  await logAiClassification({
    inboxId,
    userId: inbox.user_id,
    aiCategory: category,
    aiConfidence: inbox.ai_confidence,
    aiSummary: inbox.ai_summary,
    aiReasoning: `Category manually updated to ${category}`,
    rawResponse: { manual_update: true },
    actionTaken: "classified_only",
  });

  if (options?.recordFeedback && originalCategory !== category) {
    const { logAiClassificationFeedback } = await import("@/lib/database/ai-logs");
    await logAiClassificationFeedback({
      inboxId,
      userId: options.userId ?? inbox.user_id,
      originalCategory,
      correctedCategory: category,
      originalConfidence: inbox.ai_confidence,
      feedbackAction: "reclassified",
    });
  }

  return data;
}
