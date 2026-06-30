import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth/session";
import { checkOpenAIHealth } from "@/lib/ai/health";

export async function GET() {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = await checkOpenAIHealth();

  return NextResponse.json(health);
}
