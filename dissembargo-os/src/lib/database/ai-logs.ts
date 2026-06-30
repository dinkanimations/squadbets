import type { Json } from "@/types/database";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  AiEmailCategory,
  AiActionTaken,
  AiFeedbackAction,
} from "@/lib/ai/constants";
import { OPENAI_MODEL, PROMPT_VERSION } from "@/lib/ai/constants";

interface LogClassificationInput {
  inboxId: string;
  userId: string;
  aiCategory: AiEmailCategory | null;
  aiConfidence: number | null;
  aiSummary: string | null;
  aiReasoning: string | null;
  rawResponse: Record<string, unknown> | null;
  actionTaken: AiActionTaken;
}

interface LogFeedbackInput {
  inboxId: string;
  userId: string;
  originalCategory: AiEmailCategory | null;
  correctedCategory: AiEmailCategory | null;
  originalConfidence: number | null;
  feedbackAction: AiFeedbackAction;
  companyNameOverride?: string | null;
  notes?: string | null;
}

export async function logAiClassification(input: LogClassificationInput) {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("ai_classification_logs").insert({
    inbox_id: input.inboxId,
    user_id: input.userId,
    ai_category: input.aiCategory,
    ai_confidence: input.aiConfidence,
    ai_summary: input.aiSummary,
    ai_reasoning: input.aiReasoning,
    model: OPENAI_MODEL,
    prompt_version: PROMPT_VERSION,
    raw_response: input.rawResponse as Json,
    action_taken: input.actionTaken,
  });

  if (error) {
    console.error("Failed to log AI classification:", error.message);
  }
}

export async function logAiClassificationFeedback(input: LogFeedbackInput) {
  const supabase = await createServiceClient();

  const { error } = await supabase.from("ai_classification_feedback").insert({
    inbox_id: input.inboxId,
    user_id: input.userId,
    original_category: input.originalCategory,
    corrected_category: input.correctedCategory,
    original_confidence: input.originalConfidence,
    feedback_action: input.feedbackAction,
    company_name_override: input.companyNameOverride ?? null,
    notes: input.notes ?? null,
  });

  if (error) {
    console.error("Failed to log AI classification feedback:", error.message);
  }
}
