import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { Freelancer } from "@/lib/ai/create-freelancer-from-inbox";
import { withDevDbFallback } from "./utils";

export async function getFreelancers() {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { data, error, count } = await supabase
      .from("freelancers")
      .select("*", { count: "exact" })
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: (data ?? []) as Freelancer[], count: count ?? 0 };
  }, { data: [], count: 0 });
}

export async function getFreelancerById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("freelancers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  let inbox = null;
  if (data.inbox_id) {
    const { data: inboxRow } = await supabase
      .from("inbox")
      .select(
        "id, subject, sender_name, sender_email, date_received, body_plain, body_html, attachments, thread_id",
      )
      .eq("id", data.inbox_id)
      .maybeSingle();
    inbox = inboxRow;
  }

  return { ...data, inbox };
}

export async function archiveFreelancer(id: string) {
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from("freelancers")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) throw error;
}
