"use client";
import { useEffect, useState } from "react";
import { Card, Spin, message, Table, Tag, Modal, Input } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, CustomButton } from "@/components/buttons";
import { formatCurrency } from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import { isSandbox } from "@/utils/environment";
import SandboxResolveActions from "@/components/SandboxResolveActions";
import { LOOKUP_SEARCH_EVENT } from "@/components/shell/events";

const { TextArea } = Input;

interface TransactionDetail {
  user_id: number;
  transaction_id: string;
  external_ref: string;
  amount: number;
  network: string;
  msisdn: string;
  type: string;
  status: string;
  status_code: string;
  created_at: string;
  refunded_at: string | null;
  balance_before: number;
  commission_amount: number;
  remark?: string;
  response_transaction_id?: string | null;
}

interface TelcoLog {
  transaction_id: string;
  status: string;
  response_transaction_id?: string | null;
  response_http_code: number;
  response_status_code: string;
  response_message: string;
  connection: number;
  created_at: string;
}

interface LookupResult {
  status: string;
  transaction?: TransactionDetail;
  telco_log?: TelcoLog;
  ref?: string;
  message?: string;
}

interface QueryUpdateResult {
  transaction_id?: string;
  external_ref?: string;
  status: string;
  old_status?: string;
  new_status?: string;
  message?: string;
  ref?: string;
  requery?: any;
}

