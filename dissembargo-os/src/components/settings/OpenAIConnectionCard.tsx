"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { OpenAIHealthResult } from "@/lib/ai/health";

interface OpenAIConnectionCardProps {
  configured: boolean;
  model: string;
}

function healthBadgeVariant(
  status: OpenAIHealthResult["status"],
): "success" | "danger" | "warning" | "default" {
  if (status === "ok") return "success";
  if (status === "not_configured" || status === "invalid_key") return "danger";
  if (status === "quota_exceeded") return "warning";
  return "default";
}

function healthLabel(status: OpenAIHealthResult["status"]): string {
  switch (status) {
    case "ok":
      return "Connected";
    case "not_configured":
      return "Not configured";
    case "quota_exceeded":
      return "Quota exceeded";
    case "invalid_key":
      return "Invalid key";
    case "unreachable":
      return "Unreachable";
    default:
      return "Error";
  }
}

export function OpenAIConnectionCard({
  configured,
  model,
}: OpenAIConnectionCardProps) {
  const [health, setHealth] = useState<OpenAIHealthResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runHealthCheck = async () => {
    setIsChecking(true);
    try {
      const response = await fetch("/api/openai/health");
      const data = await response.json();
      setHealth(data);
    } catch {
      setHealth({
        status: "error",
        message: "Unable to reach OpenAI health check.",
        model,
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (configured) {
      void runHealthCheck();
    }
  }, [configured]);

  const status = configured
    ? (health?.status ?? "error")
    : "not_configured";

  return (
    <Card>
      <CardHeader
        title="OpenAI"
        description="Powers email classification and company intelligence"
      />
      <div className="flex flex-col gap-4 rounded-lg bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">API Connection</p>
          <p className="text-xs text-muted">
            Model: {model} · Key configured via environment
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={healthBadgeVariant(status)}>
            {healthLabel(status)}
          </Badge>
          {configured && (
            <Button
              variant="secondary"
              size="sm"
              onClick={runHealthCheck}
              disabled={isChecking}
            >
              <RefreshCw className="h-4 w-4" />
              {isChecking ? "Checking..." : "Test connection"}
            </Button>
          )}
        </div>
      </div>

      {health?.status === "quota_exceeded" && (
        <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-foreground">
          {health.message}{" "}
          <a
            href="https://platform.openai.com/settings/organization/billing"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            Add billing →
          </a>
        </p>
      )}

      {health && health.status !== "ok" && health.status !== "quota_exceeded" && (
        <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {health.message}
        </p>
      )}

      {health?.status === "ok" && (
        <p className="mt-3 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          {health.message}
        </p>
      )}

      <p className="mt-3 text-xs text-muted">
        API keys are managed securely via server environment variables and are
        never exposed in the application.
      </p>
    </Card>
  );
}
