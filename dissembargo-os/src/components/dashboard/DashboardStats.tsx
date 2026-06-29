import { StatCard } from "@/components/ui/StatCard";
import { DASHBOARD_STATS } from "@/lib/data/dummy";

export function DashboardStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {DASHBOARD_STATS.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  );
}
