"use client";
import { useEffect, useState } from "react";
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message } from "antd";
import { PlusOutlined, DeleteOutlined, CheckOutlined } from "@ant-design/icons";
import { BlueButton } from "@/components";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { SenderID, SenderIDListResponse } from "@/utils/types";

const SenderIDManagement = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchSenderIds();
  }, []);

  const fetchSenderIds = async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const res: SenderIDListResponse = await apiService.get({
        endPoint: apiEndpoints.senderIds,
      });
      setSenderIds(res.sender_ids);
    } catch (err) {
      messageApi.error("Failed to load sender IDs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSenderID = async (values: any) => {
    setSubmitting(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.senderIds,
        body: {
          sender_id: values.sender_id,
          type: values.type,
          is_default: values.is_default || false,
        },
      });
      messageApi.success("Sender ID added successfully");
      setModalVisible(false);
      form.resetFields();
      fetchSenderIds();
    } catch (err) {
      messageApi.error("Failed to add sender ID");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    setActionLoading(id);
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.senderIdSetDefault(id),
        body: {},
      });
      messageApi.success("Default sender ID updated");
      fetchSenderIds();
    } catch (err) {
      messageApi.error("Failed to set default sender ID");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: "Delete Sender ID",
      content: "Are you sure you want to delete this sender ID?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        setActionLoading(id);
        try {
          const apiService = new AxiosHandler(messageApi);
          const response = await fetch(
            `${apiEndpoints.base}${apiEndpoints.senderIdDelete(id)}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  apiEndpoints.tokenSetUrl
                )}`,
                "Content-Type": "application/json",
              },
            }
          );
          const result = await response.json();
          if (response.ok) {
            messageApi.success("Sender ID deleted successfully");
            fetchSenderIds();
          } else {
            messageApi.error(result.error || "Failed to delete sender ID");
          }
        } catch (err) {
          messageApi.error("Failed to delete sender ID");
        } finally {
          setActionLoading(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "Sender ID",
      dataIndex: "sender_id",
      key: "sender_id",
      render: (text: string, record: SenderID) => (
        <span className="font-semibold">
          {text}
          {record.is_default && (
            <Tag color="blue" className="ml-2">
              Default
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={type === "transactional" ? "green" : "orange"}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: SenderID) => (
        <Space>
          {!record.is_default && (
            <Button
              type="link"
              icon={<CheckOutlined />}
              onClick={() => handleSetDefault(record.id)}
              loading={actionLoading === record.id}
            >
              Set as Default
            </Button>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            loading={actionLoading === record.id}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">SMS Sender IDs</h1>
        <p className="text-gray-600 mt-2">
          Manage your SMS sender IDs for bulk campaigns
        </p>
      </div>

      <div className="max-w-4xl">
        <Card
          title="Your Sender IDs"
          extra={
            <BlueButton
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Add Sender ID
            </BlueButton>
          }
        >
          <Table
            columns={columns}
            dataSource={senderIds}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        </Card>

        <Card className="mt-4">
          <h3 className="font-semibold mb-2">About Sender IDs</h3>
          <ul className="text-gray-600 space-y-1">
            <li>• Sender IDs appear as the sender name in SMS messages</li>
            <li>• Maximum 11 characters, alphanumeric only</li>
            <li>• Transactional: For alerts, OTPs, notifications</li>
            <li>• Promotional: For marketing messages</li>
            <li>• Set one sender ID as default for quick access</li>
          </ul>
        </Card>
      </div>

      <Modal
        title="Add New Sender ID"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddSenderID}
          className="mt-4"
        >
          <Form.Item
            label="Sender ID"
            name="sender_id"
            rules={[
              { required: true, message: "Please enter sender ID" },
              { max: 11, message: "Sender ID must be 11 characters or less" },
              {
                pattern: /^[a-zA-Z0-9]+$/,
                message: "Sender ID must be alphanumeric",
              },
            ]}
          >
            <Input
              placeholder="e.g., HISA, MyBrand"
              maxLength={11}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Please select type" }]}
          >
            <Select placeholder="Select sender ID type">
              <Select.Option value="transactional">
                Transactional (Alerts, OTPs, Notifications)
              </Select.Option>
              <Select.Option value="promotional">
                Promotional (Marketing, Promotions)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_default" valuePropName="checked">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Set as default sender ID
            </label>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <BlueButton htmlType="submit" loading={submitting}>
                Add Sender ID
              </BlueButton>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SenderIDManagement;
