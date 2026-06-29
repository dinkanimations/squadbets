import type { ScheduleStatus } from "@/types/database";

export type SchedulesFilter = {
  search?: string;
  status?: ScheduleStatus;
};
