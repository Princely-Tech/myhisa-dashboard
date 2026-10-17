"use client";
import React from "react";
import { formatCount, formatNaira } from "@/utils/format";
import type { DailyReport } from "@/utils/types";
import { Delta, formatRate, formatReportDate, numberDelta, rateDelta } from "./reportUtils";

// Up is good for every compared figure here (volume, revenue, success rate).
const DELTA_CLASS: Record<Delta["direction"], string> = {
  up: "text-[#067647]",
  down: "text-[#B42318]",
  flat: "text-hisa-muted",
};

const Tile = ({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-[6px] rounded-2xl border-[1px] border-solid border-hisa-border bg-white p-[18px] print:break-inside-avoid print:rounded-[8px] print:p-[12px]">
    <span className="text-[13px] text-hisa-muted">{label}</span>
    <span className="break-words font-heading text-[24px] font-extrabold leading-tight text-hisa-ink sm:text-[26px] print:text-[20px]">
      {value}
    </span>
    {children && <span className="text-[13px] text-hisa-muted">{children}</span>}
  </div>
);

const DeltaNote = ({ delta, prevLabel }: { delta: Delta | null; prevLabel: string | null }) => {
  if (!delta || !prevLabel) return null;
  return (
    <span className="block">
      <span className={`font-mono font-medium ${DELTA_CLASS[delta.direction]}`}>{delta.text}</span> vs {prevLabel}
    </span>
  );
};

const ReportKpis = ({ report }: { report: DailyReport }) => {
  const { totals, previous_day: prev } = report;
  const prevLabel = prev ? formatReportDate(prev.date, "D MMM") : null;
  const completed = totals.successful_count + totals.failed_count + totals.refunded_count;
  const failedBits: string[] = [];
  if (totals.invalid_count > 0) failedBits.push(`${formatCount(totals.invalid_count)} invalid`);
  if (totals.refunded_count > 0) failedBits.push(`${formatCount(totals.refunded_count)} refunded`);
  // Pending isn't failed; it rides along here (excluded from the rate).
  if (totals.pending_count > 0) failedBits.push(`${formatCount(totals.pending_count)} pending, not in the rate`);

  return (
    <section
      aria-label="Key figures"
      className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-[8px]"
    >
      <Tile label="Transactions" value={formatCount(totals.count)}>
        {prev ? <DeltaNote delta={numberDelta(totals.count, prev.count)} prevLabel={prevLabel} /> : "No previous day to compare"}
      </Tile>
      <Tile label="Successful value" value={formatNaira(totals.successful_value_kobo, { decimals: 0 })}>
        {prev && (
          <DeltaNote
            delta={numberDelta(totals.successful_value_kobo, prev.successful_value_kobo, (n) => formatNaira(n, { decimals: 0 }))}
            prevLabel={prevLabel}
          />
        )}
        <span className="block">of {formatNaira(totals.value_kobo, { decimals: 0 })} attempted</span>
      </Tile>
      <Tile label="Success rate" value={formatRate(totals.success_rate)}>
        {prev && <DeltaNote delta={rateDelta(totals.success_rate, prev.success_rate)} prevLabel={prevLabel} />}
        <span className="block">
          {completed > 0
            ? `${formatCount(totals.successful_count)} of ${formatCount(completed)} completed`
            : "No completed transactions"}
        </span>
      </Tile>
      <Tile label={totals.invalid_count > 0 ? "Failed (incl. invalid)" : "Failed"} value={formatCount(totals.failed_count)}>
        {failedBits.length ? failedBits.join(" · ") : totals.failed_count === 0 ? "None failed" : null}
      </Tile>
    </section>
  );
};

export default ReportKpis;
