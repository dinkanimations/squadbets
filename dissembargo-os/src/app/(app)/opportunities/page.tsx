import { Suspense } from "react";
import { Inbox } from "lucide-react";
import { OpportunitiesPageClient } from "@/components/opportunities/OpportunitiesPageClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { getAllCompanies } from "@/lib/database/companies";
import { getOpportunitiesFiltered } from "@/lib/database/opportunities";
import type { OpportunityStatus } from "@/types/database";
import type { OpportunityWithRelations, SortOrder } from "@/lib/opportunities/constants";
import { OpportunitiesLoading } from "./OpportunitiesLoading";

interface OpportunitiesPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
  }>;
}

export default async function OpportunitiesPage({
  searchParams,
}: OpportunitiesPageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<OpportunitiesLoading />}>
      <OpportunitiesContent params={params} />
    </Suspense>
  );
}

async function OpportunitiesContent({
  params,
}: {
  params: { q?: string; status?: string; sort?: string };
}) {
  const status = params.status as OpportunityStatus | undefined;
  const sort = (params.sort === "asc" ? "asc" : "desc") as SortOrder;
  const hasFilters = Boolean(params.q || params.status);

  let opportunities: OpportunityWithRelations[] = [];
  let companies: Awaited<ReturnType<typeof getAllCompanies>> = [];
  let error: string | null = null;

  try {
    const [opportunitiesResult, companiesResult] = await Promise.all([
      getOpportunitiesFiltered({
        search: params.q,
        status: status || undefined,
        sort,
      }),
      getAllCompanies(),
    ]);

    opportunities = (opportunitiesResult.data ?? []) as OpportunityWithRelations[];
    companies = companiesResult;
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Failed to load opportunities. Check your Supabase connection.";
  }

  return (
    <>
      <PageHeader
        title="Opportunities"
        description="AI-qualified opportunity inbox — review, prioritize, and action incoming business potential."
        icon={Inbox}
      />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : (
        <>
          <OpportunitiesPageClient
            opportunities={opportunities}
            companies={companies}
            hasFilters={hasFilters}
          />
        </>
      )}
    </>
  );
}
