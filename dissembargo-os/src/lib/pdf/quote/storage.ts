import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { QuotePdfVersion } from "@/types/database";
import { handleDatabaseError } from "@/lib/database/utils";

const PDF_BUCKET = "documents" as const;

export function buildQuotePdfStoragePath(
  quoteId: string,
  version: number,
  quoteNumber: string,
): string {
  const safeName = quoteNumber.replace(/[^a-zA-Z0-9-_]/g, "_");
  return `quotes/${quoteId}/v${version}/${safeName}.pdf`;
}

export async function getNextPdfVersion(quoteId: string): Promise<number> {
  const admin = createAdminClient();

  const { data } = await admin
    .from("quote_pdf_versions")
    .select("version")
    .eq("quote_id", quoteId)
    .order("version", { ascending: false })
    .limit(1);

  return (data?.[0]?.version ?? 0) + 1;
}

export async function uploadQuotePdf(
  quoteId: string,
  quoteNumber: string,
  buffer: Buffer,
): Promise<QuotePdfVersion> {
  const admin = createAdminClient();
  const version = await getNextPdfVersion(quoteId);
  const storagePath = buildQuotePdfStoragePath(quoteId, version, quoteNumber);

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
    .from("quote_pdf_versions")
    .insert({
      quote_id: quoteId,
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
    .from("quotes")
    .update({ current_pdf_version_id: versionRow.id })
    .eq("id", quoteId);

  return versionRow as QuotePdfVersion;
}

export async function getQuotePdfVersions(
  quoteId: string,
): Promise<QuotePdfVersion[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_pdf_versions")
    .select("*")
    .eq("quote_id", quoteId)
    .order("version", { ascending: false });

  if (error) handleDatabaseError(error, "Failed to fetch PDF versions");

  return (data ?? []) as QuotePdfVersion[];
}

export async function getQuotePdfVersionById(
  versionId: string,
): Promise<QuotePdfVersion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quote_pdf_versions")
    .select("*")
    .eq("id", versionId)
    .maybeSingle();

  if (error) handleDatabaseError(error, "Failed to fetch PDF version");

  return data as QuotePdfVersion | null;
}

export async function downloadQuotePdfFromStorage(
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

export async function getSignedPdfUrl(
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
