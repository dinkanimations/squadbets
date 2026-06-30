import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail, Json } from "@/types/database";
import type { AiClassificationResult } from "./constants";
import { logPipelineEvent } from "./pipeline-logger";

export type Freelancer = {
  id: string;
  user_id: string;
  inbox_id: string | null;
  status: "active" | "archived";
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  skills: string | null;
  software: string | null;
  portfolio_url: string | null;
  website: string | null;
  linkedin_url: string | null;
  day_rate: number | null;
  availability: string | null;
  notes: string | null;
  ai_summary: string | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  extraction_json: Json | null;
  created_at: string;
  updated_at: string;
};

export async function createFreelancerFromInbox(
  inbox: InboxEmail,
  classification: AiClassificationResult,
): Promise<Freelancer> {
  const supabase = await createServiceClient();

  const fullName =
    classification.freelancer_name ||
    classification.contact_name ||
    inbox.sender_name ||
    "Unknown Freelancer";

  const { data, error } = await supabase
    .from("freelancers")
    .upsert(
      {
        user_id: inbox.user_id,
        inbox_id: inbox.id,
        status: "active",
        full_name: fullName,
        email: classification.freelancer_email || inbox.sender_email,
        phone: classification.contact_phone,
        role: classification.role,
        skills: classification.skills,
        software: classification.software,
        portfolio_url: classification.portfolio_url,
        website: classification.website,
        linkedin_url: classification.linkedin_url,
        day_rate: classification.day_rate,
        availability: classification.availability,
        notes: classification.notes,
        ai_summary: classification.summary,
        ai_confidence: classification.confidence,
        ai_reasoning: classification.reasoning,
        extraction_json: classification as unknown as Json,
      },
      { onConflict: "inbox_id" },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create freelancer profile: ${error.message}`);
  }

  await supabase
    .from("inbox")
    .update({ review_status: "pending_review" })
    .eq("id", inbox.id);

  await logPipelineEvent({
    userId: inbox.user_id,
    inboxId: inbox.id,
    stage: "freelancer_created",
    message: `Freelancer profile created: ${fullName}`,
    metadata: { freelancerId: data.id },
  });

  return data as Freelancer;
}
