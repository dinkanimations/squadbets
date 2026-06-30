import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Project,
  ProjectDeliverable,
  ProjectFile,
  ProjectInsert,
  ProjectNote,
  ProjectStatus,
  ProjectUpdate,
} from "@/types/database";
import type { ProjectsFilter } from "@/lib/projects/types";
import { calculateProgressFromDeliverables } from "@/lib/projects/utils";
import {
  getPaginationRange,
  handleDatabaseError,
  withDevDbFallback,
  type PaginationOptions,
} from "./utils";

export type ProjectWithRelations = Project & {
  client: {
    id: string;
    company: { id: string; company_name: string } | null;
  } | null;
  company: { id: string; company_name: string } | null;
  contact: { id: string; full_name: string | null } | null;
  opportunity: { id: string; subject: string | null } | null;
  quote: { id: string; quote_number: string; total: number } | null;
};

export type ProjectFull = ProjectWithRelations & {
  deliverables: ProjectDeliverable[];
  projectNotes: ProjectNote[];
  files: ProjectFile[];
  schedule: {
    id: string;
    project_title: string;
    status: string;
    delivery_date: string | null;
    current_version: number;
  } | null;
};

export async function getProjectsFiltered(
  filters: ProjectsFilter = {},
  options?: PaginationOptions,
) {
  return withDevDbFallback(async () => {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? { pageSize: 50 });

  let query = supabase
    .from("projects")
    .select(
      `
      *,
      client:clients (
        id,
        company:companies (id, company_name)
      ),
      company:companies (id, company_name),
      contact:contacts (id, full_name),
      opportunity:opportunities (id, subject),
      quote:quotes (id, quote_number, total)
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
    query = query.ilike("project_name", term);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch projects");

  return { data: data as ProjectWithRelations[], count: count ?? 0 };
  }, { data: [], count: 0 });
}

export async function getProjectFullById(id: string): Promise<ProjectFull> {
  const supabase = await createClient();

  const [
    { data: project, error },
    { data: deliverables },
    { data: notes },
    { data: files },
    { data: schedules },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select(
        `
        *,
        client:clients (
          id,
          company:companies (id, company_name)
        ),
        company:companies (id, company_name),
        contact:contacts (id, full_name),
        opportunity:opportunities (id, subject),
        quote:quotes (id, quote_number, total)
      `,
      )
      .eq("id", id)
      .single(),
    supabase
      .from("project_deliverables")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_notes")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("project_files")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("production_schedules")
      .select("id, project_title, status, delivery_date, current_version")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (error) handleDatabaseError(error, `Failed to fetch project ${id}`);

  return {
    ...(project as ProjectWithRelations),
    deliverables: (deliverables ?? []) as ProjectDeliverable[],
    projectNotes: (notes ?? []) as ProjectNote[],
    files: (files ?? []) as ProjectFile[],
    schedule: schedules?.[0] ?? null,
  };
}

export async function createProjectRecord(input: ProjectInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create project");

  return data as Project;
}

export async function updateProjectRecord(id: string, input: ProjectUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update project ${id}`);

  return data as Project;
}

export async function archiveProject(id: string) {
  return updateProjectRecord(id, { status: "archived" as ProjectStatus });
}

export async function countProjectsByStatus(
  status: ProjectStatus | ProjectStatus[],
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("id", { count: "exact", head: true });

  if (Array.isArray(status)) {
    query = query.in("status", status);
  } else {
    query = query.eq("status", status);
  }

  const { count, error } = await query;

  if (error) handleDatabaseError(error, "Failed to count projects");

  return count ?? 0;
}

export async function getProjectsDueThisWeek(limit = 5) {
  const supabase = await createClient();
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayStr = today.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, project_name, delivery_date, status, priority, company:companies(company_name)",
    )
    .not("status", "in", '("complete","archived")')
    .gte("delivery_date", todayStr)
    .lte("delivery_date", weekEndStr)
    .order("delivery_date", { ascending: true })
    .limit(limit);

  if (error) handleDatabaseError(error, "Failed to fetch projects due this week");

  return (data ?? []).map((row) => ({
    id: row.id,
    projectName: row.project_name,
    deliveryDate: row.delivery_date as string,
    status: row.status as string,
    priority: row.priority as string,
    companyName:
      (row.company as { company_name: string } | null)?.company_name ?? "—",
  }));
}

export async function getProjectsWaitingForFeedback(limit = 5) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, project_name, delivery_date, status, company:companies(company_name)",
    )
    .eq("status", "waiting_for_client")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    handleDatabaseError(error, "Failed to fetch projects waiting for feedback");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    projectName: row.project_name,
    deliveryDate: row.delivery_date as string | null,
    companyName:
      (row.company as { company_name: string } | null)?.company_name ?? "—",
  }));
}

export async function syncProjectProgress(projectId: string) {
  const supabase = await createClient();

  const { data: deliverables } = await supabase
    .from("project_deliverables")
    .select("is_complete")
    .eq("project_id", projectId);

  const progress = calculateProgressFromDeliverables(deliverables ?? []);

  await supabase
    .from("projects")
    .update({ progress })
    .eq("id", projectId);

  return progress;
}

export async function saveProjectDeliverables(
  projectId: string,
  items: Array<{
    id?: string;
    title: string;
    description: string | null;
    is_complete: boolean;
    sort_order: number;
  }>,
) {
  const admin = createAdminClient();

  await admin
    .from("project_deliverables")
    .delete()
    .eq("project_id", projectId);

  if (items.length === 0) {
    await syncProjectProgress(projectId);
    return;
  }

  const { error } = await admin.from("project_deliverables").insert(
    items.map((item) => ({
      project_id: projectId,
      title: item.title,
      description: item.description,
      is_complete: item.is_complete,
      sort_order: item.sort_order,
    })),
  );

  if (error) {
    throw new Error(`Failed to save deliverables: ${error.message}`);
  }

  await syncProjectProgress(projectId);
}

export async function createProjectNote(projectId: string, content: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_notes")
    .insert({ project_id: projectId, content })
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create note");

  return data as ProjectNote;
}

export async function updateProjectNote(noteId: string, content: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_notes")
    .update({ content })
    .eq("id", noteId)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to update note");

  return data as ProjectNote;
}

export async function deleteProjectNote(noteId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_notes")
    .delete()
    .eq("id", noteId);

  if (error) handleDatabaseError(error, "Failed to delete note");

  return true;
}

export async function createProjectFileRecord(input: {
  project_id: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_files")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to save file record");

  return data as ProjectFile;
}

export async function deleteProjectFileRecord(fileId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (error) handleDatabaseError(error, "Failed to fetch file");

  const { error: deleteError } = await supabase
    .from("project_files")
    .delete()
    .eq("id", fileId);

  if (deleteError) handleDatabaseError(deleteError, "Failed to delete file record");

  return data?.storage_path ?? null;
}
