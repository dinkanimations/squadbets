"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Download, File, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  deleteProjectFileAction,
  getProjectDownloadUrlAction,
  uploadProjectFileAction,
} from "@/lib/projects/actions";
import { formatProjectDate } from "@/lib/projects/utils";
import type { ProjectFile } from "@/types/database";

interface ProjectFilesPanelProps {
  projectId: string;
  files: ProjectFile[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesPanel({
  projectId,
  files,
}: ProjectFilesPanelProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadProjectFileAction(projectId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "File uploaded.");
        router.refresh();
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const handleDelete = (fileId: string) => {
    if (!window.confirm("Delete this file?")) return;

    startTransition(async () => {
      const result = await deleteProjectFileAction(projectId, fileId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  const handleDownload = async (storagePath: string) => {
    const url = await getProjectDownloadUrlAction(storagePath);
    window.open(url, "_blank");
  };

  return (
    <Card>
      <CardHeader
        title="Files"
        description="Upload PDFs, images, videos, documents, and ZIP archives"
        action={
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.zip,.doc,.docx,.txt"
              onChange={handleUpload}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </>
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

      {files.length === 0 ? (
        <p className="text-sm text-muted">No files uploaded yet.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated/40 px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <File className="h-4 w-4 shrink-0 text-muted" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-muted">
                    {formatFileSize(file.file_size)} ·{" "}
                    {formatProjectDate(file.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(file.storage_path)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground"
                  aria-label="Download file"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(file.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-danger"
                  aria-label="Delete file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
