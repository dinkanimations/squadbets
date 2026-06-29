import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { getCompaniesForQuoteAction, getContactsForQuoteAction, getOpportunitiesForQuoteAction } from "@/lib/quotes/actions";
import { getQuoteFullById } from "@/lib/database/quotes";
import {
  createEmptyDeliverable,
  createDefaultBudgetSections,
} from "@/lib/quotes/constants";
import { quoteToFormDraft } from "@/lib/quotes/utils";

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = await params;

  let quote;
  let companies;
  let contacts: Awaited<ReturnType<typeof getContactsForQuoteAction>> = [];
  let opportunities: Awaited<ReturnType<typeof getOpportunitiesForQuoteAction>> = [];

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

  if (quote.company_id) {
    [contacts, opportunities] = await Promise.all([
      getContactsForQuoteAction(quote.company_id),
      getOpportunitiesForQuoteAction(quote.company_id),
    ]);
  }

  const formDraft = quoteToFormDraft(quote);

  if (formDraft.deliverables.length === 0) {
    formDraft.deliverables = [createEmptyDeliverable()];
  }
  if (formDraft.budgetSections.length === 0) {
    formDraft.budgetSections = createDefaultBudgetSections();
  }

  return (
    <QuoteBuilder
      mode="edit"
      quoteId={id}
      quoteNumber={quote.quote_number}
      createdAt={quote.created_at}
      initialDraft={formDraft}
      companies={companies}
      initialContacts={contacts}
      initialOpportunities={opportunities}
    />
  );
}
