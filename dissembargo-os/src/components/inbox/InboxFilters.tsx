"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { INBOX_FILTER_OPTIONS, type InboxFilterCategory } from "@/lib/ai/constants";
import { cn } from "@/lib/utils/cn";

export function InboxFilters() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeFilter =
    (searchParams.get("filter") as InboxFilterCategory | null) ?? "all";

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {INBOX_FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.value;
        const params = new URLSearchParams(searchParams.toString());

        if (option.value === "all") {
          params.delete("filter");
        } else {
          params.set("filter", option.value);
        }

        const href = params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname;

        return (
          <Link
            key={option.value}
            href={href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "bg-surface-elevated text-muted hover:text-foreground",
            )}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}
