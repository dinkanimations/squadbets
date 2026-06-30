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
  threadContext?: string | null;
}

function buildPrompt(input: ClassifyEmailInput, signature: string | null) {
  const body = getEmailBodyForAnalysis(input.bodyPlain, input.bodyHtml);

  return `You are an AI assistant for a creative production agency specialising in animation, CGI, rendering, and medical visualisation.

Analyse the ENTIRE email below — including subject, sender, body, signature, and any previous thread messages — and classify it by understanding the sender's intent and context. Do NOT rely on keyword matching alone.

Return a JSON object with these exact keys:
- category: one of ${AI_EMAIL_CATEGORIES.map((c) => `"${c}"`).join(", ")}
- confidence: number 0-100 indicating classification confidence
- summary: brief 1-2 sentence summary of the email
- reasoning: explanation of why you chose this category based on intent
- signature: extracted email signature text, or null
- company_name: detected company name, or null
- contact_name: detected contact full name, or null
- contact_email: detected contact email if different from sender, or null
- contact_phone: phone number from signature or body, or null
- website: detected company website URL, or null
- project_name: short name for the requested project or campaign, or null
- project_description: 2-4 sentence description of what the client wants, or null
- estimated_budget: numeric budget amount mentioned (GBP/USD/EUR), or null
- requested_deliverables: comma-separated list of requested services or creative deliverables, or null
- deadline: any mentioned deadline or delivery date as text, or null
- location: mentioned location, city, country, or shoot venue, or null

Classification guide (understand meaning, not keywords):
- new_business_opportunity: A genuine NEW business enquiry where someone is asking about a quote, pricing, proposal, project, creative work, animation, CGI, rendering, medical visualisation, product launch visuals, or production support. This is from a potential new client, not an existing relationship.
- existing_client: Communication from a current or past client about ongoing work, projects, or general business
- supplier: Vendor, freelancer, subcontractor, or service provider outreach or correspondence
- invoice: Billing, payment requests, receipts, or financial documents
- recruitment: Job applications, hiring enquiries, or recruitment agency messages
- marketing: Cold sales pitches, promotional outreach, or unsolicited business development (not newsletters)
- newsletter: Subscribed newsletters, industry updates, mailing list content, or automated digest emails
- spam: Irrelevant, malicious, phishing, or junk mail with no legitimate business purpose
- internal: Messages from colleagues, team members, or internal company communication
- other: Anything that does not fit the categories above

Subject: ${input.subject ?? "(no subject)"}
Sender Name: ${input.senderName ?? "(unknown)"}
Sender Email: ${input.senderEmail ?? "(unknown)"}
Detected Signature: ${signature ?? "(none detected)"}

Email Body:
${body || "(empty body)"}
${
  input.threadContext
    ? `\nPrevious Thread Messages (oldest first):\n${input.threadContext}`
    : ""
}`;
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

function parseOptionalBudget(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
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
          "You classify business emails for a creative agency by understanding intent and context. Respond only with valid JSON.",
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
    contact_email: String(parsed.contact_email ?? "").trim() || null,
    contact_phone: String(parsed.contact_phone ?? "").trim() || null,
    website: String(parsed.website ?? "").trim() || null,
    project_name: String(parsed.project_name ?? "").trim() || null,
    project_description: String(parsed.project_description ?? "").trim() || null,
    estimated_budget: parseOptionalBudget(parsed.estimated_budget),
    requested_deliverables:
      String(parsed.requested_deliverables ?? "").trim() || null,
    deadline: String(parsed.deadline ?? "").trim() || null,
    location: String(parsed.location ?? "").trim() || null,
  };

  return { result, rawResponse: parsed };
}

export { PROMPT_VERSION, OPENAI_MODEL };
