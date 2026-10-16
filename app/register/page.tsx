"use client";
// Onboarding v2, stage 1: create the account (POST /auth/signup). Business,
// identity and documents are collected afterwards by the /onboarding wizard.
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import { PRIVACY_URL, TERMS_URL, isSandbox } from "@/utils/environment";
import { storeSession } from "@/utils/session";
import { authApi, isApiError } from "@/utils/api/onboardingApi";
import { TERMS_VERSION, isEmail, passwordProblem, toE164NG } from "@/utils/onboarding";
import AuthSplitLayout from "@/components/onboarding/AuthSplitLayout";
import PasswordStrength from "@/components/onboarding/PasswordStrength";
import { CheckIcon, Field, Notice, PhoneInput, btnPrimaryLg, fieldA11y, inputClass } from "@/components/onboarding/ui";
import { textLink } from "@/components/ui/styles";

type Errors = Partial<Record<"email" | "password" | "confirm_password" | "phone" | "terms_version" | "form", string>>;
type EmailState = "idle" | "checking" | "available" | "taken" | "unknown";

const Register: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChecked = useRef("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => () => {
    if (checkTimer.current) clearTimeout(checkTimer.current);
  }, []);

  const checkEmail = (value: string) => {
    const v = value.trim().toLowerCase();
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (!v || !isEmail(v)) {
      setEmailState("idle");
      return;
    }
    if (v === lastChecked.current && emailState !== "unknown") return;
    checkTimer.current = setTimeout(async () => {
      setEmailState("checking");
      try {
        const res = await authApi.checkEmail(v);
        lastChecked.current = v;
        setEmailState(res.available ? "available" : "taken");
        setErrors((e) => ({ ...e, email: res.available ? undefined : "An account already exists for this email. Log in instead." }));
      } catch (err) {
        // Rate limited or offline: don't block sign-up, the server checks again.
        setEmailState("unknown");
        if (isApiError(err) && err.status === 422) {
          setErrors((e) => ({ ...e, email: err.field("email") ?? err.message }));
        }
      }
    }, 350);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!email.trim()) e.email = "Enter your business email";
    else if (!isEmail(email)) e.email = "Enter a valid email address";
    else if (emailState === "taken") e.email = "An account already exists for this email. Log in instead.";
    const pw = passwordProblem(password);
    if (!password) e.password = "Choose a password";
    else if (pw) e.password = pw;
    if (confirm !== password) e.confirm_password = "Passwords do not match";
    if (!phone.trim()) e.phone = "Enter your phone number";
    else if (!toE164NG(phone)) e.phone = "Enter a valid Nigerian mobile number, e.g. 803 123 4567";
    if (!terms) e.terms_version = "You need to accept the terms to continue";
    return e;
  };

  const focusFirstError = (e: Errors) => {
    const order: (keyof Errors)[] = ["email", "password", "confirm_password", "phone", "terms_version"];
    const first = order.find((k) => e[k]);
    const id = first === "terms_version" ? "terms" : first;
    if (id) formRef.current?.querySelector<HTMLElement>(`#${id}`)?.focus();
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      focusFirstError(e);
      return;
    }
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authApi.signup({
        email: normalizedEmail,
        password,
        confirm_password: confirm,
        phone: toE164NG(phone) as string,
        terms_version: TERMS_VERSION,
      });
      await storeSession(res.data.token, res.data.user);
      router.push(`${routes.verifyEmail}?email=${encodeURIComponent(normalizedEmail)}&sent=1`);
    } catch (err) {
      setSubmitting(false);
      if (isApiError(err)) {
        const fe: Errors = {
          email: err.field("email"),
          password: err.field("password"),
          confirm_password: err.field("confirm_password"),
          phone: err.field("phone"),
          terms_version: err.field("terms_version"),
        };
        const hasField = Object.values(fe).some(Boolean);
        if (!hasField) {
          fe.form =
            err.status === 429
              ? `Too many sign-up attempts from this network. Try again in ${err.retryAfterSeconds ?? 60} seconds.`
              : err.message;
        }
        if (fe.email && /taken/i.test(fe.email)) {
          fe.email = "An account already exists for this email. Log in instead.";
          setEmailState("taken");
        }
        setErrors(fe);
        focusFirstError(fe);
      } else {
        setErrors({ form: "Something went wrong. Please try again." });
      }
    }
  };

  const emailHint =
    emailState === "checking" ? "Checking…" : emailState === "available" ? undefined : "Use an address your team checks: we send verification codes here.";

  return (
    <AuthSplitLayout
      title="Create your account"
      subtitle="Step 1 of 5 · about 2 minutes. Business details come next."
      showProgress
      footer={
        <>
          <p className="m-0">
            Already have an account?{" "}
            <Link href={routes.login} className={textLink}>
              Log in
            </Link>
          </p>
          <p className="m-0">
            Want to read the API first?{" "}
            <Link href={routes.documentation} className={textLink}>
              View the documentation
            </Link>
          </p>
        </>
      }
    >
      {/* SANDBOX: sandbox accounts are approved automatically and KYC is simulated. */}
      {isSandbox && (
        <Notice tone="info" title="Sandbox sign-up">
          Your account is approved as soon as you verify your email. Business and KYC checks use simulated data.{" "}
          <Link href={routes.sandboxTestValues} className={textLink}>
            See test values
          </Link>
        </Notice>
      )}

      {errors.form && (
        <Notice tone="error" live>
          {errors.form}
        </Notice>
      )}

      <form ref={formRef} noValidate onSubmit={onSubmit} className="flex flex-col gap-[18px]">
        <Field id="email" label="Business email" error={errors.email} hint={emailHint}>
          <input
            {...fieldA11y("email", { error: errors.email, hint: emailHint, required: true })}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailState !== "idle") setEmailState("idle");
              if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
            }}
            onBlur={(e) => checkEmail(e.target.value)}
            className={inputClass(!!errors.email)}
          />
          <span aria-live="polite" className="text-[13px]">
            {emailState === "available" && (
              <span className="flex items-center gap-[6px] text-[#067647]">
                <CheckIcon /> Available
              </span>
            )}
          </span>
        </Field>

        <Field id="password" label="Password" error={errors.password}>
          <input
            {...fieldA11y("password", { error: errors.password, hint: true, required: true })}
            aria-describedby={`password-strength${errors.password ? " password-error" : ""}`}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((x) => ({ ...x, password: undefined }));
            }}
            className={inputClass(!!errors.password)}
          />
          <PasswordStrength id="password-strength" password={password} />
        </Field>

        <Field id="confirm_password" label="Confirm password" error={errors.confirm_password}>
          <input
            {...fieldA11y("confirm_password", { error: errors.confirm_password, required: true })}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm_password) setErrors((x) => ({ ...x, confirm_password: undefined }));
            }}
            className={inputClass(!!errors.confirm_password)}
          />
        </Field>

        <Field id="phone" label="Phone number" error={errors.phone}>
          <PhoneInput
            id="phone"
            value={phone}
            required
            invalid={!!errors.phone}
            describedBy={errors.phone ? "phone-error" : undefined}
            onChange={(v) => {
              setPhone(v);
              if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }));
            }}
          />
        </Field>

        <div className="flex flex-col gap-[6px]">
          <label className="m-0 flex items-start gap-3 text-sm leading-[1.5] text-hisa-body">
            <input
              id="terms"
              type="checkbox"
              checked={terms}
              onChange={(e) => {
                setTerms(e.target.checked);
                if (errors.terms_version) setErrors((x) => ({ ...x, terms_version: undefined }));
              }}
              aria-describedby={errors.terms_version ? "terms-error" : undefined}
              aria-invalid={!!errors.terms_version || undefined}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 accent-hisa-primary"
            />
            <span>
              I agree to the{" "}
              <a href={TERMS_URL} className={textLink} target="_blank" rel="noopener noreferrer">
                Terms of Service
              </a>{" "}
              and the{" "}
              <a href={PRIVACY_URL} className={textLink} target="_blank" rel="noopener noreferrer">
                Privacy Notice
              </a>
              , including how MyHisa processes BVN and NIN data under the NDPA.
            </span>
          </label>
          {errors.terms_version && (
            <span id="terms-error" className="text-[13px] text-[#B42318]">
              {errors.terms_version}
            </span>
          )}
        </div>

        <button type="submit" disabled={submitting} className={`${btnPrimaryLg} h-[50px] text-base`}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthSplitLayout>
  );
};

export default Register;
