import { QuoteBuilder } from "@/components/quotes/QuoteBuilder";
import { getSettingsAction } from "@/lib/settings/actions";
import { createEmptyQuoteDraftFromSettings } from "@/lib/quotes/constants";

export default async function NewQuotePage() {
  const settings = await getSettingsAction();

  return (
    <QuoteBuilder
      settings={settings}
      initialDraft={createEmptyQuoteDraftFromSettings(settings)}
    />
  );
}
