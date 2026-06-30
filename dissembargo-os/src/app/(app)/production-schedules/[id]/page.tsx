import { notFound } from "next/navigation";
import { ScheduleBuilder } from "@/components/production-schedules/ScheduleBuilder";
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

  try {
    schedule = await getScheduleFullById(id);
  } catch {
    notFound();
  }

  if (!schedule) {
    notFound();
  }

  const formDraft = scheduleToFormDraft(schedule);
  const settings = await getSettingsAction();

  return (
    <ScheduleBuilder
      scheduleId={id}
      createdAt={schedule.created_at}
      currentVersion={schedule.current_version}
      initialDraft={formDraft}
      settings={settings}
      defaultPhaseNames={settings.defaultPhases}
      defaultPhaseWeights={settings.phaseWeights}
    />
  );
}
