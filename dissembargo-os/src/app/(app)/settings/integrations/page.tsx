import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { getIntegrationStatusAction } from "@/lib/settings/actions";
import { formatGmailIntegrationError } from "@/lib/gmail/errors";

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
      ? formatGmailIntegrationError(decodeURIComponent(params.message))
      : "Gmail connection failed.";
  }

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect Gmail and third-party services to power your workflow."
        icon={Settings}
      />
      <IntegrationsPanel
        gmailConnections={status.gmail}
        google={status.google}
        openai={status.openai}
        supabase={status.supabase}
        gmailMessage={gmailMessage}
        gmailError={gmailError}
      />
    </>
  );
}
