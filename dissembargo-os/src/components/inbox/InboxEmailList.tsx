import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { InboxEmail } from "@/types/database";
import {
  formatDate,
  getInboxPreview,
  getSenderDisplay,
} from "@/lib/inbox/utils";
import { cn } from "@/lib/utils/cn";
import { AiCategoryBadge } from "@/components/ai/AiCategoryBadge";

interface InboxEmailListProps {
  emails: InboxEmail[];
}

export function InboxEmailList({ emails }: InboxEmailListProps) {
  return (
    <Card className="divide-y divide-border p-0">
      {emails.map((email) => (
        <Link
          key={email.id}
          href={`/inbox/${email.id}`}
          className={cn(
            "block px-6 py-4 transition-colors hover:bg-surface-elevated/40",
            !email.is_read && "bg-accent/5",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "truncate text-sm text-foreground",
                    !email.is_read && "font-semibold",
                  )}
                >
                  {getSenderDisplay(email)}
                </p>
                {!email.is_read && <Badge>Unread</Badge>}
                {email.ai_category && (
                  <AiCategoryBadge category={email.ai_category} />
                )}
                {email.review_status === "pending_review" && (
                  <Badge variant="warning">Review</Badge>
                )}
              </div>
              <p
                className={cn(
                  "mt-1 truncate text-sm",
                  email.is_read ? "text-foreground" : "font-medium text-foreground",
                )}
              >
                {email.subject ?? "(No subject)"}
              </p>
              <p className="mt-1 line-clamp-1 text-sm text-muted">
                {email.ai_summary ?? getInboxPreview(email)}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted">
              {formatDate(email.date_received)}
            </span>
          </div>
        </Link>
      ))}
    </Card>
  );
}
