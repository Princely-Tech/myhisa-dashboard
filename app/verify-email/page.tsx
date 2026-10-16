"use client";
// Stage 1b: verify the email with the 6-digit code (POST /auth/verify-email).
// Backend rules: 5 wrong codes lock entry for 15 minutes (429 +
// retry_after_seconds), resend has a 60 s server-side cooldown (429 +
// retry_after_seconds).
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import routes from "@/utils/routes";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { isSandbox } from "@/utils/environment";
import { clearSession, readStoredUser } from "@/utils/session";
import { authApi, isApiError, refreshStoredUser } from "@/utils/api/onboardingApi";
import { routeAfterAuth } from "@/utils/onboarding";
import AuthSplitLayout from "@/components/onboarding/AuthSplitLayout";
import OtpInput from "@/components/onboarding/OtpInput";
import { Notice, btnPrimaryLg, linkButton } from "@/components/onboarding/ui";

const RESEND_COOLDOWN_SECONDS = 60;

function formatWait(seconds: number): string {
  if (seconds >= 120) return `${Math.ceil(seconds / 60)} minutes`;
  if (seconds >= 60) return "about a minute";
  return `${seconds} seconds`;
}

function useCountdown(initial = 0) {
  const [left, setLeft] = useState(initial);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [left]);
  return [left, setLeft] as const;
}

const VerifyEmailInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useCountdown(0);
  const [lockLeft, setLockLeft] = useCountdown(0);
  const submittedFor = useRef("");

  useEffect(() => {
    const fromQuery = searchParams.get("email");
    if (fromQuery) setEmail(fromQuery);
    else setEmail(readStoredUser()?.email ?? "");
    // Signup / login just sent a code: start the resend countdown.
    if (searchParams.get("sent") === "1") setCooldown(RESEND_COOLDOWN_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const routeAfterVerify = useCallback(async () => {
    if (!localStorage.getItem(apiEndpoints.tokenSetUrl)) {
      router.push(routes.login);
      return;
    }
    try {
      const user = await refreshStoredUser();
      router.push(routeAfterAuth(user, false));
    } catch {
      router.push(routes.login);
    }
  }, [router]);

  const verify = async (value: string) => {
    if (verifying || lockLeft > 0) return;
    if (!email) {
      setError("We couldn't tell which account to verify. Please log in again.");
      return;
    }
    if (!/^\d{6}$/.test(value)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    submittedFor.current = value;
    setVerifying(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authApi.verifyEmail({ email, otp: value });
      setInfo(
        res.onboarding_status === "approved" || isSandbox
          ? "Email verified. Taking you to your dashboard…"
          : "Email verified. Next, tell us about your business…"
      );
      await routeAfterVerify();
    } catch (err) {
      setVerifying(false);
      setCode("");
      if (isApiError(err)) {
        if (err.status === 429) {
          const wait = err.retryAfterSeconds ?? 900;
          setLockLeft(wait);
          setError(`Too many incorrect codes. For your security, code entry is paused for ${formatWait(wait)}.`);
        } else if (err.attemptsRemaining !== null) {
          setError(
            err.attemptsRemaining > 0
              ? `That code isn't right. ${err.attemptsRemaining} ${err.attemptsRemaining === 1 ? "try" : "tries"} left.`
              : "That code isn't right."
          );
        } else {
          // Expired / no code: the backend says to request a new one.
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await authApi.resendOtp(email);
      if (/already verified/i.test(res.message)) {
        setInfo("Your email is already verified.");
        await routeAfterVerify();
        return;
      }
      setInfo(`We've sent a new code to ${email}.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      if (isApiError(err) && err.status === 429) {
        setCooldown(err.retryAfterSeconds ?? RESEND_COOLDOWN_SECONDS);
        setInfo("A code was sent moments ago. You can request another when the timer runs out.");
      } else {
        setError(isApiError(err) ? err.message : "Couldn't send a new code. Please try again.");
      }
    }
    setResending(false);
  };

  const changeEmail = async () => {
    await clearSession();
    router.push(routes.register);
  };

  const locked = lockLeft > 0;

  return (
    <AuthSplitLayout
      title="Check your email"
      showProgress
      subtitle={
        <>
          We sent a 6-digit code to <strong className="text-hisa-ink">{email || "your email"}</strong>. It expires in 15 minutes.
        </>
      }
      footer={
        <>
          <p className="m-0">
            Wrong address?{" "}
            <button type="button" onClick={changeEmail} className={linkButton}>
              Change email
            </button>
          </p>
          <p className="m-0">
            Not you?{" "}
            <Link href={routes.login} className="font-semibold text-hisa-primary hover:underline">
              Log in with another account
            </Link>
          </p>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <span id="otp-label" className="text-sm font-semibold text-hisa-body">
            Verification code
          </span>
          <OtpInput
            label="Verification code"
            value={code}
            onChange={(v) => {
              setCode(v);
              if (error && !locked) setError(null);
            }}
            onComplete={(v) => {
              if (v !== submittedFor.current) verify(v);
            }}
            disabled={verifying || locked}
            invalid={!!error && !locked}
            describedBy={error ? "otp-status" : undefined}
            autoFocus
          />
        </div>

        <div id="otp-status" aria-live="polite" className="flex flex-col gap-2">
          {error && (
            <Notice tone={locked ? "warning" : "error"}>
              {error}
              {locked && <span className="block">You can try again in {formatWait(lockLeft)}.</span>}
            </Notice>
          )}
          {info && <Notice tone="success">{info}</Notice>}
        </div>

        <button type="submit" disabled={verifying || locked || code.length !== 6} className={btnPrimaryLg}>
          {verifying ? "Verifying…" : "Verify email"}
        </button>

        <p className="m-0 text-sm text-hisa-muted">
          Didn&apos;t get it? Check spam, or{" "}
          <button type="button" onClick={resend} disabled={cooldown > 0 || resending || !email} className={linkButton}>
            {cooldown > 0 ? `resend code in ${cooldown}s` : resending ? "sending…" : "resend code"}
          </button>
          .
        </p>
      </form>
    </AuthSplitLayout>
  );
};

const VerifyEmail = () => (
  <Suspense fallback={null}>
    <VerifyEmailInner />
  </Suspense>
);

export default VerifyEmail;
