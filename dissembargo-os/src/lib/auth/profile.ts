import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export interface NavUser {
  name: string;
  role: string;
  initials: string;
  email: string;
}

function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export function buildNavUser(user: User, profile: Profile | null): NavUser {
  const name =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  const role = profile?.role ? formatRoleLabel(profile.role) : "Team Member";

  return {
    name,
    role,
    initials: getInitials(name),
    email: user.email ?? "",
  };
}
