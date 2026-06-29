"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  OPPORTUNITY_STATUSES,
  OPPORTUNITY_STATUS_LABELS,
} from "@/lib/opportunities/constants";

interface OpportunitiesToolbarProps {
  onCreateClick: () => void;
}

export function OpportunitiesToolbar({ onCreateClick }: OpportunitiesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSearch = searchParams.get("q") ?? "";
  const currentStatus = searchParams.get("status") ?? "";
  const currentSort = searchParams.get("sort") ?? "desc";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`/opportunities?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateParams({ q: value || null });
    }, 300);
  };

  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            strokeWidth={1.75}
          />
          <input
            key={currentSearch}
            type="search"
            placeholder="Search opportunities..."
            defaultValue={currentSearch}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface-elevated pl-9 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>

        <Select
          name="status"
          value={currentStatus}
          onChange={(event) =>
            updateParams({ status: event.target.value || null })
          }
          options={[
            { value: "", label: "All statuses" },
            ...OPPORTUNITY_STATUSES.map((status) => ({
              value: status,
              label: OPPORTUNITY_STATUS_LABELS[status],
            })),
          ]}
          className="sm:w-44"
        />

        <Select
          name="sort"
          value={currentSort}
          onChange={(event) => updateParams({ sort: event.target.value })}
          options={[
            { value: "desc", label: "Newest first" },
            { value: "asc", label: "Oldest first" },
          ]}
          className="sm:w-40"
        />
      </div>

      <Button onClick={onCreateClick} disabled={isPending}>
        New Opportunity
      </Button>
    </div>
  );
}
