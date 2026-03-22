"use client";
import React, { useState } from "react";
import { message, type FormProps, Modal } from "antd";
import { AuthCard, BlueButton, FormField, InputField } from "@/components";
import logo from "@/app/icon.png";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import {
  emailFormItemProps,
  passwordFormItemProps,
  nameFormItemProps,
  phoneFormItemProps,
} from "@/utils/formItemProps";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import Image from "next/image";
import Link from "next/link";

type FieldType = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
};

const Register: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    setIsProcessing(true);
    try {
      const res = await apiService.post({
        endPoint: apiEndpoints.register,
        body: {
          name: values.name,
          email: values.email,
          phone: values.phone,
          password: values.password,
        },
      });

      if (res.data) {
        setRegisteredEmail(values.email || "");
        setShowSuccessModal(true);
        messageApi.success("Account created successfully!");
      }
    } catch (err) {
      console.error("Registration error:", err);
    }
    setIsProcessing(false);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push(routes.login);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-teal-700 relative">
      {contextHolder}
      <div className="mt-5 fixed">
        <Image src={logo} alt="myHisa" />
      </div>
      <div className="flex flex-col justify-center items-center flex-1">
        <AuthCard subTitle="Create Account" title="MyHisa" centerTitle={true}>
          <FormField name="register_form" onFinish={onFinish}>
            <InputField
              placeholder="Business Name"
              type="text"
              formItemProps={nameFormItemProps}
            />
            <InputField
              placeholder="Email Address"
              type="email"
              formItemProps={emailFormItemProps}
            />
            <InputField
              placeholder="Phone Number"
              type="tel"
              formItemProps={phoneFormItemProps}
            />
            <InputField
              placeholder="Password"
              type="password"
              formItemProps={passwordFormItemProps}
            />
            <BlueButton htmlType="submit" block loading={isProcessing}>
              Create Account
            </BlueButton>
          </FormField>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link href={routes.login} className="text-teal-700 font-semibold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </AuthCard>
      </div>

      <Modal
        title="Account Created Successfully"
        open={showSuccessModal}
        onOk={handleModalClose}
        onCancel={handleModalClose}
        footer={[
          <BlueButton key="ok" onClick={handleModalClose}>
            Go to Login
          </BlueButton>
        ]}
        width={500}
      >
        <div className="space-y-4 py-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-800 font-medium">✓ Registration Successful!</p>
            <p className="text-green-600 text-sm mt-2">
              Your account has been created with email: <strong>{registeredEmail}</strong>
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-800 font-medium">⏳ Account Activation Required</p>
            <p className="text-blue-600 text-sm mt-2">
              Your account is currently pending approval. An administrator will review and activate your account shortly.
            </p>
            <p className="text-blue-600 text-sm mt-2">
              You will be able to log in once your account has been activated by an admin.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 font-medium">📧 Email Verification</p>
            <p className="text-yellow-600 text-sm mt-2">
              An OTP has been sent to your email address. Please check your inbox to verify your email.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
