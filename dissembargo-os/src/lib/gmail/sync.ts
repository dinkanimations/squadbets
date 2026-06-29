import type { GmailConnection } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createGmailClient,
  getGmailProfile,
  refreshAccessToken,
} from "./client";
import { parseGmailMessage } from "./parse";
import { processInboxEmail } from "@/lib/ai/process-inbox";

export type SyncResult = {
  imported: number;
  skipped: number;
  status: "success" | "error";
  error?: string;
};

async function getValidAccessToken(connection: GmailConnection) {
  const isExpired =
    connection.token_expiry &&
    new Date(connection.token_expiry).getTime() <= Date.now() + 60_000;

  if (!isExpired) {
    return {
      accessToken: connection.access_token,
      refreshToken: connection.refresh_token,
      expiry: connection.token_expiry,
    };
  }

  const refreshed = await refreshAccessToken(connection.refresh_token);
  const admin = createAdminClient();

  await admin
    .from("gmail_connections")
    .update({
      access_token: refreshed.accessToken,
      token_expiry: refreshed.expiryDate,
    })
    .eq("id", connection.id);

  return {
    accessToken: refreshed.accessToken,
    refreshToken: connection.refresh_token,
    expiry: refreshed.expiryDate,
  };
}

async function importMessage(
  userId: string,
  connection: GmailConnection,
  messageId: string,
) {
  const admin = createAdminClient();
  const { accessToken, refreshToken } = await getValidAccessToken(connection);
  const gmail = createGmailClient(accessToken, refreshToken);

  const { data: existing } = await admin
    .from("inbox")
    .select("id")
    .eq("user_id", userId)
    .eq("gmail_message_id", messageId)
    .maybeSingle();

  if (existing) {
    return { status: "skipped" as const };
  }

  const { data: message } = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  if (!message) {
    return { status: "skipped" as const };
  }

  if (!(message.labelIds ?? []).includes("INBOX")) {
    return { status: "skipped" as const };
  }

  const parsed = parseGmailMessage(message);

  const { data: inserted, error } = await admin
    .from("inbox")
    .insert({
      user_id: userId,
      ...parsed,
      attachments: parsed.attachments,
      ai_processing_status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { status: "skipped" as const };
    throw error;
  }

  return { status: "imported" as const, inboxId: inserted.id };
}

async function listInboxMessageIds(
  connection: GmailConnection,
): Promise<string[]> {
  const { accessToken, refreshToken } = await getValidAccessToken(connection);
  const gmail = createGmailClient(accessToken, refreshToken);

  const messageIds: string[] = [];
  let pageToken: string | undefined;

  do {
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 100,
      pageToken,
    });

    const messages = response.data.messages ?? [];
    messageIds.push(...messages.map((message) => message.id!).filter(Boolean));
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  return messageIds;
}

async function syncViaHistory(
  connection: GmailConnection,
): Promise<{ messageIds: string[]; newHistoryId: string | null }> {
  const { accessToken, refreshToken } = await getValidAccessToken(connection);
  const gmail = createGmailClient(accessToken, refreshToken);

  if (!connection.history_id) {
    const profile = await getGmailProfile(accessToken, refreshToken);
    const messageIds = await listInboxMessageIds(connection);
    return {
      messageIds,
      newHistoryId: profile.historyId ?? null,
    };
  }

  const messageIds = new Set<string>();
  let pageToken: string | undefined;
  let newHistoryId = connection.history_id;

  try {
    do {
      const response = await gmail.users.history.list({
        userId: "me",
        startHistoryId: connection.history_id,
        historyTypes: ["messageAdded"],
        pageToken,
      });

      newHistoryId = response.data.historyId ?? newHistoryId;

      for (const record of response.data.history ?? []) {
        for (const added of record.messagesAdded ?? []) {
          if (added.message?.id) {
            messageIds.add(added.message.id);
          }
        }
      }

      pageToken = response.data.nextPageToken ?? undefined;
    } while (pageToken);
  } catch (error) {
    const status =
      error && typeof error === "object" && "code" in error
        ? Number((error as { code: number }).code)
        : null;

    if (status === 404) {
      const messageIds = await listInboxMessageIds(connection);
      const profile = await getGmailProfile(accessToken, refreshToken);
      return { messageIds, newHistoryId: profile.historyId ?? null };
    }

    throw error;
  }

  return { messageIds: Array.from(messageIds), newHistoryId };
}

export async function syncGmailConnection(
  connection: GmailConnection,
): Promise<SyncResult> {
  const admin = createAdminClient();
  let imported = 0;
  let skipped = 0;

  try {
    const { messageIds, newHistoryId } = await syncViaHistory(connection);

    for (const messageId of messageIds) {
      const result = await importMessage(
        connection.user_id,
        connection,
        messageId,
      );

      if (result.status === "imported") {
        imported += 1;

        try {
          await processInboxEmail(result.inboxId);
        } catch (processError) {
          console.error(
            `AI processing failed for inbox ${result.inboxId}:`,
            processError,
          );
        }
      } else {
        skipped += 1;
      }
    }

    await admin
      .from("gmail_connections")
      .update({
        history_id: newHistoryId,
        last_sync_at: new Date().toISOString(),
        last_sync_status: "success",
        last_sync_error: null,
      })
      .eq("id", connection.id);

    return { imported, skipped, status: "success" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gmail sync failed";

    await admin
      .from("gmail_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "error",
        last_sync_error: message,
      })
      .eq("id", connection.id);

    return { imported, skipped, status: "error", error: message };
  }
}

export async function syncAllGmailConnections() {
  const admin = createAdminClient();

  const { data: connections, error } = await admin
    .from("gmail_connections")
    .select("*");

  if (error) throw error;

  const results = [];

  for (const connection of connections ?? []) {
    results.push({
      userId: connection.user_id,
      gmailAddress: connection.gmail_address,
      ...(await syncGmailConnection(connection)),
    });
  }

  return results;
}
