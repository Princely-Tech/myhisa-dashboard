"use client";
// SANDBOX: "Sandbox tools" card on the dashboard home - only rendered by
// app/dashboard/page.tsx when isSandbox (and for the primary login, since the
// backend's fund/bank-transfer routes are PrimaryLoginOnly).
import React, { useState } from "react";
import Link from "next/link";
import { Button, Card, Input, InputNumber, message } from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { koboToNaira } from "@/utils/helperfunctions";

// Backend cap (sandbox.MaxFundKoboPerCall): ₦10,000,000 per call.
const MAX_NAIRA_PER_CALL = 10_000_000;
const PRESETS_NAIRA = [10_000, 100_000, 1_000_000];

const nairaToKobo = (naira: number) => Math.round(naira * 100);

const SandboxTools = ({ onFunded }: { onFunded: () => void }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [fundNaira, setFundNaira] = useState<number | null>(100_000);
  const [funding, setFunding] = useState(false);
  const [transferNaira, setTransferNaira] = useState<number | null>(50_000);
  const [senderName, setSenderName] = useState<string>("Ada Test");
  const [transferring, setTransferring] = useState(false);

  const validAmount = (naira: number | null): naira is number =>
    naira !== null && naira > 0 && naira <= MAX_NAIRA_PER_CALL;

  const addTestFunds = async (naira: number | null) => {
    if (!validAmount(naira)) {
      messageApi.warning(`Enter an amount between ₦0.01 and ₦${MAX_NAIRA_PER_CALL.toLocaleString()}`);
      return;
    }
    setFunding(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.post({
        endPoint: apiEndpoints.sandboxWalletFund,
        body: { amount_kobo: nairaToKobo(naira) },
      });
      const balanceKobo: unknown = res?.data?.balance_kobo;
      messageApi.success(
        typeof balanceKobo === "number"
          ? `Added ₦${naira.toLocaleString()} test funds. New balance ₦${koboToNaira(balanceKobo)}`
          : `Added ₦${naira.toLocaleString()} test funds`
      );
      onFunded();
    } catch (err) {
      // AxiosHandler already showed the backend's message.
    }
    setFunding(false);
  };

  const simulateBankTransfer = async () => {
    if (!validAmount(transferNaira)) {
      messageApi.warning(`Enter an amount between ₦0.01 and ₦${MAX_NAIRA_PER_CALL.toLocaleString()}`);
      return;
    }
    setTransferring(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.post({
        endPoint: apiEndpoints.sandboxBankTransfer,
        body: {
          amount_kobo: nairaToKobo(transferNaira),
          sender_name: senderName.trim(),
        },
      });
      const ref: unknown = res?.data?.transaction_reference;
      messageApi.success(
        `Simulated transfer of ₦${transferNaira.toLocaleString()} received${
          typeof ref === "string" ? ` (ref ${ref})` : ""
        }`
      );
      onFunded();
    } catch (err) {
      // AxiosHandler already showed the backend's message (e.g. "Generate
      // your sandbox account number first").
    }
    setTransferring(false);
  };

  return (
    <Card
      className="mb-4 !border-amber-300"
      title={
        <span>
          Sandbox tools <span className="text-xs font-normal text-gray-500">(test money only)</span>
        </span>
      }
      extra={<Link href={routes.sandboxTestValues}>Test values →</Link>}
    >
      {contextHolder}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="text-[15px] font-semibold mb-2">Add test funds</h4>
          <div className="flex flex-wrap gap-2 mb-2">
            {PRESETS_NAIRA.map((preset) => (
              <Button
                key={preset}
                size="small"
                disabled={funding}
                onClick={() => {
                  setFundNaira(preset);
                  addTestFunds(preset);
                }}
              >
                ₦{preset >= 1_000_000 ? `${preset / 1_000_000}m` : `${preset / 1_000}k`}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <InputNumber
              prefix="₦"
              min={0.01}
              max={MAX_NAIRA_PER_CALL}
              step={1000}
              precision={2}
              value={fundNaira}
              onChange={(value) => setFundNaira(typeof value === "number" ? value : null)}
              style={{ width: 200 }}
            />
            <Button type="primary" loading={funding} onClick={() => addTestFunds(fundNaira)}>
              Add funds
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 mb-0">
            Credits your main wallet instantly. Max ₦{MAX_NAIRA_PER_CALL.toLocaleString()} per call.
          </p>
        </div>

        <div>
          <h4 className="text-[15px] font-semibold mb-2">Simulate bank transfer</h4>
          <div className="flex flex-wrap gap-2">
            <InputNumber
              prefix="₦"
              min={0.01}
              max={MAX_NAIRA_PER_CALL}
              step={1000}
              precision={2}
              value={transferNaira}
              onChange={(value) => setTransferNaira(typeof value === "number" ? value : null)}
              style={{ width: 160 }}
            />
            <Input
              placeholder="Sender name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              style={{ width: 160 }}
            />
            <Button type="primary" loading={transferring} onClick={simulateBankTransfer}>
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 mb-0">
            Simulates an inbound transfer to your reserved Sandbox Bank account
            (generate it first under Wallet Balances with a test BVN, e.g. 22200000001).
          </p>
        </div>
      </div>
    </Card>
  );
};

export default SandboxTools;
