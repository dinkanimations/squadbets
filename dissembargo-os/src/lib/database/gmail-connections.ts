import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  GmailConnection,
  GmailConnectionInsert,
} from "@/types/database";
import type { GmailConnectionStatus } from "@/lib/gmail/constants";
import { handleDatabaseError, withDevDbFallback } from "./utils";

const CONNECTION_STATUS_FIELDS =
  "id, gmail_address, last_sync_at, last_sync_status, last_sync_error";

function toConnectionStatus(
  row: Pick<
    GmailConnection,
    | "id"
    | "gmail_address"
    | "last_sync_at"
    | "last_sync_status"
    | "last_sync_error"
  >,
): GmailConnectionStatus {
  return {
    ...row,
    is_connected: true,
  };
}

export async function getUserGmailConnections(): Promise<GmailConnectionStatus[]> {
  return withDevDbFallback(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
      .from("gmail_connections")
      .select(CONNECTION_STATUS_FIELDS)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) handleDatabaseError(error, "Failed to fetch Gmail connections");

    return (data ?? []).map(toConnectionStatus);
  }, []);
}

export async function getGmailConnectionStatus(): Promise<GmailConnectionStatus | null> {
  const connections = await getUserGmailConnections();
  return connections[0] ?? null;
}

export async function getGmailConnectionById(
  connectionId: string,
  userId: string,
): Promise<GmailConnection | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) handleDatabaseError(error, "Failed to fetch Gmail connection");

  return data;
}

export async function upsertGmailConnection(input: GmailConnectionInsert) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("gmail_connections")
    .upsert(input, { onConflict: "user_id,gmail_address" })
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to save Gmail connection");

  return data as GmailConnection;
}

export async function deleteGmailConnection(
  connectionId: string,
  userId: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("gmail_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", userId);

  if (error) handleDatabaseError(error, "Failed to disconnect Gmail");

  return true;
}

export async function getAllGmailConnections() {
  const supabase = await createServiceClient();

  const { data, error } = await supabase.from("gmail_connections").select("*");

  if (error) handleDatabaseError(error, "Failed to fetch Gmail connections");

  return (data ?? []) as GmailConnection[];
}

export async function getUserGmailConnectionsForSync(userId: string) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("gmail_connections")
    .select("*")
    .eq("user_id", userId);

  if (error) handleDatabaseError(error, "Failed to fetch Gmail connections");

  return (data ?? []) as GmailConnection[];
}
