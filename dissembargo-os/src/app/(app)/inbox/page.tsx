import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import { PotentialOpportunityList } from "@/components/inbox/PotentialOpportunityList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { InboxSetupBanner } from "@/components/setup/InboxSetupBanner";
import { getPendingPotentialOpportunities } from "@/lib/database/potential-opportunities";
import { getInboxSchemaHealth } from "@/lib/database/inbox-schema-health";
import { getInboxProcessingStats } from "@/lib/database/inbox-stats";
import { getUserGmailConnections } from "@/lib/database/gmail-connections";
import { Button } from "@/components/ui/Button";
import { InboxRescanButton } from "@/components/inbox/InboxRescanButton";
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
  let processingStats: Awaited<ReturnType<typeof getInboxProcessingStats>> | null =
    null;

  try {
    const [potentialResult, connections, inboxSchema, stats] = await Promise.all([
      getPendingPotentialOpportunities(),
      getUserGmailConnections(),
      getInboxSchemaHealth(),
      getInboxProcessingStats(),
    ]);

    opportunities = potentialResult.data;
    connection = connections.length > 0 ? connections[0] : null;
    inboxSchemaReady = inboxSchema.ready;
    inboxProjectRef = inboxSchema.projectRef;
    processingStats = stats;
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
        <InboxEmptyState stats={processingStats} />
      ) : (
        <PotentialOpportunityList opportunities={opportunities} />
      )}
    </>
  );
}

function InboxEmptyState({
  stats,
}: {
  stats: Awaited<ReturnType<typeof getInboxProcessingStats>> | null;
}) {
  const needsScan = (stats?.failed ?? 0) + (stats?.pending ?? 0);
  const scannedCount = stats?.completed ?? 0;

  if (stats && stats.totalImported > 0 && needsScan > 0) {
    return (
      <EmptyState
        title="Emails imported — scan needed"
        description={`${stats.totalImported} email${stats.totalImported === 1 ? "" : "s"} imported from Gmail, but ${needsScan} still need AI scanning before leads can appear. This usually happens when OpenAI wasn't configured during the first sync.`}
        action={
          <InboxRescanButton pendingCount={needsScan} />
        }
      />
    );
  }

  if (stats && stats.totalImported > 0 && scannedCount > 0) {
    return (
      <EmptyState
        title="Inbox clear"
        description={`${scannedCount} email${scannedCount === 1 ? "" : "s"} scanned — no business enquiries or client replies need action right now. Newsletters, invoices, spam, and notifications are intentionally hidden.`}
        action={
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <InboxRescanButton label="Rescan mailbox" />
            <Link href="/settings/integrations">
              <Button variant="secondary">Sync Gmail</Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <EmptyState
      title="Inbox clear"
      description="Sync Gmail to scan your mailbox. Dissembargo surfaces new business enquiries and client replies — newsletters, invoices, spam, and notifications are ignored."
      action={
        <Link href="/settings/integrations">
          <Button>Sync Gmail</Button>
        </Link>
      }
    />
  );
}
