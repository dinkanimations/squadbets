"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
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
  CRM_EMAIL_ROUTES,
  CRM_ROUTE_LABELS,
  legacyCategoryToRoute,
  type CrmEmailRoute,
} from "@/lib/ai/constants";
import {
  approveNeedsReviewAction,
  rejectReviewAction,
} from "@/lib/ai/review-actions";
import type { InboxEmail } from "@/types/database";
import { getSenderDisplay } from "@/lib/inbox/utils";
import { ConfidenceBadge } from "@/components/ai/AiCategoryBadge";
import { Select } from "@/components/ui/Select";

interface NeedsReviewTableProps {
  emails: InboxEmail[];
}

export function NeedsReviewTable({ emails }: NeedsReviewTableProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [routes, setRoutes] = useState<Record<string, CrmEmailRoute>>(() =>
    Object.fromEntries(
      emails.map((email) => [
        email.id,
        legacyCategoryToRoute(email.ai_category),
      ]),
    ),
  );

  const handleApprove = (inboxId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await approveNeedsReviewAction(inboxId, routes[inboxId]);
      if (result.error) setError(result.error);
    });
  };

  const handleReject = (inboxId: string) => {
    if (!window.confirm("Dismiss this email from the review queue?")) return;

    setError(null);
    startTransition(async () => {
      const result = await rejectReviewAction(inboxId);
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
            <TableHeaderCell>Suggested classification</TableHeaderCell>
            <TableHeaderCell>Confidence</TableHeaderCell>
            <TableHeaderCell>AI reasoning</TableHeaderCell>
            <TableHeaderCell className="text-right">Actions</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emails.map((email) => (
            <TableRow key={email.id}>
              <TableCell className="text-sm">{getSenderDisplay(email)}</TableCell>
              <TableCell className="max-w-[180px] truncate">
                {email.subject ?? "(No subject)"}
              </TableCell>
              <TableCell>
                <Select
                  name={`route-${email.id}`}
                  value={routes[email.id] ?? "other"}
                  onChange={(event) =>
                    setRoutes((prev) => ({
                      ...prev,
                      [email.id]: event.target.value as CrmEmailRoute,
                    }))
                  }
                  options={CRM_EMAIL_ROUTES.map((route) => ({
                    value: route,
                    label: CRM_ROUTE_LABELS[route],
                  }))}
                  className="min-w-[200px]"
                />
              </TableCell>
              <TableCell>
                <ConfidenceBadge score={email.ai_confidence} />
              </TableCell>
              <TableCell className="max-w-[280px]">
                <p className="line-clamp-3 text-sm text-muted">
                  {email.ai_reasoning ?? email.ai_summary ?? "—"}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApprove(email.id)}
                    disabled={isPending}
                    aria-label="Approve classification"
                  >
                    <Check className="h-4 w-4 text-success" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReject(email.id)}
                    disabled={isPending}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
