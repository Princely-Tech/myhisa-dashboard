"use client";
import {
  BlueButton,
  FormField,
  InputField,
  TransactionTable,
} from "@/components";
import { Card, Checkbox, Form, Spin, message } from "antd";
import tableJson, {
  statusArray,
  typeArray,
  networkArray,
  searchParamKeys,
} from "@/data/tableJson";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { TransactionHistory } from "@/utils/types";
import AxiosHandler from "@/utils/api/axiosHandler";
import {
  formatDateTimeYYYYMMDD,
  updateSearchParams,
} from "@/utils/helperfunctions";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { FormProps } from "antd/lib/form";
import constants from "@/utils/constants";
import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
type FieldType = {
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
  email: string;
};
const Transactions = () => {
  const [isExporting, setIsExporting] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const apiService = new AxiosHandler(messageApi);
  const onFinish: FormProps<FieldType>["onFinish"] = async (values) => {
    const fromDate = formatDateTimeYYYYMMDD(values.dateRange[0]?.toDate());
    const toDate = formatDateTimeYYYYMMDD(values.dateRange[1]?.toDate());
    try {
      setIsExporting(true);
      const res = await apiService.post({
        endPoint: `${apiEndpoints.exportTransaction}?emails=${
          values.email ?? ""
        }&from_date=${fromDate}&to_date=${toDate}`,
        body: {},
      });
      messageApi.open({
        content: "Transactions exported successfully",
        type: "success",
        duration:constants.messageDelayTime,
      });
    } catch (err) {}
    setIsExporting(false);
  };

  return (
    <div className="flex-1 relative flex justify-center items-center min-h-screen  overflow-hidden">
      {contextHolder}
      <div className="w-[90%] md:w-[600px]">
        <h2 className="mb-[10px] text-[20px] text-center">
          Export Transactions
        </h2>
        <FormField onFinish={onFinish}>
          <InputField
            type="date-range"
            title="Date range"
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
            placeholder="Comma seperated, (Optional)"
            title="Emails "
            formItemProps={{
              name: "email",
            }}
          />
          <Form.Item>
            <BlueButton htmlType="submit" loading={isExporting} block>
              Export
            </BlueButton>
          </Form.Item>
        </FormField>
      </div>
    </div>
  );
};

export default Transactions;
