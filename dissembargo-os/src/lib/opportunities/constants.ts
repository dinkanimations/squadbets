import type { OpportunityStatus } from "@/types/database";
import type { Company, Contact, Opportunity } from "@/types/database";

export const OPPORTUNITY_STATUSES: OpportunityStatus[] = [
  "new",
  "contacted",
  "quote_requested",
  "quote_sent",
  "won",
  "lost",
  "archived",
];

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quote_requested: "Quote Requested",
  quote_sent: "Quote Sent",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};

export type OpportunityWithRelations = Opportunity & {
  company: Company;
  contact: Contact | null;
};

export type SortOrder = "asc" | "desc";

export type OpportunitiesFilter = {
  status?: OpportunityStatus;
  search?: string;
  sort?: SortOrder;
  page?: number;
  pageSize?: number;
};
