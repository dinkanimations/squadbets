import type { ProjectStatus } from "@/types/database";

export type ProjectsFilter = {
  search?: string;
  status?: ProjectStatus;
  pageSize?: number;
};
