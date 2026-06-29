"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/auth/actions";
import {
  AuthCard,
  AuthField,
  AuthFooterLink,
  AuthMessage,
  AuthSubmit,
} from "@/components/auth/AuthForm";

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(updatePassword, {});

  return (
    <AuthCard
      title="Set new password"
      description="Choose a new password for your account."
    >
      <form action={formAction} className="space-y-4">
        <AuthMessage error={state.error} />
        <AuthField
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
        />
        <AuthSubmit label={isPending ? "Updating..." : "Update password"} />
        <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
      </form>
    </AuthCard>
  );
}
