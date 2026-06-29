import { createClient } from "@/lib/supabase/server";
import type { StorageBucket } from "@/types/database";

export async function uploadFile(
  bucket: StorageBucket,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; contentType?: string },
) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType,
    });

  if (error) {
    throw new Error(`Failed to upload file to ${bucket}/${path}: ${error.message}`);
  }

  return data;
}

export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresInSeconds = 3600,
) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(
      `Failed to create signed URL for ${bucket}/${path}: ${error.message}`,
    );
  }

  return data.signedUrl;
}

export async function deleteFile(bucket: StorageBucket, path: string) {
  const supabase = await createClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Failed to delete file ${bucket}/${path}: ${error.message}`);
  }

  return true;
}

export async function listFiles(
  bucket: StorageBucket,
  path: string,
  options?: { limit?: number; offset?: number },
) {
  const supabase = await createClient();

  const { data, error } = await supabase.storage.from(bucket).list(path, {
    limit: options?.limit ?? 100,
    offset: options?.offset ?? 0,
    sortBy: { column: "created_at", order: "desc" },
  });

  if (error) {
    throw new Error(`Failed to list files in ${bucket}/${path}: ${error.message}`);
  }

  return data;
}
