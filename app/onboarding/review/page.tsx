"use client";
// Stage 4: review everything and submit (POST /me/onboarding/submit).
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { isApiError, onboardingApi } from "@/utils/api/onboardingApi";
import {
  BUSINESS_TYPES,
  DOCUMENT_LABELS,
  INTEGRATION_METHODS,
  PARTNER_CATEGORIES,
  SERVICES,
  VOLUME_BANDS,
  fieldLabel,
  labelOf,
  routeForStep,
  stepForKey,
} from "@/utils/onboarding";
import WizardFrame from "@/components/onboarding/WizardFrame";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { FUNDING_RESULT_KEY, readFundingPreference, writeFundingPreference } from "@/components/onboarding/fundingPreference";
import { CheckIcon, Notice, Panel, btnOutlineLg, btnPrimaryLg } from "@/components/onboarding/ui";
import { textLink } from "@/components/ui/styles";

const STEP_NAMES = { business: "Business", identity: "Identity and documents", review: "Review" } as const;

function masked(v: string | null | undefined): string {
  return v ? v.replace(/\*/g, "•") : "Not provided";
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-[2px]">
    <dt className="font-normal text-[13px] text-hisa-muted">{label}</dt>
    <dd className="m-0 break-words text-[15px] font-semibold text-hisa-ink">{value || <span className="font-normal text-[#98A2B3]">Not provided</span>}</dd>
  </div>
);

function groupByStep(keys: string[], details: Record<string, string[]>) {
  const groups: Record<"business" | "identity" | "review", { key: string; message: string }[]> = { business: [], identity: [], review: [] };
  keys.forEach((k) => {
    groups[stepForKey(k)].push({ key: k, message: details[k]?.[0] ?? `${fieldLabel(k)} is required` });
  });
  return groups;
}

