"use client";
// SANDBOX: "Resolve as success" / "Resolve as failed" buttons for a pending
// sandbox transaction, calling POST sandbox/transactions/:ref/resolve.
//
// Renders nothing on live builds, for sub-logins (the backend route is
// PrimaryLoginOnly) or when the status is not pending-like. `reference` is
// the transaction_id (the backend also accepts the external_ref); the backend
// itself picks the current provider attempt ref, so ref_to_telco is NOT used.
import React, { useEffect, useState } from "react";
import { Button, Popconfirm, Space, message } from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { isSandbox, SANDBOX_RESOLVABLE_STATUSES } from "@/utils/environment";
import { isSubLogin } from "@/utils/accountPermissions";
import { User } from "@/utils/types";

type Outcome = "success" | "failed";

export function isSandboxResolvable(status?: string | null, refundedAt?: string | null): boolean {
  return isSandbox && !!status && SANDBOX_RESOLVABLE_STATUSES.includes(status) && !refundedAt;
}

const SandboxResolveActions = ({
  reference,
  status,
  refundedAt,
  onResolved,
}: {
  reference: string;
  status?: string | null;
  refundedAt?: string | null;
  onResolved?: () => void;
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState<Outcome | null>(null);
  const [primaryLogin, setPrimaryLogin] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(apiEndpoints.userSetUrl);
      setPrimaryLogin(!!raw && !isSubLogin(JSON.parse(raw) as User));
    } catch {
      setPrimaryLogin(false);
    }
  }, []);

  if (!reference || !primaryLogin || !isSandboxResolvable(status, refundedAt)) {
    return null;
  }

  const resolve = async (outcome: Outcome) => {
    setLoading(outcome);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.post({
        endPoint: apiEndpoints.sandboxResolveTransaction(reference),
        body: { outcome },
      });
      const current: unknown = res?.data?.current_status;
      messageApi.success(
        `${res?.message ?? "Transaction updated"}${
          typeof current === "string" ? ` - status: ${current}` : ""
        }`
      );
      onResolved?.();
    } catch (err) {
      // AxiosHandler already showed the backend's message.
    }
    setLoading(null);
  };

  return (
    <>
      {contextHolder}
      <Space size={4} wrap>
        <Popconfirm
          title="Resolve this sandbox transaction as successful?"
          onConfirm={() => resolve("success")}
        >
          <Button size="small" type="primary" ghost loading={loading === "success"} disabled={loading !== null}>
            Resolve as success
          </Button>
        </Popconfirm>
        <Popconfirm
          title="Resolve this sandbox transaction as failed (refunds the wallet)?"
          onConfirm={() => resolve("failed")}
        >
          <Button size="small" danger loading={loading === "failed"} disabled={loading !== null}>
            Resolve as failed
          </Button>
        </Popconfirm>
      </Space>
    </>
  );
};

export default SandboxResolveActions;
