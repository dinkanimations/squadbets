import { Suspense } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompaniesTable } from "@/components/companies/CompaniesTable";
import { CompaniesToolbar } from "@/components/companies/CompaniesToolbar";
import { getCompaniesFiltered } from "@/lib/database/companies";
import { Building2 } from "lucide-react";

interface CompaniesPageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function CompaniesPage({
  searchParams,
}: CompaniesPageProps) {
  const params = await searchParams;
  const { data: companies } = await getCompaniesFiltered({
    search: params.search,
  });

  return (
    <>
      <PageHeader
        title="Companies"
        description="AI-enriched company profiles linked to your opportunities."
        icon={Building2}
      />

      <Suspense fallback={null}>
        <CompaniesToolbar />
      </Suspense>

      {companies.length > 0 ? (
        <CompaniesTable companies={companies} />
      ) : (
        <EmptyState
          title={params.search ? "No matching companies" : "No companies yet"}
          description={
            params.search
              ? "Try adjusting your search criteria."
              : "Companies are created automatically when new opportunities are detected."
          }
        />
      )}
    </>
  );
}
