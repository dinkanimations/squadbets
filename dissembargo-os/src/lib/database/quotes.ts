import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Quote,
  QuoteBudgetLineItem,
  QuoteBudgetSection,
  QuoteDeliverable,
  QuoteInsert,
  QuoteStatus,
  QuoteUpdate,
} from "@/types/database";
import type { QuotesFilter } from "@/lib/quotes/types";
import {
  getPaginationRange,
  handleDatabaseError,
  type PaginationOptions,
} from "./utils";

export type QuoteBudgetSectionWithItems = QuoteBudgetSection & {
  line_items: QuoteBudgetLineItem[];
};

export type QuoteWithRelations = Quote & {
  company: {
    id: string;
    company_name: string;
    website?: string | null;
    logo_url?: string | null;
  } | null;
  contact: { id: string; full_name: string } | null;
  opportunity: { id: string; subject: string | null } | null;
  project: { id: string; project_name: string } | null;
};

export type QuoteFull = QuoteWithRelations & {
  deliverables: QuoteDeliverable[];
  budget_sections: QuoteBudgetSectionWithItems[];
};

export async function generateQuoteNumber(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("generate_quote_number");

  if (error || !data) {
    const year = new Date().getFullYear();
    const prefix = `Q-${year}-`;
    const { data: latest } = await admin
      .from("quotes")
      .select("quote_number")
      .like("quote_number", `${prefix}%`)
      .order("quote_number", { ascending: false })
      .limit(1);

    let next = 1;
    if (latest?.[0]?.quote_number) {
      const part = latest[0].quote_number.split("-")[2];
      next = parseInt(part, 10) + 1;
    }

    return `${prefix}${String(next).padStart(4, "0")}`;
  }

  return data as string;
}

export async function getQuotesFiltered(
  filters: QuotesFilter = {},
  options?: PaginationOptions,
) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? { pageSize: 50 });

  let query = supabase
    .from("quotes")
    .select(
      `
      *,
      company:companies (id, company_name, website, logo_url),
      contact:contacts (id, full_name),
      opportunity:opportunities (id, subject),
      project:projects (id, project_name)
    `,
      { count: "exact" },
    )
    .eq("is_archived", filters.archived ?? false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("quote_status", filters.status);
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `quote_number.ilike.${term},project_title.ilike.${term},client_name.ilike.${term}`,
    );
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch quotes");

  return { data: data as QuoteWithRelations[], count: count ?? 0 };
}

export async function getQuoteFullById(id: string): Promise<QuoteFull> {
  const supabase = await createClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      `
      *,
      company:companies (id, company_name, website, logo_url),
      contact:contacts (id, full_name),
      opportunity:opportunities (id, subject),
      project:projects (id, project_name)
    `,
    )
    .eq("id", id)
    .single();

  if (quoteError) handleDatabaseError(quoteError, `Failed to fetch quote ${id}`);

  const [{ data: deliverables }, { data: sections }] = await Promise.all([
    supabase
      .from("quote_deliverables")
      .select("*")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("quote_budget_sections")
      .select("*")
      .eq("quote_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  const sectionIds = (sections ?? []).map((s) => s.id);
  let lineItems: QuoteBudgetLineItem[] = [];

  if (sectionIds.length > 0) {
    const { data: items } = await supabase
      .from("quote_budget_line_items")
      .select("*")
      .in("section_id", sectionIds)
      .order("sort_order", { ascending: true });

    lineItems = (items ?? []) as QuoteBudgetLineItem[];
  }

  const budget_sections: QuoteBudgetSectionWithItems[] = (sections ?? []).map(
    (section) => ({
      ...(section as QuoteBudgetSection),
      line_items: lineItems.filter((item) => item.section_id === section.id),
    }),
  );

  return {
    ...(quote as QuoteWithRelations),
    deliverables: (deliverables ?? []) as QuoteDeliverable[],
    budget_sections,
  };
}

export async function countQuotesByStatus(status: QuoteStatus): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("quote_status", status)
    .eq("is_archived", false);

  if (error) handleDatabaseError(error, `Failed to count ${status} quotes`);

  return count ?? 0;
}

export async function getTotalQuoteValue(): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("total")
    .eq("is_archived", false)
    .in("quote_status", ["draft", "sent", "approved"]);

  if (error) handleDatabaseError(error, "Failed to calculate total quote value");

  return (data ?? []).reduce((sum, row) => sum + (row.total ?? 0), 0);
}

export async function createQuoteRecord(input: QuoteInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotes")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create quote");

  return data as Quote;
}

export async function updateQuoteRecord(id: string, input: QuoteUpdate) {
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

export async function archiveQuote(id: string) {
  return updateQuoteRecord(id, { is_archived: true });
}

export async function deleteQuoteChildren(quoteId: string) {
  const admin = createAdminClient();

  const { data: sections } = await admin
    .from("quote_budget_sections")
    .select("id")
    .eq("quote_id", quoteId);

  const sectionIds = (sections ?? []).map((s) => s.id);

  if (sectionIds.length > 0) {
    await admin
      .from("quote_budget_line_items")
      .delete()
      .in("section_id", sectionIds);
  }

  await admin.from("quote_budget_sections").delete().eq("quote_id", quoteId);
  await admin.from("quote_deliverables").delete().eq("quote_id", quoteId);
}

export async function saveQuoteChildren(
  quoteId: string,
  deliverables: Array<{
    title: string;
    description: string | null;
    quantity: number;
    sort_order: number;
  }>,
  sections: Array<{
    name: string;
    sort_order: number;
    line_items: Array<{
      description: string;
      day_rate: number;
      num_days: number;
      total_cost: number;
      sort_order: number;
    }>;
  }>,
) {
  const admin = createAdminClient();

  await deleteQuoteChildren(quoteId);

  if (deliverables.length > 0) {
    const { error } = await admin.from("quote_deliverables").insert(
      deliverables.map((d) => ({
        quote_id: quoteId,
        title: d.title,
        description: d.description,
        quantity: d.quantity,
        sort_order: d.sort_order,
      })),
    );

    if (error) throw new Error(`Failed to save deliverables: ${error.message}`);
  }

  for (const section of sections) {
    const { data: sectionRow, error: sectionError } = await admin
      .from("quote_budget_sections")
      .insert({
        quote_id: quoteId,
        name: section.name,
        sort_order: section.sort_order,
      })
      .select()
      .single();

    if (sectionError || !sectionRow) {
      throw new Error(`Failed to save budget section: ${sectionError?.message}`);
    }

    if (section.line_items.length > 0) {
      const { error: itemsError } = await admin
        .from("quote_budget_line_items")
        .insert(
          section.line_items.map((item) => ({
            section_id: sectionRow.id,
            description: item.description,
            day_rate: item.day_rate,
            num_days: item.num_days,
            total_cost: item.total_cost,
            sort_order: item.sort_order,
          })),
        );

      if (itemsError) {
        throw new Error(`Failed to save line items: ${itemsError.message}`);
      }
    }
  }
}

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
