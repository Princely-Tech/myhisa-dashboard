// Shared helpers for the partner daily report (app/reports and
// app/admin/partners/[userId]/reports). Pure functions + the CSV download.
import apiEndpoints from "@/utils/api/apiEndpoints";
import { forceReLogin } from "@/utils/session";
import { BACKEND_DATE_FORMAT, formatCount, lagosStartOfDay, toLagos } from "@/utils/format";
import type { DailyReport } from "@/utils/types";

/** Backend limit: dates older than this many days answer 400. */
export const MAX_REPORT_AGE_DAYS = 186;

// ---------------------------------------------------------------------------
// Where a report comes from (partner "me" endpoints or the admin ones)
// ---------------------------------------------------------------------------

export interface ReportSource {
  /** GET path (relative to apiEndpoints.base) for the day's report JSON. */
  daily: (date: string) => string;
  /** GET path for the CSV export of the day. */
  exportCsv: (date: string) => string;
  /** GET/PUT path for the daily email settings. */
  settings: string;
  /** Page URL for a date (kept in sync with ?date=). */
  pageHref: (date: string) => string;
}

// ---------------------------------------------------------------------------
// Dates (Lagos calendar, "YYYY-MM-DD")
// ---------------------------------------------------------------------------

export function lagosToday(): string {
  return lagosStartOfDay().format(BACKEND_DATE_FORMAT);
}

export function lagosYesterday(): string {
  return lagosStartOfDay().subtract(1, "day").format(BACKEND_DATE_FORMAT);
}

export function oldestReportDate(): string {
  return lagosStartOfDay().subtract(MAX_REPORT_AGE_DAYS, "day").format(BACKEND_DATE_FORMAT);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date within [today - 186 days, today] (Lagos). */
export function isReportableDate(date: string | null | undefined): date is string {
  if (!date || !DATE_RE.test(date)) return false;
  const d = toLagos(`${date}T12:00:00+01:00`);
  if (!d.isValid() || d.format(BACKEND_DATE_FORMAT) !== date) return false;
  // Plain string comparison works for zero-padded ISO dates.
  return date >= oldestReportDate() && date <= lagosToday();
}

/** "2026-10-15" -> "15 Oct 2026" (or a custom format). */
export function formatReportDate(date: string, format = "D MMM YYYY"): string {
  const d = toLagos(`${date}T12:00:00+01:00`);
  return d.isValid() ? d.format(format) : date;
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------

/** Rate (0-100, null when the denominator was 0) -> "98.8%" or "—". */
export function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !isFinite(rate)) return "—";
  return `${rate.toFixed(1)}%`;
}

