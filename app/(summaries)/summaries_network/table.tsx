import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import { SummaryNetwork, SummaryNetworkItem } from "@/utils/types";
import { Empty, Spin } from "antd";
import React from "react";

const SummariesNetworkTable = ({
  data,
}: {
  data: SummaryNetwork | null;
  className?: string;
}) => {
  let showEmpty = !(data == null);
  let arr: SummaryNetworkItem[] = [];
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
            <th>network</th>
            <th>channel</th>
            <th>type</th>
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
                <td>{item.network}</td>
                <td>{item.channel}</td>
                <td>{item.type}</td>
                <td>{item.total_transactions}</td>
                <td>{koboToNaira(item.total_amount)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SummariesNetworkTable;
