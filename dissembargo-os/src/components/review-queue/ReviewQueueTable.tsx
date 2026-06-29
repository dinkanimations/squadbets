"use client";

import { useState, useTransition } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import {
  AI_CATEGORY_LABELS,
  AI_EMAIL_CATEGORIES,
} from "@/lib/ai/constants";
import {
  rejectReviewAction,
  updateReviewCategoryAction,
} from "@/lib/ai/review-actions";
import type { InboxEmail } from "@/types/database";
import type { AiEmailCategory } from "@/types/database";
import { getSenderDisplay } from "@/lib/inbox/utils";
import { ConfidenceBadge } from "@/components/ai/AiCategoryBadge";
import { ReviewApprovalModal } from "./ReviewApprovalModal";
import { Select } from "@/components/ui/Select";

interface ReviewQueueTableProps {
  emails: InboxEmail[];
}

export function ReviewQueueTable({ emails }: ReviewQueueTableProps) {
  const [approvingEmail, setApprovingEmail] = useState<InboxEmail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleReject = (inboxId: string) => {
    const confirmed = window.confirm("Reject this email from the review queue?");
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await rejectReviewAction(inboxId);
      if (result.error) setError(result.error);
    });
  };

  const handleCategoryChange = (inboxId: string, category: AiEmailCategory) => {
    setError(null);
    startTransition(async () => {
      const result = await updateReviewCategoryAction(inboxId, category);
      if (result.error) setError(result.error);
    });
  };

  return (
    <>
      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Sender</TableHeaderCell>
            <TableHeaderCell>Subject</TableHeaderCell>
            <TableHeaderCell>Company</TableHeaderCell>
            <TableHeaderCell>AI Category</TableHeaderCell>
            <TableHeaderCell>Confidence</TableHeaderCell>
            <TableHeaderCell>AI Summary</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id}>
              <TableCell className="text-sm">
                {getSenderDisplay(email)}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {email.subject ?? "(No subject)"}
              </TableCell>
              <TableCell>
                {email.detected_company_name ?? "—"}
              </TableCell>
              <TableCell>
                <Select
                  name={`category-${email.id}`}
                  value={email.ai_category ?? "other"}
                  onChange={(event) =>
                    handleCategoryChange(
                      email.id,
                      event.target.value as AiEmailCategory,
                    )
                  }
                  options={AI_EMAIL_CATEGORIES.map((item) => ({
                    value: item,
                    label: AI_CATEGORY_LABELS[item],
                  }))}
                  className="min-w-[180px]"
                />
              </TableCell>
              <TableCell>
                <ConfidenceBadge score={email.ai_confidence} />
              </TableCell>
              <TableCell className="max-w-[240px]">
                <p className="line-clamp-2 text-sm text-muted">
                  {email.ai_summary ?? "—"}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setApprovingEmail(email)}
                    disabled={isPending}
                    aria-label="Approve"
                  >
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setApprovingEmail(email)}
                    disabled={isPending}
                    aria-label="Edit and approve"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReject(email.id)}
                    disabled={isPending}
                    aria-label="Reject"
                  >
                    <X className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ReviewApprovalModal
        email={approvingEmail}
        open={Boolean(approvingEmail)}
        onClose={() => setApprovingEmail(null)}
      />
    </>
  );
}
