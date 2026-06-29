import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ className, label, id, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <label className="block space-y-2">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-[100px] w-full rounded-lg border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20",
          className,
        )}
        {...props}
      />
    </label>
  );
}
