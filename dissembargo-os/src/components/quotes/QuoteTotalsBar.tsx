"use client";

import type { DiscountType } from "@/types/database";
import {
  calculateDiscountAmount,
  calculateGrandTotal,
  calculateSubtotal,
  formatCurrency,
} from "@/lib/quotes/calculations";
import type { BudgetSectionDraft } from "@/lib/quotes/constants";
import {
  DISCOUNT_TYPES,
  DISCOUNT_TYPE_LABELS,
} from "@/lib/quotes/constants";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface QuoteTotalsBarProps {
  sections: BudgetSectionDraft[];
  discountType: DiscountType;
  discountValue: number;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: number) => void;
}

export function QuoteTotalsBar({
  sections,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
}: QuoteTotalsBarProps) {
  const subtotal = calculateSubtotal(sections);
  const discountAmount = calculateDiscountAmount(
    subtotal,
    discountType,
    discountValue,
  );
  const grandTotal = calculateGrandTotal(subtotal, discountType, discountValue);

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select
            label="Discount Type"
            value={discountType}
            onChange={(event) =>
              onDiscountTypeChange(event.target.value as DiscountType)
            }
            options={DISCOUNT_TYPES.map((type) => ({
              value: type,
              label: DISCOUNT_TYPE_LABELS[type],
            }))}
          />
          <Input
            label={discountType === "percentage" ? "Discount (%)" : "Discount (£)"}
            type="number"
            min="0"
            step={discountType === "percentage" ? "0.1" : "0.01"}
            max={discountType === "percentage" ? "100" : undefined}
            value={discountValue || ""}
            onChange={(event) =>
              onDiscountValueChange(Number(event.target.value) || 0)
            }
          />
        </div>

        <dl className="grid min-w-[240px] gap-2 text-sm">
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-medium text-foreground">
              {formatCurrency(subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6">
            <dt className="text-muted">Discount</dt>
            <dd className="font-medium text-danger">
              −{formatCurrency(discountAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-6 border-t border-border pt-2">
            <dt className="text-base font-semibold text-foreground">
              Grand Total
            </dt>
            <dd className="text-xl font-semibold text-foreground">
              {formatCurrency(grandTotal)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
