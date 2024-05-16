"use client";
import { InputField } from "@/components";
import { Card, Checkbox } from "antd";
import tableJson, {
  statusArray,
  typeArray,
  networkArray,
} from "@/data/tableJson";
import TransactionTable from "./Table";
import { Suspense, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
const Transactions = () => {
  return (
    <div className="flex flex-col  h-screen w-screen flex-1 border p-4">
      <div className="flex gap-1 sm:gap-2 md:gap-4">
        <InputField type="search" placeholder="ID/REF" title="Search " />
        <InputField type="date" title="from" />
        <InputField type="date" title="to" />
      </div>
      <div className="flex gap-3 flex-wrap justify-between mb-4">
        <CheckboxSelect checkItems={statusArray} title="Status" paramsKey="" />
        <CheckboxSelect checkItems={typeArray} title="Type" paramsKey="" />
        <CheckboxSelect
          checkItems={networkArray}
          title="Network"
          paramsKey=""
        />
      </div>
      <TransactionTable data={tableJson()} />
    </div>
  );
};

export default Transactions;
const CheckboxSelect = ({
  title,
  checkItems,
  paramsKey,
}: {
  title: string;
  checkItems: string[];
  paramsKey: string;
}) => {
  return (
    <Suspense>
      <Body />
    </Suspense>
  );
  function Body() {
    const [selected, setSelected] = useState([]);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const updateParams = () => {
      const params = new URLSearchParams(searchParams.toString());
      // const
    };
    return (
      <div>
        <h4 className="">{title}</h4>
        <div className="flex">
          {checkItems.map((item, index) => (
            <Checkbox key={index} defaultChecked={true}>
              {item}
            </Checkbox>
          ))}
        </div>
      </div>
    );
  }
};
