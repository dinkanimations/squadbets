import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  CompanyInsert,
  CompanyUpdate,
} from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  type PaginationOptions,
} from "./utils";

export async function getCompanies(options?: PaginationOptions) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? {});

  const { data, error, count } = await supabase
    .from("companies")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) handleDatabaseError(error, "Failed to fetch companies");

  return { data: data as Company[], count: count ?? 0 };
}

export async function getCompanyById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch company ${id}`);

  return data as Company;
}

export async function createCompany(input: CompanyInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create company");

  return data as Company;
}

export async function updateCompany(id: string, input: CompanyUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update company ${id}`);

  return data as Company;
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("companies").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete company ${id}`);

  return true;
}
