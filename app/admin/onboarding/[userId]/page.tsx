"use client";
// Admin onboarding detail: submitted data (left), verification results and
// documents (right), decisions (start review / approve / query / reject),
// per-document accept/flag, and the event history.
import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Modal, message } from "antd";
import routes from "@/utils/routes";
import useRequirePermission from "@/utils/useRequirePermission";
import { hasPermission } from "@/utils/permissions";
import { readStoredUser } from "@/utils/session";
import { adminOnboardingApi, errorMessage, isApiError } from "@/utils/api/onboardingApi";
import {
  BUSINESS_TYPES,
  DOCUMENT_TYPES,
  INTEGRATION_METHODS,
  PARTNER_CATEGORIES,
  SERVICES,
  STATUS_LABELS,
  VOLUME_BANDS,
  fieldLabel,
  isBlankTime,
  labelOf,
} from "@/utils/onboarding";
import { formatLagosDateTime } from "@/utils/format";
import type { AdminOnboardingDetail, KycDocumentType, OnboardingCheck, OnboardingEvent } from "@/utils/types";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { btnPrimary, btnSecondary, focusRing, textLink } from "@/components/ui/styles";
import { CheckBadge, OnboardingStatusPill } from "@/components/onboarding/admin/badges";
import DocumentReviewItem from "@/components/onboarding/admin/DocumentReviewItem";
import QueryModal from "@/components/onboarding/admin/QueryModal";

const btnDanger = `inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border-[1px] border-solid border-[#FDA29B] bg-white px-[16px] text-sm font-semibold text-[#B42318] transition-colors hover:bg-[#FEF3F2] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

const Row = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className={`flex min-w-0 flex-col gap-[2px] ${highlight ? "rounded-[8px] bg-[#FFFAEB] px-2 py-1" : ""}`}>
    <dt className="font-normal text-[12px] text-hisa-muted">{label}</dt>
    <dd className="m-0 break-words text-[14px] font-semibold text-hisa-ink">
      {value === null || value === undefined || value === "" ? <span className="font-normal text-[#98A2B3]">—</span> : value}
    </dd>
  </div>
);

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

function yesNo(v: unknown): string {
  return v === true ? "Yes" : v === false ? "No" : "Unknown";
}

const CheckDetail = ({ title, check, kind }: { title: string; check: OnboardingCheck | null; kind: "cac" | "bvn" | "nin" }) => {
  if (!check) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold">{title}</span>
          <CheckBadge label={kind.toUpperCase()} status={null} />
        </div>
        <span className="text-[13px] text-hisa-muted">Not run yet.</span>
      </div>
    );
  }
  const s = check.summary ?? {};
  const name = [str(s.first_name), str(s.middle_name), str(s.last_name)].filter(Boolean).join(" ");
  const decision = (s.decision ?? null) as Record<string, unknown> | null;
  const affiliates = Array.isArray(s.affiliates) ? (s.affiliates as { name?: string; role?: string }[]) : [];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[14px] font-semibold">{title}</span>
        <CheckBadge label={kind.toUpperCase()} status={check.status} />
        <span className="text-[12px] text-hisa-muted">
          {check.provider} · {formatLagosDateTime(check.created_at)}
        </span>
      </div>
      <dl className="m-0 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {kind === "cac" ? (
          <>
            <Row label="Company name" value={str(s.company_name)} />
            <Row label="RC number" value={<span className="font-mono">{str(s.rc_number)}</span>} />
            <Row label="Status on register" value={str(s.status)} />
            <Row label="Registered" value={str(s.registration_date)} />
            <Row label="Address" value={str(s.address)} />
            <Row label="Company type" value={str(s.company_type)} />
          </>
        ) : (
          <>
            <Row label="Name on record" value={name} />
            <Row label="Date of birth" value={str(s.dob)} />
            <Row label={kind === "bvn" ? "BVN" : "NIN"} value={<span className="font-mono">{str(s.bvn_last4 ?? s.nin_last4)}</span>} />
            {s.phone_last4 !== undefined && <Row label="Phone on record" value={str(s.phone_last4)} />}
          </>
        )}
      </dl>
      {kind === "cac" && affiliates.length > 0 && (
        <div className="text-[13px]">
          <span className="text-hisa-muted">Directors / proprietors: </span>
          {affiliates.map((a) => [a.name, a.role].filter(Boolean).join(" (") + (a.role ? ")" : "")).join(", ")}
        </div>
      )}
      {decision && (
        <div className="rounded-[8px] bg-hisa-ground px-[12px] py-2 text-[13px]">
          <span className="font-semibold">Identity decision: {str(decision.identity_match) || "—"}</span>
          <span className="block text-hisa-muted">
            Signatory name {yesNo(decision.signatory_match)} · NIN name {yesNo(decision.nin_match)} · CAC director {yesNo(decision.affiliate_match)} · DOB{" "}
            {yesNo(decision.dob_match)}
            {typeof decision.score === "number" ? ` · score ${decision.score}` : ""}
          </span>
          {Array.isArray(decision.reasons) && decision.reasons.length > 0 && (
            <ul className="m-0 mt-1 list-disc pl-[18px]">
              {(decision.reasons as string[]).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {s.error !== undefined && check.status !== "passed" && <p className="m-0 text-[13px] text-[#B42318]">{str(s.error)}</p>}
    </div>
  );
};

function actorLabel(e: OnboardingEvent, userId: number): string {
  if (e.actor_id === null) return "System";
  if (e.actor_id === userId) return "Partner";
  return `Staff #${e.actor_id}`;
}

