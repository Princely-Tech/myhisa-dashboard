"use client";
import React, { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "antd";
import PageHeader from "@/components/ui/PageHeader";
import { useShell } from "@/components/shell/ShellContext";
import useRequirePrimaryLogin from "@/utils/useRequirePrimaryLogin";
import { isSandbox } from "@/utils/environment";
import ApiKeysTab from "./ApiKeysTab";
import IpWhitelistTab from "./IpWhitelistTab";
import WebhooksTab from "./WebhooksTab";
import AlertsTab from "./AlertsTab";
import { DevTab, parseDevTab, usePartnerSettings } from "./shared";

// Developers area: API keys · IP whitelist · Webhooks · Alerts, selected by
// ?tab=. Primary login only (middleware via PRIMARY_LOGIN_ONLY_PAGES, plus
// useRequirePrimaryLogin); works before account approval.
const DevelopersContent = () => {
  const authorized = useRequirePrimaryLogin();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const tab = parseDevTab(searchParams?.get("tab"));
  const { user, me } = useShell();
  const current = me ?? user;

  // One GET me/settings shared by the IP whitelist and Alerts tabs.
  const settings = usePartnerSettings(authorized);

  if (!authorized) return null;

  const onTabChange = (key: string) => {
    const next: DevTab = parseDevTab(key);
    router.replace(`${pathname}?tab=${next}`, { scroll: false });
  };

  return (
    <div className="flex flex-col gap-[18px] px-[16px] py-[20px] sm:p-[28px]">
      <PageHeader
        title="Developers"
        subtitle={
          isSandbox
            ? "Sandbox keys, allowed servers, webhooks and alerts for your test integration."
            : "Keys, allowed servers, webhooks and alerts for your integration."
        }
      />
      <Tabs
        activeKey={tab}
        onChange={onTabChange}
        aria-label="Developer settings"
        items={[
          {
            key: "api-keys",
            label: "API keys",
            children: <ApiKeysTab userId={current?.id} email={current?.email} active={tab === "api-keys"} />,
          },
          {
            key: "ip-whitelist",
            label: "IP whitelist",
            children: <IpWhitelistTab settings={settings} userId={current?.id} />,
          },
          { key: "webhooks", label: "Webhooks", children: <WebhooksTab /> },
          { key: "alerts", label: "Alerts", children: <AlertsTab settings={settings} /> },
        ]}
      />
    </div>
  );
};

const DevelopersPage = () => (
  <Suspense fallback={null}>
    <DevelopersContent />
  </Suspense>
);

export default DevelopersPage;
