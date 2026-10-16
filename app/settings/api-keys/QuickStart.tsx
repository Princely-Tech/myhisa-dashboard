"use client";
import React from "react";
import { message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { isSandbox } from "@/utils/environment";
import { focusRing } from "@/components/ui/styles";
import { copyText } from "./shared";

// Field names follow AirtimeInput in hisa_go_api controllers/telco/telco.go
// (network: mtn | airtel | glo | ninemobile; amount in kobo; ref optional).
function airtimeUrl(): string {
  const base = apiEndpoints.base || "https://YOUR-API-HOST/api/";
  return `${base.endsWith("/") ? base : `${base}/`}airtime`;
}

export function buildCurlExample(): string {
  const body = JSON.stringify({
    network: "mtn",
    msisdn: "08031234567",
    amount: 10000,
    ref: "your-unique-ref-001",
  });
  return [
    `curl -X POST ${airtimeUrl()} \\`,
    `  -H "Authorization: Bearer $HISA_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${body}'`,
  ].join("\n");
}

const QuickStart = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const snippet = buildCurlExample();

  return (
    <section
      aria-labelledby="quickstart-heading"
      className="flex min-w-0 flex-col gap-3 rounded-2xl bg-hisa-navy p-[20px] text-[#E6EBFA] sm:px-[24px]"
    >
      {contextHolder}
      <div className="flex items-center justify-between gap-3">
        <h2 id="quickstart-heading" className="m-0 font-heading text-[17px] font-bold text-white">
          Quick start
        </h2>
        <button
          type="button"
          aria-label="Copy curl example"
          onClick={async () => {
            const ok = await copyText(snippet);
            if (ok) messageApi.success("Example copied");
            else messageApi.error("Couldn't copy. Select the text and copy it manually.");
          }}
          className={`inline-flex h-9 items-center gap-2 rounded-[8px] border-[1px] border-solid border-[#3A4F8F] bg-transparent px-[12px] text-sm text-white transition-colors hover:bg-[#13265F] ${focusRing} focus-visible:ring-offset-hisa-navy`}
        >
          <CopyOutlined aria-hidden="true" /> Copy
        </button>
      </div>
      <pre
        tabIndex={0}
        aria-label="curl example: buy airtime"
        className={`m-0 overflow-x-auto whitespace-pre rounded-[10px] bg-[#13265F] px-[16px] py-[14px] font-mono text-[13px] leading-[1.6] text-[#E6EBFA] ${focusRing} focus-visible:ring-offset-hisa-navy`}
      >
        {snippet}
      </pre>
      <span className="text-[13px] text-[#9FB0E0]">
        Amounts are in kobo (10000 = ₦100). <span className="font-mono">network</span> is mtn, airtel, glo or
        ninemobile; <span className="font-mono">ref</span> is your own unique reference.{" "}
        {isSandbox
          ? "This dashboard is the sandbox: test away."
          : "Use your test key against the sandbox first. Live purchases need an approved account."}
      </span>
    </section>
  );
};

export default QuickStart;
