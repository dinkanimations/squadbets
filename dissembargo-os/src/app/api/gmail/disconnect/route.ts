import { redirect } from "next/navigation";
import { deleteGmailConnection } from "@/lib/database/gmail-connections";
import { getUser } from "@/lib/auth/session";

export async function POST() {
  const { user, error } = await getUser();

  if (error || !user) {
    redirect("/login?redirectTo=/settings");
  }

  await deleteGmailConnection(user.id);

  redirect("/settings?gmail=disconnected");
}
