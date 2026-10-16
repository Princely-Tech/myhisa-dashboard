"use client";
// One KYC document in the admin detail view: authenticated preview (the
// same fetch-with-Bearer-then-blob approach app/users/table.tsx uses for the
// legacy documents) and per-document Accept / Flag with a note.
import React, { useEffect, useRef, useState } from "react";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { DOCUMENT_LABELS } from "@/utils/onboarding";
import { formatLagosDateTime } from "@/utils/format";
import type { KycDocumentType, OnboardingDocument } from "@/utils/types";
import { btnSecondary, focusRing } from "@/components/ui/styles";

interface Props {
  userId: number;
  /** A v2 document, or a legacy upload (type cac-certificate / utility-bill). */
  doc: OnboardingDocument | { type: "cac-certificate" | "utility-bill"; legacy: true; uploaded_at: string | null };
  canManage: boolean;
  busy?: boolean;
  onReview?: (type: KycDocumentType, status: "accepted" | "flagged", note: string) => Promise<boolean>;
}

const PILL: Record<string, string> = {
  uploaded: "bg-[#EAF0FF] text-[#0B2FA8]",
  accepted: "bg-[#DCFAE6] text-[#067647]",
  flagged: "bg-[#FEF0C7] text-[#93370D]",
  missing: "bg-[#FEE4E2] text-[#B42318]",
};

export default function DocumentReviewItem({ userId, doc, canManage, busy, onReview }: Props) {
  const isLegacy = "legacy" in doc;
  const label = isLegacy
    ? doc.type === "cac-certificate"
      ? "CAC certificate (legacy upload)"
      : "Utility bill (legacy upload)"
    : DOCUMENT_LABELS[doc.type].label;
  const status = isLegacy ? "uploaded" : doc.status;
  const present = status !== "missing";
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flagging, setFlagging] = useState(false);
  const [note, setNote] = useState("");
  const urlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    []
  );

  const fetchBlob = async (): Promise<string | null> => {
    if (urlRef.current) return urlRef.current;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem(apiEndpoints.tokenSetUrl);
      const res = await fetch(`${apiEndpoints.base}${apiEndpoints.adminUserDocument(userId, doc.type)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message || body.error || "Document not found");
        return null;
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      setMime(blob.type);
      setUrl(objectUrl);
      return objectUrl;
    } catch {
      setError("Failed to load the document");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const openInTab = async () => {
    const u = await fetchBlob();
    if (u) window.open(u, "_blank", "noopener");
  };

  const review = async (s: "accepted" | "flagged") => {
    if (!onReview || isLegacy) return;
    const ok = await onReview(doc.type, s, s === "flagged" ? note.trim() : "");
    if (ok) {
      setFlagging(false);
      setNote("");
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-[12px] border-[1px] border-solid border-hisa-border bg-white px-[14px] py-[12px]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <span className="text-[14px] font-semibold text-hisa-ink">
            {label}
            {!isLegacy && doc.required && <span className="ml-2 text-[12px] font-normal text-hisa-muted">Required</span>}
          </span>
          <span className="text-[12px] text-hisa-muted">
            {doc.uploaded_at ? `Uploaded ${formatLagosDateTime(doc.uploaded_at)}` : present ? "Uploaded" : "Not uploaded"}
            {!isLegacy && doc.reviewed_at && ` · Reviewed ${formatLagosDateTime(doc.reviewed_at)}`}
          </span>
          {!isLegacy && doc.reviewer_note && (
            <span className="text-[12px] text-[#93370D]">
              <strong>Note:</strong> {doc.reviewer_note}
            </span>
          )}
        </div>
        <span className={`whitespace-nowrap rounded-full px-[10px] py-[2px] text-[12px] font-semibold ${PILL[status] ?? PILL.uploaded}`}>
          {status === "missing" ? "Missing" : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {present && (
        <div className="flex flex-wrap gap-2">
          {!url && (
            <button type="button" className={btnSecondary} onClick={fetchBlob} disabled={loading}>
              {loading ? "Loading…" : "Preview"}
            </button>
          )}
          <button type="button" className={btnSecondary} onClick={openInTab} disabled={loading}>
            Open in new tab
          </button>
          {!isLegacy && canManage && (
            <>
              <button
                type="button"
                className={btnSecondary}
                disabled={busy || doc.status === "accepted"}
                onClick={() => review("accepted")}
              >
                Accept
              </button>
              <button type="button" className={btnSecondary} disabled={busy} onClick={() => setFlagging((f) => !f)} aria-expanded={flagging}>
                Flag
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="m-0 text-[13px] text-[#B42318]">
          {error}
        </p>
      )}

      {flagging && !isLegacy && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`flag-${doc.type}`} className="m-0 text-[13px] font-semibold text-hisa-body">
            What&apos;s wrong with it? (shown to the partner)
          </label>
          <textarea
            id={`flag-${doc.type}`}
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`w-full rounded-[8px] border-[1px] border-solid border-[#D0D5DD] px-[10px] py-2 text-sm ${focusRing}`}
          />
          <div className="flex gap-2">
            <button type="button" className={btnSecondary} disabled={busy} onClick={() => review("flagged")}>
              Flag document
            </button>
            <button type="button" className={btnSecondary} onClick={() => setFlagging(false)}>
              Cancel
            </button>
          </div>
          <p className="m-0 text-[12px] text-hisa-muted">
            Flagging doesn&apos;t unlock the document for the partner. Use Query to ask for a replacement.
          </p>
        </div>
      )}

      {url && (
        <div className="overflow-hidden rounded-[8px] border-[1px] border-solid border-hisa-border bg-hisa-ground">
          {mime.startsWith("image/") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={`${label} preview`} className="block max-h-[480px] w-full object-contain" />
          ) : (
            <iframe src={url} title={`${label} preview`} className="block h-[480px] w-full border-0" />
          )}
        </div>
      )}
    </li>
  );
}
