"use client";
import React from "react";
import { DatePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { BACKEND_DATE_FORMAT } from "@/utils/format";
import { focusRing } from "@/components/ui/styles";
import { lagosToday, lagosYesterday, oldestReportDate } from "./reportUtils";

interface ReportDateBarProps {
  date: string;
  onChange: (date: string) => void;
  busy?: boolean;
}

const chipClass = (pressed: boolean) =>
  `inline-flex h-8 items-center rounded-full border-[1px] border-solid px-[12px] text-[13px] font-semibold transition-colors ${focusRing} ${
    pressed
      ? "border-hisa-primary bg-hisa-primary-soft text-hisa-primary"
      : "border-[#D0D5DD] bg-white text-hisa-body hover:bg-[#F9FAFB]"
  }`;

/**
 * Day picker for the report: Yesterday / Today chips + a calendar for any
 * other day. Days are Lagos calendar days; future days and days older than
 * the backend's 186-day window are disabled.
 */
const ReportDateBar = ({ date, onChange, busy }: ReportDateBarProps) => {
  const today = lagosToday();
  const yesterday = lagosYesterday();
  const oldest = oldestReportDate();
  const isOther = date !== today && date !== yesterday;

  // The picker's calendar days are plain dates: compare them as strings.
  const disabledDate = (d: Dayjs) => {
    const s = d.format(BACKEND_DATE_FORMAT);
    return s > today || s < oldest;
  };

  return (
    <div className="flex flex-wrap items-center gap-[8px] print:hidden" role="group" aria-label="Report date">
      <button type="button" aria-pressed={date === yesterday} className={chipClass(date === yesterday)} onClick={() => onChange(yesterday)}>
        Yesterday
      </button>
      <button type="button" aria-pressed={date === today} className={chipClass(date === today)} onClick={() => onChange(today)}>
        Today
      </button>
      <DatePicker
        aria-label="Pick a date"
        value={isOther ? dayjs(date) : null}
        placeholder="Pick a date"
        format="D MMM YYYY"
        allowClear={false}
        disabledDate={disabledDate}
        onChange={(d) => {
          if (d) onChange(d.format(BACKEND_DATE_FORMAT));
        }}
        className={`h-8 w-[150px] rounded-full ${isOther ? "border-hisa-primary" : ""}`}
      />
      {busy && (
        <span role="status" className="text-[13px] text-hisa-muted">
          Loading…
        </span>
      )}
    </div>
  );
};

export default ReportDateBar;
