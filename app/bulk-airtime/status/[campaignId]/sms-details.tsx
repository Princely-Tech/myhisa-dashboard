"use client";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  message,
  Select,
  Button,
  Modal,
  Tag,
  Statistic,
  Row,
  Col,
} from "antd";
import { ReloadOutlined, EyeOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { plainKoboNairaConvert } from "@/utils/helperfunctions";

const { Option } = Select;

interface SMSDetail {
  row_number: number;
  sn: string;
  name: string;
  phone: string;
  message: string;
  status: string;
  processed_at?: string;
  sms_sent: boolean;
  sms_transaction_id?: string;
  sms_cost: number;
  sms_cost_naira: number;
  sms_status?: string;
}

interface SMSStatistics {
  total_with_message: number;
  total_sms_sent: number;
  total_sms_failed: number;
  total_sms_cost: number;
  total_sms_cost_naira: number;
}

interface SMSData {
  campaign_id: string;
  campaign_info: {
    file_name: string;
    total_rows: number;
    message_template: string;
    sender_id: string;
    status: string;
  };
  sms_statistics: SMSStatistics;
  sms_details: SMSDetail[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

interface SMSDetailsProps {
  campaignId: string;
}

const SMSDetails: React.FC<SMSDetailsProps> = ({ campaignId }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [smsData, setSmsData] = useState<SMSData | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [hasMessageFilter, setHasMessageFilter] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<SMSDetail | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);

  useEffect(() => {
    fetchSMSDetails();
  }, [campaignId, page, pageSize, statusFilter, hasMessageFilter]);

  const fetchSMSDetails = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (statusFilter) params.append("status", statusFilter);
      if (hasMessageFilter) params.append("has_message", hasMessageFilter);

      const res = await apiService.get({
        endPoint: `${apiEndpoints.bulkAirtimeCampaignSMS(campaignId)}?${params}`,
      });
      setSmsData(res);
    } catch (err) {
      console.error("Error fetching SMS details:", err);
    } finally {
      setLoading(false);
    }
  };

  const viewMessage = (item: SMSDetail) => {
    setSelectedMessage(item);
    setShowMessageModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: "green",
      successful: "green",
      failed: "red",
      pending: "blue",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: "Row",
      dataIndex: "row_number",
      key: "row_number",
      width: 70,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 150,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "Message",
      dataIndex: "message",
      key: "message",
      ellipsis: true,
      render: (text: string) => {
        if (!text) return <span className="text-gray-400">No message</span>;
        return text.length > 50 ? `${text.substring(0, 50)}...` : text;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string, record: SMSDetail) => (
        <div className="flex flex-col gap-1">
          <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
          {record.sms_sent && (
            <Tag color="green" className="text-xs">
              SMS SENT
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "SMS Cost",
      dataIndex: "sms_cost_naira",
      key: "sms_cost_naira",
      width: 100,
      render: (cost: number) =>
        cost ? `₦${cost.toFixed(2)}` : <span className="text-gray-400">-</span>,
    },
    {
      title: "Sent At",
      dataIndex: "processed_at",
      key: "processed_at",
      width: 160,
      render: (date: string) =>
        date ? new Date(date).toLocaleString() : <span className="text-gray-400">-</span>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_: any, record: SMSDetail) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => viewMessage(record)}
          disabled={!record.message}
        >
          View
        </Button>
      ),
    },
  ];

  if (!smsData && loading) {
    return (
      <Card>
        <div className="text-center py-10">Loading SMS details...</div>
      </Card>
    );
  }

  if (!smsData) {
    return null;
  }

  const successRate =
    smsData.sms_statistics.total_with_message > 0
      ? (
          (smsData.sms_statistics.total_sms_sent /
            smsData.sms_statistics.total_with_message) *
          100
        ).toFixed(1)
      : "0";

  return (
    <div>
      {contextHolder}
      
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">SMS Statistics</h3>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Messages"
              value={smsData.sms_statistics.total_with_message}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Sent Successfully"
              value={smsData.sms_statistics.total_sms_sent}
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Failed"
              value={smsData.sms_statistics.total_sms_failed}
              valueStyle={{ color: "#cf1322" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Success Rate"
              value={successRate}
              suffix="%"
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
        </Row>
        <Row gutter={16} className="mt-4">
          <Col span={12}>
            <Statistic
              title="Total SMS Cost"
              value={smsData.sms_statistics.total_sms_cost_naira}
              prefix="₦"
              precision={2}
            />
          </Col>
          <Col span={12}>
            <div className="text-sm text-gray-600 mt-4">
              <p>
                <strong>Sender ID:</strong> {smsData.campaign_info.sender_id || "N/A"}
              </p>
              {smsData.campaign_info.message_template && (
                <p className="mt-2">
                  <strong>Template:</strong> {smsData.campaign_info.message_template}
                </p>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">SMS Details</h3>
          <div className="flex gap-2">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              placeholder="Filter by status"
              allowClear
            >
              <Option value="">All Statuses</Option>
              <Option value="success">Success</Option>
              <Option value="failed">Failed</Option>
              <Option value="pending">Pending</Option>
            </Select>

            <Select
              value={hasMessageFilter}
              onChange={setHasMessageFilter}
              style={{ width: 150 }}
              placeholder="Filter by message"
              allowClear
            >
              <Option value="">All Items</Option>
              <Option value="true">With Message</Option>
              <Option value="false">Without Message</Option>
            </Select>

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchSMSDetails}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={smsData.sms_details}
          rowKey="row_number"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: smsData.pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} SMS`,
            pageSizeOptions: ["10", "20", "50", "100"],
            onChange: (newPage, newPageSize) => {
              setPage(newPage);
              setPageSize(newPageSize || 20);
            },
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Modal
        title="SMS Message Details"
        open={showMessageModal}
        onCancel={() => {
          setShowMessageModal(false);
          setSelectedMessage(null);
        }}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setShowMessageModal(false);
              setSelectedMessage(null);
            }}
          >
            Close
          </Button>,
        ]}
        width={600}
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Recipient</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedMessage.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cost</p>
                  <p className="font-medium">
                    ₦{selectedMessage.sms_cost_naira?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sent At</p>
                  <p className="font-medium">
                    {selectedMessage.processed_at
                      ? new Date(selectedMessage.processed_at).toLocaleString()
                      : "Not sent"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Message Content</p>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Characters: {selectedMessage.message.length}</span>
              <span>
                SMS Units: {Math.ceil(selectedMessage.message.length / 160)}
              </span>
            </div>

            {selectedMessage.sms_transaction_id && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-gray-600">Transaction ID</p>
                <p className="font-mono text-sm">
                  {selectedMessage.sms_transaction_id}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SMSDetails;
