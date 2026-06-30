export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";

export const SYNC_INTERVAL_MINUTES = 5;

/** Cap first-time inbox imports to avoid serverless timeouts on large mailboxes. */
export const INITIAL_SYNC_MAX_MESSAGES = 100;

/** How many Gmail inbox messages to scan per sync for older mail not yet imported. */
export const HISTORICAL_IMPORT_BATCH_SIZE = 200;

/** Per manual sync — keep small to avoid serverless timeouts. */
export const SYNC_HISTORICAL_IMPORT_LIMIT = 40;

/** How many emails to run through OpenAI per sync click. */
export const SYNC_AI_PROCESS_LIMIT = 15;

/** How many failed emails to reset and rescan when backlog detected. */
export const SYNC_RESCAN_FAILED_LIMIT = 20;

/** How many previously imported emails to reprocess per sync for potential opportunities. */
export const BACKFILL_BATCH_SIZE = 10;

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
