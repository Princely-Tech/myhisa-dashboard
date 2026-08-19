"use client";
import React, { forwardRef } from "react";
import { TransactionItem } from "@/utils/types";
import { buildReceiptData } from "@/utils/receiptConfig";

const statusColors: Record<string, { bg: string; text: string }> = {
  successful: { bg: "#ECFDF3", text: "#027A48" },
  pending: { bg: "#FFFAEB", text: "#B54708" },
  processing: { bg: "#FFFAEB", text: "#B54708" },
  failed: { bg: "#FEF3F2", text: "#B42318" },
};

const TransactionReceipt = forwardRef<HTMLDivElement, { item: TransactionItem }>(
  ({ item }, ref) => {
    const { title, rows } = buildReceiptData(item);
    const statusKey = (item.status || "").toLowerCase();
    const statusColor = statusColors[statusKey] ?? { bg: "#F2F4F7", text: "#344054" };

    return (
      <div
        ref={ref}
        style={{
          width: 420,
          maxWidth: "100%",
          background: "#fff",
          color: "#101828",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          border: "1px solid #EAECF0",
          borderRadius: 12,
          padding: "28px 24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, color: "#103FD5" }}>
            HISA
          </div>
          <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>{title}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <span
            style={{
              background: statusColor.bg,
              color: statusColor.text,
              fontSize: 12,
              fontWeight: 600,
              padding: "4px 12px",
              borderRadius: 999,
              textTransform: "capitalize",
            }}
          >
            {item.status || "Unknown"}
          </span>
        </div>

        <div
          style={{
            borderTop: "1px dashed #D0D5DD",
            borderBottom: "1px dashed #D0D5DD",
            padding: "14px 0",
          }}
        >
          {rows.map((row, index) => (
            <div
              key={`${row.label}-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                padding: "7px 0",
              }}
            >
              <span style={{ fontSize: 13, color: "#667085" }}>{row.label}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: row.highlight ? 700 : 500,
                  color: row.highlight ? "#103FD5" : "#101828",
                  textAlign: "right",
                  wordBreak: "break-word",
                  maxWidth: "60%",
                }}
              >
                {row.value || "-"}
              </span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#98A2B3" }}>
            This is a system-generated receipt and does not require a signature.
          </div>
          <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 2 }}>
            Generated on {new Date().toLocaleString()}
          </div>
        </div>
      </div>
    );
  }
);

TransactionReceipt.displayName = "TransactionReceipt";

export default TransactionReceipt;
