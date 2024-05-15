"use client";
import { formatDateSideBySide } from "@/utils/helperfunctions";
import { TransactionItem } from "@/utils/types";
import { useSearchParams } from "next/navigation";

const TransactionTable = ({ data }: { data: TransactionItem[] }) => {
  const searchParams = useSearchParams();
  return (
   
      <div className="table-responsive h-full max-w-full ">
        <table id="datatable" className="table table-striped table-bordered">
          <thead>
            <tr>
              <th>sm</th>
              <th>id</th>
              <th>amount</th>
              <th>network</th>
              <th>msisdn</th>
              <th>type</th>
              <th>external_ref</th>
              <th>status</th>
              <th>created_at</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.transaction_id}</td>
                <td>{item.amount}</td>
                <td>{item.network}</td>
                <td>{item.msisdn}</td>
                <td>{item.type}</td>
                <td>{item.external_ref}</td>
                <td>{item.status}</td>
                <td>{formatDateSideBySide(item.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
   
  );
};

export default TransactionTable;
