"use client";
import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import routes from "@/utils/routes";
import { storeSession } from "@/utils/session";
import { authApi, isApiError } from "@/utils/api/onboardingApi";
import { isEmail, routeAfterAuth } from "@/utils/onboarding";
import AuthSplitLayout from "@/components/onboarding/AuthSplitLayout";
import { Field, Notice, btnPrimaryLg, fieldA11y, inputClass } from "@/components/onboarding/ui";
import { textLink } from "@/components/ui/styles";

const LoginInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [processing, setProcessing] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (searchParams.get("reset") === "1") {
      setBanner({ tone: "success", text: "Password reset. Log in with your new password." });
    } else if (searchParams.get("session_expired") === "1") {
      setBanner({ tone: "warning", text: "Your session has expired. Please log in again." });
    }
    const e = searchParams.get("email");
    if (e) setEmail(e);
  }, [searchParams]);

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e: typeof errors = {};
    if (!email.trim()) e.email = "Enter your email address";
    else if (!isEmail(email)) e.email = "Enter a valid email address";
    if (!password) e.password = "Enter your password";
    setErrors(e);
    if (e.email || e.password) {
      formRef.current?.querySelector<HTMLElement>(e.email ? "#email" : "#password")?.focus();
      return;
    }
    setProcessing(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      await storeSession(res.data.token, res.data.user);
      // An unverified account gets `otp` in the login response (a fresh code
      // was sent unless one went out in the last 60 s).
      const needsVerification = !!res.data.otp;
      const target = routeAfterAuth(res.data.user, needsVerification);
      router.push(needsVerification ? `${target}&sent=1` : target);
    } catch (err) {
      setProcessing(false);
      setErrors({
        form: isApiError(err)
          ? err.status === 0
            ? err.message
            : err.message || "Email and password don't match an account."
          : "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <AuthSplitLayout
      title="Log in to MyHisa"
      subtitle="Welcome back. Pick up where you left off."
      footer={
        <>
          <p className="m-0">
            New to MyHisa?{" "}
            <Link href={routes.register} className={textLink}>
              Create an account
            </Link>
          </p>
          <p className="m-0">
            <Link href={routes.documentation} className={textLink}>
              View API &amp; integration docs
            </Link>
          </p>
        </>
      }
    >
      {banner && (
        <Notice tone={banner.tone} live>
          {banner.text}
        </Notice>
      )}
      {errors.form && (
        <Notice tone="error" live>
          {errors.form}
        </Notice>
      )}
      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-[18px]">
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
          <Field id="password" label="Password" error={errors.password}>
            <input
              {...fieldA11y("password", { error: errors.password, required: true })}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass(!!errors.password)}
            />
          </Field>
          <Link
            href={`${routes.forgotPassword}${email && isEmail(email) ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
            className={`${textLink} self-end text-sm`}
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={processing} className={`${btnPrimaryLg} h-[50px] text-base`}>
          {processing ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthSplitLayout>
  );
};

const Login = () => (
  <Suspense fallback={null}>
    <LoginInner />
  </Suspense>
);

export default Login;
