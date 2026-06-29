import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  GmailConnection,
  GmailConnectionInsert,
} from "@/types/database";
import type { GmailConnectionStatus } from "@/lib/gmail/constants";
import { handleDatabaseError } from "./utils";

const CONNECTION_STATUS_FIELDS =
  "id, gmail_address, last_sync_at, last_sync_status, last_sync_error";

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("gmail_connections")
    .select(CONNECTION_STATUS_FIELDS)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) handleDatabaseError(error, "Failed to fetch Gmail connection");

  if (!data) return null;

  return {
    ...data,
    is_connected: true,
  };
}

export async function upsertGmailConnection(input: GmailConnectionInsert) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("gmail_connections")
    .upsert(input, { onConflict: "user_id" })
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to save Gmail connection");

  return data as GmailConnection;
}

export async function deleteGmailConnection(userId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("gmail_connections")
    .delete()
    .eq("user_id", userId);

  if (error) handleDatabaseError(error, "Failed to disconnect Gmail");

  return true;
}

export async function getAllGmailConnections() {
  const admin = createAdminClient();

  const { data, error } = await admin.from("gmail_connections").select("*");

  if (error) handleDatabaseError(error, "Failed to fetch Gmail connections");

  return (data ?? []) as GmailConnection[];
}
