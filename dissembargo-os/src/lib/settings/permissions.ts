import type { UserRole } from "@/types/database";
import type { Permission } from "./types";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  administrator: [
    "settings.manage",
    "team.manage",
    "quotes.read",
    "quotes.write",
    "schedules.read",
    "schedules.write",
    "projects.read",
    "projects.write",
    "companies.read",
    "companies.write",
    "inbox.read",
    "integrations.manage",
  ],
  producer: [
    "quotes.read",
    "quotes.write",
    "schedules.read",
    "schedules.write",
    "projects.read",
    "projects.write",
    "companies.read",
    "inbox.read",
  ],
  creative_director: [
    "quotes.read",
    "quotes.write",
    "schedules.read",
    "schedules.write",
    "projects.read",
    "projects.write",
    "companies.read",
  ],
  designer: [
    "quotes.read",
    "schedules.read",
    "projects.read",
    "companies.read",
  ],
  freelancer: ["quotes.read", "schedules.read", "projects.read"],
  viewer: [
    "quotes.read",
    "schedules.read",
    "projects.read",
    "companies.read",
  ],
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrator",
  producer: "Producer",
  creative_director: "Creative Director",
  designer: "Designer",
  freelancer: "Freelancer",
  viewer: "Viewer",
};

export const USER_ROLES: UserRole[] = [
  "administrator",
  "producer",
  "creative_director",
  "designer",
  "freelancer",
  "viewer",
];

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
