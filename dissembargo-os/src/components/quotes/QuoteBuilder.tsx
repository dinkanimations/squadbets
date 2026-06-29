"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { DeliverablesEditor } from "./DeliverablesEditor";
import { BudgetEditor } from "./BudgetEditor";
import { QuoteTotalsPanel } from "./QuoteTotalsPanel";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import {
  archiveQuoteAction,
  createQuoteAction,
  duplicateQuoteAction,
  getContactsForQuoteAction,
  getOpportunitiesForQuoteAction,
  updateQuoteAction,
} from "@/lib/quotes/actions";
import {
  createEmptyDeliverable,
  createEmptyQuoteDraft,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  type QuoteFormDraft,
} from "@/lib/quotes/constants";
import { formatQuoteDate } from "@/lib/quotes/calculations";
import type { QuoteStatus } from "@/types/database";

type CompanyOption = { id: string; company_name: string };
type ContactOption = { id: string; full_name: string; email: string | null };
type OpportunityOption = {
  id: string;
  subject: string | null;
  company_id: string;
};

interface QuoteBuilderProps {
  mode: "create" | "edit";
  quoteId?: string;
  quoteNumber?: string;
  createdAt?: string;
  initialDraft?: QuoteFormDraft;
  companies: CompanyOption[];
  initialContacts?: ContactOption[];
  initialOpportunities?: OpportunityOption[];
}

export function QuoteBuilder({
  mode,
  quoteId,
  quoteNumber,
  createdAt,
  initialDraft,
  initialContacts = [],
  initialOpportunities = [],
}: QuoteBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<QuoteFormDraft>(
    initialDraft ?? createEmptyQuoteDraft(),
  );
  const [contacts, setContacts] = useState<ContactOption[]>(initialContacts);
  const [opportunities, setOpportunities] =
    useState<OpportunityOption[]>(initialOpportunities);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateDraft = (patch: Partial<QuoteFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((c) => c.id === companyId);
    updateDraft({
      companyId,
      contactId: "",
      opportunityId: "",
      clientName: company?.company_name ?? draft.clientName,
    });

    if (!companyId) {
      setContacts([]);
      setOpportunities([]);
      return;
    }

    void getContactsForQuoteAction(companyId).then(setContacts);
    void getOpportunitiesForQuoteAction(companyId).then(setOpportunities);
  };

  const handleSave = (status?: QuoteStatus) => {
    setError(null);
    setSuccess(null);

    const payload = {
      ...draft,
      status: status ?? draft.status,
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createQuoteAction(JSON.stringify(payload));
        if (result.error) {
          setError(result.error);
        } else if (result.id) {
          router.push(`/quotes/${result.id}`);
        }
        return;
      }

      if (!quoteId) return;

      const result = await updateQuoteAction(
        quoteId,
        JSON.stringify(payload),
      );

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "Quote saved.");
        router.refresh();
      }
    });
  };

  const handleDuplicate = () => {
    if (!quoteId) return;

    setError(null);
    startTransition(async () => {
      const result = await duplicateQuoteAction(quoteId);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        router.push(`/quotes/${result.id}`);
      }
    });
  };

  const handleArchive = () => {
    if (!quoteId) return;
    if (!window.confirm("Archive this quote?")) return;

    startTransition(async () => {
      const result = await archiveQuoteAction(quoteId);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/quotes"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && (
            <>
              <Button
                type="button"
                variant="secondary"
                disabled={isPending}
                onClick={handleDuplicate}
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={handleArchive}
              >
                <Archive className="h-4 w-4" />
                Archive
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={() => handleSave("draft")}
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() => handleSave()}
          >
            {isPending ? "Saving..." : "Save Quote"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "create" ? "New Quote" : quoteNumber}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "create"
              ? "Quote number will be generated on save"
              : `Created ${createdAt ? formatQuoteDate(createdAt) : ""}`}
          </p>
        </div>
        <QuoteStatusBadge status={draft.status} />
      </div>

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Quote Details"
              description="Link to company, contact, and opportunity"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Company"
                value={draft.companyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                options={[
                  { value: "", label: "Select company" },
                  ...companies.map((c) => ({
                    value: c.id,
                    label: c.company_name,
                  })),
                ]}
              />
              <Select
                label="Contact"
                value={draft.contactId}
                onChange={(e) => updateDraft({ contactId: e.target.value })}
                options={[
                  { value: "", label: "No contact" },
                  ...contacts.map((c) => ({
                    value: c.id,
                    label: c.full_name,
                  })),
                ]}
                disabled={!draft.companyId}
              />
              <Select
                label="Opportunity"
                value={draft.opportunityId}
                onChange={(e) => updateDraft({ opportunityId: e.target.value })}
                options={[
                  { value: "", label: "No opportunity" },
                  ...opportunities.map((o) => ({
                    value: o.id,
                    label: o.subject ?? "Untitled opportunity",
                  })),
                ]}
                disabled={!draft.companyId}
              />
              <Select
                label="Status"
                value={draft.status}
                onChange={(e) =>
                  updateDraft({ status: e.target.value as QuoteStatus })
                }
                options={QUOTE_STATUSES.map((s) => ({
                  value: s,
                  label: QUOTE_STATUS_LABELS[s],
                }))}
              />
              <Input
                label="Project Title"
                value={draft.projectTitle}
                onChange={(e) => updateDraft({ projectTitle: e.target.value })}
                placeholder="e.g. Brand Film Production"
              />
              <Input
                label="Client Name"
                value={draft.clientName}
                onChange={(e) => updateDraft({ clientName: e.target.value })}
                placeholder="Client or company contact name"
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Notes"
                rows={3}
                value={draft.notes}
                onChange={(e) => updateDraft({ notes: e.target.value })}
                placeholder="Internal or client-facing notes..."
              />
            </div>
          </Card>

          <DeliverablesEditor
            deliverables={
              draft.deliverables.length > 0
                ? draft.deliverables
                : [createEmptyDeliverable()]
            }
            onChange={(deliverables) => updateDraft({ deliverables })}
          />

          <BudgetEditor
            sections={draft.budgetSections}
            onChange={(budgetSections) => updateDraft({ budgetSections })}
          />
        </div>

        <QuoteTotalsPanel
          sections={draft.budgetSections}
          discountType={draft.discountType}
          discountValue={draft.discountValue}
          onDiscountTypeChange={(discountType) => updateDraft({ discountType })}
          onDiscountValueChange={(discountValue) =>
            updateDraft({ discountValue })
          }
        />
      </div>
    </>
  );
}
