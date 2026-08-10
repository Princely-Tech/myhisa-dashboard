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

const { Option } = Select;

interface Biller {
  code: string;
  name: string;
}

interface CableProduct {
  code: string;
  name: string;
  amount: number;
}

const CableBillersPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [billers, setBillers] = useState<Biller[]>([]);
  const [billersLoading, setBillersLoading] = useState(false);
  const [selectedBiller, setSelectedBiller] = useState<string>("");
  const [products, setProducts] = useState<CableProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  useEffect(() => {
    fetchBillers();
  }, []);

  useEffect(() => {
    if (selectedBiller) {
      fetchProducts(selectedBiller);
    }
  }, [selectedBiller]);

  const fetchBillers = async () => {
    setBillersLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.cableBillers,
      });
      const fetchedBillers: Biller[] = res.data || [];
      setBillers(fetchedBillers);
      if (fetchedBillers.length > 0) {
        setSelectedBiller((current) => current || fetchedBillers[0].code);
      }
    } catch (err) {
      console.error("Error fetching cable billers:", err);
      setBillers([]);
    } finally {
      setBillersLoading(false);
    }
  };

  const fetchProducts = async (biller: string) => {
    setProductsLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.cableBillerProducts(biller),
      });
      setProducts(res.data || []);
    } catch (err) {
      console.error("Error fetching cable biller products:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const refresh = () => {
    fetchBillers();
    if (selectedBiller) {
      fetchProducts(selectedBiller);
    }
  };

  const exportToCSV = () => {
    if (products.length === 0) {
      messageApi.warning("No data to export");
      return;
    }

    const headers = ["Plan Code", "Biller", "Plan Name", "Amount (₦)"];

    const csvData = products.map((product) => [
      product.code,
      selectedBiller.toUpperCase(),
      product.name,
      (product.amount / 100).toFixed(2),
    ]);

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
      `cable-products-${selectedBiller.toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    messageApi.success("Cable products exported to CSV");
  };

  const exportToJSON = () => {
    if (products.length === 0) {
      messageApi.warning("No data to export");
      return;
    }

    const jsonData = {
      biller: selectedBiller,
      export_date: new Date().toISOString(),
      total_products: products.length,
      products: products.map((product) => ({
        code: product.code,
        biller: selectedBiller,
        name: product.name,
        amount_kobo: product.amount,
        amount_naira: product.amount / 100,
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
      `cable-products-${selectedBiller.toLowerCase()}-${
        new Date().toISOString().split("T")[0]
      }.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    messageApi.success("Cable products exported to JSON");
  };

  const columns = [
    {
      title: "Plan Code",
      dataIndex: "code",
      key: "code",
      width: 120,
    },
    {
      title: "Plan Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      render: (amount: number) =>
        `₦${(amount / 100).toLocaleString("en-NG", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      sorter: (a: CableProduct, b: CableProduct) => a.amount - b.amount,
    },
  ];

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cable Billers</h1>
        <p className="text-gray-600 mt-2">
          View and export cable TV billers (DSTV, GOTV, StarTimes) and their
          subscription plans
        </p>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <Space>
            <span className="font-medium">Biller:</span>
            <Select
              value={selectedBiller || undefined}
              onChange={setSelectedBiller}
              style={{ width: 180 }}
              loading={billersLoading}
              placeholder="Select biller"
            >
              {billers.map((biller) => (
                <Option key={biller.code} value={biller.code}>
                  {biller.name}
                </Option>
              ))}
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={billersLoading || productsLoading}
            >
              Refresh
            </Button>
          </Space>

          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
              disabled={products.length === 0}
            >
              Export CSV
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={exportToJSON}
              type="primary"
              disabled={products.length === 0}
            >
              Export JSON
            </Button>
          </Space>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <p className="text-sm text-gray-600">
            Total Plans: <strong>{products.length}</strong>
          </p>
          {selectedBiller && (
            <Tag color="orange">{selectedBiller.toUpperCase()}</Tag>
          )}
        </div>
        <Table
          columns={columns}
          dataSource={products}
          rowKey="code"
          loading={productsLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} plans`,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Card>
    </div>
  );
};

export default CableBillersPage;
