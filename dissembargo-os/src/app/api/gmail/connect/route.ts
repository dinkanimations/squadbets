import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getGmailAuthUrl, hasGoogleOAuthEnv } from "@/lib/gmail/client";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail/constants";
import { getUser } from "@/lib/auth/session";

const INTEGRATIONS_URL = "/settings/integrations";

export async function GET() {
  const { user, error } = await getUser();

  if (error || !user) {
    redirect("/login?redirectTo=/settings/integrations");
  }

  if (!hasGoogleOAuthEnv()) {
    redirect(
      `${INTEGRATIONS_URL}?gmail=error&message=${encodeURIComponent("missing_google_oauth_env")}`,
    );
  }

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();

  cookieStore.set(GMAIL_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  try {
    redirect(getGmailAuthUrl(state));
  } catch (connectError) {
    const message =
      connectError instanceof Error
        ? connectError.message
        : "gmail_connection_failed";

    redirect(
      `${INTEGRATIONS_URL}?gmail=error&message=${encodeURIComponent(message)}`,
    );
  }
}
