"use client";
import React, { useEffect, useState } from "react";
import { message, type FormProps } from "antd";
import { AuthCard, BlueButton, FormField, InputField } from "@/components";
import logo from "@/app/icon.png";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import {
  emailFormItemProps,
  passwordFormItemProps,
} from "@/utils/formItemProps";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import Image from "next/image";
import Link from "next/link";
import { CookieSetParams } from "@/utils/types";
type FieldType = {
  email?: string;
  password?: string;
};
const Login: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setIsProcessing(true);
    try {
      const res = await apiService.post({
        endPoint: apiEndpoints.login,
        body: {
          email: values.email,
          password: values.password,
        },
      });
      localStorage.setItem(apiEndpoints.tokenSetUrl, res.data.token);
      localStorage.setItem(apiEndpoints.userSetUrl, JSON.stringify(res.data.user));
      const expires = new Date(Date.now() + 31536000000);
      const userBody: CookieSetParams = {
        cookie: `${apiEndpoints.userSetUrl}=${JSON.stringify(
          res.data.user
        )}; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
      };
      const tokenBody: CookieSetParams = {
        cookie: `${apiEndpoints.tokenSetUrl}=${
          res.data.token
        }; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
      };
      const storeUser = await fetch(apiEndpoints.cookie, {
        method: "POST",
        body: JSON.stringify(userBody),
      });
      const storeToken = await fetch(apiEndpoints.cookie, {
        method: "POST",
        body: JSON.stringify(tokenBody),
      });

      // Backend flags a still-unverified account by including `otp` in the
      // login response (same shape Register uses) - route there instead of
      // straight into the dashboard, which would just fail to load (most of
      // it sits behind the EmailVerified middleware).
      if (res.data.otp) {
        router.push(`${routes.verifyEmail}?email=${encodeURIComponent(values.email || "")}`);
      } else {
        router.push(routes.dashboard);
      }
    } catch (err) {}
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-teal-700 relative">
      {contextHolder}
      <div className="mt-5 fixed">
        <Image src={logo} alt="myHisa" />
      </div>
      {/* <div className="flex flex-col justify-center items-center flex-1"> */}
      <div className="flex flex-col justify-center items-center flex-1 py-24">
        <AuthCard subTitle="Login Account" title="MyHisa" centerTitle={true}>
          <FormField name="login_form" onFinish={onFinish}>
            <InputField
              placeholder="Email Address"
              type="email"
              formItemProps={emailFormItemProps}
            />
            <InputField
              placeholder="Password"
              type="password"
              formItemProps={passwordFormItemProps}
            />
            <BlueButton htmlType="submit" block loading={isProcessing}>
              Continue
            </BlueButton>
          </FormField>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href={routes.register} className="text-teal-700 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </AuthCard>

        <div className="mt-4 text-center">
          <Link
            href={routes.documentation}
            className="text-sm text-white/90 font-medium hover:text-white hover:underline"
          >
            View API &amp; integration docs
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
