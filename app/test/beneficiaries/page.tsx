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
  Select,
  Tag,
  Space,
  Popconfirm,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";

const { Option } = Select;

interface Beneficiary {
  id: number;
  type: string;
  identifier: string;
  network: string;
  biller_code: string;
  name: string;
  is_verified: boolean;
  verified_at?: string;
  last_used_at?: string;
  usage_count: number;
  total_spent: number;
  created_at: string;
  otp_expires_at?: string;
}

interface Biller {
  code: string;
  name: string;
}

const TestBeneficiaries = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [addForm] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const [typeFilter, setTypeFilter] = useState("");
  const [cableBillers, setCableBillers] = useState<Biller[]>([]);
  const [electricityBillers, setElectricityBillers] = useState<Biller[]>([]);
  const [billersLoading, setBillersLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchBeneficiaries();
  }, [typeFilter]);

  const fetchCableBillers = async () => {
    setBillersLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({ endPoint: apiEndpoints.cableBillers });
      setCableBillers(res.data || []);
    } catch (err) {
      console.error("Error fetching cable billers:", err);
      setCableBillers([]);
    } finally {
      setBillersLoading(false);
    }
  };

  const fetchElectricityBillers = async () => {
    setBillersLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({ endPoint: apiEndpoints.electricityBillers });
      setElectricityBillers(res.data || []);
    } catch (err) {
      console.error("Error fetching electricity billers:", err);
      setElectricityBillers([]);
    } finally {
      setBillersLoading(false);
    }
  };

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const endpoint = typeFilter
        ? `${apiEndpoints.testBeneficiaries}?type=${typeFilter}`
        : apiEndpoints.testBeneficiaries;
      const res = await apiService.get({ endPoint: endpoint });
      setBeneficiaries(res.beneficiaries || []);
    } catch (err) {
      console.error("Error fetching beneficiaries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async (values: any) => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.post({
        endPoint: apiEndpoints.testBeneficiaries,
        body: values,
      });
      messageApi.success(res.message || "Beneficiary created. Please verify with OTP");
      
      // Close add modal and reset form
      setShowAddModal(false);
      addForm.resetFields();
      
      // Open verify modal if beneficiary needs verification
      if (res.beneficiary && !res.beneficiary.is_verified) {
        // Use setTimeout to ensure modal state updates properly
        setTimeout(() => {
          setSelectedBeneficiary(res.beneficiary);
          setShowVerifyModal(true);
        }, 100);
      }
      
      // Refresh beneficiaries list
      fetchBeneficiaries();
    } catch (err: any) {
      if (err?.response?.data?.beneficiary_id) {
        messageApi.warning("This beneficiary already exists");
      }
    }
  };

  const handleVerifyBeneficiary = async (values: any) => {
    if (!selectedBeneficiary) return;

    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.post({
        endPoint: apiEndpoints.testBeneficiaryVerify,
        body: {
          beneficiary_id: selectedBeneficiary.id,
          otp: values.otp,
        },
      });
      messageApi.success("Beneficiary verified successfully");
      setShowVerifyModal(false);
      verifyForm.resetFields();
      setSelectedBeneficiary(null);
      fetchBeneficiaries();
    } catch (err) {
      console.error("Verification error:", err);
    }
  };

  const handleDeleteBeneficiary = async (id: number) => {
    try {
      const apiService = new AxiosHandler(messageApi);
      await apiService.delete({
        endPoint: apiEndpoints.testBeneficiaryDelete(id),
        body: {},
      });
      messageApi.success("Beneficiary deleted successfully");
      fetchBeneficiaries();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleResendOTP = async (beneficiary: Beneficiary) => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const body: any = {
        type: beneficiary.type,
        identifier: beneficiary.identifier,
        name: beneficiary.name,
      };

      if (beneficiary.network) {
        body.network = beneficiary.network;
      }
      if (beneficiary.biller_code) {
        body.biller_code = beneficiary.biller_code;
      }

      await apiService.post({
        endPoint: apiEndpoints.testBeneficiaries,
        body,
      });
      messageApi.success("OTP resent to your phone");
      setSelectedBeneficiary(beneficiary);
      setShowVerifyModal(true);
    } catch (err) {
      console.error("Resend OTP error:", err);
    }
  };

  const openVerifyModal = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowVerifyModal(true);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      airtime: "blue",
      data: "green",
      cable: "purple",
      electricity: "orange",
    };
    return colors[type] || "default";
  };

  const columns = [
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Beneficiary) => name || record.identifier,
    },
    {
      title: "Identifier",
      dataIndex: "identifier",
      key: "identifier",
    },
    {
      title: "Network/Biller",
      key: "network_biller",
      render: (_: any, record: Beneficiary) => {
        if (record.network) return record.network.toUpperCase();
        if (record.biller_code) return record.biller_code.toUpperCase();
        return "-";
      },
    },
    {
      title: "Status",
      dataIndex: "is_verified",
      key: "is_verified",
      render: (verified: boolean) =>
        verified ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Verified
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Pending
          </Tag>
        ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_: any, record: Beneficiary) => (
        <div>
          <div className="text-sm">{record.usage_count} times</div>
          <div className="text-xs text-gray-500">
            ₦{record.total_spent.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      title: "Last Used",
      dataIndex: "last_used_at",
      key: "last_used_at",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "Never",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Beneficiary) => (
        <Space>
          {!record.is_verified && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => openVerifyModal(record)}
              >
                Verify
              </Button>
              <Button
                size="small"
                onClick={() => handleResendOTP(record)}
              >
                Resend OTP
              </Button>
            </>
          )}
          <Popconfirm
            title="Delete beneficiary?"
            description="This action cannot be undone."
            onConfirm={() => handleDeleteBeneficiary(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const verifiedCount = beneficiaries.filter((b) => b.is_verified).length;
  const totalSpent = beneficiaries.reduce((sum, b) => sum + b.total_spent, 0);

  return (
    <div className="flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen overflow-auto">
      {contextHolder}
      
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Test Beneficiaries
          </h1>
          <p className="text-gray-600 mt-2">
            Manage test beneficiaries for testing services (Max ₦5,000 per transaction)
          </p>
          <div className="mt-3 p-3 bg-orange-50 border border-orange-300 rounded">
            <p className="text-sm text-orange-800">
              <strong>⚠️ Important:</strong> Test transactions are <strong>REAL transactions</strong> processed through actual service providers. 
              Amounts will be debited from your wallet and services will be delivered.
            </p>
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchBeneficiaries}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddModal(true)}
          >
            Add Beneficiary
          </Button>
        </Space>
      </div>

      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Beneficiaries"
              value={beneficiaries.length}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Verified"
              value={verifiedCount}
              valueStyle={{ color: "#3f8600" }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Pending Verification"
              value={beneficiaries.length - verifiedCount}
              valueStyle={{ color: "#cf1322" }}
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

      <Card>
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Beneficiaries</h3>
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 200 }}
            placeholder="Filter by type"
            allowClear
          >
            <Option value="">All Types</Option>
            <Option value="airtime">Airtime</Option>
            <Option value="data">Data</Option>
            <Option value="cable">Cable</Option>
            <Option value="electricity">Electricity</Option>
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={beneficiaries}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} beneficiaries`,
          }}
        />

        <div className="mt-4">
          <Button
            type="link"
            onClick={() => router.push(routes.testTransactions)}
          >
            View Test Transaction History →
          </Button>
        </div>
      </Card>

      <Modal
        title="Add Test Beneficiary"
        open={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          addForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddBeneficiary}
        >
          <Form.Item
            name="type"
            label="Service Type"
            rules={[{ required: true, message: "Please select service type" }]}
          >
            <Select 
              placeholder="Select service type"
              onChange={(value) => {
                // Fetch billers when cable or electricity is selected
                if (value === "cable") {
                  fetchCableBillers();
                } else if (value === "electricity") {
                  fetchElectricityBillers();
                }
              }}
            >
              <Option value="airtime">Airtime</Option>
              <Option value="data">Data</Option>
              <Option value="cable">Cable TV</Option>
              <Option value="electricity">Electricity</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("type");
              
              if (type === "airtime" || type === "data") {
                return (
                  <>
                    <Form.Item
                      name="identifier"
                      label="Phone Number"
                      rules={[
                        { required: true, message: "Please enter phone number" },
                      ]}
                    >
                      <Input placeholder="08012345678" />
                    </Form.Item>
                    <Form.Item
                      name="network"
                      label="Network"
                      rules={[{ required: true, message: "Please select network" }]}
                    >
                      <Select placeholder="Select network">
                        <Option value="mtn">MTN</Option>
                        <Option value="airtel">Airtel</Option>
                        <Option value="glo">Glo</Option>
                        <Option value="9mobile">9mobile</Option>
                      </Select>
                    </Form.Item>
                  </>
                );
              }

              if (type === "cable") {
                return (
                  <>
                    <Form.Item
                      name="identifier"
                      label="Smartcard Number"
                      rules={[
                        { required: true, message: "Please enter smartcard number" },
                      ]}
                    >
                      <Input placeholder="1234567890" />
                    </Form.Item>
                    <Form.Item
                      name="biller_code"
                      label="Cable Provider"
                      rules={[{ required: true, message: "Please select provider" }]}
                    >
                      <Select 
                        placeholder={billersLoading ? "Loading providers..." : "Select provider"}
                        loading={billersLoading}
                        disabled={billersLoading}
                        showSearch
                        optionFilterProp="children"
                      >
                        {cableBillers.map((biller) => (
                          <Option key={biller.code} value={biller.code}>
                            {biller.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                );
              }

              if (type === "electricity") {
                return (
                  <>
                    <Form.Item
                      name="identifier"
                      label="Meter Number"
                      rules={[
                        { required: true, message: "Please enter meter number" },
                      ]}
                    >
                      <Input placeholder="12345678901234" />
                    </Form.Item>
                    <Form.Item
                      name="biller_code"
                      label="Electricity Provider"
                      rules={[{ required: true, message: "Please select provider" }]}
                    >
                      <Select 
                        placeholder={billersLoading ? "Loading providers..." : "Select provider"}
                        loading={billersLoading}
                        disabled={billersLoading}
                        showSearch
                        optionFilterProp="children"
                      >
                        {electricityBillers.map((biller) => (
                          <Option key={biller.code} value={biller.code}>
                            {biller.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                );
              }

              return null;
            }}
          </Form.Item>

          <Form.Item name="name" label="Beneficiary Name (Optional)">
            <Input placeholder="e.g., My Test Number" />
          </Form.Item>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> An OTP will be sent to your registered phone number
              for verification. The OTP is valid for 10 minutes.
            </p>
          </div>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                Add & Send OTP
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Verify Beneficiary"
        open={showVerifyModal}
        onCancel={() => {
          setShowVerifyModal(false);
          verifyForm.resetFields();
          setSelectedBeneficiary(null);
        }}
        footer={null}
      >
        {selectedBeneficiary && (
          <div>
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">Beneficiary</p>
              <p className="font-medium">
                {selectedBeneficiary.name || selectedBeneficiary.identifier}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {selectedBeneficiary.type.toUpperCase()} -{" "}
                {selectedBeneficiary.identifier}
              </p>
            </div>

            <Form
              form={verifyForm}
              layout="vertical"
              onFinish={handleVerifyBeneficiary}
            >
              <Form.Item
                name="otp"
                label="Enter OTP"
                rules={[
                  { required: true, message: "Please enter OTP" },
                  { len: 6, message: "OTP must be 6 digits" },
                ]}
              >
                <Input
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  size="large"
                />
              </Form.Item>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm text-yellow-800">
                  OTP has been sent to your registered phone number. Valid for 10 minutes.
                </p>
              </div>

              <Form.Item>
                <Space className="w-full justify-end">
                  <Button
                    onClick={() => {
                      setShowVerifyModal(false);
                      verifyForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit">
                    Verify
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestBeneficiaries;
