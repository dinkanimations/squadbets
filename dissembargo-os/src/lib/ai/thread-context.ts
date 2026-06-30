import type { InboxEmail } from "@/types/database";
import { getEmailBodyForAnalysis } from "./extract-signature";

export type ThreadMessageContext = {
  dateReceived: string;
  senderName: string | null;
  senderEmail: string | null;
  subject: string | null;
  body: string;
};

export function formatThreadContext(
  messages: ThreadMessageContext[],
): string | null {
  if (messages.length === 0) return null;

  return messages
    .map((message, index) => {
      const header = [
        `--- Previous message ${index + 1} ---`,
        `Date: ${message.dateReceived}`,
        `From: ${message.senderName ?? "Unknown"} <${message.senderEmail ?? "unknown"}>`,
        `Subject: ${message.subject ?? "(no subject)"}`,
      ].join("\n");

      return `${header}\n\n${message.body}`;
    })
    .join("\n\n");
}

export function inboxEmailToThreadContext(email: InboxEmail): ThreadMessageContext {
  return {
    dateReceived: email.date_received,
    senderName: email.sender_name,
    senderEmail: email.sender_email,
    subject: email.subject,
    body: getEmailBodyForAnalysis(email.body_plain, email.body_html),
  };
}
