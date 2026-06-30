"use client";

import { GmailConnectionCard } from "@/components/settings/GmailConnectionCard";
import { OpenAIConnectionCard } from "@/components/settings/OpenAIConnectionCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { GmailConnectionStatus } from "@/lib/gmail/constants";

interface IntegrationsPanelProps {
  gmailConnections: GmailConnectionStatus[];
  google: {
    configured: boolean;
    redirectUri: string;
    serviceRoleConfigured: boolean;
  };
  supabase: { configured: boolean; url: string | null };
  gmailMessage?: string | null;
  gmailError?: string | null;
}

export function IntegrationsPanel({
  gmailConnections,
  google,
  supabase,
  gmailMessage,
  gmailError,
}: IntegrationsPanelProps) {
  return (
    <div className="space-y-6">
      <GmailConnectionCard
        connections={gmailConnections}
        google={google}
        message={gmailMessage}
        error={gmailError}
      />

      <OpenAIConnectionCard />

      <Card>
        <CardHeader
          title="Supabase"
          description="Database, authentication, and file storage"
        />
        <div className="flex items-center justify-between rounded-lg bg-surface-elevated p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Backend Services
            </p>
            <p className="truncate text-xs text-muted">
              {supabase.url ?? "URL not configured"}
            </p>
          </div>
          <Badge variant={supabase.configured ? "success" : "danger"}>
            {supabase.configured ? "Connected" : "Not configured"}
          </Badge>
        </div>
      </Card>
    </div>
  );
}
