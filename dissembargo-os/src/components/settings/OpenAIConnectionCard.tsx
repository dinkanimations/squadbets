"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { OpenAIHealthStatus } from "@/lib/ai/health";

type OpenAIHealthResponse = {
  status: OpenAIHealthStatus;
  model: string;
  message: string;
  missingEnvVar: string | null;
};

const STATUS_LABELS: Record<OpenAIHealthStatus, string> = {
  connected: "Connected",
  missing_api_key: "Missing API key",
  invalid_api_key: "Invalid API key",
  unavailable: "OpenAI unavailable",
};

const STATUS_VARIANTS: Record<
  OpenAIHealthStatus,
  "success" | "danger" | "warning" | "default"
> = {
  connected: "success",
  missing_api_key: "danger",
  invalid_api_key: "danger",
  unavailable: "warning",
};

export function OpenAIConnectionCard() {
  const [health, setHealth] = useState<OpenAIHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHealth() {
      setIsLoading(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/openai/health");
        const data = (await response.json()) as OpenAIHealthResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to check OpenAI status");
        }

        if (!cancelled) {
          setHealth(data);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error
              ? error.message
              : "Failed to check OpenAI status",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const status = health?.status;
  const badgeLabel = isLoading
    ? "Checking..."
    : fetchError
      ? "OpenAI unavailable"
      : status
        ? STATUS_LABELS[status]
        : "OpenAI unavailable";

  const badgeVariant = isLoading
    ? "default"
    : fetchError
      ? "warning"
      : status
        ? STATUS_VARIANTS[status]
        : "warning";

  const detailMessage = fetchError ?? health?.message ?? null;

  return (
    <Card>
      <CardHeader
        title="OpenAI"
        description="Powers email classification and company intelligence"
      />
      <div className="flex items-center justify-between rounded-lg bg-surface-elevated p-4">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-medium text-foreground">API Connection</p>
          <p className="text-xs text-muted">
            Model: {health?.model ?? "gpt-4o-mini"} · Key configured via{" "}
            <code className="rounded bg-surface px-1 py-0.5">OPENAI_API_KEY</code>
          </p>
        </div>
        <Badge variant={badgeVariant} className="shrink-0">
          {isLoading ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking...
            </span>
          ) : (
            badgeLabel
          )}
        </Badge>
      </div>

      {detailMessage ? (
        <p
          className={`mt-3 text-xs ${
            status === "connected" || status === undefined
              ? "text-muted"
              : status === "unavailable"
                ? "text-warning"
                : "text-danger"
          }`}
        >
          {detailMessage}
        </p>
      ) : null}

      {health?.status === "missing_api_key" && health.missingEnvVar ? (
        <div className="mt-3 rounded-lg border border-border bg-surface-elevated/60 p-3 text-xs text-muted">
          <p className="font-medium text-foreground">Add to .env.local</p>
          <pre className="mt-2 overflow-x-auto rounded bg-surface p-2 text-foreground">
            {`${health.missingEnvVar}=sk-your-openai-api-key`}
          </pre>
          <p className="mt-2">
            Restart the dev server after saving. Get a key from{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline-offset-2 hover:underline"
            >
              platform.openai.com/api-keys
            </a>
            .
          </p>
        </div>
      ) : null}

      <p className="mt-3 text-xs text-muted">
        API keys are managed securely via server environment variables and are
        never exposed in the application.
      </p>
    </Card>
  );
}
