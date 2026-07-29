"use client";
import { useState, useEffect } from "react";
import { Card, Select, Spin, message, Table, DatePicker, Checkbox, Modal, Tag } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";
import { BlueButton, CustomButton, RedButton } from "@/components/buttons";
import { formatCurrency, formatNumber } from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import useRequirePermission from "@/utils/useRequirePermission";

const { RangePicker } = DatePicker;
const { Option } = Select;

const TRANSACTION_TYPES = [
  { value: "Airtime", label: "Airtime" },
  { value: "Data", label: "Data" },
  { value: "Gift-Data", label: "Gift Data" },
  { value: "Cable", label: "Cable TV" },
  { value: "Electricity", label: "Electricity" },
];

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "glo", label: "GLO" },
  { value: "airtel", label: "Airtel" },
  { value: "9mobile", label: "9Mobile" },
];

interface PendingTransaction {
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
  balance_before: number;
  commission_amount: number;
  remark: string;
}

interface PendingTransactionsResponse {
  filters: {
    user_id: string;
    type: string;
    network: string;
    from: string;
    to: string;
    limit: string;
    offset: string;
  };
  total_count: number;
  records_count: number;
  records: PendingTransaction[];
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

const AdminPendingTransactions = () => {
  useRequirePermission("transactions.view");
  const [data, setData] = useState<PendingTransactionsResponse | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [limit, setLimit] = useState<number>(100);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<QueryUpdateResult[] | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const response = await apiService.get({
        endPoint: apiEndpoints.users,
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchPendingTransactions = async () => {
    setLoading(true);
    setSelectedTransactions([]);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams();
      
      if (selectedUserId) params.append("user_id", selectedUserId.toString());
      if (selectedType) params.append("type", selectedType);
      if (selectedNetwork) params.append("network", selectedNetwork);
      if (dateRange) {
        params.append("from", dateRange[0].format("YYYY-MM-DD"));
        params.append("to", dateRange[1].format("YYYY-MM-DD"));
      }
      params.append("limit", limit.toString());
      params.append("offset", offset.toString());
      
      const endpoint = `${apiEndpoints.adminPendingTransactions}?${params.toString()}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      setData(response.data);
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
      messageApi.error("Failed to fetch pending transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleQueryAndUpdate = async () => {
    if (selectedTransactions.length === 0) {
      messageApi.warning("Please select at least one transaction");
      return;
    }

    setQueryLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const transactionRefs = selectedTransactions.join(",");
      const endpoint = `${apiEndpoints.adminQueryAndUpdateStatus}?transaction_refs=${encodeURIComponent(transactionRefs)}`;
      
      const response = await apiService.post({
        endPoint: endpoint,
        body: {},
      });
      
      setQueryResults(response.data || []);
      setShowResultsModal(true);
      messageApi.success(`Processed ${response.count} transactions`);
      
      fetchPendingTransactions();
    } catch (error) {
      console.error("Error querying transactions:", error);
      messageApi.error("Failed to query and update transactions");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.records) {
      setSelectedTransactions(data.records.map(r => r.transaction_id));
    } else {
      setSelectedTransactions([]);
    }
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
    }
  };

  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedTransactions.length > 0 && data?.records && selectedTransactions.length === data.records.length}
          indeterminate={selectedTransactions.length > 0 && data?.records && selectedTransactions.length < data.records.length}
          onChange={(e) => handleSelectAll(e.target.checked)}
        >
          Select All
        </Checkbox>
      ),
      dataIndex: "select",
      key: "select",
      width: 120,
      fixed: "left" as const,
      render: (_: any, record: PendingTransaction) => (
        <Checkbox
          checked={selectedTransactions.includes(record.transaction_id)}
          onChange={(e) => handleSelectTransaction(record.transaction_id, e.target.checked)}
        />
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
      width: 180,
      fixed: "left" as const,
    },
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 180,
    },
    {
      title: "External Ref",
      dataIndex: "external_ref",
      key: "external_ref",
      width: 150,
    },
    {
      title: "User ID",
      dataIndex: "user_id",
      key: "user_id",
      width: 100,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (text: string) => (
        <Tag color="blue">{text}</Tag>
      ),
    },
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      width: 100,
    },
    {
      title: "Beneficiary",
      dataIndex: "msisdn",
      key: "msisdn",
      width: 130,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) => <strong>{formatCurrency(value)}</strong>,
      align: "right" as const,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text: string) => (
        <Tag color="orange">{text}</Tag>
      ),
    },
    {
      title: "Status Code",
      dataIndex: "status_code",
      key: "status_code",
      width: 100,
    },
    {
      title: "Remark",
      dataIndex: "remark",
      key: "remark",
      width: 150,
      ellipsis: true,
    },
  ];

  const handleExport = async () => {
    if (!data) return;
    
    setExportLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams();
      
      if (selectedUserId) params.append("user_id", selectedUserId.toString());
      if (selectedType) params.append("type", selectedType);
      if (selectedNetwork) params.append("network", selectedNetwork);
      if (dateRange) {
        params.append("from", dateRange[0].format("YYYY-MM-DD"));
        params.append("to", dateRange[1].format("YYYY-MM-DD"));
      }
      params.append("limit", "10000");
      params.append("offset", "0");
      
      const endpoint = `${apiEndpoints.adminPendingTransactions}?${params.toString()}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      const allRecords = response.data.records || [];
      
      const exportData = allRecords.map((item: PendingTransaction) => ({
        Date: dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
        "Transaction ID": item.transaction_id,
        "External Ref": item.external_ref,
        "User ID": item.user_id,
        Type: item.type,
        Network: item.network,
        Beneficiary: item.msisdn,
        "Amount (₦)": plainKoboNairaConvert(item.amount),
        Status: item.status,
        "Status Code": item.status_code,
        Remark: item.remark,
      }));
      
      const fileName = `pending_transactions_${dayjs().format("YYYY-MM-DD")}.csv`;
      handleDownloadCSV(exportData, fileName);
      messageApi.success(`Exported ${exportData.length} records`);
    } catch (error) {
      console.error("Error exporting transactions:", error);
      messageApi.error("Failed to export transactions");
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedUserId(null);
    setSelectedType(null);
    setSelectedNetwork(null);
    setDateRange(null);
    setOffset(0);
    setData(null);
    setSelectedTransactions([]);
  };

  const renderResultsModal = () => {
    if (!queryResults) return null;

    const updated = queryResults.filter(r => r.status === "updated");
    const skipped = queryResults.filter(r => r.status === "skipped");
    const errors = queryResults.filter(r => r.status === "error");

    return (
      <Modal
        title="Query and Update Results"
        open={showResultsModal}
        onCancel={() => setShowResultsModal(false)}
        footer={[
          <CustomButton key="close" onClick={() => setShowResultsModal(false)}>
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
      <h2 className="text-2xl font-bold mb-4">Pending Transactions Dashboard</h2>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Select User (Optional)</label>
            <Select
              showSearch
              placeholder="All users"
              value={selectedUserId}
              onChange={setSelectedUserId}
              className="w-full"
              loading={loadingUsers}
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={users.map((user) => ({
                value: user.id,
                label: `${user.name} (${user.email})`,
              }))}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Transaction Type</label>
            <Select
              placeholder="Select type"
              value={selectedType}
              onChange={setSelectedType}
              className="w-full"
              allowClear
            >
              {TRANSACTION_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Network</label>
            <Select
              placeholder="Select network"
              value={selectedNetwork}
              onChange={setSelectedNetwork}
              className="w-full"
              allowClear
            >
              {NETWORKS.map((network) => (
                <Option key={network.value} value={network.value}>
                  {network.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Date Range</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="YYYY-MM-DD"
              className="w-full"
              maxDate={dayjs()}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Limit</label>
            <Select
              value={limit}
              onChange={setLimit}
              className="w-full"
            >
              <Option value={50}>50</Option>
              <Option value={100}>100</Option>
              <Option value={200}>200</Option>
              <Option value={500}>500</Option>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <BlueButton onClick={fetchPendingTransactions} loading={loading}>
            Fetch Pending Transactions
          </BlueButton>
          <CustomButton onClick={handleClearFilters}>
            Clear Filters
          </CustomButton>
          {data && data.records && data.records.length > 0 && (
            <>
              <BlueButton 
                onClick={handleQueryAndUpdate} 
                loading={queryLoading}
                disabled={selectedTransactions.length === 0}
              >
                Query & Update Selected ({selectedTransactions.length})
              </BlueButton>
              <CustomButton onClick={handleExport} loading={exportLoading}>
                Export All to CSV
              </CustomButton>
            </>
          )}
        </div>

        {data && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">Total Pending: </span>
                <strong className="text-lg">{formatNumber(data.total_count)}</strong>
              </div>
              <div>
                <span className="font-semibold">Showing: </span>
                <strong className="text-lg">{formatNumber(data.records_count)}</strong>
              </div>
            </div>
          </div>
        )}
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      )}

      {!loading && data && (
        <Card title={`Pending Transactions (${selectedTransactions.length} selected)`}>
          <Table
            dataSource={data.records || []}
            columns={columns}
            rowKey="transaction_id"
            pagination={false}
            scroll={{ x: 1800 }}
          />
        </Card>
      )}

      {!loading && !data && (
        <Card>
          <div className="text-center py-10 text-gray-500">
            Apply filters and click &quot;Fetch Pending Transactions&quot; to view pending transactions
          </div>
        </Card>
      )}

      {renderResultsModal()}
    </div>
  );
};

export default AdminPendingTransactions;
