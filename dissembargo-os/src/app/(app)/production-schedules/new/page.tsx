import { ScheduleBuilder } from "@/components/production-schedules/ScheduleBuilder";
import { getCompaniesForScheduleAction } from "@/lib/production-schedules/actions";
import { getSettingsAction } from "@/lib/settings/actions";
import { createEmptyScheduleDraftFromSettings } from "@/lib/production-schedules/constants";

export default async function NewSchedulePage() {
  const [companies, settings] = await Promise.all([
    getCompaniesForScheduleAction(),
    getSettingsAction(),
  ]);

  return (
    <ScheduleBuilder
      mode="create"
      companies={companies}
      initialDraft={createEmptyScheduleDraftFromSettings(settings)}
      defaultPhaseNames={settings.defaultPhases}
      defaultPhaseWeights={settings.phaseWeights}
    />
  );
}
