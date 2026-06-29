import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { getCompaniesForQuoteAction } from "@/lib/quotes/actions";
import { getSettingsAction } from "@/lib/settings/actions";
import { createEmptyQuoteDraftFromSettings } from "@/lib/quotes/constants";

export default async function NewQuotePage() {
  const [companies, settings] = await Promise.all([
    getCompaniesForQuoteAction(),
    getSettingsAction(),
  ]);

    return (
    <QuoteBuilder
      companies={companies}
      settings={settings}
      initialDraft={createEmptyQuoteDraftFromSettings(settings)}
    />
  );
}
