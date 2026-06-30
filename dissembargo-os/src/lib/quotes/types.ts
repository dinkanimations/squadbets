import type { QuoteStatus } from "@/types/database";

export type QuotesFilter = {
  search?: string;
  status?: QuoteStatus;
  archived?: boolean;
};
