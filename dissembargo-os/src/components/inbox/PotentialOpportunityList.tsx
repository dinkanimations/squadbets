import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { PotentialOpportunityWithInbox } from "@/types/potential-opportunity";
import { formatDate } from "@/lib/inbox/utils";
import { cn } from "@/lib/utils/cn";

interface PotentialOpportunityListProps {
  opportunities: PotentialOpportunityWithInbox[];
}

function confidenceVariant(confidence: number) {
  if (confidence >= 85) return "success" as const;
  if (confidence >= 65) return "warning" as const;
  return "default" as const;
}

export function PotentialOpportunityList({
  opportunities,
}: PotentialOpportunityListProps) {
  return (
    <Card className="divide-y divide-border p-0">
      {opportunities.map((item) => (
        <Link
          key={item.id}
          href={`/inbox/${item.id}`}
          className={cn(
            "block px-6 py-5 transition-colors hover:bg-surface-elevated/40",
            !item.inbox.is_read && "bg-accent/5",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.company_name}
                </p>
                <Badge variant={confidenceVariant(item.ai_confidence)}>
                  {Math.round(item.ai_confidence)}% match
                </Badge>
                {!item.inbox.is_read && <Badge>Unread</Badge>}
              </div>
              <p className="mt-1 truncate text-sm text-foreground">
                {item.project_name || item.inbox.subject || "Potential enquiry"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {item.ai_summary}
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
                {item.contact_name && <span>{item.contact_name}</span>}
                {item.estimated_budget != null && (
                  <span>Budget: £{item.estimated_budget.toLocaleString()}</span>
                )}
                {item.deadline && <span>Deadline: {item.deadline}</span>}
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted">
              {formatDate(item.inbox.date_received)}
            </span>
          </div>
        </Link>
      ))}
    </Card>
  );
}
