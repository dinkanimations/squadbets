import { createClient } from "@/lib/supabase/server";
import type {
  Quote,
  QuoteInsert,
  QuoteStatus,
  QuoteUpdate,
} from "@/types/database";
import { handleDatabaseError } from "./utils";

export async function getQuotesByProjectId(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    handleDatabaseError(error, `Failed to fetch quotes for project ${projectId}`);
  }

  return data as Quote[];
}

export async function getQuoteById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      *,
      project:projects (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch quote ${id}`);

  return data;
}

export async function createQuote(input: QuoteInsert) {
  const supabase = await createClient();

  const subtotal = input.subtotal ?? 0;
  const discount = input.discount ?? 0;
  const total = input.total ?? subtotal - discount;

  const { data, error } = await supabase
    .from("quotes")
    .insert({ ...input, subtotal, discount, total })
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create quote");

  return data as Quote;
}

export async function updateQuote(id: string, input: QuoteUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update quote ${id}`);

  return data as Quote;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus) {
  return updateQuote(id, { quote_status: status });
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete quote ${id}`);

  return true;
}
