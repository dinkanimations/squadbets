"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import {
  deleteOpportunityAction,
  getContactsForCompanyAction,
  updateOpportunityStatusAction,
} from "@/lib/opportunities/actions";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  type OpportunityWithRelations,
} from "@/lib/opportunities/constants";
import {
  formatCurrency,
  formatDateTime,
} from "@/lib/opportunities/utils";
import { OpportunityStatusBadge } from "./OpportunityStatusBadge";
import { OpportunityFormModal } from "./OpportunityFormModal";

type CompanyOption = { id: string; company_name: string };

interface OpportunityDetailClientProps {
  opportunity: OpportunityWithRelations;
  companies: CompanyOption[];
}

export function OpportunityDetailClient({
  opportunity,
  companies,
}: OpportunityDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(opportunity.opportunity_status);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [initialContacts, setInitialContacts] = useState<
    Awaited<ReturnType<typeof getContactsForCompanyAction>>
  >([]);
  const [isPending, startTransition] = useTransition();

  const handleEditOpen = async () => {
    const contacts = await getContactsForCompanyAction(opportunity.company_id);
    setInitialContacts(contacts);
    setEditOpen(true);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as typeof status);
    setStatusError(null);

    startTransition(async () => {
      const result = await updateOpportunityStatusAction(
        opportunity.id,
        newStatus as typeof status,
      );

      if (result.error) {
        setStatusError(result.error);
        setStatus(opportunity.opportunity_status);
      } else {
        router.refresh();
      }
    });
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete opportunity "${opportunity.subject ?? "Untitled"}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeleteError(null);
    const result = await deleteOpportunityAction(opportunity.id);

    if (result?.error) {
      setDeleteError(result.error);
    }
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Opportunities
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void handleEditOpen()}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {deleteError && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {deleteError}
        </p>
      )}

      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {opportunity.subject ?? "Untitled opportunity"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              Created {formatDateTime(opportunity.created_at)}
            </p>
          </div>
          <OpportunityStatusBadge status={status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Email" description="Source message content" />
            <div className="rounded-lg bg-surface-elevated p-4">
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {opportunity.email_body || "No email body provided."}
              </p>
            </div>
          </Card>

          <Card>
            <CardHeader title="AI Summary" />
            <p className="whitespace-pre-wrap text-sm text-muted">
              {opportunity.notes || "No AI summary available."}
            </p>
          </Card>

          {opportunity.requested_deliverables && (
            <Card>
              <CardHeader title="Requested Services" />
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {opportunity.requested_deliverables}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Status" />
            <Select
              name="status"
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              disabled={isPending}
              options={OPPORTUNITY_STATUSES.map((item) => ({
                value: item,
                label: OPPORTUNITY_STATUS_LABELS[item],
              }))}
            />
            {statusError && (
              <p className="mt-2 text-sm text-danger">{statusError}</p>
            )}
          </Card>

          <Card>
            <CardHeader title="Estimated Budget" />
            <p className="text-2xl font-semibold text-foreground">
              {formatCurrency(opportunity.estimated_budget)}
            </p>
          </Card>

          <Card>
            <CardHeader title="Company Information" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Company</dt>
                <dd className="font-medium text-foreground">
                  {opportunity.company ? (
                    <Link
                      href={`/companies/${opportunity.company_id}`}
                      className="hover:text-accent"
                    >
                      {opportunity.company.company_name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Website</dt>
                <dd className="text-foreground">
                  {opportunity.company?.website ? (
                    <a
                      href={opportunity.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
                    >
                      {opportunity.company.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Industry</dt>
                <dd className="text-foreground">
                  {opportunity.company?.industry ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Headquarters</dt>
                <dd className="text-foreground">
                  {opportunity.company?.headquarters ?? "—"}
                </dd>
              </div>
              {opportunity.company?.ai_summary && (
                <div>
                  <dt className="text-muted">AI Summary</dt>
                  <dd className="text-foreground">
                    {opportunity.company.ai_summary}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Contact Information" />
            {opportunity.contact ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Name</dt>
                  <dd className="font-medium text-foreground">
                    {opportunity.contact.full_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd className="text-foreground">
                    {opportunity.contact.email ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd className="text-foreground">
                    {opportunity.contact.phone ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Role</dt>
                  <dd className="text-foreground">
                    {opportunity.contact.role ?? "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted">No contact linked.</p>
            )}
          </Card>

          {opportunity.inbox_id && (
            <Card>
              <CardHeader title="Source Email" />
              <Link
                href={`/inbox/${opportunity.inbox_id}`}
                className="text-sm text-accent hover:underline"
              >
                View original Gmail conversation
              </Link>
            </Card>
          )}
        </div>
      </div>

      <OpportunityFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        companies={companies}
        opportunity={opportunity}
        initialContacts={initialContacts}
      />
    </>
  );
}
