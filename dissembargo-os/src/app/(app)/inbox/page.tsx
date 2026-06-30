import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PotentialOpportunityList } from "@/components/inbox/PotentialOpportunityList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { InboxSetupBanner } from "@/components/setup/InboxSetupBanner";
import { getPendingPotentialOpportunities } from "@/lib/database/potential-opportunities";
import { getInboxSchemaHealth } from "@/lib/database/inbox-schema-health";
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
  let inboxSchemaReady = true;
  let inboxProjectRef: string | null = null;

  try {
    const [potentialResult, connections, inboxSchema] = await Promise.all([
      getPendingPotentialOpportunities(),
      getUserGmailConnections(),
      getInboxSchemaHealth(),
    ]);

    opportunities = potentialResult.data;
    connection = connections.length > 0 ? connections[0] : null;
    inboxSchemaReady = inboxSchema.ready;
    inboxProjectRef = inboxSchema.projectRef;
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
        description="Your AI business development assistant — only genuine opportunities and client communications that need action appear here. Everything else stays in Gmail."
        icon={Sparkles}
      />

      {!inboxSchemaReady ? (
        <InboxSetupBanner projectRef={inboxProjectRef} />
      ) : null}

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
          title="Inbox clear"
          description="Sync Gmail to scan your mailbox. Dissembargo surfaces new business enquiries and client replies — newsletters, invoices, spam, and notifications are ignored."
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
