import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "./utils";

export type InboxSchemaHealth = {
  ready: boolean;
  projectRef: string | null;
};

export const getInboxSchemaHealth = cache(async (): Promise<InboxSchemaHealth> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = url
    ? new URL(url).hostname.replace(/\.supabase\.co$/, "")
    : null;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("potential_opportunities")
      .select("id")
      .limit(1);

    return {
      ready: !error || !isMissingSchemaError(error),
      projectRef,
    };
  } catch {
    return { ready: false, projectRef };
  }
});
