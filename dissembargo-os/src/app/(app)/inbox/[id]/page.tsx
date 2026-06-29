import { notFound } from "next/navigation";
import { InboxEmailDetail } from "@/components/inbox/InboxEmailDetail";
import { getInboxEmailById } from "@/lib/database/inbox";
import type { InboxEmail } from "@/types/database";

interface InboxDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InboxDetailPage({ params }: InboxDetailPageProps) {
  const { id } = await params;
  let email: InboxEmail | null = null;

  try {
    email = await getInboxEmailById(id);
  } catch {
    notFound();
  }

  if (!email) {
    notFound();
  }

  return <InboxEmailDetail email={email} />;
}
