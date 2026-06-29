import { createClient } from "@/lib/supabase/server";
import type {
  ProductionSchedule,
  ProductionScheduleInsert,
  ProductionScheduleUpdate,
} from "@/types/database";
import { handleDatabaseError } from "./utils";

export async function getProductionSchedulesByProjectId(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false });

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
    .order("version", { ascending: false })
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
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedules")
    .insert(input)
    .select()
    .single();

  if (error) {
    handleDatabaseError(error, "Failed to create production schedule");
  }

  return data as ProductionSchedule;
}

export async function updateProductionSchedule(
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

  if (error) {
    handleDatabaseError(error, `Failed to update production schedule ${id}`);
  }

  return data as ProductionSchedule;
}

export async function deleteProductionSchedule(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("production_schedules")
    .delete()
    .eq("id", id);

  if (error) {
    handleDatabaseError(error, `Failed to delete production schedule ${id}`);
  }

  return true;
}
