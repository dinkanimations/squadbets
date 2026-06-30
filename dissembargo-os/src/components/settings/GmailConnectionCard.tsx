"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mail, RefreshCw, Unplug } from "lucide-react";
import type { GmailConnectionStatus } from "@/lib/gmail/constants";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/inbox/utils";

interface GmailConnectionCardProps {
  connection: GmailConnectionStatus | null;
  message?: string | null;
  error?: string | null;
}

export function GmailConnectionCard({
  connection,
  message,
  error,
}: GmailConnectionCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = () => {
    setSyncMessage(null);
    setSyncError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/gmail/sync", { method: "POST" });
        const data = await response.json();

        if (!response.ok) {
          setSyncError(data.error ?? "Sync failed");
          return;
        }

        setSyncMessage(
          `Imported ${data.imported} email${data.imported === 1 ? "" : "s"}.`,
        );
        router.refresh();
      } catch {
        setSyncError("Unable to sync Gmail right now.");
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Gmail Integration"
        description="Connect Gmail to import inbox emails for review. Read-only access only."
      />

      {message && (
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {syncMessage && (
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {syncMessage}
        </p>
      )}

      {syncError && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {syncError}
        </p>
      )}

      {connection ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-surface-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {connection.gmail_address}
                </p>
                <p className="text-xs text-muted">
                  Last synced{" "}
                  {connection.last_sync_at
                    ? formatDateTime(connection.last_sync_at)
                    : "never"}
                </p>
              </div>
            </div>
            <Badge
              variant={
                connection.last_sync_status === "success"
                  ? "success"
                  : connection.last_sync_status === "error"
                    ? "danger"
                    : "default"
              }
            >
              {connection.last_sync_status}
            </Badge>
          </div>

          {connection.last_sync_error && (
            <p className="text-sm text-danger">{connection.last_sync_error}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSync} disabled={isPending}>
              <RefreshCw className="h-4 w-4" />
              {isPending ? "Syncing..." : "Sync now"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = "/api/gmail/connect";
              }}
            >
              Reconnect
            </Button>
            <form action="/api/gmail/disconnect" method="POST">
              <Button type="submit" variant="danger">
                <Unplug className="h-4 w-4" />
                Disconnect
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted">
            No Gmail account connected. Connect to start importing inbox emails
            every 5 minutes.
          </p>
          <Button onClick={() => { window.location.href = "/api/gmail/connect"; }}>
            <Mail className="h-4 w-4" />
            Connect Gmail
          </Button>
        </div>
      )}
    </Card>
  );
}
