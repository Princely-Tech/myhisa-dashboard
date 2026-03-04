"use client";
import { useState, useEffect } from "react";
import { Card, DatePicker, Select, Spin, message, Table, Tag } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";
import { BlueButton, CustomButton } from "@/components/buttons";
import {
  formatCurrency,
  formatNumber,
  AdminCommissionDailySummaryData,
} from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";

const { Option } = Select;

const AdminCommissionDailySummary = () => {
  const [data, setData] = useState<AdminCommissionDailySummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
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

  const fetchDailySummary = async () => {
    if (!selectedUserId) {
      messageApi.warning("Please select a partner");
      return;
    }

    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const dateStr = selectedDate.format("YYYY-MM-DD");
      
      const response = await apiService.get({
        endPoint: `${apiEndpoints.adminCommissionDailySummary}?user_id=${selectedUserId}&date=${dateStr}`,
      });
      
      setData(response.data);
      messageApi.success("Daily summary loaded successfully");
    } catch (error) {
      console.error("Error fetching daily summary:", error);
      messageApi.error("Failed to fetch daily summary");
    } finally {
      setLoading(false);
    }
  };

  const hasIssues = (summary: any) => {
    return (
      summary.total_log_amount !== summary.total_commission_amount ||
      summary.log_record_count !== summary.transaction_count
    );
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <strong>{text}</strong>,
      width: 120,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 150,
    },
    {
      title: "Commission Amount",
      dataIndex: "total_commission_amount",
      key: "total_commission_amount",
      render: (value: number) => <strong>{formatCurrency(value)}</strong>,
      align: "right" as const,
      width: 170,
    },
    {
      title: "Log Amount",
      dataIndex: "total_log_amount",
      key: "total_log_amount",
      render: (value: number, record: any) => {
        const issues = hasIssues(record);
        return (
          <span className={issues ? "text-orange-600 font-semibold" : ""}>
            {formatCurrency(value)}
            {issues && " ⚠"}
          </span>
        );
      },
      align: "right" as const,
      width: 150,
    },
    {
      title: "Transactions",
      dataIndex: "transaction_count",
      key: "transaction_count",
      render: (value: number) => formatNumber(value),
      align: "right" as const,
      width: 120,
    },
    {
      title: "Log Records",
      dataIndex: "log_record_count",
      key: "log_record_count",
      render: (value: number, record: any) => {
        const issues = hasIssues(record);
        return (
          <span className={issues ? "text-orange-600 font-semibold" : ""}>
            {formatNumber(value)}
            {issues && " ⚠"}
          </span>
        );
      },
      align: "right" as const,
      width: 120,
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: any) => {
        const issues = hasIssues(record);
        return issues ? (
          <Tag color="orange">⚠ Issues</Tag>
        ) : (
          <Tag color="green">✓ OK</Tag>
        );
      },
      align: "center" as const,
      width: 100,
    },
  ];

  const handleExport = () => {
    if (!data || !data.summaries) return;
    
    const selectedUser = users.find(u => u.id === selectedUserId);
    const exportData = data.summaries.map((item) => ({
      Type: item.type,
      "Total Amount (₦)": plainKoboNairaConvert(item.total_amount),
      "Commission Amount (₦)": plainKoboNairaConvert(item.total_commission_amount),
      "Log Amount (₦)": plainKoboNairaConvert(item.total_log_amount),
      "Transactions": item.transaction_count,
      "Log Records": item.log_record_count,
      "Status": hasIssues(item) ? "Issues" : "OK",
    }));
    
    const fileName = `commission_daily_summary_${selectedUser?.email || selectedUserId}_${selectedDate.format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  const totalCommissionAmount = data?.summaries.reduce((sum, item) => sum + item.total_commission_amount, 0) || 0;
  const totalLogAmount = data?.summaries.reduce((sum, item) => sum + item.total_log_amount, 0) || 0;
  const totalTransactions = data?.summaries.reduce((sum, item) => sum + item.transaction_count, 0) || 0;
  const totalLogRecords = data?.summaries.reduce((sum, item) => sum + item.log_record_count, 0) || 0;
  const hasAnyIssues = data?.summaries.some(hasIssues) || false;

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Commission Daily Summary (Reconciliation)</h2>
      <p className="text-gray-600 mb-4">
        View daily commission summary with wallet transaction log reconciliation to identify data integrity issues.
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
            <BlueButton onClick={fetchDailySummary} loading={loading}>
              Generate Report
            </BlueButton>
            {data && data.summaries && data.summaries.length > 0 && (
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
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Partner:</span>{" "}
                  <strong>{selectedUser?.email || `ID: ${data.user_id}`}</strong>
                </div>
                <div>
                  <span className="text-gray-600">Date:</span>{" "}
                  <strong>{data.date}</strong>
                </div>
              </div>
            </div>

            {hasAnyIssues && (
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded">
                <div className="flex items-center gap-2 text-orange-700">
                  <span className="text-xl">⚠</span>
                  <div>
                    <strong>Data Integrity Issues Detected</strong>
                    <p className="text-sm">
                      Some transaction types have mismatches between commission amounts and wallet logs.
                      This may indicate historical data integrity issues that require investigation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-xs text-gray-600">Commission Amount</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(totalCommissionAmount)}
                </div>
              </div>
              <div className={`p-3 rounded ${totalLogAmount !== totalCommissionAmount ? 'bg-orange-50' : 'bg-green-50'}`}>
                <div className="text-xs text-gray-600">Log Amount</div>
                <div className={`text-lg font-bold ${totalLogAmount !== totalCommissionAmount ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCurrency(totalLogAmount)}
                  {totalLogAmount !== totalCommissionAmount && " ⚠"}
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded">
                <div className="text-xs text-gray-600">Transactions</div>
                <div className="text-lg font-bold text-purple-600">
                  {formatNumber(totalTransactions)}
                </div>
              </div>
              <div className={`p-3 rounded ${totalLogRecords !== totalTransactions ? 'bg-orange-50' : 'bg-green-50'}`}>
                <div className="text-xs text-gray-600">Log Records</div>
                <div className={`text-lg font-bold ${totalLogRecords !== totalTransactions ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatNumber(totalLogRecords)}
                  {totalLogRecords !== totalTransactions && " ⚠"}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Commission Summary by Type">
            <Table
              dataSource={data.summaries || []}
              columns={columns}
              rowKey="type"
              pagination={false}
              rowClassName={(record) => hasIssues(record) ? "bg-orange-50" : ""}
            />
          </Card>

          <Card className="mt-4 bg-gray-50">
            <h4 className="font-semibold mb-2">Legend:</h4>
            <div className="space-y-1 text-sm">
              <div><Tag color="green">✓ OK</Tag> - Commission amounts and log records match</div>
              <div><Tag color="orange">⚠ Issues</Tag> - Mismatch detected (requires investigation)</div>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              <strong>Note:</strong> Mismatches may indicate historical data integrity issues where commission 
              updates failed but wallet logs were still created, or vice versa.
            </p>
          </Card>
        </>
      )}

      {!loading && !data && (
        <Card>
          <div className="text-center py-10 text-gray-500">
            Select a partner and date, then click "Generate Report" to view the daily commission summary
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminCommissionDailySummary;
