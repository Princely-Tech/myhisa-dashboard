"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, DatePicker, Select, Spin, message, Table } from "antd";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import {
  TRANSACTION_TYPES,
  CHART_COLORS,
  formatCurrency,
  formatNumber,
  CommissionSummaryData,
} from "@/utils/commissionHelpers";
import { BlueButton } from "@/components";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import { CustomButton } from "@/components/buttons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const CommissionSummary = () => {
  const [data, setData] = useState<CommissionSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(firstDayOfMonth),
    dayjs(currentDate),
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const fetchCommissionData = useCallback(async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const fromDate = dateRange[0].format("YYYY-MM-DD");
      const toDate = dateRange[1].format("YYYY-MM-DD");
      const typesParam = selectedTypes.length > 0 ? `&types=${selectedTypes.join(",")}` : "";
      
      const response = await apiService.get({
        endPoint: `${apiEndpoints.commissionSummary}?from_date=${fromDate}&to_date=${toDate}${typesParam}`,
      });
      
      setData(response.data);
    } catch (error) {
      console.error("Error fetching commission data:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedTypes, messageApi]);

  useEffect(() => {
    fetchCommissionData();
  }, [fetchCommissionData]);

  const chartData = data?.summaries?.map((item) => ({
    name: item.type,
    value: item.total_commission / 100,
    transactions: item.total_transactions,
    amount: item.total_amount / 100,
  })) || [];

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Transactions",
      dataIndex: "total_transactions",
      key: "total_transactions",
      render: (value: number) => formatNumber(value),
      align: "right" as const,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
    },
    {
      title: "Commission",
      dataIndex: "total_commission",
      key: "total_commission",
      render: (value: number) => <strong>{formatCurrency(value)}</strong>,
      align: "right" as const,
    },
    {
      title: "Avg Commission",
      dataIndex: "average_commission",
      key: "average_commission",
      render: (value: number) => formatCurrency(value),
      align: "right" as const,
    },
  ];

  const handleExport = () => {
    if (!data || !data.summaries) return;
    
    const exportData = data.summaries.map((item) => ({
      Type: item.type,
      "Total Transactions": item.total_transactions,
      "Total Amount (₦)": plainKoboNairaConvert(item.total_amount),
      "Total Commission (₦)": plainKoboNairaConvert(item.total_commission),
      "Average Commission (₦)": plainKoboNairaConvert(item.average_commission),
    }));
    
    const fileName = `commission_summary_${dateRange[0].format("YYYY-MM-DD")}_to_${dateRange[1].format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Commission Summary Report</h2>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Date Range</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              format="YYYY-MM-DD"
              className="w-full"
              maxDate={dayjs()}
            />
          </div>
          <div>
            <label className="block mb-2 font-medium">Transaction Types</label>
            <Select
              mode="multiple"
              placeholder="Select transaction types (All if empty)"
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
          <div className="flex items-end gap-3">
            <BlueButton onClick={fetchCommissionData} loading={loading}>
              Apply Filters
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50">
              <div className="text-sm text-gray-600">Total Commission</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data?.totals?.total_commission || 0)}
              </div>
            </Card>
            <Card className="bg-green-50">
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(data?.totals?.total_transactions || 0)}
              </div>
            </Card>
            <Card className="bg-purple-50">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(data?.totals?.total_amount || 0)}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card title="Commission Distribution (Pie Chart)">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${formatCurrency(entry.value * 100)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Commission by Type (Bar Chart)">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Commission (₦)">
                    {chartData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name as keyof typeof CHART_COLORS]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card title="Detailed Summary Table">
            <Table
              dataSource={data?.summaries || []}
              columns={columns}
              rowKey="type"
              pagination={false}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row className="bg-gray-100 font-bold">
                    <Table.Summary.Cell index={0}>
                      <strong>TOTAL</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      {formatNumber(data?.totals?.total_transactions || 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      {formatCurrency(data?.totals?.total_amount || 0)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <strong>{formatCurrency(data?.totals?.total_commission || 0)}</strong>
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
            Period: {data?.period?.from} to {data?.period?.to}
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionSummary;
