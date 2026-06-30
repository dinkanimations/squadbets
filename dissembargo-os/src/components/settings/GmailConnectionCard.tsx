"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mail, RefreshCw, Unplug } from "lucide-react";
import type { GmailConnectionStatus } from "@/lib/gmail/constants";
import {
  GMAIL_SYNC_STATUS_LABELS,
  SYNC_INTERVAL_MINUTES,
  getGmailSyncStatusLabel,
} from "@/lib/gmail/constants";
import { formatGmailSyncResult } from "@/lib/gmail/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/inbox/utils";

interface GmailConnectionCardProps {
  connections: GmailConnectionStatus[];
  google: {
    configured: boolean;
    redirectUri: string;
    serviceRoleConfigured: boolean;
  };
  message?: string | null;
  error?: string | null;
}

function ConnectGmailButton({ label }: { label: string }) {
  return (
    <Button
      className="h-12 px-8 text-base"
      onClick={() => {
        window.location.href = "/api/gmail/connect";
      }}
    >
      <Mail className="h-5 w-5" />
      {label}
    </Button>
  );
}

function AccountRow({
  connection,
  onSyncComplete,
}: {
  connection: GmailConnectionStatus;
  onSyncComplete: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = () => {
    setSyncMessage(null);
    setSyncError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/gmail/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId: connection.id }),
        });
        const data = await response.json();

        if (!response.ok) {
          setSyncError(data.error ?? "Sync failed");
          return;
        }

        const result = formatGmailSyncResult(data);
        if (result.isError) {
          setSyncError(result.message);
          onSyncComplete();
          return;
        }

        if (result.isWarning) {
          setSyncError(result.message);
        } else {
          setSyncMessage(result.message);
        }
        onSyncComplete();
      } catch {
        setSyncError("Unable to sync this account right now.");
      }
    });
  };

  const statusVariant =
    connection.last_sync_status === "success"
      ? "success"
      : connection.last_sync_status === "error"
        ? "danger"
        : connection.last_sync_status === "syncing"
          ? "warning"
          : "default";

  return (
    <div className="rounded-xl border border-border bg-surface-elevated/40 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Mail className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {connection.gmail_address}
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Last synced{" "}
              {connection.last_sync_at
                ? formatDateTime(connection.last_sync_at)
                : "never"}
            </p>
            <div className="mt-2">
              <Badge variant={statusVariant}>
                {getGmailSyncStatusLabel(connection.last_sync_status)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSync} disabled={isPending} size="sm">
            <RefreshCw className="h-4 w-4" />
            {isPending ? "Syncing..." : "Sync Now"}
          </Button>
          <form action="/api/gmail/disconnect" method="POST">
            <input type="hidden" name="connectionId" value={connection.id} />
            <Button type="submit" variant="danger" size="sm">
              <Unplug className="h-4 w-4" />
              Disconnect
            </Button>
          </form>
        </div>
      </div>

      {connection.last_sync_error && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {connection.last_sync_error}
        </p>
      )}

      {syncMessage && (
        <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {syncMessage}
        </p>
      )}

      {syncError && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {syncError}
        </p>
      )}
    </div>
  );
}

export function GmailConnectionCard({
  connections,
  google,
  message,
  error,
}: GmailConnectionCardProps) {
  const router = useRouter();
  const [isSyncingAll, startSyncAll] = useTransition();
  const [syncAllMessage, setSyncAllMessage] = useState<string | null>(null);
  const [syncAllError, setSyncAllError] = useState<string | null>(null);

  const handleSyncAll = () => {
    setSyncAllMessage(null);
    setSyncAllError(null);

    startSyncAll(async () => {
      try {
        const response = await fetch("/api/gmail/sync", { method: "POST" });
        const data = await response.json();

        if (!response.ok) {
          setSyncAllError(data.error ?? "Sync failed");
          return;
        }

        const result = formatGmailSyncResult(data);
        if (result.isError) {
          setSyncAllError(result.message);
          router.refresh();
          return;
        }

        if (result.isWarning) {
          setSyncAllError(result.message);
        } else {
          setSyncAllMessage(result.message);
        }
        router.refresh();
      } catch {
        setSyncAllError("Unable to sync Gmail accounts right now.");
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Gmail"
        description={`Import business enquiries automatically. Syncs every ${SYNC_INTERVAL_MINUTES} minutes. Read-only access — your Gmail is never modified.`}
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

      {!google.configured && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium text-foreground">Google OAuth not configured</p>
          <p className="mt-1 text-muted">
            Add <code className="rounded bg-surface px-1">GOOGLE_CLIENT_ID</code>{" "}
            and <code className="rounded bg-surface px-1">GOOGLE_CLIENT_SECRET</code>{" "}
            to <code className="rounded bg-surface px-1">.env.local</code>, then restart{" "}
            <code className="rounded bg-surface px-1">npm run dev</code>.
          </p>
          <p className="mt-2 text-xs text-muted">
            Redirect URI for Google Cloud Console:{" "}
            <code className="break-all">{google.redirectUri}</code>
          </p>
        </div>
      )}

      {google.configured && !google.serviceRoleConfigured && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          Missing <code>SUPABASE_SERVICE_ROLE_KEY</code> — Gmail sync cannot save
          tokens or import emails without it.
        </p>
      )}

      {syncAllMessage && (
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {syncAllMessage}
        </p>
      )}

      {syncAllError && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {syncAllError}
        </p>
      )}

      <div className="mb-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ConnectGmailButton
          label={
            connections.length === 0
              ? "Connect Gmail Account"
              : "Connect Another Account"
          }
        />
        {connections.length > 1 && (
          <Button
            variant="secondary"
            onClick={handleSyncAll}
            disabled={isSyncingAll}
          >
            <RefreshCw className="h-4 w-4" />
            {isSyncingAll ? "Syncing all..." : "Sync All Accounts"}
          </Button>
        )}
      </div>

      {connections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm text-muted">
            Connect a Gmail account to start importing emails. Sign in with
            Google, approve read-only access, and syncing begins automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Connected Accounts ({connections.length})
          </p>
          {connections.map((connection) => (
            <AccountRow
              key={connection.id}
              connection={connection}
              onSyncComplete={() => router.refresh()}
            />
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-muted">
        Status: {Object.values(GMAIL_SYNC_STATUS_LABELS).join(" · ")}. On local
        dev, use <strong>Sync Now</strong> — automatic 5-minute sync runs when
        deployed to Vercel with <code>CRON_SECRET</code> set.
      </p>
    </Card>
  );
}