/** Share of a total as "71%" / "0.4%"; "—" when total is 0. */
export function formatShare(part: number, total: number): string {
  if (!total) return "—";
  const pct = (part / total) * 100;
  if (pct > 0 && pct < 1) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

/** Compact counts for axis ticks: 950, 1.2K, 34K, 1.1M. */
export function compactCount(n: number): string {
  if (Math.abs(n) < 1000) return formatCount(n);
  return new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

/** Kobo -> compact naira for chart labels: ₦950, ₦12.7K, ₦1.3M. */
export function compactNaira(kobo: number): string {
  const naira = (kobo ?? 0) / 100;
  if (Math.abs(naira) < 1000) return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(naira)}`;
  return `₦${new Intl.NumberFormat("en-NG", { notation: "compact", maximumFractionDigits: 1 }).format(naira)}`;
}

export type DeltaDirection = "up" | "down" | "flat";

export interface Delta {
  direction: DeltaDirection;
  /** "▲ 15 (14.6%)", "▼ 1.2 pts", "No change". */
  text: string;
}

/** Count/value change vs the previous day. */
export function numberDelta(current: number, previous: number, format: (n: number) => string = formatCount): Delta {
  const diff = current - previous;
  if (diff === 0) return { direction: "flat", text: "No change" };
  const arrow = diff > 0 ? "▲" : "▼";
  const pct = previous > 0 ? ` (${((Math.abs(diff) / previous) * 100).toFixed(1)}%)` : "";
  return { direction: diff > 0 ? "up" : "down", text: `${arrow} ${format(Math.abs(diff))}${pct}` };
}

/** Rate change in percentage points; null when either side has no rate. */
export function rateDelta(current: number | null, previous: number | null | undefined): Delta | null {
  if (current === null || previous === null || previous === undefined) return null;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) return { direction: "flat", text: "No change" };
  return { direction: diff > 0 ? "up" : "down", text: `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff).toFixed(1)} pts` };
}

/** successful + failed + refunded: the denominator of success_rate. */
export function decidedCount(r: { successful_count: number; failed_count: number; refunded_count: number }): number {
  return (r.successful_count ?? 0) + (r.failed_count ?? 0) + (r.refunded_count ?? 0);
}

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

// Categorical order validated with the dataviz skill's validate_palette.js
// (light, white surface): slot 1 is the brand primary. Fixed order, never
// cycled; a 9th product folds into "Other".
export const CATEGORICAL = ["#103FD5", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
export const OTHER_COLOR = "#98A2B3";

// Colour follows the product, not its rank: known products keep their slot
// on every day's report; unknown ones take the free slots in order.
const PRODUCT_SLOTS: Record<string, number> = {
  airtime: 0,
  data: 1,
  electricity: 2,
  cable: 3,
  betting: 4,
  exam: 5,
  internet: 6,
};

export function productColors(types: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  const used = new Set<number>();
  const unknown: string[] = [];
  for (const t of types) {
    const slot = PRODUCT_SLOTS[t.trim().toLowerCase()];
    if (slot !== undefined && !used.has(slot)) {
      out[t] = CATEGORICAL[slot];
      used.add(slot);
    } else {
      unknown.push(t);
    }
  }
  for (const t of unknown) {
    const free = CATEGORICAL.findIndex((_, i) => !used.has(i));
    if (free === -1) {
      out[t] = OTHER_COLOR;
    } else {
      out[t] = CATEGORICAL[free];
      used.add(free);
    }
  }
  return out;
}

/** White or ink text for a label set inside a coloured fill. */
export function textOn(hex: string): string {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contrast vs white (1.05) and vs ink #101828 (L ~0.0103 -> 0.0603).
  return (1.05 / (L + 0.05) >= (L + 0.05) / 0.0603) ? "#FFFFFF" : "#101828";
}

// Success-rate heat grid: binned single-hue (blue) sequential scale,
// more successful = darker. Bins are uneven on purpose - nearly every
// healthy cell sits above 95%, so the steps live where the differences are.
export const RATE_BINS: { min: number; label: string; fill: string }[] = [
  { min: 98, label: "98–100%", fill: "#184f95" },
  { min: 95, label: "95–98%", fill: "#2a78d6" },
  { min: 90, label: "90–95%", fill: "#6da7ec" },
  { min: 80, label: "80–90%", fill: "#9ec5f4" },
  { min: 0, label: "Below 80%", fill: "#cde2fb" },
];

export function rateFill(rate: number | null): string | null {
  if (rate === null || !isFinite(rate)) return null;
  return (RATE_BINS.find((b) => rate >= b.min) ?? RATE_BINS[RATE_BINS.length - 1]).fill;
}

// ---------------------------------------------------------------------------
// Report shape guards (never let a missing array crash a chart)
// ---------------------------------------------------------------------------

export function normalizeReport(r: DailyReport): DailyReport {
  const hours = Array.from({ length: 24 }, (_, hour) => {
    const found = (r.by_hour ?? []).find((h) => h.hour === hour);
    return { hour, count: found?.count ?? 0, successful_count: found?.successful_count ?? 0 };
  });
  return {
    ...r,
    previous_day: r.previous_day ?? null,
    by_product: Array.isArray(r.by_product) ? r.by_product : [],
    by_network: (Array.isArray(r.by_network) ? r.by_network : []).map((n) => ({
      ...n,
      label: n.label || n.network,
      products: Array.isArray(n.products) ? n.products : [],
    })),
    by_hour: hours,
  };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | undefined>;
}

/** Best message from an axios error (backend uses `message` and/or `error`). */
export function apiErrorMessage(err: unknown, fallback: string, field?: string): string {
  const data = (err as { response?: { data?: ApiErrorBody | string } } | null)?.response?.data;
  if (!data) return fallback;
  if (typeof data === "string") return data || fallback;
  const fieldMsg = field ? data.errors?.[field]?.[0] : undefined;
  return fieldMsg || data.message || data.error || fallback;
}

// ---------------------------------------------------------------------------
// CSV download (fetch with the Bearer token -> blob, like the server-logs and
// document downloads). The filename comes from Content-Disposition when the
// API exposes it (Access-Control-Expose-Headers), else the fallback.
// ---------------------------------------------------------------------------

export function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      // fall through to the plain filename
    }
  }
  const plain = /filename\s*=\s*("?)([^";]+)\1/i.exec(header);
  return plain ? plain[2].trim() : null;
}

export async function downloadReportCsv(endPoint: string, fallbackName: string): Promise<string> {
  let token: string | null = null;
  try {
    token = localStorage.getItem(apiEndpoints.tokenSetUrl);
  } catch {
    token = null;
  }
  const res = await fetch(`${apiEndpoints.base}${endPoint}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "text/csv, application/json" },
  });
  if (res.status === 401) {
    forceReLogin();
    throw new Error("Your session has expired. Please log in again.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
    throw new Error(body?.message || body?.error || "Couldn't download the CSV. Try again.");
  }
  const blob = await res.blob();
  const name = filenameFromDisposition(res.headers.get("Content-Disposition")) || fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return name;
}
