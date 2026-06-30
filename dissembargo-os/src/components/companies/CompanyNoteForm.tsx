"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { addCompanyNoteAction } from "@/lib/companies/actions";

interface CompanyNoteFormProps {
  companyId: string;
}

export function CompanyNoteForm({ companyId }: CompanyNoteFormProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!note.trim()) return;

    setError(null);
    startTransition(async () => {
      const result = await addCompanyNoteAction(companyId, note);
      if (result.error) {
        setError(result.error);
      } else {
        setNote("");
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Add an internal note..."
        rows={3}
      />
      <Button type="submit" size="sm" disabled={isPending || !note.trim()}>
        {isPending ? "Adding..." : "Add Note"}
      </Button>
    </form>
  );
}
