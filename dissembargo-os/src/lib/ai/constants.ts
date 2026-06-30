export const AI_EMAIL_CATEGORIES = [
  "new_business_opportunity",
  "existing_client",
  "supplier",
  "invoice",
  "receipt",
  "recruitment",
  "marketing",
  "newsletter",
  "spam",
  "password_reset",
  "calendar",
  "social_notification",
  "internal",
  "other",
] as const;

export type AiEmailCategory = (typeof AI_EMAIL_CATEGORIES)[number];

export const AI_CATEGORY_LABELS: Record<AiEmailCategory, string> = {
  new_business_opportunity: "New Business",
  existing_client: "Existing Client",
  supplier: "Supplier",
  invoice: "Invoice",
  receipt: "Receipt",
  recruitment: "Recruitment",
  marketing: "Marketing",
  newsletter: "Newsletter",
  spam: "Spam",
  password_reset: "Password Reset",
  calendar: "Calendar",
  social_notification: "Social",
  internal: "Internal",
  other: "Other",
};

export const JOB_ENQUIRY_CATEGORY: AiEmailCategory = "new_business_opportunity";
export const EXISTING_CLIENT_CATEGORY: AiEmailCategory = "existing_client";

/** Categories that should never appear in the Inbox — left in Gmail only. */
export const IGNORED_EMAIL_CATEGORIES: AiEmailCategory[] = [
  "supplier",
  "invoice",
  "receipt",
  "recruitment",
  "marketing",
  "newsletter",
  "spam",
  "password_reset",
  "calendar",
  "social_notification",
  "internal",
  "other",
];

export const AUTO_OPPORTUNITY_CONFIDENCE_THRESHOLD = 90;

/** Minimum confidence to surface a new business enquiry in Inbox. */
export const POTENTIAL_OPPORTUNITY_MIN_CONFIDENCE = 50;

/** Minimum confidence to surface an existing-client communication in Inbox. */
export const CLIENT_COMMUNICATION_MIN_CONFIDENCE = 40;

export const OPENAI_MODEL = "gpt-4o-mini";

export const PROMPT_VERSION = "v4";

export type InboxRoutingIntent =
  | "new_business_enquiry"
  | "existing_client_communication"
  | "not_relevant";

export type AiClassificationResult = {
  category: AiEmailCategory;
  routing_intent: InboxRoutingIntent;
  confidence: number;
  summary: string;
  reasoning: string;
  signature: string | null;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  project_name: string | null;
  project_description: string | null;
  estimated_budget: number | null;
  requested_deliverables: string | null;
  deadline: string | null;
  location: string | null;
};

export type AiActionTaken =
  | "auto_opportunity"
  | "potential_opportunity"
  | "client_communication"
  | "ignored"
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
  | "new_business"
  | "existing_clients"
  | "suppliers"
  | "invoices"
  | "marketing"
  | "spam"
  | "unread";

export const INBOX_FILTER_OPTIONS: Array<{
  value: InboxFilterCategory;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "new_business", label: "New Business" },
  { value: "existing_clients", label: "Existing Clients" },
  { value: "suppliers", label: "Suppliers" },
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

export function isExistingClientCategory(
  category: AiEmailCategory | null | undefined,
): boolean {
  return category === EXISTING_CLIENT_CATEGORY;
}

export function isIgnoredEmailCategory(
  category: AiEmailCategory | null | undefined,
): boolean {
  return category ? IGNORED_EMAIL_CATEGORIES.includes(category) : true;
}

export function routingIntentFromCategory(
  category: AiEmailCategory,
): InboxRoutingIntent {
  if (category === JOB_ENQUIRY_CATEGORY) return "new_business_enquiry";
  if (category === EXISTING_CLIENT_CATEGORY) {
    return "existing_client_communication";
  }
  return "not_relevant";
}

export function classificationFromInboxFields(
  inbox: {
    ai_category?: AiEmailCategory | null;
    ai_confidence?: number | null;
    ai_summary?: string | null;
    ai_reasoning?: string | null;
    ai_signature?: string | null;
    sender_name?: string | null;
    sender_email?: string | null;
    detected_website?: string | null;
    detected_company_name?: string | null;
  },
  overrides: Partial<AiClassificationResult> = {},
): AiClassificationResult {
  const category =
    overrides.category ??
    inbox.ai_category ??
    JOB_ENQUIRY_CATEGORY;

  return {
    category,
    routing_intent:
      overrides.routing_intent ?? routingIntentFromCategory(category),
    confidence: overrides.confidence ?? inbox.ai_confidence ?? 0,
    summary: overrides.summary ?? inbox.ai_summary ?? "",
    reasoning: overrides.reasoning ?? inbox.ai_reasoning ?? "",
    signature: overrides.signature ?? inbox.ai_signature ?? null,
    company_name:
      overrides.company_name ??
      inbox.detected_company_name ??
      null,
    contact_name: overrides.contact_name ?? inbox.sender_name ?? null,
    contact_email: overrides.contact_email ?? inbox.sender_email ?? null,
    contact_phone: overrides.contact_phone ?? null,
    website: overrides.website ?? inbox.detected_website ?? null,
    project_name: overrides.project_name ?? null,
    project_description: overrides.project_description ?? null,
    estimated_budget: overrides.estimated_budget ?? null,
    requested_deliverables: overrides.requested_deliverables ?? null,
    deadline: overrides.deadline ?? null,
    location: overrides.location ?? null,
  };
}
