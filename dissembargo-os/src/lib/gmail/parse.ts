import type { gmail_v1 } from "googleapis";
import type { InboxAttachment } from "@/types/database";

export function parseEmailAddress(raw: string | undefined): {
  name: string | null;
  email: string | null;
} {
  if (!raw) return { name: null, email: null };

  const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);

  if (match) {
    return {
      name: match[1]?.trim() || null,
      email: match[2]?.trim() || null,
    };
  }

  return { name: null, email: raw.trim() };
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractBodies(
  payload: gmail_v1.Schema$MessagePart | undefined,
): { plain: string | null; html: string | null; attachments: InboxAttachment[] } {
  let plain: string | null = null;
  let html: string | null = null;
  const attachments: InboxAttachment[] = [];

  function walk(part: gmail_v1.Schema$MessagePart | undefined) {
    if (!part) return;

    const mimeType = part.mimeType ?? "";
    const filename = part.filename ?? "";
    const body = part.body;

    if (filename && body?.attachmentId) {
      attachments.push({
        filename,
        mimeType,
        size: body.size ?? 0,
        attachmentId: body.attachmentId,
      });
    } else if (body?.data) {
      const decoded = decodeBase64Url(body.data);
      if (mimeType === "text/plain" && !plain) {
        plain = decoded;
      } else if (mimeType === "text/html" && !html) {
        html = decoded;
      }
    }

    if (part.parts) {
      part.parts.forEach(walk);
    }
  }

  walk(payload);

  return { plain, html, attachments };
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string,
): string | undefined {
  const value = headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase(),
  )?.value;

  return value ?? undefined;
}

export function parseGmailMessage(message: gmail_v1.Schema$Message) {
  const headers = message.payload?.headers;
  const from = parseEmailAddress(getHeader(headers, "From"));
  const { plain, html, attachments } = extractBodies(message.payload);

  return {
    gmail_message_id: message.id!,
    thread_id: message.threadId ?? null,
    subject: getHeader(headers, "Subject") ?? null,
    sender_name: from.name,
    sender_email: from.email,
    recipient: getHeader(headers, "To") ?? null,
    date_received: message.internalDate
      ? new Date(Number(message.internalDate)).toISOString()
      : new Date().toISOString(),
    body_plain: plain,
    body_html: html,
    attachments,
    is_read: !(message.labelIds ?? []).includes("UNREAD"),
  };
}

export function getEmailPreview(body: string | null, maxLength = 120): string {
  if (!body) return "No preview available";

  const cleaned = body.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}…`;
}
