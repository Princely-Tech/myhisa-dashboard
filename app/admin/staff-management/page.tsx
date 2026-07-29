"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  message,
  Input,
  Table,
  Tag,
  Modal,
  Select,
  Checkbox,
  Popconfirm,
  Spin,
  Tooltip,
} from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, CustomButton, RedButton } from "@/components/buttons";
import { EditOutlined, UserDeleteOutlined, SearchOutlined } from "@ant-design/icons";
import { Permission, StaffUser } from "@/utils/types";
import useRequirePermission from "@/utils/useRequirePermission";

const { Option } = Select;
const { TextArea } = Input;

const RANK_USER = 0;
const RANK_STAFF = 1;
const RANK_SUPER_ADMIN = 2;

const rankLabel = (rank: number) => {
  if (rank === RANK_SUPER_ADMIN) return "Super Admin";
  if (rank === RANK_STAFF) return "Staff";
  return "Regular User";
};

const rankColor = (rank: number) => {
  if (rank === RANK_SUPER_ADMIN) return "gold";
  if (rank === RANK_STAFF) return "blue";
  return "default";
};

interface SearchUser {
  id: number;
  name: string;
  email: string;
  rank: number;
}

const StaffManagementPage = () => {
  const authorized = useRequirePermission(); // super-admin only page
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = useMemo(() => new AxiosHandler(messageApi), [messageApi]);

  const [catalog, setCatalog] = useState<Permission[]>([]);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);

  const [editingUser, setEditingUser] = useState<SearchUser | StaffUser | null>(null);
  const [editRank, setEditRank] = useState<number>(RANK_STAFF);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authorized) return;
    fetchCatalog();
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  async function fetchCatalog() {
    const response = await apiService.get({ endPoint: apiEndpoints.adminPermissionsCatalog });
    setCatalog(response?.data || []);
  }

  async function fetchStaff() {
    setLoading(true);
    try {
      const response = await apiService.get({ endPoint: apiEndpoints.adminStaffList });
      setStaff(response?.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await apiService.get({
        endPoint: `${apiEndpoints.users}?search=${encodeURIComponent(searchTerm)}&per_page=10`,
      });
      setSearchResults(response?.data?.users || []);
    } finally {
      setSearching(false);
    }
  }

  function openEditModal(user: SearchUser | StaffUser) {
    setEditingUser(user);
    setEditRank(user.rank || RANK_STAFF);
    setEditPermissions(("permissions" in user && user.permissions) || []);
    setReason("");
  }

  function closeEditModal() {
    setEditingUser(null);
    setReason("");
  }

  async function saveStaffAccess() {
    if (!editingUser) return;
    if (!reason.trim()) {
      messageApi.warning("A reason is required for this change.");
      return;
    }

    setSaving(true);
    try {
      await apiService.put({
        endPoint: apiEndpoints.adminStaffDetail(editingUser.id),
        body: {
          rank: editRank,
          permissions: editRank === RANK_STAFF ? editPermissions : [],
          reason,
        },
      });
      messageApi.success("Access updated successfully");
      closeEditModal();
      fetchStaff();
      searchUsers();
    } catch (error) {
      // AxiosHandler already surfaces the server's error/message toast
    } finally {
      setSaving(false);
    }
  }

  async function revokeAccess(user: StaffUser) {
    try {
      await apiService.put({
        endPoint: apiEndpoints.adminStaffDetail(user.id),
        body: { rank: RANK_USER, permissions: [], reason: "Revoked via Staff Management" },
      });
      messageApi.success(`Access revoked for ${user.name}`);
      fetchStaff();
    } catch (error) {
      // handled by AxiosHandler
    }
  }

  const categories = useMemo(() => {
    const map = new Map<string, Permission[]>();
    catalog.forEach((permission) => {
      const list = map.get(permission.category) || [];
      list.push(permission);
      map.set(permission.category, list);
    });
    return Array.from(map.entries());
  }, [catalog]);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Access Level",
      dataIndex: "rank",
      key: "rank",
      render: (rank: number) => <Tag color={rankColor(rank)}>{rankLabel(rank)}</Tag>,
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: string[], record: StaffUser) =>
        record.rank === RANK_SUPER_ADMIN ? (
          <Tag color="gold">All capabilities</Tag>
        ) : perms.length === 0 ? (
          <Tag color="default">No permissions granted</Tag>
        ) : (
          <div className="flex flex-wrap gap-1 max-w-md">
            {perms.map((p) => {
              const meta = catalog.find((c) => c.key === p);
              return (
                <Tag key={p} color="blue">
                  {meta?.label || p}
                </Tag>
              );
            })}
          </div>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: any, record: StaffUser) => (
        <div className="flex gap-2">
          <Tooltip title="Edit access">
            <button
              onClick={() => openEditModal(record)}
              className="text-blue-500 hover:text-blue-700"
            >
              <EditOutlined />
            </button>
          </Tooltip>
          <Popconfirm
            title="Revoke access?"
            description={`${record.name} will lose all staff/admin capabilities immediately.`}
            okText="Revoke"
            okButtonProps={{ danger: true }}
            onConfirm={() => revokeAccess(record)}
          >
            <Tooltip title="Revoke access">
              <button className="text-red-500 hover:text-red-700">
                <UserDeleteOutlined />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (!authorized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-1">Staff Management</h2>
      <p className="text-sm text-gray-600 mb-4">
        Grant staff members specific capabilities, or promote/revoke super admin access. Super
        admins always have every capability - permissions below only apply to staff.
      </p>

      <Card title="Grant Access to a User" className="mb-4">
        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Search by name or email..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={searchUsers}
          />
          <BlueButton onClick={searchUsers} loading={searching}>
            Search
          </BlueButton>
        </div>
        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-600">{user.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag color={rankColor(user.rank)}>{rankLabel(user.rank)}</Tag>
                  <BlueButton onClick={() => openEditModal(user)}>Manage Access</BlueButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Elevated Users (Staff & Super Admins)">
        <Table
          dataSource={staff}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingUser ? `Manage Access - ${editingUser.name}` : "Manage Access"}
        open={!!editingUser}
        onCancel={closeEditModal}
        width={600}
        footer={[
          <CustomButton key="cancel" onClick={closeEditModal}>
            Cancel
          </CustomButton>,
          <BlueButton key="save" onClick={saveStaffAccess} loading={saving}>
            Save
          </BlueButton>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Access Level</label>
            <Select value={editRank} onChange={setEditRank} className="w-full">
              <Option value={RANK_USER}>Regular User (no admin access)</Option>
              <Option value={RANK_STAFF}>Staff (choose specific permissions below)</Option>
              <Option value={RANK_SUPER_ADMIN}>Super Admin (all capabilities)</Option>
            </Select>
          </div>

          {editRank === RANK_STAFF && (
            <div>
              <label className="block mb-2 font-medium">Permissions</label>
              <div className="max-h-72 overflow-y-auto border rounded p-3 space-y-3">
                {categories.map(([category, perms]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">
                      {category}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {perms.map((permission) => (
                        <Checkbox
                          key={permission.key}
                          checked={editPermissions.includes(permission.key)}
                          onChange={(e) => {
                            setEditPermissions((prev) =>
                              e.target.checked
                                ? [...prev, permission.key]
                                : prev.filter((p) => p !== permission.key)
                            );
                          }}
                        >
                          <span className="font-medium">{permission.label}</span>
                          <span className="text-xs text-gray-500 block">
                            {permission.description}
                          </span>
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editRank === RANK_SUPER_ADMIN && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
              Super admins bypass all permission checks and have every capability in the system.
            </div>
          )}

          <div>
            <label className="block mb-2 font-medium">Reason (required)</label>
            <TextArea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this change being made? This is recorded in the audit log."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffManagementPage;
