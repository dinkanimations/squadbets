import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxEmail, InboxEmailInsert, InboxEmailUpdate } from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  type PaginationOptions,
} from "./utils";

export async function getInboxEmails(
  options?: PaginationOptions & { unreadOnly?: boolean },
) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange({
    page: options?.page,
    pageSize: options?.pageSize ?? 50,
  });

  let query = supabase
    .from("inbox")
    .select("*", { count: "exact" })
    .order("date_received", { ascending: false })
    .range(from, to);

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch inbox emails");

  return { data: data as InboxEmail[], count: count ?? 0 };
}

export async function getReviewQueueEmails(options?: PaginationOptions) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange({
    page: options?.page,
    pageSize: options?.pageSize ?? 50,
  });

  const { data, error, count } = await supabase
    .from("inbox")
    .select("*", { count: "exact" })
    .eq("review_status", "pending_review")
    .order("ai_processed_at", { ascending: false })
    .range(from, to);

  if (error) handleDatabaseError(error, "Failed to fetch review queue");

  return { data: data as InboxEmail[], count: count ?? 0 };
}

export async function getInboxEmailById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inbox")
    .select("*")
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch inbox email ${id}`);

  return data as InboxEmail;
}

export async function countInboxEmails(options?: {
  unreadOnly?: boolean;
  importedSince?: string;
  reviewPending?: boolean;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("inbox")
    .select("id", { count: "exact", head: true });

  if (options?.unreadOnly) {
    query = query.eq("is_read", false);
  }

  if (options?.importedSince) {
    query = query.gte("imported_at", options.importedSince);
  }

  if (options?.reviewPending) {
    query = query.eq("review_status", "pending_review");
  }

  const { count, error } = await query;

  if (error) handleDatabaseError(error, "Failed to count inbox emails");

  return count ?? 0;
}

export async function countOpportunitiesCreatedToday() {
  const supabase = await createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .not("inbox_id", "is", null)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    handleDatabaseError(error, "Failed to count opportunities created today");
  }

  return count ?? 0;
}

export async function markInboxEmailAsRead(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inbox")
    .update({ is_read: true })
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to mark email ${id} as read`);

  return data as InboxEmail;
}

export async function updateInboxEmailAdmin(
  id: string,
  input: InboxEmailUpdate,
) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("inbox")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update inbox email ${id}`);

  return data as InboxEmail;
}

export async function insertInboxEmail(input: InboxEmailInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inbox")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to insert inbox email");

  return data as InboxEmail;
}
