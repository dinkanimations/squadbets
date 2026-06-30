"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error";

interface SaveToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
}

export function SaveToast({ message, type, onDismiss }: SaveToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-24 right-4 z-50 max-w-sm rounded-lg border bg-card px-4 py-3 text-sm shadow-lg",
        type === "success"
          ? "border-success/30 text-success"
          : "border-danger/30 text-danger",
      )}
    >
      {message}
    </div>
  );
}
