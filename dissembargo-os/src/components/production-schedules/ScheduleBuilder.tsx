"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ArrowLeft, RefreshCw, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { PhaseEditor } from "./PhaseEditor";
import { MilestoneEditor } from "./MilestoneEditor";
import { ScheduleTimeline } from "./ScheduleTimeline";
import { ScheduleStatusBadge } from "./ScheduleStatusBadge";
import { ScheduleVersionPanel } from "./ScheduleVersionPanel";
import {
  archiveScheduleAction,
  createScheduleAction,
  getOpportunitiesForScheduleAction,
  getQuotesForScheduleAction,
  regenerateScheduleAction,
  updateScheduleAction,
} from "@/lib/production-schedules/actions";
import {
  createEmptyScheduleDraft,
  SCHEDULE_STATUSES,
  SCHEDULE_STATUS_LABELS,
  type ScheduleFormDraft,
} from "@/lib/production-schedules/constants";
import { generateScheduleData } from "@/lib/production-schedules/generate";
import { formatScheduleDate } from "@/lib/production-schedules/calculations";
import type { ProductionScheduleVersion, ScheduleStatus } from "@/types/database";

type CompanyOption = { id: string; company_name: string };
type OpportunityOption = { id: string; subject: string | null; company_id: string };
type QuoteOption = { id: string; quote_number: string; company_id: string | null };

interface ScheduleBuilderProps {
  mode: "create" | "edit";
  scheduleId?: string;
  createdAt?: string;
  currentVersion?: number;
  versions?: ProductionScheduleVersion[];
  initialDraft?: ScheduleFormDraft;
  companies: CompanyOption[];
  initialOpportunities?: OpportunityOption[];
  initialQuotes?: QuoteOption[];
}

