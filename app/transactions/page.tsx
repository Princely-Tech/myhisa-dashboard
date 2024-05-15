import { InputField } from "@/components";
import { Card, Checkbox } from "antd";
import tableJson, {
  statusArray,
  typeArray,
  networkArray,
} from "@/data/tableJson";
import TransactionTable from "./Table";

const Transactions = () => {
  return (
    <div className="flex flex-col  h-screen w-screen flex-1 border p-4">
      <div className="flex gap-1 sm:gap-2 md:gap-4">
        <InputField type="search" placeholder="ID/REF" title="Search " />
        <InputField type="date" title="from" />
        <InputField type="date" title="to" />
      </div>
      <div className="flex gap-3 flex-wrap justify-between mb-4">
        <CheckboxSelect checkItems={statusArray} title="Status" />
        <CheckboxSelect checkItems={typeArray} title="Type" />
        <CheckboxSelect checkItems={networkArray} title="Network" />
      </div>
      {/* <div className="flex-1 bg-red-500  overflow-hidden"> */}
      <TransactionTable data={tableJson()} />
      {/* </div> */}
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
};
