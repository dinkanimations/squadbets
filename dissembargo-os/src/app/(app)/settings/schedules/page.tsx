import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ScheduleDefaultsForm } from "@/components/settings/ScheduleDefaultsForm";
import { getSettingsAction } from "@/lib/settings/actions";

export default async function ScheduleSettingsPage() {
  const settings = await getSettingsAction();

  return (
    <>
      <PageHeader
        title="Schedule Defaults"
        description="Configure default production schedule settings."
        icon={Settings}
      />
      <ScheduleDefaultsForm settings={settings} />
    </>
  );
}
