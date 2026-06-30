import { createAdminClient } from "@/lib/supabase/admin";
import type { Company, CompanyUpdate, Json } from "@/types/database";
import {
  AI_RESEARCH_CACHE_TTL_MS,
  type CompanyResearchResult,
  type ResearchableField,
} from "./constants";
import { detectCompanyWebsites } from "./detect-website";
import { buildLogoUrl, extractDomainFromUrl, normalizeWebsiteUrl } from "./normalize";
import { researchCompany } from "./research-company";

export interface EnrichCompanyInput {
  companyId: string;
  companyName: string;
  website?: string | null;
  emailBody?: string | null;
  senderEmail?: string | null;
  forceRefresh?: boolean;
}

function getManualOverrides(company: Company): Set<string> {
  const overrides = company.manual_overrides;
  if (!overrides || typeof overrides !== "object" || Array.isArray(overrides)) {
    return new Set();
  }

  return new Set(
    Object.entries(overrides as Record<string, boolean>)
      .filter(([, value]) => value)
      .map(([key]) => key),
  );
}

function isCacheValid(company: Company, forceRefresh?: boolean): boolean {
  if (forceRefresh) return false;
  if (!company.ai_research_cached_at) return false;

  const cachedAt = new Date(company.ai_research_cached_at).getTime();
  return Date.now() - cachedAt < AI_RESEARCH_CACHE_TTL_MS;
}

function applyResearchToUpdate(
  research: CompanyResearchResult,
  website: string | null,
  overrides: Set<string>,
): CompanyUpdate {
  const domain = extractDomainFromUrl(website);
  const update: CompanyUpdate = {
    ai_research_cached_at: new Date().toISOString(),
  };

  const fieldMap: Array<[ResearchableField, unknown]> = [
    ["industry", research.industry || null],
    ["ai_summary", research.company_summary || null],
    ["estimated_size", research.estimated_company_size || null],
    ["headquarters", research.headquarters || null],
    ["products", research.products],
    ["services", research.services],
    ["key_markets", research.key_markets],
    ["target_customers", research.target_customers],
    ["creative_opportunities", research.potential_creative_opportunities],
    ["suggested_services", research.suggested_services_we_could_offer],
    ["executive_summary", research.executive_summary || null],
  ];

  for (const [field, value] of fieldMap) {
    if (!overrides.has(field)) {
      (update as Record<string, unknown>)[field] = value;
    }
  }

  if (website && !overrides.has("website")) {
    update.website = website;
    update.website_domain = domain;
  }

  if (domain && !overrides.has("logo_url")) {
    update.logo_url = buildLogoUrl(domain);
  }

  return update;
}

export async function enrichCompany(
  input: EnrichCompanyInput,
): Promise<Company> {
  const admin = createAdminClient();

  const { data: company, error: fetchError } = await admin
    .from("companies")
    .select("*")
    .eq("id", input.companyId)
    .single();

  if (fetchError || !company) {
    throw new Error(`Company not found: ${input.companyId}`);
  }

  const typedCompany = company as Company;
  const overrides = getManualOverrides(typedCompany);

  let website = input.website?.trim()
    ? normalizeWebsiteUrl(input.website.trim())
    : typedCompany.website;

  let websiteCandidates: string[] = [];
  let pendingSelection = false;

  if (!website || input.forceRefresh) {
    const detection = await detectCompanyWebsites({
      companyName: input.companyName,
      emailBody: input.emailBody,
      detectedWebsite: input.website ?? typedCompany.website,
      senderEmail: input.senderEmail,
    });

    websiteCandidates = detection.websites;

    if (detection.websites.length === 1) {
      website = detection.websites[0];
      pendingSelection = false;
    } else if (detection.websites.length > 1) {
      pendingSelection = true;
      if (!website) {
        website = null;
      }
    }
  }

  const websiteUpdate: CompanyUpdate = {
    website_candidates: websiteCandidates as unknown as Json,
    website_pending_selection: pendingSelection,
  };

  if (website && !overrides.has("website")) {
    const domain = extractDomainFromUrl(website);
    websiteUpdate.website = website;
    websiteUpdate.website_domain = domain;
    if (!overrides.has("logo_url")) {
      websiteUpdate.logo_url = buildLogoUrl(domain);
    }
    websiteUpdate.website_pending_selection = false;
  }

  if (pendingSelection && !website) {
    await admin
      .from("companies")
      .update(websiteUpdate)
      .eq("id", input.companyId);

    const { data: updated } = await admin
      .from("companies")
      .select("*")
      .eq("id", input.companyId)
      .single();

    return updated as Company;
  }

  if (isCacheValid(typedCompany, input.forceRefresh) && !input.forceRefresh) {
    if (Object.keys(websiteUpdate).length > 1) {
      await admin
        .from("companies")
        .update(websiteUpdate)
        .eq("id", input.companyId);
    }
    return typedCompany;
  }

  const { result, rawResponse } = await researchCompany({
    companyName: input.companyName,
    website,
    emailContext: input.emailBody,
  });

  const researchUpdate = applyResearchToUpdate(result, website, overrides);

  const { data: enriched, error: updateError } = await admin
    .from("companies")
    .update({
      ...websiteUpdate,
      ...researchUpdate,
      ai_research_raw: rawResponse as Json,
    })
    .eq("id", input.companyId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to enrich company: ${updateError.message}`);
  }

  return enriched as Company;
}

export async function enrichCompanyForOpportunity(input: {
  companyId: string;
  companyName: string;
  website?: string | null;
  emailBody?: string | null;
  senderEmail?: string | null;
}): Promise<void> {
  try {
    await enrichCompany(input);
  } catch (error) {
    console.error("[company-intelligence] enrich failed:", error);
  }
}

export async function selectCompanyWebsite(
  companyId: string,
  website: string,
): Promise<Company> {
  const admin = createAdminClient();
  const normalized = normalizeWebsiteUrl(website);
  const domain = extractDomainFromUrl(normalized);

  const { data: company } = await admin
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();

  if (!company) {
    throw new Error("Company not found.");
  }

  const { error } = await admin
    .from("companies")
    .update({
      website: normalized,
      website_domain: domain,
      logo_url: buildLogoUrl(domain),
      website_pending_selection: false,
      website_candidates: [],
    })
    .eq("id", companyId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set website: ${error.message}`);
  }

  return enrichCompany({
    companyId,
    companyName: (company as Company).company_name,
    website: normalized,
    forceRefresh: true,
  });
}
