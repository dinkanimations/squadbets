import { Card, CardHeader } from "@/components/ui/Card";
import { getOpportunityPipelineSummary } from "@/lib/database/opportunities";
import { formatCurrency } from "@/lib/opportunities/utils";

export async function RevenuePipeline() {
  let stages: Awaited<
    ReturnType<typeof getOpportunityPipelineSummary>
  >["stages"] = [];
  let error = false;

  try {
    const summary = await getOpportunityPipelineSummary();
    stages = summary.stages;
  } catch {
    error = true;
  }

  return (
    <Card className="h-full">
      <CardHeader
        title="Revenue Pipeline"
        description="Estimated deal value by stage"
      />
      {error ? (
        <p className="text-sm text-muted">Unable to load pipeline data.</p>
      ) : stages.every((stage) => stage.deals === 0) ? (
        <p className="text-sm text-muted">No active opportunities in pipeline.</p>
      ) : (
        <div className="space-y-5">
          {stages.map((stage) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{stage.stage}</span>
                <div className="flex items-center gap-3 text-muted">
                  <span>
                    {stage.deals} {stage.deals === 1 ? "deal" : "deals"}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(stage.amount)}
                  </span>
                </div>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-surface-elevated"
                role="progressbar"
                aria-valuenow={stage.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${stage.stage} pipeline share`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
