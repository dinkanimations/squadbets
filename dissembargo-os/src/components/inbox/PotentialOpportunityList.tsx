import { Card } from "@/components/ui/Card";
import { InboxItemCard } from "@/components/inbox/InboxItemCard";
import type { PotentialOpportunityWithInbox } from "@/types/potential-opportunity";

interface PotentialOpportunityListProps {
  opportunities: PotentialOpportunityWithInbox[];
}

export function PotentialOpportunityList({
  opportunities,
}: PotentialOpportunityListProps) {
  return (
    <Card className="divide-y divide-border p-0">
      {opportunities.map((item) => (
        <InboxItemCard key={item.id} item={item} />
      ))}
    </Card>
  );
}
