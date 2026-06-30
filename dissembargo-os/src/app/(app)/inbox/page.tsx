import { Suspense } from "react";
import { Mail } from "lucide-react";
import { InboxEmailList } from "@/components/inbox/InboxEmailList";
import { InboxFilters } from "@/components/inbox/InboxFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getInboxEmails } from "@/lib/database/inbox";
import { getGmailConnectionStatus } from "@/lib/database/gmail-connections";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { InboxFilterCategory } from "@/lib/ai/constants";
import InboxLoading from "./loading";

interface InboxPageProps {
  searchParams: Promise<{ filter?: string }>;
}

export default async function InboxPage({ searchParams }: InboxPageProps) {
  return (
    <Suspense fallback={<InboxLoading />}>
      <InboxContent searchParams={searchParams} />
    </Suspense>
  );
}

async function InboxContent({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.filter as InboxFilterCategory | undefined) ?? "all";

  let emails: Awaited<ReturnType<typeof getInboxEmails>>["data"] = [];
  let error: string | null = null;
  let connection = null;

  try {
    const [inboxResult, connectionResult] = await Promise.all([
      getInboxEmails({ filter }),
      getGmailConnectionStatus(),
    ]);

    emails = inboxResult.data;
    connection = connectionResult;
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
        description="Gmail emails classified by AI — job enquiries become opportunities, everything else stays organised here."
        icon={Mail}
      />

      {error ? (
        <div className="rounded-xl border border-danger/20 bg-danger/10 p-6 text-sm text-danger">
          {error}
        </div>
      ) : !connection ? (
        <EmptyState
          title="Gmail not connected"
          description="Connect your Gmail account in Settings to start importing inbox emails."
          action={
            <Link href="/settings">
              <Button>Go to Settings</Button>
            </Link>
          }
        />
      ) : (
        <>
          <Suspense fallback={null}>
            <InboxFilters />
          </Suspense>

          {emails.length === 0 ? (
            <EmptyState
              title="No emails in this view"
              description="Try a different filter, or sync Gmail from Settings to import new emails."
              action={
                <Link href="/settings">
                  <Button>Open Settings</Button>
                </Link>
              }
            />
          ) : (
            <InboxEmailList emails={emails} />
          )}
        </>
      )}
    </>
  );
}
