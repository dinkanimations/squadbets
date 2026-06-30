import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { withDevDbFallback } from "./utils";

export type InboxProcessingStats = {
  totalImported: number;
  failed: number;
  pending: number;
  completed: number;
  ignored: number;
  stagedLeads: number;
};

export async function getFailedInboxCountForUser(userId: string): Promise<number> {
  const supabase = await createServiceClient();

  const { count, error } = await supabase
    .from("inbox")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("ai_processing_status", "failed");

  if (error) throw error;
  return count ?? 0;
}

export async function getInboxProcessingStats(): Promise<InboxProcessingStats> {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const [
      { count: totalImported },
      { count: failed },
      { count: pending },
      { count: completed },
      { count: ignored },
      { count: stagedLeads },
    ] = await Promise.all([
      supabase.from("inbox").select("id", { count: "exact", head: true }),
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "failed"),
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "pending"),
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("ai_processing_status", "completed"),
      supabase
        .from("inbox")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "ignored"),
      supabase
        .from("potential_opportunities")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    return {
      totalImported: totalImported ?? 0,
      failed: failed ?? 0,
      pending: pending ?? 0,
      completed: completed ?? 0,
      ignored: ignored ?? 0,
      stagedLeads: stagedLeads ?? 0,
    };
  }, {
    totalImported: 0,
    failed: 0,
    pending: 0,
    completed: 0,
    ignored: 0,
    stagedLeads: 0,
  });
}
