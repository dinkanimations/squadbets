"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInboxEmailById } from "@/lib/database/inbox";
import { createOpportunityFromInbox } from "@/lib/ai/create-opportunity-from-inbox";
import {
  updateInboxAiCategory,
  reprocessInboxEmail,
} from "@/lib/ai/process-inbox";
import { logAiClassification } from "@/lib/database/ai-logs";
import type { AiClassificationResult, AiEmailCategory } from "@/lib/ai/constants";
import { AI_CATEGORY_LABELS } from "@/lib/ai/constants";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

export async function approveReviewAction(
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const inboxId = String(formData.get("inboxId") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() as AiEmailCategory;

  if (!inboxId) return { error: "Inbox email ID is required." };
  if (!companyName) return { error: "Company name is required." };

  try {
    const inbox = await getInboxEmailById(inboxId);

    if (inbox.review_status !== "pending_review") {
      return { error: "This email is no longer pending review." };
    }

    const categoryValue = (category ||
      inbox.ai_category ||
      "new_business_opportunity") as AiEmailCategory;

    const classification: AiClassificationResult = {
      category: categoryValue,
      confidence: inbox.ai_confidence ?? 0,
      summary: inbox.ai_summary ?? "",
      reasoning: inbox.ai_reasoning ?? "",
      signature: inbox.ai_signature,
      company_name: companyName,
      contact_name: inbox.sender_name,
      website: inbox.detected_website,
    };

    const opportunity = await createOpportunityFromInbox(inbox, classification, {
      companyName,
      category: AI_CATEGORY_LABELS[categoryValue],
    });

    const admin = createAdminClient();
    await admin
      .from("inbox")
      .update({
        review_status: "approved",
        opportunity_id: opportunity.id,
        detected_company_name: companyName,
        ai_category: categoryValue,
      })
      .eq("id", inboxId);

    await logAiClassification({
      inboxId,
      userId: inbox.user_id,
      aiCategory: categoryValue,
      aiConfidence: classification.confidence,
      aiSummary: classification.summary,
      aiReasoning: "Manually approved from review queue",
      rawResponse: { manual_approval: true, companyName },
      actionTaken: "auto_opportunity",
    });

    revalidatePath("/review-queue");
    revalidatePath("/opportunities");
    revalidatePath("/");
    revalidatePath("/inbox");

    return { success: "Opportunity created successfully." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to approve email.",
    };
  }
}

export async function rejectReviewAction(
  inboxId: string,
): Promise<ReviewActionState> {
  try {
    const inbox = await getInboxEmailById(inboxId);
    const admin = createAdminClient();

    await admin
      .from("inbox")
      .update({ review_status: "rejected" })
      .eq("id", inboxId);

    await logAiClassification({
      inboxId,
      userId: inbox.user_id,
      aiCategory: inbox.ai_category,
      aiConfidence: inbox.ai_confidence,
      aiSummary: inbox.ai_summary,
      aiReasoning: "Manually rejected from review queue",
      rawResponse: { manual_rejection: true },
      actionTaken: "classified_only",
    });

    revalidatePath("/review-queue");
    revalidatePath("/");

    return { success: "Email rejected." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to reject email.",
    };
  }
}

export async function updateReviewCategoryAction(
  inboxId: string,
  category: AiEmailCategory,
): Promise<ReviewActionState> {
  try {
    await updateInboxAiCategory(inboxId, category);
    revalidatePath("/review-queue");
    revalidatePath("/inbox");

    return { success: "Category updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update category.",
    };
  }
}

export async function retryAiProcessingAction(
  inboxId: string,
): Promise<ReviewActionState> {
  try {
    await reprocessInboxEmail(inboxId);
    revalidatePath("/review-queue");
    revalidatePath("/inbox");
    revalidatePath("/opportunities");
    revalidatePath("/");

    return { success: "Email reprocessed." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to reprocess email.",
    };
  }
}
