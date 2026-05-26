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
import { Empty, Modal, Spin, message } from "antd";
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
  const [modalAction, setModalAction] = useState<'credit' | 'creditCommission' | 'debit' | 'debitCommission' | 'transfer' | 'apiKey' | 'blockWallet' | 'unblockWallet'>('credit');
  const [creditingAccount, setCreditingAccount] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showFullApiKey, setShowFullApiKey] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [form] = useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const formKey = Math.random() * 100000000000;
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

  return (
    <div className={`table-responsive max-w-full ${className}`}>
      {contextHolder}
      {modalContent != null && (
        <CustomModal key={Math.random() * 100000000000} />
      )}
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
                    <div className="flex gap-2 flex-wrap">
                      {!item.approved_at && (
                        <BlueButton
                          className="min-w-[100px] min-h-[44px] bg-green-600 hover:bg-green-700"
                          onClick={() => approveUser(item)}
                          loading={processingAction}
                        >
                          Approve User
                        </BlueButton>
                      )}
                      <BlueButton
                        className="min-w-[100px] min-h-[44px]"
                        onClick={() => {
                          setModalAction('credit');
                          setModalContent(item);
                        }}
                      >
                        Credit Balance
                      </BlueButton>
                      <BlueButton
                        className="min-w-[100px] min-h-[44px] bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          setModalAction('creditCommission');
                          setModalContent(item);
                        }}
                      >
                        Credit Commission
                      </BlueButton>
                      <BlueButton
                        className="min-w-[100px] min-h-[44px] bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          setModalAction('debit');
                          setModalContent(item);
                        }}
                      >
                        Debit Balance
                      </BlueButton>
                      <BlueButton
                        className="min-w-[100px] min-h-[44px] bg-orange-600 hover:bg-orange-700"
                        onClick={() => {
                          setModalAction('debitCommission');
                          setModalContent(item);
                        }}
                      >
                        Debit Commission
                      </BlueButton>
                      {item.wallet.commission > 0 && (
                        <BlueButton
                          className="min-w-[100px] min-h-[44px] bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setModalAction('transfer');
                            setModalContent(item);
                          }}
                        >
                          Transfer to Balance
                        </BlueButton>
                      )}
                      <BlueButton
                        className="min-w-[100px] min-h-[44px] bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => {
                          setModalAction('apiKey');
                          setModalContent(item);
                          setApiKey('');
                        }}
                      >
                        API Key
                      </BlueButton>
                      {item.wallet.is_account_active ? (
                        <BlueButton
                          className="min-w-[100px] min-h-[44px] bg-red-600 hover:bg-red-700"
                          onClick={() => {
                            setModalAction('blockWallet');
                            setModalContent(item);
                          }}
                        >
                          Block Wallet
                        </BlueButton>
                      ) : (
                        <BlueButton
                          className="min-w-[100px] min-h-[44px] bg-orange-600 hover:bg-orange-700"
                          onClick={() => {
                            setModalAction('unblockWallet');
                            setModalContent(item);
                          }}
                        >
                          Unblock Wallet
                        </BlueButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
  function CustomModal() {
    const getModalTitle = () => {
      if (modalAction === 'credit') return `Credit Balance - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'creditCommission') return `Credit Commission - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'debit') return `Debit Balance - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'debitCommission') return `Debit Commission - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'transfer') return `Transfer Commission to Balance - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'apiKey') return `API Key Management - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'blockWallet') return `Block Wallet - ${modalContent?.name} (${modalContent?.email})`;
      if (modalAction === 'unblockWallet') return `Unblock Wallet - ${modalContent?.name} (${modalContent?.email})`;
      return '';
    };

    const getModalContent = () => {
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
            key={formKey}
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
            key={formKey}
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
            key={formKey}
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
          key={formKey}
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
      if (modalAction === 'apiKey') {
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
        key={formKey}
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
        }}
      >
        {getModalContent()}
      </Modal>
    );
  }
};

export default UsersListTable;
