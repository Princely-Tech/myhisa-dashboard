"use client";
import React from "react";
import Link from "next/link";
import { Skeleton, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import type { TransactionStats, User } from "@/utils/types";
import type { CommissionSummaryData } from "@/utils/commissionHelpers";
import { formatCount, formatNaira, getDatePresetRange } from "@/utils/format";
import { copyToClipboard, fundingDetailsText } from "@/components/shell/FundWalletModal";
import { focusRing, textLink } from "@/components/ui/styles";
import { useAsync, AsyncState } from "./useAsync";

async function fetchStats(from: string, to: string): Promise<TransactionStats> {
  // Same call as TransactionStatsComponent (POST with dates in the query).
  const res = await new AxiosHandler().post({
    endPoint: `${apiEndpoints.transactionStats}?from_date=${from}&to_date=${to}`,
    body: {},
  });
  if (!res?.data) throw new Error("empty stats");
  return res.data as TransactionStats;
}

async function fetchCommission(from: string, to: string): Promise<CommissionSummaryData> {
  // Same endpoint as app/commission/summary. Counts Successful transactions
  // only, so totals.total_amount is the value of successful sales.
  const res = await new AxiosHandler().get({
    endPoint: `${apiEndpoints.commissionSummary}?from_date=${from}&to_date=${to}`,
  });
  if (!res?.data) throw new Error("empty commission summary");
  return res.data as CommissionSummaryData;
}

const KpiShell = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-2 rounded-2xl border-[1px] border-solid border-hisa-border bg-white p-[20px]">
    <span className="text-[13px] text-hisa-muted">{label}</span>
    {children}
  </div>
);

function KpiBody<T>({
  state,
  render,
}: {
  state: AsyncState<T>;
  render: (data: T) => { value: string; note: React.ReactNode };
}) {
  if (state.loading && state.data === null) {
    return <Skeleton active title={{ width: "70%" }} paragraph={{ rows: 1, width: "50%" }} />;
  }
  if (state.data === null) {
    return (
      <div className="flex flex-col items-start gap-2">
        <span className="font-heading text-[28px] font-extrabold leading-tight text-[#98A2B3]">—</span>
        <button type="button" className={`border-0 bg-transparent p-0 text-[13px] ${textLink}`} onClick={() => state.reload()}>
          Couldn&apos;t load · Retry
        </button>
      </div>
    );
  }
  const { value, note } = render(state.data);
  return (
    <>
      <span className="font-heading text-[26px] font-extrabold leading-tight text-hisa-ink sm:text-[28px]">{value}</span>
      <span className="text-[13px] text-hisa-muted">{note}</span>
    </>
  );
}

interface KpiCardsProps {
  me: User | null;
  meLoading: boolean;
  meError: boolean;
  onRetryMe: () => void;
  onFund: () => void;
}

const KpiCards = ({ me, meLoading, meError, onRetryMe, onFund }: KpiCardsProps) => {
  const [messageApi, contextHolder] = message.useMessage();
  const today = getDatePresetRange("today");
  const month = getDatePresetRange("thisMonth");

  const stats = useAsync(() => fetchStats(today.from, today.to), true, [today.from]);
  const salesToday = useAsync(() => fetchCommission(today.from, today.to), true, [today.from]);
  const commissionMonth = useAsync(() => fetchCommission(month.from, month.to), true, [month.from]);

  const wallet = me?.wallet ?? null;

  return (
    <section aria-label="Key figures" className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
      {contextHolder}
      {/* Main wallet (navy hero card) */}
      <div className="flex min-w-0 flex-col gap-[10px] rounded-2xl bg-hisa-navy p-[20px] text-white">
        <span className="text-[13px] text-[#C9D3F2]">Main wallet</span>
        {meLoading && !wallet ? (
          <Skeleton.Input active size="large" style={{ width: 180, minWidth: 180 }} />
        ) : wallet ? (
          <span className="break-all font-heading text-[26px] font-extrabold leading-tight text-white sm:text-[28px]">
            {formatNaira(wallet.balance)}
          </span>
        ) : (
          <button
            type="button"
            onClick={onRetryMe}
            className={`self-start border-0 bg-transparent p-0 text-sm font-semibold text-white underline ${focusRing}`}
          >
            {meError ? "Couldn't load balance · Retry" : "—"}
          </button>
        )}
        {wallet && (
          <>
            {wallet.account_number ? (
              <div className="flex flex-col gap-[2px] text-[13px] text-[#C9D3F2]">
                <span>Fund by transfer to</span>
                <span className="font-mono text-[15px] font-medium text-white">
                  {wallet.account_number}
                  {wallet.bank_name ? ` · ${wallet.bank_name}` : ""}
                </span>
                {wallet.account_name && <span className="break-words">{wallet.account_name}</span>}
              </div>
            ) : (
              <span className="text-[13px] text-[#C9D3F2]">No funding account yet.</span>
            )}
            <div className="mt-1 flex flex-wrap gap-2">
              {wallet.account_number ? (
                <button
                  type="button"
                  onClick={() => copyToClipboard(fundingDetailsText(wallet), messageApi)}
                  className={`inline-flex h-[34px] items-center gap-2 rounded-[8px] border-[1px] border-solid border-[#2B3F86] bg-transparent px-[12px] text-[13px] text-white hover:bg-white/10 ${focusRing}`}
                >
                  <CopyOutlined aria-hidden="true" /> Copy account details
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onFund}
                  className={`inline-flex h-[34px] items-center rounded-[8px] border-[1px] border-solid border-[#2B3F86] bg-transparent px-[12px] text-[13px] text-white hover:bg-white/10 ${focusRing}`}
                >
                  Set up funding account
                </button>
              )}
            </div>
            <span className="text-xs text-[#C9D3F2]">
              Commission <span className="font-mono text-white">{formatNaira(wallet.commission)}</span>
              {" · "}Bonus <span className="font-mono text-white">{formatNaira(wallet.bonus)}</span>
            </span>
          </>
        )}
      </div>

      <KpiShell label="Today's sales">
        <KpiBody
          state={salesToday}
          render={(d) => ({
            value: formatNaira(d.totals?.total_amount ?? 0, { decimals: 0 }),
            note:
              stats.data !== null
                ? `${formatCount(d.totals?.total_transactions ?? 0)} successful of ${formatCount(
                    stats.data.total_transactions
                  )} transactions`
                : `${formatCount(d.totals?.total_transactions ?? 0)} successful transactions`,
          })}
        />
      </KpiShell>

      <KpiShell label="Success rate today">
        <KpiBody
          state={stats}
          render={(s) => {
            const total = s.total_transactions ?? 0;
            const rate = total > 0 ? (s.total_successful / total) * 100 : null;
            return {
              value: rate === null ? "—" : `${rate.toFixed(1)}%`,
              note:
                total === 0 ? (
                  "No transactions yet today"
                ) : (
                  <span className={rate !== null && rate >= 95 ? "text-[#067647]" : "text-[#B54708]"}>
                    {formatCount(s.pending)} pending · {formatCount(s.failed)} failed
                  </span>
                ),
            };
          }}
        />
      </KpiShell>

      <KpiShell label="Commission this month">
        <KpiBody
          state={commissionMonth}
          render={(d) => ({
            value: formatNaira(d.totals?.total_commission ?? 0, { decimals: 0 }),
            note: (
              <Link href={routes.commissionSummary} className={textLink}>
                View earnings
              </Link>
            ),
          })}
        />
      </KpiShell>
    </section>
  );
};

export default KpiCards;

