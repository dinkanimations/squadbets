const EXTENSION_MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

const BRANDING_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".svg"] as const;

export function getFileExtension(filename: string): string {
  const index = filename.lastIndexOf(".");
  if (index === -1) return "";
  return filename.slice(index).toLowerCase();
}

export function resolveMimeType(file: File): string | null {
  if (file.type) return file.type;

  const extension = getFileExtension(file.name);
  return EXTENSION_MIME_MAP[extension] ?? null;
}

export function assertAllowedMimeType(
  file: File,
  allowedTypes: readonly string[],
): void {
  const mimeType = resolveMimeType(file);

  if (!mimeType) {
    throw new Error("Could not determine file type. Use a supported format.");
  }

  if (!allowedTypes.includes(mimeType)) {
    throw new Error("File type not allowed.");
  }
}

export function assertBrandingAsset(file: File, maxBytes: number): void {
  if (file.size > maxBytes) {
    throw new Error("Image exceeds maximum size of 5 MB.");
  }

  const extension = getFileExtension(file.name);
  const mimeType = resolveMimeType(file);

  const allowedMimes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml",
  ];

  if (
    mimeType &&
    !allowedMimes.includes(mimeType) &&
    !BRANDING_EXTENSIONS.includes(
      extension as (typeof BRANDING_EXTENSIONS)[number],
    )
  ) {
    throw new Error("Only PNG, JPG, WebP, or SVG images are allowed.");
  }

  if (
    !mimeType &&
    !BRANDING_EXTENSIONS.includes(
      extension as (typeof BRANDING_EXTENSIONS)[number],
    )
  ) {
    throw new Error("Only PNG, JPG, WebP, or SVG images are allowed.");
  }
}
