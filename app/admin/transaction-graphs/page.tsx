"use client";

import { useState, useEffect } from "react";
import { Card, Tabs, Select, message } from "antd";
import { UserOutlined, GlobalOutlined } from "@ant-design/icons";
import HourlyStatsGraph from "@/app/dashboard/HourlyStatsGraph";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import useRequirePermission from "@/utils/useRequirePermission";

const { TabPane } = Tabs;

interface User {
  id: number;
  name: string;
  email: string;
}

export default function AdminTransactionGraphs() {
  useRequirePermission("transactions.view");
  const [messageApi, contextHolder] = message.useMessage();
  const [activeTab, setActiveTab] = useState("global");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const response = await apiService.get({
        endPoint: apiEndpoints.users,
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      messageApi.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserChange = (userId: number | null) => {
    setSelectedUserId(userId);
    if (userId) {
      const user = users.find(u => u.id === userId);
      messageApi.success(`Loading graph for ${user?.name || `User ID: ${userId}`}`);
    }
  };

  return (
    <div className="container-fluid">
      {contextHolder}
      <div className="row">
        <div className="col-sm-12">
          <div className="iq-card">
            <div className="iq-card-header d-flex justify-content-between">
              <div className="iq-header-title">
                <h4 className="card-title">Transaction Graphs</h4>
              </div>
            </div>
            <div className="iq-card-body">
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane
                  tab={
                    <span>
                      <GlobalOutlined />
                      Global Stats
                    </span>
                  }
                  key="global"
                >
                  <div className="mt-3">
                    <p className="text-muted mb-3">
                      View aggregated transaction statistics across all users.
                      If User A has 10 transactions and User B has 50
                      transactions in an hour, the graph will show 60 for that
                      hour.
                    </p>
                    <HourlyStatsGraph isAdmin={true} refreshKey={activeTab} />
                  </div>
                </TabPane>

                <TabPane
                  tab={
                    <span>
                      <UserOutlined />
                      User-Specific Stats
                    </span>
                  }
                  key="user"
                >
                  <div className="mt-3">
                    <p className="text-muted mb-3">
                      View transaction statistics for a specific user.
                    </p>
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <label className="block mb-2 font-medium">
                          Select User
                        </label>
                        <Select
                          showSearch
                          placeholder="Search and select a user"
                          value={selectedUserId}
                          onChange={handleUserChange}
                          className="w-full"
                          loading={loadingUsers}
                          allowClear
                          size="large"
                          filterOption={(input, option) =>
                            (option?.label ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                          options={users.map((user) => ({
                            value: user.id,
                            label: `${user.name} (${user.email})`,
                          }))}
                        />
                      </div>
                    </div>

                    {selectedUserId && (
                      <div className="mt-4">
                        <div className="alert alert-info">
                          <strong>
                            Viewing graph for:{" "}
                            {users.find((u) => u.id === selectedUserId)?.name ||
                              `User ID: ${selectedUserId}`}
                          </strong>
                        </div>
                        <HourlyStatsGraph
                          isAdmin={true}
                          userId={selectedUserId}
                          refreshKey={activeTab}
                        />
                      </div>
                    )}

                    {!selectedUserId && (
                      <div className="text-center py-5">
                        <UserOutlined style={{ fontSize: 48, color: "#ccc" }} />
                        <p className="text-muted mt-3">
                          Select a user above to view their transaction graph
                        </p>
                      </div>
                    )}
                  </div>
                </TabPane>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
