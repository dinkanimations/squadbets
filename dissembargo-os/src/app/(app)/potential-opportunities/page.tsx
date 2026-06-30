import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PotentialOpportunityList } from "@/components/inbox/PotentialOpportunityList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { InboxPipelinePanel } from "@/components/inbox/InboxPipelinePanel";
import { getPendingPotentialOpportunities } from "@/lib/database/potential-opportunities";
import InboxLoading from "../inbox/loading";

export default async function PotentialOpportunitiesPage() {
  return (
    <Suspense fallback={<InboxLoading />}>
      <PotentialOpportunitiesContent />
    </Suspense>
  );
}

async function PotentialOpportunitiesContent() {
  let opportunities: Awaited<
    ReturnType<typeof getPendingPotentialOpportunities>
  >["data"] = [];
  let error: string | null = null;

  try {
    const result = await getPendingPotentialOpportunities();
    opportunities = result.data;
  } catch (err) {
    error =
      err instanceof Error ? err.message : "Failed to load potential opportunities.";
  }

  return (
    <>
      <PageHeader
        title="Potential Opportunities"
        description="AI-detected new business enquiries from Gmail. Review each lead, convert to a Company, then create a Quote when ready."
        icon={Sparkles}
      />

      <InboxPipelinePanel />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No potential opportunities"
          description="When AI detects a genuine new business enquiry in Gmail, it will appear here. Newsletters, invoices, and spam stay in Inbox only."
        />
      ) : (
        <PotentialOpportunityList opportunities={opportunities} />
      )}
    </>
  );
}
