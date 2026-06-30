"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Textarea";
import {
  updateCompanyAction,
  type CompanyActionState,
} from "@/lib/companies/actions";
import type { Company } from "@/types/database";

interface CompanyEditModalProps {
  open: boolean;
  onClose: () => void;
  company: Company;
}

const initialState: CompanyActionState = {};

function arrayToLines(items: string[] | null | undefined): string {
  return (items ?? []).join("\n");
}

export function CompanyEditModal({
  open,
  onClose,
  company,
}: CompanyEditModalProps) {
  const [state, formAction, isPending] = useActionState(
    updateCompanyAction,
    initialState,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Company"
      description="Manual edits are preserved during AI refresh when override is checked."
      size="lg"
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="id" value={company.id} />

        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            {state.success}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="companyName"
            label="Company Name"
            defaultValue={company.company_name}
            required
          />
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="override_company_name" defaultChecked />
            Lock from AI refresh
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="website"
            label="Website"
            defaultValue={company.website ?? ""}
            placeholder="https://example.com"
          />
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="override_website" />
            Lock from AI refresh
          </label>
        </div>

        <Input
          name="logoUrl"
          label="Logo URL"
          defaultValue={company.logo_url ?? ""}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="industry"
            label="Industry"
            defaultValue={company.industry ?? ""}
          />
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="override_industry" />
            Lock from AI refresh
          </label>
        </div>

        <Input
          name="headquarters"
          label="Headquarters"
          defaultValue={company.headquarters ?? ""}
        />

        <Input
          name="estimatedSize"
          label="Estimated Size"
          defaultValue={company.estimated_size ?? ""}
        />

        <Textarea
          name="executiveSummary"
          label="Executive Summary"
          rows={4}
          defaultValue={company.executive_summary ?? ""}
        />

        <Textarea
          name="aiSummary"
          label="AI Summary"
          rows={4}
          defaultValue={company.ai_summary ?? ""}
        />

        <Textarea
          name="products"
          label="Products (one per line)"
          rows={3}
          defaultValue={arrayToLines(company.products)}
        />

        <Textarea
          name="services"
          label="Services (one per line)"
          rows={3}
          defaultValue={arrayToLines(company.services)}
        />

        <Textarea
          name="keyMarkets"
          label="Key Markets (one per line)"
          rows={3}
          defaultValue={arrayToLines(company.key_markets)}
        />

        <Textarea
          name="targetCustomers"
          label="Target Customers (one per line)"
          rows={3}
          defaultValue={arrayToLines(company.target_customers)}
        />

        <Textarea
          name="creativeOpportunities"
          label="Creative Opportunities (one per line)"
          rows={3}
          defaultValue={arrayToLines(company.creative_opportunities)}
        />

        <Textarea
          name="suggestedServices"
          label="Suggested Services (one per line)"
          rows={3}
          defaultValue={arrayToLines(company.suggested_services)}
        />

        <Textarea
          name="internalNotes"
          label="Internal Notes"
          rows={4}
          defaultValue={company.internal_notes ?? ""}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
