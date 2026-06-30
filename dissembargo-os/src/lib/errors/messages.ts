export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof Error && error.message.trim()) {
    const message = error.message;

    if (message.includes("Authentication required")) {
      return "Your session has expired. Please sign in again.";
    }

    if (message.includes("JWT") || message.includes("auth")) {
      return "Authentication failed. Please sign in again.";
    }

    if (message.includes("OpenAI") || message.includes("openai")) {
      return "AI processing is temporarily unavailable. Please try again shortly.";
    }

    if (message.includes("Gmail") || message.includes("google")) {
      return "Gmail integration error. Check your connection in Settings.";
    }

    if (message.includes("Supabase") || message.includes("database")) {
      return "Unable to reach the database. Please try again.";
    }

    if (message.includes("fetch") || message.includes("network")) {
      return "Network error. Check your connection and try again.";
    }

    if (message.includes("not found") || message.includes("PGRST116")) {
      return "The requested record could not be found.";
    }

    return message;
  }

  return fallback;
}
