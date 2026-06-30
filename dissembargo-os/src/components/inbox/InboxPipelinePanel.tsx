"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import type { PipelineDiagnostics } from "@/lib/database/pipeline-diagnostics";

export function InboxPipelinePanel() {
  const router = useRouter();
  const [diagnostics, setDiagnostics] = useState<PipelineDiagnostics | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const [isReprocessing, startReprocess] = useTransition();

  const loadDiagnostics = useCallback(() => {
    startLoad(async () => {
      try {
        const response = await fetch("/api/inbox/diagnostics");
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "Failed to load pipeline status");
          return;
        }
        setDiagnostics(data);
      } catch {
        setError("Unable to load pipeline status.");
      }
    });
  }, []);

  useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const handleReprocess = (scope: "unprocessed" | "all") => {
    setMessage(null);
    setError(null);

    startReprocess(async () => {
      try {
        const response = await fetch("/api/inbox/reprocess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 25, scope }),
        });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Reprocess failed");
          loadDiagnostics();
          return;
        }

        const parts = [
          `processed ${data.processed}`,
          data.leadsFound > 0 ? `found ${data.leadsFound} leads` : null,
          data.opportunitiesCreated > 0
            ? `created ${data.opportunitiesCreated} opportunities`
            : null,
          data.failed > 0 ? `${data.failed} failed` : null,
        ].filter(Boolean);

        setMessage(`Reprocess complete — ${parts.join(", ")}.`);
        loadDiagnostics();
        router.refresh();
      } catch {
        setError("Unable to reprocess imported emails right now.");
      }
    });
  };

  const waiting = diagnostics?.waitingForProcessing ?? 0;

  return (
    <Card className="mb-6">
      <CardHeader
        title="Pipeline status"
        description="Gmail import → AI classification → Opportunities & Companies"
      />

      {diagnostics ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Gmail imported" value={diagnostics.gmailImported} />
          <Stat label="Waiting for AI" value={waiting} highlight={waiting > 0} />
          <Stat label="Classified" value={diagnostics.classified} />
          <Stat label="Ignored (noise)" value={diagnostics.ignored} />
          <Stat label="Inbox leads" value={diagnostics.stagedLeads} />
          <Stat label="Opportunities" value={diagnostics.opportunitiesCreated} />
          <Stat label="Companies" value={diagnostics.companiesCreated} />
          <Stat label="Clients" value={diagnostics.clientsCreated} />
        </div>
      ) : (
        <p className="text-sm text-muted">
          {isLoading ? "Loading pipeline status..." : "No pipeline data yet."}
        </p>
      )}

      {diagnostics?.pipelineBlocked ? (
        <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          Pipeline blocked: {diagnostics.pipelineBlockedReason}
        </p>
      ) : null}

      {diagnostics && diagnostics.failed > 0 ? (
        <div className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          <p className="font-medium">{diagnostics.failed} AI failures</p>
          <ul className="mt-1 list-inside list-disc text-xs">
            {Object.entries(diagnostics.failureReasons).map(([reason, count]) => (
              <li key={reason}>
                {count}× {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          onClick={() => handleReprocess("unprocessed")}
          disabled={isReprocessing || diagnostics?.pipelineBlocked}
        >
          <RefreshCw className="h-4 w-4" />
          {isReprocessing ? "Reprocessing..." : "Reprocess imported emails"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleReprocess("all")}
          disabled={isReprocessing || diagnostics?.pipelineBlocked}
        >
          Full rerun (no Gmail sync)
        </Button>
        <Button variant="secondary" onClick={loadDiagnostics} disabled={isLoading}>
          Refresh status
        </Button>
      </div>

      {waiting > 0 && !diagnostics?.pipelineBlocked ? (
        <p className="mt-2 text-xs text-muted">
          {waiting} email{waiting === 1 ? "" : "s"} still need AI — click
          Reprocess repeatedly (25 per batch) until the queue clears.
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </Card>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-surface-elevated/40"
      }`}
    >
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
