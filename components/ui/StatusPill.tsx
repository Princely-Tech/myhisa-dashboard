import React from "react";

export type StatusTone = "success" | "pending" | "failed" | "refunded";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-[#DCFAE6] text-[#067647]",
  pending: "bg-[#FEF0C7] text-[#93370D]",
  failed: "bg-[#FEE4E2] text-[#B42318]",
  refunded: "bg-[#F2F4F7] text-[#344054]",
};

// Backend statuses (hisa_go_api const/status). TelcoError/InternalError are
// "pending-like" there (models.PendingLikeStatuses): the outcome is still
// being resolved, so they show as pending, not failed.
const STATUS_MAP: Record<string, { tone: StatusTone; label: string }> = {
  successful: { tone: "success", label: "Successful" },
  success: { tone: "success", label: "Successful" },
  pending: { tone: "pending", label: "Pending" },
  processing: { tone: "pending", label: "Processing" },
  telcoerror: { tone: "pending", label: "Awaiting telco" },
  internalerror: { tone: "pending", label: "Under review" },
  failed: { tone: "failed", label: "Failed" },
  invalidmsisdn: { tone: "failed", label: "Invalid number" },
  invalidamount: { tone: "failed", label: "Invalid amount" },
  invalidtelco: { tone: "failed", label: "Invalid network" },
  insufficientbalance: { tone: "failed", label: "Insufficient balance" },
  refunded: { tone: "refunded", label: "Refunded" },
  reversed: { tone: "refunded", label: "Refunded" },
};

export function describeStatus(
  status: string | null | undefined,
  refunded?: boolean | string | null
): { tone: StatusTone; label: string } {
  if (refunded) return { tone: "refunded", label: "Refunded" };
  const key = (status ?? "").replace(/[\s_-]/g, "").toLowerCase();
  const found = STATUS_MAP[key];
  if (found) return found;
  // Unknown status: neutral pill, raw text with camelCase split for reading.
  const label = (status ?? "Unknown").replace(/([a-z])([A-Z])/g, "$1 $2");
  return { tone: "refunded", label };
}

interface StatusPillProps {
  status: string | null | undefined;
  /** Truthy (e.g. a transaction's refunded_at) forces the Refunded pill. */
  refunded?: boolean | string | null;
  className?: string;
}

const StatusPill = ({ status, refunded, className = "" }: StatusPillProps) => {
  const { tone, label } = describeStatus(status, refunded);
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-[10px] py-[3px] text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
      title={status && status !== label ? status : undefined}
    >
      {label}
    </span>
  );
};

export default StatusPill;
