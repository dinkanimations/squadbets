"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { SaveToast } from "@/components/quotes/SaveToast";
import { ScheduleDeliverablesBar } from "./ScheduleDeliverablesBar";
import { ScheduleHeaderBar } from "./ScheduleHeaderBar";
import { ScheduleLivePreview } from "./ScheduleLivePreview";
import { ScheduleTimelineEditor } from "./ScheduleTimelineEditor";
import {
  createScheduleAction,
  updateScheduleAction,
} from "@/lib/production-schedules/actions";
import { regenerateSchedulePdfAction } from "@/lib/production-schedules/pdf-actions";
import {
  createEmptyScheduleDraft,
  normalizeScheduleData,
  type ScheduleFormDraft,
} from "@/lib/production-schedules/constants";
import { serializeScheduleDraft } from "@/lib/production-schedules/draft-serializer";
import { generateScheduleData } from "@/lib/production-schedules/generate";
import { buildSchedulePreviewData } from "@/lib/production-schedules/preview-data";
import type { AppSettingsData } from "@/lib/settings/types";
import { cn } from "@/lib/utils/cn";

type SaveState = "idle" | "saving" | "saved" | "error";

interface ScheduleBuilderProps {
  scheduleId?: string;
  createdAt?: string;
  currentVersion?: number;
  initialDraft?: ScheduleFormDraft;
  settings: AppSettingsData;
  defaultPhaseNames?: string[];
  defaultPhaseWeights?: Record<string, number>;
}

