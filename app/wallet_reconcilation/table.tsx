import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import { WalletReconcilationGet } from "@/utils/types";
import { Empty, Spin } from "antd";
import React from "react";

const WalletReconcilationTable = ({
  data,
  className,
}: {
  data: WalletReconcilationGet | null;
  className?: string;
}) => {
  let showEmpty = true;
  if (!data) {
    showEmpty = false;
    data = {
      data: [],
      message: "",
    };
  }
  return (
    <div className={`table-responsive max-w-full ${className}`}>
      <table id="datatable" className="table table-striped table-bordered ">
        <thead>
          <tr>
            <th>S/N</th> 
            <th>Username</th>
            <th>Email</th>
            <th>Date</th>
            <th>Opening Balance (&#8358;)</th>
            <th>Closing Balance (&#8358;)</th>
            <th>Current Balance (&#8358;)</th>
            <th>Inflow </th>
            <th>Outflow </th>
            <th>Transaction (Total)</th>
            <th>Transaction (Successful)</th>
          </tr>
        </thead>
        <tbody>
          {data.data.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={7} rowSpan={5}>
                <Empty />
              </td>
            </tr>
          ) : (
            <>
              {data.data.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                   <td>{item.user.name}</td>
                   <td>{item.user.email}</td>
                   <td>{item.reconciliation_date_str}</td>
                  <td>{koboToNaira(item.opening_balance)}</td>
                  <td>{koboToNaira(item.closing_balance)}</td>
                  <td>{koboToNaira(item.current_balance)}</td>
                  <td>{item.inflow}</td>
                  <td>{item.outflow}</td>
                  <td>{item.total_transaction_count}</td>
                  <td>{item.successful_transaction_count}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WalletReconcilationTable;
