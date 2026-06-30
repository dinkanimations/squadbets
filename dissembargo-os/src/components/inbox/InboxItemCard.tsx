"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, Check, Mail, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { PotentialOpportunityWithInbox } from "@/types/potential-opportunity";
import {
  convertPotentialToCompanyAction,
  dismissPotentialOpportunityAction,
} from "@/lib/inbox/potential-opportunity-actions";
import { formatDate } from "@/lib/inbox/utils";
import { cn } from "@/lib/utils/cn";

interface InboxItemCardProps {
  item: PotentialOpportunityWithInbox;
}

function confidenceVariant(confidence: number) {
  if (confidence >= 85) return "success" as const;
  if (confidence >= 65) return "warning" as const;
  return "default" as const;
}

export function InboxItemCard({ item }: InboxItemCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const runAction = (
    action: () => Promise<{ error?: string; companyId?: string }>,
  ) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.companyId) {
        router.push(`/companies/${result.companyId}`);
        return;
      }
      router.refresh();
    });
  };

  return (
    <article
      className={cn(
        "px-6 py-5 transition-colors",
        !item.inbox.is_read && "bg-accent/5",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/potential-opportunities/${item.id}`}
              className="truncate text-sm font-semibold text-foreground hover:text-accent"
            >
              {item.company_name}
            </Link>
            <Badge variant={confidenceVariant(item.ai_confidence)}>
              {Math.round(item.ai_confidence)}% confidence
            </Badge>
            <Badge variant="success">New enquiry</Badge>
            {!item.inbox.is_read && <Badge>Unread</Badge>}
          </div>

          {item.contact_name && (
            <p className="mt-1 text-sm text-muted">{item.contact_name}</p>
          )}

          <p className="mt-2 line-clamp-2 text-sm text-foreground">
            {item.ai_summary}
          </p>

          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
            {item.estimated_budget != null && (
              <span>Budget: £{item.estimated_budget.toLocaleString()}</span>
            )}
            {item.deadline && <span>Deadline: {item.deadline}</span>}
            <span>Received {formatDate(item.inbox.date_received)}</span>
          </div>

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            runAction(() => convertPotentialToCompanyAction(item.id))
          }
        >
          <Building2 className="h-4 w-4" />
          Convert to Company
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() =>
            runAction(() => dismissPotentialOpportunityAction(item.id))
          }
        >
          <X className="h-4 w-4" />
          Dismiss
        </Button>
        <Link href={`/potential-opportunities/${item.id}`}>
          <Button size="sm" variant="secondary">
            <Mail className="h-4 w-4" />
            View Details
          </Button>
        </Link>
        {item.company_id && (
          <Link href={`/companies/${item.company_id}`}>
            <Button size="sm" variant="secondary">
              Open Company
            </Button>
          </Link>
        )}
      </div>
    </article>
  );
}
