'use client';

import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Select, Spin, message as antMessage } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { aiService, Ticket } from '@/utils/api/aiService';

const { Option } = Select;

const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const router = useRouter();
  const [messageApi, contextHolder] = antMessage.useMessage();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await aiService.getTickets({
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setTickets(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.meta?.total || 0,
      }));
    } catch (error: any) {
      messageApi.error('Failed to load tickets');
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, pagination.page]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'gold';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'blue';
      case 'in_progress':
        return 'processing';
      case 'resolved':
        return 'success';
      case 'closed':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Ticket Code',
      dataIndex: 'ticket_code',
      key: 'ticket_code',
      render: (code: string) => (
        <span className="font-mono text-indigo-600 font-semibold">{code}</span>
      ),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag>{category.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ').toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (
        <Tag color={source === 'ai' ? 'purple' : 'default'}>{source.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: Ticket) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => router.push(`/tickets/${record.ticket_code}`)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-600 mt-1">Manage and track your support requests</p>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchTickets}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <div className="mb-4 flex gap-4">
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 200 }}
            onChange={setStatusFilter}
            value={statusFilter}
          >
            <Option value="open">Open</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="resolved">Resolved</Option>
            <Option value="closed">Closed</Option>
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

export default TicketsPage;
