import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { getCompaniesForQuoteAction } from "@/lib/quotes/actions";

export default async function NewQuotePage() {
  const companies = await getCompaniesForQuoteAction();

  return <QuoteBuilder mode="create" companies={companies} />;
}
