import { Settings } from "lucide-react";
import { GmailConnectionCard } from "@/components/settings/GmailConnectionCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getGmailConnectionStatus } from "@/lib/database/gmail-connections";

interface SettingsPageProps {
  searchParams: Promise<{
    gmail?: string;
    message?: string;
  }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const connection = await getGmailConnectionStatus();

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
        title="Settings"
        description="Configure workspace preferences and integrations."
        icon={Settings}
      />

      <div className="max-w-3xl">
        <GmailConnectionCard
          connection={connection}
          message={gmailMessage}
          error={gmailError}
        />
      </div>
    </>
  );
}
