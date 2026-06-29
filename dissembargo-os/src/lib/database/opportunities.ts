import { createClient } from "@/lib/supabase/server";
import type {
  Opportunity,
  OpportunityInsert,
  OpportunityStatus,
  OpportunityUpdate,
} from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  type PaginationOptions,
} from "./utils";

export async function getOpportunities(
  options?: PaginationOptions & { status?: OpportunityStatus },
) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? {});

  let query = supabase
    .from("opportunities")
    .select(
      `
      *,
      company:companies (*),
      contact:contacts (*)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.status) {
    query = query.eq("opportunity_status", options.status);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch opportunities");

  return { data, count: count ?? 0 };
}

export async function getOpportunityById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      company:companies (*),
      contact:contacts (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch opportunity ${id}`);

  return data;
}

export async function createOpportunity(input: OpportunityInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create opportunity");

  return data as Opportunity;
}

export async function updateOpportunity(id: string, input: OpportunityUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update opportunity ${id}`);

  return data as Opportunity;
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("opportunities").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete opportunity ${id}`);

  return true;
}
