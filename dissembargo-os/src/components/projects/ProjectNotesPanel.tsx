"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import {
  addProjectNoteAction,
  deleteProjectNoteAction,
  updateProjectNoteAction,
} from "@/lib/projects/actions";
import { formatProjectDate } from "@/lib/projects/utils";
import type { ProjectNote } from "@/types/database";

interface ProjectNotesPanelProps {
  projectId: string;
  notes: ProjectNote[];
}

export function ProjectNotesPanel({ projectId, notes }: ProjectNotesPanelProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!content.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addProjectNoteAction(projectId, content);
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
        router.refresh();
      }
    });
  };

  const handleUpdate = (noteId: string) => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      const result = await updateProjectNoteAction(
        projectId,
        noteId,
        editContent,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
        router.refresh();
      }
    });
  };

  const handleDelete = (noteId: string) => {
    if (!window.confirm("Delete this note?")) return;

    startTransition(async () => {
      const result = await deleteProjectNoteAction(projectId, noteId);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader
        title="Internal Notes"
        description="Chronological notes for the project team"
      />

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mb-6 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note..."
          rows={3}
        />
        <Button
          type="button"
          size="sm"
          disabled={isPending || !content.trim()}
          onClick={handleAdd}
        >
          {isPending ? "Adding..." : "Add Note"}
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-border bg-surface-elevated/40 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted">
                  {formatProjectDate(note.created_at)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(note.id);
                      setEditContent(note.content);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground"
                    aria-label="Edit note"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleDelete(note.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-danger"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleUpdate(note.id)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {note.content}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
