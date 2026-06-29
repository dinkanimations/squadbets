import { getEmailPreview } from "@/lib/gmail/parse";
import {
  formatDate,
  formatDateTime,
} from "@/lib/opportunities/utils";
import type { InboxEmail } from "@/types/database";

export { formatDate, formatDateTime, getEmailPreview };

export function getSenderDisplay(email: InboxEmail): string {
  if (email.sender_name && email.sender_email) {
    return `${email.sender_name} <${email.sender_email}>`;
  }

  return email.sender_name ?? email.sender_email ?? "Unknown sender";
}

export function getInboxPreview(email: InboxEmail): string {
  return getEmailPreview(email.body_plain ?? email.body_html);
}
