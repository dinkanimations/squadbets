"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/actions";
import {
  AuthCard,
  AuthField,
  AuthFooterLink,
  AuthMessage,
  AuthSubmit,
} from "@/components/auth/AuthForm";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/";
  const callbackError = searchParams.get("error");
  const [state, formAction, isPending] = useActionState(signIn, {});

  return (
    <AuthCard
      title="Sign in"
      description="Access your Dissembargo OS workspace."
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <AuthMessage
          error={
            state.error ??
            (callbackError ? "Authentication failed. Please try again." : undefined)
          }
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <AuthSubmit label={isPending ? "Signing in..." : "Sign in"} />
        <AuthFooterLink href="/forgot-password">
          Forgot your password?
        </AuthFooterLink>
      </form>
    </AuthCard>
  );
}
