import { Suspense } from "react";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuotesTable } from "@/components/quotes/QuotesTable";
import { QuotesToolbar } from "@/components/quotes/QuotesToolbar";
import { getQuotesFiltered } from "@/lib/database/quotes";
import type { QuoteStatus } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface QuotesPageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const { data: quotes } = await getQuotesFiltered({
    search: params.search,
    status: params.status as QuoteStatus | undefined,
  });

  const hasFilters = Boolean(params.search || params.status);

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Create, edit, and manage project quotations."
        icon={FileText}
      />

      <Suspense fallback={null}>
        <QuotesToolbar />
      </Suspense>

      {quotes.length > 0 ? (
        <QuotesTable quotes={quotes} />
      ) : (
        <EmptyState
          title={hasFilters ? "No matching quotes" : "No quotes yet"}
          description={
            hasFilters
              ? "Try adjusting your search or filter criteria."
              : "Create your first quote to start building project budgets."
          }
          action={
            !hasFilters ? (
              <Link href="/quotes/new">
                <Button>New Quote</Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </>
  );
}
