"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuoteHeaderBar } from "./QuoteHeaderBar";
import { DeliverablesSpreadsheet } from "./DeliverablesSpreadsheet";
import { BudgetSpreadsheet } from "./BudgetSpreadsheet";
import { QuoteTotalsBar } from "./QuoteTotalsBar";
import { QuoteLivePreview } from "./QuoteLivePreview";
import {
  createQuoteAction,
  duplicateQuoteAction,
  updateQuoteAction,
} from "@/lib/quotes/actions";
import { regenerateQuotePdfAction } from "@/lib/quotes/pdf-actions";
import {
  createEmptyDeliverable,
  createEmptyQuoteDraft,
  type QuoteFormDraft,
} from "@/lib/quotes/constants";
import { buildQuotePreviewData } from "@/lib/quotes/preview-data";
import type { AppSettingsData } from "@/lib/settings/types";
import type { QuoteStatus } from "@/types/database";
import { cn } from "@/lib/utils/cn";

type SaveState = "idle" | "saving" | "saved" | "error";

interface QuoteBuilderProps {
  quoteId?: string;
  quoteNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  initialDraft?: QuoteFormDraft;
  settings: AppSettingsData;
}

function formatLastSaved(date: Date): string {
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function QuoteBuilder({
  quoteId: initialQuoteId,
  quoteNumber: initialQuoteNumber,
  createdAt,
  updatedAt,
  initialDraft,
  settings,
}: QuoteBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<QuoteFormDraft>(
    initialDraft ?? createEmptyQuoteDraft(),
  );
  const [activeQuoteId, setActiveQuoteId] = useState(initialQuoteId);
  const [activeQuoteNumber, setActiveQuoteNumber] = useState(initialQuoteNumber);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    updatedAt ? new Date(updatedAt) : null,
  );
  const [isPending, startTransition] = useTransition();
  const skipAutoSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSaving = useRef(false);

  const previewData = useMemo(
    () =>
      buildQuotePreviewData(draft, settings, {
        quoteNumber: activeQuoteNumber,
        issueDate: createdAt,
      }),
    [draft, settings, activeQuoteNumber, createdAt],
  );

  const updateDraft = useCallback((patch: Partial<QuoteFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaveState("idle");
    setActionMessage(null);
  }, []);

  const clearPendingAutoSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  const persistQuote = useCallback(
    async (status?: QuoteStatus, options?: { manual?: boolean }) => {
      if (isSaving.current) {
        return false;
      }

      isSaving.current = true;
      clearPendingAutoSave();
      setSaveState("saving");
      setSaveError(null);
      if (options?.manual) {
        setActionMessage(null);
      }

      const payload = {
        ...draft,
        companyId: draft.companyId || null,
        status: status ?? draft.status,
      };

      try {
        if (!activeQuoteId) {
          const result = await createQuoteAction(JSON.stringify(payload));
          if (result.error) {
            setSaveError(result.error);
            setSaveState("error");
            return false;
          }

          if (result.id) {
            setActiveQuoteId(result.id);
            if (result.quoteNumber) {
              setActiveQuoteNumber(result.quoteNumber);
            }
            window.history.replaceState(null, "", `/quotes/${result.id}`);
          }
        } else {
          const result = await updateQuoteAction(
            activeQuoteId,
            JSON.stringify(payload),
          );
          if (result.error) {
            setSaveError(result.error);
            setSaveState("error");
            return false;
          }
        }

        const savedAt = new Date();
        setLastSavedAt(savedAt);
        setSaveState("saved");
        if (options?.manual) {
          setActionMessage("Draft saved successfully.");
        }
        router.refresh();
        return true;
      } finally {
        isSaving.current = false;
      }
    },
    [activeQuoteId, clearPendingAutoSave, draft, router],
  );

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }

    clearPendingAutoSave();
    saveTimer.current = setTimeout(() => {
      void persistQuote("draft");
    }, 1200);

    return clearPendingAutoSave;
  }, [clearPendingAutoSave, draft, persistQuote]);

  const handleSaveDraft = () => {
    clearPendingAutoSave();
    startTransition(async () => {
      await persistQuote("draft", { manual: true });
    });
  };

  const handleGeneratePdf = () => {
    if (!activeQuoteId) {
      setSaveError("Save the quote before generating a PDF.");
      setSaveState("error");
      return;
    }

    setActionMessage(null);
    startTransition(async () => {
      const result = await regenerateQuotePdfAction(activeQuoteId);
      if (result.error) {
        setSaveError(result.error);
        setSaveState("error");
      } else {
        setActionMessage(result.success ?? "PDF generated.");
        router.refresh();
      }
    });
  };

  const handleDuplicate = () => {
    if (!activeQuoteId) return;

    startTransition(async () => {
      const result = await duplicateQuoteAction(activeQuoteId);
      if (result.error) {
        setSaveError(result.error);
        setSaveState("error");
      } else if (result.id) {
        router.push(`/quotes/${result.id}`);
      }
    });
  };

  const downloadUrl = activeQuoteId
    ? `/api/quotes/${activeQuoteId}/pdf?download=1&save=1`
    : undefined;

  const deliverables =
    draft.deliverables.length > 0
      ? draft.deliverables
      : [createEmptyDeliverable()];

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/quotes"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Link>

        <div className="flex flex-col items-end gap-1 text-xs">
          <div className="flex items-center gap-2 text-muted">
            {saveState === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            )}
            {saveState === "saved" && !actionMessage && (
              <span className="text-success">All changes saved</span>
            )}
            {lastSavedAt && (
              <span className="text-muted">
                Last saved {formatLastSaved(lastSavedAt)}
              </span>
            )}
          </div>
          {saveState === "error" && saveError && (
            <span className="text-danger">{saveError}</span>
          )}
          {actionMessage && saveState !== "error" && (
            <span className="text-success">{actionMessage}</span>
          )}
        </div>
      </div>

      <QuoteHeaderBar
        clientName={draft.clientName}
        projectTitle={draft.projectTitle}
        version={draft.version}
        issueDate={createdAt}
        onClientNameChange={(clientName) => updateDraft({ clientName })}
        onProjectTitleChange={(projectTitle) => updateDraft({ projectTitle })}
        onVersionChange={(version) => updateDraft({ version })}
      />

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="space-y-4 overflow-y-auto pb-4">
          <DeliverablesSpreadsheet
            deliverables={deliverables}
            onChange={(items) => updateDraft({ deliverables: items })}
          />

          <BudgetSpreadsheet
            sections={draft.budgetSections}
            onChange={(budgetSections) => updateDraft({ budgetSections })}
          />

          <QuoteTotalsBar
            sections={draft.budgetSections}
            discountType={draft.discountType}
            discountValue={draft.discountValue}
            onDiscountTypeChange={(discountType) => updateDraft({ discountType })}
            onDiscountValueChange={(discountValue) =>
              updateDraft({ discountValue })
            }
          />
        </div>

        <QuoteLivePreview data={previewData} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || saveState === "saving"}
            onClick={handleSaveDraft}
          >
            <Save className="h-4 w-4" />
            Save Draft
          </Button>

          <Button
            type="button"
            disabled={isPending || !activeQuoteId}
            onClick={handleGeneratePdf}
          >
            <FileText className="h-4 w-4" />
            {isPending ? "Working..." : "Generate PDF"}
          </Button>

          {downloadUrl ? (
            <a
              href={downloadUrl}
              download={`${activeQuoteNumber ?? "quote"}.pdf`}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition-colors hover:border-border-hover",
                isPending && "pointer-events-none opacity-50",
              )}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
          ) : (
            <Button type="button" variant="secondary" disabled>
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            disabled={isPending || !activeQuoteId}
            onClick={handleDuplicate}
          >
            <Copy className="h-4 w-4" />
            Duplicate Quote
          </Button>
        </div>
      </div>
    </div>
  );
}
