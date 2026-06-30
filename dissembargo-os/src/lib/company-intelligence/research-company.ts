import { createOpenAIClient } from "@/lib/ai/client";
import {
  RESEARCH_MODEL,
  RESEARCH_PROMPT_VERSION,
  type CompanyResearchResult,
} from "./constants";
import { fetchWebsiteContent } from "./fetch-website";

interface ResearchCompanyInput {
  companyName: string;
  website: string | null;
  emailContext?: string | null;
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseResearchResponse(parsed: Record<string, unknown>): CompanyResearchResult {
  return {
    company_summary: String(parsed.company_summary ?? "").trim(),
    industry: String(parsed.industry ?? "").trim(),
    products: parseStringArray(parsed.products),
    services: parseStringArray(parsed.services),
    headquarters: String(parsed.headquarters ?? "").trim(),
    estimated_company_size: String(parsed.estimated_company_size ?? "").trim(),
    key_markets: parseStringArray(parsed.key_markets),
    target_customers: parseStringArray(parsed.target_customers),
    potential_creative_opportunities: parseStringArray(
      parsed.potential_creative_opportunities,
    ),
    suggested_services_we_could_offer: parseStringArray(
      parsed.suggested_services_we_could_offer,
    ),
    executive_summary: String(parsed.executive_summary ?? "").trim(),
  };
}

export async function researchCompany(
  input: ResearchCompanyInput,
): Promise<{ result: CompanyResearchResult; rawResponse: Record<string, unknown> }> {
  let websiteText = "";

  if (input.website) {
    const fetched = await fetchWebsiteContent(input.website);
    websiteText = fetched?.text ?? "";
  }

  const openai = createOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: RESEARCH_MODEL,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a business intelligence analyst for a creative agency called Dissembargo.
Research companies using the provided information and return structured JSON.
Focus on insights useful before a sales call.
The executive_summary must be readable in under 30 seconds (max 3 short paragraphs).
Suggested services should be creative agency offerings: branding, motion, web, campaigns, etc.`,
      },
      {
        role: "user",
        content: `Research this company and return JSON with these exact keys:
- company_summary: 2-4 sentence overview
- industry: primary industry
- products: array of main products
- services: array of services they offer
- headquarters: city/country or "Unknown"
- estimated_company_size: e.g. "1-10", "11-50", "51-200", "201-500", "500+"
- key_markets: array of geographic or sector markets
- target_customers: array of customer types they serve
- potential_creative_opportunities: array of creative project opportunities for our agency
- suggested_services_we_could_offer: array of Dissembargo services to pitch
- executive_summary: concise briefing for a pre-call review (under 30 seconds to read)

Company Name: ${input.companyName}
Website: ${input.website ?? "Unknown"}

Website Content:
${websiteText || "(No website content available — use general knowledge cautiously and note uncertainty)"}

Email Context:
${input.emailContext?.slice(0, 2000) || "(none)"}`,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty company research response.");
  }

  const parsed = JSON.parse(content) as Record<string, unknown>;
  const result = parseResearchResponse(parsed);

  return { result, rawResponse: parsed };
}

export { RESEARCH_MODEL, RESEARCH_PROMPT_VERSION };
