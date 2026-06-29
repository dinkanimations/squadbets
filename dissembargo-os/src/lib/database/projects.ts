import { createClient } from "@/lib/supabase/server";
import type {
  Project,
  ProjectInsert,
  ProjectStatus,
  ProjectUpdate,
} from "@/types/database";
import {
  getPaginationRange,
  handleDatabaseError,
  type PaginationOptions,
} from "./utils";

export async function getProjects(
  options?: PaginationOptions & { clientId?: string; status?: ProjectStatus },
) {
  const supabase = await createClient();
  const { from, to } = getPaginationRange(options ?? {});

  let query = supabase
    .from("projects")
    .select(
      `
      *,
      client:clients (
        *,
        company:companies (*)
      )
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (options?.clientId) {
    query = query.eq("client_id", options.clientId);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error, count } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch projects");

  return { data, count: count ?? 0 };
}

export async function getProjectById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      client:clients (
        *,
        company:companies (*)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch project ${id}`);

  return data;
}

export async function createProject(input: ProjectInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create project");

  return data as Project;
}

export async function updateProject(id: string, input: ProjectUpdate) {
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

export async function deleteProject(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete project ${id}`);

  return true;
}
