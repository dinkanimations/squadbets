import { createClient } from "@/lib/supabase/server";
import type { InboxEmail, InboxEmailInsert } from "@/types/database";
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

  const { count, error } = await query;

  if (error) handleDatabaseError(error, "Failed to count inbox emails");

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
