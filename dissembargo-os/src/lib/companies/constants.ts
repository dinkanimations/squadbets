import type { Company, Contact, Opportunity } from "@/types/database";

export type CompanyWithRelations = Company;

export type CompanyProfileData = {
  company: Company;
  contacts: Contact[];
  opportunities: Array<Opportunity & { contact: Contact | null }>;
  projects: Array<{
    id: string;
    project_name: string;
    status: string;
    start_date: string | null;
    delivery_date: string | null;
  }>;
  quotes: Array<{
    id: string;
    quote_status: string;
    total: number;
    project_id: string;
  }>;
  client: { id: string; client_status: string } | null;
};

export function formatCompanyDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function parseWebsiteCandidates(candidates: unknown): string[] {
  if (!Array.isArray(candidates)) return [];
  return candidates.filter((c): c is string => typeof c === "string");
}
