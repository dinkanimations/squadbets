"use client";

import { Bell, ChevronDown } from "lucide-react";
import { CURRENT_USER, NOTIFICATIONS } from "@/lib/data/dummy";
import { Avatar } from "@/components/ui/Avatar";
import { SearchInput } from "@/components/ui/SearchInput";
import { cn } from "@/lib/utils/cn";

export function TopNav() {
  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      <SearchInput className="max-w-md flex-1" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-foreground"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-lg px-2 py-1.5",
            "transition-colors duration-200 hover:bg-surface-elevated",
          )}
          aria-label="User profile menu"
        >
          <Avatar initials={CURRENT_USER.initials} size="sm" />
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium text-foreground">
              {CURRENT_USER.name}
            </p>
            <p className="text-xs text-muted">{CURRENT_USER.role}</p>
          </div>
          <ChevronDown
            className="hidden h-4 w-4 text-muted sm:block"
            strokeWidth={1.75}
          />
        </button>
      </div>
    </header>
  );
}
