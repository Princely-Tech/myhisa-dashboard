// Shared money/date formatting for the redesigned UI. Amounts from the API are
// always kobo (integers); dates the backend filters on are "YYYY-MM-DD" in
// Lagos time (the same format formatDateTimeYYYYMMDD in helperfunctions sends).
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export const LAGOS_TZ = "Africa/Lagos";
export const BACKEND_DATE_FORMAT = "YYYY-MM-DD";

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

export interface FormatNairaOptions {
  /** Fraction digits to show (default 2). */
  decimals?: number;
  /** Prefix with ₦ (default true). */
  symbol?: boolean;
}

/** Kobo -> "₦1,234.50". null/undefined/garbage -> "₦0.00". */
export function formatNaira(
  kobo: number | string | null | undefined,
  opts: FormatNairaOptions = {}
): string {
  const { decimals = 2, symbol = true } = opts;
  let value = typeof kobo === "string" ? Number(kobo) : kobo ?? 0;
  if (typeof value !== "number" || !isFinite(value)) value = 0;
  const naira = value / 100;
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(naira));
  const sign = naira < 0 ? "-" : "";
  return `${sign}${symbol ? "₦" : ""}${formatted}`;
}

export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function formatCount(n: number | null | undefined): string {
  return new Intl.NumberFormat("en-NG").format(n ?? 0);
}

/** "08031234567" -> "0803 ••• 4567". Short values are returned as-is. */
export function maskBeneficiary(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (v.length <= 8) return v;
  return `${v.slice(0, 4)} ••• ${v.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Lagos time (WAT, UTC+1, no DST)
// ---------------------------------------------------------------------------

export function toLagos(input?: dayjs.ConfigType): Dayjs {
  return (input === undefined ? dayjs() : dayjs(input)).tz(LAGOS_TZ);
}

/** "16 Oct 2026, 10:52" */
export function formatLagosDateTime(
  input: dayjs.ConfigType,
  format = "DD MMM YYYY, HH:mm"
): string {
  if (input === null || input === undefined || input === "") return "";
  const d = toLagos(input);
  return d.isValid() ? d.format(format) : "";
}

/** "10:52" */
export function formatLagosTime(input: dayjs.ConfigType): string {
  return formatLagosDateTime(input, "HH:mm");
}

export function lagosStartOfDay(input?: dayjs.ConfigType): Dayjs {
  return toLagos(input).startOf("day");
}

/** Lagos calendar date in the backend's filter format. */
export function toBackendDate(input?: dayjs.ConfigType): string {
  return toLagos(input).format(BACKEND_DATE_FORMAT);
}

export function lagosGreeting(now?: dayjs.ConfigType): string {
  const hour = toLagos(now).hour();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export type DatePresetKey = "today" | "yesterday" | "last7" | "thisMonth" | "lastMonth";

export const DATE_PRESETS: { key: DatePresetKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "thisMonth", label: "This month" },
  { key: "lastMonth", label: "Last month" },
];

/** Inclusive from/to dates ("YYYY-MM-DD", Lagos calendar) for a preset. */
export function getDatePresetRange(
  key: DatePresetKey,
  now?: dayjs.ConfigType
): { from: string; to: string } {
  const today = lagosStartOfDay(now);
  const fmt = (d: Dayjs) => d.format(BACKEND_DATE_FORMAT);
  switch (key) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "yesterday": {
      const y = today.subtract(1, "day");
      return { from: fmt(y), to: fmt(y) };
    }
    case "last7":
      return { from: fmt(today.subtract(6, "day")), to: fmt(today) };
    case "thisMonth":
      return { from: fmt(today.startOf("month")), to: fmt(today) };
    default: {
      // "lastMonth"
      const lm = today.subtract(1, "month");
      return { from: fmt(lm.startOf("month")), to: fmt(lm.endOf("month")) };
    }
  }
}
