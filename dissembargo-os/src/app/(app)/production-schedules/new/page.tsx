import { ScheduleBuilder } from "@/components/production-schedules/ScheduleBuilder";
import { getSettingsAction } from "@/lib/settings/actions";
import { createEmptyScheduleDraftFromSettings } from "@/lib/production-schedules/constants";

export default async function NewSchedulePage() {
  const settings = await getSettingsAction();

  return (
    <ScheduleBuilder
      settings={settings}
      initialDraft={createEmptyScheduleDraftFromSettings(settings)}
      defaultPhaseNames={settings.defaultPhases}
      defaultPhaseWeights={settings.phaseWeights}
    />
  );
}
