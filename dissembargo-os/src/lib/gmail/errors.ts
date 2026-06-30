const GMAIL_ERROR_MESSAGES: Record<string, string> = {
  missing_google_oauth_env:
    "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local, then restart the dev server.",
  missing_tokens:
    "Google did not return OAuth tokens. Disconnect and reconnect, making sure to approve all permissions.",
  invalid_oauth_state:
    "OAuth session expired. Click Connect Gmail again.",
  missing_email:
    "Could not read your Gmail address from Google.",
};

export function formatGmailIntegrationError(message: string): string {
  if (message in GMAIL_ERROR_MESSAGES) {
    return GMAIL_ERROR_MESSAGES[message];
  }

  if (message.includes("GOOGLE_CLIENT_ID")) {
    return GMAIL_ERROR_MESSAGES.missing_google_oauth_env;
  }

  if (message.includes("redirect_uri_mismatch")) {
    return "Google OAuth redirect URI mismatch. In Google Cloud Console, add this exact redirect URI under your OAuth client: the value shown in Settings → Integrations.";
  }

  return message;
}

export function formatGmailSyncResult(data: {
  status?: string;
  imported?: number;
  skipped?: number;
  historicalImported?: number;
  backfillProcessed?: number;
  potentialOpportunitiesFound?: number;
  error?: string;
}): { message: string; isError: boolean } {
  if (data.status === "error") {
    return {
      isError: true,
      message: data.error ?? "Gmail sync failed.",
    };
  }

  const imported = data.imported ?? 0;
  const historicalImported = data.historicalImported ?? 0;
  const potentialOpportunitiesFound = data.potentialOpportunitiesFound ?? 0;
  const backfillProcessed = data.backfillProcessed ?? 0;

  const parts: string[] = [];

  if (imported > 0) {
    parts.push(
      `imported ${imported} new email${imported === 1 ? "" : "s"}`,
    );
  }

  if (historicalImported > 0) {
    parts.push(
      `pulled ${historicalImported} older email${historicalImported === 1 ? "" : "s"} from Gmail`,
    );
  }

  if (potentialOpportunitiesFound > 0) {
    parts.push(
      `found ${potentialOpportunitiesFound} potential opportunit${potentialOpportunitiesFound === 1 ? "y" : "ies"}`,
    );
  } else if (backfillProcessed > 0) {
    parts.push(`rescanned ${backfillProcessed} older email${backfillProcessed === 1 ? "" : "s"}`);
  }

  if (parts.length === 0) {
    return {
      isError: false,
      message: "Sync complete — inbox is up to date.",
    };
  }

  return {
    isError: false,
    message: `Sync complete — ${parts.join(", ")}.`,
  };
}
