"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { saveNotificationsAction } from "@/lib/settings/actions";
import type { AppSettingsData } from "@/lib/settings/types";

interface NotificationsFormProps {
  settings: AppSettingsData;
}

const NOTIFICATION_OPTIONS = [
  { key: "notifyEmail", label: "Email Notifications" },
  { key: "notifyDeadlines", label: "Deadline Reminders" },
  { key: "notifyQuoteApproval", label: "Quote Approval Notifications" },
  { key: "notifyClientFeedback", label: "Client Feedback Reminders" },
  { key: "notifyAiProcessing", label: "AI Processing Notifications" },
] as const;

export function NotificationsForm({ settings }: NotificationsFormProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState({
    notifyEmail: settings.notifyEmail,
    notifyDeadlines: settings.notifyDeadlines,
    notifyQuoteApproval: settings.notifyQuoteApproval,
    notifyClientFeedback: settings.notifyClientFeedback,
    notifyAiProcessing: settings.notifyAiProcessing,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveNotificationsAction(JSON.stringify(prefs));
      if (result.error) setError(result.error);
      else {
        setSuccess(result.success ?? "Notification preferences saved.");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Notifications"
        description="Choose which notifications to receive"
      />

      {(error || success) && (
        <p
          className={`mb-4 rounded-lg px-3 py-2 text-sm ${
            error ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {error ?? success}
        </p>
      )}

      <div className="space-y-3">
        {NOTIFICATION_OPTIONS.map((option) => (
          <label
            key={option.key}
            className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface-elevated/40 px-4 py-3"
          >
            <span className="text-sm text-foreground">{option.label}</span>
            <input
              type="checkbox"
              checked={prefs[option.key]}
              onChange={(e) =>
                setPrefs({ ...prefs, [option.key]: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-accent"
            />
          </label>
        ))}
      </div>

      <div className="mt-6">
        <Button type="button" disabled={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Notifications"}
        </Button>
      </div>
    </Card>
  );
}
