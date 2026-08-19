"use client";
import { formatDateSideBySide, koboToNaira } from "@/utils/helperfunctions";
import { TransactionHistory, TransactionItem } from "@/utils/types";
import { Empty, Spin } from "antd";
import React, { useState } from "react";
import { BlueButton } from "./buttons";
import routes from "@/utils/routes";
import ReceiptModal from "./receipt/ReceiptModal";

const TransactionTable = ({
  data,
  className = "",
  showReceiptAction = false,
}: {
  data: TransactionHistory | null;
  className?: string;
  // shows a "Receipt" action per row, letting users download a receipt
  // for successful transactions (e.g. an electricity purchase receipt to
  // hand to a bank).
  showReceiptAction?: boolean;
}) => {
  const [receiptItem, setReceiptItem] = useState<TransactionItem | null>(null);
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

            <th>Telco Reference</th>
            <th>Ref to Telco</th>
            <th>Previous Ref</th>
            <th>Channel</th>
            <th>Paid From</th>

            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.records.length === 0 && showEmpty ? (
            <tr>
              <td colSpan={14} rowSpan={5}>
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
                <td>{item.response_transaction_id}</td>
                <td>{item.ref_to_telco}</td>
                <td>{item.retry_refs_to_telco}</td>
                <td>{item.channel}</td>
                <td>
                  {item.paid_from_wallet === "commission"
                    ? "Commission Wallet"
                    : "Main Wallet"}
                </td>
                <td>
                  <div className="flex justify-center items-center gap-2">
                    <BlueButton href={routes.query(item.transaction_id)}>
                      Query
                    </BlueButton>
                    {showReceiptAction && item.status === "Successful" && (
                      <BlueButton onClick={() => setReceiptItem(item)}>
                        Receipt
                      </BlueButton>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {showReceiptAction && (
        <ReceiptModal
          item={receiptItem}
          open={!!receiptItem}
          onClose={() => setReceiptItem(null)}
        />
      )}
    </div>
  );
};

export default TransactionTable;
