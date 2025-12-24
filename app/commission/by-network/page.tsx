"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, DatePicker, Select, Spin, message, Table } from "antd";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import {
  TRANSACTION_TYPES,
  CHART_COLORS,
  formatCurrency,
  formatNumber,
  CommissionByNetworkData,
} from "@/utils/commissionHelpers";
import { BlueButton } from "@/components";
import { handleDownloadCSV, plainKoboNairaConvert } from "@/utils/helperfunctions";
import { CustomButton } from "@/components/buttons";

const { RangePicker } = DatePicker;
const { Option } = Select;

const CommissionByNetwork = () => {
  const [data, setData] = useState<CommissionByNetworkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(firstDayOfMonth),
    dayjs(currentDate),
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const fetchCommissionByNetwork = useCallback(async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const fromDate = dateRange[0].format("YYYY-MM-DD");
      const toDate = dateRange[1].format("YYYY-MM-DD");
      const typesParam = selectedTypes.length > 0 ? `&types=${selectedTypes.join(",")}` : "";
      
      const response = await apiService.get({
        endPoint: `${apiEndpoints.commissionByNetwork}?from_date=${fromDate}&to_date=${toDate}${typesParam}`,
      });
      
      setData(response);
    } catch (error) {
      console.error("Error fetching commission by network:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedTypes, messageApi]);

  useEffect(() => {
    fetchCommissionByNetwork();
  }, [fetchCommissionByNetwork]);

  const groupedByNetwork = data?.data?.reduce((acc: any, item) => {
    if (!acc[item.network]) {
      acc[item.network] = {
        network: item.network,
        types: {},
        total_commission: 0,
        total_transactions: 0,
      };
    }
    acc[item.network].types[item.type] = item.total_commission / 100;
    acc[item.network].total_commission += item.total_commission;
    acc[item.network].total_transactions += item.total_transactions;
    return acc;
  }, {}) || {};

  const chartData = groupedByNetwork
    ? Object.values(groupedByNetwork).map((item: any) => ({
        network: item.network.toUpperCase(),
        ...item.types,
      }))
    : [];

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      render: (text: string) => text.toUpperCase(),
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

  const totalCommission = data?.data?.reduce((sum, item) => sum + item.total_commission, 0) || 0;
  const totalTransactions = data?.data?.reduce((sum, item) => sum + item.total_transactions, 0) || 0;
  const totalAmount = data?.data?.reduce((sum, item) => sum + item.total_amount, 0) || 0;

  const handleExport = () => {
    if (!data || !data.data) return;
    
    const exportData = data.data.map((item) => ({
      Type: item.type,
      Network: item.network.toUpperCase(),
      "Total Transactions": item.total_transactions,
      "Total Amount (₦)": plainKoboNairaConvert(item.total_amount),
      "Total Commission (₦)": plainKoboNairaConvert(item.total_commission),
      "Average Commission (₦)": plainKoboNairaConvert(item.average_commission),
    }));
    
    const fileName = `commission_by_network_${dateRange[0].format("YYYY-MM-DD")}_to_${dateRange[1].format("YYYY-MM-DD")}.csv`;
    handleDownloadCSV(exportData, fileName);
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Commission by Network</h2>

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
            <BlueButton onClick={fetchCommissionByNetwork} loading={loading}>
              Apply Filters
            </BlueButton>
            {data && data.data && data.data.length > 0 && (
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
                {formatCurrency(totalCommission)}
              </div>
            </Card>
            <Card className="bg-green-50">
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(totalTransactions)}
              </div>
            </Card>
            <Card className="bg-purple-50">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalAmount)}
              </div>
            </Card>
          </div>

          <Card title="Commission by Network (Grouped Bar Chart)" className="mb-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="network" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                <Legend />
                {TRANSACTION_TYPES.map((type) => (
                  <Bar
                    key={type.value}
                    dataKey={type.value}
                    fill={CHART_COLORS[type.value as keyof typeof CHART_COLORS]}
                    name={type.label}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Detailed Network Performance Table">
            <Table
              dataSource={data?.data || []}
              columns={columns}
              rowKey={(record) => `${record.type}-${record.network}`}
              pagination={false}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row className="bg-gray-100 font-bold">
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>TOTAL</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      {formatNumber(totalTransactions)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      {formatCurrency(totalAmount)}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <strong>{formatCurrency(totalCommission)}</strong>
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
            Period: {data?.period?.from} to {data?.period?.to}
          </div>
        </>
      )}
    </div>
  );
};

export default CommissionByNetwork;
