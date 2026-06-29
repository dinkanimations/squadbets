import { markInboxEmailAsRead } from "@/lib/database/inbox";
import { getUser } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await markInboxEmailAsRead(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark as read";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
