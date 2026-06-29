import type { ScheduleFull } from "@/lib/database/production-schedules";
import { parseScheduleData } from "./calculations";
import type { ScheduleFormDraft } from "./constants";

export function scheduleToFormDraft(schedule: ScheduleFull): ScheduleFormDraft {
  return {
    companyId: schedule.company_id ?? "",
    opportunityId: schedule.opportunity_id ?? "",
    quoteId: schedule.quote_id ?? "",
    projectId: schedule.project_id ?? "",
    projectTitle: schedule.project_title,
    startDate: schedule.start_date ?? "",
    deliveryDate: schedule.delivery_date ?? "",
    reviewRounds: schedule.review_rounds,
    deliverables: schedule.deliverables?.length ? schedule.deliverables : [""],
    notes: schedule.notes ?? "",
    status: schedule.status,
    scheduleData: parseScheduleData(schedule.schedule_json),
  };
}
