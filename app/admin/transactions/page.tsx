"use client";
import { useState, useEffect } from "react";
import { Card, Select, Spin, message, Table, DatePicker, InputNumber } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AdminTransactionHistory, User } from "@/utils/types";
import { BlueButton, InputField } from "@/components";
import { formatCurrency, formatNumber } from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import { CustomButton } from "@/components/buttons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const TRANSACTION_TYPES = [
  { value: "airtime", label: "Airtime" },
  { value: "data", label: "Data" },
  { value: "cable", label: "Cable TV" },
  { value: "electricity", label: "Electricity" },
];

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "glo", label: "GLO" },
  { value: "airtel", label: "Airtel" },
  { value: "9mobile", label: "9Mobile" },
];

const STATUSES = [
  { value: "Successful", label: "Successful" },
  { value: "Failed", label: "Failed" },
  { value: "Pending", label: "Pending" },
  { value: "InsufficientBalance", label: "InsufficientBalance" },
  { value: "Processing", label: "Processing" },
  { value: "InvalidMsisdn", label: "InvalidMsisdn" },
  { value: "InvalidAmount", label: "InvalidAmount" },
  { value: "TelcoError", label: "TelcoError" },
  { value: "InvalidTelco", label: "InvalidTelco" },
  { value: "InternalError", label: "InternalError" },
];


const AdminTransactions = () => {
  const [data, setData] = useState<AdminTransactionHistory | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [maxAmount, setMaxAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
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

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams();
      
      if (selectedUserId) params.append("user_id", selectedUserId.toString());
      if (selectedTypes.length > 0) params.append("type", selectedTypes.join(","));
      if (selectedNetworks.length > 0) params.append("network", selectedNetworks.join(","));
      if (selectedStatus) params.append("status", selectedStatus);
      if (dateRange) {
        params.append("from_date", dateRange[0].format("YYYY-MM-DD"));
        params.append("to_date", dateRange[1].format("YYYY-MM-DD"));
      }
      if (minAmount !== null) params.append("min_amount", (minAmount * 100).toString());
      if (maxAmount !== null) params.append("max_amount", (maxAmount * 100).toString());
      
      const endpoint = `${apiEndpoints.adminTransactions}?${params.toString()}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      setData(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
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
      fixed: "left" as const,
    },
    {
      title: "User",
      dataIndex: "user_name",
      key: "user_name",
      width: 150,
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.user_email}</div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (text: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          {text}
        </span>
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
      title: "Commission",
      dataIndex: "commission_amount",
      key: "commission_amount",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text: string) => {
        const color = text === "Successful" ? "green" : text === "Failed" ? "red" : "yellow";
        return (
          <span className={`px-2 py-1 bg-${color}-100 text-${color}-800 rounded text-xs`}>
            {text}
          </span>
        );
      },
    },
    {
      title: "External Ref",
      dataIndex: "external_ref",
      key: "external_ref",
      width: 150,
    },
  ];

  const handleExport = () => {
    if (!data || !data.records) return;
    
    const exportData = data.records.map((item) => ({
      Date: dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
      "Transaction ID": item.transaction_id,
      "User Name": item.user_name,
      "User Email": item.user_email,
      Type: item.type,
      Network: item.network,
      Beneficiary: item.msisdn,
      "Amount (₦)": plainKoboNairaConvert(item.amount),
      "Commission (₦)": plainKoboNairaConvert(item.commission_amount),
      Status: item.status,
      "External Ref": item.external_ref,
      "Balance Before (₦)": plainKoboNairaConvert(item.balance_before),
    }));
    
    const fileName = `admin_transactions_${dayjs().format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  const handleClearFilters = () => {
    setSelectedUserId(null);
    setSelectedTypes([]);
    setSelectedNetworks([]);
    setSelectedStatus(null);
    setDateRange(null);
    setMinAmount(null);
    setMaxAmount(null);
    setData(null);
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Admin Transaction Access</h2>

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
              mode="multiple"
              placeholder="Select types"
              value={selectedTypes}
              onChange={setSelectedTypes}
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
              mode="multiple"
              placeholder="Select networks"
              value={selectedNetworks}
              onChange={setSelectedNetworks}
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
            <label className="block mb-2 font-medium">Status</label>
            <Select
              placeholder="Select status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              className="w-full"
              allowClear
            >
              {STATUSES.map((status) => (
                <Option key={status.value} value={status.value}>
                  {status.label}
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
            <label className="block mb-2 font-medium">Min Amount (₦)</label>
            <InputNumber
              placeholder="Minimum amount"
              value={minAmount}
              onChange={(value) => setMinAmount(value)}
              className="w-full"
              min={0}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Max Amount (₦)</label>
            <InputNumber
              placeholder="Maximum amount"
              value={maxAmount}
              onChange={(value) => setMaxAmount(value)}
              className="w-full"
              min={0}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <BlueButton onClick={fetchTransactions} loading={loading}>
            Apply Filters
          </BlueButton>
          <CustomButton onClick={handleClearFilters}>
            Clear Filters
          </CustomButton>
          {data && data.records && data.records.length > 0 && (
            <CustomButton onClick={handleExport}>
              Export CSV
            </CustomButton>
          )}
        </div>

        {data && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <div className="font-semibold">
              Total Records: <strong>{formatNumber(data.total_records)}</strong>
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
        <Card title="Transaction Records">
          <Table
            dataSource={data.records || []}
            columns={columns}
            rowKey="transaction_id"
            pagination={{
              current: data.pagination?.current_page || 1,
              total: data.total_records || 0,
              pageSize: 100,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} records`,
            }}
            scroll={{ x: 1600 }}
          />
        </Card>
      )}

      {!loading && !data && (
        <Card>
          <div className="text-center py-10 text-gray-500">
            Apply filters and click &quot;Apply Filters&quot; to view transactions
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminTransactions;
