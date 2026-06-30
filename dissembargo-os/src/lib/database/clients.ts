import { createClient } from "@/lib/supabase/server";
import type {
  Client,
  ClientInsert,
  ClientStatus,
  ClientUpdate,
} from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  withDevDbFallback,
  type PaginationOptions,
} from "./utils";

export async function getClients(
  options?: PaginationOptions & { status?: ClientStatus },
) {
  return withDevDbFallback(async () => {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? {});

  let query = supabase
    .from("clients")
    .select(
      `
      *,
      company:companies (*)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.status) {
    query = query.eq("client_status", options.status);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch clients");

  return { data, count: count ?? 0 };
  }, { data: [], count: 0 });
}

export async function getClientById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      company:companies (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch client ${id}`);

  return data;
}

export async function getClientByCompanyId(companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("company_id", companyId)
    .maybeSingle();

  if (error) handleDatabaseError(error, "Failed to fetch client by company");

  return data as Client | null;
}

export async function createClientRecord(input: ClientInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create client");

  return data as Client;
}

export async function updateClient(id: string, input: ClientUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update client ${id}`);

  return data as Client;
}

export async function deleteClient(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete client ${id}`);

  return true;
}
