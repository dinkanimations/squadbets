import { Building2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { getIndustriesBreakdown } from "@/lib/database/companies";

export async function IndustriesBreakdown() {
  let industries: Array<{ industry: string; count: number }> = [];
  let error = false;

  try {
    industries = await getIndustriesBreakdown();
  } catch {
    error = true;
  }

  const total = industries.reduce((sum, item) => sum + item.count, 0);
  const top = industries.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader
        title="Industries Breakdown"
        description="Active companies by industry"
      />
      {error ? (
        <p className="text-sm text-muted">Unable to load from database.</p>
      ) : top.length === 0 ? (
        <p className="text-sm text-muted">
          No industry data yet. Companies are enriched automatically when opportunities are created.
        </p>
      ) : (
        <div className="space-y-5">
          {top.map((item) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.industry} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.industry}</span>
                  <span className="text-muted">{item.count} companies</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Building2 className="h-3.5 w-3.5" />
        {total} companies with industry data
      </div>
    </Card>
  );
}
