"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Plus,
  Trash2,
} from "lucide-react";
import type { BudgetSectionDraft } from "@/lib/quotes/constants";
import { createEmptyLineItem } from "@/lib/quotes/constants";
import {
  calculateLineTotal,
  calculateSectionTotal,
  formatCurrency,
} from "@/lib/quotes/calculations";
import { Button } from "@/components/ui/Button";
import {
  SPREADSHEET_CELL_ATTR,
  handleSpreadsheetKeyDown,
  spreadsheetInputClass,
} from "./spreadsheet-utils";

interface BudgetSpreadsheetProps {
  sections: BudgetSectionDraft[];
  onChange: (sections: BudgetSectionDraft[]) => void;
}

export function BudgetSpreadsheet({
  sections,
  onChange,
}: BudgetSpreadsheetProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionId: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

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

  const duplicateLineItem = (sectionId: string, itemId: string) => {
    onChange(
      sections.map((section) => {
        if (section.id !== sectionId) return section;
        const source = section.lineItems.find((item) => item.id === itemId);
        if (!source) return section;

        const duplicate = {
          ...source,
          id: crypto.randomUUID(),
        };

        const index = section.lineItems.findIndex((item) => item.id === itemId);
        const lineItems = [...section.lineItems];
        lineItems.splice(index + 1, 0, duplicate);

        return { ...section, lineItems };
      }),
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

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Budget Builder</h2>
          <p className="text-xs text-muted">
            Click cells to edit · Tab to move · Expand departments below
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={addSection}>
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
      </div>

      <div className="space-y-3 p-3" data-spreadsheet-root="budget">
        {sections.map((section) => {
          const isCollapsed = collapsed[section.id] ?? false;
          const sectionTotal = calculateSectionTotal(section);

          return (
            <div
              key={section.id}
              className="overflow-hidden rounded-lg border border-border"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 bg-surface-elevated/50 px-3 py-2.5 text-left transition-colors hover:bg-surface-elevated"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <input
                    value={section.name}
                    onChange={(event) => {
                      event.stopPropagation();
                      updateSection(section.id, { name: event.target.value });
                    }}
                    onClick={(event) => event.stopPropagation()}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground focus:outline-none"
                    aria-label="Section name"
                  />
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(sectionTotal)}
                </span>
              </button>

              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface-elevated/20 text-left text-xs uppercase tracking-wide text-muted">
                        <th className="px-3 py-2 font-medium">Role</th>
                        <th className="w-24 px-3 py-2 font-medium">Days</th>
                        <th className="w-32 px-3 py-2 font-medium">Day Rate</th>
                        <th className="w-32 px-3 py-2 text-right font-medium">
                          Total
                        </th>
                        <th className="w-24 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {section.lineItems.map((item) => {
                        const lineTotal = calculateLineTotal(
                          item.dayRate,
                          item.numDays,
                        );

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-surface-elevated/15"
                          >
                            <td className="px-3 py-1.5">
                              <input
                                {...{ [SPREADSHEET_CELL_ATTR]: true }}
                                value={item.description}
                                onChange={(event) =>
                                  updateLineItem(section.id, item.id, {
                                    description: event.target.value,
                                  })
                                }
                                onKeyDown={handleSpreadsheetKeyDown}
                                placeholder="Role"
                                className={spreadsheetInputClass}
                                aria-label="Role"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                {...{ [SPREADSHEET_CELL_ATTR]: true }}
                                type="number"
                                min="0"
                                step="0.5"
                                value={item.numDays || ""}
                                onChange={(event) =>
                                  updateLineItem(section.id, item.id, {
                                    numDays: Number(event.target.value) || 0,
                                  })
                                }
                                onKeyDown={handleSpreadsheetKeyDown}
                                className={`${spreadsheetInputClass} text-right`}
                                aria-label="Days"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                {...{ [SPREADSHEET_CELL_ATTR]: true }}
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.dayRate || ""}
                                onChange={(event) =>
                                  updateLineItem(section.id, item.id, {
                                    dayRate: Number(event.target.value) || 0,
                                  })
                                }
                                onKeyDown={handleSpreadsheetKeyDown}
                                className={`${spreadsheetInputClass} text-right`}
                                aria-label="Day rate"
                              />
                            </td>
                            <td className="px-3 py-1.5 text-right font-medium text-foreground">
                              {formatCurrency(lineTotal)}
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    duplicateLineItem(section.id, item.id)
                                  }
                                  aria-label="Duplicate row"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeLineItem(section.id, item.id)
                                  }
                                  disabled={section.lineItems.length <= 1}
                                  aria-label="Delete row"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-danger" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between border-t border-border bg-surface-elevated/10 px-3 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addLineItem(section.id)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Row
                    </Button>
                    <span className="text-xs text-muted">
                      Section total{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(sectionTotal)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
