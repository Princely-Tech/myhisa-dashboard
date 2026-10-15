"use client";
// SANDBOX: test values page - renders GET sandbox/test-values (public
// endpoint; the outcome table and identities come straight from the backend
// simulator, so this page cannot drift from it). Public in sandbox builds
// (see middleware.ts) because the auth-page banner links here.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Card, Descriptions, Spin, Table, Tag, Typography, message } from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { koboToNaira } from "@/utils/helperfunctions";

const { Text } = Typography;

// Shape of sandbox.TestValuesResponse in hisa_go_api (sandbox/testvalues.go).
interface SandboxOutcomeRule {
  suffix: string;
  outcome: string;
  description: string;
}
interface SandboxTestValues {
  environment: string;
  outcomes: SandboxOutcomeRule[];
  default_outcome: string;
  outcome_rule: string;
  pending_resolve_seconds: number;
  customer_validation?: {
    invalid_suffix?: string;
    valid_name?: string;
    valid_address?: string;
    examples?: Record<string, string>;
  };
  identity?: Record<string, string>;
  registration?: Record<string, string>;
  funding?: Record<string, string | number>;
  provider_balance_kobo?: number;
}

const outcomeColor = (outcome: string) =>
  outcome === "Success"
    ? "green"
    : outcome.startsWith("Pending") || outcome.startsWith("Timeout")
    ? "orange"
    : "red";

const label = (key: string) => key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Identity values that are worth a copy button (11-digit test BVN/NIN).
const COPYABLE_IDENTITY_KEYS = ["valid_bvn", "not_found_bvn", "valid_nin", "not_found_nin"];

const SandboxTestValuesPage = () => {
  const [data, setData] = useState<SandboxTestValues | null>(null);
  const [loading, setLoading] = useState(isSandbox);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!isSandbox) return;
    const apiService = new AxiosHandler(messageApi);
    apiService
      // Public endpoint: no Authorization header needed (works logged out).
      .get({ endPoint: apiEndpoints.sandboxTestValues, header: { Accept: "application/json" } })
      .then((res) => setData(res.data as SandboxTestValues))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!isSandbox) {
    return (
      <div className="px-4 py-6 sm:px-8">
        <Alert
          type="info"
          showIcon
          message="Test values are only available on the sandbox dashboard."
        />
      </div>
    );
  }

  const outcomeRows = data
    ? [
        ...data.outcomes,
        {
          suffix: "any other",
          outcome: data.default_outcome,
          description: "Default when no rule above matches.",
        },
      ]
    : [];

  return (
    <div className="px-4 py-4 sm:px-8 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
        <h2 className="text-2xl font-bold m-0">Sandbox Test Values</h2>
        <Link href={routes.documentation} className="text-sm">
          Documentation →
        </Link>
      </div>

      <Spin spinning={loading}>
        {!loading && !data && (
          <Alert type="error" showIcon message="Could not load test values from the sandbox API." />
        )}

        {data && (
          <div className="space-y-4">
            <Card title="Transaction outcomes">
              <p className="text-sm">{data.outcome_rule}</p>
              {data.pending_resolve_seconds > 0 && (
                <p className="text-sm text-gray-600">
                  Pending outcomes resolve on requery after about{" "}
                  {data.pending_resolve_seconds} seconds, or immediately with
                  &quot;Resolve as success / failed&quot; on the pending
                  transactions and transaction lookup pages.
                </p>
              )}
              <Table
                size="small"
                rowKey="suffix"
                pagination={false}
                dataSource={outcomeRows}
                scroll={{ x: 640 }}
                columns={[
                  {
                    title: "Last 4 digits",
                    dataIndex: "suffix",
                    key: "suffix",
                    width: 120,
                    render: (suffix: string) =>
                      /^\d{4}$/.test(suffix) ? <Text code copyable>{suffix}</Text> : <Text type="secondary">{suffix}</Text>,
                  },
                  {
                    title: "Example phone",
                    dataIndex: "suffix",
                    key: "example",
                    width: 170,
                    render: (suffix: string) =>
                      /^\d{4}$/.test(suffix) ? <Text copyable>{`0803000${suffix}`}</Text> : <Text copyable>08030001234</Text>,
                  },
                  {
                    title: "Outcome",
                    dataIndex: "outcome",
                    key: "outcome",
                    width: 200,
                    render: (outcome: string) => <Tag color={outcomeColor(outcome)}>{outcome}</Tag>,
                  },
                  { title: "Explanation", dataIndex: "description", key: "description" },
                ]}
              />
            </Card>

            {data.identity && (
              <Card title="Registration & identity (BVN / NIN / RC)">
                <Descriptions bordered size="small" column={1}>
                  {Object.entries(data.identity).map(([key, value]) => (
                    <Descriptions.Item key={key} label={label(key)}>
                      {COPYABLE_IDENTITY_KEYS.includes(key) || key === "rc_number" ? (
                        <Text copyable={{ text: key === "rc_number" ? "RC1234567" : value }}>{value}</Text>
                      ) : (
                        value
                      )}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {data.customer_validation && (
              <Card title="Meter / smartcard validation">
                <Descriptions bordered size="small" column={1}>
                  {data.customer_validation.invalid_suffix && (
                    <Descriptions.Item label="Invalid if ending in">
                      <Text code copyable>{data.customer_validation.invalid_suffix}</Text>
                    </Descriptions.Item>
                  )}
                  {data.customer_validation.valid_name && (
                    <Descriptions.Item label="Valid customer name">
                      {data.customer_validation.valid_name}
                    </Descriptions.Item>
                  )}
                  {data.customer_validation.valid_address && (
                    <Descriptions.Item label="Valid customer address">
                      {data.customer_validation.valid_address}
                    </Descriptions.Item>
                  )}
                  {Object.entries(data.customer_validation.examples ?? {}).map(([key, value]) => (
                    <Descriptions.Item key={key} label={label(key)}>
                      <Text copyable>{value}</Text>
                    </Descriptions.Item>
                  ))}
                </Descriptions>
              </Card>
            )}

            {data.funding && (
              <Card title="Funding">
                <Descriptions bordered size="small" column={1}>
                  {Object.entries(data.funding).map(([key, value]) => (
                    <Descriptions.Item key={key} label={label(key)}>
                      {key === "max_amount_kobo" && typeof value === "number" ? (
                        `₦${koboToNaira(value)} per call`
                      ) : typeof value === "string" && value.startsWith("POST ") ? (
                        <Text code copyable>{value}</Text>
                      ) : (
                        String(value)
                      )}
                    </Descriptions.Item>
                  ))}
                  {typeof data.provider_balance_kobo === "number" && (
                    <Descriptions.Item label="Simulated provider balance">
                      ₦{koboToNaira(data.provider_balance_kobo)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}
          </div>
        )}
      </Spin>
    </div>
  );
};

export default SandboxTestValuesPage;
