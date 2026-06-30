"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { getInboxEmailById } from "@/lib/database/inbox";
import { createOpportunityFromInbox } from "@/lib/ai/create-opportunity-from-inbox";
import {
  updateInboxAiCategory,
  reprocessInboxEmail,
} from "@/lib/ai/process-inbox";
import {
  logAiClassification,
  logAiClassificationFeedback,
} from "@/lib/database/ai-logs";
import type { AiEmailCategory } from "@/lib/ai/constants";
import {
  AI_CATEGORY_LABELS,
  classificationFromInboxFields,
  isJobEnquiryCategory,
} from "@/lib/ai/constants";
import { getUser } from "@/lib/auth/session";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

async function getCurrentUserId(): Promise<string | null> {
  const { user } = await getUser();
  return user?.id ?? null;
}

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

    const classification = classificationFromInboxFields(inbox, {
      company_name: companyName,
      category: categoryValue,
    });

    const opportunity = await createOpportunityFromInbox(inbox, classification, {
      companyName,
      category: AI_CATEGORY_LABELS[categoryValue],
    });

    const supabase = await createServiceClient();
    await supabase
      .from("inbox")
      .update({
        review_status: "approved",
        opportunity_id: opportunity.id,
        detected_company_name: companyName,
        ai_category: categoryValue,
      })
      .eq("id", inboxId);

    const userId = await getCurrentUserId();

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

    await logAiClassificationFeedback({
      inboxId,
      userId: userId ?? inbox.user_id,
      originalCategory: inbox.ai_category,
      correctedCategory: categoryValue,
      originalConfidence: inbox.ai_confidence,
      feedbackAction: "approved",
      companyNameOverride: companyName,
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
    const supabase = await createServiceClient();
    const userId = await getCurrentUserId();

    await supabase
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

    await logAiClassificationFeedback({
      inboxId,
      userId: userId ?? inbox.user_id,
      originalCategory: inbox.ai_category,
      correctedCategory: inbox.ai_category,
      originalConfidence: inbox.ai_confidence,
      feedbackAction: "rejected",
    });

    revalidatePath("/review-queue");
    revalidatePath("/inbox");
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
    const inbox = await getInboxEmailById(inboxId);
    const userId = await getCurrentUserId();

    await updateInboxAiCategory(inboxId, category, {
      recordFeedback: true,
      userId: userId ?? inbox.user_id,
    });

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

export async function createOpportunityFromInboxAction(
  inboxId: string,
  companyName: string,
): Promise<ReviewActionState> {
  try {
    const inbox = await getInboxEmailById(inboxId);

    if (!companyName.trim()) {
      return { error: "Company name is required." };
    }

    const classification = classificationFromInboxFields(inbox, {
      company_name: companyName.trim(),
    });

    const opportunity = await createOpportunityFromInbox(inbox, classification, {
      companyName: companyName.trim(),
    });

    const supabase = await createServiceClient();
    const userId = await getCurrentUserId();

    await supabase
      .from("inbox")
      .update({
        review_status: "approved",
        opportunity_id: opportunity.id,
        detected_company_name: companyName.trim(),
      })
      .eq("id", inboxId);

    await logAiClassificationFeedback({
      inboxId,
      userId: userId ?? inbox.user_id,
      originalCategory: inbox.ai_category,
      correctedCategory: inbox.ai_category,
      originalConfidence: inbox.ai_confidence,
      feedbackAction: "manual_created",
      companyNameOverride: companyName.trim(),
    });

    revalidatePath("/inbox");
    revalidatePath("/opportunities");
    revalidatePath("/review-queue");

    return { success: "Opportunity created." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to create opportunity.",
    };
  }
}

export async function updateInboxCategoryAction(
  inboxId: string,
  category: AiEmailCategory,
): Promise<ReviewActionState> {
  try {
    const inbox = await getInboxEmailById(inboxId);
    const userId = await getCurrentUserId();

    await updateInboxAiCategory(inboxId, category, {
      recordFeedback: inbox.ai_category !== category,
      userId: userId ?? inbox.user_id,
    });

    revalidatePath(`/inbox/${inboxId}`);
    revalidatePath("/inbox");
    revalidatePath("/review-queue");

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

export async function approveIfJobEnquiry(
  category: AiEmailCategory,
): Promise<boolean> {
  return isJobEnquiryCategory(category);
}
