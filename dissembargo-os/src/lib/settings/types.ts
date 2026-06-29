import type { DiscountType, MilestoneType, UserRole } from "@/types/database";

export type PdfBrandColors = {
  primary: string;
  accent: string;
  accentLight: string;
  muted: string;
  border: string;
  background: string;
  surface: string;
};

export type PdfBrandConfig = {
  agencyName: string;
  tagline: string;
  email: string;
  website: string;
  address: string;
  phone: string | null;
  colors: PdfBrandColors;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  headerLogoUrl: string | null;
  footerText: string | null;
};

export type AppSettingsData = {
  companyName: string;
  companyLogoUrl: string | null;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string | null;
  website: string;
  defaultCurrency: string;
  timezone: string;
  defaultLanguage: string;
  quoteValidityDays: number;
  defaultBudgetSections: string[];
  defaultDayRates: Record<string, number>;
  defaultDiscountType: DiscountType;
  defaultDiscountValue: number;
  defaultTerms: string[];
  defaultPhases: string[];
  phaseWeights: Record<string, number>;
  defaultMilestones: MilestoneType[];
  defaultReviewRounds: number;
  defaultScheduleDurationDays: number;
  workingDays: number[];
  companyHolidays: string[];
  emailSignature: string | null;
  pdfHeaderLogoUrl: string | null;
  pdfFooterText: string | null;
  pdfTagline: string;
  pdfColors: PdfBrandColors;
  notifyEmail: boolean;
  notifyDeadlines: boolean;
  notifyQuoteApproval: boolean;
  notifyClientFeedback: boolean;
  notifyAiProcessing: boolean;
};

export type GeneralSettingsPayload = Pick<
  AppSettingsData,
  | "companyName"
  | "companyAddress"
  | "companyEmail"
  | "companyPhone"
  | "website"
  | "defaultCurrency"
  | "timezone"
  | "defaultLanguage"
> & {
  companyLogoUrl?: string | null;
};

export type QuoteDefaultsPayload = Pick<
  AppSettingsData,
  | "quoteValidityDays"
  | "defaultBudgetSections"
  | "defaultDayRates"
  | "defaultDiscountType"
  | "defaultDiscountValue"
  | "defaultTerms"
>;

export type ScheduleDefaultsPayload = Pick<
  AppSettingsData,
  | "defaultPhases"
  | "phaseWeights"
  | "defaultMilestones"
  | "defaultReviewRounds"
  | "defaultScheduleDurationDays"
  | "workingDays"
  | "companyHolidays"
>;

export type NotificationsPayload = Pick<
  AppSettingsData,
  | "notifyEmail"
  | "notifyDeadlines"
  | "notifyQuoteApproval"
  | "notifyClientFeedback"
  | "notifyAiProcessing"
>;

export type BrandingPayload = {
  emailSignature: string | null;
  pdfHeaderLogoUrl: string | null;
  pdfFooterText: string | null;
  pdfTagline: string;
  companyLogoUrl: string | null;
};

export type TeamMemberPayload = {
  name: string;
  email: string;
  jobTitle: string;
  dayRate: number;
  department: string;
  avatarUrl: string | null;
  status: "active" | "inactive";
  role: UserRole;
};

export type Permission =
  | "settings.manage"
  | "team.manage"
  | "quotes.read"
  | "quotes.write"
  | "schedules.read"
  | "schedules.write"
  | "projects.read"
  | "projects.write"
  | "companies.read"
  | "companies.write"
  | "inbox.read"
  | "integrations.manage";
