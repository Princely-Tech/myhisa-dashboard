"use client";
import {
  BlueButton,
  FormField,
  InputField,
  TransactionTable,
} from "@/components";
import { Card, Checkbox, Form, Spin } from "antd";
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
  const toDate =
    searchParams.get(constants.searchParamsKeys.toDate);
  const fromDate =
    searchParams.get(constants.searchParamsKeys.fromDate);
  const reference =
    searchParams.get(constants.searchParamsKeys.reference) ?? "";
  const beneficiary =
    searchParams.get(constants.searchParamsKeys.beneficiary) ?? "";
  const externalRef =
    searchParams.get(constants.searchParamsKeys.externalRef) ?? "";
  const isFiltering = searchParams.has(constants.searchParamsKeys.isFiltering);
  const formKey = Math.random() * 1000000;

  useEffect(() => {
    process();
  }, [searchParams]);

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
      <FormField
        onFinish={onFinish}
        key={formKey}
        initialValues={{
          reference: reference,
          beneficiary: beneficiary,
          dateRange: [fromDate != null ? dayjs(fromDate) : null, toDate != null ? dayjs(toDate) : null],
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
          <div className="flex justify-start items-start mb-[10px]">
            <Form.Item>
              <BlueButton htmlType="submit" loading={isFiltering}>
                Filter
              </BlueButton>
            </Form.Item>
          </div>
        </div>
      </FormField>
      {/* <div className="flex flex-wrap gap-5 mb-4 justify-between">
        <CheckboxSelect
          checkItems={statusArray}
          title="Status"
          paramsKey={searchParamKeys.status}
        />
        <CheckboxSelect
          checkItems={typeArray}
          title="Type"
          paramsKey={searchParamKeys.type}
        />
        <CheckboxSelect
          checkItems={networkArray}
          title="Network"
          paramsKey={searchParamKeys.network}
        />
      </div> */}
      <div className="flex-1 overflow-hidden">
        <Spin spinning={!data} size="large">
          <TransactionTable data={data} className="min-h-[400px]" />
        </Spin>
      </div>
    </div>
  );
  async function process() {
    const apiService = new AxiosHandler();
    try {

      const queryFromDate = fromDate ?? ''
      const queryToDate = toDate ?? ''
      const res = await apiService.get({
        endPoint: `${apiEndpoints.transactionHistory}?transaction_id=${reference}&msisdn=${beneficiary}&ref=${externalRef}&from_date=${queryFromDate}&to_date=${queryToDate}`,
      });
      console.log(res.data);
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
  }
};

export default Transactions;
// const CheckboxSelect = ({
//   title,
//   checkItems,
//   paramsKey,
// }: {
//   title: string;
//   checkItems: string[];
//   paramsKey: string;
// }) => {
//   return (
//     <Suspense>
//       <Body />
//     </Suspense>
//   );
//   function Body() {
//     const searchParams = useSearchParams();
//     let defaultSelected = searchParams.get(paramsKey);
//     defaultSelected = defaultSelected
//       ? JSON.parse(defaultSelected)
//       : checkItems;
//     console.log(defaultSelected);
//     const [selected, setSelected] = useState<string[]>(defaultSelected);

//     const pathname = usePathname();
//     const router = useRouter();

//     useEffect(() => {
//       const params = new URLSearchParams(searchParams.toString());
//       params.set(paramsKey, JSON.stringify(selected));
//       router.push(`${pathname}?${params}`);
//       // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [selected]);
//     return (
//       <div>
//         <h4 className="">{title}</h4>
//         <div className="flex">
//           {checkItems.map((item, index) => (
//             <Checkbox
//               key={index}
//               defaultChecked={selected.includes(item)}
//               onClick={() => {
//                 setSelected((prevSelected) => {
//                   let newArr = prevSelected;
//                   if (newArr.includes(item)) {
//                     newArr = newArr.filter((arrItem) => item != arrItem);
//                   } else {
//                     newArr.push(item);
//                   }
//                   return newArr;
//                 });
//               }}
//             >
//               {item}
//             </Checkbox>
//           ))}
//         </div>
//       </div>
//     );
//   }
// };
