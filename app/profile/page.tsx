"use client";
import React, { useEffect, useState } from "react";
import { message, Form, Select, Upload, Alert, Spin } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { BlueButton, FormField, InputField } from "@/components";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { CookieSetParams, PartnerType, User } from "@/utils/types";
import { isApproved, isSubLogin } from "@/utils/accountPermissions";
import {
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

const { Dragger } = Upload;
const KYC_MAX_FILE_SIZE_MB = 5;

type FieldType = {
  name?: string;
  phone?: string;
  rc_number?: string;
  contact_person_name?: string;
  contact_person_designation?: string;
  contact_person_phone?: string;
  contact_person_email?: string;
  bvn?: string;
  nin?: string;
  partner_type?: PartnerType;
};

const ProfilePage: React.FC = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const [form] = Form.useForm<FieldType>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cacFile, setCacFile] = useState<File | null>(null);
  const [utilityFile, setUtilityFile] = useState<File | null>(null);

  const partnerType = Form.useWatch("partner_type", form);
  const isBank = partnerType === "bank";
  const approved = isApproved(user);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiService.get({ endPoint: apiEndpoints.me });
      const u: User = res.data;
      setUser(u);
      form.setFieldsValue({
        name: u.name,
        phone: u.phone,
        rc_number: u.rc_number || "",
        contact_person_name: u.contact_person_name || "",
        contact_person_designation: u.contact_person_designation || "",
        contact_person_phone: u.contact_person_phone || "",
        contact_person_email: u.contact_person_email || "",
        bvn: u.bvn || "",
        nin: u.nin || "",
        partner_type: u.partner_type || undefined,
      });
    } catch (err) {
      console.error("Failed to load profile:", err);
    }
    setLoading(false);
  };

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

  const onFinish = async (values: FieldType) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name || "");
      formData.append("phone", values.phone || "");
      formData.append("rc_number", values.rc_number || "");
      formData.append("contact_person_name", values.contact_person_name || "");
      formData.append("contact_person_designation", values.contact_person_designation || "");
      formData.append("contact_person_phone", values.contact_person_phone || "");
      formData.append("contact_person_email", values.contact_person_email || "");
      formData.append("bvn", values.bvn || "");
      formData.append("nin", values.nin || "");
      formData.append("partner_type", values.partner_type || "");
      if (cacFile) formData.append("cac_certificate", cacFile);
      if (utilityFile) formData.append("utility_bill", utilityFile);

      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(`${apiEndpoints.base}${apiEndpoints.updateRegistration}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await response.json();

      if (response.ok && result.data) {
        messageApi.success("Registration details updated successfully");
        setUser(result.data);
        setCacFile(null);
        setUtilityFile(null);

        // Keep localStorage/cookie in sync with what was just saved, same as
        // the login flow, so the rest of the app (sidebar, greeting, etc.)
        // reflects the change without requiring a re-login.
        localStorage.setItem(apiEndpoints.userSetUrl, JSON.stringify(result.data));
        const expires = new Date(Date.now() + 31536000000);
        const userBody: CookieSetParams = {
          cookie: `${apiEndpoints.userSetUrl}=${JSON.stringify(
            result.data
          )}; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
        };
        await fetch(apiEndpoints.cookie, { method: "POST", body: JSON.stringify(userBody) });
      } else {
        messageApi.error(result.message || result.error || "Failed to update registration details");
      }
    } catch (err) {
      console.error("Update registration error:", err);
      messageApi.error("An error occurred. Try again");
    }
    setSaving(false);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return null;
    return new Date(value).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <main className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}
      <header className="text-[30px] font-medium mt-[10px] mb-[20px]">
        My Registration
      </header>

      <div className="max-w-2xl">
        <div className="mb-4">
          {approved ? (
            <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded">Approved</span>
          ) : (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded">Pending Approval</span>
          )}
        </div>

        {!approved && user?.registration_query && (
          <Alert
            className="mb-4"
            type="warning"
            showIcon
            message="Action needed on your registration"
            description={
              <div>
                <p>
                  <strong>Admin note:</strong> {user.registration_query}
                </p>
                {user.registration_query_at && (
                  <p className="text-xs text-gray-500 mt-1">
                    Sent {formatDate(user.registration_query_at)}
                  </p>
                )}
                <p className="mt-2">Please update the relevant details below and save.</p>
              </div>
            }
          />
        )}

        {approved && (
          <Alert
            className="mb-4"
            type="info"
            showIcon
            message="Your account is approved"
            description="Registration details can no longer be edited here. Contact support if anything needs to change."
          />
        )}

        {isSubLogin(user) ? (
          <Alert
            type="info"
            showIcon
            message="Sub-login accounts cannot view or edit registration details"
          />
        ) : (
          <FormField form={form} name="profile_form" onFinish={onFinish} disabled={approved}>
            <InputField placeholder="Business Name" type="text" formItemProps={nameFormItemProps} />
            <InputField
              placeholder="Phone Number"
              type="tel"
              disabled={approved}
              formItemProps={phoneFormItemProps}
            />
            <InputField placeholder="RC Number" type="text" formItemProps={rcNumberFormItemProps} />
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
              disabled={approved}
              formItemProps={contactPersonPhoneFormItemProps}
            />
            <InputField
              placeholder="Contact Person Email Address"
              type="email"
              formItemProps={contactPersonEmailFormItemProps}
            />
            <InputField placeholder="BVN" type="text" formItemProps={bvnFormItemProps} />
            <InputField placeholder="NIN" type="text" formItemProps={ninFormItemProps} />

            <h2 className="text-[#344054] font-medium mb-1 text-[14px]">Partner Type</h2>
            <Form.Item {...partnerTypeFormItemProps}>
              <Select placeholder="Select partner type" style={{ width: "100%" }} disabled={approved}>
                <Select.Option value="bank">Bank</Select.Option>
                <Select.Option value="non_bank">Non-Bank</Select.Option>
              </Select>
            </Form.Item>

            <div className="mb-4">
              <h2 className="text-[#344054] font-medium mb-1 text-[14px]">CAC Certificate</h2>
              <p className="text-xs text-gray-500 mb-2">
                {user?.cac_certificate_uploaded_at
                  ? `On file - uploaded ${formatDate(user.cac_certificate_uploaded_at)}`
                  : "Not uploaded"}
              </p>
              {!approved && (
                <Dragger {...cacUploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag a file to replace the current document
                  </p>
                  <p className="ant-upload-hint">
                    PDF, JPG or PNG. Max {KYC_MAX_FILE_SIZE_MB}MB. Leave blank to keep the current
                    document.
                  </p>
                </Dragger>
              )}
            </div>

            {!isBank && (
              <div className="mb-4">
                <h2 className="text-[#344054] font-medium mb-1 text-[14px]">Utility Bill</h2>
                <p className="text-xs text-gray-500 mb-2">
                  {user?.utility_bill_uploaded_at
                    ? `On file - uploaded ${formatDate(user.utility_bill_uploaded_at)}`
                    : "Not uploaded"}
                </p>
                {!approved && (
                  <Dragger {...utilityUploadProps}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag a file to replace the current document
                    </p>
                    <p className="ant-upload-hint">
                      PDF, JPG or PNG. Max {KYC_MAX_FILE_SIZE_MB}MB. Leave blank to keep the current
                      document.
                    </p>
                  </Dragger>
                )}
              </div>
            )}

            {!approved && (
              <BlueButton htmlType="submit" loading={saving} className="min-w-[160px] min-h-[44px]">
                Save Changes
              </BlueButton>
            )}
          </FormField>
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
