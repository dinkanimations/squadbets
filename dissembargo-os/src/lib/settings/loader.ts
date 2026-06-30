import { getAppSettings } from "@/lib/database/app-settings";
import { buildPdfBrandFromSettings } from "./defaults";

export { getAppSettings, mapAppSettingsRow } from "@/lib/database/app-settings";
export { buildPdfBrandFromSettings, STATIC_APP_SETTINGS } from "./defaults";
export { defaultExpiryDateFromDays } from "./utils";

export async function getPdfBrand() {
  const settings = await getAppSettings();
  return buildPdfBrandFromSettings(settings);
}

export async function getQuoteValidityDays() {
  const settings = await getAppSettings();
  return settings.quoteValidityDays;
}

export async function getDefaultTerms() {
  const settings = await getAppSettings();
  return settings.defaultTerms;
}
