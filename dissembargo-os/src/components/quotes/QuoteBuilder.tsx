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
import { SaveToast } from "./SaveToast";
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
import { serializeQuoteDraft } from "@/lib/quotes/draft-serializer";
import { buildQuotePreviewData } from "@/lib/quotes/preview-data";
import type { AppSettingsData } from "@/lib/settings/types";
import type { QuoteStatus } from "@/types/database";
import { cn } from "@/lib/utils/cn";

type SaveState = "idle" | "saving" | "saved" | "error";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

interface QuoteBuilderProps {
  quoteId?: string;
  quoteNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  initialDraft?: QuoteFormDraft;
  settings: AppSettingsData;
}

function formatLastSaved(date: Date): string {
  const elapsedMs = Date.now() - date.getTime();
  if (elapsedMs < 60_000) return "Just now";
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
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
  const startingDraft = initialDraft ?? createEmptyQuoteDraft();
  const [draft, setDraft] = useState<QuoteFormDraft>(startingDraft);
  const [activeQuoteId, setActiveQuoteId] = useState(initialQuoteId);
  const [activeQuoteNumber, setActiveQuoteNumber] = useState(initialQuoteNumber);
  const [issueDate, setIssueDate] = useState(
    createdAt ?? new Date().toISOString(),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState<ToastState>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    updatedAt ? new Date(updatedAt) : null,
  );
  const [lastSavedLabel, setLastSavedLabel] = useState(
    updatedAt ? formatLastSaved(new Date(updatedAt)) : "",
  );
  const [isPending, startTransition] = useTransition();
  const [, setRelativeTimeTick] = useState(0);

  const skipAutoSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  const activeQuoteIdRef = useRef(activeQuoteId);
  const savedSnapshotRef = useRef(serializeQuoteDraft(startingDraft));
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true));

  draftRef.current = draft;
  activeQuoteIdRef.current = activeQuoteId;

  const isDirty = useMemo(
    () => serializeQuoteDraft(draft) !== savedSnapshotRef.current,
    [draft],
  );

  const previewData = useMemo(
    () =>
      buildQuotePreviewData(draft, settings, {
        quoteNumber: activeQuoteNumber,
        issueDate,
      }),
    [draft, settings, activeQuoteNumber, issueDate],
  );

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  const clearPendingAutoSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
  }, []);

  const markSaved = useCallback((options?: { manual?: boolean }) => {
    const savedAt = new Date();
    savedSnapshotRef.current = serializeQuoteDraft(draftRef.current);
    setLastSavedAt(savedAt);
    setLastSavedLabel("Just now");
    setSaveState("saved");
    if (options?.manual) {
      showToast("Draft saved successfully.", "success");
    }
  }, [showToast]);

  const persistQuote = useCallback(
    (status?: QuoteStatus, options?: { manual?: boolean }) => {
      const runSave = async (): Promise<boolean> => {
        clearPendingAutoSave();
        setSaveState("saving");

        const payload = {
          ...draftRef.current,
          companyId: draftRef.current.companyId || null,
          status: status ?? draftRef.current.status,
        };

        try {
          const quoteId = activeQuoteIdRef.current;

          if (!quoteId) {
            const result = await createQuoteAction(JSON.stringify(payload));
            if (result.error) {
              setSaveState("error");
              if (options?.manual) {
                showToast(result.error, "error");
              }
              return false;
            }

            if (result.id) {
              activeQuoteIdRef.current = result.id;
              setActiveQuoteId(result.id);
              if (result.quoteNumber) {
                setActiveQuoteNumber(result.quoteNumber);
              }
              if (!createdAt) {
                setIssueDate(new Date().toISOString());
              }
              window.history.replaceState(null, "", `/quotes/${result.id}`);
            }
          } else {
            const result = await updateQuoteAction(
              quoteId,
              JSON.stringify(payload),
            );
            if (result.error) {
              setSaveState("error");
              if (options?.manual) {
                showToast(result.error, "error");
              }
              return false;
            }
          }

          markSaved(options);
          router.refresh();
          return true;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save quote.";
          setSaveState("error");
          if (options?.manual) {
            showToast(message, "error");
          }
          return false;
        }
      };

      saveChainRef.current = saveChainRef.current
        .then(() => runSave())
        .catch(() => false);

      return saveChainRef.current;
    },
    [clearPendingAutoSave, createdAt, markSaved, router, showToast],
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

  useEffect(() => {
    if (!lastSavedAt) return;

    const interval = setInterval(() => {
      setLastSavedLabel(formatLastSaved(lastSavedAt));
      setRelativeTimeTick((value) => value + 1);
    }, 10_000);

    return () => clearInterval(interval);
  }, [lastSavedAt]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || saveState === "saving") return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, saveState]);

  const handleSaveDraft = () => {
    clearPendingAutoSave();
    void persistQuote("draft", { manual: true });
  };

  const handleNavigateAway = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isDirty || saveState === "saving") return;
    const confirmed = window.confirm(
      "You have unsaved changes. Leave this page without saving?",
    );
    if (!confirmed) {
      event.preventDefault();
    }
  };

  const handleGeneratePdf = () => {
    if (!activeQuoteId) {
      showToast("Save the quote before generating a PDF.", "error");
      return;
    }

    startTransition(async () => {
      const result = await regenerateQuotePdfAction(activeQuoteId);
      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(result.success ?? "PDF generated.", "success");
        router.refresh();
      }
    });
  };

  const handleDuplicate = () => {
    if (!activeQuoteId) return;

    startTransition(async () => {
      const result = await duplicateQuoteAction(activeQuoteId);
      if (result.error) {
        showToast(result.error, "error");
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

  const updateDraft = useCallback((patch: Partial<QuoteFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaveState("idle");
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4">
      {toast ? (
        <SaveToast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/quotes"
          onClick={handleNavigateAway}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Quotes
        </Link>

        <div className="flex flex-col items-end gap-1 text-xs text-muted">
          <div className="flex items-center gap-2">
            {saveState === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </>
            )}
            {saveState === "saved" && !isDirty && (
              <span className="text-success">All changes saved</span>
            )}
            {isDirty && saveState !== "saving" && (
              <span>Unsaved changes</span>
            )}
          </div>
          {lastSavedAt ? (
            <span>Last saved: {lastSavedLabel}</span>
          ) : null}
        </div>
      </div>

      <QuoteHeaderBar
        clientName={draft.clientName}
        projectTitle={draft.projectTitle}
        version={draft.version}
        issueDate={issueDate}
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
            onClick={handleSaveDraft}
          >
            {saveState === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </Button>

          <Button
            type="button"
            disabled={!activeQuoteId || isPending}
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
            disabled={!activeQuoteId || isPending}
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
