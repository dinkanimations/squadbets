"use client";

import type { SchedulePdfData } from "@/lib/pdf/schedule/types";
import { formatScheduleDate } from "@/lib/production-schedules/calculations";

interface ScheduleLivePreviewProps {
  data: SchedulePdfData;
}

export function ScheduleLivePreview({ data }: ScheduleLivePreviewProps) {
  const { brand } = data;

  return (
    <div className="sticky top-4 flex h-[calc(100vh-7rem)] flex-col rounded-xl border border-border bg-[#f4f4f5] shadow-sm">
      <div className="border-b border-border bg-card px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Live PDF Preview</h2>
        <p className="text-xs text-muted">Updates instantly as you edit</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <article
          className="mx-auto min-h-full w-full max-w-[420px] bg-white p-5 text-[10px] leading-relaxed text-zinc-800 shadow-lg"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          <div
            className="mb-3 h-1 rounded"
            style={{ backgroundColor: brand.colors.accent }}
          />

          <header className="mb-4 flex items-start justify-between gap-3 border-b border-zinc-200 pb-3">
            <div>
              <p
                className="text-sm font-bold"
                style={{ color: brand.colors.primary }}
              >
                {data.agencyName}
              </p>
              <p className="text-[9px] text-zinc-500">{data.tagline}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase tracking-wide text-zinc-400">
                Production Schedule
              </p>
              <p className="text-xs font-bold text-zinc-800">{data.projectTitle}</p>
              <p
                className="mt-1 inline-block rounded px-1.5 py-0.5 text-[8px] font-medium text-white"
                style={{ backgroundColor: brand.colors.accent }}
              >
                Version {data.versionNumber}
              </p>
            </div>
          </header>

          <div className="mb-4 grid grid-cols-2 gap-2 text-[9px]">
            <PreviewMeta label="Client" value={data.clientName} />
            <PreviewMeta label="Created" value={data.createdDate} />
            <PreviewMeta label="Start" value={data.startDate} />
            <PreviewMeta label="Delivery" value={data.deliveryDate} />
          </div>

          <section className="mb-4 grid grid-cols-3 gap-2">
            {[
              [data.deliverables.length, "Deliverables"],
              [data.reviewRounds, "Review Rounds"],
              [data.totalDurationDays, "Production Days"],
            ].map(([value, label]) => (
              <div
                key={String(label)}
                className="rounded border border-zinc-200 bg-zinc-50 p-2 text-center"
              >
                <p className="text-sm font-bold text-zinc-800">{value}</p>
                <p className="text-[8px] text-zinc-500">{label}</p>
              </div>
            ))}
          </section>

          {data.deliverables.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-1 text-[9px] font-bold uppercase text-zinc-600">
                Deliverables
              </h3>
              <ul className="list-disc space-y-0.5 pl-4 text-[9px] text-zinc-700">
                {data.deliverables.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}

          {data.weeks.length > 0 && data.phases.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 text-[9px] font-bold uppercase text-zinc-600">
                Production Timeline
              </h3>

              <div className="mb-1 flex border-b border-zinc-200">
                {data.weeks.map((week) => (
                  <div
                    key={`${week.startDate}-${week.endDate}`}
                    className="border-r border-zinc-200 px-1 py-1 text-center"
                    style={{ width: `${week.widthPercent}%` }}
                  >
                    <p className="text-[8px] font-semibold">{week.label}</p>
                    <p className="text-[7px] text-zinc-400">{week.dateLabel}</p>
                  </div>
                ))}
              </div>

              {data.phases.map((phase) => (
                <div key={phase.id} className="mb-1 flex items-center gap-1">
                  <p className="w-16 shrink-0 truncate text-[8px] font-medium text-zinc-700">
                    {phase.name}
                  </p>
                  <div className="relative h-4 flex-1 rounded bg-zinc-100">
                    <div
                      className="absolute top-0 h-4 rounded text-[7px] font-medium leading-4 text-white"
                      style={{
                        left: `${phase.leftPercent}%`,
                        width: `${Math.max(phase.widthPercent, 3)}%`,
                        backgroundColor: phase.color,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="relative mt-2 h-5 rounded bg-zinc-50">
                {data.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="absolute top-1 h-3 w-3 -translate-x-1/2 rotate-45 border border-white shadow-sm"
                    style={{
                      left: `${milestone.leftPercent}%`,
                      backgroundColor: milestone.color,
                    }}
                    title={milestone.label}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {data.milestones.map((milestone) => (
                  <div
                    key={`legend-${milestone.id}`}
                    className="flex items-center gap-1 text-[7px] text-zinc-500"
                  >
                    <span
                      className="inline-block h-2 w-2 rotate-45"
                      style={{ backgroundColor: milestone.color }}
                    />
                    {milestone.label}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.notes ? (
            <section className="rounded border border-zinc-200 bg-zinc-50 p-2">
              <h3 className="mb-1 text-[8px] font-bold uppercase text-zinc-600">
                Notes
              </h3>
              <p className="whitespace-pre-wrap text-[9px] text-zinc-600">
                {data.notes}
              </p>
            </section>
          ) : null}
        </article>
      </div>
    </div>
  );
}

function PreviewMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="font-medium text-zinc-800">{value}</p>
    </div>
  );
}
