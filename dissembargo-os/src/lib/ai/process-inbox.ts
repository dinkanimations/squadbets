import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxEmail } from "@/types/database";
import { classifyEmail } from "./classify-email";
import { createOpportunityFromInbox } from "./create-opportunity-from-inbox";
import {
  AUTO_OPPORTUNITY_CONFIDENCE_THRESHOLD,
  type AiActionTaken,
  type AiEmailCategory,
} from "./constants";
import { logAiClassification } from "@/lib/database/ai-logs";

export type ProcessInboxResult = {
  inboxId: string;
  status: "completed" | "failed";
  actionTaken?: AiActionTaken;
  error?: string;
};

async function getInboxById(inboxId: string): Promise<InboxEmail | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("inbox")
    .select("*")
    .eq("id", inboxId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function processInboxEmail(
  inboxId: string,
): Promise<ProcessInboxResult> {
  const admin = createAdminClient();

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

  await admin
    .from("inbox")
    .update({
      ai_processing_status: "processing",
      ai_processing_error: null,
    })
    .eq("id", inboxId);

  try {
    const { result, rawResponse } = await classifyEmail({
      subject: inbox.subject,
      senderName: inbox.sender_name,
      senderEmail: inbox.sender_email,
      bodyPlain: inbox.body_plain,
      bodyHtml: inbox.body_html,
    });

    let actionTaken: AiActionTaken = "classified_only";
    let reviewStatus: "pending_review" | "auto_created" | null = null;
    let opportunityId: string | null = inbox.opportunity_id;

    if (
      result.category === "new_business_opportunity" &&
      result.confidence >= AUTO_OPPORTUNITY_CONFIDENCE_THRESHOLD
    ) {
      const opportunity = await createOpportunityFromInbox(inbox, result);
      opportunityId = opportunity.id;
      reviewStatus = "auto_created";
      actionTaken = "auto_opportunity";
    } else if (result.category === "new_business_opportunity") {
      reviewStatus = "pending_review";
      actionTaken = "review_queue";
    }

    await admin
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
        opportunity_id: opportunityId,
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

    await admin
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

export async function processPendingInboxEmails(limit = 20) {
  const admin = createAdminClient();

  const { data: pendingEmails, error } = await admin
    .from("inbox")
    .select("id")
    .in("ai_processing_status", ["pending", "failed"])
    .order("imported_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const results = [];

  for (const email of pendingEmails ?? []) {
    results.push(await processInboxEmail(email.id));
  }

  return results;
}

export async function reprocessInboxEmail(inboxId: string) {
  const admin = createAdminClient();

  await admin
    .from("inbox")
    .update({
      ai_processing_status: "pending",
      ai_processing_error: null,
      review_status: null,
    })
    .eq("id", inboxId);

  return processInboxEmail(inboxId);
}

export async function updateInboxAiCategory(
  inboxId: string,
  category: AiEmailCategory,
) {
  const admin = createAdminClient();
  const inbox = await getInboxById(inboxId);

  if (!inbox) throw new Error("Inbox email not found");

  const reviewStatus =
    category === "new_business_opportunity" &&
    (inbox.ai_confidence ?? 0) < AUTO_OPPORTUNITY_CONFIDENCE_THRESHOLD
      ? "pending_review"
      : inbox.review_status;

  const { data, error } = await admin
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

  return data;
}
