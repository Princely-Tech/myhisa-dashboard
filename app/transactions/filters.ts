// URL <-> filter state for the Transactions screen. Every filter lives in the
// query string so links, refresh and the back button all reproduce a view.
import { getDatePresetRange, type DatePresetKey } from "@/utils/format";
import { SERVICE_OPTIONS, NETWORK_OPTIONS, STATUS_FILTERS, type StatusFilter } from "@/utils/transactions";

export type DateKey = Extract<DatePresetKey, "today" | "yesterday" | "last7" | "thisMonth"> | "all" | "custom";

export const DATE_OPTIONS: { key: DateKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7 days" },
  { key: "thisMonth", label: "This month" },
  // Not in the mockup, but reference searches need to reach older
  // transactions (the history endpoint allows no-date = all time).
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom range" },
];

export const DEFAULT_DATE: DateKey = "today";

export interface TxFilters {
  q: string;
  service: string;
  network: string;
  date: DateKey;
  /** YYYY-MM-DD (Lagos), only for date === "custom". */
  from: string;
  to: string;
  status: StatusFilter;
  page: number;
}

export const EMPTY_FILTERS: TxFilters = {
  q: "",
  service: "",
  network: "",
  date: DEFAULT_DATE,
  from: "",
  to: "",
  status: "all",
  page: 1,
};

const isDate = (v: string | null): v is string =>
  !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(`${v}T00:00:00Z`).getTime());

interface ReadableParams {
  get(name: string): string | null;
}

export function parseFilters(sp: ReadableParams): TxFilters {
  const service = sp.get("service") ?? "";
  const network = sp.get("network") ?? "";
  const dateRaw = sp.get("date") as DateKey | null;
  const statusRaw = sp.get("status") as StatusFilter | null;
  const from = sp.get("from");
  const to = sp.get("to");
  let date: DateKey = DATE_OPTIONS.some((o) => o.key === dateRaw) ? (dateRaw as DateKey) : DEFAULT_DATE;
  // A custom range without valid dates falls back to the default preset.
  if (date === "custom" && !(isDate(from) && isDate(to))) date = DEFAULT_DATE;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  return {
    q: (sp.get("q") ?? "").trim(),
    service: SERVICE_OPTIONS.some((o) => o.value === service) ? service : "",
    network: NETWORK_OPTIONS.some((o) => o.value === network) ? network : "",
    date,
    from: date === "custom" ? (from as string) : "",
    to: date === "custom" ? (to as string) : "",
    status: STATUS_FILTERS.some((o) => o.key === statusRaw) ? (statusRaw as StatusFilter) : "all",
    page,
  };
}

/** Query string (no leading "?") with defaults omitted. */
export function serializeFilters(f: TxFilters): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.service) p.set("service", f.service);
  if (f.network) p.set("network", f.network);
  if (f.date !== DEFAULT_DATE) p.set("date", f.date);
  if (f.date === "custom" && f.from && f.to) {
    p.set("from", f.from);
    p.set("to", f.to);
  }
  if (f.status !== "all") p.set("status", f.status);
  if (f.page > 1) p.set("page", String(f.page));
  return p.toString();
}

/** Inclusive Lagos-calendar range the backend filters on, or null = all time. */
export function filterDateRange(f: TxFilters): { from: string; to: string } | null {
  if (f.date === "all") return null;
  if (f.date === "custom") return f.from && f.to ? { from: f.from, to: f.to } : null;
  return getDatePresetRange(f.date);
}

export function hasActiveFilters(f: TxFilters): boolean {
  return serializeFilters({ ...f, page: 1 }) !== "";
}

/** Service/network/status set (applied client-side only on a legacy backend; see page.tsx). */
export function hasClientFilters(f: TxFilters): boolean {
  return !!f.service || !!f.network || f.status !== "all";
}
