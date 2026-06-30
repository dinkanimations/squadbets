import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ProductionSchedulePdfVersion } from "@/types/database";
import { handleDatabaseError } from "@/lib/database/utils";

const PDF_BUCKET = "documents" as const;

export function buildSchedulePdfStoragePath(
  scheduleId: string,
  version: number,
  projectTitle: string,
): string {
  const safeName = projectTitle.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 80);
  return `production-schedules/${scheduleId}/v${version}/${safeName}.pdf`;
}

export async function getNextSchedulePdfVersion(
  scheduleId: string,
): Promise<number> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("production_schedule_pdf_versions")
    .select("version")
    .eq("schedule_id", scheduleId)
    .order("version", { ascending: false })
    .limit(1);

  return (data?.[0]?.version ?? 0) + 1;
}

export async function uploadSchedulePdf(
  scheduleId: string,
  projectTitle: string,
  buffer: Buffer,
): Promise<ProductionSchedulePdfVersion> {
  const admin = createAdminClient();
  const version = await getNextSchedulePdfVersion(scheduleId);
  const storagePath = buildSchedulePdfStoragePath(
    scheduleId,
    version,
    projectTitle,
  );

  const { error: uploadError } = await admin.storage
    .from(PDF_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Failed to upload PDF: ${uploadError.message}`);
  }

  const { data: versionRow, error: insertError } = await admin
    .from("production_schedule_pdf_versions")
    .insert({
      schedule_id: scheduleId,
      version,
      storage_path: storagePath,
      file_size: buffer.length,
    })
    .select()
    .single();

  if (insertError || !versionRow) {
    throw new Error(`Failed to save PDF version: ${insertError?.message}`);
  }

  await admin
    .from("production_schedules")
    .update({ current_pdf_version_id: versionRow.id })
    .eq("id", scheduleId);

  return versionRow as ProductionSchedulePdfVersion;
}

export async function getSchedulePdfVersions(
  scheduleId: string,
): Promise<ProductionSchedulePdfVersion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedule_pdf_versions")
    .select("*")
    .eq("schedule_id", scheduleId)
    .order("version", { ascending: false });

  if (error) handleDatabaseError(error, "Failed to fetch PDF versions");

  return (data ?? []) as ProductionSchedulePdfVersion[];
}

export async function getSchedulePdfVersionById(
  versionId: string,
): Promise<ProductionSchedulePdfVersion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("production_schedule_pdf_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error) handleDatabaseError(error, "Failed to fetch PDF version");

  return data as ProductionSchedulePdfVersion | null;
}

export async function downloadSchedulePdfFromStorage(
  storagePath: string,
): Promise<Buffer> {
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from(PDF_BUCKET)
    .download(storagePath);

  if (error || !data) {
    throw new Error(`Failed to download PDF: ${error?.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
}

export async function getSignedSchedulePdfUrl(
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(PDF_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}
