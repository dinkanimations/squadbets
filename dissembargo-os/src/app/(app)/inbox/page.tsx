import { Suspense } from "react";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { InboxPipelinePanel } from "@/components/inbox/InboxPipelinePanel";
import { getUserGmailConnections } from "@/lib/database/gmail-connections";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function InboxPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading…</div>}>
      <InboxContent />
    </Suspense>
  );
}

async function InboxContent() {
  const connections = await getUserGmailConnections();
  const connection = connections.length > 0 ? connections[0] : null;

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Imported Gmail emails classified as Other stay here. Business enquiries go to Potential Opportunities; freelancer pitches go to Freelancers."
        icon={Mail}
      />

      <InboxPipelinePanel />

      {!connection ? (
        <EmptyState
          title="Gmail not connected"
          description="Connect Gmail to import and classify emails."
          action={
            <Link href="/settings/integrations">
              <Button>Connect Gmail</Button>
            </Link>
          }
        />
      ) : (
        <EmptyState
          title="Email archive"
          description="Non-actionable emails (newsletters, invoices, notifications) are stored here after AI classification. Review Potential Opportunities and Freelancers in their dedicated modules."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/potential-opportunities">
                <Button>Potential Opportunities</Button>
              </Link>
              <Link href="/freelancers">
                <Button variant="secondary">Freelancers</Button>
              </Link>
              <Link href="/settings/integrations">
                <Button variant="secondary">Sync Gmail</Button>
              </Link>
            </div>
          }
        />
      )}
    </>
  );
}
