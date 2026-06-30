import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";
import { getFreelancerById } from "@/lib/database/freelancers";
import { formatDateTime } from "@/lib/inbox/utils";

interface FreelancerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FreelancerDetailPage({
  params,
}: FreelancerDetailPageProps) {
  const { id } = await params;

  let freelancer: Awaited<ReturnType<typeof getFreelancerById>> | null = null;

  try {
    freelancer = await getFreelancerById(id);
  } catch {
    notFound();
  }

  if (!freelancer) notFound();

  const inbox = freelancer.inbox as {
    subject: string | null;
    body_plain: string | null;
    sender_email: string | null;
    date_received: string;
  } | null;

  return (
    <>
      <div className="mb-4">
        <Link href="/freelancers">
          <Button variant="secondary" size="sm">
            Back to Freelancers
          </Button>
        </Link>
      </div>

      <PageHeader
        title={freelancer.full_name}
        description={freelancer.role ?? "Freelancer profile"}
        icon={UserPlus}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <dl className="space-y-3 text-sm">
            {freelancer.email && (
              <div>
                <dt className="text-muted">Email</dt>
                <dd>{freelancer.email}</dd>
              </div>
            )}
            {freelancer.phone && (
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{freelancer.phone}</dd>
              </div>
            )}
            {freelancer.skills && (
              <div>
                <dt className="text-muted">Skills</dt>
                <dd>{freelancer.skills}</dd>
              </div>
            )}
            {freelancer.software && (
              <div>
                <dt className="text-muted">Software</dt>
                <dd>{freelancer.software}</dd>
              </div>
            )}
            {freelancer.day_rate != null && (
              <div>
                <dt className="text-muted">Day rate</dt>
                <dd>£{freelancer.day_rate.toLocaleString()}</dd>
              </div>
            )}
            {freelancer.availability && (
              <div>
                <dt className="text-muted">Availability</dt>
                <dd>{freelancer.availability}</dd>
              </div>
            )}
            {freelancer.portfolio_url && (
              <div>
                <dt className="text-muted">Portfolio</dt>
                <dd>
                  <a
                    href={freelancer.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {freelancer.portfolio_url}
                  </a>
                </dd>
              </div>
            )}
            {freelancer.linkedin_url && (
              <div>
                <dt className="text-muted">LinkedIn</dt>
                <dd>
                  <a
                    href={freelancer.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline"
                  >
                    {freelancer.linkedin_url}
                  </a>
                </dd>
              </div>
            )}
          </dl>
          {freelancer.ai_summary && (
            <p className="mt-4 rounded-lg bg-surface-elevated p-3 text-sm">
              {freelancer.ai_summary}
            </p>
          )}
          {freelancer.ai_confidence != null && (
            <div className="mt-3">
              <Badge variant="success">
                {Math.round(freelancer.ai_confidence)}% AI confidence
              </Badge>
            </div>
          )}
        </Card>

        {inbox && (
          <Card>
            <CardHeader
              title="Source email"
              description={formatDateTime(inbox.date_received)}
            />
            <p className="mb-2 text-sm font-medium">{inbox.subject}</p>
            <div className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-surface-elevated p-4 text-sm">
              {inbox.body_plain ?? "(No body)"}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
