import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncGmailConnection } from "@/lib/gmail/sync";

export async function POST() {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: connection, error: connectionError } = await admin
    .from("gmail_connections")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (connectionError || !connection) {
    return NextResponse.json(
      { error: "No Gmail connection found" },
      { status: 404 },
    );
  }

  const result = await syncGmailConnection(connection);

  return NextResponse.json(result);
}