export function ScheduleBuilder({
  mode,
  scheduleId,
  createdAt,
  currentVersion = 1,
  versions = [],
  initialDraft,
  companies,
  initialOpportunities = [],
  initialQuotes = [],
}: ScheduleBuilderProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<ScheduleFormDraft>(
    initialDraft ?? createEmptyScheduleDraft(),
  );
  const [opportunities, setOpportunities] =
    useState<OpportunityOption[]>(initialOpportunities);
  const [quotes, setQuotes] = useState<QuoteOption[]>(initialQuotes);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateDraft = (patch: Partial<ScheduleFormDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleCompanyChange = (companyId: string) => {
    updateDraft({
      companyId,
      opportunityId: "",
      quoteId: "",
    });

    if (!companyId) {
      setOpportunities([]);
      setQuotes([]);
      return;
    }

    void getOpportunitiesForScheduleAction(companyId).then(setOpportunities);
    void getQuotesForScheduleAction(companyId).then(setQuotes);
  };

  const handleAutoGenerate = () => {
    if (!draft.startDate || !draft.deliveryDate) {
      setError("Set start and delivery dates before generating.");
      return;
    }

    const scheduleData = generateScheduleData({
      startDate: draft.startDate,
      deliveryDate: draft.deliveryDate,
      reviewRounds: draft.reviewRounds,
    });

    updateDraft({ scheduleData });
    setSuccess("Schedule generated from dates and review rounds.");
    setError(null);
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const payload = JSON.stringify(draft);

      if (mode === "create") {
        const result = await createScheduleAction(payload);
        if (result.error) {
          setError(result.error);
        } else if (result.id) {
          router.push(`/production-schedules/${result.id}`);
        }
        return;
      }

      if (!scheduleId) return;

      const result = await updateScheduleAction(scheduleId, payload);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "Schedule saved.");
        router.refresh();
      }
    });
  };

  const handleRegenerate = () => {
    if (!scheduleId) {
      handleAutoGenerate();
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await regenerateScheduleAction(
        scheduleId,
        JSON.stringify(draft),
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(result.success ?? "Schedule regenerated.");
        router.refresh();
      }
    });
  };

  const handleArchive = () => {
    if (!scheduleId || !window.confirm("Archive this schedule?")) return;

    startTransition(async () => {
      const result = await archiveScheduleAction(scheduleId);
      if (result?.error) setError(result.error);
    });
  };

  const updateDeliverable = (index: number, value: string) => {
    const next = [...draft.deliverables];
    next[index] = value;
    updateDraft({ deliverables: next });
  };

  const addDeliverable = () => {
    updateDraft({ deliverables: [...draft.deliverables, ""] });
  };

  const removeDeliverable = (index: number) => {
    if (draft.deliverables.length <= 1) return;
    updateDraft({
      deliverables: draft.deliverables.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/production-schedules"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Schedules
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={isPending}
            onClick={handleRegenerate}
          >
            <RefreshCw className="h-4 w-4" />
            {mode === "create" ? "Auto-Generate" : "Regenerate"}
          </Button>
          {mode === "edit" && (
            <Button
              type="button"
              variant="danger"
              disabled={isPending}
              onClick={handleArchive}
            >
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          )}
          <Button type="button" disabled={isPending} onClick={handleSave}>
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === "create"
              ? "New Production Schedule"
              : draft.projectTitle}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "create"
              ? "Auto-generate phases and milestones from your dates"
              : `Created ${createdAt ? formatScheduleDate(createdAt) : ""} · v${currentVersion}`}
          </p>
        </div>
        <ScheduleStatusBadge status={draft.status} />
      </div>

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Schedule Details"
            description="Link to company, opportunity, quote, and project"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Project Title"
              value={draft.projectTitle}
              onChange={(e) => updateDraft({ projectTitle: e.target.value })}
              placeholder="e.g. Brand Film Production"
            />
            <Select
              label="Status"
              value={draft.status}
              onChange={(e) =>
                updateDraft({ status: e.target.value as ScheduleStatus })
              }
              options={SCHEDULE_STATUSES.map((s) => ({
                value: s,
                label: SCHEDULE_STATUS_LABELS[s],
              }))}
            />
            <Select
              label="Company"
              value={draft.companyId}
              onChange={(e) => handleCompanyChange(e.target.value)}
              options={[
                { value: "", label: "Select company" },
                ...companies.map((c) => ({
                  value: c.id,
                  label: c.company_name,
                })),
              ]}
            />
            <Select
              label="Opportunity"
              value={draft.opportunityId}
              onChange={(e) => updateDraft({ opportunityId: e.target.value })}
              options={[
                { value: "", label: "No opportunity" },
                ...opportunities.map((o) => ({
                  value: o.id,
                  label: o.subject ?? "Untitled",
                })),
              ]}
              disabled={!draft.companyId}
            />
            <Select
              label="Quote"
              value={draft.quoteId}
              onChange={(e) => updateDraft({ quoteId: e.target.value })}
              options={[
                { value: "", label: "No quote" },
                ...quotes.map((q) => ({
                  value: q.id,
                  label: q.quote_number,
                })),
              ]}
              disabled={!draft.companyId}
            />
            <Input
              label="Review Rounds"
              type="number"
              min="1"
              max="10"
              value={draft.reviewRounds}
              onChange={(e) =>
                updateDraft({ reviewRounds: Number(e.target.value) || 1 })
              }
            />
            <Input
              label="Start Date"
              type="date"
              value={draft.startDate}
              onChange={(e) => updateDraft({ startDate: e.target.value })}
            />
            <Input
              label="Delivery Date"
              type="date"
              value={draft.deliveryDate}
              onChange={(e) => updateDraft({ deliveryDate: e.target.value })}
            />
          </div>

          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Deliverables
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={addDeliverable}>
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {draft.deliverables.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => updateDeliverable(index, e.target.value)}
                    placeholder="Deliverable description"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDeliverable(index)}
                    disabled={draft.deliverables.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Textarea
              label="Notes"
              rows={3}
              value={draft.notes}
              onChange={(e) => updateDraft({ notes: e.target.value })}
            />
          </div>

          {draft.scheduleData.phases.length === 0 && (
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={handleAutoGenerate}>
                <Sparkles className="h-4 w-4" />
                Generate Schedule from Dates
              </Button>
            </div>
          )}
        </Card>

        {draft.scheduleData.phases.length > 0 && (
          <>
            <ScheduleTimeline
              startDate={draft.startDate}
              deliveryDate={draft.deliveryDate}
              phases={draft.scheduleData.phases}
              milestones={draft.scheduleData.milestones}
              onPhasesChange={(phases) =>
                updateDraft({
                  scheduleData: { ...draft.scheduleData, phases },
                })
              }
              onMilestonesChange={(milestones) =>
                updateDraft({
                  scheduleData: { ...draft.scheduleData, milestones },
                })
              }
            />

            <PhaseEditor
              phases={draft.scheduleData.phases}
              onChange={(phases) =>
                updateDraft({
                  scheduleData: { ...draft.scheduleData, phases },
                })
              }
            />

            <MilestoneEditor
              milestones={draft.scheduleData.milestones}
              onChange={(milestones) =>
                updateDraft({
                  scheduleData: { ...draft.scheduleData, milestones },
                })
              }
            />
          </>
        )}

        {mode === "edit" && scheduleId && versions.length > 0 && (
          <ScheduleVersionPanel
            scheduleId={scheduleId}
            versions={versions}
            currentVersion={currentVersion}
          />
        )}
      </div>
    </>
  );
}
