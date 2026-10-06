"use client";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  message,
  Button,
  Select,
  Space,
  Tag,
} from "antd";
import {
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { User } from "@/utils/types";

const { Option } = Select;

interface DataPlan {
  code: string;
  network_identifier: string;
  network_id: string;
  description: string;
  amount: number;
  validity: string;
  bundle_type_id: number;
  cost: number;
  bundle_type: string;
}

interface BundleCategory {
  name: string;
  id: number;
  network_id: string;
  bundle: DataPlan[];
}

const DataPlansPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("mtn");
  const [isStaffOrAdmin, setIsStaffOrAdmin] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    if (raw) {
      const user = JSON.parse(raw) as User;
      setIsStaffOrAdmin((user.rank ?? 0) > 0);
    }
  }, []);

  useEffect(() => {
    fetchDataPlans();
  }, [selectedNetwork]);

  const fetchDataPlans = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: `${apiEndpoints.dataPlans}?network=${selectedNetwork}`,
      });

      const categories: BundleCategory[] = res.data || [];
      const allPlans: DataPlan[] = [];

      categories.forEach((category) => {
        if (category.bundle && Array.isArray(category.bundle)) {
          category.bundle.forEach((plan) => {
            allPlans.push({
              ...plan,
              bundle_type: category.name,
            });
          });
        }
      });

      setDataPlans(allPlans);
    } catch (err) {
      console.error("Error fetching data plans:", err);
      setDataPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (dataPlans.length === 0) {
      messageApi.warning("No data to export");
      return;
    }

    const headers = [
      "Code",
      "Network",
      ...(isStaffOrAdmin ? ["Network Identifier"] : []),
      "Description",
      "Amount (₦)",
      "Validity",
      "Bundle Type",
    ];

    const csvData = dataPlans.map((plan) => [
      plan.code,
      plan.network_id.toUpperCase(),
      ...(isStaffOrAdmin ? [plan.network_identifier] : []),
      plan.description,
      (plan.amount / 100).toFixed(2),
      plan.validity,
      plan.bundle_type,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `data-plans-${selectedNetwork}-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    messageApi.success("Data plans exported to CSV");
  };

  const exportToJSON = () => {
    if (dataPlans.length === 0) {
      messageApi.warning("No data to export");
      return;
    }

    const jsonData = {
      network: selectedNetwork,
      export_date: new Date().toISOString(),
      total_plans: dataPlans.length,
      plans: dataPlans.map((plan) => ({
        code: plan.code,
        network: plan.network_id,
        description: plan.description,
        amount_kobo: plan.amount,
        amount_naira: plan.amount / 100,
        validity: plan.validity,
        bundle_type: plan.bundle_type,
        ...(isStaffOrAdmin ? { network_identifier: plan.network_identifier } : {}),
      })),
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `data-plans-${selectedNetwork}-${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    messageApi.success("Data plans exported to JSON");
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Network",
      dataIndex: "network_id",
      key: "network_id",
      width: 100,
      render: (network: string) => (
        <Tag color="blue">{network.toUpperCase()}</Tag>
      ),
    },
    ...(isStaffOrAdmin
      ? [
          {
            title: "Network Identifier",
            dataIndex: "network_identifier",
            key: "network_identifier",
            width: 160,
          },
        ]
      : []),
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount: number) =>
        `₦${(amount / 100).toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      sorter: (a: DataPlan, b: DataPlan) => a.amount - b.amount,
    },
    {
      title: "Validity",
      dataIndex: "validity",
      key: "validity",
      width: 120,
    },
    {
      title: "Bundle Type",
      dataIndex: "bundle_type",
      key: "bundle_type",
      width: 150,
      filters: [
        ...new Set(dataPlans.map((p) => p.bundle_type)),
      ].map((type) => ({ text: type, value: type })),
      onFilter: (value: any, record: DataPlan) =>
        record.bundle_type === value,
    },
  ];

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Plans</h1>
        <p className="text-gray-600 mt-2">
          View and export available data plans for all networks
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <Space>
            <span className="font-medium">Network:</span>
            <Select
              value={selectedNetwork}
              onChange={setSelectedNetwork}
              style={{ width: 150 }}
            >
              <Option value="mtn">MTN</Option>
              <Option value="airtel">Airtel</Option>
              <Option value="glo">Glo</Option>
              <Option value="9mobile">9mobile</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchDataPlans}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
              disabled={dataPlans.length === 0}
            >
              Export CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToJSON}
              type="primary"
              disabled={dataPlans.length === 0}
            >
              Export JSON
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total Plans: <strong>{dataPlans.length}</strong>
          </p>
        </div>
        <Table
          columns={columns}
          dataSource={dataPlans}
          rowKey="code"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} plans`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scroll={{ x: isStaffOrAdmin ? 1160 : 1000 }}
        />
      </Card>
    </div>
  );
};

export default DataPlansPage;
