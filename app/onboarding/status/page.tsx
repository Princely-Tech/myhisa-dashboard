"use client";
// After submission: timeline (Submitted -> In review -> Approved), the open
// query (Fix + Reply and resubmit), rejection (Reapply) and a "While you
// wait" aside. Mockup: Review.dc.html.
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import { PRICING_URL, SANDBOX_DASHBOARD_URL, isSandbox } from "@/utils/environment";
import { isApiError, onboardingApi } from "@/utils/api/onboardingApi";
import {
  DOCUMENT_LABELS,
  INTEGRATION_METHODS,
  PARTNER_CATEGORIES,
  QUERYABLE_FIELDS,
  fieldLabel,
  isBlankTime,
  labelOf,
  routeForStep,
  stepForKey,
} from "@/utils/onboarding";
import { formatLagosDateTime, toLagos } from "@/utils/format";
import type { FundingAccountResult, OnboardingView } from "@/utils/types";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { FUNDING_RESULT_KEY } from "@/components/onboarding/fundingPreference";
import { CheckIcon, Notice, btnPrimaryLg, fieldA11y, inputClass } from "@/components/onboarding/ui";
import { focusRing } from "@/components/ui/styles";

function friendlyTime(t: string | null | undefined): string {
  if (isBlankTime(t)) return "";
  const d = toLagos(t);
  if (!d.isValid()) return "";
  const today = toLagos();
  if (d.isSame(today, "day")) return `Today, ${d.format("HH:mm")}`;
  if (d.isSame(today.subtract(1, "day"), "day")) return `Yesterday, ${d.format("HH:mm")}`;
  return formatLagosDateTime(t);
}

type Tone = "done" | "active" | "warning" | "error" | "todo";

const DOT: Record<Tone, string> = {
  done: "bg-[#079455] text-white",
  active: "bg-hisa-primary text-white",
  warning: "bg-[#B54708] text-white",
  error: "bg-[#D92D20] text-white",
  todo: "box-border border-[2px] border-solid border-[#D0D5DD] bg-white",
};

interface TimelineItem {
  label: string;
  detail: string;
  tone: Tone;
}

function timeline(view: OnboardingView): TimelineItem[] {
  const s = view.status;
  const submitted: TimelineItem = {
    label: "Submitted",
    detail: [friendlyTime(view.submitted_at), "business, identity and documents"].filter(Boolean).join(" · "),
    tone: "done",
  };
  let middle: TimelineItem;
  if (s === "submitted") {
    middle = { label: "In review", detail: "In the queue. A member of our compliance team will pick it up shortly.", tone: "todo" };
  } else if (s === "in_review") {
    middle = { label: "In review", detail: "A member of our compliance team is reviewing your application.", tone: "active" };
  } else if (s === "queried") {
    const n = (view.open_query?.fields.length ?? 0) + (view.open_query?.documents.length ?? 0);
    middle = {
      label: "Query sent",
      detail: [friendlyTime(view.open_query?.created_at), n ? `${n} item${n === 1 ? "" : "s"} to fix` : "action needed"].filter(Boolean).join(" · "),
      tone: "warning",
    };
  } else {
    middle = { label: "Reviewed", detail: "", tone: "done" };
  }
  let last: TimelineItem;
  if (s === "approved" || s === "suspended") {
    last = { label: "Approved", detail: friendlyTime(view.approved_at), tone: "done" };
  } else if (s === "rejected") {
    last = { label: "Not approved", detail: "See the reason below.", tone: "error" };
  } else {
    last = { label: "Approved", detail: "Usually within 24 working hours. We'll email you.", tone: "todo" };
  }
  return [submitted, middle, last];
}

