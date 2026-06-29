import { extractDomainFromUrl } from "./normalize";

const FETCH_TIMEOUT_MS = 8000;
const MAX_CONTENT_LENGTH = 12000;

export async function fetchWebsiteContent(
  websiteUrl: string,
): Promise<{ domain: string; text: string } | null> {
  const domain = extractDomainFromUrl(websiteUrl);
  if (!domain) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(normalizeFetchUrl(websiteUrl), {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "DissembargoOS/1.0 (Company Intelligence; +https://dissembargo.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!response.ok) return { domain, text: "" };

    const html = await response.text();
    const text = stripHtml(html).slice(0, MAX_CONTENT_LENGTH);

    return { domain, text };
  } catch {
    return { domain, text: "" };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeFetchUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
