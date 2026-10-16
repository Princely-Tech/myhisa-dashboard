"use client";
// POST /auth/reset-password. Wrong code: 400 + attempts_remaining; 5 wrong
// codes lock for 15 minutes (429 + retry_after_seconds). Success ends every
// session, so the user goes back to log in.
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import routes from "@/utils/routes";
import { authApi, isApiError } from "@/utils/api/onboardingApi";
import { isEmail, passwordProblem } from "@/utils/onboarding";
import { clearSession } from "@/utils/session";
import AuthSplitLayout from "@/components/onboarding/AuthSplitLayout";
import OtpInput from "@/components/onboarding/OtpInput";
import PasswordStrength from "@/components/onboarding/PasswordStrength";
import { Field, Notice, btnPrimaryLg, fieldA11y, inputClass } from "@/components/onboarding/ui";
import { textLink } from "@/components/ui/styles";

type Errors = Partial<Record<"email" | "code" | "password" | "confirm_password" | "form", string>>;

const ResetPasswordInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);

  useEffect(() => {
    const e = searchParams.get("email");
    if (e) setEmail(e);
  }, [searchParams]);

  const locked = lockedUntil !== null && Date.now() < lockedUntil;

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: Errors = {};
    if (!isEmail(email)) e.email = "Enter your account email";
    if (!/^\d{6}$/.test(code)) e.code = "Enter the 6-digit code from the email";
    const pw = passwordProblem(password);
    if (pw) e.password = pw;
    if (confirm !== password) e.confirm_password = "Passwords do not match";
    setErrors(e);
    if (Object.keys(e).length) {
      const first = (["email", "code", "password", "confirm_password"] as const).find((k) => e[k]);
      if (first === "code") document.querySelector<HTMLInputElement>("[aria-label='Digit 1 of 6']")?.focus();
      else if (first) document.getElementById(first)?.focus();
      return;
    }
    setSaving(true);
    try {
      await authApi.resetPassword({ email: email.trim(), code, password, confirm_password: confirm });
      // Every session ended server-side (token_secret rotated).
      await clearSession();
      router.push(`${routes.login}?reset=1&email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setSaving(false);
      if (!isApiError(err)) {
        setErrors({ form: "Something went wrong. Please try again." });
        return;
      }
      if (err.status === 429 && /incorrect/i.test(err.message)) {
        const wait = err.retryAfterSeconds ?? 900;
        setLockedUntil(Date.now() + wait * 1000);
        setErrors({ form: `Too many incorrect codes. Try again in ${Math.ceil(wait / 60)} minute(s), or request a new code.` });
        return;
      }
      if (err.status === 429) {
        setErrors({ form: `Too many attempts from this network. Try again in ${err.retryAfterSeconds ?? 60} seconds.` });
        return;
      }
      const fe: Errors = {
        email: err.field("email"),
        code: err.field("code"),
        password: err.field("password"),
        confirm_password: err.field("confirm_password"),
      };
      if (!Object.values(fe).some(Boolean)) {
        fe.code =
          err.attemptsRemaining !== null
            ? `That code is wrong or has expired. ${err.attemptsRemaining} ${err.attemptsRemaining === 1 ? "try" : "tries"} left.`
            : "That code is wrong or has expired. Request a new one if needed.";
      }
      setErrors(fe);
      setCode("");
    }
  };

  return (
    <AuthSplitLayout
      title="Choose a new password"
      subtitle="Enter the code we emailed you and a new password."
      footer={
        <>
          <p className="m-0">
            No code?{" "}
            <Link href={`${routes.forgotPassword}${email ? `?email=${encodeURIComponent(email)}` : ""}`} className={textLink}>
              Send a new one
            </Link>
          </p>
          <p className="m-0">
            <Link href={routes.login} className={textLink}>
              Back to log in
            </Link>
          </p>
        </>
      }
    >
      {errors.form && (
        <Notice tone={locked ? "warning" : "error"} live>
          {errors.form}
        </Notice>
      )}
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-[18px]">
        <Field id="email" label="Email address" error={errors.email}>
          <input
            {...fieldA11y("email", { error: errors.email, required: true })}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass(!!errors.email)}
          />
        </Field>
        <div className="flex flex-col gap-[6px]">
          <span className="text-sm font-semibold text-hisa-body">Reset code</span>
          <OtpInput
            label="Reset code"
            value={code}
            onChange={setCode}
            disabled={locked}
            invalid={!!errors.code}
            describedBy={errors.code ? "code-error" : undefined}
          />
          {errors.code && (
            <span id="code-error" role="alert" className="text-[13px] text-[#B42318]">
              {errors.code}
            </span>
          )}
        </div>
        <Field id="password" label="New password" error={errors.password}>
          <input
            {...fieldA11y("password", { error: errors.password, required: true })}
            aria-describedby={`password-strength${errors.password ? " password-error" : ""}`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass(!!errors.password)}
          />
          <PasswordStrength id="password-strength" password={password} />
        </Field>
        <Field id="confirm_password" label="Confirm new password" error={errors.confirm_password}>
          <input
            {...fieldA11y("confirm_password", { error: errors.confirm_password, required: true })}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass(!!errors.confirm_password)}
          />
        </Field>
        <button type="submit" disabled={saving || locked} className={btnPrimaryLg}>
          {saving ? "Saving…" : "Reset password"}
        </button>
      </form>
    </AuthSplitLayout>
  );
};

const ResetPassword = () => (
  <Suspense fallback={null}>
    <ResetPasswordInner />
  </Suspense>
);

export default ResetPassword;
