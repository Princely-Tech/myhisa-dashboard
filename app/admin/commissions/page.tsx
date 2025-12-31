"use client";
import { useState, useEffect } from "react";
import { Card, Select, Spin, message, Table, DatePicker, Tabs } from "antd";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { AdminCommissionSummary, AdminCommissionDetails, AdminCommissionByBiller, User } from "@/utils/types";
import { BlueButton } from "@/components";
import { formatCurrency, formatNumber, TRANSACTION_TYPES, CHART_COLORS } from "@/utils/commissionHelpers";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import { CustomButton } from "@/components/buttons";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const NETWORKS = [
  { value: "mtn", label: "MTN" },
  { value: "glo", label: "GLO" },
  { value: "airtel", label: "Airtel" },
  { value: "9mobile", label: "9Mobile" },
];

const AdminCommissions = () => {
  const [summaryData, setSummaryData] = useState<AdminCommissionSummary | null>(null);
  const [detailsData, setDetailsData] = useState<AdminCommissionDetails | null>(null);
  const [billerData, setBillerData] = useState<AdminCommissionByBiller | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState("summary");
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(firstDayOfMonth),
    dayjs(currentDate),
  ]);

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

  const fetchCommissionSummary = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams();
      params.append("from_date", dateRange[0].format("YYYY-MM-DD"));
      params.append("to_date", dateRange[1].format("YYYY-MM-DD"));
      if (selectedTypes.length > 0) params.append("types", selectedTypes.join(","));
      if (selectedUserId) params.append("user_id", selectedUserId.toString());
      
      const endpoint = `${apiEndpoints.adminCommissionSummary}?${params.toString()}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      setSummaryData(response.data);
    } catch (error) {
      console.error("Error fetching commission summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionDetails = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams();
      params.append("from_date", dateRange[0].format("YYYY-MM-DD"));
      params.append("to_date", dateRange[1].format("YYYY-MM-DD"));
      if (selectedTypes.length > 0) params.append("types", selectedTypes.join(","));
      if (selectedUserId) params.append("user_id", selectedUserId.toString());
      if (selectedNetworks.length > 0) params.append("network", selectedNetworks.join(","));
      
      const endpoint = `${apiEndpoints.adminCommissionDetails}?${params.toString()}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      setDetailsData(response.data);
    } catch (error) {
      console.error("Error fetching commission details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionByBiller = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams();
      params.append("from_date", dateRange[0].format("YYYY-MM-DD"));
      params.append("to_date", dateRange[1].format("YYYY-MM-DD"));
      if (selectedTypes.length > 0) params.append("types", selectedTypes.join(","));
      if (selectedUserId) params.append("user_id", selectedUserId.toString());
      
      const endpoint = `${apiEndpoints.adminCommissionByBiller}?${params.toString()}`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      
      setBillerData(response.data);
    } catch (error) {
      console.error("Error fetching commission by biller:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    if (activeTab === "summary") {
      fetchCommissionSummary();
    } else if (activeTab === "details") {
      fetchCommissionDetails();
    } else if (activeTab === "biller") {
      fetchCommissionByBiller();
    }
  };

  const summaryColumns = [
    {
      title: "User",
      dataIndex: "user_name",
      key: "user_name",
      width: 200,
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.user_email}</div>
        </div>
      ),
    },
    {
      title: "Transactions",
      dataIndex: "total_transactions",
      key: "total_transactions",
      render: (value: number) => formatNumber(value),
      align: "right" as const,
      width: 120,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 140,
    },
    {
      title: "Commission",
      dataIndex: "total_commission",
      key: "total_commission",
      render: (value: number) => <strong className="text-green-600">{formatCurrency(value)}</strong>,
      align: "right" as const,
      width: 140,
    },
    {
      title: "Avg Commission",
      dataIndex: "average_commission",
      key: "average_commission",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 140,
    },
  ];

  const detailsColumns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm"),
      width: 150,
    },
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 180,
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
      render: (value: number) => <strong className="text-green-600">{formatCurrency(value)}</strong>,
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
  ];

  const billerColumns = [
    {
      title: "Biller",
      dataIndex: "biller",
      key: "biller",
      width: 120,
      render: (text: string) => text || "N/A",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (text: string) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          {text}
        </span>
      ),
    },
    {
      title: "Transactions",
      dataIndex: "total_transactions",
      key: "total_transactions",
      render: (value: number) => formatNumber(value),
      align: "right" as const,
      width: 120,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 140,
    },
    {
      title: "Commission",
      dataIndex: "total_commission",
      key: "total_commission",
      render: (value: number) => <strong className="text-green-600">{formatCurrency(value)}</strong>,
      align: "right" as const,
      width: 140,
    },
    {
      title: "Avg Commission",
      dataIndex: "average_commission",
      key: "average_commission",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
      width: 140,
    },
  ];

  const handleExportSummary = () => {
    if (!summaryData || !summaryData.summaries) return;
    
    const exportData = summaryData.summaries.map((item) => ({
      "User Name": item.user_name,
      "User Email": item.user_email,
      "Total Transactions": item.total_transactions,
      "Total Amount (₦)": plainKoboNairaConvert(item.total_amount),
      "Total Commission (₦)": plainKoboNairaConvert(item.total_commission),
      "Average Commission (₦)": plainKoboNairaConvert(item.average_commission),
    }));
    
    const fileName = `admin_commission_summary_${dateRange[0].format("YYYY-MM-DD")}_to_${dateRange[1].format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  const handleExportDetails = () => {
    if (!detailsData || !detailsData.data) return;
    
    const exportData = detailsData.data.map((item) => ({
      Date: dayjs(item.created_at).format("YYYY-MM-DD HH:mm:ss"),
      "Transaction ID": item.transaction_id,
      "User Name": item.user_name,
      "User Email": item.user_email,
      Type: item.type,
      Network: item.network,
      "Amount (₦)": plainKoboNairaConvert(item.amount),
      "Commission (₦)": plainKoboNairaConvert(item.commission_amount),
      Status: item.status,
    }));
    
    const fileName = `admin_commission_details_${dateRange[0].format("YYYY-MM-DD")}_to_${dateRange[1].format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  const handleExportBiller = () => {
    if (!billerData || !billerData.summaries) return;
    
    const exportData = billerData.summaries.map((item) => ({
      Biller: item.biller || "N/A",
      Type: item.type,
      "Total Transactions": item.total_transactions,
      "Total Amount (₦)": plainKoboNairaConvert(item.total_amount),
      "Total Commission (₦)": plainKoboNairaConvert(item.total_commission),
      "Average Commission (₦)": plainKoboNairaConvert(item.average_commission),
    }));
    
    const fileName = `admin_commission_by_biller_${dateRange[0].format("YYYY-MM-DD")}_to_${dateRange[1].format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  const summaryChartData = summaryData?.summaries?.map((item) => ({
    name: item.user_name,
    value: item.total_commission / 100,
    transactions: item.total_transactions,
    amount: item.total_amount / 100,
  })) || [];

  const billerChartData = billerData?.summaries?.map((item) => ({
    name: `${item.biller || "N/A"} - ${item.type}`,
    value: item.total_commission / 100,
    transactions: item.total_transactions,
    amount: item.total_amount / 100,
  })) || [];

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Admin Commission Visibility</h2>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Date Range (Required)</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
              className="w-full"
              maxDate={dayjs()}
            />
          </div>

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
            <label className="block mb-2 font-medium">Transaction Types</label>
            <Select
              mode="multiple"
              placeholder="All types"
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

          {activeTab === "details" && (
            <div>
              <label className="block mb-2 font-medium">Network</label>
              <Select
                mode="multiple"
                placeholder="All networks"
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
          )}
        </div>

        <div className="flex gap-3">
          <BlueButton onClick={handleApplyFilters} loading={loading}>
            Apply Filters
          </BlueButton>
        </div>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Summary by User" key="summary">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          )}

          {!loading && summaryData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <div className="text-sm text-gray-600">Total Commission</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summaryData?.totals?.total_commission || 0)}
                  </div>
                </Card>
                <Card className="bg-green-50">
                  <div className="text-sm text-gray-600">Total Transactions</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(summaryData?.totals?.total_transactions || 0)}
                  </div>
                </Card>
                <Card className="bg-purple-50">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(summaryData?.totals?.total_amount || 0)}
                  </div>
                </Card>
              </div>

              {summaryChartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card title="Commission Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={summaryChartData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" name="Commission (₦)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              )}

              <Card 
                title="User Commission Summary" 
                extra={
                  <CustomButton onClick={handleExportSummary}>
                    Export CSV
                  </CustomButton>
                }
              >
                <Table
                  dataSource={summaryData?.summaries || []}
                  columns={summaryColumns}
                  rowKey="user_id"
                  pagination={{
                    pageSize: 50,
                    showTotal: (total) => `Total ${total} users`,
                  }}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gray-100 font-bold">
                        <Table.Summary.Cell index={0}>
                          <strong>TOTAL</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          {formatNumber(summaryData?.totals?.total_transactions || 0)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          {formatCurrency(summaryData?.totals?.total_amount || 0)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <strong>{formatCurrency(summaryData?.totals?.total_commission || 0)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          -
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>

              <div className="mt-4 text-sm text-gray-600">
                Period: {summaryData?.period?.from} to {summaryData?.period?.to}
              </div>
            </>
          )}

          {!loading && !summaryData && (
            <Card>
              <div className="text-center py-10 text-gray-500">
                Select filters and click &quot;Apply Filters&quot; to view commission summary
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="Detailed Records" key="details">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          )}

          {!loading && detailsData && (
            <Card 
              title="Commission Details" 
              extra={
                <CustomButton onClick={handleExportDetails}>
                  Export CSV
                </CustomButton>
              }
            >
              <Table
                dataSource={detailsData?.data || []}
                columns={detailsColumns}
                rowKey="transaction_id"
                pagination={{
                  current: detailsData.pagination?.page || 1,
                  total: detailsData.pagination?.total || 0,
                  pageSize: detailsData.pagination?.limit || 50,
                  showTotal: (total) => `Total ${total} records`,
                }}
                scroll={{ x: 1400 }}
              />
            </Card>
          )}

          {!loading && !detailsData && (
            <Card>
              <div className="text-center py-10 text-gray-500">
                Select filters and click &quot;Apply Filters&quot; to view commission details
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="By Biller/Network" key="biller">
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          )}

          {!loading && billerData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-blue-50">
                  <div className="text-sm text-gray-600">Total Commission</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(billerData?.totals?.total_commission || 0)}
                  </div>
                </Card>
                <Card className="bg-green-50">
                  <div className="text-sm text-gray-600">Total Transactions</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(billerData?.totals?.total_transactions || 0)}
                  </div>
                </Card>
                <Card className="bg-purple-50">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(billerData?.totals?.total_amount || 0)}
                  </div>
                </Card>
              </div>

              {billerChartData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card title="Commission by Biller">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={billerChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                        <Legend />
                        <Bar dataKey="value" fill="#82ca9d" name="Commission (₦)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </div>
              )}

              <Card 
                title="Commission Breakdown by Biller" 
                extra={
                  <CustomButton onClick={handleExportBiller}>
                    Export CSV
                  </CustomButton>
                }
              >
                <Table
                  dataSource={billerData?.summaries || []}
                  columns={billerColumns}
                  rowKey={(record) => `${record.biller}-${record.type}`}
                  pagination={{
                    pageSize: 50,
                    showTotal: (total) => `Total ${total} records`,
                  }}
                  summary={() => (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gray-100 font-bold">
                        <Table.Summary.Cell index={0} colSpan={2}>
                          <strong>TOTAL</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          {formatNumber(billerData?.totals?.total_transactions || 0)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          {formatCurrency(billerData?.totals?.total_amount || 0)}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="right">
                          <strong>{formatCurrency(billerData?.totals?.total_commission || 0)}</strong>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={5} align="right">
                          -
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
              </Card>

              <div className="mt-4 text-sm text-gray-600">
                Period: {billerData?.period?.from} to {billerData?.period?.to}
              </div>
            </>
          )}

          {!loading && !billerData && (
            <Card>
              <div className="text-center py-10 text-gray-500">
                Select filters and click &quot;Apply Filters&quot; to view commission by biller
              </div>
            </Card>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default AdminCommissions;
