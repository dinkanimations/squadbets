export const AI_EMAIL_CATEGORIES = [
  "new_business_opportunity",
  "existing_client",
  "supplier",
  "invoice",
  "marketing",
  "recruitment",
  "spam",
  "other",
] as const;

export type AiEmailCategory = (typeof AI_EMAIL_CATEGORIES)[number];

export const AI_CATEGORY_LABELS: Record<AiEmailCategory, string> = {
  new_business_opportunity: "New Business Opportunity",
  existing_client: "Existing Client",
  supplier: "Supplier",
  invoice: "Invoice",
  marketing: "Marketing",
  recruitment: "Recruitment",
  spam: "Spam",
  other: "Other",
};

export const AUTO_OPPORTUNITY_CONFIDENCE_THRESHOLD = 90;

export const OPENAI_MODEL = "gpt-4o-mini";

export const PROMPT_VERSION = "v1";

export type AiClassificationResult = {
  category: AiEmailCategory;
  confidence: number;
  summary: string;
  reasoning: string;
  signature: string | null;
  company_name: string | null;
  contact_name: string | null;
  website: string | null;
};

export type AiActionTaken =
  | "auto_opportunity"
  | "review_queue"
  | "classified_only"
  | "processing_failed";