const TransactionLookup = () => {
  const [transactionRefs, setTransactionRefs] = useState<string>("");
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryUpdateResult[] | null>(null);
  const [showQueryResultsModal, setShowQueryResultsModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // Top-bar search (components/shell/TopBar.tsx) lands here as ?q=<ref>:
  // prefill the box and run the lookup once. Read from window.location
  // rather than useSearchParams so the page needs no Suspense boundary.
  useEffect(() => {
    let q: string | null = null;
    try {
      q = new URLSearchParams(window.location.search).get("q");
    } catch {
      q = null;
    }
    if (q && q.trim()) {
      setTransactionRefs(q);
      lookupRefs(q);
    }
    // Searches made while this page is already open.
    const onSearch = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) {
        setTransactionRefs(detail);
        lookupRefs(detail);
      }
    };
    window.addEventListener(LOOKUP_SEARCH_EVENT, onSearch);
    return () => window.removeEventListener(LOOKUP_SEARCH_EVENT, onSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLookup = () => lookupRefs(transactionRefs);

  const lookupRefs = async (refsInput: string) => {
    if (!refsInput.trim()) {
      messageApi.warning("Please enter transaction IDs or external references");
      return;
    }

    setLoading(true);
    setLookupResults(null);
    try {
      const apiService = new AxiosHandler(messageApi);
      const cleanedRefs = refsInput
        .split(/[\n,;]/)
        .map(ref => ref.trim())
        .filter(ref => ref.length > 0)
        .join(",");
      
      const endpoint = `${apiEndpoints.selfServiceTransactionsByRefs}?transaction_refs=${encodeURIComponent(cleanedRefs)}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      console.log("Lookup response:", response);
      setLookupResults(response.data || []);
      messageApi.success(`Retrieved ${response.count} transaction(s)`);
    } catch (error) {
      console.error("Error looking up transactions:", error);
      messageApi.error("Failed to lookup transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleQueryAndUpdate = async () => {
    if (!transactionRefs.trim()) {
      messageApi.warning("Please enter transaction IDs or external references");
      return;
    }

    setQueryLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const cleanedRefs = transactionRefs
        .split(/[\n,;]/)
        .map(ref => ref.trim())
        .filter(ref => ref.length > 0)
        .join(",");
      
      const endpoint = `${apiEndpoints.selfServiceQueryAndUpdateStatus}?transaction_refs=${encodeURIComponent(cleanedRefs)}`;
      const response = await apiService.post({
        endPoint: endpoint,
        body: {},
      });
      
      setQueryResults(response.data || []);
      setShowQueryResultsModal(true);
      messageApi.success(`Processed ${response.count} transaction(s)`);
      
      handleLookup();
    } catch (error) {
      console.error("Error querying transactions:", error);
      messageApi.error("Failed to query and update transactions");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleExport = () => {
    if (!lookupResults || lookupResults.length === 0) {
      messageApi.warning("No transactions to export");
      return;
    }

    const exportData = lookupResults
      .filter(result => result.status === "found" && result.transaction)
      .map((result) => ({
        Date: dayjs(result.transaction!.created_at).format("YYYY-MM-DD HH:mm:ss"),
        "Transaction ID": result.transaction!.transaction_id,
        "External Ref": result.transaction!.external_ref,
        Type: result.transaction!.type,
        Network: result.transaction!.network,
        Beneficiary: result.transaction!.msisdn,
        "Amount (₦)": plainKoboNairaConvert(result.transaction!.amount),
        Status: result.transaction!.status,
        "Status Code": result.transaction!.status_code,
        "Balance Before (₦)": plainKoboNairaConvert(result.transaction!.balance_before),
        "Commission (₦)": plainKoboNairaConvert(result.transaction!.commission_amount),
        Refunded: result.transaction!.refunded_at ? "Yes" : "No",
        "Refunded At": result.transaction!.refunded_at ? dayjs(result.transaction!.refunded_at).format("YYYY-MM-DD HH:mm:ss") : "",
        "Telco Reference": result.transaction!.response_transaction_id || "",
        Remark: result.transaction!.remark || "",
      }));

    const fileName = `my_transaction_lookup_${dayjs().format("YYYY-MM-DD_HHmmss")}.csv`;
    handleDownloadCSV(exportData, fileName);
    messageApi.success(`Exported ${exportData.length} transactions`);
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: ["transaction", "transaction_id"],
      key: "transaction_id",
      width: 180,
      render: (text: string, record: LookupResult) => {
        if (record.status === "error") {
          return <span className="text-red-500">{record.ref}</span>;
        }
        return text;
      },
    },
    {
      title: "External Ref",
      dataIndex: ["transaction", "external_ref"],
      key: "external_ref",
      width: 150,
    },
    {
      title: "Type",
      dataIndex: ["transaction", "type"],
      key: "type",
      width: 100,
      render: (text: string) => text ? <Tag color="blue">{text}</Tag> : null,
    },
    {
      title: "Network",
      dataIndex: ["transaction", "network"],
      key: "network",
      width: 100,
    },
    {
      title: "Beneficiary",
      dataIndex: ["transaction", "msisdn"],
      key: "msisdn",
      width: 130,
    },
    {
      title: "Amount",
      dataIndex: ["transaction", "amount"],
      key: "amount",
      render: (value: number) => value ? <strong>{formatCurrency(value)}</strong> : null,
      align: "right" as const,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: ["transaction", "status"],
      key: "status",
      width: 120,
      render: (text: string, record: LookupResult) => {
        if (record.status === "error") {
          return <Tag color="red">Not Found</Tag>;
        }
        const color = text === "Successful" ? "green" : text === "Failed" ? "red" : "orange";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Created At",
      dataIndex: ["transaction", "created_at"],
      key: "created_at",
      render: (text: string) => text ? dayjs(text).format("YYYY-MM-DD HH:mm:ss") : null,
      width: 180,
    },
    {
      title: "Refunded",
      dataIndex: ["transaction", "refunded_at"],
      key: "refunded_at",
      width: 100,
      render: (text: string | null) => {
        if (text) {
          return <Tag color="purple">Yes</Tag>;
        }
        return <Tag color="default">No</Tag>;
      },
    },

    {
      title: "Ref to Telco",
      dataIndex: ["transaction", "ref_to_telco"],
      key: "ref_to_telco",
      width: 150,
    },

     {
      title: "Previous Ref",
      dataIndex: ["transaction", "retry_refs_to_telco"],
      key: "retry_refs_to_telco",
      width: 150,
    },

    {
      title: "Telco Reference",
      dataIndex: ["transaction", "response_transaction_id"],
      key: "response_transaction_id",
      width: 180,
    },

    {
      title: "Channel",
      dataIndex: ["transaction", "channel"],
      key: "channel",
      width: 150,
    },

    // SANDBOX: per-row resolve actions for pending rows (sandbox builds only).
    ...(isSandbox
      ? [
          {
            title: "Sandbox",
            dataIndex: ["transaction", "transaction_id"],
            key: "sandbox_resolve",
            width: 260,
            render: (_: any, record: LookupResult) =>
              record.transaction ? (
                <SandboxResolveActions
                  reference={record.transaction.transaction_id}
                  status={record.transaction.status}
                  refundedAt={record.transaction.refunded_at}
                  onResolved={handleLookup}
                />
              ) : null,
          },
        ]
      : []),
  ];

  const expandedRowRender = (record: LookupResult) => {
    if (record.status === "error") {
      return (
        <div className="p-4 bg-red-50 rounded">
          <p className="text-red-600 font-medium">{record.message}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <Card title="Transaction Details" size="small">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Balance Before:</span>
              <strong>{formatCurrency(record.transaction?.balance_before || 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission:</span>
              <strong>{formatCurrency(record.transaction?.commission_amount || 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status Code:</span>
              <strong>{record.transaction?.status_code}</strong>
            </div>
            {record.transaction?.remark && (
              <div className="flex justify-between">
                <span className="text-gray-600">Remark:</span>
                <strong>{record.transaction.remark}</strong>
              </div>
            )}
            {record.transaction?.refunded_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Refunded At:</span>
                <strong>{dayjs(record.transaction.refunded_at).format("YYYY-MM-DD HH:mm:ss")}</strong>
              </div>
            )}
          </div>
        </Card>

        {record.telco_log && (
          <Card title="Provider Response" size="small">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Telco Reference:</span>
                <strong>{record.telco_log.response_transaction_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">HTTP Code:</span>
                <strong>{record.telco_log.response_http_code}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status Code:</span>
                <strong>{record.telco_log.response_status_code}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Message:</span>
                <strong>{record.telco_log.response_message}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connection:</span>
                <strong>{record.telco_log.connection}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Log Created:</span>
                <strong>{dayjs(record.telco_log.created_at).format("YYYY-MM-DD HH:mm:ss")}</strong>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderQueryResultsModal = () => {
    if (!queryResults) return null;

    const updated = queryResults.filter(r => r.status === "updated");
    const skipped = queryResults.filter(r => r.status === "skipped");
    const errors = queryResults.filter(r => r.status === "error");

    return (
      <Modal
        title="Query and Update Results"
        open={showQueryResultsModal}
        onCancel={() => setShowQueryResultsModal(false)}
        footer={[
          <CustomButton key="close" onClick={() => setShowQueryResultsModal(false)}>
            Close
          </CustomButton>
        ]}
        width={800}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-green-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{updated.length}</div>
                <div className="text-sm text-gray-600">Updated</div>
              </div>
            </Card>
            <Card className="bg-yellow-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{skipped.length}</div>
                <div className="text-sm text-gray-600">Skipped</div>
              </div>
            </Card>
            <Card className="bg-red-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            </Card>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {queryResults.map((result, index) => (
              <Card key={index} className="mb-2" size="small">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {result.transaction_id || result.ref}
                    </div>
                    {result.external_ref && (
                      <div className="text-xs text-gray-500">{result.external_ref}</div>
                    )}
                  </div>
                  <div className="text-right">
                    {result.status === "updated" && (
                      <Tag color="green">
                        {result.old_status} → {result.new_status}
                      </Tag>
                    )}
                    {result.status === "skipped" && (
                      <Tag color="orange">{result.message}</Tag>
                    )}
                    {result.status === "error" && (
                      <Tag color="red">{result.message}</Tag>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Transaction Lookup</h2>

      <Card className="mb-4">
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">
              Transaction IDs or External References
            </label>
            <TextArea
              value={transactionRefs}
              onChange={(e) => setTransactionRefs(e.target.value)}
              placeholder="Enter transaction IDs or external references (one per line, or comma/semicolon separated)&#10;Example:&#10;TXN123456&#10;TXN789012&#10;EXT_REF_001"
              rows={6}
              className="font-mono"
            />
            <p className="text-sm text-gray-500 mt-2">
              Supports newline, comma, or semicolon separated values
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <BlueButton onClick={handleLookup} loading={loading}>
              Look Up Transactions
            </BlueButton>
            {lookupResults && lookupResults.length > 0 && (
              <>
                <BlueButton onClick={handleQueryAndUpdate} loading={queryLoading}>
                  Query & Update Status
                </BlueButton>
                <CustomButton onClick={handleExport} loading={exportLoading}>
                  Export to CSV
                </CustomButton>
              </>
            )}
            <CustomButton onClick={() => {
              setTransactionRefs("");
              setLookupResults(null);
            }}>
              Clear
            </CustomButton>
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      )}

      {!loading && lookupResults && (
        <Card title={`Transaction Details (${lookupResults.length} found)`}>
          <Table
            dataSource={lookupResults}
            columns={columns}
            rowKey={(record, index) => record.transaction?.transaction_id || `error-${index}`}
            expandable={{
              expandedRowRender,
              rowExpandable: (record) => record.status === "found" || record.status === "error",
            }}
            pagination={false}
            scroll={{ x: isSandbox ? 1660 : 1400 }}
          />
        </Card>
      )}

      {!loading && !lookupResults && (
        <Card>
          <div className="text-center py-10 text-gray-500">
            <p className="mb-2">Enter transaction IDs or external references above</p>
            <p className="text-sm">Then click &quot;Look Up Transactions&quot; to view details</p>
          </div>
        </Card>
      )}

      {renderQueryResultsModal()}
    </div>
  );
};

export default TransactionLookup;
