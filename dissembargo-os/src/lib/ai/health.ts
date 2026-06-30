import {
  APIConnectionError,
  APIError,
  AuthenticationError,
  OpenAI,
} from "openai";
import { OPENAI_MODEL } from "./constants";

export const OPENAI_API_KEY_ENV = "OPENAI_API_KEY";

export type OpenAIHealthStatus =
  | "connected"
  | "missing_api_key"
  | "invalid_api_key"
  | "unavailable";

export type OpenAIHealthResult = {
  status: OpenAIHealthStatus;
  model: string;
  message: string;
  missingEnvVar?: string;
};

function getApiKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey || null;
}

export function hasOpenAIEnv(): boolean {
  return Boolean(getApiKey());
}

export async function checkOpenAIHealth(): Promise<OpenAIHealthResult> {
  const model = OPENAI_MODEL;
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      status: "missing_api_key",
      model,
      message: `Missing ${OPENAI_API_KEY_ENV}. Add it to .env.local and restart the dev server.`,
      missingEnvVar: OPENAI_API_KEY_ENV,
    };
  }

  try {
    const client = new OpenAI({
      apiKey,
      timeout: 10_000,
      maxRetries: 0,
    });

    await client.models.list();

    return {
      status: "connected",
      model,
      message: "OpenAI API key is valid and responding.",
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return {
        status: "invalid_api_key",
        model,
        message:
          "OpenAI rejected the API key. Check that OPENAI_API_KEY in .env.local is correct and active.",
      };
    }

    if (error instanceof APIConnectionError) {
      return {
        status: "unavailable",
        model,
        message:
          "Could not reach OpenAI. Check your network connection and try again.",
      };
    }

    if (error instanceof APIError) {
      if (error.status === 401 || error.status === 403) {
        return {
          status: "invalid_api_key",
          model,
          message:
            "OpenAI rejected the API key. Check that OPENAI_API_KEY in .env.local is correct and active.",
        };
      }

      if (error.status && error.status >= 500) {
        return {
          status: "unavailable",
          model,
          message: "OpenAI is temporarily unavailable. Try again later.",
        };
      }
    }

    return {
      status: "unavailable",
      model,
      message:
        error instanceof Error
          ? error.message
          : "OpenAI health check failed.",
    };
  }
}
