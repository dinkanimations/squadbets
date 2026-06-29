import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const variantStyles = {
  primary:
    "bg-accent text-white hover:bg-accent-secondary disabled:opacity-50",
  secondary:
    "border border-border bg-surface-elevated text-foreground hover:border-border-hover",
  ghost: "text-muted hover:bg-surface-elevated hover:text-foreground",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    />
  );
}
