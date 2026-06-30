"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import {
  createOpportunityAction,
  getContactsForCompanyAction,
  updateOpportunityAction,
  type OpportunityActionState,
} from "@/lib/opportunities/actions";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
  type OpportunityWithRelations,
} from "@/lib/opportunities/constants";

type CompanyOption = { id: string; company_name: string };
type ContactOption = {
  id: string;
  full_name: string;
  email: string | null;
  company_id: string;
};

interface OpportunityFormModalProps {
  open: boolean;
  onClose: () => void;
  companies: CompanyOption[];
  opportunity?: OpportunityWithRelations | null;
  initialContacts?: ContactOption[];
}

const initialState: OpportunityActionState = {};

function getInitialCompanyMode(
  opportunity: OpportunityWithRelations | null | undefined,
  companies: CompanyOption[],
) {
  if (opportunity) return "existing" as const;
  return companies.length > 0 ? ("existing" as const) : ("new" as const);
}

export function OpportunityFormModal({
  open,
  onClose,
  companies,
  opportunity,
  initialContacts = [],
}: OpportunityFormModalProps) {
  const isEditing = Boolean(opportunity);
  const action = isEditing ? updateOpportunityAction : createOpportunityAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  const [companyMode, setCompanyMode] = useState<"existing" | "new">(() =>
    getInitialCompanyMode(opportunity, companies),
  );
  const [contactMode, setContactMode] = useState<"none" | "existing" | "new">(
    () => (opportunity?.contact_id ? "existing" : "none"),
  );
  const [companyId, setCompanyId] = useState(
    () => opportunity?.company_id ?? companies[0]?.id ?? "",
  );
  const [contacts, setContacts] = useState<ContactOption[]>(initialContacts);

  const formKey = `${opportunity?.id ?? "new"}-${open}-${initialContacts.length}`;

  const handleCompanyChange = async (nextCompanyId: string) => {
    setCompanyId(nextCompanyId);

    if (!nextCompanyId || companyMode !== "existing") {
      setContacts([]);
      return;
    }

    const nextContacts = await getContactsForCompanyAction(nextCompanyId);
    setContacts(nextContacts);
  };

  const handleCompanyModeChange = (mode: "existing" | "new") => {
    setCompanyMode(mode);

    if (mode === "new") {
      setContacts([]);
    } else if (companyId) {
      void handleCompanyChange(companyId);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Opportunity" : "New Opportunity"}
      description={
        isEditing
          ? "Update opportunity details."
          : "Manually add a qualified opportunity to the inbox."
      }
      size="lg"
    >
      <form key={formKey} action={formAction} className="space-y-5">
        {isEditing && (
          <input type="hidden" name="id" value={opportunity?.id} />
        )}

        {state.success && (
          <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
            {state.success}
          </p>
        )}

        {state.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Company"
            name="companyMode"
            value={companyMode}
            onChange={(event) =>
              handleCompanyModeChange(event.target.value as "existing" | "new")
            }
            options={[
              { value: "existing", label: "Existing company" },
              { value: "new", label: "New company" },
            ]}
          />

          {companyMode === "existing" ? (
            <Select
              label="Select company"
              name="companyId"
              value={companyId}
              onChange={(event) => void handleCompanyChange(event.target.value)}
              options={[
                { value: "", label: "Select a company" },
                ...companies.map((company) => ({
                  value: company.id,
                  label: company.company_name,
                })),
              ]}
            />
          ) : (
            <Input label="Company name" name="companyName" required />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Contact"
            name="contactMode"
            value={contactMode}
            onChange={(event) =>
              setContactMode(event.target.value as "none" | "existing" | "new")
            }
            options={[
              { value: "none", label: "No contact" },
              { value: "existing", label: "Existing contact" },
              { value: "new", label: "New contact" },
            ]}
          />

          {contactMode === "existing" && (
            <Select
              label="Select contact"
              name="contactId"
              defaultValue={opportunity?.contact_id ?? ""}
              options={[
                { value: "", label: "Select a contact" },
                ...contacts.map((contact) => ({
                  value: contact.id,
                  label: contact.full_name,
                })),
              ]}
            />
          )}
        </div>

        {contactMode === "new" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Contact name" name="contactName" required />
            <Input label="Contact email" name="contactEmail" type="email" />
            <Input label="Contact phone" name="contactPhone" type="tel" />
            <Input label="Contact role" name="contactRole" />
          </div>
        )}

        <Input
          label="Subject"
          name="subject"
          defaultValue={opportunity?.subject ?? ""}
        />

        <Textarea
          label="Email body"
          name="emailBody"
          rows={5}
          defaultValue={opportunity?.email_body ?? ""}
          placeholder="Paste or enter the source email content..."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Status"
            name="status"
            defaultValue={opportunity?.opportunity_status ?? "new"}
            options={OPPORTUNITY_STATUSES.map((status) => ({
              value: status,
              label: OPPORTUNITY_STATUS_LABELS[status],
            }))}
          />
          <Input
            label="Estimated budget (£)"
            name="estimatedBudget"
            type="number"
            min="0"
            step="0.01"
            defaultValue={opportunity?.estimated_budget ?? ""}
          />
        </div>

        <Textarea
          label="Internal notes"
          name="notes"
          rows={3}
          defaultValue={opportunity?.notes ?? ""}
        />

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? "Saving..."
              : isEditing
                ? "Save changes"
                : "Create opportunity"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
