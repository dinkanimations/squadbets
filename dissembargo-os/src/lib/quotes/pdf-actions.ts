"use server";

import { revalidatePath } from "next/cache";
import {
  getQuotePdfVersions,
  getSignedPdfUrl,
  uploadQuotePdf,
} from "@/lib/pdf/quote/storage";
import { generateQuotePdfBuffer } from "@/lib/pdf/quote/generate";

export type QuotePdfActionState = {
  error?: string;
  success?: string;
  versionId?: string;
  version?: number;
};

export async function regenerateQuotePdfAction(
  quoteId: string,
): Promise<QuotePdfActionState> {
  try {
    const result = await generateQuotePdfBuffer(quoteId);
    const version = await uploadQuotePdf(
      quoteId,
      result.quoteNumber,
      result.buffer,
    );

    revalidatePath(`/quotes/${quoteId}`);

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

export async function getQuotePdfVersionsAction(quoteId: string) {
  const versions = await getQuotePdfVersions(quoteId);

  const withUrls = await Promise.all(
    versions.map(async (version) => ({
      ...version,
      downloadUrl: `/api/quotes/${quoteId}/pdf?version=${version.id}&download=1`,
      previewUrl: `/api/quotes/${quoteId}/pdf?version=${version.id}`,
    })),
  );

  return withUrls;
}

export async function getSignedPdfUrlAction(storagePath: string) {
  return getSignedPdfUrl(storagePath);
}
