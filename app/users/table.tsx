"use client";
import { BlueButton, FormField, InputField } from "@/components";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import {
  CreditHistory,
  TransactionHistory,
  TransactionItem,
  User,
  UsersList,
} from "@/utils/types";
import { Dropdown, Empty, MenuProps, Modal, Spin, message } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useForm } from "antd/es/form/Form";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const UsersListTable = ({
  data,
  className,
  router,
}: {
  data: UsersList | null;
  className?: string;
  router: AppRouterInstance;
}) => {
  let showEmpty = true;
  if (!data) {
    showEmpty = false;
    data = {
      pagination: {
        current_page: 0,
        next_page: 0,
        next_page_url: "",
        prev_page: 0,
        prev_page_url: "",
        total_pages: 0,
      },
      users: [],
      total_users: 0,
    };
  }
  const [modalContent, setModalContent] = useState<User | null>(null);
  const [modalAction, setModalAction] = useState<'credit' | 'creditCommission' | 'debit' | 'debitCommission' | 'transfer' | 'apiKey' | 'blockWallet' | 'unblockWallet' | 'viewDetails'>('credit');
  const [creditingAccount, setCreditingAccount] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showFullApiKey, setShowFullApiKey] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [queryMessage, setQueryMessage] = useState('');
  const [sendingQuery, setSendingQuery] = useState(false);
  const [form] = useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  // Stable per (user, action) pair - gives the form/modal a clean reset
  // when a *different* action or user is opened, but stays the same
  // across re-renders of the same open modal. The Math.random() key this
  // replaced was recomputed on every render, which forced React to fully
  // unmount and remount the modal - including the input the user was
  // mid-keystroke in - on every single character typed.
  const modalKey = modalContent ? `${modalContent.id}-${modalAction}` : "closed";
  const creditUser = async (values: any) => {
   
    setCreditingAccount(true);

    try {
      let amount = Number(values.amount) * 100;
      const res = await apiService.post({
        endPoint: apiEndpoints.creditUser(modalContent!.id),
        body: {
          ...values,
          amount,
        },
      });

      
      messageApi.open({
        content: "User balance has been credited",
        type: "success",
      });
      setTimeout(() => {
        location.reload();
      }, 2000);
      setModalContent(null);
      form.resetFields();
    } catch (err) {}
    setCreditingAccount(false);
  };

  const creditCommission = async (values: any) => {
    setCreditingAccount(true);

    try {
      let amount = Number(values.amount) * 100;
      const res = await apiService.post({
        endPoint: apiEndpoints.creditCommission(modalContent!.id),
        body: {
          ...values,
          amount,
        },
      });

      messageApi.open({
        content: "User commission wallet has been credited",
        type: "success",
      });
      setTimeout(() => {
        location.reload();
      }, 2000);
      setModalContent(null);
      form.resetFields();
    } catch (err) {}
    setCreditingAccount(false);
  };

  const debitBalance = async (values: any) => {
    setCreditingAccount(true);

    try {
      let amount = Number(values.amount) * 100;
      const res = await apiService.post({
        endPoint: apiEndpoints.debitBalance(modalContent!.id),
        body: {
          ...values,
          amount,
        },
      });

      messageApi.open({
        content: "User balance has been debited",
        type: "success",
      });
      setTimeout(() => {
        location.reload();
      }, 2000);
      setModalContent(null);
      form.resetFields();
    } catch (err) {}
    setCreditingAccount(false);
  };

  const debitCommission = async (values: any) => {
    setCreditingAccount(true);

    try {
      let amount = Number(values.amount) * 100;
      const res = await apiService.post({
        endPoint: apiEndpoints.debitCommission(modalContent!.id),
        body: {
          ...values,
          amount,
        },
      });

      messageApi.open({
        content: "User commission wallet has been debited",
        type: "success",
      });
      setTimeout(() => {
        location.reload();
      }, 2000);
      setModalContent(null);
      form.resetFields();
    } catch (err) {}
    setCreditingAccount(false);
  };

  const transferCommissionToBalance = async (values?: any) => {
    setCreditingAccount(true);

    try {
      const body: any = {};
      if (values?.amount) {
        body.amount = Number(values.amount) * 100;
      }
      
      const res = await apiService.post({
        endPoint: apiEndpoints.transferCommissionToBalance(modalContent!.id),
        body,
      });

      messageApi.open({
        content: res.message || "Commission transferred to balance successfully",
        type: "success",
      });
      setTimeout(() => {
        location.reload();
      }, 2000);
      setModalContent(null);
      form.resetFields();
    } catch (err) {}
    setCreditingAccount(false);
  };

  const approveUser = async (user: User) => {
    if (!confirm(`Approve user ${user.name}? This will verify their email and activate their account.`)) {
      return;
    }
    setProcessingAction(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.adminApproveUser(user.id),
        body: {},
      });
      messageApi.success('User approved successfully');
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error approving user:', err);
    }
    setProcessingAction(false);
  };

  const sendRegistrationQuery = async (user: User) => {
    if (!queryMessage.trim()) {
      messageApi.error('Enter a message to send');
      return;
    }
    setSendingQuery(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.adminSendRegistrationQuery(user.id),
        body: { message: queryMessage.trim() },
      });
      messageApi.success('Registration query sent to partner');
      setQueryMessage('');
      // Reload so the "Last query sent" note (and every other admin's copy
      // of this user's row) reflects what was just sent - without this,
      // reopening the same modal a moment later still shows the stale
      // pre-send state, which is exactly what leads to a query being sent
      // twice.
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error sending registration query:', err);
    }
    setSendingQuery(false);
  };

  const viewApiKey = async () => {
    setProcessingAction(true);
    try {
      const res = await apiService.get({
        endPoint: apiEndpoints.adminGetUserApiKey(modalContent!.id),
      });
      setApiKey(res.data.api_key);
      setShowFullApiKey(false);
    } catch (err) {
      console.error('Error fetching API key:', err);
    }
    setProcessingAction(false);
  };

  const refreshApiKey = async () => {
    if (!confirm('Refresh API key? This will invalidate the current key immediately. The user will need to update their integrations.')) {
      return;
    }
    setProcessingAction(true);
    try {
      const res = await apiService.post({
        endPoint: apiEndpoints.adminRefreshUserApiKey(modalContent!.id),
        body: {},
      });
      setApiKey(res.data.api_key);
      setShowFullApiKey(false);
      messageApi.success('API key refreshed successfully. Please provide the new key to the user.');
    } catch (err) {
      console.error('Error refreshing API key:', err);
    }
    setProcessingAction(false);
  };

  const blockWallet = async (values: any) => {
    setProcessingAction(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.adminBlockWallet(modalContent!.id),
        body: { reason: values.reason },
      });
      messageApi.success('Wallet blocked successfully');
      setTimeout(() => {
        location.reload();
      }, 1500);
      setModalContent(null);
      form.resetFields();
    } catch (err) {
      console.error('Error blocking wallet:', err);
    }
    setProcessingAction(false);
  };

  const unblockWallet = async (values: any) => {
    setProcessingAction(true);
    try {
      await apiService.post({
        endPoint: apiEndpoints.adminUnblockWallet(modalContent!.id),
        body: { remark: values.remark },
      });
      messageApi.success('Wallet unblocked successfully');
      setTimeout(() => {
        location.reload();
      }, 1500);
      setModalContent(null);
      form.resetFields();
    } catch (err) {
      console.error('Error unblocking wallet:', err);
    }
    setProcessingAction(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('API key copied to clipboard');
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 20) return key;
    return `${key.substring(0, 10)}...${key.substring(key.length - 10)}`;
  };

  const formatPartnerType = (type?: string | null) => {
    if (type === 'bank') return 'Bank';
    if (type === 'non_bank') return 'Non-Bank';
    return 'N/A';
  };

  const viewDocument = async (userId: number, type: 'cac-certificate' | 'utility-bill') => {
    try {
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const response = await fetch(
        `${apiEndpoints.base}${apiEndpoints.adminUserDocument(userId, type)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        messageApi.error(err.message || err.error || 'Document not found');
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Error loading document:', err);
      messageApi.error('Failed to load document');
    }
  };

  // Every per-row action collapsed into one dropdown menu instead of ~9
  // stacked buttons - what made every row in the table balloon in height.
  const buildActionItems = (item: User): MenuProps["items"] => {
    const items: MenuProps["items"] = [
      {
        key: "viewDetails",
        label: "View Details",
        onClick: () => {
          setModalAction("viewDetails");
          setModalContent(item);
        },
      },
    ];

    if (!item.approved_at) {
      items.push({
        key: "approve",
        label: "Approve User",
        onClick: () => approveUser(item),
      });
    }

    items.push(
      { type: "divider" },
      {
        key: "credit",
        label: "Credit Balance",
        onClick: () => {
          setModalAction("credit");
          setModalContent(item);
        },
      },
      {
        key: "creditCommission",
        label: "Credit Commission",
        onClick: () => {
          setModalAction("creditCommission");
          setModalContent(item);
        },
      },
      {
        key: "debit",
        label: "Debit Balance",
        danger: true,
        onClick: () => {
          setModalAction("debit");
          setModalContent(item);
        },
      },
      {
        key: "debitCommission",
        label: "Debit Commission",
        danger: true,
        onClick: () => {
          setModalAction("debitCommission");
          setModalContent(item);
        },
      }
    );

    if (item.wallet.commission > 0) {
      items.push({
        key: "transfer",
        label: "Transfer to Balance",
        onClick: () => {
          setModalAction("transfer");
          setModalContent(item);
        },
      });
    }

    items.push(
      { type: "divider" },
      {
        key: "apiKey",
        label: "API Key",
        onClick: () => {
          setModalAction("apiKey");
          setModalContent(item);
          setApiKey("");
        },
      }
    );

    items.push(
      item.wallet.is_account_active
        ? {
            key: "blockWallet",
            label: "Block Wallet",
            danger: true,
            onClick: () => {
              setModalAction("blockWallet");
              setModalContent(item);
            },
          }
        : {
            key: "unblockWallet",
            label: "Unblock Wallet",
            onClick: () => {
              setModalAction("unblockWallet");
              setModalContent(item);
            },
          }
    );

    return items;
  };

  return (
    <div className={`table-responsive max-w-full ${className}`}>
      {contextHolder}
      {modalContent != null && renderModal()}
      <table id="datatable" className="table table-striped table-bordered ">
        <thead>
          <tr>
            <th>S/N</th>
            <th>Name</th>
            <th>email </th>
            <th>phone </th>
            {/* <th>Amount Before (&#8358;)</th> */}
            <th>Balance (&#8358;)</th>
            <th>Commission (&#8358;)</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.users.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={7} rowSpan={5}>
                <Empty />
              </td>
            </tr>
          ) : (
            <>
              {data.users.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.phone}</td>
                  <td>{koboToNaira(item.wallet.balance)}</td>
                  <td>{koboToNaira(item.wallet.commission)}</td>
                  <td>
                    <div className="flex flex-col gap-1">
                      {item.approved_at ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Approved</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                      )}
                      {item.wallet.is_account_active ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Active</span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Blocked</span>
                      )}
                    </div>
                  </td>
                  <td>{formatDateSideBySide(item.created_at)}</td>
                  <td>
                    <Dropdown
                      menu={{ items: buildActionItems(item) }}
                      trigger={["click"]}
                    >
                      <BlueButton className="min-w-[100px] min-h-[40px]">
                        Actions <DownOutlined />
                      </BlueButton>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
  // A plain function returning JSX, not a nested component ("<CustomModal
  // />") - defining a component function inside another component's body
  // gives it a new identity every render, which makes React treat it as a
  // different component and remount it (killing focus/state) every time
  // the parent re-renders, exactly like the key issue above.
  function renderModal() {
    const getModalTitle = () => {
      if (modalAction === 'credit') return `Credit Balance - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'creditCommission') return `Credit Commission - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'debit') return `Debit Balance - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'debitCommission') return `Debit Commission - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'transfer') return `Transfer Commission to Balance - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'apiKey') return `API Key Management - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'blockWallet') return `Block Wallet - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'unblockWallet') return `Unblock Wallet - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'viewDetails') return `Partner Details - ${modalContent?.name} (${modalContent?.email})`;
      return '';
    };

    const getModalContent = () => {
      if (modalAction === 'viewDetails') {
        return (
          <div className="space-y-4">
            {!modalContent?.approved_at && modalContent?.registration_query && (
              <div className="bg-orange-50 border border-orange-200 p-3 rounded">
                <p className="text-sm text-orange-800">
                  <strong>⚠️ Last query sent to this partner:</strong> {modalContent.registration_query}
                </p>
                {modalContent.registration_query_at && (
                  <p className="text-xs text-orange-600 mt-1">
                    {new Date(modalContent.registration_query_at).toLocaleString()} - check with the
                    partner before sending another one, they may already be acting on this.
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-100 p-3 rounded space-y-1">
              <p><strong>Business Name:</strong> {modalContent?.name || 'N/A'}</p>
              <p><strong>RC Number:</strong> {modalContent?.rc_number || 'N/A'}</p>
              <p><strong>Partner Type:</strong> {formatPartnerType(modalContent?.partner_type)}</p>
              <p><strong>BVN:</strong> {modalContent?.bvn || 'N/A'}</p>
              <p><strong>NIN:</strong> {modalContent?.nin || 'N/A'}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded space-y-1">
              <p className="font-semibold mb-1">Contact Person</p>
              <p><strong>Name:</strong> {modalContent?.contact_person_name || 'N/A'}</p>
              <p><strong>Designation:</strong> {modalContent?.contact_person_designation || 'N/A'}</p>
              <p><strong>Phone:</strong> {modalContent?.contact_person_phone || 'N/A'}</p>
              <p><strong>Email:</strong> {modalContent?.contact_person_email || 'N/A'}</p>
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="font-semibold mb-2">Documents</p>
              <div className="flex gap-2 flex-wrap">
                <BlueButton
                  className="min-w-[160px]"
                  disabled={!modalContent?.cac_certificate_uploaded_at}
                  onClick={() => viewDocument(modalContent!.id, 'cac-certificate')}
                >
                  View CAC Certificate
                </BlueButton>
                <BlueButton
                  className="min-w-[160px]"
                  disabled={!modalContent?.utility_bill_uploaded_at}
                  onClick={() => viewDocument(modalContent!.id, 'utility-bill')}
                >
                  View Utility Bill
                </BlueButton>
              </div>
              {!modalContent?.cac_certificate_uploaded_at && !modalContent?.utility_bill_uploaded_at && (
                <p className="text-xs text-gray-500 mt-2">
                  No documents on file - this account may predate document uploads.
                </p>
              )}
            </div>

            {!modalContent?.approved_at && (
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <p className="text-sm text-blue-800 mb-2">
                  If something needs to be fixed before approving, send the partner a query - they'll
                  see it (and get an email) and can update their details.
                </p>
                <textarea
                  className="w-full border rounded p-2 text-sm mb-2"
                  rows={3}
                  placeholder="e.g. Your CAC Certificate is unreadable, please re-upload a clearer copy."
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                />
                <BlueButton
                  onClick={() => modalContent && sendRegistrationQuery(modalContent)}
                  loading={sendingQuery}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Send Query
                </BlueButton>
              </div>
            )}

            {!modalContent?.approved_at && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-sm text-yellow-800 mb-2">
                  This partner is pending approval. Review the details and documents above before approving.
                </p>
                <BlueButton
                  onClick={() => modalContent && approveUser(modalContent)}
                  loading={processingAction}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve User
                </BlueButton>
              </div>
            )}
          </div>
        );
      }

      if (modalAction === 'apiKey') {
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Security Notice:</strong> API keys are sensitive credentials. Only share with the user through secure channels.
              </p>
            </div>
            
            {!apiKey ? (
              <div className="text-center py-4">
                <BlueButton onClick={viewApiKey} loading={processingAction}>
                  View API Key
                </BlueButton>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-100 p-3 rounded">
                  <label className="block text-sm font-medium mb-2">API Key:</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white p-2 rounded border text-sm break-all">
                      {showFullApiKey ? apiKey : maskApiKey(apiKey)}
                    </code>
                    <BlueButton
                      onClick={() => setShowFullApiKey(!showFullApiKey)}
                      className="min-w-[80px]"
                    >
                      {showFullApiKey ? 'Hide' : 'Show'}
                    </BlueButton>
                    <BlueButton
                      onClick={() => copyToClipboard(apiKey)}
                      className="min-w-[80px]"
                    >
                      Copy
                    </BlueButton>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-sm text-red-800 mb-2">
                    <strong>⚠️ Warning:</strong> Refreshing the API key will immediately invalidate the current key.
                  </p>
                  <BlueButton
                    onClick={refreshApiKey}
                    loading={processingAction}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Refresh API Key
                  </BlueButton>
                </div>
              </div>
            )}
          </div>
        );
      }

      if (modalAction === 'blockWallet') {
        return (
          <FormField
            form={form}
            key={modalKey}
            name="block wallet"
            onFinish={blockWallet}
          >
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Warning:</strong> Blocking this wallet will prevent the user from making any transactions immediately.
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Current Balance:</span>
                  <span className="text-lg font-bold">{koboToNaira(modalContent?.wallet.balance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Current Status:</span>
                  <span className="text-green-600 font-bold">Active</span>
                </div>
              </div>
            </div>
            <InputField
              placeholder="Reason for blocking (required)"
              showTitle={false}
              formItemProps={{
                name: "reason",
                rules: [
                  {
                    required: true,
                    message: "Reason is required",
                  },
                ],
              }}
            />
          </FormField>
        );
      }

      if (modalAction === 'unblockWallet') {
        return (
          <FormField
            form={form}
            key={modalKey}
            name="unblock wallet"
            onFinish={unblockWallet}
          >
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
                <p className="text-sm text-blue-800">
                  Unblocking this wallet will restore the user's ability to make transactions immediately.
                </p>
              </div>
              <div className="bg-gray-100 p-3 rounded mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Current Balance:</span>
                  <span className="text-lg font-bold">{koboToNaira(modalContent?.wallet.balance || 0)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Current Status:</span>
                  <span className="text-red-600 font-bold">Blocked</span>
                </div>
                {modalContent?.wallet.block_reason && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="font-semibold block mb-1">Block History:</span>
                    <p className="text-sm text-gray-700">{modalContent.wallet.block_reason}</p>
                  </div>
                )}
              </div>
            </div>
            <InputField
              placeholder="Reason for unblocking (required)"
              showTitle={false}
              formItemProps={{
                name: "remark",
                rules: [
                  {
                    required: true,
                    message: "Remark is required",
                  },
                ],
              }}
            />
          </FormField>
        );
      }

      if (modalAction === 'transfer') {
        return (
          <FormField
            form={form}
            key={modalKey}
            name="transfer commission"
            onFinish={(values) => {
              transferCommissionToBalance(values);
            }}
          >
            <div className="mb-4">
              <p className="mb-3">Transfer commission balance to main wallet</p>
              <div className="bg-gray-100 p-3 rounded mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">Current Commission:</span>
                  <span className="text-lg font-bold text-purple-600">{koboToNaira(modalContent?.wallet.commission || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Current Balance:</span>
                  <span className="text-lg font-bold text-blue-600">{koboToNaira(modalContent?.wallet.balance || 0)}</span>
                </div>
              </div>
            </div>
            <InputField
              placeholder="Amount (Optional - Leave empty to transfer all)"
              type="number"
              min={1}
              max={modalContent?.wallet.commission ? modalContent.wallet.commission / 100 : undefined}
              showTitle={false}
              formItemProps={{
                name: "amount",
              }}
            />
          </FormField>
        );
      }

      return (
        <FormField
          form={form}
          key={modalKey}
          name="credit user"
          onFinish={(values) => {
            if (modalAction === 'credit') {
              creditUser(values);
            } else if (modalAction === 'creditCommission') {
              creditCommission(values);
            } else if (modalAction === 'debit') {
              debitBalance(values);
            } else {
              debitCommission(values);
            }
          }}
        >
          <InputField
            placeholder="Pin"
            type="number"
            min={1}
            showTitle={false}
            formItemProps={{
              name: "pin",
              rules: [
                {
                  required: true,
                  message: "Pin is required",
                },
              ],
            }}
          />{" "}
          <InputField
            placeholder="Amount"
            type="number"
            min={1}
            showTitle={false}
            formItemProps={{
              name: "amount",
              rules: [
                {
                  required: true,
                  message: "Amount is required",
                },
              ],
            }}
          />{" "}
          <InputField
            placeholder="Remark"
            showTitle={false}
            formItemProps={{
              name: "remark",
              rules: [
                {
                  required: true,
                  message: "Remark is required",
                },
              ],
            }}
          />
        </FormField>
      );
    };

    const getOkButtonProps = () => {
      if (modalAction === 'apiKey' || modalAction === 'viewDetails') {
        return { style: { display: 'none' } };
      }
      let buttonText = 'Submit';
      if (modalAction === 'transfer') buttonText = 'Transfer';
      else if (modalAction === 'credit' || modalAction === 'creditCommission') buttonText = 'Credit';
      else if (modalAction === 'debit' || modalAction === 'debitCommission') buttonText = 'Debit';
      else if (modalAction === 'blockWallet') buttonText = 'Block Wallet';
      else if (modalAction === 'unblockWallet') buttonText = 'Unblock Wallet';
      
      return {
        children: buttonText,
        loading: creditingAccount || processingAction,
        className: "h-[44px] w-[120px]",
      };
    };

    return (
      <Modal
        key={modalKey}
        title={getModalTitle()}
        open={true}
        onOk={() => {
          if (modalAction !== 'apiKey') {
            form.submit();
          }
        }}
        okButtonProps={getOkButtonProps()}
        cancelButtonProps={{
          className:
            "h-[44px] w-[100px] hover:border-red-500 hover:text-red-500",
        }}
        onCancel={() => {
          setModalContent(null);
          form.resetFields();
          setApiKey('');
          setShowFullApiKey(false);
          setQueryMessage('');
        }}
      >
        {getModalContent()}
      </Modal>
    );
  }
};

export default UsersListTable;
