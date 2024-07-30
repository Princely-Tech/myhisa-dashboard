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
import { TransactionHistory, TransactionItem } from "@/utils/types";
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
import { revalidatePath } from "next/cache";
import { CustomButton } from "@/components/buttons";
type FieldType = {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null];
  reference: string;
  beneficiary: string;
  externalRef: string;
};
const Transactions = () => {
  const [data, setData] = useState<TransactionHistory | null>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentDate = new Date();

  const reference =
    searchParams.get(constants.searchParamsKeys.reference) ?? "";
  const beneficiary =
    searchParams.get(constants.searchParamsKeys.beneficiary) ?? "";
  const externalRef =
    searchParams.get(constants.searchParamsKeys.externalRef) ?? "";
  const isFiltering = searchParams.has(constants.searchParamsKeys.isFiltering);
  const formKey = Math.random() * 1000000;
  const toDate = searchParams.get(constants.searchParamsKeys.toDate);
  const fromDate = searchParams.get(constants.searchParamsKeys.fromDate);
  const [messageApi, contextHolder] = message.useMessage();
  const process = useCallback(async () => {
    try {
      const apiService = new AxiosHandler(messageApi);
      const queryFromDate = fromDate ?? "";
      const queryToDate = toDate ?? "";
      const res = await apiService.get({
        endPoint: `${apiEndpoints.transactionHistory}?transaction_id=${reference}&msisdn=${beneficiary}&ref=${externalRef}&from_date=${queryFromDate}&to_date=${queryToDate}`,
      });
      setData(res.data);
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
  }, [
    fromDate,
    toDate,
    reference,
    beneficiary,
    externalRef,
    messageApi,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    process();
  }, [searchParams, process]);

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    const paramValues: { key: string; value: string }[] = [];
    paramValues.push({
      key: constants.searchParamsKeys.beneficiary,
      value: values.beneficiary ?? "",
    });
    paramValues.push({
      key: constants.searchParamsKeys.reference,
      value: values.reference ?? "",
    });
    paramValues.push({
      key: constants.searchParamsKeys.externalRef,
      value: values.externalRef ?? "",
    });
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
  };
  return (
    <div className=" flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen  overflow-hidden">
      {contextHolder}{" "}
      <FormField
        onFinish={onFinish}
        key={formKey}
        initialValues={{
          reference: reference,
          beneficiary: beneficiary,
          dateRange: fromDate ? [dayjs(fromDate), dayjs(toDate)] : null,
          externalRef: externalRef,
        }}
      >
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-3">
          <InputField
            placeholder="Reference"
            // defaultValue={reference}
            inputClassName="h-[30px]"
            showTitle={false}
            className="max-h-[40px]"
            name={constants.searchParamsKeys.reference}
            formItemProps={{ name: constants.searchParamsKeys.reference }}
          />
          <InputField
            placeholder="Beneficiary"
            // defaultValue={beneficiary}
            showTitle={false}
            inputClassName="h-[30px]"
            className="max-h-[40px]"
            formItemProps={{ name: constants.searchParamsKeys.beneficiary }}
          />
          <InputField
            className="max-h-[40px]"
            inputClassName="w-full"
            type="date-range"
            formItemProps={{ name: "dateRange" }}
            dateRangePickerProps={{
              //defaultValue: [dayjs(fromDate), dayjs(toDate)],
              placeholder: ["From Date", "To Date"],
              maxDate: dayjs(new Date()),
            }}
          />
          <InputField
            placeholder="External Ref"
            // defaultValue={externalRef}
            showTitle={false}
            inputClassName="h-[30px]"
            className="max-h-[40px]"
            formItemProps={{ name: constants.searchParamsKeys.externalRef }}
          />
          <div className="gap-3 flex justify-start items-start mb-[10px]">
            <Form.Item>
              <BlueButton htmlType="submit" loading={isFiltering}>
                Filter
              </BlueButton>
            </Form.Item>
            {data && data.records.length != 0 && (
              <CustomButton onClick={downLoadHandler}>Export</CustomButton>
            )}
          </div>
        </div>
      </FormField>
      <div className="flex-1 relative overflow-hidden">
        <TransactionTable
          data={data}
          className="min-h-[400px] max-h-full max-w-full"
        />
        {!data && (
          <div className="absolute top-0 bottom-0 left-0 right-0 flex justify-center items-center">
            <Spin spinning={true} size="large" />
          </div>
        )}
      </div>
    </div>
  );  function downLoadHandler() {
    const arr: TransactionItem[] = [];
    data!.records.forEach((item) => {
      const newValue: TransactionItem = {
        ...item,

        amount: plainKoboNairaConvert(item.amount),
        balance_before: plainKoboNairaConvert(item.balance_before),
        commission_amount: plainKoboNairaConvert(item.commission_amount),
      };
      return arr.push(newValue);
    });
    let title = "transactions";
    if(fromDate){
      title += `_${fromDate}`
    }  if (toDate) {
      title += `_${toDate}`;
    }
    handleDownloadCSV(arr, title);
  }
};

export default Transactions;
