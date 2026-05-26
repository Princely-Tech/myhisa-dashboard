"use client";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  message,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Space,
  Tabs,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  ReloadOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";

const { Option } = Select;
const { TabPane } = Tabs;

interface Beneficiary {
  id: number;
  type: string;
  identifier: string;
  network: string;
  biller_code: string;
  name: string;
  is_verified: boolean;
  usage_count: number;
  total_spent: number;
}

interface Transaction {
  id: number;
  transaction_id: string;
  beneficiary_id: number;
  type: string;
  amount: number;
  service_amount: number;
  status: string;
  network: string;
  biller_code: string;
  product_code: string;
  identifier: string;
  beneficiary_name: string;
  external_ref: string;
  error_message?: string;
  created_at: string;
}

interface DataPlan {
  code: string;
  description: string;
  amount: number;
  cost: number;
  validity: string;
  network_id: string;
  bundle_type?: string;
}

interface Product {
  code: string;
  name: string;
  amount: number;
}

const TestTransactions = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("airtime");
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [cableProducts, setCableProducts] = useState<Product[]>([]);
  const [electricityProducts, setElectricityProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const router = useRouter();

  const MIN_AIRTIME = 50;
  const MIN_ELECTRICITY = 1000;

  useEffect(() => {
    fetchBeneficiaries();
    fetchTransactions();
  }, [currentPage]);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.testBeneficiaries,
      });
      setBeneficiaries(res.beneficiaries || []);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setTransactionsLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: `${apiEndpoints.testBeneficiaryTransactions}?page=${currentPage}&limit=20`,
      });
      setTransactions(res.transactions || []);
      setTotalTransactions(res.pagination?.total || 0);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleTransaction = async (values: any) => {
    try {
      const apiService = new AxiosHandler(messageApi);
      let endpoint = "";
      let body: any = {
        beneficiary_id: values.beneficiary_id,
      };

      // Get selected beneficiary details
      const selectedBeneficiary = beneficiaries.find(
        (b) => b.id === values.beneficiary_id
      );

      if (!selectedBeneficiary) {
        messageApi.error("Beneficiary not found");
        return;
      }

      switch (selectedType) {
        case "airtime":
          endpoint = apiEndpoints.testAirtime;
          body.amount = values.amount * 100; // Convert to kobo
          break;
        case "data":
          endpoint = apiEndpoints.testData;
          body.product_code = values.product_code;
          break;
        case "cable":
          endpoint = apiEndpoints.testCable;
          body = {
            beneficiary_id: values.beneficiary_id,
            biller: selectedBeneficiary.biller_code,
            product: values.product_code,
            number: selectedBeneficiary.identifier,
            name: selectedBeneficiary.name || "",
            address: values.address || "",
            ref: "",
          };
          break;
        case "electricity":
          endpoint = apiEndpoints.testElectricity;
          body = {
            beneficiary_id: values.beneficiary_id,
            amount: values.amount * 100, // Convert to kobo
            biller: selectedBeneficiary.biller_code,
            product: values.meter_type || "prepaid",
            meter: selectedBeneficiary.identifier,
            name: selectedBeneficiary.name || "",
            address: values.address || "",
            ref: "",
          };
          break;
      }

      const res = await apiService.post({
        endPoint: endpoint,
        body,
      });

      messageApi.success(res.message || "Test transaction successful");
      setShowTransactionModal(false);
      form.resetFields();
      fetchTransactions();
      fetchBeneficiaries();
    } catch (err: any) {
      console.error("Transaction error:", err);
    }
  };

  const fetchDataPlans = async (network: string) => {
    setProductsLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: `${apiEndpoints.dataPlans}?network=${network}`,
      });
      
      // Extract plans from the response - data is an array of bundle categories
      const categories = res.data || [];
      const allPlans: DataPlan[] = [];
      
      categories.forEach((category: any) => {
        if (category.bundle && Array.isArray(category.bundle)) {
          category.bundle.forEach((plan: any) => {
            // Include all plans - backend will validate limits
            if (true) {
              allPlans.push({
                ...plan,
                bundle_type: category.name, // Add category name for grouping
              });
            }
          });
        }
      });
      
      setDataPlans(allPlans);
    } catch (err) {
      console.error("Error fetching data plans:", err);
      setDataPlans([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCableProducts = async (biller: string) => {
    setProductsLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.cableBillerProducts(biller),
      });
      
      // Get all products - backend will validate limits
      const products = (res.data || []);
      setCableProducts(products);
    } catch (err) {
      console.error("Error fetching cable products:", err);
      setCableProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchElectricityProducts = async (biller: string) => {
    setProductsLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: apiEndpoints.electricityBillerProducts(biller),
      });
      
      // Get all products - backend will validate limits
      const products = (res.data || []);
      setElectricityProducts(products);
    } catch (err) {
      console.error("Error fetching electricity products:", err);
      setElectricityProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const openTransactionModal = (type: string) => {
    setSelectedType(type);
    setShowTransactionModal(true);
    form.resetFields();
    
    // Clear previous products
    setDataPlans([]);
    setCableProducts([]);
    setElectricityProducts([]);
  };

  const getVerifiedBeneficiaries = (type: string) => {
    return beneficiaries.filter(
      (b) => b.type === type && b.is_verified
    );
  };

  const getStatusColor = (status: string) => {
    return status === "successful" ? "green" : "red";
  };

  const transactionColumns = [
    {
      title: "Transaction ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      ellipsis: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
    },
    {
      title: "Beneficiary",
      key: "beneficiary",
      render: (_: any, record: Transaction) => (
        <div>
          <div className="font-medium">
            {record.beneficiary_name || record.identifier}
          </div>
          <div className="text-xs text-gray-500">{record.identifier}</div>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => `₦${amount.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "External Ref",
      dataIndex: "external_ref",
      key: "external_ref",
      ellipsis: true,
    },
  ];

  const verifiedBeneficiariesCount = beneficiaries.filter(
    (b) => b.is_verified
  ).length;
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const successfulTransactions = transactions.filter(
    (t) => t.status === "successful"
  ).length;

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Test Transactions
          </h1>
          <p className="text-gray-600 mt-2">
            Test services with verified beneficiaries (Max ₦5,000 per transaction)
          </p>
          <div className="mt-3 p-3 bg-orange-50 border border-orange-300 rounded">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Important:</strong> These are <strong>REAL transactions</strong> processed through actual service providers. 
              Amounts will be debited from your wallet and services will be delivered to the beneficiary.
            </p>
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchBeneficiaries();
              fetchTransactions();
            }}
            loading={loading || transactionsLoading}
          >
            Refresh
          </Button>
          <Button
            type="link"
            onClick={() => router.push(routes.testBeneficiaries)}
          >
            Manage Beneficiaries
          </Button>
        </Space>
      </div>

      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Verified Beneficiaries"
              value={verifiedBeneficiariesCount}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Transactions"
              value={transactions.length}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Successful"
              value={successfulTransactions}
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Spent"
              value={totalSpent}
              prefix="₦"
              precision={2}
            />
          </Col>
        </Row>
      </Card>

      <Tabs defaultActiveKey="perform">
        <TabPane tab="Perform Test Transaction" key="perform">
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card
                hoverable
                onClick={() => openTransactionModal("airtime")}
                className="text-center cursor-pointer"
              >
                <ThunderboltOutlined
                  style={{ fontSize: 48, color: "#1890ff" }}
                />
                <h3 className="mt-4 font-semibold">Test Airtime</h3>
                <p className="text-sm text-gray-600">
                  Min ₦{MIN_AIRTIME}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {getVerifiedBeneficiaries("airtime").length} beneficiaries
                </p>
              </Card>

              <Card
                hoverable
                onClick={() => openTransactionModal("data")}
                className="text-center cursor-pointer"
              >
                <ThunderboltOutlined
                  style={{ fontSize: 48, color: "#52c41a" }}
                />
                <h3 className="mt-4 font-semibold">Test Data</h3>
                <p className="text-sm text-gray-600">Test transactions</p>
                <p className="text-xs text-gray-500 mt-2">
                  {getVerifiedBeneficiaries("data").length} beneficiaries
                </p>
              </Card>

              <Card
                hoverable
                onClick={() => openTransactionModal("cable")}
                className="text-center cursor-pointer"
              >
                <ThunderboltOutlined
                  style={{ fontSize: 48, color: "#722ed1" }}
                />
                <h3 className="mt-4 font-semibold">Test Cable</h3>
                <p className="text-sm text-gray-600">Test transactions</p>
                <p className="text-xs text-gray-500 mt-2">
                  {getVerifiedBeneficiaries("cable").length} beneficiaries
                </p>
              </Card>

              <Card
                hoverable
                onClick={() => openTransactionModal("electricity")}
                className="text-center cursor-pointer"
              >
                <ThunderboltOutlined
                  style={{ fontSize: 48, color: "#fa8c16" }}
                />
                <h3 className="mt-4 font-semibold">Test Electricity</h3>
                <p className="text-sm text-gray-600">
                  Min ₦{MIN_ELECTRICITY}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {getVerifiedBeneficiaries("electricity").length} beneficiaries
                </p>
              </Card>
            </div>

            {verifiedBeneficiariesCount === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">
                  <strong>No verified beneficiaries found.</strong> Please add
                  and verify beneficiaries first.
                </p>
                <Button
                  type="link"
                  onClick={() => router.push(routes.testBeneficiaries)}
                  className="p-0 mt-2"
                >
                  Go to Beneficiaries →
                </Button>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab="Transaction History" key="history">
          <Card>
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="id"
              loading={transactionsLoading}
              pagination={{
                current: currentPage,
                pageSize: 20,
                total: totalTransactions,
                showSizeChanger: false,
                showTotal: (total) => `Total ${total} transactions`,
                onChange: (page) => setCurrentPage(page),
              }}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={`Test ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Transaction`}
        open={showTransactionModal}
        onCancel={() => {
          setShowTransactionModal(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleTransaction}>
          <Form.Item
            name="beneficiary_id"
            label="Select Beneficiary"
            rules={[
              { required: true, message: "Please select a beneficiary" },
            ]}
          >
            <Select
              placeholder="Select beneficiary"
              showSearch
              optionFilterProp="children"
              onChange={(beneficiaryId) => {
                const beneficiary = beneficiaries.find((b) => b.id === beneficiaryId);
                if (beneficiary) {
                  // Fetch products based on beneficiary type
                  if (selectedType === "data" && beneficiary.network) {
                    fetchDataPlans(beneficiary.network);
                  } else if (selectedType === "cable" && beneficiary.biller_code) {
                    fetchCableProducts(beneficiary.biller_code);
                  } else if (selectedType === "electricity" && beneficiary.biller_code) {
                    fetchElectricityProducts(beneficiary.biller_code);
                  }
                }
              }}
            >
              {getVerifiedBeneficiaries(selectedType).map((b) => (
                <Option key={b.id} value={b.id}>
                  {b.name || b.identifier} - {b.identifier}
                  {b.network && ` (${b.network.toUpperCase()})`}
                  {b.biller_code && ` (${b.biller_code.toUpperCase()})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {(selectedType === "airtime" || selectedType === "electricity") && (
            <Form.Item
              name="amount"
              label="Amount (₦)"
              rules={[
                { required: true, message: "Please enter amount" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (
                      selectedType === "airtime" &&
                      value < MIN_AIRTIME
                    ) {
                      return Promise.reject(
                        `Minimum airtime amount is ₦${MIN_AIRTIME}`
                      );
                    }
                    if (
                      selectedType === "electricity" &&
                      value < MIN_ELECTRICITY
                    ) {
                      return Promise.reject(
                        `Minimum electricity amount is ₦${MIN_ELECTRICITY}`
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                min={
                  selectedType === "airtime"
                    ? MIN_AIRTIME
                    : MIN_ELECTRICITY
                }
                max={100000}
                step={selectedType === "airtime" ? 50 : 100}
                style={{ width: "100%" }}
                placeholder={`Enter amount (Min ₦${
                  selectedType === "airtime"
                    ? MIN_AIRTIME
                    : MIN_ELECTRICITY
                })`}
              />
            </Form.Item>
          )}

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.beneficiary_id !== currentValues.beneficiary_id
            }
          >
            {({ getFieldValue }) => {
              const beneficiaryId = getFieldValue("beneficiary_id");
              const selectedBeneficiary = beneficiaries.find(
                (b) => b.id === beneficiaryId
              );

              if (selectedBeneficiary && (selectedType === "cable" || selectedType === "electricity")) {
                return (
                  <div className="mb-4 p-4 bg-gray-50 rounded border">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Beneficiary Details (Auto-filled)
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Biller:</span>{" "}
                        <span className="font-medium">
                          {selectedBeneficiary.biller_code?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          {selectedType === "cable" ? "Smartcard" : "Meter"}:
                        </span>{" "}
                        <span className="font-medium">
                          {selectedBeneficiary.identifier}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Name:</span>{" "}
                        <span className="font-medium">
                          {selectedBeneficiary.name || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          </Form.Item>

          {selectedType === "data" && (
            <Form.Item
              name="product_code"
              label="Data Plan"
              rules={[{ required: true, message: "Please select a data plan" }]}
            >
              <Select 
                placeholder={productsLoading ? "Loading plans..." : "Select data plan"}
                loading={productsLoading}
                disabled={productsLoading || dataPlans.length === 0}
                showSearch
              >
                {(() => {
                  // Group plans by bundle_type
                  const grouped = dataPlans.reduce((acc, plan) => {
                    const type = plan.bundle_type || "Other";
                    if (!acc[type]) acc[type] = [];
                    acc[type].push(plan);
                    return acc;
                  }, {} as Record<string, DataPlan[]>);

                  // Render grouped options
                  return Object.entries(grouped).map(([bundleType, plans]) => (
                    <Select.OptGroup key={bundleType} label={bundleType}>
                      {plans.map((plan) => (
                        <Option key={plan.code} value={plan.code}>
                          {plan.description} - ₦{(plan.amount / 100).toFixed(2)} ({plan.validity})
                        </Option>
                      ))}
                    </Select.OptGroup>
                  ));
                })()}
              </Select>
            </Form.Item>
          )}

          {selectedType === "cable" && (
            <>
              <Form.Item
                name="product_code"
                label="Cable Package"
                rules={[{ required: true, message: "Please select a package" }]}
              >
                <Select 
                  placeholder={productsLoading ? "Loading packages..." : "Select cable package"}
                  loading={productsLoading}
                  disabled={productsLoading || cableProducts.length === 0}
                  showSearch
                  optionFilterProp="children"
                >
                  {cableProducts.map((product) => (
                    <Option key={product.code} value={product.code}>
                      {product.name} - ₦{(product.amount / 100).toFixed(2)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="address" label="Address (Optional)">
                <Input placeholder="Enter address" />
              </Form.Item>
            </>
          )}

          {selectedType === "electricity" && (
            <>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded mb-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Note:</strong> Customer name, address, and meter type (Prepaid/Postpaid) will be automatically retrieved from the beneficiary record (verified during beneficiary creation).
                </p>
              </div>
            </>
          )}

          <div className="p-4 bg-orange-50 border border-orange-300 rounded mb-4">
            <p className="text-sm font-semibold text-orange-900 mb-2">
              ⚠️ REAL TRANSACTION WARNING
            </p>
            <p className="text-sm text-orange-800 mb-2">
              This is a <strong>REAL transaction</strong>, not a simulation. The service will be processed through actual providers.
            </p>
            <ul className="text-sm text-orange-700 ml-4 list-disc space-y-1">
              <li>Amount will be <strong>debited from your wallet</strong></li>
              <li>Service will be <strong>delivered to the beneficiary</strong></li>
              <li>Transaction appears in your regular transaction history</li>
              <li>Amount limits validated by backend</li>
              {selectedType === "airtime" && (
                <li>Minimum airtime: ₦{MIN_AIRTIME}</li>
              )}
              {selectedType === "electricity" && (
                <li>Minimum electricity: ₦{MIN_ELECTRICITY}</li>
              )}
            </ul>
          </div>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowTransactionModal(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Process Transaction
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TestTransactions;
