import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import {
  getDevProfile,
  getDevUser,
  isAuthDisabled,
} from "@/lib/auth/dev-bypass";

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    return { session: null, error };
  }

  return { session, error: null };
}

export async function getUser() {
  if (isAuthDisabled()) {
    return { user: getDevUser(), error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { user: null, error };
  }

  return { user, error: null };
}

export async function getProfile(): Promise<{
  profile: Profile | null;
  error: AuthError | { message: string } | null;
}> {
  if (isAuthDisabled()) {
    return { profile: getDevProfile(), error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { profile: null, error: authError };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { profile: data, error };
}

export async function requireUser() {
  if (isAuthDisabled()) {
    return getDevUser();
  }

  const { user, error } = await getUser();

  if (error || !user) {
    throw new Error("Authentication required");
  }

  return user;
}
