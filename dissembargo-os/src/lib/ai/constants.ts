export const AI_EMAIL_CATEGORIES = [
  "new_business_opportunity",
  "existing_client",
  "supplier",
  "invoice",
  "recruitment",
  "marketing",
  "newsletter",
  "spam",
  "internal",
  "other",
] as const;

export type AiEmailCategory = (typeof AI_EMAIL_CATEGORIES)[number];

export const AI_CATEGORY_LABELS: Record<AiEmailCategory, string> = {
  new_business_opportunity: "New Job Enquiry",
  existing_client: "Existing Client",
  supplier: "Supplier",
  invoice: "Invoice",
  recruitment: "Recruitment",
  marketing: "Marketing",
  newsletter: "Newsletter",
  spam: "Spam",
  internal: "Internal",
  other: "Other",
};

export const JOB_ENQUIRY_CATEGORY: AiEmailCategory = "new_business_opportunity";

export const AUTO_OPPORTUNITY_CONFIDENCE_THRESHOLD = 90;

export const OPENAI_MODEL = "gpt-4o-mini";

export const PROMPT_VERSION = "v2";

export type AiClassificationResult = {
  category: AiEmailCategory;
  confidence: number;
  summary: string;
  reasoning: string;
  signature: string | null;
  company_name: string | null;
  contact_name: string | null;
  website: string | null;
  estimated_budget: number | null;
  requested_deliverables: string | null;
};

export type AiActionTaken =
  | "auto_opportunity"
  | "review_queue"
  | "classified_only"
  | "processing_failed";

export type AiFeedbackAction =
  | "approved"
  | "rejected"
  | "reclassified"
  | "manual_created";

export type InboxFilterCategory =
  | "all"
  | "job_enquiries"
  | "existing_clients"
  | "invoices"
  | "marketing"
  | "spam"
  | "unread";

export const INBOX_FILTER_OPTIONS: Array<{
  value: InboxFilterCategory;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "job_enquiries", label: "Job Enquiries" },
  { value: "existing_clients", label: "Existing Clients" },
  { value: "invoices", label: "Invoices" },
  { value: "marketing", label: "Marketing" },
  { value: "spam", label: "Spam" },
  { value: "unread", label: "Unread" },
];

export function isJobEnquiryCategory(
  category: AiEmailCategory | null | undefined,
): boolean {
  return category === JOB_ENQUIRY_CATEGORY;
}
