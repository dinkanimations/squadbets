import { createOpenAIClient } from "@/lib/ai/client";
import {
  WEBSITE_DETECTION_PROMPT_VERSION,
  type WebsiteDetectionResult,
} from "./constants";
import {
  domainFromEmail,
  extractDomainFromUrl,
  extractWebsitesFromText,
  normalizeWebsiteUrl,
} from "./normalize";

interface DetectWebsiteInput {
  companyName: string;
  emailBody?: string | null;
  detectedWebsite?: string | null;
  senderEmail?: string | null;
}

function dedupeWebsites(urls: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    const domain = extractDomainFromUrl(url);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    result.push(normalizeWebsiteUrl(url));
  }

  return result;
}

export async function detectCompanyWebsites(
  input: DetectWebsiteInput,
): Promise<WebsiteDetectionResult> {
  const fromEmail = input.detectedWebsite
    ? [normalizeWebsiteUrl(input.detectedWebsite)]
    : [];

  const fromBody = input.emailBody ? extractWebsitesFromText(input.emailBody) : [];

  const senderDomain = domainFromEmail(input.senderEmail);
  const fromSender = senderDomain
    ? [normalizeWebsiteUrl(`https://${senderDomain}`)]
    : [];

  const heuristic = dedupeWebsites([...fromEmail, ...fromBody, ...fromSender]);

  if (heuristic.length === 1) {
    return {
      websites: heuristic,
      confidence: 95,
      reasoning: "Website found in email content or sender domain.",
    };
  }

  if (heuristic.length > 1) {
    return {
      websites: heuristic,
      confidence: 80,
      reasoning: "Multiple websites detected in email content.",
    };
  }

  const openai = createOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You identify official company websites. Respond only with valid JSON.",
      },
      {
        role: "user",
        content: `Given the company name "${input.companyName}", return a JSON object with:
- websites: array of up to 3 likely official website URLs (full https URLs), ordered by confidence
- confidence: number 0-100 for your top pick
- reasoning: brief explanation

Only include real, plausible official websites. Return empty array if uncertain.`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    return { websites: [], confidence: 0, reasoning: "AI returned no response." };
  }

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const websites = Array.isArray(parsed.websites)
    ? parsed.websites
        .filter((w): w is string => typeof w === "string" && w.trim().length > 0)
        .map((w) => normalizeWebsiteUrl(w))
    : [];

  return {
    websites: dedupeWebsites(websites),
    confidence: Number(parsed.confidence) || 0,
    reasoning: String(parsed.reasoning ?? "AI website detection."),
  };
}

export { WEBSITE_DETECTION_PROMPT_VERSION };
