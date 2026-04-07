'use client';

import React, { useState, useEffect } from 'react';
import { Card, Tag, Button, Input, Timeline, Spin, message as antMessage, Avatar } from 'antd';
import { ArrowLeftOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { aiService, Ticket, TicketMessage } from '@/utils/api/aiService';

const { TextArea } = Input;

const TicketDetailPage: React.FC = () => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const router = useRouter();
  const params = useParams();
  const ticketCode = params.code as string;
  const [messageApi, contextHolder] = antMessage.useMessage();

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const response = await aiService.getTicket(ticketCode);
      setTicket(response.data);
    } catch (error: any) {
      messageApi.error('Failed to load ticket details');
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ticketCode) {
      fetchTicket();
    }
  }, [ticketCode]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;

    setSending(true);
    try {
      await aiService.addTicketMessage(ticket.id, newMessage);
      messageApi.success('Message sent successfully');
      setNewMessage('');
      fetchTicket();
    } catch (error: any) {
      messageApi.error('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <div className="text-center mt-10">
          <p className="text-gray-600">Ticket not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className="p-6 max-w-5xl mx-auto">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/tickets')}
          className="mb-4"
        >
          Back to Tickets
        </Button>

        <Card className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
              <p className="font-mono text-indigo-600 font-semibold">{ticket.ticket_code}</p>
            </div>
            <div className="flex gap-2">
              <Tag color={getPriorityColor(ticket.priority)}>
                {ticket.priority.toUpperCase()}
              </Tag>
              <Tag color={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Tag>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-gray-600 text-sm">Category:</span>
              <p className="font-medium">
                {ticket.category.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Source:</span>
              <p className="font-medium">{ticket.source.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Created:</span>
              <p className="font-medium">
                {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-gray-600 text-sm">Last Updated:</span>
              <p className="font-medium">
                {new Date(ticket.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <span className="text-gray-600 text-sm block mb-2">Description:</span>
            <p className="text-gray-900">{ticket.description}</p>
          </div>

          {ticket.resolution && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-800 font-semibold block mb-2">
                ✅ Resolution:
              </span>
              <p className="text-green-900">{ticket.resolution}</p>
            </div>
          )}
        </Card>

        <Card title="Conversation" className="mb-6">
          {ticket.messages && ticket.messages.length > 0 ? (
            <Timeline>
              {ticket.messages.map((msg: TicketMessage) => (
                <Timeline.Item
                  key={msg.id}
                  color={msg.is_staff ? 'green' : 'blue'}
                  dot={
                    <Avatar
                      size="small"
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: msg.is_staff ? '#52c41a' : '#1890ff',
                      }}
                    />
                  }
                >
                  <div className="mb-2">
                    <span className="font-semibold text-gray-900">
                      {msg.is_staff ? 'Support Staff' : 'You'}
                    </span>
                    <span className="text-gray-500 text-sm ml-2">
                      {new Date(msg.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {msg.message}
                  </p>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <p className="text-gray-500 text-center py-4">No messages yet</p>
          )}
        </Card>

        {ticket.status !== 'closed' && (
          <Card title="Add Message">
            <TextArea
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={sending}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={sending}
              disabled={!newMessage.trim()}
              className="mt-4"
            >
              Send Message
            </Button>
          </Card>
        )}
      </div>
    </>
  );
};

export default TicketDetailPage;
