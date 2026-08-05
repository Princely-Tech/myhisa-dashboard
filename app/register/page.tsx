"use client";
import React, { useState } from "react";
import { message, type FormProps, Modal, Form, Select, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { AuthCard, BlueButton, FormField, InputField } from "@/components";
import logo from "@/app/icon.png";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import {
  emailFormItemProps,
  passwordFormItemProps,
  nameFormItemProps,
  phoneFormItemProps,
  rcNumberFormItemProps,
  contactPersonNameFormItemProps,
  contactPersonDesignationFormItemProps,
  contactPersonPhoneFormItemProps,
  contactPersonEmailFormItemProps,
  bvnFormItemProps,
  ninFormItemProps,
  partnerTypeFormItemProps,
} from "@/utils/formItemProps";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { CookieSetParams, PartnerType } from "@/utils/types";
import Image from "next/image";
import Link from "next/link";
import type { UploadProps } from "antd";

const { Dragger } = Upload;

type FieldType = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  rc_number?: string;
  contact_person_name?: string;
  contact_person_designation?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  bvn?: string;
  nin?: string;
  partner_type?: PartnerType;
};

const KYC_MAX_FILE_SIZE_MB = 5;

const Register: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<FieldType>();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [registeredEmail, setRegisteredEmail] = useState<string>("");
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [utilityFile, setUtilityFile] = useState<File | null>(null);

  const partnerType = Form.useWatch("partner_type", form);
  const isBank = partnerType === "bank";

  const validateDocument = (file: File): boolean => {
    const isAllowedType = ["application/pdf", "image/jpeg", "image/png"].includes(file.type);
    if (!isAllowedType) {
      messageApi.error("Only PDF, JPG and PNG files are allowed!");
      return false;
    }
    const isWithinSize = file.size / 1024 / 1024 < KYC_MAX_FILE_SIZE_MB;
    if (!isWithinSize) {
      messageApi.error(`File must be smaller than ${KYC_MAX_FILE_SIZE_MB}MB!`);
      return false;
    }
    return true;
  };

  const cacUploadProps: UploadProps = {
    name: "cac_certificate",
    multiple: false,
    accept: ".pdf,.jpg,.jpeg,.png",
    beforeUpload: (file) => {
      if (!validateDocument(file)) return false;
      setCacFile(file);
      return false;
    },
    onRemove: () => setCacFile(null),
    fileList: cacFile ? [cacFile as any] : [],
  };

  const utilityUploadProps: UploadProps = {
    name: "utility_bill",
    multiple: false,
    accept: ".pdf,.jpg,.jpeg,.png",
    beforeUpload: (file) => {
      if (!validateDocument(file)) return false;
      setUtilityFile(file);
      return false;
    },
    onRemove: () => setUtilityFile(null),
    fileList: utilityFile ? [utilityFile as any] : [],
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    if (!cacFile) {
      messageApi.error("Please upload your CAC Certificate");
      return;
    }
    if (!isBank && !utilityFile) {
      messageApi.error("Please upload a Utility Bill (required for non-bank partners)");
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name || "");
      formData.append("email", values.email || "");
      formData.append("phone", values.phone || "");
      formData.append("password", values.password || "");
      formData.append("rc_number", values.rc_number || "");
      formData.append("contact_person_name", values.contact_person_name || "");
      formData.append("contact_person_designation", values.contact_person_designation || "");
      formData.append("contact_person_phone", values.contact_person_phone || "");
      formData.append("contact_person_email", values.contact_person_email || "");
      formData.append("bvn", values.bvn || "");
      formData.append("nin", values.nin || "");
      formData.append("partner_type", values.partner_type || "");
      formData.append("cac_certificate", cacFile);
      if (!isBank && utilityFile) {
        formData.append("utility_bill", utilityFile);
      }

      const response = await fetch(`${apiEndpoints.base}${apiEndpoints.register}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.data) {
        setRegisteredEmail(values.email || "");
        setShowSuccessModal(true);
        messageApi.success("Account created successfully!");

        // Register logs the account in the same way Login does (a token is
        // always issued, verified or not) - stash it now so the
        // verification screen the modal sends them to next can call /me
        // once they've entered the OTP, without making them log in again.
        if (result.data.token) {
          localStorage.setItem(apiEndpoints.tokenSetUrl, result.data.token);
          localStorage.setItem(apiEndpoints.userSetUrl, JSON.stringify(result.data.user));
          const expires = new Date(Date.now() + 31536000000);
          const userBody: CookieSetParams = {
            cookie: `${apiEndpoints.userSetUrl}=${JSON.stringify(
              result.data.user
            )}; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
          };
          const tokenBody: CookieSetParams = {
            cookie: `${apiEndpoints.tokenSetUrl}=${
              result.data.token
            }; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
          };
          await fetch(apiEndpoints.cookie, { method: "POST", body: JSON.stringify(userBody) });
          await fetch(apiEndpoints.cookie, { method: "POST", body: JSON.stringify(tokenBody) });
        }
      } else {
        messageApi.error(result.message || result.error || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      messageApi.error("An error occurred. Try again");
    }
    setIsProcessing(false);
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    router.push(`${routes.verifyEmail}?email=${encodeURIComponent(registeredEmail)}`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-teal-700 relative overflow-y-auto">
      {contextHolder}
      <div className="mt-5 fixed">
        <Image src={logo} alt="myHisa" />
      </div>
      <div className="flex flex-col justify-center items-center flex-1 py-24">
        <AuthCard subTitle="Create Account" title="MyHisa" centerTitle={true}>
          <FormField name="register_form" form={form} onFinish={onFinish}>
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
              placeholder="Preferred Password"
              type="password"
              formItemProps={passwordFormItemProps}
            />
            <InputField
              placeholder="RC Number"
              type="text"
              formItemProps={rcNumberFormItemProps}
            />
            <InputField
              placeholder="Contact Person Name"
              type="text"
              formItemProps={contactPersonNameFormItemProps}
            />
            <InputField
              placeholder="Contact Person Designation"
              type="text"
              formItemProps={contactPersonDesignationFormItemProps}
            />
            <InputField
              placeholder="Contact Person Phone Number"
              type="tel"
              formItemProps={contactPersonPhoneFormItemProps}
            />
            <InputField
              placeholder="Contact Person Email Address"
              type="email"
              formItemProps={contactPersonEmailFormItemProps}
            />
            <InputField
              placeholder="BVN"
              type="text"
              formItemProps={bvnFormItemProps}
            />
            <InputField
              placeholder="NIN"
              type="text"
              formItemProps={ninFormItemProps}
            />

            <h2 className="text-[#344054] font-medium mb-1 text-[14px]">
              Partner Type
            </h2>
            <Form.Item {...partnerTypeFormItemProps}>
              <Select placeholder="Select partner type" style={{ width: "100%" }}>
                <Select.Option value="bank">Bank</Select.Option>
                <Select.Option value="non_bank">Non-Bank</Select.Option>
              </Select>
            </Form.Item>

            <div className="mb-4">
              <h2 className="text-[#344054] font-medium mb-1 text-[14px]">
                CAC Certificate
              </h2>
              <Dragger {...cacUploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                  Click or drag file to this area to upload
                </p>
                <p className="ant-upload-hint">
                  PDF, JPG or PNG. Max {KYC_MAX_FILE_SIZE_MB}MB. Required.
                </p>
              </Dragger>
            </div>

            {!isBank && (
              <div className="mb-4">
                <h2 className="text-[#344054] font-medium mb-1 text-[14px]">
                  Utility Bill
                </h2>
                <Dragger {...utilityUploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    PDF, JPG or PNG. Max {KYC_MAX_FILE_SIZE_MB}MB. Required for
                    non-bank partners.
                  </p>
                </Dragger>
              </div>
            )}

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
            Continue to Verification
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
              Your registration has been received and will be reviewed within a
              maximum of 24 hours. You will receive an email as soon as your
              account is approved and activated.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 font-medium">📧 Check Your Email</p>
            <p className="text-yellow-600 text-sm mt-2">
              An OTP has been sent to your email address to verify it. We've also
              sent your auto-generated API key in a separate email - keep it safe.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Register;
