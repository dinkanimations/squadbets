import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

export const PIPELINE_STAGES = [
  "gmail_fetched",
  "gmail_saved",
  "gmail_skipped",
  "ai_sent",
  "ai_classified",
  "potential_opportunity_created",
  "freelancer_created",
  "opportunity_created",
  "company_linked",
  "client_created",
  "needs_review",
  "ignored",
  "failed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export type PipelineLogInput = {
  userId: string;
  inboxId?: string | null;
  gmailMessageId?: string | null;
  stage: PipelineStage;
  status?: "success" | "failed" | "skipped";
  message?: string | null;
  metadata?: Record<string, unknown> | null;
};

let pipelineTableAvailable: boolean | null = null;

async function isPipelineTableAvailable(): Promise<boolean> {
  if (pipelineTableAvailable !== null) return pipelineTableAvailable;

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase
      .from("inbox_pipeline_logs")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    pipelineTableAvailable = !error;
  } catch {
    pipelineTableAvailable = false;
  }

  return pipelineTableAvailable;
}

export async function logPipelineEvent(input: PipelineLogInput): Promise<void> {
  const line = `[pipeline:${input.stage}] ${input.message ?? input.status ?? "ok"}`;
  console.info(line, input.metadata ?? {});

  if (!(await isPipelineTableAvailable())) return;

  try {
    const supabase = await createServiceClient();
    const { error } = await supabase.from("inbox_pipeline_logs").insert({
      user_id: input.userId,
      inbox_id: input.inboxId ?? null,
      gmail_message_id: input.gmailMessageId ?? null,
      stage: input.stage,
      status: input.status ?? "success",
      message: input.message ?? null,
      metadata: (input.metadata ?? null) as Json,
    });

    if (error) {
      console.error("Failed to persist pipeline log:", error.message);
    }
  } catch (error) {
    console.error(
      "Pipeline log write error:",
      error instanceof Error ? error.message : error,
    );
  }
}
