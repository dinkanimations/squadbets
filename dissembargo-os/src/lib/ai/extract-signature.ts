const SIGNATURE_MARKERS = [
  /^--\s*$/m,
  /^best regards,?$/im,
  /^kind regards,?$/im,
  /^regards,?$/im,
  /^thanks,?$/im,
  /^thank you,?$/im,
  /^cheers,?$/im,
  /^sent from my/im,
];

export function extractEmailSignature(body: string | null): string | null {
  if (!body?.trim()) return null;

  const lines = body.split(/\r?\n/);
  let signatureStart = -1;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]?.trim() ?? "";

    if (!line) continue;

    if (SIGNATURE_MARKERS.some((marker) => marker.test(line))) {
      signatureStart = index;
      break;
    }

    if (line.includes("@") && line.length < 120) {
      signatureStart = Math.max(0, index - 2);
      break;
    }
  }

  if (signatureStart === -1) {
    const tail = lines.slice(-4).join("\n").trim();
    return tail.length > 0 ? tail : null;
  }

  const signature = lines.slice(signatureStart).join("\n").trim();
  return signature.length > 0 ? signature : null;
}

export function getEmailBodyForAnalysis(
  bodyPlain: string | null,
  bodyHtml: string | null,
): string {
  if (bodyPlain?.trim()) {
    return bodyPlain.trim();
  }

  if (bodyHtml?.trim()) {
    return bodyHtml
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return "";
}
