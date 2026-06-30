import type { User } from "@supabase/supabase-js";
import type { NavUser } from "@/lib/auth/profile";
import type { Profile } from "@/types/database";

const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

export function isAuthDisabled(): boolean {
  return (
    (process.env.DISABLE_AUTH === "true" ||
      process.env.NEXT_PUBLIC_DISABLE_AUTH === "true") &&
    process.env.NODE_ENV !== "production"
  );
}

export function getDevUser(): User {
  return {
    id: DEV_USER_ID,
    email: "dev@localhost",
    app_metadata: {},
    user_metadata: { full_name: "Dev User" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

export function getDevProfile(): Profile {
  return {
    id: DEV_USER_ID,
    full_name: "Dev User",
    avatar_url: null,
    role: "administrator",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function getDevNavUser(): NavUser {
  return {
    name: "Dev User",
    role: "Administrator",
    initials: "DU",
    email: "dev@localhost",
  };
}
