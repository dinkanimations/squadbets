import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasAdminClientEnv } from "@/lib/supabase/admin";
import type { SupabaseServerClient } from "@/lib/database/utils";

export async function createServiceClient(): Promise<SupabaseServerClient> {
  if (hasAdminClientEnv()) {
    return createAdminClient();
  }

  return createClient();
}
