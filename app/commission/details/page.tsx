"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, DatePicker, Select, Spin, message, Table, Tag } from "antd";
import dayjs from "dayjs";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import {
  TRANSACTION_TYPES,
  formatCurrency,
  CommissionDetailsData,
} from "@/utils/commissionHelpers";
import { BlueButton } from "@/components";

const { RangePicker } = DatePicker;
const { Option } = Select;

const CommissionDetails = () => {
  const [data, setData] = useState<CommissionDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs(firstDayOfMonth),
    dayjs(currentDate),
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const fetchCommissionDetails = useCallback(async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const fromDate = dateRange[0].format("YYYY-MM-DD");
      const toDate = dateRange[1].format("YYYY-MM-DD");
      const typesParam = selectedTypes.length > 0 ? `&types=${selectedTypes.join(",")}` : "";
      
      const response = await apiService.get({
        endPoint: `${apiEndpoints.commissionDetails}?from_date=${fromDate}&to_date=${toDate}${typesParam}&page=${currentPage}&limit=${pageSize}`,
      });
      
      setData(response);
    } catch (error) {
      console.error("Error fetching commission details:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedTypes, currentPage, pageSize, messageApi]);

  useEffect(() => {
    fetchCommissionDetails();
  }, [fetchCommissionDetails]);

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      width: 180,
      render: (text: string) => <span className="font-mono text-xs">{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 120,
      render: (text: string) => (
        <Tag color={
          text === "Airtime" ? "blue" :
          text === "Data" ? "green" :
          text === "Cable" ? "orange" :
          text === "Electricity" ? "red" :
          "purple"
        }>
          {text}
        </Tag>
      ),
    },
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      width: 100,
      render: (text: string) => text.toUpperCase(),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      width: 120,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Commission",
      dataIndex: "commission_amount",
      key: "commission_amount",
      align: "right" as const,
      width: 120,
      render: (value: number) => <strong className="text-green-600">{formatCurrency(value)}</strong>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (text: string) => (
        <Tag color={text === "Successful" ? "success" : "error"}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (text: string) => dayjs(text).format("YYYY-MM-DD HH:mm:ss"),
    },
  ];

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Commission Details</h2>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-medium">Date Range</label>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates) {
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs]);
                  setCurrentPage(1);
                }
              }}
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
              onChange={(value) => {
                setSelectedTypes(value);
                setCurrentPage(1);
              }}
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
          <div className="flex items-end">
            <BlueButton onClick={fetchCommissionDetails} loading={loading}>
              Apply Filters
            </BlueButton>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="transaction_id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.pagination?.total || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            pageSizeOptions: ["20", "50", "100", "200"],
          }}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

export default CommissionDetails;