export default function ReviewStep() {
  const router = useRouter();
  const { view, setView, user } = useOnboarding();
  const [declaration, setDeclaration] = useState(false);
  const [funding, setFunding] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<Record<string, string[]> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFunding(readFundingPreference(user?.id));
  }, [user?.id]);

  if (!view) return null;
  const b = view.business;
  const s = view.signatory;
  const queried = view.status === "queried";

  const missing = submitErrors ? Object.keys(submitErrors) : view.missing;
  const details = submitErrors ?? view.missing_details;
  const groups = groupByStep(missing.filter((k) => k !== "declaration"), details);
  const hasMissing = groups.business.length + groups.identity.length > 0;

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!declaration) {
      setFormError("Confirm the declaration to submit.");
      document.getElementById("declaration")?.focus();
      return;
    }
    setSubmitting(true);
    setFormError(null);
    setSubmitErrors(null);
    const createFunding = funding && !view.steps.funding_account;
    writeFundingPreference(user?.id, funding);
    try {
      const res = await onboardingApi.submit({ declaration: true, create_funding_account: createFunding });
      if (res.funding_account) {
        try {
          sessionStorage.setItem(FUNDING_RESULT_KEY, JSON.stringify(res.funding_account));
        } catch {
          // ignore
        }
      }
      await setView(res.data);
      // Sandbox auto-approves on submit.
      router.push(res.data.status === "approved" ? routes.dashboard : routes.onboardingStatus);
    } catch (err) {
      setSubmitting(false);
      if (isApiError(err)) {
        if (err.status === 422 && Object.keys(err.errors).length) {
          if (err.errors.declaration) {
            setFormError(err.errors.declaration[0]);
          } else {
            setSubmitErrors(err.errors);
          }
        } else if (err.status === 409) {
          setFormError(err.message);
        } else {
          setFormError(err.message);
        }
      } else {
        setFormError("We couldn't submit right now. Please try again.");
      }
      setTimeout(() => errorRef.current?.focus(), 0);
    }
  };

  const docs = view.documents.filter((d) => d.required || d.status !== "missing");

  return (
    <WizardFrame
      step="review"
      title="Review and submit"
      description="Check everything is right. Once you submit, our compliance team reviews your application, usually within 24 working hours."
    >
      {queried && (
        <Notice tone="warning" title="Your application has a query">
          Make the changes asked for, then reply from your{" "}
          <Link href={routes.onboardingStatus} className={textLink}>
            application page
          </Link>
          .
        </Notice>
      )}

      <div ref={errorRef} tabIndex={-1} className="flex flex-col gap-3 outline-none" aria-live="polite">
        {formError && <Notice tone="error">{formError}</Notice>}
        {hasMissing && (
          <Notice tone={submitErrors ? "error" : "warning"} title={submitErrors ? "Some things need fixing before you can submit" : "Still to do before you submit"}>
            <div className="flex flex-col gap-2">
              {(["business", "identity"] as const).map((step) =>
                groups[step].length ? (
                  <div key={step}>
                    <span className="font-semibold">{STEP_NAMES[step]}: </span>
                    {groups[step].map((g) => g.message).join("; ")}.{" "}
                    <Link href={routeForStep(step)} className="font-semibold underline">
                      Fix in {STEP_NAMES[step]}
                    </Link>
                  </div>
                ) : null
              )}
            </div>
          </Notice>
        )}
      </div>

      <Panel
        title="Business"
        actions={
          view.status === "profile_incomplete" && (
            <Link href={routes.onboardingBusiness} className={`${textLink} text-sm`} aria-label="Edit business details">
              Edit
            </Link>
          )
        }
      >
        <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row
            label="Registered name"
            value={
              b.cac_registered_name ? (
                <span className="inline-flex items-center gap-2">
                  {b.cac_registered_name}
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFAE6] px-2 py-[1px] text-[12px] text-[#067647]">
                    <CheckIcon size={11} /> CAC verified
                  </span>
                </span>
              ) : (
                b.name || ""
              )
            }
          />
          <Row label="CAC number" value={b.rc_number ? `${labelOf(BUSINESS_TYPES, b.business_type)} · ${b.rc_number}` : ""} />
          <Row label="Trading name" value={b.trading_name ?? ""} />
          <Row label="Partner category" value={labelOf(PARTNER_CATEGORIES, b.partner_category)} />
          <Row label="Services" value={b.services_of_interest.map((x) => labelOf(SERVICES, x)).join(", ")} />
          <Row label="Expected monthly volume" value={labelOf(VOLUME_BANDS, b.expected_volume_band)} />
          <Row label="Integration" value={labelOf(INTEGRATION_METHODS, b.integration_method)} />
          <Row label="Website" value={b.website ?? ""} />
          <Row label="Address" value={[b.address_line, b.address_lga, b.address_state].filter(Boolean).join(", ")} />
        </dl>
      </Panel>

      <Panel
        title="Signatory and identity"
        actions={
          view.status === "profile_incomplete" && (
            <Link href={routes.onboardingIdentity} className={`${textLink} text-sm`} aria-label="Edit signatory and identity">
              Edit
            </Link>
          )
        }
      >
        <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          <Row label="Name" value={s.name ?? ""} />
          <Row label="Role" value={s.role ?? ""} />
          <Row label="Phone" value={s.phone ?? ""} />
          <Row label="Email" value={s.email ?? ""} />
          <Row label="Date of birth" value={s.dob ?? ""} />
          <Row
            label="Identity check"
            value={
              s.identity_match === "match"
                ? "Verified, matches"
                : s.identity_match === "mismatch"
                ? "Checked, needs review"
                : view.steps.identity
                ? "Checked, pending"
                : ""
            }
          />
          <Row label="BVN" value={<span className="font-mono">{masked(s.bvn)}</span>} />
          <Row label="NIN" value={<span className="font-mono">{masked(s.nin)}</span>} />
        </dl>
      </Panel>

      <Panel
        title="Documents"
        actions={
          view.status === "profile_incomplete" && (
            <Link href={routes.onboardingIdentity} className={`${textLink} text-sm`} aria-label="Edit documents">
              Edit
            </Link>
          )
        }
      >
        {docs.length === 0 ? (
          <p className="m-0 text-sm text-hisa-muted">{isSandbox ? "No documents needed in the sandbox." : "No documents uploaded yet."}</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {docs.map((d) => (
              <li key={d.type} className="flex flex-wrap items-center justify-between gap-2 text-[15px]">
                <span>{DOCUMENT_LABELS[d.type].label}</span>
                {d.status === "missing" ? (
                  <span className="text-sm font-semibold text-[#B42318]">Missing</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#067647]">
                    <CheckIcon size={12} /> Uploaded
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {!queried && (
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
          {!view.steps.funding_account && (
            <label className="m-0 flex items-start gap-3 rounded-[14px] border-[1px] border-solid border-[#C7D5FB] bg-[#F2F6FF] px-[20px] py-[16px] text-sm text-hisa-body">
              <input
                type="checkbox"
                checked={funding}
                onChange={(e) => setFunding(e.target.checked)}
                className="mt-[2px] h-[18px] w-[18px] shrink-0 accent-hisa-primary"
              />
              <span>
                <span className="block font-semibold text-hisa-ink">Create my funding account now</span>
                Uses the signatory&apos;s BVN. If it can&apos;t be created now, your application still goes through and you can
                create it later.
              </span>
            </label>
          )}

          <label className="m-0 flex items-start gap-3 text-sm leading-[1.55] text-hisa-body">
            <input
              id="declaration"
              type="checkbox"
              checked={declaration}
              onChange={(e) => {
                setDeclaration(e.target.checked);
                if (e.target.checked) setFormError(null);
              }}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 accent-hisa-primary"
            />
            <span>
              I confirm that the information and documents I have provided are true and complete, that I am authorised to act for
              this business, and that MyHisa may verify them with the CAC, NIBSS and NIMC.
            </span>
          </label>

          <div className="flex flex-wrap justify-between gap-3">
            <Link href={routes.onboardingIdentity} className={btnOutlineLg}>
              Back
            </Link>
            <button type="submit" disabled={submitting} className={btnPrimaryLg}>
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </form>
      )}
    </WizardFrame>
  );
}
