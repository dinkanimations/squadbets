import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuoteDefaultsForm } from "@/components/settings/QuoteDefaultsForm";
import { getSettingsAction } from "@/lib/settings/actions";

export default async function QuoteSettingsPage() {
  const settings = await getSettingsAction();

  return (
    <>
      <PageHeader
        title="Quote Defaults"
        description="Configure default values for new quotations."
        icon={Settings}
      />
      <QuoteDefaultsForm settings={settings} />
    </>
  );
}
