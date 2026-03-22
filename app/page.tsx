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
      router.push(routes.dashboard);
    } catch (err) {}
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-teal-700 relative">
      {contextHolder}
      <div className="mt-5 fixed">
        <Image src={logo} alt="myHisa" />
      </div>
      <div className="flex flex-col justify-center items-center flex-1">
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
        </AuthCard>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-white">
            Don&apos;t have an account?{" "}
            <Link href={routes.register} className="text-white font-semibold hover:underline cursor-pointer">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
