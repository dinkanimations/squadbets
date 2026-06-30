import { Clapperboard } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { countSchedulesInProduction } from "@/lib/database/production-schedules";

export async function ProductionScheduleStats() {
  let count = 0;
  let error = false;

  try {
    count = await countSchedulesInProduction();
  } catch {
    error = true;
  }

  return (
    <StatCard
      title="Projects In Production"
      value={error ? "—" : String(count)}
      change={error ? "Unable to load" : "Active production schedules"}
      changeType={error ? "negative" : "neutral"}
      icon={Clapperboard}
    />
  );
}
