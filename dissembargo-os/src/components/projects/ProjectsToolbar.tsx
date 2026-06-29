"use client";

import { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
} from "@/lib/projects/constants";

export function ProjectsToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const searchValue = String(formData.get("search") ?? "").trim();
    const statusValue = String(formData.get("status") ?? "");
    if (searchValue) params.set("search", searchValue);
    if (statusValue) params.set("status", statusValue);
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-wrap gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            name="search"
            placeholder="Search projects..."
            defaultValue={search}
            className="pl-9"
          />
        </div>
        <Select
          name="status"
          defaultValue={status}
          options={[
            { value: "", label: "All statuses" },
            ...PROJECT_STATUSES.filter((s) => s !== "archived").map((s) => ({
              value: s,
              label: PROJECT_STATUS_LABELS[s],
            })),
          ]}
          className="w-44"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <Link href="/projects/new">
        <Button>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </Link>
    </div>
  );
}
