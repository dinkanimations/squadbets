import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BrandingForm } from "@/components/settings/BrandingForm";
import { getSettingsAction } from "@/lib/settings/actions";

export default async function BrandingSettingsPage() {
  const settings = await getSettingsAction();

  return (
    <>
      <PageHeader
        title="Branding"
        description="Configure logos and PDF branding."
        icon={Settings}
      />
      <BrandingForm settings={settings} />
    </>
  );
}
