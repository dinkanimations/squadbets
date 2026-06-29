"use server";

import { revalidatePath } from "next/cache";
import {
  getSchedulePdfVersions,
  getSignedSchedulePdfUrl,
  uploadSchedulePdf,
} from "@/lib/pdf/schedule/storage";
import { generateSchedulePdfBuffer } from "@/lib/pdf/schedule/generate";

export type SchedulePdfActionState = {
  error?: string;
  success?: string;
  versionId?: string;
  version?: number;
};

export async function regenerateSchedulePdfAction(
  scheduleId: string,
): Promise<SchedulePdfActionState> {
  try {
    const result = await generateSchedulePdfBuffer(scheduleId);
    const version = await uploadSchedulePdf(
      scheduleId,
      result.projectTitle,
      result.buffer,
    );

    revalidatePath(`/production-schedules/${scheduleId}`);

    return {
      success: `PDF version ${version.version} generated.`,
      versionId: version.id,
      version: version.version,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to regenerate PDF.",
    };
  }
}

export async function getSchedulePdfVersionsAction(scheduleId: string) {
  const versions = await getSchedulePdfVersions(scheduleId);

  const withUrls = await Promise.all(
    versions.map(async (version) => ({
      ...version,
      downloadUrl: `/api/production-schedules/${scheduleId}/pdf?version=${version.id}&download=1`,
      previewUrl: `/api/production-schedules/${scheduleId}/pdf?version=${version.id}`,
    })),
  );

  return withUrls;
}

export async function getSignedSchedulePdfUrlAction(storagePath: string) {
  return getSignedSchedulePdfUrl(storagePath);
}
