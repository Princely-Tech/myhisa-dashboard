"use client";
import AxiosHandler from "@/utils/api/axiosHandler";
import { TelcoReconciliationGet, TelcoReconciliationItem } from "@/utils/types";
import { useEffect, useState } from "react";
import { Form, Spin, message } from "antd";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { BlueButton, FormField, InputField } from "@/components";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import constants from "@/utils/constants";
import {
  formatDateTimeYYYYMMDD,
  handleDownloadCSV,
  plainKoboNairaConvert,
  updateSearchParams,
} from "@/utils/helperfunctions";
import dayjs from "dayjs";
import { CustomButton } from "@/components/buttons";
import TelcoReconciliationTable from "./table";
import useRequirePermission from "@/utils/useRequirePermission";

const TelcoReconciliation = () => {
  useRequirePermission("reports.view");
  const [data, setData] = useState<TelcoReconciliationGet | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const apiService = new AxiosHandler(messageApi);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const toDate = searchParams.get(constants.searchParamsKeys.toDate);
  const fromDate = searchParams.get(constants.searchParamsKeys.fromDate);
  const isFiltering = searchParams.has(constants.searchParamsKeys.isFiltering);
  useEffect(() => {
    process();
  }, [searchParams]);
  return (
    <main className="flex-1 border relative px-4 pt-2 pb-5 flex flex-col min-h-screen  overflow-hidden">
      {contextHolder}
      <div className="flex mt-[10px] mb-[30px] flex-col lg:flex-row lg:items-center justify-between gap-x-[20px] gap-y-[10px]">
        <header className="text-[30px] font-medium whitespace-nowrap">
          Telco Reconciliation
        </header>
        <FormComponent />
      </div>
      <section className="flex flex-1 overflow-hidden">
        <TelcoReconciliationTable
          data={data?.data}
          className="min-h-[400px] flex-1 h-full overflow-auto"
        />
        {!data && (
          <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
            <Spin spinning={true} size="large" />
          </div>
        )}
      </section>
    </main>
  );
  function onFinish(values: any) {
    const paramValues: { key: string; value: string }[] = [];

    paramValues.push({
      key: constants.searchParamsKeys.isFiltering,
      value: "true",
    });
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
  }
  async function process() {
    // setData(telcoReconciliationData);
    try {
      const res = await apiService.get({
        endPoint: `${apiEndpoints.telcoReconciliation}?from_date=${
          fromDate ?? ""
        }&to_date=${toDate ?? ""}`,
      });
      // console.log(res.data)
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
  }
  function downLoadHandler() {
    const arr: TelcoReconciliationItem[] = [];
    data!.data.forEach((item) => {
      const newValue: TelcoReconciliationItem = {
        ...item,
        opening_balance: plainKoboNairaConvert(item.opening_balance),
        closing_balance: plainKoboNairaConvert(item.closing_balance),
      };
      return arr.push(newValue);
    });
    handleDownloadCSV(arr, "reconciliation");
  }
  function FormComponent() {
    const formKey = Math.random() * 1000000;
    return (
      <FormField
        onFinish={onFinish}
        key={formKey}
        initialValues={{
          dateRange: fromDate ? [dayjs(fromDate), dayjs(toDate)] : null,
        }}
      >
        <div className="flex gap-[20px] items-start overflow-auto">
          <InputField
            className="h-[50px] "
            inputClassName="h-[44px] min-w-[200px] w-full"
            type="date-range"
            formItemProps={{ name: "dateRange" }}
            dateRangePickerProps={{
              placeholder: ["From Date", "To Date"],
              maxDate: dayjs(new Date()),
            }}
          />
          <BlueButton
            htmlType="submit"
            loading={isFiltering}
            className=" min-w-[100px] min-h-[44px]"
          >
            Filter
          </BlueButton>
          {data && (
            <CustomButton
              onClick={downLoadHandler}
              className=" min-w-[100px] min-h-[44px]"
            >
              Export
            </CustomButton>
          )}
        </div>
      </FormField>
    );
  }
};
export default TelcoReconciliation;
// const telcoReconciliationData = [
//   {
//     id: 1,
//     telco: "MTN",
//     channel: "1",
//     opening_balance: 5000000,
//     closing_balance: 7500000,
//     reconciliation_date: "2024-02-09T00:00:00Z",
//     reconciliation_date_str: "2024-02-09",
//     created_at: "2024-02-10T08:30:45Z",
//     updated_at: "2024-02-10T08:30:45Z",
//   },
//   {
//     id: 2,
//     telco: "Airtel",
//     channel: "1",
//     opening_balance: 3000000,
//     closing_balance: 2500000,
//     reconciliation_date: "2024-02-09T00:00:00Z",
//     reconciliation_date_str: "2024-02-09",
//     created_at: "2024-02-10T09:15:22Z",
//     updated_at: "2024-02-10T09:15:22Z",
//   },
// ];
