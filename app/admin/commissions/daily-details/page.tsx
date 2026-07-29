"use client";
import { useState, useEffect } from "react";
import { Card, DatePicker, Select, Spin, message, Table, Tag, Input } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";
import { BlueButton, CustomButton } from "@/components/buttons";
import {
  formatCurrency,
  formatNumber,
  AdminCommissionDailyDetailsData,
  AdminCommissionDailyDetailsTransaction,
} from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import useRequirePermission from "@/utils/useRequirePermission";

const { Option } = Select;
const { Search } = Input;

interface LogStatus {
  status: string;
  color: string;
  icon: string;
}

const AdminCommissionDailyDetails = () => {
  useRequirePermission("commission.view");
  const [data, setData] = useState<AdminCommissionDailyDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetchUsers();
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
      messageApi.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDailyDetails = async () => {
    if (!selectedUserId) {
      messageApi.warning("Please select a partner");
      return;
    }

    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const dateStr = selectedDate.format("YYYY-MM-DD");
      
      const response = await apiService.get({
        endPoint: `${apiEndpoints.adminCommissionDailyDetails}?user_id=${selectedUserId}&date=${dateStr}`,
      });
      
      setData(response.data);
      messageApi.success(`Loaded ${response.data.record_count} transaction records`);
    } catch (error) {
      console.error("Error fetching daily details:", error);
      messageApi.error("Failed to fetch daily details");
    } finally {
      setLoading(false);
    }
  };

  const getLogStatus = (transaction: AdminCommissionDailyDetailsTransaction): LogStatus => {
    if (transaction.commission_to === "Main Wallet") {
      return { status: "N/A", color: "gray", icon: "-" };
    }
    
    if (transaction.commission_to === "Commission Wallet") {
      if (transaction.log_id === null) {
        return { status: "Missing", color: "red", icon: "⚠" };
      }
      
      if (transaction.log_amount !== transaction.commission_amount) {
        return { status: "Mismatch", color: "orange", icon: "⚠" };
      }
      
      return { status: "Matched", color: "green", icon: "✓" };
    }
    
    return { status: "Unknown", color: "gray", icon: "?" };
  };

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 180,
      fixed: "left" as const,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 120,
    },
    {
      title: "Commission",
      dataIndex: "commission_amount",
      key: "commission_amount",
      render: (value: number) => <strong>{formatCurrency(value)}</strong>,
      align: "right" as const,
      width: 120,
    },
    {
      title: "Commission To",
      dataIndex: "commission_to",
      key: "commission_to",
      width: 150,
      render: (text: string) => (
        <Tag color={text === "Commission Wallet" ? "purple" : "blue"}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Log Status",
      key: "log_status",
      width: 120,
      align: "center" as const,
      render: (_: any, record: AdminCommissionDailyDetailsTransaction) => {
        const logStatus = getLogStatus(record);
        return (
          <Tag color={logStatus.color}>
            {logStatus.icon} {logStatus.status}
          </Tag>
        );
      },
    },
    {
      title: "Log Amount",
      dataIndex: "log_amount",
      key: "log_amount",
      render: (value: number | null) => value !== null ? formatCurrency(value) : "-",
      align: "right" as const,
      width: 120,
    },
    {
      title: "Status",
      dataIndex: "transaction_status",
      key: "transaction_status",
      width: 100,
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => dayjs(text).format("HH:mm:ss"),
      width: 100,
    },
  ];

  const expandedRowRender = (record: AdminCommissionDailyDetailsTransaction) => {
    const logStatus = getLogStatus(record);
    
    return (
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Transaction Details" size="small">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <strong>{record.transaction_id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <strong>{record.type}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <strong>{formatCurrency(record.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission:</span>
                <strong>{formatCurrency(record.commission_amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Commission To:</span>
                <strong>{record.commission_to}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <strong>{record.transaction_status}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created At:</span>
                <strong>{dayjs(record.created_at).format("YYYY-MM-DD HH:mm:ss")}</strong>
              </div>
            </div>
          </Card>

          <Card title="Wallet Log Details" size="small">
            {record.log_id !== null ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Log ID:</span>
                  <strong>{record.log_id}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Log Amount:</span>
                  <strong>{formatCurrency(record.log_amount!)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account:</span>
                  <strong>{record.log_account}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description:</span>
                  <strong>{record.log_description}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Tag color={logStatus.color}>
                    {logStatus.icon} {logStatus.status}
                  </Tag>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                {record.commission_to === "Main Wallet" ? (
                  <div className="text-gray-500">
                    <p className="font-semibold">No log expected</p>
                    <p className="text-xs">Commission sent to Main Wallet</p>
                  </div>
                ) : (
                  <div className="text-red-500">
                    <p className="font-semibold">⚠ Missing Log</p>
                    <p className="text-xs">Commission sent to Commission Wallet but no log found</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  };

  const filteredData = data?.transactions.filter((txn) => {
    if (filterType && txn.type !== filterType) return false;
    
    if (showIssuesOnly) {
      const logStatus = getLogStatus(txn);
      if (logStatus.status === "N/A" || logStatus.status === "Matched") return false;
    }
    
    if (searchText) {
      return txn.transaction_id.toLowerCase().includes(searchText.toLowerCase());
    }
    
    return true;
  }) || [];

  const issueCount = data?.transactions.filter((txn) => {
    const logStatus = getLogStatus(txn);
    return logStatus.status === "Missing" || logStatus.status === "Mismatch";
  }).length || 0;

  const handleExport = () => {
    if (!filteredData || filteredData.length === 0) return;
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    const exportData = filteredData.map((item) => {
      const logStatus = getLogStatus(item);
      return {
        "Transaction ID": item.transaction_id,
        Type: item.type,
        "Amount (₦)": plainKoboNairaConvert(item.amount),
        "Commission (₦)": plainKoboNairaConvert(item.commission_amount),
        "Commission To": item.commission_to,
        "Log ID": item.log_id || "N/A",
        "Log Amount (₦)": item.log_amount !== null ? plainKoboNairaConvert(item.log_amount) : "N/A",
        "Log Account": item.log_account || "N/A",
        "Log Status": logStatus.status,
        Status: item.transaction_status,
        "Created At": dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
      };
    });
    
    const fileName = `commission_daily_details_${selectedUser?.email || selectedUserId}_${selectedDate.format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Commission Daily Details (Transaction-Log Matching)</h2>
      <p className="text-gray-600 mb-4">
        View detailed transaction records with their corresponding wallet transaction logs to identify missing or mismatched logs.
      </p>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Partner</label>
            <Select
              showSearch
              placeholder="Select partner"
              value={selectedUserId}
              onChange={setSelectedUserId}
              className="w-full"
              loading={loadingUsers}
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.email} (ID: {user.id})
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Date</label>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
              format="YYYY-MM-DD"
              className="w-full"
              maxDate={dayjs()}
            />
          </div>

          <div className="flex items-end gap-3">
            <BlueButton onClick={fetchDailyDetails} loading={loading}>
              Generate Report
            </BlueButton>
            {filteredData && filteredData.length > 0 && (
              <CustomButton onClick={handleExport}>
                Export CSV
              </CustomButton>
            )}
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      )}

      {!loading && data && (
        <>
          <Card className="mb-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Report Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Partner:</span>{" "}
                  <strong>{selectedUser?.email || `ID: ${data.user_id}`}</strong>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>{" "}
                  <strong>{data.date}</strong>
                </div>
                <div>
                  <span className="text-gray-600">Total Records:</span>{" "}
                  <strong>{formatNumber(data.record_count)}</strong>
                </div>
                <div>
                  <span className="text-gray-600">Issues Found:</span>{" "}
                  <strong className={issueCount > 0 ? "text-red-600" : "text-green-600"}>
                    {issueCount}
                  </strong>
                </div>
              </div>
            </div>

            {issueCount > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-700">
                  <span className="text-xl">⚠</span>
                  <div>
                    <strong>{issueCount} Transaction(s) with Log Issues</strong>
                    <p className="text-sm">
                      Some transactions have missing or mismatched wallet logs. Enable "Show Issues Only" filter to view them.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Filter by Type</label>
                <Select
                  placeholder="All types"
                  value={filterType}
                  onChange={setFilterType}
                  className="w-full"
                  allowClear
                >
                  <Option value="Airtime">Airtime</Option>
                  <Option value="Data">Data</Option>
                  <Option value="Gift-Data">Gift Data</Option>
                  <Option value="Cable">Cable</Option>
                  <Option value="Electricity">Electricity</Option>
                </Select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Search Transaction ID</label>
                <Search
                  placeholder="Enter transaction ID"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium">Show Issues Only</label>
                <Select
                  value={showIssuesOnly}
                  onChange={setShowIssuesOnly}
                  className="w-full"
                >
                  <Option value={false}>All Transactions</Option>
                  <Option value={true}>Issues Only</Option>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm">
                  <div className="text-gray-600">Showing:</div>
                  <div className="text-lg font-bold">{formatNumber(filteredData.length)}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title={`Transaction Details (${filteredData.length} records)`}>
            <Table
              dataSource={filteredData}
              columns={columns}
              rowKey="transaction_id"
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} transactions`,
              }}
              scroll={{ x: 1400 }}
              expandable={{
                expandedRowRender,
                rowExpandable: () => true,
              }}
              rowClassName={(record) => {
                const logStatus = getLogStatus(record);
                if (logStatus.status === "Missing" || logStatus.status === "Mismatch") {
                  return "bg-red-50";
                }
                return "";
              }}
            />
          </Card>

          <Card className="mt-4 bg-gray-50">
            <h4 className="font-semibold mb-2">Log Status Legend:</h4>
            <div className="space-y-1 text-sm">
              <div><Tag color="green">✓ Matched</Tag> - Log exists and amount matches commission</div>
              <div><Tag color="red">⚠ Missing</Tag> - Commission sent to Commission Wallet but no log found</div>
              <div><Tag color="orange">⚠ Mismatch</Tag> - Log exists but amount doesn't match commission</div>
              <div><Tag color="gray">- N/A</Tag> - Commission sent to Main Wallet (no log expected)</div>
            </div>
          </Card>
        </>
      )}

      {!loading && !data && (
        <Card>
          <div className="text-center py-10 text-gray-500">
            Select a partner and date, then click "Generate Report" to view detailed transaction records
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminCommissionDailyDetails;
