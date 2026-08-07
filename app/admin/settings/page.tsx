"use client";
import React, { useEffect, useState } from "react";
import { message, Spin } from "antd";
import { BlueButton } from "@/components";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import useRequirePermission from "@/utils/useRequirePermission";

// Must match the Setting keys in models/settings.go exactly.
const NEW_USER_NOTIFICATION_EMAILS = "NEW_USER_NOTIFICATION_EMAILS";
const NEW_TICKET_NOTIFICATION_EMAILS = "NEW_TICKET_NOTIFICATION_EMAILS";

const AdminSettingsPage: React.FC = () => {
  useRequirePermission("settings.manage");
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUserEmails, setNewUserEmails] = useState("");
  const [newTicketEmails, setNewTicketEmails] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiService.get({ endPoint: apiEndpoints.adminSettings });
      const data = res.data || {};
      setNewUserEmails(data[NEW_USER_NOTIFICATION_EMAILS] || "");
      setNewTicketEmails(data[NEW_TICKET_NOTIFICATION_EMAILS] || "");
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.adminSettings,
        body: {
          [NEW_USER_NOTIFICATION_EMAILS]: newUserEmails,
          [NEW_TICKET_NOTIFICATION_EMAILS]: newTicketEmails,
        },
      });
      messageApi.success("Notification settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
    setSaving(false);
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
        Notification Settings
      </header>

      <div className="max-w-2xl space-y-8">
        <div>
          <h2 className="text-[#344054] font-medium mb-1 text-[16px]">
            New Partner Onboarding Emails
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Notified when a partner registers, and again if they update their registration details
            (e.g. after you send a query). Separate multiple addresses with a comma or a new line.
          </p>
          <textarea
            className="w-full border rounded p-3 text-sm"
            rows={5}
            placeholder={"ops@myhisa.com\ncompliance@myhisa.com"}
            value={newUserEmails}
            onChange={(e) => setNewUserEmails(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-[#344054] font-medium mb-1 text-[16px]">
            New Support Ticket Emails
          </h2>
          <p className="text-sm text-gray-500 mb-2">
            Notified when a partner opens a new ticket, and used as a fallback whenever a partner
            replies to a ticket that has no admin assigned yet. Separate multiple addresses with a
            comma or a new line.
          </p>
          <textarea
            className="w-full border rounded p-3 text-sm"
            rows={5}
            placeholder={"support@myhisa.com"}
            value={newTicketEmails}
            onChange={(e) => setNewTicketEmails(e.target.value)}
          />
        </div>

        <BlueButton onClick={handleSave} loading={saving} className="min-w-[160px] min-h-[44px]">
          Save Settings
        </BlueButton>
      </div>
    </main>
  );
};

export default AdminSettingsPage;
