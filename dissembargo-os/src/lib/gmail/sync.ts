import type { GmailConnection } from "@/types/database";
import { createServiceClient } from "@/lib/supabase/service";
import {
  createGmailClient,
  getGmailProfile,
  refreshAccessToken,
} from "./client";
import { formatSyncError } from "./sync-errors";
import { parseGmailMessage } from "./parse";
import {
  INITIAL_SYNC_MAX_MESSAGES,
  HISTORICAL_IMPORT_BATCH_SIZE,
  BACKFILL_BATCH_SIZE,
  SYNC_AI_PROCESS_LIMIT,
  SYNC_HISTORICAL_IMPORT_LIMIT,
  SYNC_RESCAN_FAILED_LIMIT,
} from "./constants";
import {
  processPendingInboxEmails,
  backfillPotentialOpportunities,
  rescanFailedInboxEmails,
} from "@/lib/ai/process-inbox";
import { getFailedInboxCountForUser } from "@/lib/database/inbox-stats";

export type SyncResult = {
  imported: number;
  skipped: number;
  historicalImported: number;
  backfillProcessed: number;
  potentialOpportunitiesFound: number;
  aiProcessed: number;
  status: "success" | "error";
  error?: string;
  warning?: string;
  gmailAddress?: string;
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
  const supabase = await createServiceClient();

  await supabase
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
  const supabase = await createServiceClient();
  const { accessToken, refreshToken } = await getValidAccessToken(connection);
  const gmail = createGmailClient(accessToken, refreshToken);

  const { data: existing } = await supabase
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

  const { data: inserted, error } = await supabase
    .from("inbox")
    .insert({
      user_id: userId,
      gmail_connection_id: connection.id,
      ...parsed,
      attachments: parsed.attachments,
      ai_processing_status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { status: "skipped" as const };
    throw new Error(
      typeof error.message === "string"
        ? error.message
        : "Failed to save imported email",
    );
  }

  return { status: "imported" as const, inboxId: inserted.id };
}

async function listInboxMessageIds(
  connection: GmailConnection,
  maxMessages = INITIAL_SYNC_MAX_MESSAGES,
  startPageToken?: string | null,
): Promise<{ messageIds: string[]; nextPageToken: string | null }> {
  const { accessToken, refreshToken } = await getValidAccessToken(connection);
  const gmail = createGmailClient(accessToken, refreshToken);

  const messageIds: string[] = [];
  let pageToken: string | undefined = startPageToken ?? undefined;

  do {
    const response = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: Math.min(100, maxMessages - messageIds.length),
      pageToken,
    });

    const messages = response.data.messages ?? [];
    messageIds.push(...messages.map((message) => message.id!).filter(Boolean));
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken && messageIds.length < maxMessages);

  return {
    messageIds: messageIds.slice(0, maxMessages),
    nextPageToken: pageToken ?? null,
  };
}

async function syncViaHistory(
  connection: GmailConnection,
): Promise<{ messageIds: string[]; newHistoryId: string | null }> {
  const { accessToken, refreshToken } = await getValidAccessToken(connection);
  const gmail = createGmailClient(accessToken, refreshToken);

  if (!connection.history_id) {
    const profile = await getGmailProfile(accessToken, refreshToken);
    const { messageIds } = await listInboxMessageIds(connection);
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
      const { messageIds } = await listInboxMessageIds(connection);
      const profile = await getGmailProfile(accessToken, refreshToken);
      return { messageIds, newHistoryId: profile.historyId ?? null };
    }

    throw error;
  }

  return { messageIds: Array.from(messageIds), newHistoryId };
}

async function importMissingHistoricalMessages(
  connection: GmailConnection,
  maxMessages = SYNC_HISTORICAL_IMPORT_LIMIT,
): Promise<{ imported: number; skipped: number; warning?: string }> {
  const supabase = await createServiceClient();

  try {
    const pageToken =
      "historical_import_page_token" in connection
        ? connection.historical_import_page_token
        : null;

    const { messageIds, nextPageToken } = await listInboxMessageIds(
      connection,
      maxMessages,
      pageToken,
    );
    let imported = 0;
    let skipped = 0;

    for (const messageId of messageIds) {
      const result = await importMessage(
        connection.user_id,
        connection,
        messageId,
      );

      if (result.status === "imported") {
        imported += 1;
      } else {
        skipped += 1;
      }
    }

    try {
      await supabase
        .from("gmail_connections")
        .update({ historical_import_page_token: nextPageToken })
        .eq("id", connection.id);
    } catch {
      // Column may not exist until migration is applied — import still succeeded.
    }

    return { imported, skipped };
  } catch (error) {
    return {
      imported: 0,
      skipped: 0,
      warning: `Historical import skipped: ${formatSyncError(error)}`,
    };
  }
}

