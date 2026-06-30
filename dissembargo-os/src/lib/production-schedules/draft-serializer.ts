import type { ScheduleFormDraft } from "./constants";

export function serializeScheduleDraft(draft: ScheduleFormDraft): string {
  return JSON.stringify(draft);
}
