import { createClient } from "@/lib/supabase/server";
import type {
  TeamMember,
  TeamMemberInsert,
  TeamMemberStatus,
  TeamMemberUpdate,
  UserRole,
} from "@/types/database";
import { handleDatabaseError } from "./utils";

export async function getTeamMembers(options?: {
  status?: TeamMemberStatus;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("team_members")
    .select("*")
    .order("name", { ascending: true });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch team members");

  return (data ?? []) as TeamMember[];
}

export async function getTeamMemberById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .select("*")
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch team member ${id}`);

  return data as TeamMember;
}

export async function createTeamMember(input: TeamMemberInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create team member");

  return data as TeamMember;
}

export async function updateTeamMember(id: string, input: TeamMemberUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_members")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update team member ${id}`);

  return data as TeamMember;
}

export async function deleteTeamMember(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("team_members").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete team member ${id}`);

  return true;
}

export async function getActiveTeamMembersByRole(role?: UserRole) {
  const supabase = await createClient();

  let query = supabase
    .from("team_members")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;

  if (error) handleDatabaseError(error, "Failed to fetch team members by role");

  return (data ?? []) as TeamMember[];
}
