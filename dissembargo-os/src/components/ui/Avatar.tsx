import { cn } from "@/lib/utils/cn";

interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({ initials, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary font-medium text-white",
        sizeStyles[size],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
