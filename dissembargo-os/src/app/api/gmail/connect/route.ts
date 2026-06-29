import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getGmailAuthUrl } from "@/lib/gmail/client";
import { GMAIL_OAUTH_STATE_COOKIE } from "@/lib/gmail/constants";
import { getUser } from "@/lib/auth/session";

export async function GET() {
  const { user, error } = await getUser();

  if (error || !user) {
    redirect("/login?redirectTo=/settings");
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

  redirect(getGmailAuthUrl(state));
}
