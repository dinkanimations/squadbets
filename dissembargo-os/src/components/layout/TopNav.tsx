"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import type { NavUser } from "@/lib/auth/profile";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils/cn";

interface TopNavProps {
  user: NavUser;
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();

    if (!query) return;

    router.push(`/opportunities?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <form onSubmit={handleSearch} className="max-w-md flex-1">
        <SearchInput
          className="w-full"
          placeholder="Search opportunities..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          aria-label="Search opportunities"
        />
      </form>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
          aria-label="Notifications"
          disabled
          title="Notifications coming soon"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <details className="relative">
          <summary
            className={cn(
              "flex cursor-pointer list-none items-center gap-3 rounded-lg px-2 py-1.5",
              "transition-colors duration-200 hover:bg-surface-elevated",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
              "[&::-webkit-details-marker]:hidden",
            )}
            aria-label="User profile menu"
          >
            <Avatar initials={user.initials} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted">{user.role}</p>
            </div>
            <ChevronDown
              className="hidden h-4 w-4 text-muted sm:block"
              strokeWidth={1.75}
            />
          </summary>
          <div
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card p-2 shadow-lg"
            role="menu"
          >
            <p className="px-2 py-1.5 text-xs text-muted">{user.email}</p>
            <SignOutButton />
          </div>
        </details>
      </div>
    </header>
  );
}
