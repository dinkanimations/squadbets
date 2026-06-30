"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { saveQuoteDefaultsAction } from "@/lib/settings/actions";
import { DISCOUNT_TYPE_LABELS, DISCOUNT_TYPES } from "@/lib/quotes/constants";
import type { AppSettingsData } from "@/lib/settings/types";
import type { DiscountType } from "@/types/database";

interface QuoteDefaultsFormProps {
  settings: AppSettingsData;
}

export function QuoteDefaultsForm({ settings }: QuoteDefaultsFormProps) {
  const router = useRouter();
  const [validityDays, setValidityDays] = useState(settings.quoteValidityDays);
  const [sections, setSections] = useState(settings.defaultBudgetSections);
  const [dayRates, setDayRates] = useState(settings.defaultDayRates);
  const [discountType, setDiscountType] = useState(settings.defaultDiscountType);
  const [discountValue, setDiscountValue] = useState(settings.defaultDiscountValue);
  const [terms, setTerms] = useState(settings.defaultTerms.join("\n\n"));
  const [newSection, setNewSection] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const addSection = () => {
    const name = newSection.trim();
    if (!name || sections.includes(name)) return;
    setSections([...sections, name]);
    setNewSection("");
  };

  const removeSection = (index: number) => {
    const name = sections[index];
    setSections(sections.filter((_, i) => i !== index));
    const next = { ...dayRates };
    delete next[name];
    setDayRates(next);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveQuoteDefaultsAction(
        JSON.stringify({
          quoteValidityDays: validityDays,
          defaultBudgetSections: sections,
          defaultDayRates: dayRates,
          defaultDiscountType: discountType,
          defaultDiscountValue: discountValue,
          defaultTerms: terms
            .split("\n\n")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      );
      if (result.error) setError(result.error);
      else {
        setSuccess(result.success ?? "Quote defaults saved.");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Quote Defaults"
        description="Defaults applied when creating new quotes"
      />

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Default Quote Expiry (days)"
          type="number"
          min="1"
          value={validityDays}
          onChange={(e) => setValidityDays(Number(e.target.value) || 30)}
        />
        <Select
          label="Default Discount Type"
          value={discountType}
          onChange={(e) =>
            setDiscountType(e.target.value as DiscountType)
          }
          options={DISCOUNT_TYPES.map((t) => ({
            value: t,
            label: DISCOUNT_TYPE_LABELS[t],
          }))}
        />
        <Input
          label="Default Discount Value"
          type="number"
          min="0"
          value={discountValue}
          onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
        />
      </div>

      <div className="mt-6">
        <h4 className="mb-3 text-sm font-medium text-foreground">
          Default Budget Sections
        </h4>
        <div className="mb-3 flex gap-2">
          <Input
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            placeholder="Section name"
          />
          <Button type="button" variant="secondary" onClick={addSection}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={section} className="flex items-center gap-2">
              <span className="w-40 truncate text-sm text-foreground">
                {section}
              </span>
              <Input
                type="number"
                min="0"
                placeholder="Day rate"
                value={dayRates[section] ?? ""}
                onChange={(e) =>
                  setDayRates({
                    ...dayRates,
                    [section]: Number(e.target.value) || 0,
                  })
                }
                className="w-32"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSection(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Textarea
          label="Default Terms & Conditions"
          rows={8}
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="One paragraph per term, separated by blank lines"
        />
      </div>

      <div className="mt-6">
        <Button type="button" disabled={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Quote Defaults"}
        </Button>
      </div>
    </Card>
  );
}
