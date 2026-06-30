import { Badge } from "@/components/ui/Badge";
import type { QuoteStatus } from "@/types/database";
import { QUOTE_STATUS_LABELS } from "@/lib/quotes/constants";

const STATUS_VARIANTS: Record<
  QuoteStatus,
  "default" | "success" | "warning" | "danger"
> = {
  draft: "default",
  sent: "warning",
  approved: "success",
  rejected: "danger",
  expired: "default",
};

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {QUOTE_STATUS_LABELS[status]}
    </Badge>
  );
}
