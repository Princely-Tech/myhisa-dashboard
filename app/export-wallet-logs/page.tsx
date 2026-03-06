"use client";
import {
  BlueButton,
  FormField,
  InputField,
} from "@/components";
import { Form, message } from "antd";
import { useState } from "react";
import AxiosHandler from "@/utils/api/axiosHandler";
import {
  formatDateTimeYYYYMMDD,
} from "@/utils/helperfunctions";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { FormProps } from "antd/lib/form";
import constants from "@/utils/constants";
import dayjs from "dayjs";

type FieldType = {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  email: string;
};

const ExportWalletLogs = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);

  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const fromDate = formatDateTimeYYYYMMDD(values.dateRange[0]?.toDate());
    const toDate = formatDateTimeYYYYMMDD(values.dateRange[1]?.toDate());
    
    try {
      setIsExporting(true);
      const res = await apiService.post({
        endPoint: `${apiEndpoints.exportWalletLogs}?from_date=${fromDate}&to_date=${toDate}${
          values.email ? `&emails=${values.email}` : ""
        }`,
        body: {},
      });
      
      messageApi.open({
        content: res.message || "Wallet logs will be exported to your email",
        type: "success",
        duration: constants.messageDelayTime,
      });
    } catch (err) {
      messageApi.open({
        content: "Failed to export wallet logs",
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
          Export Wallet Logs
        </h2>
        <p className="text-center text-gray-600 mb-6">
          Export your wallet transaction logs for the selected date range. The report will be sent to your email.
        </p>
        <FormField onFinish={onFinish}>
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
              {isExporting ? "Exporting..." : "Export Wallet Logs"}
            </BlueButton>
          </Form.Item>
        </FormField>
      </div>
    </div>
  );
};

export default ExportWalletLogs;
