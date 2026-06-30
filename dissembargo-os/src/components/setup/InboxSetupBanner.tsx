"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { INBOX_SETUP_SQL } from "@/lib/constants/inbox-setup-sql";

interface InboxSetupBannerProps {
  projectRef: string | null;
}

export function InboxSetupBanner({ projectRef }: InboxSetupBannerProps) {
  const [copied, setCopied] = useState(false);

  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : "https://supabase.com/dashboard";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(INBOX_SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card className="mb-6 border-amber-500/40 bg-amber-500/10 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="min-w-0 flex-1 space-y-4 text-sm">
          <div>
            <p className="font-medium text-foreground">
              Inbox database setup required
            </p>
            <p className="mt-1 text-muted">
              Gmail sync is working, but the{" "}
              <code className="rounded bg-surface px-1">potential_opportunities</code>{" "}
              table is missing. The Inbox cannot show AI-detected leads until you
              run this one-time SQL script.
            </p>
          </div>

          <ol className="list-decimal space-y-2 pl-5 text-muted">
            <li>
              Click{" "}
              <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy SQL
                  </>
                )}
              </Button>
            </li>
            <li>
              Open{" "}
              <a
                href={sqlEditorUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
              >
                Supabase SQL Editor
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </li>
            <li>Paste the SQL and click Run</li>
            <li>Return here and click Sync Gmail again</li>
          </ol>

          <details className="rounded-lg border border-border bg-surface/60">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted">
              Show SQL preview
            </summary>
            <pre className="max-h-48 overflow-auto p-3 text-xs text-foreground">
              {INBOX_SETUP_SQL}
            </pre>
          </details>
        </div>
      </div>
    </Card>
  );
}
