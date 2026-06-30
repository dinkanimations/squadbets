import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { getSettingsAction } from "@/lib/settings/actions";

export default async function NotificationsSettingsPage() {
  const settings = await getSettingsAction();

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Configure notification preferences."
        icon={Settings}
      />
      <NotificationsForm settings={settings} />
    </>
  );
}
