import { createClient } from "@/lib/supabase/server";
import type {
  Contact,
  ContactInsert,
  ContactUpdate,
} from "@/types/database";
import { handleDatabaseError } from "./utils";

export async function getContactsByCompanyId(companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("company_id", companyId)
    .order("full_name", { ascending: true });

  if (error) {
    handleDatabaseError(error, `Failed to fetch contacts for company ${companyId}`);
  }

  return data as Contact[];
}

export async function getContactById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) handleDatabaseError(error, `Failed to fetch contact ${id}`);

  return data as Contact;
}

export async function createContact(input: ContactInsert) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .insert(input)
    .select()
    .single();

  if (error) handleDatabaseError(error, "Failed to create contact");

  return data as Contact;
}

export async function updateContact(id: string, input: ContactUpdate) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) handleDatabaseError(error, `Failed to update contact ${id}`);

  return data as Contact;
}

export async function deleteContact(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) handleDatabaseError(error, `Failed to delete contact ${id}`);

  return true;
}
