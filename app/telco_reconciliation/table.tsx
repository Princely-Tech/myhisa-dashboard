import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import { TelcoReconciliationItem, WalletReconciliationGet } from "@/utils/types";
import { Empty, Spin } from "antd";
import React from "react";

const TelcoReconciliationTable = ({
  data,
  className,
}: {
  data: TelcoReconciliationItem[] | undefined;
  className?: string;
}) => {
  let showEmpty = true;
  if (!data) {
    showEmpty = false;
    data = [];
  }
  return (
    <div className={`table-responsive max-w-full ${className}`}>
      <table id="datatable" className="table table-striped table-bordered ">
        <thead>
          <tr>
            <th>S/N</th>
            <th>Date</th>
            <th>Telco</th>
            <th>Channel</th>
            <th>Opening Balance (&#8358;)</th>
            <th>Closing Balance (&#8358;)</th>

          
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={7} rowSpan={5}>
                <Empty />
              </td>
            </tr>
          ) : (
            <>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.reconciliation_date_str}</td>
                  <td>{item.telco}</td>
                  <td>{item.channel}</td>
                  <td>{koboToNaira(item.opening_balance)}</td>
                  <td>{koboToNaira(item.closing_balance)}</td>
                 
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TelcoReconciliationTable;
