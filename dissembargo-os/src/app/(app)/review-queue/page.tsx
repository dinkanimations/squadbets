import { Suspense } from "react";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NeedsReviewTable } from "@/components/review-queue/NeedsReviewTable";
import { getNeedsReviewEmails } from "@/lib/database/inbox";
import { AUTO_CLASSIFY_MIN_CONFIDENCE } from "@/lib/ai/constants";

export default async function NeedsReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
      <NeedsReviewContent />
    </Suspense>
  );
}

async function NeedsReviewContent() {
  let emails: Awaited<ReturnType<typeof getNeedsReviewEmails>>["data"] = [];
  let error: string | null = null;

  try {
    const result = await getNeedsReviewEmails();
    emails = result.data;
  } catch (err) {
    error = err instanceof Error ? err.message : "Failed to load needs review queue.";
  }

  return (
    <>
      <PageHeader
        title="Needs Review"
        description={`Emails where AI confidence was below ${AUTO_CLASSIFY_MIN_CONFIDENCE}% — review the suggested classification before creating a Potential Opportunity or Freelancer.`}
        icon={ClipboardCheck}
      />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : emails.length === 0 ? (
        <EmptyState
          title="Nothing needs review"
          description="When AI is uncertain about an email's intent, it will appear here for manual review instead of auto-creating records."
        />
      ) : (
        <NeedsReviewTable emails={emails} />
      )}
    </>
  );
}
