import { Badge } from "@/components/ui/Badge";
import { OPPORTUNITY_STATUS_LABELS } from "@/lib/opportunities/constants";
import { getOpportunityStatusVariant } from "@/lib/opportunities/utils";
import type { OpportunityStatus } from "@/types/database";

export function OpportunityStatusBadge({
  status,
}: {
  status: OpportunityStatus;
}) {
  return (
    <Badge variant={getOpportunityStatusVariant(status)}>
      {OPPORTUNITY_STATUS_LABELS[status]}
    </Badge>
  );
}
