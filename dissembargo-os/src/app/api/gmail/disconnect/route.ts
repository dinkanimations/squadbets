import { redirect } from "next/navigation";
import { deleteGmailConnection } from "@/lib/database/gmail-connections";
import { getUser } from "@/lib/auth/session";

const INTEGRATIONS_URL = "/settings/integrations";

export async function POST(request: Request) {
  const { user, error } = await getUser();

  if (error || !user) {
    redirect("/login?redirectTo=/settings/integrations");
  }

  const formData = await request.formData();
  const connectionId = String(formData.get("connectionId") ?? "").trim();

  if (!connectionId) {
    redirect(`${INTEGRATIONS_URL}?gmail=error&message=missing_connection`);
  }

  await deleteGmailConnection(connectionId, user.id);

  redirect(`${INTEGRATIONS_URL}?gmail=disconnected`);
}
