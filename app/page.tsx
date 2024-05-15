"use client";
import React, { useEffect, useState } from "react";
import { type FormProps } from "antd";
import { AuthCard, BlueButton, FormField, InputField } from "@/components";
import PhoneInput from "react-phone-number-input";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import {
  emailFormItemProps,
  passwordFormItemProps,
} from "@/utils/formItemProps";
type FieldType = {
  email?: string;
  password?: string;
};
const Login: React.FC = () => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    setIsProcessing(true);
    setTimeout(() => {
      router.push(routes.dashboard);
    }, 2000);
  };

  return (
    <div className="flex justify-center items-center  h-screen w-screen bg-teal-700">
      {" "}
      <AuthCard title="Login Account">
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
    </div>
  );
};

export default Login;
