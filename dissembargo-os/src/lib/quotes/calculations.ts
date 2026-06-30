import type { DiscountType } from "@/types/database";
import type { BudgetSectionDraft } from "./constants";

export function calculateLineTotal(dayRate: number, numDays: number): number {
  const rate = Number.isFinite(dayRate) ? dayRate : 0;
  const days = Number.isFinite(numDays) ? numDays : 0;
  return Math.round(rate * days * 100) / 100;
}

export function calculateSectionTotal(section: BudgetSectionDraft): number {
  return section.lineItems.reduce(
    (sum, item) => sum + calculateLineTotal(item.dayRate, item.numDays),
    0,
  );
}

export function calculateSubtotal(sections: BudgetSectionDraft[]): number {
  return sections.reduce((sum, section) => sum + calculateSectionTotal(section), 0);
}

export function calculateDiscountAmount(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const value = Number.isFinite(discountValue) ? discountValue : 0;

  if (discountType === "percentage") {
    const clamped = Math.max(0, Math.min(100, value));
    return Math.round(subtotal * (clamped / 100) * 100) / 100;
  }

  return Math.round(Math.max(0, value) * 100) / 100;
}

export function calculateGrandTotal(
  subtotal: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  const discount = calculateDiscountAmount(subtotal, discountType, discountValue);
  return Math.round(Math.max(0, subtotal - discount) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatQuoteDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
