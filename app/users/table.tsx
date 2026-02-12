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
        content: "User has been credited",
        type: "success",
      });
      location.reload();
      setModalContent(null);
      form.resetFields();
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
                  <td>{koboToNaira(item.wallet.balance)}</td>
                  <td>{formatDateSideBySide(item.created_at)}</td>
                  <td>
                    {" "}
                    <BlueButton
                      className=" min-w-[100px] min-h-[44px]"
                      onClick={() => setModalContent(item)}
                    >
                      Credit
                    </BlueButton>
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
    return (
      <Modal
        key={formKey}
        title={`Credit ${modalContent?.name} (${modalContent?.email})`}
        open={true}
        onOk={() => form.submit()}
        okButtonProps={{
          children: "Credit",
          loading: creditingAccount,
          className: "h-[44px] w-[80px]",
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
        <FormField
          form={form}
          key={formKey}
          name="credit user"
          onFinish={(values) => {
            creditUser(values);
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
      </Modal>
    );
  }
};

export default UsersListTable;
