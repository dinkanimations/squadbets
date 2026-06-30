"use client";

import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Sign out
      </button>
    </form>
  );
}
