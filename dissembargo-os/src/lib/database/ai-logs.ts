import type { Json } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AiEmailCategory, AiActionTaken } from "@/lib/ai/constants";
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

export async function logAiClassification(input: LogClassificationInput) {
  const admin = createAdminClient();

  const { error } = await admin.from("ai_classification_logs").insert({
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
