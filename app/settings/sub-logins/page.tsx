"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  message,
  Input,
  Table,
  Tag,
  Modal,
  Checkbox,
  Popconfirm,
  Spin,
  Tooltip,
} from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, CustomButton } from "@/components/buttons";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { AccountPermission, SubLogin } from "@/utils/types";
import useRequirePrimaryLogin from "@/utils/useRequirePrimaryLogin";

const { Password } = Input;

const SubLoginManagementPage = () => {
  const authorized = useRequirePrimaryLogin();
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = useMemo(() => new AxiosHandler(messageApi), [messageApi]);

  const [catalog, setCatalog] = useState<AccountPermission[]>([]);
  const [subLogins, setSubLogins] = useState<SubLogin[]>([]);
  const [loading, setLoading] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);

  const [editingSubLogin, setEditingSubLogin] = useState<SubLogin | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authorized) return;
    fetchCatalog();
    fetchSubLogins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized]);

  async function fetchCatalog() {
    const response = await apiService.get({ endPoint: apiEndpoints.accountPermissionsCatalog });
    setCatalog(response?.data || []);
  }

  async function fetchSubLogins() {
    setLoading(true);
    try {
      const response = await apiService.get({ endPoint: apiEndpoints.subLoginList });
      setSubLogins(response?.data || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewPermissions([]);
    setCreating(true);
  }

  async function createSubLogin() {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      messageApi.warning("Name, email, and password are all required.");
      return;
    }

    setSaving(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.subLoginList,
        body: { name: newName, email: newEmail, password: newPassword, permissions: newPermissions },
      });
      messageApi.success("Sub-login created successfully");
      setCreating(false);
      fetchSubLogins();
    } catch (error) {
      // AxiosHandler already surfaces the server's error/message toast
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(subLogin: SubLogin) {
    setEditingSubLogin(subLogin);
    setEditPermissions(subLogin.permissions || []);
    setEditPassword("");
  }

  function closeEditModal() {
    setEditingSubLogin(null);
    setEditPassword("");
  }

  async function saveSubLogin() {
    if (!editingSubLogin) return;

    setSaving(true);
    try {
      const body: { permissions: string[]; password?: string } = {
        permissions: editPermissions,
      };
      if (editPassword.trim()) {
        body.password = editPassword;
      }
      await apiService.put({
        endPoint: apiEndpoints.subLoginDetail(editingSubLogin.id),
        body,
      });
      messageApi.success("Sub-login updated successfully");
      closeEditModal();
      fetchSubLogins();
    } catch (error) {
      // handled by AxiosHandler
    } finally {
      setSaving(false);
    }
  }

  async function deleteSubLogin(subLogin: SubLogin) {
    try {
      await apiService.delete({
        endPoint: apiEndpoints.subLoginDetail(subLogin.id),
        body: {},
      });
      messageApi.success(`${subLogin.name} removed`);
      fetchSubLogins();
    } catch (error) {
      // handled by AxiosHandler
    }
  }

  const categories = useMemo(() => {
    const map = new Map<string, AccountPermission[]>();
    catalog.forEach((permission) => {
      const list = map.get(permission.category) || [];
      list.push(permission);
      map.set(permission.category, list);
    });
    return Array.from(map.entries());
  }, [catalog]);

  function renderPermissionCheckboxes(
    selected: string[],
    onChange: (next: string[]) => void
  ) {
    return (
      <div className="max-h-72 overflow-y-auto border rounded p-3 space-y-3">
        {categories.map(([category, perms]) => (
          <div key={category}>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{category}</div>
            <div className="grid grid-cols-1 gap-1">
              {perms.map((permission) => (
                <Checkbox
                  key={permission.key}
                  checked={selected.includes(permission.key)}
                  onChange={(e) => {
                    onChange(
                      e.target.checked
                        ? [...selected, permission.key]
                        : selected.filter((p) => p !== permission.key)
                    );
                  }}
                >
                  <span className="font-medium">{permission.label}</span>
                  <span className="text-xs text-gray-500 block">{permission.description}</span>
                </Checkbox>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: string[]) =>
        perms.length === 0 ? (
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
      width: 100,
      render: (_: any, record: SubLogin) => (
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
            title="Remove this sub-login?"
            description={`${record.name} will no longer be able to log in.`}
            okText="Remove"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteSubLogin(record)}
          >
            <Tooltip title="Remove sub-login">
              <button className="text-red-500 hover:text-red-700">
                <DeleteOutlined />
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
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold">Sub-Login Management</h2>
        <BlueButton onClick={openCreateModal}>
          <PlusOutlined /> Add Sub-Login
        </BlueButton>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Create additional logins for your team that share this account&apos;s wallet and
        transactions, each restricted to only the capabilities you grant below.
      </p>

      <Card>
        <Table
          dataSource={subLogins}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="Add Sub-Login"
        open={creating}
        onCancel={() => setCreating(false)}
        width={600}
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton onClick={() => setCreating(false)}>Cancel</CustomButton>
            <BlueButton onClick={createSubLogin} loading={saving}>
              Create
            </BlueButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div>
            <label className="block mb-2 font-medium">Email</label>
            <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          <div>
            <label className="block mb-2 font-medium">Password</label>
            <Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="block mb-2 font-medium">Permissions</label>
            {renderPermissionCheckboxes(newPermissions, setNewPermissions)}
          </div>
        </div>
      </Modal>

      <Modal
        title={editingSubLogin ? `Manage Access - ${editingSubLogin.name}` : "Manage Access"}
        open={!!editingSubLogin}
        onCancel={closeEditModal}
        width={600}
        footer={
          <div className="flex justify-end gap-2">
            <CustomButton onClick={closeEditModal}>Cancel</CustomButton>
            <BlueButton onClick={saveSubLogin} loading={saving}>
              Save
            </BlueButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Permissions</label>
            {renderPermissionCheckboxes(editPermissions, setEditPermissions)}
          </div>
          <div>
            <label className="block mb-2 font-medium">Reset Password (optional)</label>
            <Password
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Leave blank to keep the current password"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SubLoginManagementPage;
