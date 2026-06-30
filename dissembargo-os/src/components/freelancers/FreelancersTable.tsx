import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Freelancer } from "@/lib/ai/create-freelancer-from-inbox";
import { formatDateTime } from "@/lib/inbox/utils";

export function FreelancersTable({
  freelancers,
}: {
  freelancers: Freelancer[];
}) {
  return (
    <Card className="divide-y divide-border p-0">
      {freelancers.map((freelancer) => (
        <Link
          key={freelancer.id}
          href={`/freelancers/${freelancer.id}`}
          className="flex flex-col gap-2 p-4 transition-colors hover:bg-surface-elevated/40 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-medium text-foreground">{freelancer.full_name}</p>
            <p className="text-sm text-muted">
              {freelancer.role ?? freelancer.email ?? "Freelancer"}
            </p>
            {freelancer.ai_summary && (
              <p className="mt-1 line-clamp-2 text-sm text-muted">
                {freelancer.ai_summary}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {freelancer.ai_confidence != null && (
              <Badge variant="success">
                {Math.round(freelancer.ai_confidence)}%
              </Badge>
            )}
            <span className="text-xs text-muted">
              {formatDateTime(freelancer.created_at)}
            </span>
          </div>
        </Link>
      ))}
    </Card>
  );
}
