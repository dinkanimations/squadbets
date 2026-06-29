import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AppSettings, AppSettingsUpdate, MilestoneType } from "@/types/database";
import { handleDatabaseError } from "./utils";
import type { AppSettingsData } from "@/lib/settings/types";
import { STATIC_APP_SETTINGS } from "@/lib/settings/defaults";

function parseStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is string => typeof item === "string");
}

function parseNumberRecord(value: unknown, fallback: Record<string, number>): Record<string, number> {
  if (!value || typeof value !== "object") return fallback;
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof val === "number") result[key] = val;
  }
  return Object.keys(result).length > 0 ? result : fallback;
}

function parseNumberArray(value: unknown, fallback: number[]): number[] {
  if (!Array.isArray(value)) return fallback;
  return value.filter((item): item is number => typeof item === "number");
}

export function mapAppSettingsRow(row: AppSettings): AppSettingsData {
  return {
    companyName: row.company_name,
    companyLogoUrl: row.company_logo_url,
    companyAddress: row.company_address ?? STATIC_APP_SETTINGS.companyAddress,
    companyEmail: row.company_email ?? STATIC_APP_SETTINGS.companyEmail,
    companyPhone: row.company_phone,
    website: row.website ?? STATIC_APP_SETTINGS.website,
    defaultCurrency: row.default_currency,
    timezone: row.timezone,
    defaultLanguage: row.default_language,
    quoteValidityDays: row.quote_validity_days,
    defaultBudgetSections: parseStringArray(
      row.default_budget_sections,
      STATIC_APP_SETTINGS.defaultBudgetSections,
    ),
    defaultDayRates: parseNumberRecord(
      row.default_day_rates,
      STATIC_APP_SETTINGS.defaultDayRates,
    ),
    defaultDiscountType: row.default_discount_type,
    defaultDiscountValue: Number(row.default_discount_value ?? 0),
    defaultTerms: parseStringArray(
      row.default_terms,
      STATIC_APP_SETTINGS.defaultTerms,
    ),
    defaultPhases: parseStringArray(
      row.default_phases,
      STATIC_APP_SETTINGS.defaultPhases,
    ),
    phaseWeights: parseNumberRecord(
      row.phase_weights,
      STATIC_APP_SETTINGS.phaseWeights,
    ),
    defaultMilestones: parseStringArray(
      row.default_milestones,
      STATIC_APP_SETTINGS.defaultMilestones,
    ) as MilestoneType[],
    defaultReviewRounds: row.default_review_rounds,
    defaultScheduleDurationDays: row.default_schedule_duration_days,
    workingDays: parseNumberArray(row.working_days, STATIC_APP_SETTINGS.workingDays),
    companyHolidays: parseStringArray(
      row.company_holidays,
      STATIC_APP_SETTINGS.companyHolidays,
    ),
    emailSignature: row.email_signature,
    pdfHeaderLogoUrl: row.pdf_header_logo_url,
    pdfFooterText: row.pdf_footer_text,
    pdfTagline: row.pdf_tagline ?? STATIC_APP_SETTINGS.pdfTagline,
    pdfColors: {
      ...STATIC_APP_SETTINGS.pdfColors,
      ...(row.pdf_colors as AppSettingsData["pdfColors"] | null),
    },
    notifyEmail: row.notify_email,
    notifyDeadlines: row.notify_deadlines,
    notifyQuoteApproval: row.notify_quote_approval,
    notifyClientFeedback: row.notify_client_feedback,
    notifyAiProcessing: row.notify_ai_processing,
  };
}

export async function getAppSettingsRow(): Promise<AppSettings | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .select("*")
    .eq("id", "default")
    .maybeSingle();

  if (error) handleDatabaseError(error, "Failed to fetch app settings");

  return data as AppSettings | null;
}

export async function getAppSettings(): Promise<AppSettingsData> {
  const row = await getAppSettingsRow();
  if (!row) return STATIC_APP_SETTINGS;
  return mapAppSettingsRow(row);
}

export const getCachedAppSettings = cache(getAppSettings);

export async function updateAppSettings(input: AppSettingsUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_settings")
    .update(input)
    .eq("id", "default")
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to update app settings");

  return data as AppSettings;
}
