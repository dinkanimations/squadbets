"use client";

import type { DeliverableDraft } from "@/lib/quotes/constants";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader } from "@/components/ui/Card";
import { Plus, Trash2 } from "lucide-react";

interface DeliverablesEditorProps {
  deliverables: DeliverableDraft[];
  onChange: (deliverables: DeliverableDraft[]) => void;
}

export function DeliverablesEditor({
  deliverables,
  onChange,
}: DeliverablesEditorProps) {
  const update = (id: string, patch: Partial<DeliverableDraft>) => {
    onChange(
      deliverables.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    );
  };

  const add = () => {
    onChange([
      ...deliverables,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        quantity: 1,
      },
    ]);
  };

  const remove = (id: string) => {
    if (deliverables.length <= 1) return;
    onChange(deliverables.filter((item) => item.id !== id));
  };

  return (
    <Card>
      <CardHeader
        title="Deliverables"
        description="Define what the client will receive"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={add}>
            <Plus className="h-4 w-4" />
            Add Deliverable
          </Button>
        }
      />

      <div className="space-y-4">
        {deliverables.map((item, index) => (
          <div
            key={item.id}
            className="rounded-lg border border-border bg-surface-elevated/40 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted">
                Deliverable {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(item.id)}
                disabled={deliverables.length <= 1}
                aria-label="Remove deliverable"
              >
                <Trash2 className="h-4 w-4 text-danger" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <Input
                label="Title"
                value={item.title}
                onChange={(e) => update(item.id, { title: e.target.value })}
                placeholder="e.g. Brand identity package"
              />
              <Input
                label="Qty"
                type="number"
                min="0"
                step="1"
                value={item.quantity}
                onChange={(e) =>
                  update(item.id, { quantity: Number(e.target.value) || 0 })
                }
              />
            </div>

            <div className="mt-4">
              <Textarea
                label="Description"
                rows={2}
                value={item.description}
                onChange={(e) =>
                  update(item.id, { description: e.target.value })
                }
                placeholder="Describe the deliverable..."
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