function formatLastSaved(date: Date): string {
  if (Date.now() - date.getTime() < 60_000) return "Just now";
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduleBuilder({
  scheduleId: initialScheduleId,
  createdAt,
  currentVersion = 1,
  initialDraft,
  settings,
  defaultPhaseNames,
  defaultPhaseWeights,
}: ScheduleBuilderProps) {
  const router = useRouter();
  const startingDraft = initialDraft ?? createEmptyScheduleDraft();
  const [draft, setDraft] = useState<ScheduleFormDraft>(startingDraft);
  const [activeScheduleId, setActiveScheduleId] = useState(initialScheduleId);
  const [activeVersion, setActiveVersion] = useState(currentVersion);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    createdAt ? new Date(createdAt) : null,
  );
  const [lastSavedLabel, setLastSavedLabel] = useState(
    createdAt ? formatLastSaved(new Date(createdAt)) : "",
  );
  const [, setRelativeTimeTick] = useState(0);

  const skipAutoSave = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  const activeScheduleIdRef = useRef(activeScheduleId);
  const savedSnapshotRef = useRef(serializeScheduleDraft(startingDraft));
  const saveChainRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const seededRef = useRef(
    startingDraft.scheduleData.phases.length > 0,
  );

  draftRef.current = draft;
  activeScheduleIdRef.current = activeScheduleId;

  const isDirty = useMemo(
    () => serializeScheduleDraft(draft) !== savedSnapshotRef.current,
    [draft],
  );

  const previewData = useMemo(
    () =>
      buildSchedulePreviewData(draft, settings, {
        versionNumber: activeVersion,
        createdDate: createdAt,
      }),
    [draft, settings, activeVersion, createdAt],
  );

  const updateDraft = useCallback((patch: Partial<ScheduleFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaveState("idle");
  }, []);

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

  const ensureGeneratedSchedule = useCallback(() => {
    if (draftRef.current.scheduleData.phases.length > 0) return;
    if (!draftRef.current.startDate || !draftRef.current.deliveryDate) return;

    const generated = generateScheduleData({
      startDate: draftRef.current.startDate,
      deliveryDate: draftRef.current.deliveryDate,
      reviewRounds: draftRef.current.reviewRounds,
      phaseNames: defaultPhaseNames,
      phaseWeights: defaultPhaseWeights,
    });

    updateDraft({
      scheduleData: normalizeScheduleData({
        ...generated,
        workingDays: settings.workingDays,
        companyHolidays: settings.companyHolidays,
        shutdownPeriods: [],
        milestoneLegend: draftRef.current.scheduleData.milestoneLegend,
      }),
    });
  }, [defaultPhaseNames, defaultPhaseWeights, settings, updateDraft]);

  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      ensureGeneratedSchedule();
    }
  }, [ensureGeneratedSchedule]);

  const markSaved = useCallback(
    (options?: { manual?: boolean; nextVersion?: number }) => {
      const savedAt = new Date();
      savedSnapshotRef.current = serializeScheduleDraft(draftRef.current);
      setLastSavedAt(savedAt);
      setLastSavedLabel("Just now");
      setSaveState("saved");
      if (options?.nextVersion) {
        setActiveVersion(options.nextVersion);
      }
      if (options?.manual) {
        showToast("Draft saved successfully.", "success");
      }
    },
    [showToast],
  );

  const persistSchedule = useCallback(
    (options?: { manual?: boolean }) => {
      const runSave = async (): Promise<boolean> => {
        clearPendingAutoSave();
        setSaveState("saving");

        const payload = {
          ...draftRef.current,
          companyId: draftRef.current.companyId || null,
        };

        try {
          const scheduleId = activeScheduleIdRef.current;

          if (!scheduleId) {
            const result = await createScheduleAction(JSON.stringify(payload));
            if (result.error) {
              setSaveState("error");
              if (options?.manual) showToast(result.error, "error");
              return false;
            }

            if (result.id) {
              activeScheduleIdRef.current = result.id;
              setActiveScheduleId(result.id);
              setActiveVersion(1);
              window.history.replaceState(
                null,
                "",
                `/production-schedules/${result.id}`,
              );
            }
          } else {
            const result = await updateScheduleAction(
              scheduleId,
              JSON.stringify(payload),
            );
            if (result.error) {
              setSaveState("error");
              if (options?.manual) showToast(result.error, "error");
              return false;
            }
            markSaved({
              manual: options?.manual,
              nextVersion: activeVersion + 1,
            });
            router.refresh();
            return true;
          }

          markSaved(options);
          router.refresh();
          return true;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save schedule.";
          setSaveState("error");
          if (options?.manual) showToast(message, "error");
          return false;
        }
      };

      saveChainRef.current = saveChainRef.current
        .then(() => runSave())
        .catch(() => false);

      return saveChainRef.current;
    },
    [activeVersion, clearPendingAutoSave, markSaved, router, showToast],
  );

  useEffect(() => {
    if (skipAutoSave.current) {
      skipAutoSave.current = false;
      return;
    }

    clearPendingAutoSave();
    saveTimer.current = setTimeout(() => {
      void persistSchedule();
    }, 1200);

    return clearPendingAutoSave;
  }, [clearPendingAutoSave, draft, persistSchedule]);

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
    void persistSchedule({ manual: true });
  };

  const handleRegenerate = () => {
    if (!draft.startDate || !draft.deliveryDate) {
      showToast("Set start and delivery dates first.", "error");
      return;
    }

    const generated = generateScheduleData({
      startDate: draft.startDate,
      deliveryDate: draft.deliveryDate,
      reviewRounds: draft.reviewRounds,
      phaseNames: defaultPhaseNames,
      phaseWeights: defaultPhaseWeights,
    });

    updateDraft({
      scheduleData: normalizeScheduleData({
        phases: generated.phases,
        milestones:
          draft.scheduleData.milestones.length > 0
            ? draft.scheduleData.milestones
            : generated.milestones,
        workingDays: draft.scheduleData.workingDays,
        companyHolidays: draft.scheduleData.companyHolidays,
        shutdownPeriods: draft.scheduleData.shutdownPeriods,
        milestoneLegend: draft.scheduleData.milestoneLegend,
      }),
    });
    showToast(
      draft.scheduleData.milestones.length > 0
        ? "Phases regenerated — your milestones were kept."
        : "Timeline regenerated from dates.",
      "success",
    );
  };

  const handleGeneratePdf = async () => {
    if (!activeScheduleId) {
      showToast("Save the schedule before generating a PDF.", "error");
      return;
    }

    const result = await regenerateSchedulePdfAction(activeScheduleId);
    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast(result.success ?? "PDF generated.", "success");
      router.refresh();
    }
  };

  const downloadUrl = activeScheduleId
    ? `/api/production-schedules/${activeScheduleId}/pdf?download=1&save=1`
    : undefined;

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
          href="/production-schedules"
          onClick={(event) => {
            if (!isDirty || saveState === "saving") return;
            if (
              !window.confirm(
                "You have unsaved changes. Leave this page without saving?",
              )
            ) {
              event.preventDefault();
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schedules
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
          {lastSavedAt ? <span>Last saved: {lastSavedLabel}</span> : null}
        </div>
      </div>

      <ScheduleDeliverablesBar
        deliverables={draft.deliverables}
        onChange={(deliverables) => updateDraft({ deliverables })}
      />

      <ScheduleHeaderBar
        projectTitle={draft.projectTitle}
        clientName={draft.clientName}
        startDate={draft.startDate}
        deliveryDate={draft.deliveryDate}
        onProjectTitleChange={(projectTitle) => updateDraft({ projectTitle })}
        onClientNameChange={(clientName) => updateDraft({ clientName })}
        onStartDateChange={(startDate) => updateDraft({ startDate })}
        onDeliveryDateChange={(deliveryDate) => updateDraft({ deliveryDate })}
      />

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
        <div className="space-y-4 overflow-y-auto pb-4">
          <ScheduleTimelineEditor
            startDate={draft.startDate}
            deliveryDate={draft.deliveryDate}
            scheduleData={draft.scheduleData}
            onChange={(scheduleData) => updateDraft({ scheduleData })}
          />

          <Textarea
            label="Notes"
            rows={3}
            value={draft.notes}
            onChange={(event) => updateDraft({ notes: event.target.value })}
          />
        </div>

        <ScheduleLivePreview data={previewData} />
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={handleSaveDraft}>
            {saveState === "saving" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Draft
          </Button>

          <Button type="button" variant="secondary" onClick={handleRegenerate}>
            <RefreshCw className="h-4 w-4" />
            Regenerate Timeline
          </Button>

          <Button
            type="button"
            disabled={!activeScheduleId}
            onClick={() => void handleGeneratePdf()}
          >
            <FileText className="h-4 w-4" />
            Generate PDF
          </Button>

          {downloadUrl ? (
            <a
              href={downloadUrl}
              download={`${draft.projectTitle || "schedule"}.pdf`}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-4 text-sm font-medium text-foreground transition-colors hover:border-border-hover",
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
        </div>
      </div>
    </div>
  );
}
