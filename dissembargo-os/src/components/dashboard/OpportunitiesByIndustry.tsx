import { Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { getOpportunitiesByIndustry } from "@/lib/database/companies";

export async function OpportunitiesByIndustry() {
  let industries: Array<{ industry: string; count: number }> = [];
  let error = false;

  try {
    industries = await getOpportunitiesByIndustry();
  } catch {
    error = true;
  }

  const total = industries.reduce((sum, item) => sum + item.count, 0);
  const top = industries.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader
        title="Opportunities by Industry"
        description="Open pipeline grouped by company industry"
      />
      {error ? (
        <p className="text-sm text-muted">Unable to load from database.</p>
      ) : top.length === 0 ? (
        <p className="text-sm text-muted">
          No opportunities with industry data yet.
        </p>
      ) : (
        <div className="space-y-5">
          {top.map((item) => {
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={item.industry} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.industry}</span>
                  <span className="text-muted">{item.count} opportunities</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-secondary to-accent transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Sparkles className="h-3.5 w-3.5" />
        {total} active opportunities
      </div>
    </Card>
  );
}
