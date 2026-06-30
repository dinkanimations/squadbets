"use client";

import { Plus, Trash2 } from "lucide-react";
import type { DeliverableDraft } from "@/lib/quotes/constants";
import { createEmptyDeliverable } from "@/lib/quotes/constants";
import { Button } from "@/components/ui/Button";
import {
  SPREADSHEET_CELL_ATTR,
  handleSpreadsheetKeyDown,
  spreadsheetInputClass,
} from "./spreadsheet-utils";

interface DeliverablesSpreadsheetProps {
  deliverables: DeliverableDraft[];
  onChange: (deliverables: DeliverableDraft[]) => void;
}

export function DeliverablesSpreadsheet({
  deliverables,
  onChange,
}: DeliverablesSpreadsheetProps) {
  const rows =
    deliverables.length > 0 ? deliverables : [createEmptyDeliverable()];

  const update = (id: string, patch: Partial<DeliverableDraft>) => {
    onChange(
      rows.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const add = () => {
    onChange([...rows, createEmptyDeliverable()]);
  };

  const remove = (id: string) => {
    if (rows.length <= 1) {
      onChange([createEmptyDeliverable()]);
      return;
    }
    onChange(rows.filter((item) => item.id !== id));
  };

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Deliverables</h2>
          <p className="text-xs text-muted">Qty and description for each output</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
          Add Deliverable
        </Button>
      </div>

      <div className="overflow-x-auto" data-spreadsheet-root="deliverables">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/40 text-left text-xs uppercase tracking-wide text-muted">
              <th className="w-20 px-3 py-2 font-medium">Qty</th>
              <th className="px-3 py-2 font-medium">Deliverable</th>
              <th className="px-3 py-2 font-medium">Notes</th>
              <th className="w-12 px-2 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((item) => (
              <tr key={item.id} className="hover:bg-surface-elevated/20">
                <td className="px-3 py-1.5">
                  <input
                    {...{ [SPREADSHEET_CELL_ATTR]: true }}
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity || ""}
                    onChange={(event) =>
                      update(item.id, {
                        quantity: Number(event.target.value) || 0,
                      })
                    }
                    onKeyDown={handleSpreadsheetKeyDown}
                    className={`${spreadsheetInputClass} text-right`}
                    aria-label="Quantity"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    {...{ [SPREADSHEET_CELL_ATTR]: true }}
                    value={item.title}
                    onChange={(event) =>
                      update(item.id, { title: event.target.value })
                    }
                    onKeyDown={handleSpreadsheetKeyDown}
                    placeholder="e.g. 60 Second Film"
                    className={spreadsheetInputClass}
                    aria-label="Deliverable"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    {...{ [SPREADSHEET_CELL_ATTR]: true }}
                    value={item.description}
                    onChange={(event) =>
                      update(item.id, { description: event.target.value })
                    }
                    onKeyDown={handleSpreadsheetKeyDown}
                    placeholder="Optional details"
                    className={spreadsheetInputClass}
                    aria-label="Notes"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(item.id)}
                    aria-label="Remove deliverable"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-danger" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
