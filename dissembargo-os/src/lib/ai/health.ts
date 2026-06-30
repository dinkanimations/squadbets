import { createOpenAIClient, hasOpenAIEnv } from "./client";
import { OPENAI_MODEL } from "./constants";

export type OpenAIHealthStatus =
  | "ok"
  | "not_configured"
  | "quota_exceeded"
  | "invalid_key"
  | "unreachable"
  | "error";

export type OpenAIHealthResult = {
  status: OpenAIHealthStatus;
  message: string;
  model: string;
};

export function formatAiProcessingError(message: string): {
  userMessage: string;
  code: "quota_exceeded" | "missing_key" | "invalid_key" | "rate_limit" | "other";
} {
  const lower = message.toLowerCase();

  if (lower.includes("missing openai_api_key")) {
    return {
      code: "missing_key",
      userMessage:
        "OpenAI API key is not configured. Add OPENAI_API_KEY to .env.local and restart the dev server.",
    };
  }

  if (
    lower.includes("quota") ||
    lower.includes("insufficient_quota") ||
    (lower.includes("429") && lower.includes("exceeded"))
  ) {
    return {
      code: "quota_exceeded",
      userMessage:
        "OpenAI quota exceeded. Add billing or credits at platform.openai.com, then scan again.",
    };
  }

  if (
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("invalid_api_key") ||
    lower.includes("401")
  ) {
    return {
      code: "invalid_key",
      userMessage:
        "OpenAI API key is invalid. Check OPENAI_API_KEY in .env.local and restart the dev server.",
    };
  }

  if (lower.includes("rate limit") || lower.includes("429")) {
    return {
      code: "rate_limit",
      userMessage:
        "OpenAI rate limit hit. Wait a minute and try scanning again.",
    };
  }

  return {
    code: "other",
    userMessage: message,
  };
}

export async function checkOpenAIHealth(): Promise<OpenAIHealthResult> {
  if (!hasOpenAIEnv()) {
    return {
      status: "not_configured",
      message:
        "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server.",
      model: OPENAI_MODEL,
    };
  }

  try {
    const openai = createOpenAIClient();

    await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: "user", content: "Reply with OK" }],
      max_tokens: 5,
    });

    return {
      status: "ok",
      message: "OpenAI API is reachable and responding.",
      model: OPENAI_MODEL,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "OpenAI health check failed";
    const formatted = formatAiProcessingError(message);

    if (formatted.code === "quota_exceeded") {
      return {
        status: "quota_exceeded",
        message: formatted.userMessage,
        model: OPENAI_MODEL,
      };
    }

    if (formatted.code === "invalid_key") {
      return {
        status: "invalid_key",
        message: formatted.userMessage,
        model: OPENAI_MODEL,
      };
    }

    if (formatted.code === "rate_limit") {
      return {
        status: "error",
        message: formatted.userMessage,
        model: OPENAI_MODEL,
      };
    }

    return {
      status: "error",
      message,
      model: OPENAI_MODEL,
    };
  }
}
