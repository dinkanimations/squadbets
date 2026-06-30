/** CRM email routing — every imported email is exactly one of these. */
export const CRM_EMAIL_ROUTES = [
  "potential_opportunity",
  "freelancer",
  "other",
] as const;

export type CrmEmailRoute = (typeof CRM_EMAIL_ROUTES)[number];

export const CRM_ROUTE_LABELS: Record<CrmEmailRoute, string> = {
  potential_opportunity: "Potential Client Opportunity",
  freelancer: "Freelancer",
  other: "Other",
};

/** Minimum confidence to auto-create Potential Opportunity or Freelancer records. */
export const AUTO_CLASSIFY_MIN_CONFIDENCE = 80;

export const POTENTIAL_OPPORTUNITY_MIN_CONFIDENCE = AUTO_CLASSIFY_MIN_CONFIDENCE;
export const FREELANCER_MIN_CONFIDENCE = AUTO_CLASSIFY_MIN_CONFIDENCE;

export const OPENAI_MODEL = "gpt-4o-mini";
export const PROMPT_VERSION = "v6";

/** @deprecated Legacy categories kept for existing inbox rows and logs */
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

export type AiClassificationResult = {
  route: CrmEmailRoute;
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
  freelancer_name: string | null;
  freelancer_email: string | null;
  role: string | null;
  skills: string | null;
  software: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  day_rate: number | null;
  availability: string | null;
  notes: string | null;
};

export type AiActionTaken =
  | "potential_opportunity"
  | "freelancer"
  | "needs_review"
  | "ignored"
  | "classified_only"
  | "processing_failed";

export type AiFeedbackAction =
  | "approved"
  | "rejected"
  | "reclassified"
  | "manual_created";

export function isAutoClassifyConfidence(confidence: number): boolean {
  return confidence >= AUTO_CLASSIFY_MIN_CONFIDENCE;
}

export function legacyCategoryToRoute(
  category: AiEmailCategory | null | undefined,
): CrmEmailRoute {
  if (category === "new_business_opportunity") return "potential_opportunity";
  if (category === "recruitment") return "freelancer";
  return "other";
}

export const JOB_ENQUIRY_CATEGORY: AiEmailCategory = "new_business_opportunity";
export const EXISTING_CLIENT_CATEGORY: AiEmailCategory = "existing_client";

export const IGNORED_EMAIL_CATEGORIES: AiEmailCategory[] = [
  "supplier",
  "invoice",
  "receipt",
  "marketing",
  "newsletter",
  "spam",
  "password_reset",
  "calendar",
  "social_notification",
  "internal",
  "other",
];

export type InboxFilterCategory =
  | "all"
  | "new_business"
  | "freelancers"
  | "other"
  | "unread";

export const INBOX_FILTER_OPTIONS: Array<{
  value: InboxFilterCategory;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "new_business", label: "Potential Opportunities" },
  { value: "freelancers", label: "Freelancers" },
  { value: "other", label: "Other" },
  { value: "unread", label: "Unread" },
];

export function isIgnoredEmailCategory(
  category: AiEmailCategory | null | undefined,
): boolean {
  return category ? IGNORED_EMAIL_CATEGORIES.includes(category) : true;
}

export function isExistingClientCategory(
  category: AiEmailCategory | null | undefined,
): boolean {
  return category === EXISTING_CLIENT_CATEGORY;
}

export function routeToLegacyCategory(route: CrmEmailRoute): AiEmailCategory {
  switch (route) {
    case "potential_opportunity":
      return "new_business_opportunity";
    case "freelancer":
      return "recruitment";
    default:
      return "other";
  }
}

export function isJobEnquiryCategory(
  category: AiEmailCategory | null | undefined,
): boolean {
  return category === "new_business_opportunity";
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
  const route: CrmEmailRoute =
    overrides.route ?? legacyCategoryToRoute(inbox.ai_category);

  return {
    route,
    confidence: overrides.confidence ?? inbox.ai_confidence ?? 0,
    summary: overrides.summary ?? inbox.ai_summary ?? "",
    reasoning: overrides.reasoning ?? inbox.ai_reasoning ?? "",
    signature: overrides.signature ?? inbox.ai_signature ?? null,
    company_name:
      overrides.company_name ?? inbox.detected_company_name ?? null,
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
    freelancer_name: overrides.freelancer_name ?? inbox.sender_name ?? null,
    freelancer_email: overrides.freelancer_email ?? inbox.sender_email ?? null,
    role: overrides.role ?? null,
    skills: overrides.skills ?? null,
    software: overrides.software ?? null,
    portfolio_url: overrides.portfolio_url ?? null,
    linkedin_url: overrides.linkedin_url ?? null,
    day_rate: overrides.day_rate ?? null,
    availability: overrides.availability ?? null,
    notes: overrides.notes ?? null,
  };
}
