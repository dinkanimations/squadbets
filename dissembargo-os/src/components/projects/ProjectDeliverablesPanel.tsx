"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { saveProjectDeliverablesAction } from "@/lib/projects/actions";
import type { ProjectDeliverable } from "@/types/database";

type DeliverableDraft = {
  id?: string;
  title: string;
  description: string;
  isComplete: boolean;
};

interface ProjectDeliverablesPanelProps {
  projectId: string;
  deliverables: ProjectDeliverable[];
}

export function ProjectDeliverablesPanel({
  projectId,
  deliverables: initial,
}: ProjectDeliverablesPanelProps) {
  const router = useRouter();
  const [items, setItems] = useState<DeliverableDraft[]>(
    initial.length > 0
      ? initial.map((d) => ({
          id: d.id,
          title: d.title,
          description: d.description ?? "",
          isComplete: d.is_complete,
        }))
      : [{ title: "", description: "", isComplete: false }],
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateItem = (index: number, patch: Partial<DeliverableDraft>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { title: "", description: "", isComplete: false },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveProjectDeliverablesAction(
        projectId,
        JSON.stringify(items),
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "Deliverables saved.");
        router.refresh();
      }
    });
  };

  const completedCount = items.filter(
    (item) => item.title.trim() && item.isComplete,
  ).length;
  const totalCount = items.filter((item) => item.title.trim()).length;

  return (
    <Card>
      <CardHeader
        title="Deliverables"
        description={
          totalCount > 0
            ? `${completedCount} of ${totalCount} complete`
            : "Track project deliverables and completion"
        }
        action={
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
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

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id ?? index}
            className="rounded-lg border border-border bg-surface-elevated/40 p-3"
          >
            <div className="mb-2 flex items-start gap-3">
              <button
                type="button"
                onClick={() =>
                  updateItem(index, { isComplete: !item.isComplete })
                }
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                  item.isComplete
                    ? "border-success bg-success text-white"
                    : "border-border bg-surface"
                }`}
                aria-label="Toggle complete"
              >
                {item.isComplete && <Check className="h-3 w-3" />}
              </button>
              <div className="flex-1 space-y-2">
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  placeholder="Deliverable title"
                />
                <Textarea
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, { description: e.target.value })
                  }
                  placeholder="Description (optional)"
                  rows={2}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <Button type="button" disabled={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Deliverables"}
        </Button>
      </div>
    </Card>
  );
}
