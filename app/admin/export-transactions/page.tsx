"use client";
import {
  BlueButton,
  FormField,
  InputField,
} from "@/components";
import { Form, Select, message } from "antd";
import { useState, useEffect } from "react";
import AxiosHandler from "@/utils/api/axiosHandler";
import {
  formatDateTimeYYYYMMDD,
} from "@/utils/helperfunctions";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { FormProps } from "antd/lib/form";
import constants from "@/utils/constants";
import dayjs from "dayjs";
import { User } from "@/utils/types";
import useRequirePermission from "@/utils/useRequirePermission";

const { Option } = Select;

type FieldType = {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  userId: number;
  email: string;
};

const AdminExportTransactions = () => {
  useRequirePermission("transactions.view");
  const [isExporting, setIsExporting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const apiService = new AxiosHandler(messageApi);
      const response = await apiService.get({
        endPoint: apiEndpoints.users,
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      messageApi.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const fromDate = formatDateTimeYYYYMMDD(values.dateRange[0]?.toDate());
    const toDate = formatDateTimeYYYYMMDD(values.dateRange[1]?.toDate());

    try {
      setIsExporting(true);
      const res = await apiService.post({
        endPoint: `${apiEndpoints.exportTransaction}?from_date=${fromDate}&to_date=${toDate}&user_id=${values.userId}${
          values.email ? `&emails=${values.email}` : ""
        }`,
        body: {},
      });

      messageApi.open({
        content: res.message || "Transactions will be exported to your email",
        type: "success",
        duration: constants.messageDelayTime,
      });
    } catch (err) {
      messageApi.open({
        content: "Failed to export transactions",
        type: "error",
        duration: constants.messageDelayTime,
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 relative flex justify-center items-center min-h-screen overflow-hidden">
      {contextHolder}
      <div className="w-[90%] md:w-[600px]">
        <h2 className="mb-[10px] text-[20px] text-center font-bold">
          Export Transactions (Admin)
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Export transaction history for any user. The report will be sent to your email.
        </p>
        <FormField onFinish={onFinish}>
          <Form.Item
            label="Select User"
            name="userId"
            rules={[
              {
                required: true,
                message: "Please select a user",
              },
            ]}
          >
            <Select
              showSearch
              placeholder="Select a user"
              loading={loadingUsers}
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.email} (ID: {user.id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <InputField
            type="date-range"
            title="Date Range"
            formItemProps={{
              name: "dateRange",
              rules: [
                {
                  required: true,
                  message: "Date range is required",
                },
              ],
            }}
            dateRangePickerProps={{
              placeholder: ["From Date", "To Date"],
              maxDate: dayjs(new Date()),
            }}
          />
          <InputField
            placeholder="Comma separated emails (Optional)"
            title="Additional Emails"
            formItemProps={{
              name: "email",
            }}
          />
          <Form.Item>
            <BlueButton
              htmlType="submit"
              loading={isExporting}
              block
              className="min-w-[100px] min-h-[44px]"
            >
              {isExporting ? "Exporting..." : "Export Transactions"}
            </BlueButton>
          </Form.Item>
        </FormField>
      </div>
    </div>
  );
};

export default AdminExportTransactions;
