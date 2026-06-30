"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Building2,
  Check,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import type { PotentialOpportunityWithInbox } from "@/types/potential-opportunity";
import type { Company } from "@/types/database";
import {
  acceptPotentialOpportunityAction,
  dismissPotentialOpportunityAction,
  mergePotentialOpportunityCompanyAction,
} from "@/lib/inbox/potential-opportunity-actions";
import { formatDateTime } from "@/lib/inbox/utils";

interface PotentialOpportunityDetailProps {
  potential: PotentialOpportunityWithInbox;
  companies: Array<Pick<Company, "id" | "company_name">>;
}

export function PotentialOpportunityDetail({
  potential,
  companies,
}: PotentialOpportunityDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeCompanyId, setMergeCompanyId] = useState("");

  const runAction = (action: () => Promise<{ error?: string; success?: string; opportunityId?: string }>) => {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }

      setMessage(result.success ?? "Done.");
      if (result.opportunityId) {
        router.push(`/opportunities/${result.opportunityId}`);
        return;
      }

      router.refresh();
      router.push("/inbox");
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/inbox">
          <Button variant="secondary" size="sm">
            Back to Inbox
          </Button>
        </Link>
        {potential.company_id && (
          <Link href={`/companies/${potential.company_id}`}>
            <Button variant="secondary" size="sm">
              <Building2 className="h-4 w-4" />
              Open Company
            </Button>
          </Link>
        )}
      </div>

      {message && (
        <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Card>
        <CardHeader
          title={potential.company_name}
          description={potential.project_name ?? potential.inbox.subject ?? "Potential business enquiry"}
        />

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="success">{Math.round(potential.ai_confidence)}% confidence</Badge>
          <Badge>{formatDateTime(potential.inbox.date_received)}</Badge>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              AI Summary
            </p>
            <p className="mt-1 text-foreground">{potential.ai_summary}</p>
          </div>

          {potential.project_description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Project Description
              </p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {potential.project_description}
              </p>
            </div>
          )}

          <dl className="grid gap-3 sm:grid-cols-2">
            {potential.contact_name && (
              <div>
                <dt className="text-xs text-muted">Contact</dt>
                <dd className="font-medium">{potential.contact_name}</dd>
              </div>
            )}
            {potential.contact_email && (
              <div>
                <dt className="text-xs text-muted">Email</dt>
                <dd>{potential.contact_email}</dd>
              </div>
            )}
            {potential.contact_phone && (
              <div>
                <dt className="text-xs text-muted">Phone</dt>
                <dd className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {potential.contact_phone}
                </dd>
              </div>
            )}
            {potential.company_website && (
              <div>
                <dt className="text-xs text-muted">Website</dt>
                <dd>
                  <a
                    href={potential.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    {potential.company_website}
                  </a>
                </dd>
              </div>
            )}
            {potential.estimated_budget != null && (
              <div>
                <dt className="text-xs text-muted">Budget</dt>
                <dd>£{potential.estimated_budget.toLocaleString()}</dd>
              </div>
            )}
            {potential.deadline && (
              <div>
                <dt className="text-xs text-muted">Deadline</dt>
                <dd>{potential.deadline}</dd>
              </div>
            )}
            {potential.location && (
              <div>
                <dt className="text-xs text-muted">Location</dt>
                <dd className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {potential.location}
                </dd>
              </div>
            )}
          </dl>

          {potential.deliverables && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Deliverables Requested
              </p>
              <p className="mt-1 text-foreground">{potential.deliverables}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button
            disabled={isPending}
            onClick={() =>
              runAction(() => acceptPotentialOpportunityAction(potential.id))
            }
          >
            <Check className="h-4 w-4" />
            Accept Opportunity
          </Button>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => setShowEmail((value) => !value)}
          >
            <Mail className="h-4 w-4" />
            {showEmail ? "Hide Email" : "Open Original Email"}
          </Button>
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => setShowMerge((value) => !value)}
          >
            <Building2 className="h-4 w-4" />
            Merge with Company
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() =>
              runAction(() => dismissPotentialOpportunityAction(potential.id))
            }
          >
            <X className="h-4 w-4" />
            Dismiss
          </Button>
        </div>

        {showMerge && (
          <div className="mt-4 rounded-xl border border-border bg-surface-elevated/40 p-4">
            <p className="mb-2 text-sm font-medium">Link to existing company</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                value={mergeCompanyId}
                onChange={(event) => setMergeCompanyId(event.target.value)}
              >
                <option value="">Select company…</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
              <Button
                disabled={!mergeCompanyId || isPending}
                onClick={() =>
                  runAction(() =>
                    mergePotentialOpportunityCompanyAction(
                      potential.id,
                      mergeCompanyId,
                    ),
                  )
                }
              >
                Merge
              </Button>
            </div>
          </div>
        )}
      </Card>

      {showEmail && (
        <Card>
          <CardHeader
            title="Original Email"
            description={`From ${potential.inbox.sender_name ?? potential.inbox.sender_email ?? "unknown"}`}
          />
          <div className="space-y-3 text-sm">
            <p>
              <span className="text-muted">Subject:</span>{" "}
              {potential.inbox.subject ?? "(No subject)"}
            </p>
            <div className="max-h-[480px] overflow-auto rounded-lg bg-surface-elevated p-4 whitespace-pre-wrap text-foreground">
              {potential.inbox.body_plain ||
                potential.inbox.body_html ||
                "(No body)"}
            </div>
            {Array.isArray(potential.inbox.attachments) &&
              potential.inbox.attachments.length > 0 && (
                <p className="text-xs text-muted">
                  {potential.inbox.attachments.length} attachment(s) referenced
                  in Gmail.
                </p>
              )}
          </div>
        </Card>
      )}
    </div>
  );
}
