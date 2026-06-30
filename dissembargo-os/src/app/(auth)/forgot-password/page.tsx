"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/actions";
import {
  AuthCard,
  AuthField,
  AuthFooterLink,
  AuthMessage,
  AuthSubmit,
} from "@/components/auth/AuthForm";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordReset,
    {},
  );

  return (
    <AuthCard
      title="Reset password"
      description="Enter your email and we'll send you a reset link."
    >
      <form action={formAction} className="space-y-4">
        <AuthMessage error={state.error} success={state.success} />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <AuthSubmit label={isPending ? "Sending..." : "Send reset link"} />
        <AuthFooterLink href="/login">Back to sign in</AuthFooterLink>
      </form>
    </AuthCard>
  );
}
