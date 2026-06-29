const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "me.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
]);

export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function extractDomainFromUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  try {
    const normalized = url.trim().startsWith("http")
      ? url.trim()
      : `https://${url.trim()}`;

    const hostname = new URL(normalized).hostname.toLowerCase();
    return hostname.replace(/^www\./, "");
  } catch {
    const cleaned = url
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0];

    return cleaned || null;
  }
}

export function normalizeWebsiteUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function extractWebsitesFromText(text: string): string[] {
  const urlPattern =
    /(?:https?:\/\/)?(?:www\.)?[a-z0-9][-a-z0-9]*(?:\.[a-z0-9][-a-z0-9]*)+\.[a-z]{2,}(?:\/[^\s]*)?/gi;

  const matches = text.match(urlPattern) ?? [];
  const domains = new Set<string>();

  for (const match of matches) {
    const domain = extractDomainFromUrl(match);
    if (domain && !PERSONAL_EMAIL_DOMAINS.has(domain)) {
      domains.add(normalizeWebsiteUrl(match.startsWith("http") ? match : `https://${match}`));
    }
  }

  return Array.from(domains);
}

export function domainFromEmail(email: string | null | undefined): string | null {
  if (!email?.includes("@")) return null;

  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain)) return null;

  return domain;
}

export function buildLogoUrl(domain: string | null): string | null {
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}
