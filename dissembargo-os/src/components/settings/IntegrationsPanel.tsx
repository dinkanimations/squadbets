"use client";

import { GmailConnectionCard } from "@/components/settings/GmailConnectionCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { GmailConnectionStatus } from "@/lib/gmail/constants";

interface IntegrationsPanelProps {
  gmailConnections: GmailConnectionStatus[];
  openai: { configured: boolean; model: string };
  supabase: { configured: boolean; url: string | null };
  gmailMessage?: string | null;
  gmailError?: string | null;
}

export function IntegrationsPanel({
  gmailConnections,
  openai,
  supabase,
  gmailMessage,
  gmailError,
}: IntegrationsPanelProps) {
  return (
    <div className="space-y-6">
      <GmailConnectionCard
        connections={gmailConnections}
        message={gmailMessage}
        error={gmailError}
      />

      <Card>
        <CardHeader
          title="OpenAI"
          description="Powers email classification and company intelligence"
        />
        <div className="flex items-center justify-between rounded-lg bg-surface-elevated p-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              API Connection
            </p>
            <p className="text-xs text-muted">
              Model: {openai.model} · Key configured via environment
            </p>
          </div>
          <Badge variant={openai.configured ? "success" : "danger"}>
            {openai.configured ? "Connected" : "Not configured"}
          </Badge>
        </div>
        <p className="mt-3 text-xs text-muted">
          API keys are managed securely via server environment variables and are
          never exposed in the application.
        </p>
      </Card>

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
