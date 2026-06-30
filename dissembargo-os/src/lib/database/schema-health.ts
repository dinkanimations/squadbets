import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "./utils";

export type SchemaHealth = {
  ready: boolean;
  projectRef: string | null;
};

export const getSchemaHealth = cache(async (): Promise<SchemaHealth> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = url
    ? new URL(url).hostname.replace(/\.supabase\.co$/, "")
    : null;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    return {
      ready: !isMissingSchemaError(error),
      projectRef,
    };
  } catch {
    return { ready: false, projectRef };
  }
});
