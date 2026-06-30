"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Save, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  saveBrandingAction,
  uploadBrandingAssetAction,
} from "@/lib/settings/actions";
import type { AppSettingsData } from "@/lib/settings/types";

interface BrandingFormProps {
  settings: AppSettingsData;
}

export function BrandingForm({ settings }: BrandingFormProps) {
  const router = useRouter();
  const companyLogoRef = useRef<HTMLInputElement>(null);
  const pdfLogoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    emailSignature: settings.emailSignature ?? "",
    pdfFooterText: settings.pdfFooterText ?? "",
    pdfTagline: settings.pdfTagline,
    companyLogoUrl: settings.companyLogoUrl,
    pdfHeaderLogoUrl: settings.pdfHeaderLogoUrl,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleUpload = (
    assetType: "company_logo" | "pdf_header_logo",
    file: File,
  ) => {
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const result = await uploadBrandingAssetAction(formData, assetType);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Logo uploaded.");
        if (assetType === "company_logo") {
          setForm((prev) => ({ ...prev, companyLogoUrl: result.url ?? null }));
        } else {
          setForm((prev) => ({
            ...prev,
            pdfHeaderLogoUrl: result.url ?? null,
          }));
        }
        router.refresh();
      }
    });
  };

  const handleSave = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await saveBrandingAction(
        JSON.stringify({
          emailSignature: form.emailSignature,
          pdfFooterText: form.pdfFooterText,
          pdfTagline: form.pdfTagline,
        }),
      );
      if (result.error) setError(result.error);
      else {
        setSuccess(result.success ?? "Branding saved.");
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader
        title="Branding"
        description="Logos and signatures used in PDFs and communications"
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

      <div className="space-y-6">
        <div>
          <h4 className="mb-2 text-sm font-medium text-foreground">
            Company Logo
          </h4>
          <input
            ref={companyLogoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("company_logo", file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => companyLogoRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload Company Logo
          </Button>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-foreground">
            PDF Header Logo
          </h4>
          <input
            ref={pdfLogoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload("pdf_header_logo", file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => pdfLogoRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Upload PDF Header Logo
          </Button>
        </div>

        <Input
          label="PDF Tagline"
          value={form.pdfTagline}
          onChange={(e) => setForm({ ...form, pdfTagline: e.target.value })}
        />

        <Input
          label="PDF Footer Text"
          value={form.pdfFooterText}
          onChange={(e) =>
            setForm({ ...form, pdfFooterText: e.target.value })
          }
          placeholder="e.g. Dissembargo · hello@dissembargo.com"
        />

        <Textarea
          label="Email Signature"
          rows={4}
          value={form.emailSignature}
          onChange={(e) =>
            setForm({ ...form, emailSignature: e.target.value })
          }
        />
      </div>

      <div className="mt-6">
        <Button type="button" disabled={isPending} onClick={handleSave}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Branding"}
        </Button>
      </div>
    </Card>
  );
}
