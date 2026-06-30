import {
  AI_EMAIL_CATEGORIES,
  OPENAI_MODEL,
  PROMPT_VERSION,
  routingIntentFromCategory,
  type AiClassificationResult,
  type AiEmailCategory,
  type InboxRoutingIntent,
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

  return `You are the business development AI for Dissembargo, a creative production agency specialising in animation, CGI, rendering, and medical visualisation.

Gmail is the source of truth. Your job is to decide whether an email deserves attention in Dissembargo OS — only genuine new business enquiries or meaningful client communications should surface. Everything else must be classified as not relevant.

Return a JSON object with these exact keys:
- category: one of ${AI_EMAIL_CATEGORIES.map((c) => `"${c}"`).join(", ")}
- routing_intent: one of "new_business_enquiry", "existing_client_communication", "not_relevant"
- confidence: number 0-100 — how likely this is genuine paid-work or actionable client communication
- summary: one concise sentence a producer can act on, e.g. "Company is requesting a 60-second product launch animation for September. Estimated budget £20k. Awaiting quotation."
- reasoning: brief explanation of your routing decision
- signature: extracted email signature text, or null
- company_name: detected company name, or null
- contact_name: detected contact full name, or null
- contact_email: detected contact email if different from sender, or null
- contact_phone: phone number from signature or body, or null
- website: detected company website URL, or null
- project_name: short title for the requested project or campaign, or null
- project_description: 2-4 sentence description of what the client wants, or null
- estimated_budget: numeric budget amount mentioned (GBP/USD/EUR), or null
- requested_deliverables: comma-separated list of requested services or creative deliverables, or null
- deadline: any mentioned deadline or delivery date as text, or null
- location: mentioned location, city, country, or shoot venue, or null

Routing rules (understand intent, never keyword-match alone):
- new_business_enquiry: A genuine NEW business enquiry — someone asking for a quote, pricing, proposal, creative work, animation, CGI, rendering, or production support from a company you do not already work with.
- existing_client_communication: A reply or message from a current or past client about ongoing work, feedback, approvals, scheduling, deliverables, or project updates. Includes replies in existing email threads.
- not_relevant: Everything else — do NOT surface these in the app.

Always use not_relevant routing for:
- newsletter, marketing, spam, invoice, receipt, password_reset, calendar, social_notification
- supplier outreach, recruitment, internal team mail, automated notifications, promotional mail

Category guide:
- new_business_opportunity: brand-new commercial enquiry
- existing_client: communication from a known client relationship
- supplier: vendors, freelancers pitching services TO the agency
- invoice / receipt: billing, payments, receipts
- password_reset: account security, login, verification codes
- calendar: meeting invites, calendar updates, scheduling bots
- social_notification: LinkedIn, Twitter/X, Facebook, Instagram notifications
- marketing: cold sales pitches and promotional outreach
- newsletter: subscribed newsletters and digests
- spam: junk, phishing, irrelevant bulk mail
- recruitment: job applications and hiring
- internal: colleagues and internal company mail
- other: anything else not relevant to winning or delivering paid work

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

function parseRoutingIntent(
  value: unknown,
  category: AiEmailCategory,
): InboxRoutingIntent {
  if (
    value === "new_business_enquiry" ||
    value === "existing_client_communication" ||
    value === "not_relevant"
  ) {
    return value;
  }

  return routingIntentFromCategory(category);
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
          "You are an AI business development assistant for a creative agency. Route emails to surface only genuine opportunities and client communications. Respond only with valid JSON.",
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
  const category = parseCategory(parsed.category);

  const result: AiClassificationResult = {
    category,
    routing_intent: parseRoutingIntent(parsed.routing_intent, category),
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

  if (
    result.routing_intent !== "not_relevant" &&
    isIgnoredCategoryForRouting(result.category)
  ) {
    result.routing_intent = "not_relevant";
  }

  if (
    result.routing_intent === "not_relevant" &&
    result.category === "new_business_opportunity"
  ) {
    result.routing_intent = "new_business_enquiry";
  }

  if (
    result.routing_intent === "not_relevant" &&
    result.category === "existing_client"
  ) {
    result.routing_intent = "existing_client_communication";
  }

  return { result, rawResponse: parsed };
}

function isIgnoredCategoryForRouting(category: AiEmailCategory): boolean {
  return category !== "new_business_opportunity" && category !== "existing_client";
}

export { PROMPT_VERSION, OPENAI_MODEL };
