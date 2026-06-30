export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";

export const SYNC_INTERVAL_MINUTES = 5;

/** Cap first-time inbox imports to avoid serverless timeouts on large mailboxes. */
export const INITIAL_SYNC_MAX_MESSAGES = 100;

export type GmailConnectionStatus = {
  id: string;
  gmail_address: string;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_error: string | null;
  is_connected: boolean;
};

export const GMAIL_SYNC_STATUS_LABELS: Record<string, string> = {
  success: "Connected",
  error: "Error",
  pending: "Pending",
  syncing: "Syncing",
};

export function getGmailSyncStatusLabel(status: string): string {
  return GMAIL_SYNC_STATUS_LABELS[status] ?? status;
}