export default function StatusPage() {
  const router = useRouter();
  const { view, setView, reload } = useOnboarding();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [replying, setReplying] = useState(false);
  const [replyErrors, setReplyErrors] = useState<Record<string, string[]> | null>(null);
  const [replyDone, setReplyDone] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [funding, setFunding] = useState<FundingAccountResult | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    try {
      const raw = sessionStorage.getItem(FUNDING_RESULT_KEY);
      if (raw) {
        setFunding(JSON.parse(raw) as FundingAccountResult);
        sessionStorage.removeItem(FUNDING_RESULT_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Pick up a decision made while the page is open.
  useEffect(() => {
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [reload]);

  if (!view) return null;
  const s = view.status;
  const legacy = view.flow !== "v2";
  const q = view.open_query;

  const heading =
    s === "queried"
      ? "Action needed on your application"
      : s === "in_review"
      ? "Your application is in review"
      : s === "submitted"
      ? "Application submitted"
      : s === "rejected"
      ? "Your application wasn't approved"
      : s === "approved" || s === "suspended"
      ? "You're approved"
      : "Your application";
  const subheading =
    s === "queried"
      ? "Fix the items below and resubmit. Your place in the queue is kept."
      : s === "in_review"
      ? "We'll email you as soon as there's a decision."
      : s === "submitted"
      ? "Thanks. We review applications in the order they arrive, usually within 24 working hours."
      : s === "rejected"
      ? "You can apply again after the date below."
      : s === "approved" || s === "suspended"
      ? "Your account is live. Fund your wallet and start transacting."
      : "";

  // Query items grouped by wizard step
  const queryKeys = q ? [...q.fields, ...q.documents.map((d) => `documents.${d}`)] : [];
  const fixSteps = Array.from(
    new Set(
      queryKeys.map((k) => (k.startsWith("documents.") ? "identity" : QUERYABLE_FIELDS.find((f) => f.value === k)?.step ?? stepForKey(k)))
    )
  ).filter((x): x is "business" | "identity" => x === "business" || x === "identity");
  // A legacy-style query on a v2 account names nothing (everything editable).
  const fixAll = q && queryKeys.length === 0;

  const reply = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const n = note.trim();
    if (!n) {
      setNoteError("Tell the reviewer what you changed");
      document.getElementById("reply-note")?.focus();
      return;
    }
    if (n.length > 2000) {
      setNoteError("Keep the note under 2,000 characters");
      return;
    }
    setReplying(true);
    setNoteError(null);
    setReplyErrors(null);
    setActionError(null);
    try {
      const res = await onboardingApi.reply(n);
      await setView(res.data);
      setReplyDone(true);
      setNote("");
      headingRef.current?.focus();
    } catch (err) {
      if (isApiError(err) && err.status === 422 && Object.keys(err.errors).length) {
        if (err.errors.note) setNoteError(err.errors.note[0]);
        else setReplyErrors(err.errors);
      } else {
        setActionError(isApiError(err) ? err.message : "We couldn't send your reply. Please try again.");
      }
    }
    setReplying(false);
  };

  const reapply = async () => {
    setReapplying(true);
    setActionError(null);
    try {
      const res = await onboardingApi.reapply();
      await setView(res.data);
      router.push(routes.onboardingBusiness);
    } catch (err) {
      setReapplying(false);
      setActionError(isApiError(err) ? err.message : "We couldn't reopen your application. Please try again.");
    }
  };

  const items = timeline(view);
  const b = view.business;
  const docsUploaded = view.documents.filter((d) => d.status !== "missing").length;
  const earlierQueries = view.query_history.filter((h) => h.reply);

  return (
    <div className="mx-auto box-border flex w-full max-w-[1240px] flex-wrap items-start gap-6 px-[16px] py-[24px] sm:px-[32px] sm:py-[32px]">
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        {funding && (
          <Notice tone={funding.created ? "success" : "info"} live title={funding.created ? "Funding account created" : "Funding account not created yet"}>
            {funding.created
              ? `${funding.bank_name ?? ""} ${funding.account_number ?? ""}${funding.account_name ? ` · ${funding.account_name}` : ""}`.trim()
              : `${funding.message ?? "It couldn't be created right now."} You can create it from the dashboard once you're approved.`}
          </Notice>
        )}
        {replyDone && s === "submitted" && (
          <Notice tone="success" live>
            Reply sent. Your application is back with our compliance team.
          </Notice>
        )}
        {actionError && (
          <Notice tone="error" live>
            {actionError}
          </Notice>
        )}

        {s === "queried" && q && (
          <section
            role="alert"
            aria-labelledby="q-h"
            className="flex flex-col gap-3 rounded-[14px] border-[1px] border-solid border-[#FEDF89] bg-[#FFFAEB] px-[24px] py-[20px]"
          >
            <h2 id="q-h" className="m-0 font-heading text-[18px] font-bold text-[#7A2E0E]">
              {queryKeys.length === 1 ? "One thing to fix before we can approve you" : "A few things to fix before we can approve you"}
            </h2>
            <p className="m-0 text-[15px] leading-[1.55] text-[#7A2E0E]">
              “{q.note}”{friendlyTime(q.created_at) && <span className="text-[#93370D]"> · MyHisa compliance, {friendlyTime(q.created_at)}</span>}
            </p>
            {queryKeys.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Items to fix">
                {queryKeys.map((k) => (
                  <li key={k} className="rounded-full bg-white px-[10px] py-1 text-[13px] font-semibold text-[#93370D]">
                    {fieldLabel(k)}
                  </li>
                ))}
              </ul>
            )}
            {legacy ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={routes.profile}
                  className={`inline-flex h-[42px] items-center rounded-[10px] bg-[#B54708] px-[16px] text-[15px] font-semibold text-white no-underline hover:text-white ${focusRing}`}
                >
                  Update my registration
                </Link>
                <span className="text-[13px] text-[#93370D]">Saving your registration sends it back for review.</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-[10px]">
                {(fixAll ? (["business", "identity"] as const) : fixSteps).map((step) => (
                  <Link
                    key={step}
                    href={routeForStep(step)}
                    className={`inline-flex h-[42px] items-center rounded-[10px] bg-[#B54708] px-[16px] text-[15px] font-semibold text-white no-underline hover:text-white ${focusRing}`}
                  >
                    {step === "business" ? "Fix business details" : queryKeys.every((k) => k.startsWith("documents.")) && !fixAll ? "Fix documents" : "Fix identity and documents"}
                  </Link>
                ))}
                {!fixAll && <span className="self-center text-[13px] text-[#93370D]">Only these items are editable. Everything else is kept.</span>}
              </div>
            )}
          </section>
        )}

        <section
          aria-labelledby="st-h"
          className="flex flex-col gap-6 rounded-[16px] border-[1px] border-solid border-hisa-border bg-white p-[20px] sm:p-[28px]"
        >
          <div className="flex flex-col gap-[6px]">
            <h1 id="st-h" ref={headingRef} tabIndex={-1} className="m-0 font-heading text-[24px] font-bold tracking-[-0.01em] outline-none sm:text-[28px]">
              {heading}
            </h1>
            {subheading && <p className="m-0 text-[15px] text-hisa-muted">{subheading}</p>}
          </div>

          <ol aria-label="Application status" className="m-0 flex list-none flex-col p-0">
            {items.map((it, i) => (
              <li key={it.label + i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full ${DOT[it.tone]}`}>
                    {it.tone === "done" && <CheckIcon size={14} />}
                    {(it.tone === "active" || it.tone === "warning") && <span className="block h-[10px] w-[10px] rounded-full border-[2.5px] border-solid border-white" />}
                    {it.tone === "error" && <span className="text-sm font-bold">!</span>}
                  </span>
                  {i < items.length - 1 && (
                    <span aria-hidden="true" className={`block min-h-[28px] w-[2px] flex-1 ${it.tone === "done" ? "bg-[#079455]" : "bg-[#D0D5DD]"}`} />
                  )}
                </div>
                <div className={`flex flex-col gap-[2px] ${i < items.length - 1 ? "pb-[20px]" : ""}`}>
                  <span className={`text-base font-semibold ${it.tone === "todo" ? "text-hisa-muted" : "text-hisa-ink"}`}>
                    {it.label}
                    <span className="sr-only">
                      {it.tone === "done" ? " (done)" : it.tone === "active" || it.tone === "warning" ? " (current)" : it.tone === "error" ? "" : " (not yet)"}
                    </span>
                  </span>
                  {it.detail && <span className="text-sm text-hisa-muted">{it.detail}</span>}
                </div>
              </li>
            ))}
          </ol>

          {s === "rejected" && view.rejection && (
            <div className="flex flex-col gap-3 rounded-[12px] border-[1px] border-solid border-[#FECDCA] bg-[#FEF3F2] px-[18px] py-[16px] text-[#912018]">
              <p className="m-0 text-[15px]">
                <strong>Reason:</strong> {view.rejection.reason || "No reason was given."}
              </p>
              {view.rejection.reapply_after && (
                <p className="m-0 text-sm">
                  {view.rejection.can_reapply
                    ? "You can reapply now."
                    : `You can reapply from ${toLagos(view.rejection.reapply_after).format("D MMMM YYYY")}.`}
                </p>
              )}
              {view.rejection.can_reapply && (
                <button type="button" onClick={reapply} disabled={reapplying} className={`${btnPrimaryLg} self-start`}>
                  {reapplying ? "Reopening…" : "Reapply"}
                </button>
              )}
            </div>
          )}

          {(s === "approved" || s === "suspended") && (
            <Link href={routes.dashboard} className={`${btnPrimaryLg} self-start`}>
              Go to dashboard
            </Link>
          )}

          {s === "queried" && !legacy && (
            <form noValidate onSubmit={reply} className="flex flex-col gap-3 border-0 border-t-[1px] border-solid border-hisa-border pt-[20px]">
              <h2 className="m-0 font-heading text-[17px] font-bold">Reply and resubmit</h2>
              <p className="m-0 text-sm text-hisa-muted">When you&apos;ve made the changes, tell the reviewer what you did.</p>
              {replyErrors && (
                <Notice tone="error" live title="Your application still has gaps">
                  <ul className="m-0 list-disc pl-[18px]">
                    {Object.keys(replyErrors).map((k) => (
                      <li key={k}>
                        {replyErrors[k][0]}{" "}
                        {stepForKey(k) !== "review" && (
                          <Link href={routeForStep(stepForKey(k))} className="font-semibold underline">
                            Fix
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </Notice>
              )}
              <div className="flex flex-col gap-[6px]">
                <label htmlFor="reply-note" className="m-0 text-sm font-semibold text-hisa-body">
                  Note to the reviewer
                </label>
                <textarea
                  {...fieldA11y("reply-note", { error: noteError })}
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value);
                    if (noteError) setNoteError(null);
                  }}
                  placeholder="e.g. Uploaded a utility bill dated September 2026."
                  className={inputClass(!!noteError, "h-auto py-[10px]")}
                />
                {noteError && (
                  <span id="reply-note-error" className="text-[13px] text-[#B42318]">
                    {noteError}
                  </span>
                )}
              </div>
              <button type="submit" disabled={replying} className={`${btnPrimaryLg} self-start`}>
                {replying ? "Sending…" : "Reply and resubmit"}
              </button>
            </form>
          )}

          <details className="border-0 border-t-[1px] border-solid border-hisa-border pt-[16px]">
            <summary className="cursor-pointer text-[15px] font-semibold text-hisa-body">What you submitted</summary>
            <dl className="m-0 mt-[14px] grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-normal text-hisa-muted">Business</dt>
                <dd className="m-0 mt-[2px] font-semibold">
                  {[b.cac_registered_name || b.name, b.rc_number].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-normal text-hisa-muted">Category</dt>
                <dd className="m-0 mt-[2px] font-semibold">
                  {[labelOf(PARTNER_CATEGORIES, b.partner_category), labelOf(INTEGRATION_METHODS, b.integration_method)].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-normal text-hisa-muted">Signatory</dt>
                <dd className="m-0 mt-[2px] font-semibold">
                  {[view.signatory.name, view.signatory.bvn ? `BVN ${view.signatory.bvn.replace(/\*/g, "•")}` : null].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-normal text-hisa-muted">Documents</dt>
                <dd className="m-0 mt-[2px] font-semibold">
                  {docsUploaded ? `${docsUploaded} uploaded` : "None"}
                  {view.documents
                    .filter((d) => d.status === "flagged")
                    .map((d) => (
                      <span key={d.type} className="block font-normal text-[#93370D]">
                        {DOCUMENT_LABELS[d.type].label}: needs attention{d.reviewer_note ? ` (${d.reviewer_note})` : ""}
                      </span>
                    ))}
                </dd>
              </div>
              <div>
                <dt className="font-normal text-hisa-muted">Funding account</dt>
                <dd className="m-0 mt-[2px] font-semibold">{view.steps.funding_account ? "Created" : "Not created yet"}</dd>
              </div>
            </dl>
          </details>

          {earlierQueries.length > 0 && (
            <details>
              <summary className="cursor-pointer text-[15px] font-semibold text-hisa-body">Earlier queries ({earlierQueries.length})</summary>
              <ul className="m-0 mt-[12px] flex list-none flex-col gap-3 p-0 text-sm">
                {earlierQueries.map((h, i) => (
                  <li key={i} className="flex flex-col gap-1 rounded-[10px] bg-hisa-ground px-[14px] py-[10px]">
                    <span>
                      <strong>MyHisa{friendlyTime(h.created_at) ? `, ${friendlyTime(h.created_at)}` : ""}:</strong> {h.note}
                    </span>
                    <span className="text-hisa-muted">
                      <strong>You{friendlyTime(h.replied_at) ? `, ${friendlyTime(h.replied_at)}` : ""}:</strong> {h.reply}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      </main>

      <aside aria-labelledby="wait-h" className="flex min-w-0 flex-[1_1_320px] flex-col gap-[14px]">
        <h2 id="wait-h" className="m-0 font-heading text-[18px] font-bold">
          {s === "approved" ? "Next steps" : "While you wait"}
        </h2>

        {SANDBOX_DASHBOARD_URL && !isSandbox && (
          <section className="flex flex-col gap-3 rounded-[16px] bg-hisa-navy p-[22px] text-white">
            <span className="self-start rounded-[6px] bg-[#FDB022] px-2 py-[3px] text-[12px] font-semibold tracking-[0.08em] text-hisa-navy">SANDBOX</span>
            <h3 className="m-0 font-heading text-[20px] font-bold">Build your integration now</h3>
            <p className="m-0 text-sm leading-[1.55] text-[#C9D3F2]">
              Test numbers return success, failure, pending or timeout on demand. Nothing is charged. Sandbox accounts are approved as
              soon as you verify your email.
            </p>
            <a
              href={SANDBOX_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-[44px] items-center justify-center rounded-[10px] bg-white text-[15px] font-semibold text-hisa-navy no-underline hover:text-hisa-navy focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-hisa-navy"
            >
              Open the sandbox<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </section>
        )}
        {isSandbox && (
          <Link
            href={routes.sandboxTestValues}
            className={`flex flex-col gap-1 rounded-[14px] border-[1px] border-solid border-hisa-border bg-white px-[18px] py-[16px] no-underline ${focusRing}`}
          >
            <span className="text-[15px] font-semibold text-hisa-ink">Sandbox test values</span>
            <span className="text-sm text-hisa-muted">Numbers and identities for every outcome</span>
          </Link>
        )}

        <Link
          href={routes.documentation}
          className={`flex flex-col gap-1 rounded-[14px] border-[1px] border-solid border-hisa-border bg-white px-[18px] py-[16px] no-underline ${focusRing}`}
        >
          <span className="text-[15px] font-semibold text-hisa-ink">API reference</span>
          <span className="text-sm text-hisa-muted">Endpoints, error codes and code samples</span>
        </Link>
        <a
          href={PRICING_URL}
          className={`flex flex-col gap-1 rounded-[14px] border-[1px] border-solid border-hisa-border bg-white px-[18px] py-[16px] no-underline ${focusRing}`}
        >
          <span className="text-[15px] font-semibold text-hisa-ink">Products and pricing</span>
          <span className="text-sm text-hisa-muted">Data plans, billers and your commission</span>
        </a>
      </aside>
    </div>
  );
}
