"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Table, message, Tag, Button, Space } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { BulkCampaignsListResponse, BulkCampaign } from "@/utils/types";
import { plainKoboNairaConvert } from "@/utils/helperfunctions";
import type { TablePaginationConfig } from "antd";

const BulkAirtimeCampaigns = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<BulkCampaignsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const router = useRouter();

  useEffect(() => {
    fetchCampaigns();
  }, [currentPage, pageSize]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: `${apiEndpoints.bulkAirtimeCampaigns}?page=${currentPage}&limit=${pageSize}`,
      });
      setData(res);
    } catch (err) {
      messageApi.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current || 1);
    setPageSize(pagination.pageSize || 20);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_confirmation: "blue",
      processing: "orange",
      paused: "gold",
      completed: "green",
      cancelled: "red",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Campaign ID",
      dataIndex: "campaign_id",
      key: "campaign_id",
      width: 180,
      ellipsis: true,
    },
    {
      title: "File Name",
      dataIndex: "file_name",
      key: "file_name",
    },
    {
      title: "Total Rows",
      dataIndex: "total_rows",
      key: "total_rows",
      width: 100,
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (amount: number) => `NGN ${plainKoboNairaConvert(amount)}`,
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
      width: 150,
    },
    {
      title: "Progress",
      key: "progress",
      render: (_: any, record: BulkCampaign) => (
        <div>
          <div className="text-sm">
            {record.processed_count} / {record.total_rows}
          </div>
          <div className="text-xs text-gray-500">
            Success: {record.success_count} | Failed: {record.failed_count}
          </div>
        </div>
      ),
      width: 150,
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString(),
      width: 180,
    },
    {
      title: "Completed At",
      dataIndex: "completed_at",
      key: "completed_at",
      render: (date: string) =>
        date ? new Date(date).toLocaleString() : "-",
      width: 180,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 100,
      render: (_: any, record: BulkCampaign) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => router.push(routes.bulkAirtimeStatus(record.campaign_id))}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-hidden">
      {contextHolder}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Bulk Airtime Campaigns
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage all your bulk airtime campaigns
          </p>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchCampaigns}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            onClick={() => router.push(routes.bulkAirtimeUpload)}
          >
            New Campaign
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data?.pagination.total || 0,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} campaigns`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default BulkAirtimeCampaigns;
