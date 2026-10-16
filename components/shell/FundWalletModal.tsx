"use client";
import React, { useState } from "react";
import { Alert, Button, Form, Input, Modal, Skeleton, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import type { User } from "@/utils/types";
import { isSubLogin } from "@/utils/accountPermissions";
import { btnSecondary } from "@/components/ui/styles";

type Wallet = User["wallet"];

export function fundingDetailsText(wallet: Wallet): string {
  return [wallet.account_number, wallet.bank_name, wallet.account_name]
    .filter((v) => v !== null && v !== undefined && `${v}` !== "")
    .join(" · ");
}

/** Copies text, reporting the outcome through the given message API. */
export async function copyToClipboard(
  text: string,
  messageApi: { success: (c: string) => unknown; error: (c: string) => unknown }
) {
  try {
    await navigator.clipboard.writeText(text);
    messageApi.success("Copied");
  } catch {
    messageApi.error("Couldn't copy - please copy it manually");
  }
}

interface FundWalletModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  me: User | null;
  meLoading: boolean;
  onAccountGenerated: () => void;
}

const FundWalletModal = ({
  open,
  onClose,
  user,
  me,
  meLoading,
  onAccountGenerated,
}: FundWalletModalProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [generating, setGenerating] = useState(false);
  const wallet = me?.wallet ?? null;
  // POST me/generate-account-number is PrimaryLoginOnly on the backend.
  const canGenerate = !!user && !isSubLogin(user);

  // Same call the old dashboard WalletBalances popover made.
  const generateAccount = async (bvn: string) => {
    setGenerating(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({ endPoint: apiEndpoints.generateAccount, body: { bvn } });
      messageApi.success("Account was created");
      onAccountGenerated();
    } catch {
      // AxiosHandler already showed the backend's message.
    }
    setGenerating(false);
  };

  return (
    <Modal open={open} onCancel={onClose} footer={null} title="Fund your wallet">
      {contextHolder}
      {meLoading && !wallet ? (
        <Skeleton active title={false} paragraph={{ rows: 3 }} />
      ) : wallet?.account_number ? (
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm text-hisa-muted">
            Transfer any amount to your dedicated account. Your wallet is credited automatically
            once the bank confirms the transfer.
          </p>
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-hisa-ground p-[16px] text-sm">
            <dt className="text-hisa-muted">Account number</dt>
            <dd className="m-0 font-mono text-[15px] font-medium text-hisa-ink">
              {wallet.account_number}
            </dd>
            <dt className="text-hisa-muted">Bank</dt>
            <dd className="m-0 text-hisa-ink">{wallet.bank_name ?? "—"}</dd>
            <dt className="text-hisa-muted">Account name</dt>
            <dd className="m-0 text-hisa-ink">{wallet.account_name ?? "—"}</dd>
          </dl>
          <button
            type="button"
            className={`${btnSecondary} self-start`}
            onClick={() => copyToClipboard(fundingDetailsText(wallet), messageApi)}
          >
            <CopyOutlined aria-hidden="true" /> Copy account details
          </button>
          {wallet.is_account_active === false && (
            <Alert
              type="warning"
              showIcon
              message="Your wallet is currently blocked"
              description={wallet.block_reason || "Contact support for details."}
            />
          )}
        </div>
      ) : wallet ? (
        canGenerate ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm text-hisa-muted">
              You don&apos;t have a funding account yet. Enter your BVN to generate a dedicated
              account number for wallet top-ups.
            </p>
            <Form
              layout="vertical"
              requiredMark={false}
              onFinish={(values: { bvn: string }) => generateAccount(values.bvn)}
            >
              <Form.Item
                label="BVN"
                name="bvn"
                rules={[{ required: true, message: "BVN is required to create an account" }]}
              >
                <Input inputMode="numeric" autoComplete="off" maxLength={11} placeholder="11-digit BVN" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={generating}>
                Generate account
              </Button>
            </Form>
          </div>
        ) : (
          <p className="m-0 text-sm text-hisa-muted">
            No funding account has been set up yet. Ask the account owner to generate one from
            their dashboard.
          </p>
        )
      ) : (
        <p className="m-0 text-sm text-hisa-muted">
          We couldn&apos;t load your wallet details. Close this and try again.
        </p>
      )}
    </Modal>
  );
};

export default FundWalletModal;
