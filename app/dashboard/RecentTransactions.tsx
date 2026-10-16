"use client";
import React from "react";
import Link from "next/link";
import { Skeleton } from "antd";
import routes from "@/utils/routes";
import type { TransactionItem } from "@/utils/types";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusPill from "@/components/ui/StatusPill";
import { btnSecondary, textLink } from "@/components/ui/styles";
import { formatLagosDateTime, formatNaira, maskBeneficiary, toLagos } from "@/utils/format";

const NETWORK_LABELS: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  ninemobile: "9mobile",
  "9mobile": "9mobile",
};

function serviceLabel(t: TransactionItem): string {
  const net = (t.network ?? "").trim();
  const netLabel =
    NETWORK_LABELS[net.toLowerCase()] ?? (net.length <= 6 ? net.toUpperCase() : net);
  const type = (t.type ?? "").toLowerCase();
  return [netLabel, type].filter(Boolean).join(" ");
}

function timeLabel(createdAt: string): string {
  const d = toLagos(createdAt);
  if (!d.isValid()) return "";
  return d.isSame(toLagos(), "day")
    ? formatLagosDateTime(createdAt, "HH:mm")
    : formatLagosDateTime(createdAt, "D MMM, HH:mm");
}

interface RecentTransactionsProps {
  records: TransactionItem[] | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

const RecentTransactions = ({ records, loading, error, onRetry }: RecentTransactionsProps) => (
  <Card
    title="Recent transactions"
    flush
    actions={
      <Link href={routes.transactions} className={`text-sm ${textLink}`}>
        View all
      </Link>
    }
  >
    {loading && !records ? (
      <div className="px-[20px] pb-[12px]">
        <Skeleton active title={false} paragraph={{ rows: 6 }} />
      </div>
    ) : error && !records ? (
      <EmptyState
        title="Couldn't load recent transactions"
        action={
          <button type="button" className={btnSecondary} onClick={onRetry}>
            Retry
          </button>
        }
      />
    ) : !records || records.length === 0 ? (
      <EmptyState
        title="No transactions yet"
        description="Transactions you make through the API or this dashboard will show up here."
      />
    ) : (
      // The table scrolls inside its own box on narrow screens.
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Recent transactions table">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.05em] text-hisa-muted">
              <th scope="col" className="px-[20px] py-2 font-semibold">Time (WAT)</th>
              <th scope="col" className="px-2 py-2 font-semibold">Service</th>
              <th scope="col" className="px-2 py-2 font-semibold">Beneficiary</th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">Amount</th>
              <th scope="col" className="px-[20px] py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.map((t) => (
              <tr key={t.transaction_id} className="border-t-[1px] border-solid border-[#F2F4F7]">
                <td className="whitespace-nowrap px-[20px] py-[11px] text-hisa-muted">{timeLabel(t.created_at)}</td>
                <td className="px-2 py-[11px] text-hisa-ink">{serviceLabel(t)}</td>
                <td className="px-2 py-[11px] font-mono text-[13px] text-hisa-body">{maskBeneficiary(t.msisdn)}</td>
                <td className="whitespace-nowrap px-2 py-[11px] text-right font-mono text-[13px] text-hisa-ink">
                  {formatNaira(t.amount)}
                </td>
                <td className="px-[20px] py-[11px]">
                  <StatusPill status={t.status} refunded={t.refunded_at} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Card>
);

export default RecentTransactions;
