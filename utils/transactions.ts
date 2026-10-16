// Shared transaction constants/helpers for the redesigned screens
// (Transactions, Pending transactions, dashboard recent list). Values mirror
// the Go API: const/services (transaction `type`) and const/telco (`network`
// for airtime/data). Bills store the biller in `network`, so labels fall back
// to the raw value.
import type { TransactionItem } from "./types";
import { describeStatus, type StatusTone } from "@/components/ui/StatusPill";

export const NETWORK_LABELS: Record<string, string> = {
  mtn: "MTN",
  airtel: "Airtel",
  glo: "Glo",
  ninemobile: "9mobile",
  "9mobile": "9mobile",
};

export const NETWORK_OPTIONS: { value: string; label: string }[] = [
  { value: "mtn", label: "MTN" },
  { value: "airtel", label: "Airtel" },
  { value: "glo", label: "Glo" },
  { value: "ninemobile", label: "9mobile" },
];

// servicesConstants on the backend. SMS is not a partner purchase type and is
// left out. Spectranet/Smile have no transaction type of their own in the API
// yet (they only exist as commission-rate keys), so they cannot be filtered.
export const SERVICE_OPTIONS: { value: string; label: string; types: string[] }[] = [
  { value: "Airtime", label: "Airtime", types: ["Airtime"] },
  { value: "Data", label: "Data", types: ["Data", "Gift-Data"] },
  { value: "Electricity", label: "Electricity", types: ["Electricity"] },
  { value: "Cable", label: "Cable TV", types: ["Cable"] },
  { value: "Betting", label: "Betting", types: ["Betting"] },
  { value: "WAEC", label: "WAEC PIN", types: ["WAEC"] },
];

/** Every backend type a partner can have pending (pending page filter). */
export const PENDING_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "Airtime", label: "Airtime" },
  { value: "Data", label: "Data" },
  { value: "Gift-Data", label: "Gift data" },
  { value: "Electricity", label: "Electricity" },
  { value: "Cable", label: "Cable TV" },
  { value: "Betting", label: "Betting" },
  { value: "WAEC", label: "WAEC PIN" },
];

/** Types the self-service requery endpoint can check (others are rejected). */
export const REQUERYABLE_TYPES = ["Airtime", "Data", "Gift-Data", "Electricity", "Cable"];

export function networkLabel(network: string | null | undefined): string {
  const net = (network ?? "").trim();
  if (!net) return "";
  return NETWORK_LABELS[net.toLowerCase()] ?? (net.length <= 6 ? net.toUpperCase() : net);
}

const TYPE_LABELS: Record<string, string> = {
  airtime: "airtime",
  data: "data",
  "gift-data": "gift data",
  electricity: "electricity",
  cable: "cable TV",
  betting: "betting",
  waec: "WAEC PIN",
};

/** "MTN airtime", "Ikeja Electric electricity". */
export function serviceLabel(t: Pick<TransactionItem, "network" | "type">): string {
  const type = (t.type ?? "").trim();
  const typeLabel = TYPE_LABELS[type.toLowerCase()] ?? type.toLowerCase();
  return [networkLabel(t.network), typeLabel].filter(Boolean).join(" ");
}

/** Title for a detail view: "Airtel data 10GB" when a plan name is known. */
export function serviceTitle(t: TransactionItem): string {
  const base = serviceLabel(t);
  const type = (t.type ?? "").toLowerCase();
  const desc = (t.data_bundle_desc ?? "").trim();
  if (desc && (type === "data" || type === "gift-data" || type === "cable")) {
    return `${base} · ${desc}`;
  }
  const label = base || "Transaction";
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type StatusFilter = "all" | StatusTone;

export const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "success", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
];

/** Same bucketing as StatusPill (refunded_at wins over status). */
export function statusTone(t: Pick<TransactionItem, "status" | "refunded_at">): StatusTone {
  return describeStatus(t.status, t.refunded_at).tone;
}

/** Statuses the backend requery actually re-checks (others are "finalized"). */
export function isRequeryable(t: Pick<TransactionItem, "status" | "refunded_at" | "type">): boolean {
  return (
    !t.refunded_at &&
    (t.status === "Pending" || t.status === "Processing") &&
    REQUERYABLE_TYPES.includes(t.type)
  );
}

/**
 * Smart-search classification: 10-14 digits (optionally +, spaces, dashes)
 * is a beneficiary (phone, meter or smartcard number); anything else is a
 * reference. Returns the cleaned value.
 */
export function classifySearch(raw: string): { kind: "beneficiary" | "reference"; value: string } {
  const trimmed = raw.trim();
  const compact = trimmed.replace(/[\s-]/g, "");
  if (/^\+?\d{10,14}$/.test(compact)) {
    return { kind: "beneficiary", value: compact.replace(/^\+/, "") };
  }
  return { kind: "reference", value: trimmed };
}

/** "45s", "12m", "2h", "3d" since `input` (for "pending 2h"). */
export function formatAge(input: string | null | undefined, now: number = Date.now()): string {
  if (!input) return "";
  const t = new Date(input).getTime();
  if (!isFinite(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
