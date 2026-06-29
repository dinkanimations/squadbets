import { Card, CardHeader } from "@/components/ui/Card";
import { PIPELINE_STAGES } from "@/lib/data/dummy";

export function RevenuePipeline() {
  return (
    <Card className="h-full">
      <CardHeader
        title="Revenue Pipeline"
        description="Deal value by stage this quarter"
      />
      <div className="space-y-5">
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage.stage} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{stage.stage}</span>
              <div className="flex items-center gap-3 text-muted">
                <span>{stage.deals} deals</span>
                <span className="font-medium text-foreground">
                  {stage.amount}
                </span>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-accent-secondary transition-all duration-500"
                style={{ width: `${stage.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
