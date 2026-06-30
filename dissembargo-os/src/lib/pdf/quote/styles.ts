import { StyleSheet } from "@react-pdf/renderer";
import { PDF_BRAND } from "./branding";

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: PDF_BRAND.fonts.body,
    fontSize: 10,
    color: PDF_BRAND.colors.primary,
    backgroundColor: PDF_BRAND.colors.background,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 48,
    lineHeight: 1.5,
  },
  headerBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: PDF_BRAND.colors.accent,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: PDF_BRAND.colors.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: PDF_BRAND.colors.muted,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  logoBox: {
    width: 120,
    height: 48,
    justifyContent: "center",
  },
  logoImage: {
    maxWidth: 120,
    maxHeight: 48,
    objectFit: "contain",
  },
  agencyName: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 22,
    color: PDF_BRAND.colors.primary,
    letterSpacing: -0.5,
  },
  agencyTagline: {
    fontSize: 9,
    color: PDF_BRAND.colors.muted,
    marginTop: 2,
  },
  quoteLabel: {
    fontSize: 9,
    color: PDF_BRAND.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  quoteNumber: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 16,
    color: PDF_BRAND.colors.accent,
  },
  metaGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
    padding: 16,
    backgroundColor: PDF_BRAND.colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PDF_BRAND.colors.border,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: PDF_BRAND.colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  metaValue: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 11,
    color: PDF_BRAND.colors.primary,
  },
  sectionTitle: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 12,
    color: PDF_BRAND.colors.primary,
    marginBottom: 10,
    marginTop: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: PDF_BRAND.colors.accent,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_BRAND.colors.accentLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tableHeaderCell: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 8,
    color: PDF_BRAND.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_BRAND.colors.border,
  },
  tableRowAlt: {
    backgroundColor: PDF_BRAND.colors.surface,
  },
  colDescription: { flex: 3 },
  colRate: { width: 72, textAlign: "right" },
  colDays: { width: 48, textAlign: "right" },
  colTotal: { width: 72, textAlign: "right" },
  colQty: { width: 40, textAlign: "right" },
  sectionTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  sectionTotalLabel: {
    fontSize: 9,
    color: PDF_BRAND.colors.muted,
    marginRight: 12,
  },
  sectionTotalValue: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 10,
    width: 72,
    textAlign: "right",
  },
  deliverableItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: PDF_BRAND.colors.border,
  },
  deliverableTitle: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 10,
    marginBottom: 2,
  },
  deliverableDesc: {
    fontSize: 9,
    color: PDF_BRAND.colors.muted,
  },
  totalsBox: {
    marginTop: 16,
    marginLeft: "auto",
    width: 240,
    borderWidth: 1,
    borderColor: PDF_BRAND.colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: PDF_BRAND.colors.border,
  },
  totalsRowGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: PDF_BRAND.colors.accent,
  },
  totalsLabel: {
    fontSize: 9,
    color: PDF_BRAND.colors.muted,
  },
  totalsValue: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 10,
  },
  totalsLabelGrand: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 11,
    color: "#ffffff",
  },
  totalsValueGrand: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 14,
    color: "#ffffff",
  },
  notesBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: PDF_BRAND.colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: PDF_BRAND.colors.border,
  },
  notesText: {
    fontSize: 9,
    color: PDF_BRAND.colors.primary,
    lineHeight: 1.6,
  },
  termsSection: {
    marginTop: 24,
  },
  termsTitle: {
    fontFamily: PDF_BRAND.fonts.heading,
    fontSize: 11,
    marginBottom: 8,
    color: PDF_BRAND.colors.primary,
  },
  termItem: {
    fontSize: 8,
    color: PDF_BRAND.colors.muted,
    marginBottom: 6,
    lineHeight: 1.5,
  },
});

export function formatPdfCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPdfDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
