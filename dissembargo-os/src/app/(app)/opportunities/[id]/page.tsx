import { notFound } from "next/navigation";
import { OpportunityDetailClient } from "@/components/opportunities/OpportunityDetailClient";
import { getAllCompanies } from "@/lib/database/companies";
import { getOpportunityById } from "@/lib/database/opportunities";
import type { OpportunityWithRelations } from "@/lib/opportunities/constants";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;

  let opportunity: OpportunityWithRelations | null = null;
  let companies: Awaited<ReturnType<typeof getAllCompanies>> = [];

  try {
    const [opportunityResult, companiesResult] = await Promise.all([
      getOpportunityById(id),
      getAllCompanies(),
    ]);

    opportunity = opportunityResult as OpportunityWithRelations;
    companies = companiesResult;
  } catch {
    notFound();
  }

  if (!opportunity) {
    notFound();
  }

  return (
    <OpportunityDetailClient
      opportunity={opportunity}
      companies={companies}
    />
  );
}
