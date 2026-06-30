import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { getIntegrationStatusAction } from "@/lib/settings/actions";

interface IntegrationsPageProps {
  searchParams: Promise<{
    gmail?: string;
    message?: string;
  }>;
}

export default async function IntegrationsSettingsPage({
  searchParams,
}: IntegrationsPageProps) {
  const params = await searchParams;
  const status = await getIntegrationStatusAction();

  let gmailMessage: string | null = null;
  let gmailError: string | null = null;

  if (params.gmail === "connected") {
    gmailMessage = "Gmail connected successfully. Initial sync started.";
  } else if (params.gmail === "disconnected") {
    gmailMessage = "Gmail account disconnected.";
  } else if (params.gmail === "error") {
    gmailError = params.message
      ? decodeURIComponent(params.message)
      : "Gmail connection failed.";
  }

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Manage third-party service connections."
        icon={Settings}
      />
      <IntegrationsPanel
        gmail={status.gmail}
        openai={status.openai}
        supabase={status.supabase}
        gmailMessage={gmailMessage}
        gmailError={gmailError}
      />
    </>
  );
}
