import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createOAuth2Client } from "@/lib/gmail/client";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail/constants";
import { syncGmailConnection } from "@/lib/gmail/sync";
import { upsertGmailConnection } from "@/lib/database/gmail-connections";
import { getUser } from "@/lib/auth/session";

const INTEGRATIONS_URL = "/settings/integrations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError) {
    redirect(
      `${INTEGRATIONS_URL}?gmail=error&message=${encodeURIComponent(oauthError)}`,
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get(GMAIL_OAUTH_STATE_COOKIE)?.value;

  cookieStore.delete(GMAIL_OAUTH_STATE_COOKIE);

  if (!code || !state || !storedState || state !== storedState) {
    redirect(`${INTEGRATIONS_URL}?gmail=error&message=invalid_oauth_state`);
  }

  const { user, error: authError } = await getUser();

  if (authError || !user) {
    redirect("/login?redirectTo=/settings/integrations");
  }

  try {
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      redirect(`${INTEGRATIONS_URL}?gmail=error&message=missing_tokens`);
    }

    oauth2Client.setCredentials(tokens);

    const gmail = await import("googleapis").then(({ google }) =>
      google.gmail({ version: "v1", auth: oauth2Client }),
    );

    const profile = await gmail.users.getProfile({ userId: "me" });
    const gmailAddress = profile.data.emailAddress;

    if (!gmailAddress) {
      redirect(`${INTEGRATIONS_URL}?gmail=error&message=missing_email`);
    }

    const connection = await upsertGmailConnection({
      user_id: user.id,
      gmail_address: gmailAddress,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: tokens.expiry_date
        ? new Date(tokens.expiry_date).toISOString()
        : null,
      history_id: profile.data.historyId ?? null,
      last_sync_status: "pending",
      last_sync_error: null,
    });

    await syncGmailConnection(connection);

    redirect(`${INTEGRATIONS_URL}?gmail=connected`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "gmail_connection_failed";
    redirect(
      `${INTEGRATIONS_URL}?gmail=error&message=${encodeURIComponent(message)}`,
    );
  }
}
