import type { AppSettingsData, PdfBrandConfig } from "./types";
import { PDF_TERMS_AND_CONDITIONS } from "@/lib/pdf/quote/branding";
import { DEFAULT_BUDGET_SECTIONS } from "@/lib/quotes/constants";
import {
  DEFAULT_PHASES,
  MILESTONE_TYPES,
  PHASE_WEIGHTS,
} from "@/lib/production-schedules/constants";

export const STATIC_APP_SETTINGS: AppSettingsData = {
  companyName: "Dissembargo",
  companyLogoUrl: null,
  companyAddress: "London, United Kingdom",
  companyEmail: "hello@dissembargo.com",
  companyPhone: null,
  website: "www.dissembargo.com",
  defaultCurrency: "GBP",
  timezone: "Europe/London",
  defaultLanguage: "en-GB",
  quoteValidityDays: 30,
  defaultBudgetSections: [...DEFAULT_BUDGET_SECTIONS],
  defaultDayRates: {},
  defaultDiscountType: "fixed",
  defaultDiscountValue: 0,
  defaultTerms: [...PDF_TERMS_AND_CONDITIONS],
  defaultPhases: [...DEFAULT_PHASES],
  phaseWeights: { ...PHASE_WEIGHTS },
  defaultMilestones: [...MILESTONE_TYPES],
  defaultReviewRounds: 2,
  defaultScheduleDurationDays: 42,
  workingDays: [1, 2, 3, 4, 5],
  companyHolidays: [],
  emailSignature: null,
  pdfHeaderLogoUrl: null,
  pdfFooterText: null,
  pdfTagline: "Creative Production Studio",
  pdfColors: {
    primary: "#18181b",
    accent: "#6366f1",
    accentLight: "#eef2ff",
    muted: "#71717a",
    border: "#e4e4e7",
    background: "#ffffff",
    surface: "#fafafa",
  },
  notifyEmail: true,
  notifyDeadlines: true,
  notifyQuoteApproval: true,
  notifyClientFeedback: true,
  notifyAiProcessing: true,
};

export function buildPdfBrandFromSettings(
  settings: AppSettingsData,
): PdfBrandConfig {
  return {
    agencyName: settings.companyName,
    tagline: settings.pdfTagline,
    email: settings.companyEmail,
    website: settings.website,
    address: settings.companyAddress,
    phone: settings.companyPhone,
    colors: settings.pdfColors,
    fonts: {
      heading: "Helvetica-Bold",
      body: "Helvetica",
      mono: "Courier",
    },
    headerLogoUrl: settings.pdfHeaderLogoUrl ?? settings.companyLogoUrl,
    footerText: settings.pdfFooterText,
  };
}
