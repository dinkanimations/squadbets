"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import type { InboxAttachment, InboxEmail } from "@/types/database";
import type { AiEmailCategory } from "@/types/database";
import {
  formatDateTime,
  getSenderDisplay,
} from "@/lib/inbox/utils";
import {
  AiCategoryBadge,
  ConfidenceBadge,
} from "@/components/ai/AiCategoryBadge";
import {
  AI_CATEGORY_LABELS,
  AI_EMAIL_CATEGORIES,
} from "@/lib/ai/constants";
import {
  createOpportunityFromInboxAction,
  retryAiProcessingAction,
  updateInboxCategoryAction,
} from "@/lib/ai/review-actions";
import { Input } from "@/components/ui/Input";

interface InboxEmailDetailProps {
  email: InboxEmail;
}

function AttachmentList({ attachments }: { attachments: InboxAttachment[] }) {
  if (attachments.length === 0) {
    return <p className="text-sm text-muted">No attachments</p>;
  }

  return (
    <ul className="space-y-2">
      {attachments.map((attachment) => (
        <li
          key={attachment.attachmentId}
          className="rounded-lg bg-surface-elevated px-3 py-2 text-sm text-foreground"
        >
          {attachment.filename} · {attachment.mimeType} ·{" "}
          {Math.round(attachment.size / 1024)} KB
        </li>
      ))}
    </ul>
  );
}

export function InboxEmailDetail({ email }: InboxEmailDetailProps) {
  const router = useRouter();
  const attachments = (email.attachments as InboxAttachment[]) ?? [];
  const [category, setCategory] = useState<AiEmailCategory>(
    email.ai_category ?? "other",
  );
  const [companyName, setCompanyName] = useState(
    email.detected_company_name ?? email.sender_name ?? "",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!email.is_read) {
      fetch(`/api/inbox/${email.id}/read`, { method: "POST" }).then(() => {
        router.refresh();
      });
    }
  }, [email.id, email.is_read, router]);

  const handleCategoryChange = (newCategory: AiEmailCategory) => {
    setCategory(newCategory);
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateInboxCategoryAction(email.id, newCategory);
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Category updated.");
        router.refresh();
      }
    });
  };

  const handleReprocess = () => {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await retryAiProcessingAction(email.id);
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Reprocessing...");
        router.refresh();
      }
    });
  };

  const handleCreateOpportunity = () => {
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }

    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await createOpportunityFromInboxAction(
        email.id,
        companyName.trim(),
      );
      if (result.error) setError(result.error);
      else {
        setMessage(result.success ?? "Opportunity created.");
        router.refresh();
      }
    });
  };

  return (
    <>
      <Link
        href="/inbox"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Inbox
      </Link>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {email.subject ?? "(No subject)"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            From {getSenderDisplay(email)}
          </p>
          <p className="text-sm text-muted">
            To {email.recipient ?? "—"} · {formatDateTime(email.date_received)}
          </p>
        </div>
        <Badge variant={email.is_read ? "default" : "warning"}>
          {email.is_read ? "Read" : "Unread"}
        </Badge>
      </div>

      {(message || error) && (
        <div
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Message" />
            {email.body_html ? (
              <div
                className="prose prose-invert max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
              />
            ) : (
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {email.body_plain ?? "No message body available."}
              </p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="AI Classification"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReprocess}
                  disabled={isPending}
                  aria-label="Reprocess with AI"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              }
            />
            {email.ai_processing_status === "completed" ? (
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Category</dt>
                  <dd className="mt-1">
                    <Select
                      value={category}
                      onChange={(event) =>
                        handleCategoryChange(
                          event.target.value as AiEmailCategory,
                        )
                      }
                      options={AI_EMAIL_CATEGORIES.map((item) => ({
                        value: item,
                        label: AI_CATEGORY_LABELS[item],
                      }))}
                      disabled={isPending}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Confidence</dt>
                  <dd className="mt-1">
                    <ConfidenceBadge score={email.ai_confidence} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Summary</dt>
                  <dd className="text-foreground">
                    {email.ai_summary ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Reasoning</dt>
                  <dd className="text-foreground">
                    {email.ai_reasoning ?? "—"}
                  </dd>
                </div>
                {email.opportunity_id && (
                  <div>
                    <dt className="text-muted">Linked Opportunity</dt>
                    <dd>
                      <Link
                        href={`/opportunities/${email.opportunity_id}`}
                        className="text-accent hover:underline"
                      >
                        View opportunity
                      </Link>
                    </dd>
                  </div>
                )}
                {email.review_status === "pending_review" && (
                  <div>
                    <Link
                      href="/review-queue"
                      className="text-sm text-accent hover:underline"
                    >
                      Pending review →
                    </Link>
                  </div>
                )}
              </dl>
            ) : email.ai_processing_status === "failed" ? (
              <div className="space-y-3">
                <p className="text-sm text-danger">
                  {email.ai_processing_error ?? "AI processing failed."}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleReprocess}
                  disabled={isPending}
                >
                  Retry AI Processing
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted">AI processing pending...</p>
            )}
          </Card>

          {!email.opportunity_id && email.ai_processing_status === "completed" && (
            <Card>
              <CardHeader title="Create Opportunity" />
              <div className="space-y-3">
                <Input
                  label="Company name"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                />
                <Button
                  onClick={handleCreateOpportunity}
                  disabled={isPending}
                  className="w-full"
                >
                  Create Opportunity Manually
                </Button>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Attachments" />
            <AttachmentList attachments={attachments} />
          </Card>

          <Card>
            <CardHeader title="Import Details" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Imported</dt>
                <dd className="text-foreground">
                  {formatDateTime(email.imported_at)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Gmail Message ID</dt>
                <dd className="break-all text-foreground">
                  {email.gmail_message_id}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Thread ID</dt>
                <dd className="break-all text-foreground">
                  {email.thread_id ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
