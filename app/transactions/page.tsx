"use client";
import {
  BlueButton,
  FormField,
  InputField,
  TransactionTable,
} from "@/components";
import { Card, Checkbox, Spin } from "antd";
import tableJson, {
  statusArray,
  typeArray,
  networkArray,
  searchParamKeys,
} from "@/data/tableJson";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { TransactionHistory } from "@/utils/types";
import AxiosHandler from "@/utils/api/axiosHandler";
import { formatDateTimeYYYYMMDD } from "@/utils/helperfunctions";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { FormProps } from "antd/lib/form";
type FieldType = {
  id: string;
  mssisdn: string;
  ref: string;
};
const Transactions = () => {
  const [data, setData] = useState<TransactionHistory | null>(null);
  const [reference, setReference] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [ExternalRef, setExternalRef] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);
  const referenceInputRef = useRef(null);
  useEffect(() => {
    process();
  }, []);

  return (
    <div className=" flex-1 border px-4 pt-2 pb-5 flex flex-col min-h-screen  overflow-hidden">
      <FormField>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-3">
          <InputField
            key="reference"
            placeholder="Reference"
            inputClassName="h-[30px]"
            showTitle={false}
            className="max-h-[40px]"
            value={reference}
            onChange={(input) => {
              setReference((prevValue) => input.target.value);
            }}
          />
          <InputField
            placeholder="Beneficiary"
            value={beneficiary}
            showTitle={false}
            onChange={(input) =>
              setBeneficiary((prevValue) => input.target.value)
            }
            inputClassName="h-[30px]"
            className="max-h-[40px]"
          />
          <InputField
            placeholder="From Date"
            showTitle={false}
            className="max-h-[40px]"
            type="date"
            value={from}
            onChange={(input) => setFrom((prevValue) => input.target.value)}
          />{" "}
          <InputField
            placeholder="To Date"
            className="max-h-[40px]"
            showTitle={false}
            type="date"
            // showTitle={false}
            value={to}
            onChange={(input) => setTo((prevValue) => input.target.value)}
          />{" "}
          <InputField
            placeholder="External Ref"
            showTitle={false}
            value={ExternalRef}
            inputClassName="h-[30px]"
            onChange={(input) =>
              setExternalRef((prevValue) => input.target.value)
            }
          />
          <div className="flex justify-start items-start">
            <BlueButton
              onClick={async () => {
                setIsFiltering(true);
                await process();
                setIsFiltering(false);
              }}
              loading={isFiltering}
            >
              Filter
            </BlueButton>
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
      const res = await apiService.get({
        endPoint: `${apiEndpoints.transactionHistory}?transaction_id=${reference}&msisdn=${beneficiary}&ref=${ExternalRef}`,
      });
      console.log(res.data);
      setData(res.data);
    } catch (err) {}
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
