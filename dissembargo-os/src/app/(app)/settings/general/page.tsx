import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { getSettingsAction } from "@/lib/settings/actions";

export default async function GeneralSettingsPage() {
  const settings = await getSettingsAction();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure workspace preferences and defaults."
        icon={Settings}
      />
      <GeneralSettingsForm settings={settings} />
    </>
  );
}
