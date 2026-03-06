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
  const [modalAction, setModalAction] = useState<'credit' | 'creditCommission' | 'transfer'>('credit');
  const [creditingAccount, setCreditingAccount] = useState(false);
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
      location.reload();
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
      location.reload();
      setModalContent(null);
      form.resetFields();
    } catch (err) {}
    setCreditingAccount(false);
  };

  const transferCommissionToBalance = async () => {
    setCreditingAccount(true);

    try {
      const res = await apiService.post({
        endPoint: apiEndpoints.transferCommissionToBalance(modalContent!.id),
        body: {},
      });

      messageApi.open({
        content: res.message || "Commission transferred to balance successfully",
        type: "success",
      });
      location.reload();
      setModalContent(null);
    } catch (err) {}
    setCreditingAccount(false);
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
                  <td>{formatDateSideBySide(item.created_at)}</td>
                  <td>
                    <div className="flex gap-2 flex-wrap">
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
      return `Transfer Commission to Balance - ${modalContent?.name} (${modalContent?.email})`;
    };

    const getModalContent = () => {
      if (modalAction === 'transfer') {
        return (
          <div className="py-4">
            <p className="mb-4">Are you sure you want to transfer all commission balance to main wallet?</p>
            <div className="bg-gray-100 p-3 rounded">
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
            } else {
              creditCommission(values);
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

    return (
      <Modal
        key={formKey}
        title={getModalTitle()}
        open={true}
        onOk={() => {
          if (modalAction === 'transfer') {
            transferCommissionToBalance();
          } else {
            form.submit();
          }
        }}
        okButtonProps={{
          children: modalAction === 'transfer' ? 'Transfer' : 'Credit',
          loading: creditingAccount,
          className: "h-[44px] w-[100px]",
        }}
        cancelButtonProps={{
          className:
            "h-[44px] w-[100px] hover:border-red-500 hover:text-red-500",
        }}
        onCancel={() => {
          setModalContent(null);
          form.resetFields();
        }}
      >
        {getModalContent()}
      </Modal>
    );
  }
};

export default UsersListTable;
