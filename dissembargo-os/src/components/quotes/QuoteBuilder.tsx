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
  getContactsForQuoteAction,
  getOpportunitiesForQuoteAction,
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

type CompanyOption = { id: string; company_name: string };

type SaveState = "idle" | "saving" | "saved" | "error";

interface QuoteBuilderProps {
  quoteId?: string;
  quoteNumber?: string;
  createdAt?: string;
  initialDraft?: QuoteFormDraft;
  companies: CompanyOption[];
  settings: AppSettingsData;
}

export function QuoteBuilder({
  quoteId: initialQuoteId,
  quoteNumber: initialQuoteNumber,
  createdAt,
  initialDraft,
  companies,
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
  const [isPending, startTransition] = useTransition();
  const skipAutoSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  }, []);

  const handleCompanyChange = (companyId: string) => {
    const company = companies.find((item) => item.id === companyId);
    updateDraft({
      companyId,
      contactId: "",
      opportunityId: "",
      clientName: company?.company_name ?? "",
    });

    if (!companyId) return;

    void getContactsForQuoteAction(companyId);
    void getOpportunitiesForQuoteAction(companyId);
  };

  const persistQuote = useCallback(
    async (status?: QuoteStatus) => {
      if (!draft.companyId) {
        setSaveError("Select a client before saving.");
        setSaveState("error");
        return false;
      }

      setSaveState("saving");
      setSaveError(null);

      const payload = {
        ...draft,
        status: status ?? draft.status,
      };

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

      setSaveState("saved");
      router.refresh();
      return true;
    },
    [activeQuoteId, draft, router],
  );

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }

    if (!draft.companyId) return;

    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    saveTimer.current = setTimeout(() => {
      void persistQuote("draft");
    }, 1200);

    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [draft, persistQuote]);

  const handleSaveDraft = () => {
    startTransition(async () => {
      const saved = await persistQuote("draft");
      if (saved) {
        setActionMessage("Draft saved.");
      }
    });
  };

  const handleGeneratePdf = () => {
    if (!activeQuoteId) {
      setSaveError("Save the quote before generating a PDF.");
      return;
    }

    setActionMessage(null);
    startTransition(async () => {
      const result = await regenerateQuotePdfAction(activeQuoteId);
      if (result.error) {
        setSaveError(result.error);
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

        <div className="flex items-center gap-2 text-xs text-muted">
          {saveState === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          )}
          {saveState === "saved" && <span className="text-success">Saved</span>}
          {saveState === "error" && saveError && (
            <span className="text-danger">{saveError}</span>
          )}
          {actionMessage && saveState !== "error" && (
            <span className="text-success">{actionMessage}</span>
          )}
        </div>
      </div>

      <QuoteHeaderBar
        companies={companies}
        companyId={draft.companyId}
        projectTitle={draft.projectTitle}
        quoteNumber={activeQuoteNumber}
        issueDate={createdAt}
        onCompanyChange={handleCompanyChange}
        onProjectTitleChange={(projectTitle) => updateDraft({ projectTitle })}
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
            disabled={isPending}
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
