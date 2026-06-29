import type { ReactNode } from "react";
import Link from "next/link";

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
            <span className="text-sm font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AuthField({
  label,
  name,
  type = "text",
  autoComplete,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

export function AuthSubmit({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="h-10 w-full rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-secondary"
    >
      {label}
    </button>
  );
}

export function AuthMessage({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;

  return (
    <p
      className={`rounded-lg px-3 py-2 text-sm ${
        error
          ? "bg-danger/10 text-danger"
          : "bg-success/10 text-success"
      }`}
    >
      {error ?? success}
    </p>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <p className="text-center text-sm text-muted">
      <Link href={href} className="text-accent hover:underline">
        {children}
      </Link>
    </p>
  );
}
