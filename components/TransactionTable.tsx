import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import { TransactionHistory, TransactionItem } from "@/utils/types";
import { Empty, Spin } from "antd";
import React from "react";
import { BlueButton } from "./buttons";
import routes from "@/utils/routes";

const TransactionTable = ({
  data,
  className = "",
}: {
  data: TransactionHistory | null;
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
            <th>Reference</th>
            <th>Service Amount (&#8358;)</th>
            <th>Amount Paid (&#8358;)</th>
            <th>Commissions (&#8358;)</th>
            <th>Amount Before (&#8358;)</th>
            <th>Biller</th>
            <th>Beneficiary/MSIDN</th>
            <th>Service Type</th>
            <th>External Ref</th>
            <th>Status</th>
            <th>Token</th>
            <th>Beneficiary Name</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.records.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={12} rowSpan={5}>
                <Empty />
              </td>
            </tr>
          ) : (
            data.records.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{item.transaction_id}</td>
                <td>{koboToNaira(item.amount)}</td>
                <td>{koboToNaira(item.amount - item.commission_amount)}</td>
                <td>{koboToNaira(item.commission_amount)}</td>
                <td>{koboToNaira(item.balance_before)}</td>
                <td>{item.network}</td>
                <td>{item.msisdn}</td>
                <td>{item.type}</td>
                <td>{item.external_ref}</td>
                <td>{item.status}</td>
                <td className="min-w-[200px]">{item.token}</td>
                <td>{item.beneficiary_name}</td>
                <td>{formatDateSideBySide(item.created_at)}</td>
                <td>
                  <div className="flex justify-center items-center">
                    <BlueButton href={routes.query(item.transaction_id)}>
                      Query
                    </BlueButton>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionTable;
