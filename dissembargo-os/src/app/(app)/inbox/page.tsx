import { Suspense } from "react";
import { Mail } from "lucide-react";
import { InboxEmailList } from "@/components/inbox/InboxEmailList";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getInboxEmails } from "@/lib/database/inbox";
import { getGmailConnectionStatus } from "@/lib/database/gmail-connections";
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
  let emails: Awaited<ReturnType<typeof getInboxEmails>>["data"] = [];
  let error: string | null = null;
  let connection = null;

  try {
    const [inboxResult, connectionResult] = await Promise.all([
      getInboxEmails(),
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
        description="Imported Gmail emails ready for review and future AI processing."
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
      ) : emails.length === 0 ? (
        <EmptyState
          title="No emails imported yet"
          description="Your inbox will populate automatically within 5 minutes of connecting Gmail, or you can sync manually from Settings."
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
  );
}