async function runInboxIntelligencePipeline(
  userId: string,
  options?: { failedCount?: number },
): Promise<{
  backfillProcessed: number;
  potentialOpportunitiesFound: number;
  aiProcessed: number;
  warning?: string;
}> {
  let aiProcessed = 0;
  let backfillProcessed = 0;
  let potentialOpportunitiesFound = 0;
  let warning: string | undefined;

  try {
    const pending =
      (options?.failedCount ?? 0) > 0
        ? await rescanFailedInboxEmails({
            userId,
            limit: SYNC_RESCAN_FAILED_LIMIT,
          })
        : await processPendingInboxEmails(SYNC_AI_PROCESS_LIMIT, { userId });

    aiProcessed = pending.length;
    potentialOpportunitiesFound = pending.filter(
      (result) =>
        result.actionTaken === "potential_opportunity" ||
        result.actionTaken === "client_communication",
    ).length;
  } catch (error) {
    return {
      aiProcessed: 0,
      backfillProcessed: 0,
      potentialOpportunitiesFound: 0,
      warning: `AI processing skipped: ${formatSyncError(error)}`,
    };
  }

  try {
    const backfill = await backfillPotentialOpportunities({
      userId,
      limit: BACKFILL_BATCH_SIZE,
    });
    backfillProcessed = backfill.processed;
    potentialOpportunitiesFound += backfill.potentialOpportunities;
  } catch (error) {
    warning = `Email rescan skipped: ${formatSyncError(error)}`;
  }

  return {
    aiProcessed,
    backfillProcessed,
    potentialOpportunitiesFound,
    warning,
  };
}

export async function syncGmailConnection(
  connection: GmailConnection,
  options?: { skipIntelligencePipeline?: boolean },
): Promise<SyncResult> {
  const supabase = await createServiceClient();
  let imported = 0;
  let skipped = 0;
  let historicalImported = 0;
  let backfillProcessed = 0;
  let potentialOpportunitiesFound = 0;
  let aiProcessed = 0;
  let warning: string | undefined;

  try {
    await supabase
      .from("gmail_connections")
      .update({ last_sync_status: "syncing", last_sync_error: null })
      .eq("id", connection.id);

    const { messageIds, newHistoryId } = await syncViaHistory(connection);

    for (const messageId of messageIds) {
      const result = await importMessage(
        connection.user_id,
        connection,
        messageId,
      );

      if (result.status === "imported") {
        imported += 1;
      } else {
        skipped += 1;
      }
    }

    const historical = await importMissingHistoricalMessages(connection);
    historicalImported = historical.imported;
    skipped += historical.skipped;
    if (historical.warning) {
      warning = historical.warning;
    }

    if (!options?.skipIntelligencePipeline) {
      const failedCount = await getFailedInboxCountForUser(connection.user_id);
      const pipeline = await runInboxIntelligencePipeline(connection.user_id, {
        failedCount,
      });
      backfillProcessed = pipeline.backfillProcessed;
      potentialOpportunitiesFound = pipeline.potentialOpportunitiesFound;
      aiProcessed = pipeline.aiProcessed;
      if (pipeline.warning) {
        warning = warning
          ? `${warning} ${pipeline.warning}`
          : pipeline.warning;
      }
    }

    await supabase
      .from("gmail_connections")
      .update({
        history_id: newHistoryId,
        last_sync_at: new Date().toISOString(),
        last_sync_status: "success",
        last_sync_error: warning ?? null,
      })
      .eq("id", connection.id);

    return {
      imported,
      skipped,
      historicalImported,
      backfillProcessed,
      potentialOpportunitiesFound,
      aiProcessed,
      status: "success",
      warning,
      gmailAddress: connection.gmail_address,
    };
  } catch (error) {
    const message = formatSyncError(error);

    await supabase
      .from("gmail_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "error",
        last_sync_error: message,
      })
      .eq("id", connection.id);

    return {
      imported,
      skipped,
      historicalImported,
      backfillProcessed,
      potentialOpportunitiesFound,
      aiProcessed,
      status: "error",
      error: message,
      gmailAddress: connection.gmail_address,
    };
  }
}

export async function syncUserGmailConnections(userId: string) {
  const { getUserGmailConnectionsForSync } = await import(
    "@/lib/database/gmail-connections"
  );

  const connections = await getUserGmailConnectionsForSync(userId);
  const results: SyncResult[] = [];

  for (const connection of connections) {
    results.push(
      await syncGmailConnection(connection, { skipIntelligencePipeline: true }),
    );
  }

  if (connections.length > 0) {
    const failedCount = await getFailedInboxCountForUser(userId);
    const pipeline = await runInboxIntelligencePipeline(userId, { failedCount });

    const last = results[results.length - 1];
    if (last) {
      last.backfillProcessed = pipeline.backfillProcessed;
      last.potentialOpportunitiesFound = pipeline.potentialOpportunitiesFound;
      last.aiProcessed = pipeline.aiProcessed;
      if (pipeline.warning) {
        last.warning = last.warning
          ? `${last.warning} ${pipeline.warning}`
          : pipeline.warning;
      }
    }
  }

  return results;
}

export async function syncAllGmailConnections() {
  const supabase = await createServiceClient();

  const { data: connections, error } = await supabase
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
