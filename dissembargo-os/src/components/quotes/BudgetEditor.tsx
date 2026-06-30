"use client";

import type { BudgetSectionDraft } from "@/lib/quotes/constants";
import { createEmptyLineItem } from "@/lib/quotes/constants";
import {
  calculateLineTotal,
  calculateSectionTotal,
  formatCurrency,
} from "@/lib/quotes/calculations";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader } from "@/components/ui/Card";
import { Plus, Trash2 } from "lucide-react";

interface BudgetEditorProps {
  sections: BudgetSectionDraft[];
  onChange: (sections: BudgetSectionDraft[]) => void;
}

export function BudgetEditor({ sections, onChange }: BudgetEditorProps) {
  const updateSection = (
    sectionId: string,
    patch: Partial<BudgetSectionDraft>,
  ) => {
    onChange(
      sections.map((section) =>
        section.id === sectionId ? { ...section, ...patch } : section,
      ),
    );
  };

  const updateLineItem = (
    sectionId: string,
    itemId: string,
    patch: Partial<BudgetSectionDraft["lineItems"][number]>,
  ) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          lineItems: section.lineItems.map((item) =>
            item.id === itemId ? { ...item, ...patch } : item,
          ),
        };
      }),
    );
  };

  const addLineItem = (sectionId: string) => {
    onChange(
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lineItems: [...section.lineItems, createEmptyLineItem()],
            }
          : section,
      ),
    );
  };

  const removeLineItem = (sectionId: string, itemId: string) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        if (section.lineItems.length <= 1) return section;
        return {
          ...section,
          lineItems: section.lineItems.filter((item) => item.id !== itemId),
        };
      }),
    );
  };

  const addSection = () => {
    onChange([
      ...sections,
      {
        id: crypto.randomUUID(),
        name: "New Section",
        lineItems: [createEmptyLineItem()],
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length <= 1) return;
    onChange(sections.filter((section) => section.id !== sectionId));
  };

  return (
    <Card>
      <CardHeader
        title="Budget Builder"
        description="Spreadsheet-style day rate calculator"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        }
      />

      <div className="space-y-6">
        {sections.map((section) => {
          const sectionTotal = calculateSectionTotal(section);

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border bg-surface-elevated/60 px-4 py-3">
                <Input
                  value={section.name}
                  onChange={(e) =>
                    updateSection(section.id, { name: e.target.value })
                  }
                  className="max-w-xs border-none bg-transparent font-medium shadow-none focus:ring-0"
                />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(sectionTotal)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSection(section.id)}
                    disabled={sections.length <= 1}
                    aria-label="Remove section"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-elevated/30 text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-2 font-medium">Description</th>
                      <th className="w-32 px-4 py-2 font-medium">Day Rate</th>
                      <th className="w-28 px-4 py-2 font-medium">Days</th>
                      <th className="w-32 px-4 py-2 text-right font-medium">
                        Total
                      </th>
                      <th className="w-12 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {section.lineItems.map((item) => {
                      const lineTotal = calculateLineTotal(
                        item.dayRate,
                        item.numDays,
                      );

                      return (
                        <tr key={item.id} className="hover:bg-surface-elevated/20">
                          <td className="px-4 py-2">
                            <input
                              value={item.description}
                              onChange={(e) =>
                                updateLineItem(section.id, item.id, {
                                  description: e.target.value,
                                })
                              }
                              placeholder="Description"
                              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-foreground placeholder:text-muted/60 focus:border-border focus:bg-surface-elevated focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.dayRate || ""}
                              onChange={(e) =>
                                updateLineItem(section.id, item.id, {
                                  dayRate: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-right text-foreground focus:border-border focus:bg-surface-elevated focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={item.numDays || ""}
                              onChange={(e) =>
                                updateLineItem(section.id, item.id, {
                                  numDays: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 text-right text-foreground focus:border-border focus:bg-surface-elevated focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-foreground">
                            {formatCurrency(lineTotal)}
                          </td>
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(section.id, item.id)}
                              disabled={section.lineItems.length <= 1}
                              aria-label="Remove line item"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-danger" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between border-t border-border bg-surface-elevated/20 px-4 py-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addLineItem(section.id)}
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
                <span className="text-sm text-muted">
                  Section total:{" "}
                  <span className="font-medium text-foreground">
                    {formatCurrency(sectionTotal)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
