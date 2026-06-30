import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PotentialOpportunityList } from "@/components/inbox/PotentialOpportunityList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getPendingPotentialOpportunities } from "@/lib/database/potential-opportunities";
import { getUserGmailConnections } from "@/lib/database/gmail-connections";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import InboxLoading from "./loading";

export default async function InboxPage() {
  return (
    <Suspense fallback={<InboxLoading />}>
      <InboxContent />
    </Suspense>
  );
}

async function InboxContent() {
  let opportunities: Awaited<
    ReturnType<typeof getPendingPotentialOpportunities>
  >["data"] = [];
  let error: string | null = null;
  let connection = null;

  try {
    const [potentialResult, connections] = await Promise.all([
      getPendingPotentialOpportunities(),
      getUserGmailConnections(),
    ]);

    opportunities = potentialResult.data;
    connection = connections.length > 0 ? connections[0] : null;
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Failed to load inbox. Check your Supabase connection.";
  }

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Your business development assistant — only genuine potential job enquiries appear here. Everything else stays in Gmail."
        icon={Sparkles}
      />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : !connection ? (
        <EmptyState
          title="Gmail not connected"
          description="Connect Gmail to automatically scan new emails for potential business opportunities."
          action={
            <Link href="/settings/integrations">
              <Button>Connect Gmail</Button>
            </Link>
          }
        />
      ) : opportunities.length === 0 ? (
        <EmptyState
          title="No potential opportunities"
          description="Sync Gmail from Integrations. The AI will scan new emails and surface genuine job enquiries here — newsletters, invoices, and spam are ignored."
          action={
            <Link href="/settings/integrations">
              <Button>Sync Gmail</Button>
            </Link>
          }
        />
      ) : (
        <PotentialOpportunityList opportunities={opportunities} />
      )}
    </>
  );
}
