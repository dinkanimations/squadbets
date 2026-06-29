import { Sparkles } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { countOpportunities } from "@/lib/database/opportunities";
import { DASHBOARD_PLACEHOLDER_STATS } from "@/lib/data/dummy";

export async function DashboardStats() {
  let newOpportunitiesCount = 0;
  let opportunitiesError = false;

  try {
    newOpportunitiesCount = await countOpportunities({ status: "new" });
  } catch {
    opportunitiesError = true;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="New Opportunities"
        value={opportunitiesError ? "—" : String(newOpportunitiesCount)}
        change={
          opportunitiesError
            ? "Unable to load from database"
            : "Awaiting review in inbox"
        }
        changeType={opportunitiesError ? "negative" : "neutral"}
        icon={Sparkles}
      />
      {DASHBOARD_PLACEHOLDER_STATS.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
