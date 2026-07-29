"use client";
import { useState, useEffect } from "react";
import { Card, Select, Spin, message, Table, DatePicker } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AdminCreditHistory, User } from "@/utils/types";
import { BlueButton } from "@/components";
import { formatCurrency, formatNumber } from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert, formatDateTimeYYYYMMDD } from "@/utils/helperfunctions";
import { CustomButton } from "@/components/buttons";
import useRequirePermission from "@/utils/useRequirePermission";

const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminUserCreditHistory = () => {
  useRequirePermission("wallet.view");
  const [data, setData] = useState<AdminCreditHistory | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

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

  const fetchCreditHistory = async () => {
    if (!selectedUserId) {
      messageApi.warning("Please select a user first");
      return;
    }

    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      let endpoint = apiEndpoints.adminUserCreditHistory(selectedUserId);
      
      if (dateRange) {
        const fromDate = dateRange[0].format("YYYY-MM-DD");
        const toDate = dateRange[1].format("YYYY-MM-DD");
        endpoint += `?from_date=${fromDate}&to_date=${toDate}`;
      }
      
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      setData(response.data);
    } catch (error) {
      console.error("Error fetching credit history:", error);
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
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) => <strong className="text-green-600">{formatCurrency(value)}</strong>,
      align: "right" as const,
      width: 120,
    },
    {
      title: "Source",
      dataIndex: "provider",
      key: "provider",
      width: 120,
    },
    {
      title: "Credited By",
      dataIndex: "credited_by",
      key: "credited_by",
      render: (text: string) => text || "N/A",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Reference",
      dataIndex: "ref",
      key: "ref",
      width: 150,
    },
    {
      title: "Balance Before",
      dataIndex: "balance_before",
      key: "balance_before",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 130,
    },
  ];

  const handleExport = () => {
    if (!data || !data.records) return;
    
    const exportData = data.records.map((item) => ({
      Date: dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
      "Amount (₦)": plainKoboNairaConvert(item.amount),
      Source: item.provider,
      "Credited By": item.credited_by || "N/A",
      Description: item.description,
      Reference: item.ref,
      "Balance Before (₦)": plainKoboNairaConvert(item.balance_before),
    }));
    
    const fileName = `user_${selectedUserId}_credit_history_${dayjs().format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">User Credit History</h2>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Select User</label>
            <Select
              showSearch
              placeholder="Search and select user"
              value={selectedUserId}
              onChange={setSelectedUserId}
              className="w-full"
              loading={loadingUsers}
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
            <label className="block mb-2 font-medium">Date Range (Optional)</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="YYYY-MM-DD"
              className="w-full"
              maxDate={dayjs()}
            />
          </div>
          <div className="flex items-end gap-3">
            <BlueButton onClick={fetchCreditHistory} loading={loading}>
              View History
            </BlueButton>
            {data && data.records && data.records.length > 0 && (
              <CustomButton onClick={handleExport}>
                Export CSV
              </CustomButton>
            )}
          </div>
        </div>

        {data && data.user && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h3 className="font-semibold text-lg mb-2">User Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <span className="text-gray-600">Name:</span>{" "}
                <strong>{data.user.name}</strong>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>{" "}
                <strong>{data.user.email}</strong>
              </div>
              <div>
                <span className="text-gray-600">Total Records:</span>{" "}
                <strong>{formatNumber(data.total_records)}</strong>
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
        <Card title="Credit History Records">
          <Table
            dataSource={data.records || []}
            columns={columns}
            rowKey="id"
            pagination={{
              current: data.pagination?.current_page || 1,
              total: data.total_records || 0,
              pageSize: 100,
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} records`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {!loading && !data && (
        <Card>
          <div className="text-center py-10 text-gray-500">
            Select a user and click &quot;View History&quot; to see their credit history
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminUserCreditHistory;
