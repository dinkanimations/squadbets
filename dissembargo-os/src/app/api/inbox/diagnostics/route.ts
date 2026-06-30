import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { getPipelineDiagnostics } from "@/lib/database/pipeline-diagnostics";

export async function GET() {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const diagnostics = await getPipelineDiagnostics(user.id);
  return NextResponse.json(diagnostics);
}
