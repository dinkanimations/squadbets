"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Download, Eye, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import {
  getQuotePdfVersionsAction,
  regenerateQuotePdfAction,
} from "@/lib/quotes/pdf-actions";
import { formatQuoteDate } from "@/lib/quotes/calculations";

type PdfVersion = Awaited<ReturnType<typeof getQuotePdfVersionsAction>>[number];

interface QuotePdfPanelProps {
  quoteId: string;
  quoteNumber: string;
  disabled?: boolean;
}

const linkButtonClass =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition-colors hover:border-border-hover";

export function QuotePdfPanel({
  quoteId,
  quoteNumber,
  disabled = false,
}: QuotePdfPanelProps) {
  const router = useRouter();
  const [versions, setVersions] = useState<PdfVersion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    void getQuotePdfVersionsAction(quoteId).then(setVersions);
  }, [quoteId]);

  const handleRegenerate = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await regenerateQuotePdfAction(quoteId);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "PDF regenerated.");
        void getQuotePdfVersionsAction(quoteId).then(setVersions);
        router.refresh();
      }
    });
  };

  const previewUrl = `/api/quotes/${quoteId}/pdf?preview=1`;
  const downloadUrl = `/api/quotes/${quoteId}/pdf?download=1&save=1`;

  return (
    <Card>
      <CardHeader
        title="PDF Export"
        description="Preview, download, or regenerate client-ready quotation PDFs"
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

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || isPending}
          onClick={() => window.open(previewUrl, "_blank")}
        >
          <Eye className="h-4 w-4" />
          Preview PDF
        </Button>
        <a
          href={downloadUrl}
          download={`${quoteNumber}.pdf`}
          className={cn(linkButtonClass, (disabled || isPending) && "pointer-events-none opacity-50")}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
        <Button
          type="button"
          disabled={disabled || isPending}
          onClick={handleRegenerate}
        >
          <RefreshCw className="h-4 w-4" />
          {isPending ? "Generating..." : "Regenerate PDF"}
        </Button>
      </div>

      {versions.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-medium text-foreground">
            Previous Versions
          </h4>
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-elevated/40 px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted" />
                  <span>
                    Version {version.version} ·{" "}
                    {formatQuoteDate(version.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={version.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground"
                    aria-label="Preview version"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={version.downloadUrl}
                    download
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground"
                    aria-label="Download version"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
