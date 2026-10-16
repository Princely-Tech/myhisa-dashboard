"use client";
// Small presentational pieces shared by the admin onboarding queue and
// detail pages.
import React from "react";
import { STATUS_LABELS } from "@/utils/onboarding";
import type { KycCheckStatus, OnboardingStatus } from "@/utils/types";

const CHECK_TONE: Record<KycCheckStatus | "none", { cls: string; word: string }> = {
  passed: { cls: "bg-[#DCFAE6] text-[#067647]", word: "passed" },
  failed: { cls: "bg-[#FEE4E2] text-[#B42318]", word: "failed" },
  pending: { cls: "bg-[#FEF0C7] text-[#93370D]", word: "pending" },
  error: { cls: "bg-[#FEF0C7] text-[#93370D]", word: "provider error" },
  none: { cls: "bg-[#F2F4F7] text-[#475467]", word: "not run" },
};

const CHECK_MARK: Record<KycCheckStatus | "none", string> = {
  passed: "✓",
  failed: "✕",
  pending: "…",
  error: "!",
  none: "–",
};

export const CheckBadge = ({ label, status }: { label: string; status: KycCheckStatus | null | undefined }) => {
  const key = status ?? "none";
  const tone = CHECK_TONE[key];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[2px] text-[12px] font-semibold ${tone.cls}`}
      title={`${label} ${tone.word}`}
    >
      <span aria-hidden="true">
        {label} {CHECK_MARK[key]}
      </span>
      <span className="sr-only">
        {label} check {tone.word}
      </span>
    </span>
  );
};

const STATUS_TONE: Record<OnboardingStatus, string> = {
  email_unverified: "bg-[#F2F4F7] text-[#344054]",
  profile_incomplete: "bg-[#F2F4F7] text-[#344054]",
  submitted: "bg-[#EAF0FF] text-[#0B2FA8]",
  in_review: "bg-[#EAF0FF] text-[#0B2FA8]",
  queried: "bg-[#FEF0C7] text-[#93370D]",
  approved: "bg-[#DCFAE6] text-[#067647]",
  rejected: "bg-[#FEE4E2] text-[#B42318]",
  suspended: "bg-[#FEE4E2] text-[#B42318]",
};

export const OnboardingStatusPill = ({ status }: { status: OnboardingStatus }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-[10px] py-[3px] text-xs font-semibold ${STATUS_TONE[status] ?? STATUS_TONE.submitted}`}>
    {STATUS_LABELS[status] ?? status}
  </span>
);

/** >48h red, >24h amber (only meaningful while the ball is in our court). */
export function slaClass(waitingSeconds: number, active: boolean): string {
  if (!active) return "text-hisa-muted";
  const h = waitingSeconds / 3600;
  if (h > 48) return "font-semibold text-[#B42318]";
  if (h > 24) return "font-semibold text-[#B54708]";
  return "text-[#067647]";
}

export function slaLabel(waitingSeconds: number, active: boolean): string {
  if (!active) return "";
  const h = waitingSeconds / 3600;
  if (h > 48) return "over 48 hours";
  if (h > 24) return "over 24 hours";
  return "within SLA";
}
