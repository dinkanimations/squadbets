"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import {
  AI_CATEGORY_LABELS,
  AI_EMAIL_CATEGORIES,
} from "@/lib/ai/constants";
import { approveReviewAction, type ReviewActionState } from "@/lib/ai/review-actions";
import type { InboxEmail } from "@/types/database";
import type { AiEmailCategory } from "@/types/database";

interface ReviewApprovalModalProps {
  email: InboxEmail | null;
  open: boolean;
  onClose: () => void;
}

const initialState: ReviewActionState = {};

export function ReviewApprovalModal({
  email,
  open,
  onClose,
}: ReviewApprovalModalProps) {
  const [state, formAction, isPending] = useActionState(
    approveReviewAction,
    initialState,
  );
  const [category, setCategory] = useState<AiEmailCategory>(
    "new_business_opportunity",
  );

  if (!email) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Approve & Create Opportunity"
      description="Review and edit details before creating the opportunity."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="inboxId" value={email.id} />
        <input type="hidden" name="category" value={category} />

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

        <Input
          label="Company name"
          name="companyName"
          defaultValue={
            email.detected_company_name ?? email.sender_name ?? ""
          }
          required
        />

        <Select
          label="AI Category"
          name="categoryDisplay"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as AiEmailCategory)
          }
          options={AI_EMAIL_CATEGORIES.map((item) => ({
            value: item,
            label: AI_CATEGORY_LABELS[item],
          }))}
        />

        <div className="rounded-lg bg-surface-elevated p-3 text-sm">
          <p className="font-medium text-foreground">
            {email.subject ?? "(No subject)"}
          </p>
          <p className="mt-1 text-muted">{email.ai_summary}</p>
        </div>

        <div className="flex justify-end gap-3 border-t border-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Approve & Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
