import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { getCompaniesForQuoteAction } from "@/lib/quotes/actions";
import { getQuoteFullById } from "@/lib/database/quotes";
import {
  createEmptyDeliverable,
  createBudgetSectionsFromNames,
} from "@/lib/quotes/constants";
import { getSettingsAction } from "@/lib/settings/actions";
import { quoteToFormDraft } from "@/lib/quotes/utils";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;

  let quote;
  let companies;

  try {
    [quote, companies] = await Promise.all([
      getQuoteFullById(id),
      getCompaniesForQuoteAction(),
    ]);
  } catch {
    notFound();
  }

  if (!quote) {
    notFound();
  }

  const formDraft = quoteToFormDraft(quote);
  const settings = await getSettingsAction();

  if (formDraft.deliverables.length === 0) {
    formDraft.deliverables = [createEmptyDeliverable()];
  }
  if (formDraft.budgetSections.length === 0) {
    formDraft.budgetSections = createBudgetSectionsFromNames(
      settings.defaultBudgetSections,
      settings.defaultDayRates,
    );
  }

  return (
    <QuoteBuilder
      quoteId={id}
      quoteNumber={quote.quote_number}
      createdAt={quote.created_at}
      initialDraft={formDraft}
      companies={companies}
      settings={settings}
    />
  );
}
