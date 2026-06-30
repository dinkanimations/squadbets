const GMAIL_SYNC_ERROR_HINTS: Record<string, string> = {
  PGRST205:
    "Database tables are missing. Run the latest migrations in Supabase SQL Editor (see supabase/migrations-bundle.sql).",
  "42P01":
    "Database tables are missing. Run the latest migrations in Supabase SQL Editor.",
  invalid_grant:
    "Gmail access expired. Disconnect this account and connect Gmail again.",
  unauthorized_client:
    "Google OAuth misconfiguration. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
};

export function formatSyncError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return enrichSyncErrorMessage(error.message);
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;

    if (typeof record.message === "string" && record.message) {
      const code =
        typeof record.code === "string" ? record.code : undefined;
      const message = record.message;
      const details =
        typeof record.details === "string" ? record.details : undefined;
      const hint =
        typeof record.hint === "string" ? record.hint : undefined;

      const parts = [message];
      if (code) parts.push(`(${code})`);
      if (details) parts.push(`— ${details}`);
      if (hint) parts.push(`— ${hint}`);

      return enrichSyncErrorMessage(parts.join(" "));
    }

    const response = record.response;
    if (response && typeof response === "object") {
      const data = (response as { data?: { error?: { message?: string } } })
        .data?.error?.message;
      if (data) return enrichSyncErrorMessage(data);
    }
  }

  return "Gmail sync failed. Check Settings → Integrations for details.";
}

function enrichSyncErrorMessage(message: string): string {
  for (const [key, hint] of Object.entries(GMAIL_SYNC_ERROR_HINTS)) {
    if (message.includes(key)) {
      return `${message} ${hint}`;
    }
  }

  if (message.includes("Could not find the table")) {
    return `${message} Run supabase/migrations-bundle.sql in the Supabase SQL Editor.`;
  }

  if (message.includes("historical_import_page_token")) {
    return `${message} Apply migration 20260701000002_gmail_historical_import_cursor.sql.`;
  }

  return message;
}
