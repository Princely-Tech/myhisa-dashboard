"use client";
import { useState, useEffect } from "react";
import { Card, message, Input, Table, Tag, Modal, InputNumber, Select, Button, Tabs, Spin, Tooltip } from "antd";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, CustomButton, RedButton } from "@/components/buttons";
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import useRequirePermission from "@/utils/useRequirePermission";

const { TabPane } = Tabs;
const { Option } = Select;

interface User {
  id: number;
  name: string;
  email: string;
}

interface CommissionRate {
  id: number;
  user_id: number;
  mtn: number;
  airtel: number;
  ninemobile: number;
  glo: number;
  dstv: number;
  gotv: number;
  startimes: number;
  spectranet: number;
  smile: number;
  electricity: number;
  no_bill_fee: boolean;
  use_commission_wallet: boolean;
  created_at: string;
  updated_at: string;
}

interface BillerCommissionRate {
  id: number;
  user_id: number;
  transaction_type: string;
  biller_code: string;
  rate: number;
  created_at: string;
  updated_at: string;
}

interface ElectricityBiller {
  code: string;
  name: string;
  description: string;
  disco: string;
  meter_type: string;
}

const AdminCommissionRates = () => {
  useRequirePermission("commission.manage");
  const [messageApi, contextHolder] = message.useMessage();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [commissionRate, setCommissionRate] = useState<CommissionRate | null>(null);
  const [billerRates, setBillerRates] = useState<BillerCommissionRate[]>([]);
  const [electricityBillers, setElectricityBillers] = useState<ElectricityBiller[]>([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddBillerModal, setShowAddBillerModal] = useState(false);
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [editingRate, setEditingRate] = useState<{ [key: string]: number }>({});
  const [newBillerRate, setNewBillerRate] = useState({ biller_code: "", rate: 0 });
  const [bulkRate, setBulkRate] = useState(0.5);

  useEffect(() => {
    fetchUsers();
    fetchElectricityBillers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchCommissionRate();
      fetchBillerRates();
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const response = await apiService.get({
        endPoint: apiEndpoints.users,
      });
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCommissionRate = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const response = await apiService.get({
        endPoint: apiEndpoints.adminUserCommissionRate(selectedUser.id),
      });
      setCommissionRate(response.data.commission_rate);
    } catch (error) {
      console.error("Error fetching commission rate:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillerRates = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const endpoint = `${apiEndpoints.adminUserBillerCommissionRates(selectedUser.id)}?transaction_type=Electricity`;
      const response = await apiService.get({
        endPoint: endpoint,
      });
      setBillerRates(response.data.rates || []);
    } catch (error) {
      console.error("Error fetching biller rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchElectricityBillers = async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const response = await apiService.get({
        endPoint: apiEndpoints.adminElectricityBillerCodes,
      });
      setElectricityBillers(response.data.biller_codes || []);
    } catch (error) {
      console.error("Error fetching electricity billers:", error);
    }
  };

  const updateGeneralRate = async (field: string, value: number | boolean) => {
    if (!selectedUser) return;
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.put({
        endPoint: apiEndpoints.adminUserCommissionRate(selectedUser.id),
        body: { [field]: value },
      });
      messageApi.success(`${field} updated successfully`);
      fetchCommissionRate();
    } catch (error) {
      console.error("Error updating commission rate:", error);
    }
  };

  const addBillerRate = async () => {
    if (!selectedUser || !newBillerRate.biller_code) {
      messageApi.warning("Please select a biller");
      return;
    }
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.adminUserBillerCommissionRate(selectedUser.id),
        body: {
          transaction_type: "Electricity",
          biller_code: newBillerRate.biller_code,
          rate: newBillerRate.rate,
        },
      });
      messageApi.success("Biller rate added successfully");
      setShowAddBillerModal(false);
      setNewBillerRate({ biller_code: "", rate: 0 });
      fetchBillerRates();
    } catch (error) {
      console.error("Error adding biller rate:", error);
    }
  };

  const updateBillerRate = async (billerCode: string, rate: number) => {
    if (!selectedUser) return;
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.put({
        endPoint: apiEndpoints.adminUserBillerCommissionRate(selectedUser.id),
        body: {
          transaction_type: "Electricity",
          biller_code: billerCode,
          rate: rate,
        },
      });
      messageApi.success("Biller rate updated successfully");
      fetchBillerRates();
      setEditingRate({});
    } catch (error) {
      console.error("Error updating biller rate:", error);
    }
  };

  const deleteBillerRate = async (billerCode: string) => {
    if (!selectedUser) return;
    Modal.confirm({
      title: "Delete Biller Rate",
      content: `Are you sure you want to delete the commission rate for ${billerCode}?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const apiService = new AxiosHandler(messageApi);
          await apiService.delete({
            endPoint: apiEndpoints.adminUserBillerCommissionRate(selectedUser.id),
            body: {
              transaction_type: "Electricity",
              biller_code: billerCode,
            },
          });
          messageApi.success("Biller rate deleted successfully");
          fetchBillerRates();
        } catch (error) {
          console.error("Error deleting biller rate:", error);
        }
      },
    });
  };

  const bulkUpdateRates = async () => {
    if (!selectedUser) return;
    try {
      const rates = electricityBillers.map(biller => ({
        transaction_type: "Electricity",
        biller_code: biller.code,
        rate: bulkRate,
      }));

      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.adminUserBillerCommissionRatesBulk(selectedUser.id),
        body: { rates },
      });
      messageApi.success(`Successfully set ${rates.length} biller rates to ${bulkRate}%`);
      setShowBulkUpdateModal(false);
      fetchBillerRates();
    } catch (error) {
      console.error("Error bulk updating rates:", error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toString().includes(searchTerm)
  );

  const getBillerRate = (billerCode: string): BillerCommissionRate | undefined => {
    return billerRates.find(r => r.biller_code === billerCode);
  };

  const billerColumns = [
    {
      title: "Biller Code",
      dataIndex: "code",
      key: "code",
      width: 180,
      render: (code: string) => <strong>{code}</strong>,
    },
    {
      title: "Biller Name",
      dataIndex: "name",
      key: "name",
      width: 300,
    },
    {
      title: "DISCO",
      dataIndex: "disco",
      key: "disco",
      width: 100,
      render: (disco: string) => <Tag color="blue">{disco}</Tag>,
    },
    {
      title: "Meter Type",
      dataIndex: "meter_type",
      key: "meter_type",
      width: 120,
      render: (type: string) => (
        <Tag color={type === "prepaid" ? "green" : "orange"}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Commission Rate (%)",
      key: "rate",
      width: 180,
      render: (_: any, biller: ElectricityBiller) => {
        const existingRate = getBillerRate(biller.code);
        const isEditing = editingRate[biller.code] !== undefined;

        if (isEditing) {
          return (
            <div className="flex items-center gap-2">
              <InputNumber
                min={0}
                max={100}
                step={0.1}
                value={editingRate[biller.code]}
                onChange={(value) => setEditingRate({ ...editingRate, [biller.code]: value || 0 })}
                size="small"
                style={{ width: 80 }}
              />
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => updateBillerRate(biller.code, editingRate[biller.code])}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={() => setEditingRate({})}
              >
                Cancel
              </Button>
            </div>
          );
        }

        if (existingRate) {
          return (
            <div className="flex items-center justify-between">
              <Tag color="green">{existingRate.rate}%</Tag>
              <div className="flex gap-1">
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setEditingRate({ [biller.code]: existingRate.rate })}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => deleteBillerRate(biller.code)}
                  />
                </Tooltip>
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-between">
            <Tag color="default">Using fallback ({commissionRate?.electricity || 0}%)</Tag>
            <Tooltip title="Add custom rate">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setNewBillerRate({ biller_code: biller.code, rate: commissionRate?.electricity || 0.5 });
                  setShowAddBillerModal(true);
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  const renderGeneralRates = () => {
    if (!commissionRate) return <div>No commission rate data</div>;

    return (
      <div className="space-y-6">
        <Card title="Airtime Services" size="small">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "MTN", field: "mtn" },
              { label: "Airtel", field: "airtel" },
              { label: "9mobile", field: "ninemobile" },
              { label: "Glo", field: "glo" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label} (%)</label>
                <InputNumber
                  min={0}
                  max={100}
                  step={0.1}
                  value={commissionRate[field as keyof CommissionRate] as number}
                  onChange={(value) => updateGeneralRate(field, value || 0)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Cable Services" size="small">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "DSTV", field: "dstv" },
              { label: "GOTV", field: "gotv" },
              { label: "Startimes", field: "startimes" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label} (%)</label>
                <InputNumber
                  min={0}
                  max={100}
                  step={0.1}
                  value={commissionRate[field as keyof CommissionRate] as number}
                  onChange={(value) => updateGeneralRate(field, value || 0)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Internet Services" size="small">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Spectranet", field: "spectranet" },
              { label: "Smile", field: "smile" },
            ].map(({ label, field }) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1">{label} (%)</label>
                <InputNumber
                  min={0}
                  max={100}
                  step={0.1}
                  value={commissionRate[field as keyof CommissionRate] as number}
                  onChange={(value) => updateGeneralRate(field, value || 0)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Electricity (Fallback Rate)" size="small">
          <div className="max-w-xs">
            <label className="block text-sm font-medium mb-1">Electricity (%)</label>
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              value={commissionRate.electricity}
              onChange={(value) => updateGeneralRate("electricity", value || 0)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              This rate is used when no biller-specific rate is set
            </p>
          </div>
        </Card>

        <Card title="Settings" size="small">
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="no_bill_fee"
                checked={commissionRate.no_bill_fee}
                onChange={(e) => updateGeneralRate("no_bill_fee", e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="no_bill_fee" className="text-sm">
                No Bill Fee (Don't add bill fee to transactions)
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="use_commission_wallet"
                checked={commissionRate.use_commission_wallet}
                onChange={(e) => updateGeneralRate("use_commission_wallet", e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="use_commission_wallet" className="text-sm">
                Use Commission Wallet (Add commission to wallet instead of reducing from amount)
              </label>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderBillerRates = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Electricity Biller Commission Rates</h3>
            <p className="text-sm text-gray-600">
              Manage biller-specific commission rates. Rates set here override the general electricity rate.
            </p>
          </div>
          <div className="flex gap-2">
            <BlueButton onClick={() => setShowBulkUpdateModal(true)}>
              Bulk Update All Billers
            </BlueButton>
            <BlueButton onClick={() => setShowAddBillerModal(true)} icon={<PlusOutlined />}>
              Add Biller Rate
            </BlueButton>
          </div>
        </div>

        <Card>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Commission Hierarchy:</strong> Biller-specific rates take priority over the general electricity rate.
              Billers without custom rates will use the fallback rate ({commissionRate?.electricity || 0}%).
            </p>
          </div>

          <Table
            dataSource={electricityBillers}
            columns={billerColumns}
            rowKey="code"
            pagination={{ pageSize: 10 }}
            loading={loading}
          />
        </Card>
      </div>
    );
  };

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}
      <h2 className="text-2xl font-bold mb-4">Commission Rate Management</h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        <Card className="lg:col-span-1" title="Select User">
          <Input
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-3"
          />
          <div className="max-h-96 overflow-y-auto">
            {usersLoading ? (
              <div className="text-center py-4">
                <Spin />
              </div>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`p-3 mb-2 rounded cursor-pointer border ${
                    selectedUser?.id === user.id
                      ? "bg-teal-50 border-teal-500"
                      : "bg-white border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-600">{user.email}</div>
                  <div className="text-xs text-gray-500">ID: {user.id}</div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="lg:col-span-3">
          {!selectedUser ? (
            <div className="text-center py-20 text-gray-500">
              <p className="mb-2">Select a user to manage commission rates</p>
            </div>
          ) : loading ? (
            <div className="text-center py-20">
              <Spin size="large" />
            </div>
          ) : (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded">
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <p className="text-sm text-gray-600">{selectedUser.email}</p>
                <p className="text-xs text-gray-500">User ID: {selectedUser.id}</p>
              </div>

              <Tabs defaultActiveKey="general">
                <TabPane tab="General Commission Rates" key="general">
                  {renderGeneralRates()}
                </TabPane>
                <TabPane tab="Electricity Biller Rates" key="billers">
                  {renderBillerRates()}
                </TabPane>
              </Tabs>
            </div>
          )}
        </Card>
      </div>

      <Modal
        title="Add Biller Commission Rate"
        open={showAddBillerModal}
        onCancel={() => {
          setShowAddBillerModal(false);
          setNewBillerRate({ biller_code: "", rate: 0 });
        }}
        footer={[
          <CustomButton key="cancel" onClick={() => setShowAddBillerModal(false)}>
            Cancel
          </CustomButton>,
          <BlueButton key="add" onClick={addBillerRate} disabled={!newBillerRate.biller_code}>
            Add Rate
          </BlueButton>,
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block mb-2 font-medium">Biller</label>
            <Select
              value={newBillerRate.biller_code}
              onChange={(value) => setNewBillerRate({ ...newBillerRate, biller_code: value })}
              className="w-full"
              showSearch
              placeholder="Select a biller"
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {electricityBillers
                .filter(b => !getBillerRate(b.code))
                .map(biller => (
                  <Option key={biller.code} value={biller.code}>
                    {biller.name}
                  </Option>
                ))}
            </Select>
          </div>
          <div>
            <label className="block mb-2 font-medium">Commission Rate (%)</label>
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              value={newBillerRate.rate}
              onChange={(value) => setNewBillerRate({ ...newBillerRate, rate: value || 0 })}
              className="w-full"
            />
          </div>
        </div>
      </Modal>

      <Modal
        title="Bulk Update All Electricity Billers"
        open={showBulkUpdateModal}
        onCancel={() => setShowBulkUpdateModal(false)}
        footer={[
          <CustomButton key="cancel" onClick={() => setShowBulkUpdateModal(false)}>
            Cancel
          </CustomButton>,
          <BlueButton key="update" onClick={bulkUpdateRates}>
            Update All {electricityBillers.length} Billers
          </BlueButton>,
        ]}
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 font-medium">⚠️ Warning</p>
            <p className="text-yellow-600 text-sm mt-2">
              This will set the commission rate for ALL {electricityBillers.length} electricity billers to the same value.
              Existing custom rates will be overwritten.
            </p>
          </div>
          <div>
            <label className="block mb-2 font-medium">Default Commission Rate (%)</label>
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              value={bulkRate}
              onChange={(value) => setBulkRate(value || 0)}
              className="w-full"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminCommissionRates;
