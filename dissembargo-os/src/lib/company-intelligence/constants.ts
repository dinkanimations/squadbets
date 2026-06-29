export const RESEARCH_MODEL = "gpt-4o-mini";
export const RESEARCH_PROMPT_VERSION = "company-research-v1";
export const WEBSITE_DETECTION_PROMPT_VERSION = "website-detection-v1";

/** Skip AI research if cache is newer than this (milliseconds). */
export const AI_RESEARCH_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const RESEARCHABLE_FIELDS = [
  "company_name",
  "website",
  "industry",
  "ai_summary",
  "estimated_size",
  "headquarters",
  "products",
  "services",
  "key_markets",
  "target_customers",
  "creative_opportunities",
  "suggested_services",
  "executive_summary",
  "logo_url",
] as const;

export type ResearchableField = (typeof RESEARCHABLE_FIELDS)[number];

export type CompanyResearchResult = {
  company_summary: string;
  industry: string;
  products: string[];
  services: string[];
  headquarters: string;
  estimated_company_size: string;
  key_markets: string[];
  target_customers: string[];
  potential_creative_opportunities: string[];
  suggested_services_we_could_offer: string[];
  executive_summary: string;
};

export type WebsiteDetectionResult = {
  websites: string[];
  confidence: number;
  reasoning: string;
};
