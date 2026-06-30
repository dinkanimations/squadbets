import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface SchemaSetupBannerProps {
  projectRef?: string | null;
}

export function SchemaSetupBanner({ projectRef }: SchemaSetupBannerProps) {
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : "https://supabase.com/dashboard";

  return (
    <Card className="mb-6 border-amber-500/40 bg-amber-500/10 p-5">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground">
              Database setup required
            </p>
            <p className="mt-1 text-muted">
              The app is connected to Supabase, but the database tables have not
              been created yet. Pages like Quotes will not work until migrations
              are applied.
            </p>
          </div>

          <div>
            <p className="font-medium text-foreground">Option A — SQL Editor (fastest)</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-muted">
              <li>
                Open the{" "}
                <a
                  href={sqlEditorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  Supabase SQL Editor
                </a>
              </li>
              <li>
                Run <code className="rounded bg-surface px-1">npm run db:bundle</code>{" "}
                in the project, then paste the contents of{" "}
                <code className="rounded bg-surface px-1">supabase/migrations-bundle.sql</code>
              </li>
              <li>Click Run, then refresh this page</li>
            </ol>
          </div>

          <div>
            <p className="font-medium text-foreground">Option B — CLI</p>
            <p className="mt-1 text-muted">
              Add <code className="rounded bg-surface px-1">SUPABASE_DB_PASSWORD</code> to{" "}
              <code className="rounded bg-surface px-1">.env.local</code>, then run{" "}
              <code className="rounded bg-surface px-1">npm run db:apply</code>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
