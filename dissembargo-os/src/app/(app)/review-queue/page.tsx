import { Suspense } from "react";
import { ClipboardCheck } from "lucide-react";
import { ReviewQueueTable } from "@/components/review-queue/ReviewQueueTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getReviewQueueEmails } from "@/lib/database/inbox";
import ReviewQueueLoading from "./loading";

export default async function ReviewQueuePage() {
  return (
    <Suspense fallback={<ReviewQueueLoading />}>
      <ReviewQueueContent />
    </Suspense>
  );
}

async function ReviewQueueContent() {
  let emails: Awaited<ReturnType<typeof getReviewQueueEmails>>["data"] = [];
  let error: string | null = null;

  try {
    const result = await getReviewQueueEmails();
    emails = result.data;
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Failed to load review queue.";
  }

  return (
    <>
      <PageHeader
        title="Review Queue"
        description="Job enquiries with AI confidence below 90% — approve, reject, reclassify, or create opportunities manually."
        icon={ClipboardCheck}
      />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : emails.length === 0 ? (
        <EmptyState
          title="No emails awaiting review"
          description="New job enquiries classified with confidence below 90% will appear here for your approval."
        />
      ) : (
        <ReviewQueueTable emails={emails} />
      )}
    </>
  );
}
