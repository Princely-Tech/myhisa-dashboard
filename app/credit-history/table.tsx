import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import {
  CreditHistory,
  TransactionHistory,
  TransactionItem,
} from "@/utils/types";
import { Empty, Spin } from "antd";
import React from "react";

const CreditHistoryTable = ({
  data,
  className,
}: {
  data: CreditHistory | null;
  className?: string;
}) => {
  let showEmpty = true;
  if (!data) {
    showEmpty = false;
    data = {
      pagination: {
        current_page: 0,
        next_page: 0,
        next_page_url: "",
        prev_page: 0,
        prev_page_url: "",
        total_pages: 0,
      },
      records: [],
      total_records: 0,
    };
  }
  return (
    <div className={`table-responsive max-w-full ${className}`}>
      <table id="datatable" className="table table-striped table-bordered ">
        <thead>
          <tr>
            <th>S/N</th>
            <th>Amount (&#8358;)</th>
            <th>Type </th>
            <th>Source </th>
            <th>Amount Before (&#8358;)</th>
            <th>Description </th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {data.records.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={7} rowSpan={5}>
                <Empty />
              </td>
            </tr>
          ) : (
            <>
              {data.records.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{koboToNaira(item.amount)}</td>
                  <td>{item.action}</td>
                  <td>{item.provider}</td>
                  <td>{koboToNaira(item.balance_before)}</td>
                  <td>{item.description}</td>
                  <td>{formatDateSideBySide(item.created_at)}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CreditHistoryTable;
