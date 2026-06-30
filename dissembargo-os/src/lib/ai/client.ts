import OpenAI from "openai";
import { OPENAI_API_KEY_ENV } from "./health";

function getApiKey(): string | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  return apiKey || null;
}

export function createOpenAIClient() {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(`Missing ${OPENAI_API_KEY_ENV} environment variable.`);
  }

  return new OpenAI({ apiKey });
}

export function hasOpenAIEnv(): boolean {
  return Boolean(getApiKey());
}

export { OPENAI_API_KEY_ENV };
