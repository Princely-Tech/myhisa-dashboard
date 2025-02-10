"use client";
import AxiosHandler from "@/utils/api/axiosHandler";
import {
  CreditHistory,
  CreditHistoryItem,
  WalletReconcilationGet,
  WalletReconcilationItem,
} from "@/utils/types";
import { useEffect, useState } from "react";
import WalletReconcilationTable from "./table";
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

const WalletReconcilation = () => {
  const [data, setData] = useState<WalletReconcilationGet | null>(null);
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
          Wallet Reconcilation
        </header>
        <FormComponent />
      </div>
      <section className="flex flex-1 overflow-hidden">
        <WalletReconcilationTable
          data={data}
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
    try {
      const res = await apiService.get({
        endPoint: `${apiEndpoints.walletReconcilation}?from_date=${
          fromDate ?? ""
        }&to_date=${toDate ?? ""}`,
      });
      console.log(res.data);
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
    const arr: WalletReconcilationItem[] = [];
    data!.data.forEach((item) => {
      const newValue: WalletReconcilationItem = {
        ...item,
        opening_balance: plainKoboNairaConvert(item.opening_balance),
        closing_balance: plainKoboNairaConvert(item.closing_balance),
        current_balance: plainKoboNairaConvert(item.current_balance),
      };
      return arr.push(newValue);
    });
    handleDownloadCSV(arr, "wallet_reconcilation");
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
export default WalletReconcilation;
