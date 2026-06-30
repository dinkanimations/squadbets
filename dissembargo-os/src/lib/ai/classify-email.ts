import {
  CRM_EMAIL_ROUTES,
  OPENAI_MODEL,
  PROMPT_VERSION,
  type AiClassificationResult,
  type CrmEmailRoute,
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

  return `You are the CRM AI for Dissembargo, a creative production agency (animation, CGI, rendering, medical visualisation).

Classify each email into EXACTLY ONE route:
- potential_opportunity: A genuine NEW business enquiry — someone asking for a quote, pricing, proposal, or creative/production work.
- freelancer: Someone offering their services, pitching freelance work, sending a portfolio, showreel, CV, or availability — NOT a client enquiry.
- other: Everything else — newsletters, invoices, receipts, marketing, spam, calendar invites, social notifications, internal mail, automated messages, existing client project updates, recruitment from agencies, etc.

Return JSON with these exact keys:
- route: one of ${CRM_EMAIL_ROUTES.map((r) => `"${r}"`).join(", ")}
- confidence: number 0-100
- summary: one actionable sentence for a producer
- reasoning: brief explanation

Potential opportunity fields (when route is potential_opportunity, else null):
- company_name, contact_name, contact_email, contact_phone, website
- project_name, project_description, estimated_budget, requested_deliverables, deadline, location

Freelancer fields (when route is freelancer, else null):
- freelancer_name, freelancer_email, role, skills, software, portfolio_url, website, linkedin_url, day_rate, availability, notes

Shared:
- signature: extracted email signature text, or null

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

function parseRoute(value: unknown): CrmEmailRoute {
  if (
    value === "potential_opportunity" ||
    value === "freelancer" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}

function clampConfidence(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed * 100) / 100;
}

function str(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s || null;
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
          "You classify emails for a creative agency CRM. Respond only with valid JSON. Never route freelancer pitches as potential opportunities.",
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
    route: parseRoute(parsed.route),
    confidence: clampConfidence(parsed.confidence),
    summary: str(parsed.summary) ?? "",
    reasoning: str(parsed.reasoning) ?? "",
    signature: str(parsed.signature) || heuristicSignature || null,
    company_name: str(parsed.company_name),
    contact_name: str(parsed.contact_name),
    contact_email: str(parsed.contact_email),
    contact_phone: str(parsed.contact_phone),
    website: str(parsed.website),
    project_name: str(parsed.project_name),
    project_description: str(parsed.project_description),
    estimated_budget: parseOptionalNumber(parsed.estimated_budget),
    requested_deliverables: str(parsed.requested_deliverables),
    deadline: str(parsed.deadline),
    location: str(parsed.location),
    freelancer_name: str(parsed.freelancer_name) || input.senderName,
    freelancer_email: str(parsed.freelancer_email) || input.senderEmail,
    role: str(parsed.role),
    skills: str(parsed.skills),
    software: str(parsed.software),
    portfolio_url: str(parsed.portfolio_url),
    linkedin_url: str(parsed.linkedin_url),
    day_rate: parseOptionalNumber(parsed.day_rate),
    availability: str(parsed.availability),
    notes: str(parsed.notes),
  };

  return { result, rawResponse: parsed };
}

export { PROMPT_VERSION, OPENAI_MODEL };
