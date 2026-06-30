import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ className, label, id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-2">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-surface-elevated px-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}
