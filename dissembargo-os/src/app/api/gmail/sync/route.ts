import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import {
  getGmailConnectionById,
  getUserGmailConnectionsForSync,
} from "@/lib/database/gmail-connections";
import { syncGmailConnection, syncUserGmailConnections } from "@/lib/gmail/sync";
import { hasGoogleOAuthEnv } from "@/lib/gmail/client";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasGoogleOAuthEnv()) {
    return NextResponse.json(
      {
        error:
          "Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local.",
      },
      { status: 503 },
    );
  }

  let connectionId: string | null = null;

  try {
    const body = await request.json();
    connectionId =
      typeof body?.connectionId === "string" ? body.connectionId : null;
  } catch {
    connectionId = null;
  }

  if (connectionId) {
    const connection = await getGmailConnectionById(connectionId, user.id);

    if (!connection) {
      return NextResponse.json(
        { error: "Gmail connection not found" },
        { status: 404 },
      );
    }

    const result = await syncGmailConnection(connection);
    return NextResponse.json(result);
  }

  const connections = await getUserGmailConnectionsForSync(user.id);

  if (connections.length === 0) {
    return NextResponse.json(
      { error: "No Gmail accounts connected" },
      { status: 404 },
    );
  }

  const results = await syncUserGmailConnections(user.id);
  const imported = results.reduce((sum, item) => sum + item.imported, 0);
  const skipped = results.reduce((sum, item) => sum + item.skipped, 0);
  const hasError = results.some((item) => item.status === "error");

  return NextResponse.json({
    imported,
    skipped,
    status: hasError ? "error" : "success",
    results,
  });
}
