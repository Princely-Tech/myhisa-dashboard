"use client";
// POST /auth/forgot-password always answers the same way, so the screen never
// reveals whether an account exists.
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import routes from "@/utils/routes";
import { authApi, isApiError } from "@/utils/api/onboardingApi";
import { isEmail } from "@/utils/onboarding";
import AuthSplitLayout from "@/components/onboarding/AuthSplitLayout";
import { Field, Notice, btnPrimaryLg, fieldA11y, inputClass } from "@/components/onboarding/ui";
import { btnSecondary, textLink } from "@/components/ui/styles";

const ForgotPasswordInner: React.FC = () => {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const e = searchParams.get("email");
    if (e) setEmail(e);
  }, [searchParams]);

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!isEmail(email)) {
      setError("Enter the email address you signed up with");
      document.getElementById("email")?.focus();
      return;
    }
    setError(null);
    setFormError(null);
    setSending(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setFormError(
        isApiError(err) && err.status === 429
          ? `Too many requests. Try again in ${err.retryAfterSeconds ?? 60} seconds.`
          : isApiError(err)
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
    setSending(false);
  };

  const resetHref = `${routes.resetPassword}?email=${encodeURIComponent(email.trim())}`;

  return (
    <AuthSplitLayout
      title={sent ? "Check your email" : "Reset your password"}
      subtitle={sent ? undefined : "Enter your account email and we'll send you a 6-digit reset code."}
      footer={
        <p className="m-0">
          Remembered it?{" "}
          <Link href={routes.login} className={textLink}>
            Back to log in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-5">
          <Notice tone="success" live title="If an account exists, we've sent a code">
            If <strong>{email.trim()}</strong> belongs to a MyHisa account, a 6-digit reset code is on its way. It expires in
            15 minutes.
          </Notice>
          <Link href={resetHref} className={btnPrimaryLg}>
            Enter the code
          </Link>
          <button type="button" className={`${btnSecondary} self-start`} onClick={() => setSent(false)}>
            Use a different email
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[18px]">
          {formError && (
            <Notice tone="error" live>
              {formError}
            </Notice>
          )}
          <Field id="email" label="Email address" error={error ?? undefined}>
            <input
              {...fieldA11y("email", { error, required: true })}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(!!error)}
            />
          </Field>
          <button type="submit" disabled={sending} className={btnPrimaryLg}>
            {sending ? "Sending…" : "Send reset code"}
          </button>
          <p className="m-0 text-sm text-hisa-muted">
            Already have a code?{" "}
            <Link href={resetHref} className={textLink}>
              Reset your password
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
};

const ForgotPassword = () => (
  <Suspense fallback={null}>
    <ForgotPasswordInner />
  </Suspense>
);

export default ForgotPassword;
