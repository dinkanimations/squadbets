import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ProductionSchedule,
  ProductionScheduleInsert,
  ProductionScheduleUpdate,
  ProductionScheduleVersion,
  ScheduleStatus,
} from "@/types/database";
import type { SchedulesFilter } from "@/lib/production-schedules/types";
import { parseScheduleData } from "@/lib/production-schedules/calculations";
import type { ScheduleData } from "@/lib/production-schedules/constants";
import {
  getPaginationRange,
  handleDatabaseError,
  type PaginationOptions,
} from "./utils";

export type ScheduleWithRelations = ProductionSchedule & {
  company: { id: string; company_name: string } | null;
  opportunity: { id: string; subject: string | null } | null;
  quote: { id: string; quote_number: string } | null;
  project: { id: string; project_name: string } | null;
};

export type ScheduleFull = ScheduleWithRelations & {
  versions: ProductionScheduleVersion[];
};

export async function getSchedulesFiltered(
  filters: SchedulesFilter = {},
  options?: PaginationOptions,
) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? { pageSize: 50 });

  let query = supabase
    .from("production_schedules")
    .select(
      `
      *,
      company:companies (id, company_name),
      opportunity:opportunities (id, subject),
      quote:quotes (id, quote_number),
      project:projects (id, project_name)
    `,
      { count: "exact" },
    )
    .neq("status", "archived")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.search?.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.ilike("project_title", term);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch schedules");

  return { data: data as ScheduleWithRelations[], count: count ?? 0 };
}

export async function getScheduleFullById(id: string): Promise<ScheduleFull> {
  const supabase = await createClient();

  const [{ data: schedule, error }, { data: versions }] = await Promise.all([
    supabase
      .from("production_schedules")
      .select(
        `
        *,
        company:companies (id, company_name),
        opportunity:opportunities (id, subject),
        quote:quotes (id, quote_number),
        project:projects (id, project_name)
      `,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("production_schedule_versions")
      .select("*")
      .eq("schedule_id", id)
      .order("version", { ascending: false }),
  ]);

  if (error) handleDatabaseError(error, `Failed to fetch schedule ${id}`);

  return {
    ...(schedule as ScheduleWithRelations),
    versions: (versions ?? []) as ProductionScheduleVersion[],
  };
}

export async function createScheduleRecord(input: ProductionScheduleInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create schedule");

  return data as ProductionSchedule;
}

export async function updateScheduleRecord(
  id: string,
  input: ProductionScheduleUpdate,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update schedule ${id}`);

  return data as ProductionSchedule;
}

export async function saveScheduleVersion(
  scheduleId: string,
  version: number,
  scheduleData: ScheduleData,
  changeNote?: string,
) {
  const admin = createAdminClient();

  const { error } = await admin.from("production_schedule_versions").insert({
    schedule_id: scheduleId,
    version,
    schedule_json: scheduleData as unknown as ProductionScheduleInsert["schedule_json"],
    change_note: changeNote ?? null,
  });

  if (error) {
    throw new Error(`Failed to save schedule version: ${error.message}`);
  }
}

export async function countSchedulesInProduction(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("production_schedules")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) handleDatabaseError(error, "Failed to count schedules");

  return count ?? 0;
}

export async function getUpcomingMilestones(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .select("id, project_title, schedule_json, delivery_date")
    .eq("status", "active")
    .order("delivery_date", { ascending: true });

  if (error) handleDatabaseError(error, "Failed to fetch milestones");

  const today = new Date().toISOString().split("T")[0];
  const items: Array<{
    scheduleId: string;
    projectTitle: string;
    milestoneLabel: string;
    milestoneType: string;
    date: string;
  }> = [];

  for (const schedule of data ?? []) {
    const scheduleData = parseScheduleData(schedule.schedule_json);
    for (const milestone of scheduleData.milestones) {
      if (milestone.date >= today) {
        items.push({
          scheduleId: schedule.id,
          projectTitle: schedule.project_title,
          milestoneLabel: milestone.label,
          milestoneType: milestone.type,
          date: milestone.date,
        });
      }
    }
  }

  return items
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export async function getDeliveryDeadlines(limit = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("production_schedules")
    .select("id, project_title, delivery_date, company:companies(company_name)")
    .eq("status", "active")
    .gte("delivery_date", today)
    .order("delivery_date", { ascending: true })
    .limit(limit);

  if (error) handleDatabaseError(error, "Failed to fetch delivery deadlines");

  return (data ?? []).map((row) => ({
    id: row.id,
    projectTitle: row.project_title,
    deliveryDate: row.delivery_date as string,
    companyName:
      (row.company as { company_name: string } | null)?.company_name ?? "—",
  }));
}

export async function getProductionSchedulesByProjectId(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    handleDatabaseError(
      error,
      `Failed to fetch production schedules for project ${projectId}`,
    );
  }

  return data as ProductionSchedule[];
}

export async function getLatestProductionSchedule(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    handleDatabaseError(
      error,
      `Failed to fetch latest production schedule for project ${projectId}`,
    );
  }

  return data as ProductionSchedule | null;
}

export async function createProductionSchedule(
  input: ProductionScheduleInsert,
) {
  return createScheduleRecord(input);
}

export async function updateProductionSchedule(
  id: string,
  input: ProductionScheduleUpdate,
) {
  return updateScheduleRecord(id, input);
}

export async function deleteProductionSchedule(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("production_schedules")
    .delete()
    .eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete schedule ${id}`);

  return true;
}

export async function archiveSchedule(id: string) {
  return updateScheduleRecord(id, { status: "archived" as ScheduleStatus });
}
