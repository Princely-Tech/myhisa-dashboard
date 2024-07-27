import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import { SummaryUser, SummaryUserItem } from "@/utils/types";
import { Empty, Spin } from "antd";
import React from "react";

const SummariesUserTable = ({
  data,
}: {
  data: SummaryUser | null;
  className?: string;
}) => {
  let showEmpty = !(data == null);
  let arr: SummaryUserItem[] = [];
  if (data) {
    if (data.data) {
      arr = data.data;
    }
  } 
  return (
    <div className={`table-responsive h-full max-h-full max-w-full`}>
      <table id="datatable" className="table table-striped table-bordered ">
        <thead>
          <tr>
            <th>S/N</th>
            <th>Id</th>
            <th>Name</th>
            <th>Airtime Transactions</th>
            <th>Airtime Amount </th>
            <th>Data Transactions</th>
            <th>Data Amount </th>
            <th>Total Transactions</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {arr.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={12} rowSpan={5}>
                <Empty />
              </td>
            </tr>
          ) : (
            arr.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.user_id}</td>
                <td>{item.user_name}</td>
                <td>{item.total_airtime_transactions}</td>
                <td>{koboToNaira(item.total_airtime_amount)}</td>{" "}
                <td>{item.total_data_transactions}</td>
                <td>{koboToNaira(item.total_data_amount)}</td>{" "}
                <td>{item.grand_total_transactions}</td>
                <td>{koboToNaira(item.grand_total_amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SummariesUserTable;
