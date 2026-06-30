import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  className?: string;
}

export function SearchInput({
  className,
  placeholder = "Search...",
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <input
        type="search"
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-border bg-surface-elevated pl-9 pr-4 text-sm text-foreground placeholder:text-muted/60 transition-colors duration-200 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-60"
        {...props}
      />
    </div>
  );
}
