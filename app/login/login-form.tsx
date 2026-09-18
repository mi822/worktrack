"use client";

import { signIn } from "@/app/actions/auth";
import { FormSubmitButton } from "@/components/form-submit-button";

export function LoginForm({
  errorMessage,
  nextPath,
}: {
  errorMessage: string | null;
  nextPath?: string;
}) {
  return (
    <form action={signIn} className="flex flex-col gap-5">
      {errorMessage ? <p className="alert-error">{errorMessage}</p> : null}
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <label className="field-label">
        <span className="field-caption">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className="field-input"
        />
      </label>
      <label className="field-label">
        <span className="field-caption">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
        />
      </label>
      <FormSubmitButton pendingLabel="Signing in…" className="btn-primary mt-1">
        Sign in
      </FormSubmitButton>
    </form>
  );
}
