import { NextResponse } from "next/server";
import { checkOpenAIHealth } from "@/lib/ai/health";
import { getUser } from "@/lib/auth/session";

export async function GET() {
  const { user, error } = await getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = await checkOpenAIHealth();

  return NextResponse.json({
    status: health.status,
    model: health.model,
    message: health.message,
    missingEnvVar: health.missingEnvVar ?? null,
  });
}
