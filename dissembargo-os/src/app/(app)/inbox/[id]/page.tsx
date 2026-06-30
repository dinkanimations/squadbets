import { redirect } from "next/navigation";

interface InboxDetailRedirectProps {
  params: Promise<{ id: string }>;
}

export default async function InboxDetailRedirect({
  params,
}: InboxDetailRedirectProps) {
  const { id } = await params;
  redirect(`/potential-opportunities/${id}`);
}
