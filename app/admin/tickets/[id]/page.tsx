"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Tag,
  Button,
  Input,
  Select,
  Timeline,
  Spin,
  message as antMessage,
  Avatar,
} from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  UserOutlined,
  UserSwitchOutlined,
} from "@ant-design/icons";
import { useRouter, useParams } from "next/navigation";
import routes from "@/utils/routes";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import useRequirePermission from "@/utils/useRequirePermission";
import { isSuperAdmin } from "@/utils/permissions";
import { User, StaffUser } from "@/utils/types";
import { aiService, Ticket, TicketMessage } from "@/utils/api/aiService";

const { TextArea } = Input;
const { Option } = Select;

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

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

const AdminTicketDetailPage: React.FC = () => {
  const authorized = useRequirePermission("tickets.manage");
  const [messageApi, contextHolder] = antMessage.useMessage();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [me, setMe] = useState<User | null>(null);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [statusValue, setStatusValue] = useState<string | undefined>(undefined);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    if (raw) setMe(JSON.parse(raw) as User);
  }, []);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const response = await aiService.adminGetTicket(ticketId);
      setTicket(response.data);
      setStatusValue(response.data.status);
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized || !ticketId) return;
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, ticketId]);

  // The full staff directory is super-admin only server-side (see
  // /admin/staff in main.go) - a staff member with just tickets.manage can
  // still assign tickets to themselves without it, just not to a colleague.
  useEffect(() => {
    if (!authorized || !isSuperAdmin(me)) return;
    (async () => {
      try {
        const apiService = new AxiosHandler(messageApi);
        const response = await apiService.get({ endPoint: apiEndpoints.adminStaffList });
        setStaff(response.data || []);
      } catch (err) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, me]);

  if (!authorized) return null;

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    setSending(true);
    try {
      await aiService.adminReplyToTicket(ticket.id, newMessage);
      messageApi.success("Reply sent");
      setNewMessage("");
      fetchTicket();
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!ticket || !statusValue || statusValue === ticket.status) return;
    setUpdatingStatus(true);
    try {
      await aiService.adminUpdateTicketStatus(ticket.id, statusValue);
      messageApi.success("Status updated");
      fetchTicket();
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolve = async () => {
    if (!ticket || !resolution.trim()) return;
    setResolving(true);
    try {
      await aiService.adminResolveTicket(ticket.id, resolution);
      messageApi.success("Ticket resolved");
      setResolution("");
      fetchTicket();
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "Failed to resolve ticket");
    } finally {
      setResolving(false);
    }
  };

  const assignTo = async (userId?: number) => {
    if (!ticket || !userId) return;
    setAssigning(true);
    try {
      await aiService.adminAssignTicket(ticket.id, userId);
      messageApi.success("Ticket assigned");
      setAssigneeId(undefined);
      fetchTicket();
    } catch (error: any) {
      messageApi.error(error.response?.data?.error || "Failed to assign ticket");
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Spin size="large" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(routes.adminTickets)}>
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
      <div className="h-screen overflow-auto flex-1">
        <div className="p-6 max-w-5xl mx-auto">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(routes.adminTickets)}
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
                <Tag color={getPriorityColor(ticket.priority)}>{ticket.priority.toUpperCase()}</Tag>
                <Tag color={getStatusColor(ticket.status)}>
                  {ticket.status.replace("_", " ").toUpperCase()}
                </Tag>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-gray-600 text-sm">Requester:</span>
                <p className="font-medium">
                  {ticket.user?.name}
                  {ticket.user?.email && (
                    <span className="text-gray-500 font-normal"> ({ticket.user.email})</span>
                  )}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Category:</span>
                <p className="font-medium">{ticket.category.replace("_", " ").toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Source:</span>
                <p className="font-medium">{ticket.source.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Assigned To:</span>
                <p className="font-medium">
                  {ticket.assigned_user?.name || <span className="text-gray-400">Unassigned</span>}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Created:</span>
                <p className="font-medium">{new Date(ticket.created_at).toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Last Updated:</span>
                <p className="font-medium">{new Date(ticket.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <span className="text-gray-600 text-sm block mb-2">Description:</span>
              <p className="text-gray-900">{ticket.description}</p>
            </div>

            {ticket.resolution && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <span className="text-green-800 font-semibold block mb-2">
                  ✅ Resolution {ticket.resolved_user?.name && `(by ${ticket.resolved_user.name})`}:
                </span>
                <p className="text-green-900">{ticket.resolution}</p>
              </div>
            )}
          </Card>

          <Card title="Ticket Management" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <span className="text-gray-600 text-sm block mb-2">Update Status</span>
                <div className="flex gap-2">
                  <Select value={statusValue} onChange={setStatusValue} style={{ width: 180 }}>
                    {STATUS_OPTIONS.map((s) => (
                      <Option key={s} value={s}>
                        {s.replace("_", " ").toUpperCase()}
                      </Option>
                    ))}
                  </Select>
                  <Button
                    onClick={handleUpdateStatus}
                    loading={updatingStatus}
                    disabled={statusValue === ticket.status}
                  >
                    Update
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-gray-600 text-sm block mb-2">Assign Ticket</span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    icon={<UserSwitchOutlined />}
                    onClick={() => assignTo(me?.id)}
                    loading={assigning}
                    disabled={!me || ticket.assigned_to === me.id}
                  >
                    Assign to Me
                  </Button>
                  {isSuperAdmin(me) && (
                    <>
                      <Select
                        placeholder="Assign to staff member"
                        style={{ width: 220 }}
                        value={assigneeId}
                        onChange={setAssigneeId}
                        showSearch
                        optionFilterProp="children"
                      >
                        {staff.map((s) => (
                          <Option key={s.id} value={s.id}>
                            {s.name} ({s.email})
                          </Option>
                        ))}
                      </Select>
                      <Button
                        onClick={() => assignTo(assigneeId)}
                        loading={assigning}
                        disabled={!assigneeId}
                      >
                        Assign
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {ticket.status !== "resolved" && ticket.status !== "closed" && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <span className="text-gray-600 text-sm block mb-2">Resolve Ticket</span>
                <TextArea
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this ticket was resolved..."
                  disabled={resolving}
                />
                <Button
                  type="primary"
                  onClick={handleResolve}
                  loading={resolving}
                  disabled={!resolution.trim()}
                  className="mt-2"
                >
                  Resolve Ticket
                </Button>
              </div>
            )}
          </Card>

          <Card title="Conversation" className="mb-6">
            {ticket.messages && ticket.messages.length > 0 ? (
              <Timeline>
                {ticket.messages.map((msg: TicketMessage) => (
                  <Timeline.Item
                    key={msg.id}
                    color={msg.is_staff ? "green" : "blue"}
                    dot={
                      <Avatar
                        size="small"
                        icon={<UserOutlined />}
                        style={{ backgroundColor: msg.is_staff ? "#52c41a" : "#1890ff" }}
                      />
                    }
                  >
                    <div className="mb-2">
                      <span className="font-semibold text-gray-900">
                        {msg.is_staff ? msg.user?.name || "Support Staff" : ticket.user?.name || "Requester"}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{msg.message}</p>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <p className="text-gray-500 text-center py-4">No messages yet</p>
            )}
          </Card>

          <Card title="Reply">
            <TextArea
              rows={4}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply to the requester..."
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
              Send Reply
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminTicketDetailPage;
