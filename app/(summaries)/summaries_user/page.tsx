"use client";
import { BlueButton, FormField, InputField } from "@/components";
import { Form, Spin, message } from "antd";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  SummaryTotal,
  SummaryUser,
  SummaryUserItem,
  TransactionHistory,
} from "@/utils/types";
import AxiosHandler from "@/utils/api/axiosHandler";
import {
  formatDateTimeYYYYMMDD,
  handleDownloadCSV,
  plainKoboNairaConvert,
  updateSearchParams,
} from "@/utils/helperfunctions";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { FormProps } from "antd/lib/form";
import constants from "@/utils/constants";
import dayjs from "dayjs";
import SummariesTotalTable from "./table";
import SummariesUserTable from "./table";
import { CustomButton } from "@/components/buttons";
type FieldType = {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
};
const Transactions = () => {
  const [data, setData] = useState<SummaryUser | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentDate = new Date();

  const isFiltering = searchParams.has(constants.searchParamsKeys.isFiltering);
  const formKey = Math.random() * 1000000;
  const toDate =
    searchParams.get(constants.searchParamsKeys.toDate) ??
    formatDateTimeYYYYMMDD(currentDate);
  const previousDate = new Date(currentDate);
  previousDate.setDate(currentDate.getDate() - 1);
  const fromDate =
    searchParams.get(constants.searchParamsKeys.fromDate) ??
    formatDateTimeYYYYMMDD(previousDate);
  const [messageApi, contextHolder] = message.useMessage();
  const process = useCallback(async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const res = await apiService.get({
        endPoint: `${apiEndpoints.summariesUser}?from_date=${fromDate}&to_date=${toDate}`,
      });
      setData(res);
    } catch (err) {}
    updateSearchParams({
      values: [
        {
          key: constants.searchParamsKeys.isFiltering,
          value: null,
        },
      ],
      pathname: pathname,
      router: router,
      searchParams: searchParams,
    });
  }, [fromDate, toDate, messageApi, pathname, router, searchParams]);

  useEffect(() => {
    process();
  }, [process]);

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const paramValues: { key: string; value: string }[] = [];
    if (values.dateRange) {
      const fromDateDate = values.dateRange[0]!.toDate();
      const toDateDate = values.dateRange[1]!.toDate();
      if (fromDateDate) {
        paramValues.push({
          key: constants.searchParamsKeys.fromDate,
          value: formatDateTimeYYYYMMDD(fromDateDate),
        });
      }
      if (toDateDate) {
        paramValues.push({
          key: constants.searchParamsKeys.toDate,
          value: formatDateTimeYYYYMMDD(toDateDate),
        });
      }
    }
    updateSearchParams({
      values: paramValues,
      pathname: pathname,
      router: router,
      searchParams: searchParams,
    });
  };
  return (
    <div className=" flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen  overflow-hidden">
      {contextHolder}{" "}
      <FormField
        onFinish={onFinish}
        key={formKey}
        initialValues={{
          dateRange: fromDate ? [dayjs(fromDate), dayjs(toDate)] : null,
        }}
      >
        <div className="grid sm:grid-cols-2 gap-x-3">
          <InputField
            className="max-h-[40px]"
            inputClassName="w-full"
            type="date-range"
            formItemProps={{ name: "dateRange" }}
            dateRangePickerProps={{
              placeholder: ["From Date", "To Date"],
              maxDate: dayjs(new Date()),
            }}
          />

          <div className="gap-3 flex justify-start items-start mb-[10px]">
            <Form.Item>
              <BlueButton htmlType="submit" loading={isFiltering}>
                Filter
              </BlueButton>
            </Form.Item>
            {data && (
              <CustomButton onClick={downLoadHandler}>Export</CustomButton>
            )}
          </div>
        </div>
      </FormField>
      <div className="flex-1 relative overflow-hidden">
        <SummariesUserTable data={data} />
        {!data && (
          <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
            <Spin spinning={true} size="large" />
          </div>
        )}
      </div>
    </div>
  );
  function downLoadHandler() {
    const arr: SummaryUserItem[] = [];
    data!.data.forEach((item) => {
      const newValue: SummaryUserItem = {
        ...item,
        grand_total_amount: plainKoboNairaConvert(item.grand_total_amount),
        total_data_amount: plainKoboNairaConvert(item.total_data_amount),
        total_airtime_amount: plainKoboNairaConvert(item.total_airtime_amount),
      };
      return arr.push(newValue);
    });
    handleDownloadCSV(arr, "summaries_user");
  }
};

export default Transactions;
