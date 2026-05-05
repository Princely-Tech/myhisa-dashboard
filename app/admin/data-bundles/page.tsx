"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  message,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Tabs,
  Spin,
  Popconfirm,
  Tag,
  Collapse,
  Empty,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FolderOutlined,
} from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, CustomButton, RedButton } from "@/components/buttons";

const NETWORKS = [
  { key: "mtn", label: "MTN", color: "#ffcc00", text: "#000" },
  { key: "airtel", label: "Airtel", color: "#e4002b", text: "#fff" },
  { key: "ninemobile", label: "9Mobile", color: "#006600", text: "#fff" },
  { key: "glo", label: "Glo", color: "#008000", text: "#fff" },
];

interface BundleType {
  id: number;
  network: string;
  name: string;
  network_id: string;
  created_at: string;
  updated_at: string;
}

interface Bundle {
  id: number;
  bundle_type_id: number;
  code: string;
  network_id: string;
  network_identifier: string;
  description: string;
  amount: number;
  cost: number;
  validity: string;
  bundle_type: string;
  created_at: string;
  updated_at: string;
}

type ModalMode = "create" | "edit";

const AdminDataBundlesPage = () => {
  const [messageApi, contextHolder] = message.useMessage();
  const api = new AxiosHandler(messageApi);

  const [activeNetwork, setActiveNetwork] = useState<string>("mtn");
  const [bundleTypes, setBundleTypes] = useState<BundleType[]>([]);
  const [bundlesMap, setBundlesMap] = useState<Record<number, Bundle[]>>({});
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingBundles, setLoadingBundles] = useState<Record<number, boolean>>({});
  const [expandedTypeIds, setExpandedTypeIds] = useState<number[]>([]);

  // --- Bundle Type modal ---
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeModalMode, setTypeModalMode] = useState<ModalMode>("create");
  const [typeModalTarget, setTypeModalTarget] = useState<BundleType | null>(null);
  const [typeForm] = Form.useForm();
  const [typeSubmitting, setTypeSubmitting] = useState(false);

  // --- Bundle modal ---
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleModalMode, setBundleModalMode] = useState<ModalMode>("create");
  const [bundleModalTarget, setBundleModalTarget] = useState<Bundle | null>(null);
  const [bundleModalTypeId, setBundleModalTypeId] = useState<number | null>(null);
  const [bundleForm] = Form.useForm();
  const [bundleSubmitting, setBundleSubmitting] = useState(false);

  // ---- Data fetching ----
  const fetchBundleTypes = useCallback(
    async (network: string) => {
      setLoadingTypes(true);
      setBundleTypes([]);
      setBundlesMap({});
      setExpandedTypeIds([]);
      try {
        const res = await api.get({
          endPoint: apiEndpoints.adminDataBundleTypes(network),
        });
        setBundleTypes(res.data ?? []);
      } catch {
        // error shown by AxiosHandler
      } finally {
        setLoadingTypes(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fetchBundles = useCallback(
    async (network: string, typeId: number) => {
      setLoadingBundles((prev) => ({ ...prev, [typeId]: true }));
      try {
        const res = await api.get({
          endPoint: apiEndpoints.adminDataBundles(network, typeId),
        });
        setBundlesMap((prev) => ({ ...prev, [typeId]: res.data ?? [] }));
      } catch {
        // error shown by AxiosHandler
      } finally {
        setLoadingBundles((prev) => ({ ...prev, [typeId]: false }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    fetchBundleTypes(activeNetwork);
  }, [activeNetwork, fetchBundleTypes]);

  const handlePanelChange = (keys: string | string[]) => {
    const ids = (Array.isArray(keys) ? keys : [keys]).map(Number);
    setExpandedTypeIds(ids);
    ids.forEach((id) => {
      if (!bundlesMap[id]) {
        fetchBundles(activeNetwork, id);
      }
    });
  };

  // ---- Bundle Type CRUD ----
  const openCreateType = () => {
    typeForm.resetFields();
    typeForm.setFieldsValue({ network_id: activeNetwork });
    setTypeModalMode("create");
    setTypeModalTarget(null);
    setTypeModalOpen(true);
  };

  const openEditType = (bt: BundleType) => {
    typeForm.setFieldsValue({ name: bt.name });
    setTypeModalMode("edit");
    setTypeModalTarget(bt);
    setTypeModalOpen(true);
  };

  const handleTypeSubmit = async () => {
    try {
      const values = await typeForm.validateFields();
      setTypeSubmitting(true);

      if (typeModalMode === "create") {
        await api.post({
          endPoint: apiEndpoints.adminDataBundleTypes(activeNetwork),
          body: { ...values, network_id: activeNetwork },
        });
        messageApi.success("Bundle type created");
      } else if (typeModalTarget) {
        await api.put({
          endPoint: apiEndpoints.adminDataBundleType(activeNetwork, typeModalTarget.id),
          body: { name: values.name },
        });
        messageApi.success("Bundle type updated");
      }

      setTypeModalOpen(false);
      fetchBundleTypes(activeNetwork);
    } catch (e: any) {
      if (!e?.response) {
        // validation error — antd handles display
      }
    } finally {
      setTypeSubmitting(false);
    }
  };

  const handleDeleteType = async (bt: BundleType) => {
    try {
      await api.delete({
        endPoint: apiEndpoints.adminDataBundleType(activeNetwork, bt.id),
        body: {},
      });
      messageApi.success(`"${bt.name}" and all its bundles deleted`);
      fetchBundleTypes(activeNetwork);
    } catch {
      // shown by handler
    }
  };

  // ---- Bundle CRUD ----
  const openCreateBundle = (typeId: number, typeName: string) => {
    bundleForm.resetFields();
    bundleForm.setFieldsValue({ bundle_type: typeName });
    setBundleModalMode("create");
    setBundleModalTarget(null);
    setBundleModalTypeId(typeId);
    setBundleModalOpen(true);
  };

  const openEditBundle = (bundle: Bundle, typeId: number, typeName: string) => {
    bundleForm.setFieldsValue({
      code: bundle.code,
      network_identifier: bundle.network_identifier,
      description: bundle.description,
      cost: bundle.cost,
      validity: bundle.validity,
      bundle_type: typeName,
    });
    // amount derived from cost — not collected separately
    setBundleModalMode("edit");
    setBundleModalTarget(bundle);
    setBundleModalTypeId(typeId);
    setBundleModalOpen(true);
  };

  const handleBundleSubmit = async () => {
    try {
      const values = await bundleForm.validateFields();
      setBundleSubmitting(true);

      const payload = { ...values, amount: Math.round((values.cost ?? 0) * 100) };

      if (bundleModalMode === "create" && bundleModalTypeId) {
        await api.post({
          endPoint: apiEndpoints.adminDataBundles(activeNetwork, bundleModalTypeId),
          body: payload,
        });
        messageApi.success("Bundle created");
      } else if (bundleModalTarget && bundleModalTypeId) {
        await api.put({
          endPoint: apiEndpoints.adminDataBundle(
            activeNetwork,
            bundleModalTypeId,
            bundleModalTarget.id
          ),
          body: payload,
        });
        messageApi.success("Bundle updated");
      }

      setBundleModalOpen(false);
      if (bundleModalTypeId) fetchBundles(activeNetwork, bundleModalTypeId);
    } catch (e: any) {
      if (!e?.response) {
        // validation — antd handles
      }
    } finally {
      setBundleSubmitting(false);
    }
  };

  const handleDeleteBundle = async (bundle: Bundle, typeId: number) => {
    try {
      await api.delete({
        endPoint: apiEndpoints.adminDataBundle(activeNetwork, typeId, bundle.id),
        body: {},
      });
      messageApi.success(`Bundle "${bundle.code}" deleted`);
      fetchBundles(activeNetwork, typeId);
    } catch {
      // shown by handler
    }
  };

  // ---- Bundle table columns ----
  const bundleColumns = (typeId: number, typeName: string) => [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 130,
      render: (v: string) => <code className="bg-gray-100 px-1 rounded text-xs">{v}</code>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Cost (₦)",
      dataIndex: "cost",
      key: "cost",
      width: 100,
      align: "right" as const,
      render: (v: number) => `₦${v.toLocaleString()}`,
    },
    {
      title: "Validity",
      dataIndex: "validity",
      key: "validity",
      width: 100,
    },
    {
      title: "Type",
      dataIndex: "bundle_type",
      key: "bundle_type",
      width: 130,
      render: (v: string) => v ? <Tag>{v}</Tag> : null,
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right" as const,
      render: (_: unknown, record: Bundle) => (
        <div className="flex gap-2">
          <Tooltip title="Edit bundle">
            <button
              onClick={() => openEditBundle(record, typeId, typeName)}
              className="text-blue-500 hover:text-blue-700"
            >
              <EditOutlined />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete this bundle?"
            description={`"${record.code}" will be permanently removed.`}
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteBundle(record, typeId)}
          >
            <Tooltip title="Delete bundle">
              <button className="text-red-500 hover:text-red-700">
                <DeleteOutlined />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ---- Collapse items ----
  const collapseItems = bundleTypes.map((bt) => ({
    key: String(bt.id),
    label: (
      <div className="flex items-center justify-between w-full pr-2">
        <span className="font-medium flex items-center gap-2">
          <FolderOutlined className="text-blue-500" />
          {bt.name}
          <Tag color="blue" className="ml-1 font-normal">
            {bundlesMap[bt.id]?.length ?? "—"} bundles
          </Tag>
        </span>
        <div
          className="flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Add bundle">
            <button
              onClick={() => openCreateBundle(bt.id, bt.name)}
              className="text-green-600 hover:text-green-800 text-sm px-2 py-0.5 border border-green-300 rounded"
            >
              <PlusOutlined /> Bundle
            </button>
          </Tooltip>
          <Tooltip title="Rename type">
            <button
              onClick={() => openEditType(bt)}
              className="text-blue-500 hover:text-blue-700"
            >
              <EditOutlined />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete this bundle type?"
            description="All bundles inside it will also be permanently deleted."
            okText="Delete All"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteType(bt)}
          >
            <Tooltip title="Delete type + all bundles">
              <button className="text-red-500 hover:text-red-700">
                <DeleteOutlined />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>
      </div>
    ),
    children: loadingBundles[bt.id] ? (
      <div className="py-6 flex justify-center">
        <Spin />
      </div>
    ) : (bundlesMap[bt.id]?.length ?? 0) === 0 ? (
      <Empty
        description="No bundles yet"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        className="py-4"
      >
        <button
          onClick={() => openCreateBundle(bt.id, bt.name)}
          className="text-blue-500 text-sm underline"
        >
          Add the first bundle
        </button>
      </Empty>
    ) : (
      <Table
        dataSource={bundlesMap[bt.id]}
        columns={bundleColumns(bt.id, bt.name)}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 900 }}
      />
    ),
  }));

  return (
    <div className="px-8 py-4 flex-1 max-h-full overflow-auto">
      {contextHolder}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Bundle Management</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage data plans per network. Changes take effect immediately.
          </p>
        </div>
        <Tooltip title="Reload types">
          <button
            onClick={() => fetchBundleTypes(activeNetwork)}
            className="text-gray-500 hover:text-blue-600"
          >
            <ReloadOutlined className="text-lg" />
          </button>
        </Tooltip>
      </div>

      {/* Network tabs */}
      <Tabs
        activeKey={activeNetwork}
        onChange={(key) => setActiveNetwork(key)}
        type="card"
        items={NETWORKS.map((n) => ({
          key: n.key,
          label: (
            <span
              className="font-semibold px-1"
              style={{ color: n.color === "#ffcc00" ? "#7a6000" : n.color }}
            >
              {n.label}
            </span>
          ),
        }))}
      />

      <Card
        className="mt-0 rounded-tl-none"
        extra={
          <BlueButton
            onClick={openCreateType}
            icon={<PlusOutlined />}
          >
            New Bundle Type
          </BlueButton>
        }
        title={
          <span className="text-base font-semibold">
            {NETWORKS.find((n) => n.key === activeNetwork)?.label} — Bundle Types
          </span>
        }
      >
        {loadingTypes ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : bundleTypes.length === 0 ? (
          <Empty description="No bundle types yet for this network">
            <BlueButton onClick={openCreateType} icon={<PlusOutlined />}>
              Create First Bundle Type
            </BlueButton>
          </Empty>
        ) : (
          <Collapse
            accordion={false}
            activeKey={expandedTypeIds.map(String)}
            onChange={handlePanelChange}
            items={collapseItems}
            className="bg-white"
          />
        )}
      </Card>

      {/* ---- Bundle Type Modal ---- */}
      <Modal
        title={typeModalMode === "create" ? "New Bundle Type" : "Rename Bundle Type"}
        open={typeModalOpen}
        onCancel={() => setTypeModalOpen(false)}
        onOk={handleTypeSubmit}
        okText={typeModalMode === "create" ? "Create" : "Save"}
        confirmLoading={typeSubmitting}
        destroyOnClose
      >
        <Form form={typeForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Type Name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input placeholder="e.g. Daily Data Plan" />
          </Form.Item>
          {typeModalMode === "create" && (
            <Form.Item name="network_id" label="Network ID">
              <Input disabled />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* ---- Bundle Modal ---- */}
      <Modal
        title={bundleModalMode === "create" ? "Add Bundle" : "Edit Bundle"}
        open={bundleModalOpen}
        onCancel={() => setBundleModalOpen(false)}
        onOk={handleBundleSubmit}
        okText={bundleModalMode === "create" ? "Add" : "Save"}
        confirmLoading={bundleSubmitting}
        destroyOnClose
        width={600}
      >
        <Form form={bundleForm} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="code"
              label="Bundle Code"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. MT250801" />
            </Form.Item>
            <Form.Item name="network_identifier" label="Network Identifier">
              <Input placeholder="e.g. 34" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="e.g. 2.5GB Daily Plan" />
          </Form.Item>

          <Form.Item
            name="cost"
            label="Price (₦)"
            rules={[{ required: true, message: "Required" }]}
            extra="Amount in kobo is auto-calculated (× 100)"
          >
            <InputNumber
              min={0}
              step={50}
              className="w-full"
              placeholder="750"
              prefix="₦"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="validity"
              label="Validity"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. 1day, 7days, 30days" />
            </Form.Item>
            <Form.Item name="bundle_type" label="Bundle Type">
              <Input readOnly className="bg-gray-50 cursor-not-allowed" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDataBundlesPage;
