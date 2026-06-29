import { notFound } from "next/navigation";
import { ScheduleBuilder } from "@/components/production-schedules/ScheduleBuilder";
import {
  getCompaniesForScheduleAction,
  getOpportunitiesForScheduleAction,
  getQuotesForScheduleAction,
} from "@/lib/production-schedules/actions";
import { getScheduleFullById } from "@/lib/database/production-schedules";
import { scheduleToFormDraft } from "@/lib/production-schedules/utils";
import { getSettingsAction } from "@/lib/settings/actions";

interface ScheduleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ScheduleDetailPage({
  params,
}: ScheduleDetailPageProps) {
  const { id } = await params;

  let schedule;
  let companies;

  try {
    [schedule, companies] = await Promise.all([
      getScheduleFullById(id),
      getCompaniesForScheduleAction(),
    ]);
  } catch {
    notFound();
  }

  if (!schedule) {
    notFound();
  }

  let opportunities: Awaited<ReturnType<typeof getOpportunitiesForScheduleAction>> = [];
  let quotes: Awaited<ReturnType<typeof getQuotesForScheduleAction>> = [];

  if (schedule.company_id) {
    [opportunities, quotes] = await Promise.all([
      getOpportunitiesForScheduleAction(schedule.company_id),
      getQuotesForScheduleAction(schedule.company_id),
    ]);
  }

  const formDraft = scheduleToFormDraft(schedule);
  const settings = await getSettingsAction();

  return (
    <ScheduleBuilder
      mode="edit"
      scheduleId={id}
      createdAt={schedule.created_at}
      currentVersion={schedule.current_version}
      versions={schedule.versions}
      initialDraft={formDraft}
      defaultPhaseNames={settings.defaultPhases}
      defaultPhaseWeights={settings.phaseWeights}
      companies={companies}
      initialOpportunities={opportunities}
      initialQuotes={quotes}
    />
  );
}
