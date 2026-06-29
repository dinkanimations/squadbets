"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateCompany } from "@/lib/database/companies";
import {
  enrichCompany,
  selectCompanyWebsite,
} from "@/lib/company-intelligence/enrich-company";
import {
  extractDomainFromUrl,
  normalizeCompanyName,
  normalizeWebsiteUrl,
  buildLogoUrl,
} from "@/lib/company-intelligence/normalize";
import type { CompanyStatus, Json } from "@/types/database";

export type CompanyActionState = {
  error?: string;
  success?: string;
};

function parseStringArray(value: FormDataEntryValue | null): string[] {
  const raw = String(value ?? "").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseManualOverrides(formData: FormData): Record<string, boolean> {
  const fields = [
    "company_name",
    "website",
    "industry",
    "ai_summary",
    "estimated_size",
    "headquarters",
    "executive_summary",
    "internal_notes",
    "products",
    "services",
    "key_markets",
    "target_customers",
    "creative_opportunities",
    "suggested_services",
    "logo_url",
  ];

  const overrides: Record<string, boolean> = {};
  for (const field of fields) {
    if (formData.get(`override_${field}`) === "on") {
      overrides[field] = true;
    }
  }
  return overrides;
}

export async function refreshCompanyResearchAction(
  companyId: string,
): Promise<CompanyActionState> {
  try {
    const { getCompanyById } = await import("@/lib/database/companies");
    const company = await getCompanyById(companyId);

    await enrichCompany({
      companyId,
      companyName: company.company_name,
      website: company.website,
      forceRefresh: true,
    });

    revalidatePath(`/companies/${companyId}`);
    revalidatePath("/companies");
    revalidatePath("/");

    return { success: "AI research refreshed." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to refresh research.",
    };
  }
}

export async function selectCompanyWebsiteAction(
  companyId: string,
  website: string,
): Promise<CompanyActionState> {
  try {
    await selectCompanyWebsite(companyId, website);

    revalidatePath(`/companies/${companyId}`);
    revalidatePath("/companies");
    revalidatePath("/");

    return { success: "Website selected and research started." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to select website.",
    };
  }
}

export async function updateCompanyAction(
  _prevState: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Company ID is required." };

  try {
    const companyName = String(formData.get("companyName") ?? "").trim();
    if (!companyName) return { error: "Company name is required." };

    const websiteRaw = String(formData.get("website") ?? "").trim();
    const website = websiteRaw ? normalizeWebsiteUrl(websiteRaw) : null;
    const domain = extractDomainFromUrl(website);
    const manualOverrides = parseManualOverrides(formData);

    await updateCompany(id, {
      company_name: companyName,
      normalized_name: normalizeCompanyName(companyName) || null,
      website,
      website_domain: domain,
      logo_url:
        String(formData.get("logoUrl") ?? "").trim() ||
        buildLogoUrl(domain),
      industry: String(formData.get("industry") ?? "").trim() || null,
      ai_summary: String(formData.get("aiSummary") ?? "").trim() || null,
      executive_summary:
        String(formData.get("executiveSummary") ?? "").trim() || null,
      estimated_size: String(formData.get("estimatedSize") ?? "").trim() || null,
      headquarters: String(formData.get("headquarters") ?? "").trim() || null,
      internal_notes: String(formData.get("internalNotes") ?? "").trim() || null,
      products: parseStringArray(formData.get("products")),
      services: parseStringArray(formData.get("services")),
      key_markets: parseStringArray(formData.get("keyMarkets")),
      target_customers: parseStringArray(formData.get("targetCustomers")),
      creative_opportunities: parseStringArray(formData.get("creativeOpportunities")),
      suggested_services: parseStringArray(formData.get("suggestedServices")),
      manual_overrides: manualOverrides as unknown as Json,
    });

    revalidatePath(`/companies/${id}`);
    revalidatePath("/companies");
    revalidatePath("/opportunities");

    return { success: "Company updated successfully." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update company.",
    };
  }
}

export async function markAsExistingClientAction(
  companyId: string,
  isExistingClient: boolean,
): Promise<CompanyActionState> {
  try {
    await updateCompany(companyId, { is_existing_client: isExistingClient });

    revalidatePath(`/companies/${companyId}`);
    revalidatePath("/companies");

    return {
      success: isExistingClient
        ? "Marked as existing client."
        : "Removed existing client flag.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update client status.",
    };
  }
}

export async function archiveCompanyAction(
  companyId: string,
): Promise<CompanyActionState> {
  try {
    await updateCompany(companyId, { status: "archived" as CompanyStatus });

    revalidatePath("/companies");
    revalidatePath("/");

    redirect("/companies");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to archive company.",
    };
  }
}

export async function addCompanyNoteAction(
  companyId: string,
  note: string,
): Promise<CompanyActionState> {
  try {
    const { getCompanyById } = await import("@/lib/database/companies");
    const company = await getCompanyById(companyId);
    const timestamp = new Date().toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const existing = company.internal_notes?.trim() ?? "";
    const entry = `[${timestamp}]\n${note.trim()}`;
    const updated = existing ? `${existing}\n\n${entry}` : entry;

    await updateCompany(companyId, { internal_notes: updated });

    revalidatePath(`/companies/${companyId}`);

    return { success: "Note added." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to add note.",
    };
  }
}
