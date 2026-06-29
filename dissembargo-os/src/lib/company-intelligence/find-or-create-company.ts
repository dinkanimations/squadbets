import { createAdminClient } from "@/lib/supabase/admin";
import type { Company, CompanyInsert } from "@/types/database";
import {
  buildLogoUrl,
  extractDomainFromUrl,
  normalizeCompanyName,
  normalizeWebsiteUrl,
} from "./normalize";

export interface FindOrCreateCompanyInput {
  companyName: string;
  website?: string | null;
  emailBody?: string | null;
  senderEmail?: string | null;
}

async function findExistingCompany(
  normalizedName: string,
  websiteDomain: string | null,
): Promise<Company | null> {
  const admin = createAdminClient();

  if (websiteDomain) {
    const { data: byDomain } = await admin
      .from("companies")
      .select("*")
      .eq("website_domain", websiteDomain)
      .eq("status", "active")
      .maybeSingle();

    if (byDomain) return byDomain as Company;
  }

  if (normalizedName) {
    const { data: byName } = await admin
      .from("companies")
      .select("*")
      .eq("normalized_name", normalizedName)
      .eq("status", "active")
      .maybeSingle();

    if (byName) return byName as Company;
  }

  return null;
}

export async function findOrCreateCompany(
  input: FindOrCreateCompanyInput,
): Promise<Company> {
  const companyName = input.companyName.trim() || "Unknown Company";
  const normalizedName = normalizeCompanyName(companyName);
  const website = input.website?.trim()
    ? normalizeWebsiteUrl(input.website.trim())
    : null;
  const websiteDomain = extractDomainFromUrl(website);

  const existing = await findExistingCompany(normalizedName, websiteDomain);

  if (existing) {
    const updates: Partial<CompanyInsert> = {};

    if (website && !existing.website) {
      updates.website = website;
      updates.website_domain = websiteDomain;
      updates.logo_url = buildLogoUrl(websiteDomain);
    }

    if (Object.keys(updates).length > 0) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("companies")
        .update(updates)
        .eq("id", existing.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update company: ${error.message}`);
      }

      return data as Company;
    }

    return existing;
  }

  const admin = createAdminClient();

  const insert: CompanyInsert = {
    company_name: companyName,
    normalized_name: normalizedName || null,
    website,
    website_domain: websiteDomain,
    logo_url: buildLogoUrl(websiteDomain),
  };

  const { data, error } = await admin
    .from("companies")
    .insert(insert)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      const retry = await findExistingCompany(normalizedName, websiteDomain);
      if (retry) return retry;
    }
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return data as Company;
}

export async function findOrCreateContact(
  companyId: string,
  fullName: string,
  email: string | null,
): Promise<{ id: string }> {
  const admin = createAdminClient();

  if (email) {
    const { data: existing } = await admin
      .from("contacts")
      .select("id")
      .eq("company_id", companyId)
      .ilike("email", email)
      .maybeSingle();

    if (existing) return existing;
  }

  const { data, error } = await admin
    .from("contacts")
    .insert({
      company_id: companyId,
      full_name: fullName.trim() || "Unknown Contact",
      email,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  return data;
}
