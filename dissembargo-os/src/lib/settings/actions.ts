"use server";

import { revalidatePath } from "next/cache";
import {
  getAppSettings,
  updateAppSettings,
} from "@/lib/database/app-settings";
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
} from "@/lib/database/team-members";
import { uploadFile, getSignedUrl } from "@/lib/storage";
import type {
  BrandingPayload,
  GeneralSettingsPayload,
  NotificationsPayload,
  QuoteDefaultsPayload,
  ScheduleDefaultsPayload,
  TeamMemberPayload,
} from "./types";

export type SettingsActionState = {
  error?: string;
  success?: string;
};

export async function getSettingsAction() {
  return getAppSettings();
}

export async function getTeamMembersAction() {
  return getTeamMembers();
}

export async function saveGeneralSettingsAction(
  payloadJson: string,
): Promise<SettingsActionState> {
  try {
    const payload = JSON.parse(payloadJson) as GeneralSettingsPayload;

    await updateAppSettings({
      company_name: payload.companyName.trim(),
      company_address: payload.companyAddress.trim() || null,
      company_email: payload.companyEmail.trim() || null,
      company_phone: payload.companyPhone?.trim() || null,
      website: payload.website.trim() || null,
      default_currency: payload.defaultCurrency,
      timezone: payload.timezone,
      default_language: payload.defaultLanguage,
      ...(payload.companyLogoUrl !== undefined
        ? { company_logo_url: payload.companyLogoUrl }
        : {}),
    });

    revalidatePath("/", "layout");
    revalidatePath("/settings");

    return { success: "General settings saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save settings.",
    };
  }
}

export async function saveQuoteDefaultsAction(
  payloadJson: string,
): Promise<SettingsActionState> {
  try {
    const payload = JSON.parse(payloadJson) as QuoteDefaultsPayload;

    await updateAppSettings({
      quote_validity_days: payload.quoteValidityDays,
      default_budget_sections: payload.defaultBudgetSections,
      default_day_rates: payload.defaultDayRates,
      default_discount_type: payload.defaultDiscountType,
      default_discount_value: payload.defaultDiscountValue,
      default_terms: payload.defaultTerms,
    });

    revalidatePath("/settings/quotes");
    revalidatePath("/quotes");

    return { success: "Quote defaults saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save quote defaults.",
    };
  }
}

export async function saveScheduleDefaultsAction(
  payloadJson: string,
): Promise<SettingsActionState> {
  try {
    const payload = JSON.parse(payloadJson) as ScheduleDefaultsPayload;

    await updateAppSettings({
      default_phases: payload.defaultPhases,
      phase_weights: payload.phaseWeights,
      default_milestones: payload.defaultMilestones,
      default_review_rounds: payload.defaultReviewRounds,
      default_schedule_duration_days: payload.defaultScheduleDurationDays,
      working_days: payload.workingDays,
      company_holidays: payload.companyHolidays,
    });

    revalidatePath("/settings/schedules");
    revalidatePath("/production-schedules");

    return { success: "Schedule defaults saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save schedule defaults.",
    };
  }
}

export async function saveNotificationsAction(
  payloadJson: string,
): Promise<SettingsActionState> {
  try {
    const payload = JSON.parse(payloadJson) as NotificationsPayload;

    await updateAppSettings({
      notify_email: payload.notifyEmail,
      notify_deadlines: payload.notifyDeadlines,
      notify_quote_approval: payload.notifyQuoteApproval,
      notify_client_feedback: payload.notifyClientFeedback,
      notify_ai_processing: payload.notifyAiProcessing,
    });

    revalidatePath("/settings/notifications");

    return { success: "Notification preferences saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to save notification settings.",
    };
  }
}

export async function saveBrandingAction(
  payloadJson: string,
): Promise<SettingsActionState> {
  try {
    const payload = JSON.parse(payloadJson) as BrandingPayload;

    await updateAppSettings({
      email_signature: payload.emailSignature,
      pdf_footer_text: payload.pdfFooterText,
      pdf_tagline: payload.pdfTagline,
    });

    revalidatePath("/", "layout");
    revalidatePath("/settings/branding");

    return { success: "Branding saved." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to save branding.",
    };
  }
}

export async function uploadBrandingAssetAction(
  formData: FormData,
  assetType: "company_logo" | "pdf_header_logo",
): Promise<{ url?: string; error?: string }> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("No file selected.");
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `branding/${assetType}/${crypto.randomUUID()}-${safeName}`;

    await uploadFile("project-assets", storagePath, file, {
      contentType: file.type || undefined,
      upsert: true,
    });

    const signedUrl = await getSignedUrl("project-assets", storagePath, 60 * 60 * 24 * 365);

    const updateField =
      assetType === "company_logo"
        ? { company_logo_url: storagePath }
        : { pdf_header_logo_url: storagePath };

    await updateAppSettings(updateField);

    revalidatePath("/", "layout");
    revalidatePath("/settings/branding");

    return { url: signedUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to upload file.",
    };
  }
}

export async function getBrandingAssetUrlAction(storagePath: string) {
  if (!storagePath) return null;
  if (storagePath.startsWith("http")) return storagePath;
  return getSignedUrl("project-assets", storagePath);
}

export async function createTeamMemberAction(
  payloadJson: string,
): Promise<{ id?: string; error?: string }> {
  try {
    const payload = JSON.parse(payloadJson) as TeamMemberPayload;

    if (!payload.name.trim() || !payload.email.trim()) {
      throw new Error("Name and email are required.");
    }

    const member = await createTeamMember({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      job_title: payload.jobTitle.trim() || null,
      day_rate: payload.dayRate || null,
      department: payload.department.trim() || null,
      avatar_url: payload.avatarUrl,
      status: payload.status,
      role: payload.role,
    });

    revalidatePath("/settings/team");

    return { id: member.id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to add team member.",
    };
  }
}

export async function updateTeamMemberAction(
  memberId: string,
  payloadJson: string,
): Promise<SettingsActionState> {
  try {
    const payload = JSON.parse(payloadJson) as TeamMemberPayload;

    await updateTeamMember(memberId, {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      job_title: payload.jobTitle.trim() || null,
      day_rate: payload.dayRate || null,
      department: payload.department.trim() || null,
      avatar_url: payload.avatarUrl,
      status: payload.status,
      role: payload.role,
    });

    revalidatePath("/settings/team");

    return { success: "Team member updated." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to update team member.",
    };
  }
}

export async function deleteTeamMemberAction(
  memberId: string,
): Promise<SettingsActionState> {
  try {
    await deleteTeamMember(memberId);
    revalidatePath("/settings/team");
    return { success: "Team member removed." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to remove team member.",
    };
  }
}

export async function getIntegrationStatusAction() {
  const { getGmailConnectionStatus } = await import(
    "@/lib/database/gmail-connections"
  );
  const { hasOpenAIEnv } = await import("@/lib/ai/client");

  const gmail = await getGmailConnectionStatus();

  const supabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return {
    gmail,
    openai: {
      configured: hasOpenAIEnv(),
      model: "gpt-4o-mini",
    },
    supabase: {
      configured: supabaseConfigured,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    },
  };
}
