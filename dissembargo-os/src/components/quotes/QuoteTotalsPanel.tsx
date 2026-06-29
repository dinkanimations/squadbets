"use client";

import type { DiscountType } from "@/types/database";
import {
  calculateDiscountAmount,
  calculateGrandTotal,
  calculateSubtotal,
  formatCurrency,
} from "@/lib/quotes/calculations";
import type { BudgetSectionDraft } from "@/lib/quotes/constants";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DISCOUNT_TYPES, DISCOUNT_TYPE_LABELS } from "@/lib/quotes/constants";

interface QuoteTotalsPanelProps {
  sections: BudgetSectionDraft[];
  discountType: DiscountType;
  discountValue: number;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: number) => void;
}

export function QuoteTotalsPanel({
  sections,
  discountType,
  discountValue,
  onDiscountTypeChange,
  onDiscountValueChange,
}: QuoteTotalsPanelProps) {
  const subtotal = calculateSubtotal(sections);
  const discountAmount = calculateDiscountAmount(
    subtotal,
    discountType,
    discountValue,
  );
  const grandTotal = calculateGrandTotal(subtotal, discountType, discountValue);

  return (
    <Card className="sticky top-6">
      <CardHeader title="Totals" description="Updated instantly as you edit" />

      <dl className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-medium text-foreground">
            {formatCurrency(subtotal)}
          </dd>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <Select
            label="Discount Type"
            value={discountType}
            onChange={(e) =>
              onDiscountTypeChange(e.target.value as DiscountType)
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
            onChange={(e) =>
              onDiscountValueChange(Number(e.target.value) || 0)
            }
          />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Discount applied</span>
            <span className="text-danger">−{formatCurrency(discountAmount)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <dt className="text-base font-semibold text-foreground">Grand Total</dt>
          <dd className="text-2xl font-semibold text-foreground">
            {formatCurrency(grandTotal)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
