"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InboxRescanButtonProps {
  label?: string;
  pendingCount?: number;
}

export function InboxRescanButton({
  label = "Scan mailbox",
  pendingCount,
}: InboxRescanButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRescan = () => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/inbox/rescan", { method: "POST" });
        const data = await response.json();

        if (!response.ok) {
          setError(data.error ?? "Scan failed");
          return;
        }

        const parts: string[] = [];
        if (data.processed > 0) {
          parts.push(
            `scanned ${data.processed} email${data.processed === 1 ? "" : "s"}`,
          );
        }
        if (data.leadsFound > 0) {
          parts.push(
            `found ${data.leadsFound} lead${data.leadsFound === 1 ? "" : "s"}`,
          );
        }

        if (parts.length === 0) {
          setMessage("Scan complete — no new leads in this batch.");
        } else {
          setMessage(`Scan complete — ${parts.join(", ")}.`);
        }

        if (data.failed > 0) {
          setError(
            `${data.failed} email${data.failed === 1 ? "" : "s"} failed AI processing. Check your OpenAI API key and quota, then scan again.`,
          );
        }

        router.refresh();
      } catch {
        setError("Unable to scan your mailbox right now.");
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Button onClick={handleRescan} disabled={isPending}>
        <ScanSearch className="h-4 w-4" />
        {isPending ? "Scanning..." : label}
      </Button>

      {pendingCount !== undefined && pendingCount > 0 && !isPending && (
        <p className="text-xs text-muted">
          {pendingCount} email{pendingCount === 1 ? "" : "s"} still need scanning
          — click again to continue.
        </p>
      )}

      {message && (
        <p className="max-w-md rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      )}

      {error && (
        <p className="max-w-md rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
