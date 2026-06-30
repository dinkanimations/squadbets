"use client";

import { formatQuoteDate } from "@/lib/quotes/calculations";
import { Input } from "@/components/ui/Input";

interface QuoteHeaderBarProps {
  clientName: string;
  projectTitle: string;
  version: string;
  issueDate?: string;
  onClientNameChange: (value: string) => void;
  onProjectTitleChange: (value: string) => void;
  onVersionChange: (value: string) => void;
}

export function QuoteHeaderBar({
  clientName,
  projectTitle,
  version,
  issueDate,
  onClientNameChange,
  onProjectTitleChange,
  onVersionChange,
}: QuoteHeaderBarProps) {
  const displayDate = issueDate
    ? formatQuoteDate(issueDate)
    : formatQuoteDate(new Date().toISOString());

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Input
        label="Client"
        value={clientName}
        onChange={(event) => onClientNameChange(event.target.value)}
        placeholder="Enter client name"
      />
      <Input
        label="Project Name"
        value={projectTitle}
        onChange={(event) => onProjectTitleChange(event.target.value)}
        placeholder="e.g. Product Launch Film"
      />
      <Input
        label="Version"
        value={version}
        onChange={(event) => onVersionChange(event.target.value)}
        placeholder="e.g. V1, Draft, Final"
      />
      <Input
        label="Date"
        value={displayDate}
        readOnly
        className="bg-surface-elevated/60"
      />
    </div>
  );
}
