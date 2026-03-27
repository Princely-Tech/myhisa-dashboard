"use client";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  message,
  Button,
  Space,
  Tag,
} from "antd";
import {
  ReloadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";

interface Biller {
  code: string;
  name: string;
}

const ElectricityBillersPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [billers, setBillers] = useState<Biller[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBillers();
  }, []);

  const fetchBillers = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.electricityBillers,
      });
      setBillers(res.data || []);
    } catch (err) {
      console.error("Error fetching electricity billers:", err);
      setBillers([]);
    } finally {
      setLoading(false);
    }
  };


  const exportToCSV = () => {
    if (billers.length === 0) {
      messageApi.warning("No data to export");
      return;
    }

    const headers = ["Biller Code", "Biller Name"];
    const csvData = billers.map((biller) => [biller.code, biller.name]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `electricity-billers-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    messageApi.success("Electricity billers exported to CSV");
  };

  const exportToJSON = () => {
    if (billers.length === 0) {
      messageApi.warning("No data to export");
      return;
    }

    const jsonData = {
      export_date: new Date().toISOString(),
      total_billers: billers.length,
      billers: billers.map((biller) => ({
        code: biller.code,
        name: biller.name,
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
      `electricity-billers-${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    messageApi.success("Electricity billers exported to JSON");
  };


  const columns = [
    {
      title: "Biller Code",
      dataIndex: "code",
      key: "code",
      width: 200,
      render: (code: string) => <Tag color="orange">{code.toUpperCase()}</Tag>,
    },
    {
      title: "Biller Name",
      dataIndex: "name",
      key: "name",
    },
  ];

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Electricity Billers
        </h1>
        <p className="text-gray-600 mt-2">
          View and export available electricity providers and their products
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchBillers}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
              disabled={billers.length === 0}
            >
              Export CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToJSON}
              type="primary"
              disabled={billers.length === 0}
            >
              Export JSON
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total Billers: <strong>{billers.length}</strong>
          </p>
        </div>
        <Table
          columns={columns}
          dataSource={billers}
          rowKey="code"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} billers`,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Card>
    </div>
  );
};

export default ElectricityBillersPage;
