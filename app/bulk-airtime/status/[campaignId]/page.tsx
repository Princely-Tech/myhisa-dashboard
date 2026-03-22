"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Table,
  message,
  Statistic,
  Row,
  Col,
  Progress,
  Button,
  Tag,
  Space,
  Tabs,
} from "antd";
import {
  ReloadOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BulkCampaignStatusResponse } from "@/utils/types";
import { plainKoboNairaConvert } from "@/utils/helperfunctions";
import SMSDetails from "./sms-details";

const BulkAirtimeStatus = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [data, setData] = useState<BulkCampaignStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const params = useParams();
  const campaignId = params.campaignId as string;

  useEffect(() => {
    fetchCampaignStatus();
    const interval = setInterval(fetchCampaignStatus, 10000);
    return () => clearInterval(interval);
  }, [campaignId, currentPage, pageSize]);

  const fetchCampaignStatus = async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: `${apiEndpoints.bulkAirtimeCampaignById(campaignId)}?page=${currentPage}&limit=${pageSize}`,
      });
      setData(res);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    setActionLoading("pause");
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.bulkAirtimePause(campaignId),
        body: {},
      });
      messageApi.success("Campaign paused successfully");
      fetchCampaignStatus();
    } catch (err) {
      messageApi.error("Failed to pause campaign");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async () => {
    setActionLoading("resume");
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.bulkAirtimeResume(campaignId),
        body: {},
      });
      messageApi.success("Campaign resumed successfully");
      fetchCampaignStatus();
    } catch (err) {
      messageApi.error("Failed to resume campaign");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    setActionLoading("cancel");
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.bulkAirtimeCancel(campaignId),
        body: {},
      });
      messageApi.success("Campaign cancelled successfully");
      fetchCampaignStatus();
    } catch (err) {
      messageApi.error("Failed to cancel campaign");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_confirmation: "blue",
      processing: "orange",
      paused: "gold",
      completed: "green",
      cancelled: "red",
      success: "green",
      failed: "red",
      pending: "default",
      skipped: "gray",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Row",
      dataIndex: "row_number",
      key: "row_number",
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `NGN ${plainKoboNairaConvert(amount)}`,
    },
    {
      title: "Network",
      dataIndex: "network",
      key: "network",
      render: (network: string) => network.toUpperCase(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      ellipsis: true,
    },
    {
      title: "Processed At",
      dataIndex: "processed_at",
      key: "processed_at",
      render: (date: string) =>
        date ? new Date(date).toLocaleString() : "-",
    },
  ];

  if (loading) {
    return (
      <div className="flex-1 border px-4 pt-2 pb-5 flex justify-center items-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 border px-4 pt-2 pb-5 flex justify-center items-center min-h-screen">
        <div>Campaign not found</div>
      </div>
    );
  }

  const progressPercent =
    data.summary.total_items > 0
      ? Math.round(
          (data.summary.processed_count / data.summary.total_items) * 100
        )
      : 0;

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Campaign Status
          </h1>
          <p className="text-gray-600 mt-2">
            Campaign ID: {data.campaign.campaign_id}
          </p>
          <p className="text-gray-600">
            File: {data.campaign.file_name} |{" "}
            <Tag color={getStatusColor(data.campaign.status)}>
              {data.campaign.status.toUpperCase()}
            </Tag>
          </p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchCampaignStatus}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="max-w-6xl">
        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Progress</h3>
          <Progress
            percent={progressPercent}
            status={
              data.campaign.status === "completed"
                ? "success"
                : data.campaign.status === "cancelled"
                ? "exception"
                : "active"
            }
            strokeColor={{
              "0%": "#108ee9",
              "100%": "#87d068",
            }}
          />
          <div className="mt-4">
            <p className="text-gray-600">
              {data.summary.processed_count} of {data.summary.total_items}{" "}
              items processed
            </p>
          </div>
        </Card>

        <Card className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Total Items"
                value={data.summary.total_items}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Successful"
                value={data.summary.success_count}
                valueStyle={{ color: "#3f8600" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Failed"
                value={data.summary.failed_count}
                valueStyle={{ color: "#cf1322" }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Pending"
                value={data.summary.pending_count}
                valueStyle={{ color: "#1890ff" }}
              />
            </Col>
          </Row>
          <Row gutter={16} className="mt-4">
            <Col span={8}>
              <Statistic
                title="Total Amount"
                value={plainKoboNairaConvert(data.campaign.total_amount)}
                prefix="NGN"
                precision={2}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="SMS Cost"
                value={plainKoboNairaConvert(data.campaign.total_sms_cost)}
                prefix="NGN"
                precision={2}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Amount Debited"
                value={plainKoboNairaConvert(data.campaign.amount_debited)}
                prefix="NGN"
                precision={2}
              />
            </Col>
          </Row>
        </Card>

        {data.campaign.status === "processing" && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Controls</h3>
            <Space>
              <Button
                icon={<PauseCircleOutlined />}
                onClick={handlePause}
                loading={actionLoading === "pause"}
                type="default"
              >
                Pause Campaign
              </Button>
              <Button
                icon={<StopOutlined />}
                onClick={handleCancel}
                loading={actionLoading === "cancel"}
                danger
              >
                Cancel Campaign
              </Button>
            </Space>
          </Card>
        )}

        {data.campaign.status === "paused" && (
          <Card className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Campaign Controls</h3>
            <Space>
              <Button
                icon={<PlayCircleOutlined />}
                onClick={handleResume}
                loading={actionLoading === "resume"}
                type="primary"
              >
                Resume Campaign
              </Button>
              <Button
                icon={<StopOutlined />}
                onClick={handleCancel}
                loading={actionLoading === "cancel"}
                danger
              >
                Cancel Campaign
              </Button>
            </Space>
          </Card>
        )}

        <Tabs defaultActiveKey="items" className="mt-6">
          <Tabs.TabPane tab="Campaign Items" key="items">
            <Card>
              <Table
                columns={columns}
                dataSource={data.items}
                rowKey="id"
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: data.pagination.total_items,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} items`,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  onChange: (page, size) => {
                    setCurrentPage(page);
                    setPageSize(size || 10);
                  },
                }}
                scroll={{ x: 1200 }}
              />
            </Card>
          </Tabs.TabPane>
          <Tabs.TabPane tab="SMS Details" key="sms">
            <SMSDetails campaignId={campaignId} />
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default BulkAirtimeStatus;
