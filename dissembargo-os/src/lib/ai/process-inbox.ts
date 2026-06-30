import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail } from "@/types/database";
import { classifyEmail } from "./classify-email";
import {
  createClientCommunicationFromInbox,
  createPotentialOpportunityFromInbox,
} from "./create-potential-opportunity";
import {
  CLIENT_COMMUNICATION_MIN_CONFIDENCE,
  POTENTIAL_OPPORTUNITY_MIN_CONFIDENCE,
  type AiActionTaken,
  type AiEmailCategory,
} from "./constants";
import { logAiClassification } from "@/lib/database/ai-logs";
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

  try {
    const threadContext = await getThreadContextForInbox(inbox);

    const { result, rawResponse } = await classifyEmail({
      subject: inbox.subject,
      senderName: inbox.sender_name,
      senderEmail: inbox.sender_email,
      bodyPlain: inbox.body_plain,
      bodyHtml: inbox.body_html,
      threadContext,
    });

    let actionTaken: AiActionTaken = "ignored";
    let reviewStatus:
      | "pending_review"
      | "approved"
      | "rejected"
      | "auto_created"
      | "ignored"
      | null = "ignored";

    const isNewBusiness =
      result.routing_intent === "new_business_enquiry" &&
      result.confidence >= POTENTIAL_OPPORTUNITY_MIN_CONFIDENCE;

    const isClientCommunication =
      result.routing_intent === "existing_client_communication" &&
      result.confidence >= CLIENT_COMMUNICATION_MIN_CONFIDENCE;

    if (isNewBusiness) {
      await createPotentialOpportunityFromInbox(inbox, result);
      actionTaken = "potential_opportunity";
      reviewStatus = "pending_review";
    } else if (isClientCommunication) {
      await createClientCommunicationFromInbox(inbox, result);
      actionTaken = "client_communication";
      reviewStatus = "pending_review";
    } else {
      reviewStatus = "ignored";
      actionTaken =
        result.routing_intent === "not_relevant" ? "ignored" : "classified_only";
    }

    await supabase
      .from("inbox")
      .update({
        ai_category: result.category,
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
      aiCategory: result.category,
      aiConfidence: result.confidence,
      aiSummary: result.summary,
      aiReasoning: result.reasoning,
      rawResponse,
      actionTaken,
    });

    return { inboxId, status: "completed", actionTaken };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "AI processing failed";

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
        result.actionTaken === "client_communication"
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
