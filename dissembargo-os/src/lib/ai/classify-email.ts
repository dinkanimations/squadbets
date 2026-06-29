import {
  AI_EMAIL_CATEGORIES,
  OPENAI_MODEL,
  PROMPT_VERSION,
  type AiClassificationResult,
  type AiEmailCategory,
} from "./constants";
import { createOpenAIClient } from "./client";
import {
  extractEmailSignature,
  getEmailBodyForAnalysis,
} from "./extract-signature";

interface ClassifyEmailInput {
  subject: string | null;
  senderName: string | null;
  senderEmail: string | null;
  bodyPlain: string | null;
  bodyHtml: string | null;
}

function buildPrompt(input: ClassifyEmailInput, signature: string | null) {
  const body = getEmailBodyForAnalysis(input.bodyPlain, input.bodyHtml);

  return `You are an AI assistant for a creative agency. Analyse the following email and classify it.

Return a JSON object with these exact keys:
- category: one of ${AI_EMAIL_CATEGORIES.map((c) => `"${c}"`).join(", ")}
- confidence: number 0-100 indicating classification confidence
- summary: brief 1-2 sentence summary of the email
- reasoning: explanation of why you chose this category
- signature: extracted email signature text, or null
- company_name: detected company name, or null
- contact_name: detected contact full name, or null
- website: detected company website URL, or null

Classification guide:
- new_business_opportunity: genuine inbound business enquiry or project request from a potential new client
- existing_client: communication from a current or past client
- supplier: vendor, freelancer, or service provider outreach
- invoice: billing, payment, or financial document
- marketing: newsletters, promotions, cold sales pitches
- recruitment: job applications or recruitment messages
- spam: irrelevant, malicious, or junk mail
- other: anything that does not fit above

Subject: ${input.subject ?? "(no subject)"}
Sender Name: ${input.senderName ?? "(unknown)"}
Sender Email: ${input.senderEmail ?? "(unknown)"}
Detected Signature: ${signature ?? "(none detected)"}

Email Body:
${body || "(empty body)"}`;
}

function parseCategory(value: unknown): AiEmailCategory {
  if (
    typeof value === "string" &&
    AI_EMAIL_CATEGORIES.includes(value as AiEmailCategory)
  ) {
    return value as AiEmailCategory;
  }

  return "other";
}

function clampConfidence(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

export async function classifyEmail(
  input: ClassifyEmailInput,
): Promise<{ result: AiClassificationResult; rawResponse: Record<string, unknown> }> {
  const heuristicSignature = extractEmailSignature(
    getEmailBodyForAnalysis(input.bodyPlain, input.bodyHtml),
  );

  const openai = createOpenAIClient();

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You classify business emails for a creative agency. Respond only with valid JSON.",
      },
      {
        role: "user",
        content: buildPrompt(input, heuristicSignature),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty classification response.");
  }

  const parsed = JSON.parse(content) as Record<string, unknown>;

  const result: AiClassificationResult = {
    category: parseCategory(parsed.category),
    confidence: clampConfidence(parsed.confidence),
    summary: String(parsed.summary ?? "").trim(),
    reasoning: String(parsed.reasoning ?? "").trim(),
    signature:
      String(parsed.signature ?? "").trim() ||
      heuristicSignature ||
      null,
    company_name: String(parsed.company_name ?? "").trim() || null,
    contact_name: String(parsed.contact_name ?? "").trim() || null,
    website: String(parsed.website ?? "").trim() || null,
  };

  return { result, rawResponse: parsed };
}

export { PROMPT_VERSION, OPENAI_MODEL };
