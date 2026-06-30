import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  CompanyInsert,
  CompanyStatus,
  CompanyUpdate,
} from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  withDevDbFallback,
  type PaginationOptions,
} from "./utils";

export type CompaniesFilter = {
  search?: string;
  status?: CompanyStatus;
  industry?: string;
  isExistingClient?: boolean;
  sort?: "asc" | "desc";
};

export async function getCompanies(options?: PaginationOptions) {
  return withDevDbFallback(async () => {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? {});

  const { data, error, count } = await supabase
    .from("companies")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) handleDatabaseError(error, "Failed to fetch companies");

  return { data: data as Company[], count: count ?? 0 };
  }, { data: [], count: 0 });
}

export async function getCompaniesFiltered(
  filters: CompaniesFilter = {},
  options?: PaginationOptions,
) {
  return withDevDbFallback(async () => {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? { pageSize: 50 });

  let query = supabase
    .from("companies")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: filters.sort === "asc" })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "active");
  }

  if (filters.industry) {
    query = query.eq("industry", filters.industry);
  }

  if (filters.isExistingClient !== undefined) {
    query = query.eq("is_existing_client", filters.isExistingClient);
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `company_name.ilike.${term},industry.ilike.${term},website.ilike.${term}`,
    );
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch companies");

  return { data: data as Company[], count: count ?? 0 };
  }, { data: [], count: 0 });
}

export async function getAllCompanies() {
  return withDevDbFallback(async () => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("companies")
      .select("id, company_name")
      .eq("status", "active")
      .order("company_name", { ascending: true });

    if (error) handleDatabaseError(error, "Failed to fetch companies");

    return data;
  }, []);
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

export async function getCompanyProfile(id: string) {
  const supabase = await createClient();

  const [
    { data: company, error: companyError },
    { data: contacts },
    { data: opportunities },
    { data: client },
  ] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase
      .from("contacts")
      .select("*")
      .eq("company_id", id)
      .order("full_name", { ascending: true }),
    supabase
      .from("opportunities")
      .select("*, contact:contacts(*)")
      .eq("company_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("*").eq("company_id", id).maybeSingle(),
  ]);

  if (companyError) handleDatabaseError(companyError, `Failed to fetch company ${id}`);

  let projects: Array<{
    id: string;
    project_name: string;
    status: string;
    start_date: string | null;
    delivery_date: string | null;
  }> = [];

  let quotes: Array<{
    id: string;
    quote_number: string;
    quote_status: string;
    total: number;
    project_title: string | null;
  }> = [];

  const { data: companyQuotes } = await supabase
    .from("quotes")
    .select("id, quote_number, quote_status, total, project_title")
    .eq("company_id", id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  quotes = companyQuotes ?? [];

  if (client) {
    const { data: projectData } = await supabase
      .from("projects")
      .select("id, project_name, status, start_date, delivery_date")
      .eq("client_id", client.id)
      .order("created_at", { ascending: false });

    projects = projectData ?? [];
  }

  return {
    company: company as Company,
    contacts: contacts ?? [],
    opportunities: opportunities ?? [],
    projects,
    quotes,
    client,
  };
}

export async function countCompaniesThisMonth(): Promise<number> {
  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfMonth.toISOString());

  if (error) handleDatabaseError(error, "Failed to count companies");

  return count ?? 0;
}

export async function getIndustriesBreakdown(): Promise<
  Array<{ industry: string; count: number }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select("industry")
    .eq("status", "active")
    .not("industry", "is", null);

  if (error) handleDatabaseError(error, "Failed to fetch industries");

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    const industry = row.industry?.trim();
    if (!industry) continue;
    counts.set(industry, (counts.get(industry) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getOpportunitiesByIndustry(): Promise<
  Array<{ industry: string; count: number }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("opportunities")
    .select("company:companies(industry)")
    .neq("opportunity_status", "archived");

  if (error) handleDatabaseError(error, "Failed to fetch opportunities by industry");

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    const company = row.company as { industry: string | null } | null;
    const industry = company?.industry?.trim() || "Unknown";
    counts.set(industry, (counts.get(industry) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count);
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
