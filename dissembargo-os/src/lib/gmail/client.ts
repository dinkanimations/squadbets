import { google } from "googleapis";
import { GMAIL_READONLY_SCOPE } from "./constants";

function normalizeSiteUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function hasGoogleOAuthEnv(): boolean {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) return false;

  const placeholders = [
    /^your[-_]/i,
    /^YOUR_/i,
    /^xxx+$/i,
    /^changeme$/i,
  ];

  return !placeholders.some(
    (pattern) => pattern.test(clientId) || pattern.test(clientSecret),
  );
}

export function getGoogleOAuthRedirectUri() {
  const siteUrl = normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  );

  return `${siteUrl}/api/gmail/callback`;
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!hasGoogleOAuthEnv() || !clientId || !clientSecret) {
    throw new Error(
      "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.",
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri: getGoogleOAuthRedirectUri(),
  };
}

export function createOAuth2Client() {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailAuthUrl(state: string) {
  const oauth2Client = createOAuth2Client();

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_READONLY_SCOPE],
    state,
  });
}

export function createGmailClient(accessToken: string, refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new Error(
        "Google did not return a new access token. Disconnect and reconnect Gmail.",
      );
    }

    return {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : null,
    };
  } catch (error) {
    const { formatSyncError } = await import("./sync-errors");
    throw new Error(formatSyncError(error));
  }
}

export async function getGmailProfile(accessToken: string, refreshToken: string) {
  const gmail = createGmailClient(accessToken, refreshToken);
  const profile = await gmail.users.getProfile({ userId: "me" });
  return profile.data;
}
