"use client";

import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Select, message as antMessage } from "antd";
import { EyeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import useRequirePermission from "@/utils/useRequirePermission";
import { aiService, Ticket } from "@/utils/api/aiService";

const { Option } = Select;

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "urgent":
      return "red";
    case "high":
      return "orange";
    case "medium":
      return "gold";
    case "low":
      return "green";
    default:
      return "default";
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "open":
      return "blue";
    case "in_progress":
      return "processing";
    case "resolved":
      return "success";
    case "closed":
      return "default";
    default:
      return "default";
  }
};

const AdminTicketsPage: React.FC = () => {
  const authorized = useRequirePermission("tickets.manage");
  const [messageApi, contextHolder] = antMessage.useMessage();
  const router = useRouter();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    category?: string;
    source?: string;
  }>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await aiService.adminGetTickets({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      setTickets(response.data || []);
      setPagination((prev) => ({ ...prev, total: response.meta?.total || 0 }));
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, filters, pagination.page]);

  if (!authorized) return null;

  const columns = [
    {
      title: "Ticket Code",
      dataIndex: "ticket_code",
      key: "ticket_code",
      render: (code: string) => (
        <span className="font-mono text-indigo-600 font-semibold">{code}</span>
      ),
    },
    {
      title: "Requester",
      key: "requester",
      render: (_: any, record: Ticket) => (
        <div>
          <div className="font-medium">{record.user?.name || "—"}</div>
          <div className="text-xs text-gray-500">{record.user?.email}</div>
        </div>
      ),
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      ellipsis: true,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category: string) => <Tag>{category.replace("_", " ").toUpperCase()}</Tag>,
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace("_", " ").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Assigned To",
      key: "assigned_to",
      render: (_: any, record: Ticket) => record.assigned_user?.name || (
        <span className="text-gray-400">Unassigned</span>
      ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Ticket) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => router.push(routes.adminTicketDetail(record.id))}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="p-6 flex-1 max-h-full overflow-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-1">
              Every ticket raised by partners, across every account
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchTickets} loading={loading}>
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex flex-wrap gap-4">
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 180 }}
            value={filters.status}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, status: value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <Option value="open">Open</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="closed">Closed</Option>
          </Select>
          <Select
            placeholder="Filter by priority"
            allowClear
            style={{ width: 180 }}
            value={filters.priority}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, priority: value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: 200 }}
            value={filters.category}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, category: value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <Option value="general">General Inquiry</Option>
            <Option value="transaction_issue">Transaction Issue</Option>
            <Option value="data_plan_issue">Data Plan Issue</Option>
            <Option value="payment_issue">Payment Issue</Option>
            <Option value="ai_query">AI Assistant Issue</Option>
          </Select>
          <Select
            placeholder="Filter by source"
            allowClear
            style={{ width: 160 }}
            value={filters.source}
            onChange={(value) => {
              setFilters((prev) => ({ ...prev, source: value }));
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <Option value="manual">Manual</Option>
            <Option value="ai">AI</Option>
            <Option value="email">Email</Option>
            <Option value="chat">Chat</Option>
          </Select>
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: (page) => setPagination((prev) => ({ ...prev, page })),
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AdminTicketsPage;
