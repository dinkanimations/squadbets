"use client";

import { formatQuoteDate } from "@/lib/quotes/calculations";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

type CompanyOption = { id: string; company_name: string };

interface QuoteHeaderBarProps {
  companies: CompanyOption[];
  companyId: string;
  projectTitle: string;
  quoteNumber?: string;
  issueDate?: string;
  onCompanyChange: (companyId: string) => void;
  onProjectTitleChange: (value: string) => void;
}

export function QuoteHeaderBar({
  companies,
  companyId,
  projectTitle,
  quoteNumber,
  issueDate,
  onCompanyChange,
  onProjectTitleChange,
}: QuoteHeaderBarProps) {
  const displayDate = issueDate
    ? formatQuoteDate(issueDate)
    : formatQuoteDate(new Date().toISOString());

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Select
        label="Client"
        value={companyId}
        onChange={(event) => onCompanyChange(event.target.value)}
        options={[
          { value: "", label: "Select client" },
          ...companies.map((company) => ({
            value: company.id,
            label: company.company_name,
          })),
        ]}
      />
      <Input
        label="Project Name"
        value={projectTitle}
        onChange={(event) => onProjectTitleChange(event.target.value)}
        placeholder="e.g. Product Launch Film"
      />
      <Input
        label="Version"
        value={quoteNumber ?? "Draft"}
        readOnly
        className="bg-surface-elevated/60"
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
