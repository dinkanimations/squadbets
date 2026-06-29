export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_OAUTH_STATE_COOKIE = "gmail_oauth_state";

export const SYNC_INTERVAL_MINUTES = 5;

export type GmailConnectionStatus = {
  id: string;
  gmail_address: string;
  last_sync_at: string | null;
  last_sync_status: string;
  last_sync_error: string | null;
  is_connected: boolean;
};
