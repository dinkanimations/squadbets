"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { saveGeneralSettingsAction } from "@/lib/settings/actions";
import type { AppSettingsData } from "@/lib/settings/types";

const CURRENCIES = [
  { value: "GBP", label: "GBP (£)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
];

const TIMEZONES = [
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
];

const LANGUAGES = [
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
];

interface GeneralSettingsFormProps {
  settings: AppSettingsData;
}

export function GeneralSettingsForm({ settings }: GeneralSettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: settings.companyName,
    companyAddress: settings.companyAddress,
    companyEmail: settings.companyEmail,
    companyPhone: settings.companyPhone ?? "",
    website: settings.website,
    defaultCurrency: settings.defaultCurrency,
    timezone: settings.timezone,
    defaultLanguage: settings.defaultLanguage,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveGeneralSettingsAction(JSON.stringify(form));
      if (result.error) setError(result.error);
      else {
        setSuccess(result.success ?? "Settings saved.");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="General Settings"
        description="Company information used across the application"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Company Name"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
        />
        <Input
          label="Company Email"
          type="email"
          value={form.companyEmail}
          onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
        />
        <Input
          label="Company Phone"
          value={form.companyPhone}
          onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
        />
        <Input
          label="Website"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
        />
        <div className="sm:col-span-2">
          <Input
            label="Company Address"
            value={form.companyAddress}
            onChange={(e) =>
              setForm({ ...form, companyAddress: e.target.value })
            }
          />
        </div>
        <Select
          label="Default Currency"
          value={form.defaultCurrency}
          onChange={(e) =>
            setForm({ ...form, defaultCurrency: e.target.value })
          }
          options={CURRENCIES}
        />
        <Select
          label="Time Zone"
          value={form.timezone}
          onChange={(e) => setForm({ ...form, timezone: e.target.value })}
          options={TIMEZONES}
        />
        <Select
          label="Default Language"
          value={form.defaultLanguage}
          onChange={(e) =>
            setForm({ ...form, defaultLanguage: e.target.value })
          }
          options={LANGUAGES}
        />
      </div>

      <div className="mt-6">
        <Button type="button" disabled={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save General Settings"}
        </Button>
      </div>
    </Card>
  );
}
