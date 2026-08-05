"use client";
import React, { useEffect, useState } from "react";
import { message, type FormProps } from "antd";
import { AuthCard, BlueButton, FormField, InputField } from "@/components";
import logo from "@/app/icon.png";
import { useRouter, useSearchParams } from "next/navigation";
import routes from "@/utils/routes";
import { otpFormItemProps } from "@/utils/formItemProps";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import Image from "next/image";
import Link from "next/link";
import { CookieSetParams } from "@/utils/types";

type FieldType = {
  otp?: string;
};

// Cooldown (seconds) before "Resend code" can be pressed again - purely a
// client-side spam guard, the backend has no rate limit of its own on
// resend-verification-otp.
const RESEND_COOLDOWN_SECONDS = 30;

const VerifyEmail: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    // The email address survives a page refresh two ways: the query string
    // (set when Login/Register redirect here) or, failing that, whichever
    // account is still sitting in localStorage from that same redirect.
    const fromQuery = searchParams.get("email");
    if (fromQuery) {
      setEmail(fromQuery);
      return;
    }
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    if (raw) {
      try {
        setEmail((JSON.parse(raw) as { email?: string }).email || "");
      } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((secs) => Math.max(0, secs - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    if (!email) {
      messageApi.error("We couldn't tell which account to verify. Please log in again.");
      return;
    }
    setIsVerifying(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.verifyEmail,
        body: { email, otp: values.otp },
      });
      messageApi.success("Email verified successfully!");
      await syncVerifiedSession();
    } catch (err) {}
    setIsVerifying(false);
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    setIsResending(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.resendVerificationOtp,
        body: { email },
      });
      messageApi.success("A new verification code has been sent to your email");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {}
    setIsResending(false);
  };

  // After a successful verify, refresh the stored user from /me (now
  // reachable - EmailVerified middleware no longer blocks it) so the rest
  // of the app sees email_verified_at set without requiring a re-login. If
  // there's no session token (e.g. this tab never logged in - the link was
  // opened fresh), fall back to sending them to log in normally.
  const syncVerifiedSession = async () => {
    const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
    if (!token) {
      router.push(routes.login);
      return;
    }
    try {
      const res = await apiService.get({ endPoint: apiEndpoints.me });
      localStorage.setItem(apiEndpoints.userSetUrl, JSON.stringify(res.data));
      const expires = new Date(Date.now() + 31536000000);
      const userBody: CookieSetParams = {
        cookie: `${apiEndpoints.userSetUrl}=${JSON.stringify(
          res.data
        )}; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
      };
      await fetch(apiEndpoints.cookie, { method: "POST", body: JSON.stringify(userBody) });
      router.push(routes.dashboard);
    } catch (err) {
      router.push(routes.login);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-teal-700 relative">
      {contextHolder}
      <div className="mt-5 fixed">
        <Image src={logo} alt="myHisa" />
      </div>
      <div className="flex flex-col justify-center items-center flex-1">
        <AuthCard subTitle="Verify Your Email" title="MyHisa" centerTitle={true}>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 text-sm">
              {email ? (
                <>
                  We&apos;ve sent a 6-digit verification code to{" "}
                  <strong>{email}</strong>. Enter it below to continue.
                </>
              ) : (
                "We've sent a 6-digit verification code to your email. Enter it below to continue."
              )}
            </p>
          </div>

          <FormField name="verify_email_form" onFinish={onFinish}>
            <InputField
              placeholder="6-digit code"
              type="text"
              maxLength={6}
              formItemProps={otpFormItemProps}
            />
            <BlueButton htmlType="submit" block loading={isVerifying}>
              Verify Email
            </BlueButton>
          </FormField>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t get a code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending || resendCooldown > 0}
                className="text-teal-700 font-semibold hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Resend code"}
              </button>
            </p>
          </div>

          <div className="mt-2 text-center">
            <p className="text-sm text-gray-600">
              Wrong account?{" "}
              <Link href={routes.login} className="text-teal-700 font-semibold hover:underline">
                Log in again
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default VerifyEmail;