export default function AdminOnboardingDetailPage() {
  const authorized = useRequirePermission("users.view");
  const params = useParams<{ userId: string }>();
  const userId = params?.userId ?? "";
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [data, setData] = useState<AdminOnboardingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [queryOpen, setQueryOpen] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    setCanManage(hasPermission(readStoredUser(), "users.manage"));
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await adminOnboardingApi.detail(userId);
      setData(res.data);
    } catch (err) {
      setLoadError(errorMessage(err, "Couldn't load this application."));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (authorized && userId) load();
  }, [authorized, userId, load]);

  const act = async (fn: () => Promise<{ data: AdminOnboardingDetail; message: string }>, success: string): Promise<boolean> => {
    setBusy(true);
    try {
      const res = await fn();
      setData(res.data);
      messageApi.success(success);
      return true;
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        messageApi.warning(`${err.message} (now: ${STATUS_LABELS[err.onboardingStatus as keyof typeof STATUS_LABELS] ?? err.onboardingStatus ?? "changed"})`);
        load();
      } else {
        messageApi.error(errorMessage(err));
      }
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!authorized) return null;

  if (loading) {
    return (
      <main className="px-[16px] py-[20px] sm:px-[24px]">
        <p role="status" className="m-0 text-sm text-hisa-muted">
          Loading application…
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex flex-col gap-4 px-[16px] py-[20px] sm:px-[24px]">
        <Link href={routes.adminOnboarding} className={`${textLink} text-sm`}>
          ← Onboarding queue
        </Link>
        <Card>
          <EmptyState title="Couldn't load this application" description={loadError ?? undefined} action={<button type="button" className={btnSecondary} onClick={load}>Try again</button>} />
        </Card>
      </main>
    );
  }

  const b = data.business;
  const sig = data.signatory;
  const status = data.status;
  const queriedFields = new Set(data.open_query?.fields ?? []);
  const hl = (k: string) => queriedFields.has(k) || (k.startsWith("address_") && queriedFields.has("address"));
  const legacyFlow = data.flow !== "v2";

  const confirmApprove = () =>
    modal.confirm({
      title: `Approve ${b.cac_registered_name || b.name || data.user.email}?`,
      content: "The partner gets live access immediately and is emailed. All documents are marked accepted.",
      okText: "Approve",
      onOk: () => act(() => adminOnboardingApi.approve(data.user.id), "Partner approved"),
    });

  const submitQuery = async (body: { note: string; fields: string[]; documents: string[] }) => {
    setQueryError(null);
    const ok = await act(() => adminOnboardingApi.query(data.user.id, body), "Query sent to the partner");
    if (ok) setQueryOpen(false);
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError("A reason is required. The partner sees it.");
      document.getElementById("reject-reason")?.focus();
      return;
    }
    setRejectError(null);
    const ok = await act(() => adminOnboardingApi.reject(data.user.id, rejectReason.trim()), "Application rejected");
    if (ok) {
      setRejectOpen(false);
      setRejectReason("");
    }
  };

  const reviewDocument = (type: KycDocumentType, s: "accepted" | "flagged", note: string) =>
    act(() => adminOnboardingApi.reviewDocument(data.user.id, type, { status: s, note: note || undefined }), s === "accepted" ? "Document accepted" : "Document flagged");

  const docs = DOCUMENT_TYPES.map((t) => data.documents.find((d) => d.type === t)).filter(
    (d): d is NonNullable<typeof d> => !!d && (d.required || d.status !== "missing")
  );
  const legacyDocs = [
    data.document_urls.legacy_cac_certificate && !data.documents.find((d) => d.type === "cac_certificate" && d.status !== "missing")
      ? { type: "cac-certificate" as const, legacy: true as const, uploaded_at: data.legacy.cac_certificate_uploaded_at }
      : null,
    data.document_urls.legacy_utility_bill && !data.documents.find((d) => d.type === "proof_of_address" && d.status !== "missing")
      ? { type: "utility-bill" as const, legacy: true as const, uploaded_at: data.legacy.utility_bill_uploaded_at }
      : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <main className="flex flex-col gap-5 px-[16px] py-[20px] sm:px-[24px]">
      {contextHolder}
      {modalContextHolder}
      <Link href={routes.adminOnboarding} className={`${textLink} self-start text-sm`}>
        ← Onboarding queue
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="m-0 font-heading text-[22px] font-bold leading-tight text-hisa-ink sm:text-[26px]">
              {b.cac_registered_name || b.name || data.user.email}
            </h1>
            <OnboardingStatusPill status={status} />
            {legacyFlow && <span className="rounded-[4px] bg-[#F2F4F7] px-[6px] py-[1px] text-[12px] font-semibold text-hisa-body">Legacy registration</span>}
          </div>
          <p className="m-0 text-sm text-hisa-muted">
            {data.user.email}
            {data.user.phone ? ` · ${data.user.phone}` : ""} · User #{data.user.id}
            {data.submitted_at && ` · Submitted ${formatLagosDateTime(data.submitted_at)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Decisions">
          {status === "submitted" && (
            <button type="button" className={btnPrimary} disabled={!canManage || busy} onClick={() => act(() => adminOnboardingApi.startReview(data.user.id), "Review started")}>
              Start review
            </button>
          )}
          {status === "in_review" && (
            <>
              <button type="button" className={btnPrimary} disabled={!canManage || busy} onClick={confirmApprove}>
                Approve
              </button>
              <button type="button" className={btnSecondary} disabled={!canManage || busy} onClick={() => setQueryOpen(true)}>
                Query
              </button>
              <button type="button" className={btnDanger} disabled={!canManage || busy} onClick={() => setRejectOpen(true)}>
                Reject
              </button>
            </>
          )}
          {!canManage && (status === "submitted" || status === "in_review") && (
            <span className="self-center text-[13px] text-hisa-muted">You need the users.manage permission to decide.</span>
          )}
        </div>
      </div>

      {status === "submitted" && canManage && (
        <p className="m-0 rounded-[10px] bg-hisa-primary-soft px-[14px] py-[10px] text-sm text-hisa-primary-hover">
          Start the review to approve, query or reject. The partner sees that their application is in review.
        </p>
      )}
      {data.open_query && (
        <div className="rounded-[12px] border-[1px] border-solid border-[#FEDF89] bg-[#FFFAEB] px-[16px] py-[12px] text-sm text-[#7A2E0E]">
          <strong>Open query{isBlankTime(data.open_query.created_at) ? "" : ` (${formatLagosDateTime(data.open_query.created_at)})`}:</strong> {data.open_query.note}
          {(data.open_query.fields.length > 0 || data.open_query.documents.length > 0) && (
            <span className="block">Unlocked: {[...data.open_query.fields, ...data.open_query.documents].map(fieldLabel).join(", ")}</span>
          )}
        </div>
      )}
      {data.rejection && (
        <div className="rounded-[12px] border-[1px] border-solid border-[#FECDCA] bg-[#FEF3F2] px-[16px] py-[12px] text-sm text-[#912018]">
          <strong>Rejected:</strong> {data.rejection.reason}
          {data.rejection.reapply_after && <span className="block">Can reapply from {formatLagosDateTime(data.rejection.reapply_after, "D MMM YYYY")}.</span>}
        </div>
      )}
      {data.missing.length > 0 && data.flow === "v2" && (
        <p className="m-0 text-[13px] text-[#B54708]">
          Still missing for a complete application: {data.missing.map(fieldLabel).join(", ")}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Business">
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Registered name (CAC)" value={b.cac_registered_name} />
              <Row label="Account name" value={b.name} />
              <Row label="Business type" value={labelOf(BUSINESS_TYPES, b.business_type)} highlight={hl("business_type")} />
              <Row label="CAC number" value={b.rc_number && <span className="font-mono">{b.rc_number}</span>} highlight={hl("rc_number")} />
              <Row label="CAC verified" value={b.cac_verified_at ? formatLagosDateTime(b.cac_verified_at) : "No"} />
              <Row label="Trading name" value={b.trading_name} highlight={hl("trading_name")} />
              <Row
                label="Partner category"
                value={labelOf(PARTNER_CATEGORIES, b.partner_category) || (data.legacy.partner_type ? `${data.legacy.partner_type} (legacy)` : "")}
                highlight={hl("partner_category")}
              />
              <Row label="Services" value={b.services_of_interest.map((x) => labelOf(SERVICES, x)).join(", ")} highlight={hl("services_of_interest")} />
              <Row label="Expected volume" value={labelOf(VOLUME_BANDS, b.expected_volume_band)} highlight={hl("expected_volume_band")} />
              <Row label="Integration" value={labelOf(INTEGRATION_METHODS, b.integration_method)} highlight={hl("integration_method")} />
              <Row label="Address" value={[b.address_line, b.address_lga, b.address_state].filter(Boolean).join(", ")} highlight={hl("address_line")} />
              <Row label="CAC registered address" value={b.cac_registered_address} />
              <Row
                label="Website"
                value={
                  b.website && (
                    <a href={b.website} target="_blank" rel="noopener noreferrer" className={textLink}>
                      {b.website}
                    </a>
                  )
                }
                highlight={hl("website")}
              />
            </dl>
          </Card>

          <Card title="Signatory">
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Name" value={sig.name ?? data.legacy.contact_person_name} highlight={hl("signatory_name")} />
              <Row label="Role" value={sig.role ?? data.legacy.contact_person_designation} highlight={hl("signatory_role")} />
              <Row label="Phone" value={sig.phone ?? data.legacy.contact_person_phone} highlight={hl("signatory_phone")} />
              <Row label="Email" value={sig.email ?? data.legacy.contact_person_email} highlight={hl("signatory_email")} />
              <Row label="Date of birth" value={sig.dob} highlight={hl("signatory_dob")} />
              <Row label="Identity match" value={sig.identity_match} />
              <Row label="BVN" value={sig.bvn && <span className="font-mono">{sig.bvn}</span>} highlight={hl("bvn")} />
              <Row label="NIN" value={sig.nin && <span className="font-mono">{sig.nin}</span>} highlight={hl("nin")} />
            </dl>
          </Card>

          <Card title="Account">
            <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Row label="Email" value={data.account.email} />
              <Row label="Phone" value={data.account.phone} />
              <Row label="Email verified" value={data.account.email_verified_at ? formatLagosDateTime(data.account.email_verified_at) : "No"} />
              <Row label="Terms accepted" value={data.account.terms_version ? `${data.account.terms_version} · ${formatLagosDateTime(data.account.terms_accepted_at)}` : ""} />
              <Row label="Signed up" value={formatLagosDateTime(data.user.created_at)} />
              <Row label="Funding account" value={data.steps.funding_account ? "Created" : "Not created"} />
            </dl>
            {data.legacy.registration_query && (
              <p className="m-0 text-[13px] text-hisa-muted">
                Legacy registration query: “{data.legacy.registration_query}”
                {data.legacy.registration_query_at && ` (${formatLagosDateTime(data.legacy.registration_query_at)})`}
              </p>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Verification">
            <div aria-live="polite" className="flex flex-col gap-5">
              <CheckDetail title="CAC lookup" check={data.checks.cac} kind="cac" />
              <CheckDetail title="BVN" check={data.checks.bvn} kind="bvn" />
              <CheckDetail title="NIN" check={data.checks.nin} kind="nin" />
            </div>
          </Card>

          <Card title="Documents">
            {docs.length + legacyDocs.length === 0 ? (
              <p className="m-0 text-sm text-hisa-muted">No documents on file.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {docs.map((d) => (
                  <DocumentReviewItem
                    key={d.type}
                    userId={data.user.id}
                    doc={d}
                    canManage={canManage}
                    busy={busy}
                    onReview={reviewDocument}
                  />
                ))}
                {legacyDocs.map((d) => (
                  <DocumentReviewItem key={d.type} userId={data.user.id} doc={d} canManage={false} />
                ))}
              </ul>
            )}
          </Card>

          <Card title="History">
            {data.events.length === 0 ? (
              <p className="m-0 text-sm text-hisa-muted">No events recorded{legacyFlow ? " (legacy registrations have no history before onboarding v2)" : ""}.</p>
            ) : (
              <ol className="m-0 flex list-none flex-col gap-3 p-0">
                {[...data.events].reverse().map((e) => (
                  <li key={e.id} className="flex flex-col gap-[2px] border-0 border-l-[2px] border-solid border-hisa-border pl-[12px] text-[13px]">
                    <span>
                      <strong>{e.from_status ? `${STATUS_LABELS[e.from_status] ?? e.from_status} → ` : ""}{STATUS_LABELS[e.to_status] ?? e.to_status}</strong>{" "}
                      <span className="text-hisa-muted">
                        by {actorLabel(e, data.user.id)} · {formatLagosDateTime(e.created_at)}
                      </span>
                    </span>
                    {e.note && <span className="text-hisa-body">“{e.note}”</span>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <QueryModal open={queryOpen} busy={busy} error={queryError} onCancel={() => setQueryOpen(false)} onSubmit={submitQuery} />

      <Modal
        open={rejectOpen}
        title="Reject the application"
        okText="Reject"
        okButtonProps={{ danger: true, loading: busy }}
        onOk={submitReject}
        onCancel={() => setRejectOpen(false)}
        destroyOnHidden
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="reject-reason" className="m-0 text-[13px] font-semibold text-hisa-body">
            Reason (emailed and shown to the partner)
          </label>
          <textarea
            id="reject-reason"
            rows={4}
            maxLength={2000}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            aria-invalid={!!rejectError || undefined}
            aria-describedby={rejectError ? "reject-reason-error" : "reject-reason-hint"}
            className={`w-full rounded-[8px] border-[1px] border-solid border-[#D0D5DD] px-[10px] py-2 text-sm ${focusRing}`}
          />
          {rejectError && (
            <span id="reject-reason-error" className="text-[13px] text-[#B42318]">
              {rejectError}
            </span>
          )}
          <span id="reject-reason-hint" className="text-[12px] text-hisa-muted">
            The partner can reapply after 30 days.
          </span>
        </div>
      </Modal>
    </main>
  );
}
