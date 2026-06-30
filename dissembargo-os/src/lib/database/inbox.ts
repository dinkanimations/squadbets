import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type { InboxEmail, InboxEmailInsert, InboxEmailUpdate } from "@/types/database";
import type { InboxFilterCategory } from "@/lib/ai/constants";
import { JOB_ENQUIRY_CATEGORY } from "@/lib/ai/constants";
import {
  getPaginationRange,
  handleDatabaseError,
  withDevDbFallback,
  type PaginationOptions,
} from "./utils";

export type InboxListOptions = PaginationOptions & {
  filter?: InboxFilterCategory;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyInboxFilter(query: any, filter?: InboxFilterCategory) {
  if (!filter || filter === "all") return query;

  switch (filter) {
    case "new_business":
      return query.eq("ai_category", JOB_ENQUIRY_CATEGORY);
    case "freelancers":
      return query.eq("ai_category", "recruitment");
    case "other":
      return query.eq("ai_category", "other");
    case "unread":
      return query.eq("is_read", false);
    default:
      return query;
  }
}

export async function getInboxEmails(options?: InboxListOptions) {
  return withDevDbFallback(async () => {
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

    query = applyInboxFilter(query, options?.filter);

    const { data, error, count } = await query;

    if (error) handleDatabaseError(error, "Failed to fetch inbox emails");

    return { data: data as InboxEmail[], count: count ?? 0 };
  }, { data: [] as InboxEmail[], count: 0 });
}

export async function getNeedsReviewEmails(options?: PaginationOptions) {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const [
      { data: emails, error },
      { data: potentials },
      { data: freelancers },
    ] = await Promise.all([
      supabase
        .from("inbox")
        .select("*")
        .eq("review_status", "pending_review")
        .order("ai_processed_at", { ascending: false }),
      supabase.from("potential_opportunities").select("inbox_id"),
      supabase.from("freelancers").select("inbox_id"),
    ]);

    if (error) handleDatabaseError(error, "Failed to fetch needs review queue");

    const stagedIds = new Set([
      ...(potentials ?? []).map((row) => row.inbox_id),
      ...(freelancers ?? []).map((row) => row.inbox_id),
    ]);

    const needsReview = (emails ?? []).filter((email) => !stagedIds.has(email.id));

    const { from, to } = getPaginationRange({
      page: options?.page,
      pageSize: options?.pageSize ?? 50,
    });

    return {
      data: needsReview.slice(from, to + 1) as InboxEmail[],
      count: needsReview.length,
    };
  }, { data: [] as InboxEmail[], count: 0 });
}

/** @deprecated Use getNeedsReviewEmails */
export async function getReviewQueueEmails(options?: PaginationOptions) {
  return getNeedsReviewEmails(options);
}

export async function getInboxEmailById(id: string) {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("inbox")
      .select("*")
      .eq("id", id)
      .single();

    if (error) handleDatabaseError(error, `Failed to fetch inbox email ${id}`);

    return data as InboxEmail;
  }, null as unknown as InboxEmail);
}

export async function countNeedsReviewEmails() {
  const { count } = await getNeedsReviewEmails();
  return count;
}

export async function countInboxEmails(options?: {
  unreadOnly?: boolean;
  importedSince?: string;
  reviewPending?: boolean;
}) {
  return withDevDbFallback(async () => {
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
  }, 0);
}

export async function countOpportunitiesCreatedToday() {
  return withDevDbFallback(async () => {
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
  }, 0);
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

export async function updateInboxEmail(
  id: string,
  input: InboxEmailUpdate,
) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
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
