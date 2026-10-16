"use client";
// Stage 3: signatory, BVN/NIN check and documents.
// PUT /me/onboarding/signatory (partial, autosaved), POST
// /me/onboarding/verify-identity, POST/DELETE /me/onboarding/documents/:type.
import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { ApiError, isApiError, onboardingApi } from "@/utils/api/onboardingApi";
import { canEditDocument, canEditField, isEmail, nationalPart, toE164NG } from "@/utils/onboarding";
import type { IdentityVerification, OnboardingView } from "@/utils/types";
import WizardFrame, { queriedSteps } from "@/components/onboarding/WizardFrame";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { useAutosave } from "@/components/onboarding/useAutosave";
import DocumentRow from "@/components/onboarding/DocumentRow";
import { readFundingPreference, writeFundingPreference } from "@/components/onboarding/fundingPreference";
import {
  Field,
  Notice,
  Panel,
  PhoneInput,
  btnOutlineLg,
  btnOutlinePrimary,
  btnPrimaryLg,
  fieldA11y,
  inputClass,
} from "@/components/onboarding/ui";
import { textLink } from "@/components/ui/styles";

type SigValues = { name: string; role: string; phone: string; email: string; dob: string };
type SigKey = keyof SigValues;
const EDIT_KEY: Record<SigKey, string> = {
  name: "signatory_name",
  role: "signatory_role",
  phone: "signatory_phone",
  email: "signatory_email",
  dob: "signatory_dob",
};
const ERROR_KEY_TO_FIELD: Record<string, SigKey> = {
  signatory_name: "name",
  signatory_role: "role",
  signatory_phone: "phone",
  signatory_email: "email",
  signatory_dob: "dob",
  dob: "dob",
};

function fromView(v: OnboardingView): SigValues {
  const s = v.signatory;
  return {
    name: s.name ?? "",
    role: s.role ?? "",
    phone: nationalPart(s.phone),
    email: s.email ?? "",
    dob: s.dob ?? "",
  };
}

/** Latest date allowed (18+) for the date input. */
function maxDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function minDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d.toISOString().slice(0, 10);
}

type Errors = Partial<Record<SigKey | "bvn" | "nin" | "identity" | "form", string>>;

export default function IdentityStep() {
  const router = useRouter();
  const { view, setView, markSaved, user } = useOnboarding();
  const [values, setValues] = useState<SigValues>(() => (view ? fromView(view) : { name: "", role: "", phone: "", email: "", dob: "" }));
  const [bvn, setBvn] = useState("");
  const [nin, setNin] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [idBusy, setIdBusy] = useState(false);
  const [idResult, setIdResult] = useState<IdentityVerification | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [funding, setFunding] = useState(true);
  const [missingWarn, setMissingWarn] = useState<string[] | null>(null);
  const missingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFunding(readFundingPreference(user?.id));
  }, [user?.id]);

  const baseline = useMemo(() => (view ? fromView(view) : values), [view]); // eslint-disable-line react-hooks/exhaustive-deps
  const editable = (k: SigKey) => canEditField(view, EDIT_KEY[k]);
  const queried = view?.status === "queried";

  const autosave = useAutosave<SigValues>({
    values,
    baseline,
    isEditable: editable,
    toPayload: (changed, mode) => {
      const body: Record<string, unknown> = {};
      (Object.keys(changed) as SigKey[]).forEach((k) => {
        const raw = String(changed[k] ?? "").trim();
        if (k === "phone") {
          const e164 = toE164NG(raw);
          if (!e164) return; // invalid: validated on Continue
          if (e164 === (view?.signatory.phone ?? "")) return;
          body.phone = e164;
          return;
        }
        if (mode === "auto" && !raw) return; // the backend rejects blanks; Continue validates
        if (k === "email" && !isEmail(raw)) return;
        body[k] = raw;
      });
      return body;
    },
    request: (payload) => onboardingApi.updateSignatory(payload),
    onSaved: (v, sent) => {
      const saved = fromView(v);
      setValues((cur) => {
        const next = { ...cur };
        (Object.keys(sent) as SigKey[]).forEach((k) => {
          if (cur[k] === sent[k]) next[k] = saved[k];
        });
        return next;
      });
      setErrors((e) => {
        const next = { ...e, form: undefined };
        (Object.keys(sent) as SigKey[]).forEach((k) => delete next[k]);
        return next;
      });
    },
    onError: (err) => applyError(err),
  });

  function applyError(err: ApiError | null) {
    if (!err) {
      setErrors((e) => ({ ...e, form: "Couldn't save. Check your connection; we'll try again when you continue." }));
      return;
    }
    const fe: Errors = {};
    Object.keys(err.errors).forEach((k) => {
      const f = ERROR_KEY_TO_FIELD[k];
      if (f) fe[f] = err.errors[k][0];
      else if (k === "bvn" || k === "nin") fe[k] = err.errors[k][0];
    });
    err.lockedFields.forEach((k) => {
      const f = ERROR_KEY_TO_FIELD[k];
      const msg = "This can't be changed while your application is being reviewed.";
      if (f) fe[f] = msg;
      else if (k === "bvn" || k === "nin") fe[k] = msg;
    });
    if (Object.keys(fe).length === 0) fe.form = err.message;
    setErrors((e) => ({ ...e, ...fe }));
  }

  if (!view) return null;

  const set = (k: SigKey, v: string) => {
    setValues((cur) => ({ ...cur, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const blurSave = () => autosave.schedule();

  const validateSignatory = (): Errors => {
    const fe: Errors = {};
    if (!values.name.trim()) fe.name = "Enter the signatory's full name";
    if (!values.role.trim()) fe.role = "Enter their role, e.g. Director";
    if (!toE164NG(values.phone)) fe.phone = "Enter a valid Nigerian mobile number";
    if (!isEmail(values.email)) fe.email = "Enter a valid email address";
    if (!values.dob) fe.dob = "Enter their date of birth";
    return fe;
  };

  const identityEditable = canEditField(view, "bvn") || canEditField(view, "nin");
  const savedBvn = view.signatory.bvn;
  const savedNin = view.signatory.nin;

  const verifyIdentity = async () => {
    const fe: Errors = {};
    if (!/^\d{11}$/.test(bvn)) fe.bvn = "BVN must be exactly 11 digits";
    if (!/^\d{11}$/.test(nin)) fe.nin = "NIN must be exactly 11 digits";
    if (!values.name.trim()) fe.name = "Enter the signatory's name first: we compare it with the BVN record";
    if (Object.keys(fe).length) {
      setErrors((e) => ({ ...e, ...fe }));
      document.getElementById(fe.name ? "sig-name" : fe.bvn ? "bvn" : "nin")?.focus();
      return;
    }
    setIdBusy(true);
    setIdResult(null);
    setErrors((e) => ({ ...e, identity: undefined, bvn: undefined, nin: undefined }));
    // The check needs the signatory saved first.
    const saved = await autosave.saveNow();
    if (!saved) {
      setIdBusy(false);
      return;
    }
    try {
      const res = await onboardingApi.verifyIdentity({ bvn, nin, dob: values.dob || undefined });
      await setView(res.data);
      markSaved();
      setIdResult(res.verification);
      setBvn("");
      setNin("");
    } catch (err) {
      if (isApiError(err)) {
        if (err.status === 429) {
          setErrors((e) => ({ ...e, identity: `Too many identity checks. Try again in ${Math.ceil((err.retryAfterSeconds ?? 3600) / 60)} minutes.` }));
        } else if (Object.keys(err.errors).length || err.lockedFields.length) {
          applyError(err);
        } else {
          setErrors((e) => ({ ...e, identity: err.message }));
        }
      } else {
        setErrors((e) => ({ ...e, identity: "We couldn't run the check right now. Try again in a moment." }));
      }
    }
    setIdBusy(false);
  };

  const requiredDocs = view.documents.filter((d) => d.required);
  const optionalDocs = view.documents.filter((d) => !d.required);
  const queriedDocs = view.open_query?.documents ?? [];

  const onContinue = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const fe = validateSignatory();
    if (Object.keys(fe).length && !queried) {
      setErrors((e) => ({ ...e, ...fe }));
      const order: SigKey[] = ["name", "role", "phone", "email", "dob"];
      const first = order.find((k) => fe[k]);
      if (first) document.getElementById(`sig-${first}`)?.focus();
      return;
    }
    setContinuing(true);
    const ok = await autosave.saveNow();
    setContinuing(false);
    if (!ok) return;
    writeFundingPreference(user?.id, funding);
    if (queried) {
      router.push(routes.onboardingStatus);
      return;
    }
    // Not blocking: identity check and documents are listed again on Review.
    const latest = view;
    const pending: string[] = [];
    if (!latest.steps.identity) pending.push("Verify the signatory's BVN and NIN");
    requiredDocs.filter((d) => d.status === "missing").forEach((d) => pending.push(`Upload the ${d.type.replace(/_/g, " ")}`));
    if (pending.length && missingWarn === null) {
      setMissingWarn(pending);
      setTimeout(() => missingRef.current?.focus(), 0);
      return;
    }
    router.push(routes.onboardingReview);
  };

  // Identity result (fresh check, else the stored one)
  const bvnStatus = idResult?.bvn.status ?? view.checks.bvn?.status ?? null;
  const ninStatus = idResult?.nin.status ?? view.checks.nin?.status ?? null;
  const bvnName = idResult?.bvn.name || (view.checks.bvn?.summary?.name as string | undefined) || "";
  const match = idResult?.identity_match ?? view.signatory.identity_match ?? null;
  const decision = (idResult ?? (view.checks.bvn?.summary?.decision as Partial<IdentityVerification> | undefined)) || null;
  const mismatchReasons: string[] = [];
  if (decision) {
    if (decision.signatory_match === false) mismatchReasons.push("the name on the BVN doesn't match the signatory name you entered");
    if (decision.nin_match === false) mismatchReasons.push("the names on the BVN and NIN differ");
    if (decision.affiliate_match === false) mismatchReasons.push("the signatory isn't listed as a director on the CAC record");
    if (decision.dob_match === false) mismatchReasons.push("the date of birth differs from the BVN record");
  }

  return (
    <WizardFrame
      step="identity"
      title="Identity and documents"
      description="We check these with official sources, so most applications are approved without follow-up questions."
    >
      {isSandbox && (
        <Notice tone="info" title="Sandbox">
          KYC is simulated and documents are optional.{" "}
          <Link href={routes.sandboxTestValues} className={textLink} target="_blank">
            See matching test values
          </Link>
        </Notice>
      )}
      {errors.form && (
        <Notice tone="error" live>
          {errors.form}
        </Notice>
      )}

      {view.business.cac_verified_at && (
        <section
          aria-labelledby="biz-h"
          className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border-[1px] border-solid border-hisa-border bg-white px-[24px] py-[20px]"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="biz-h" className="m-0 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#5B6474]">
              Business, verified with CAC
            </h2>
            <p className="m-0 font-heading text-[18px] font-bold">{view.business.cac_registered_name}</p>
            <p className="m-0 text-sm text-hisa-muted">
              <span className="font-mono">{view.business.rc_number}</span>
              {view.business.cac_registered_address && ` · ${view.business.cac_registered_address}`}
            </p>
          </div>
          {canEditField(view, "rc_number") && (
            <Link href={routes.onboardingBusiness} className={`${textLink} text-sm`}>
              Edit business details
            </Link>
          )}
        </section>
      )}

      <form noValidate onSubmit={onContinue} className="flex flex-col gap-5">
        <Panel
          title="Director or authorised signatory"
          description="CBN rules require us to confirm who controls the account. We never share this, and only the last 4 digits of the BVN and NIN are shown after saving."
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="sig-name" label="Full name" hint="As it appears on their BVN" error={errors.name} locked={queried && !editable("name")}>
              <input
                {...fieldA11y("sig-name", { error: errors.name, hint: true, required: true })}
                type="text"
                autoComplete="name"
                value={values.name}
                disabled={!editable("name")}
                onChange={(e) => set("name", e.target.value)}
                onBlur={blurSave}
                className={inputClass(!!errors.name)}
              />
            </Field>
            <Field id="sig-role" label="Role" hint="e.g. Managing Director" error={errors.role} locked={queried && !editable("role")}>
              <input
                {...fieldA11y("sig-role", { error: errors.role, hint: true, required: true })}
                type="text"
                autoComplete="organization-title"
                value={values.role}
                disabled={!editable("role")}
                onChange={(e) => set("role", e.target.value)}
                onBlur={blurSave}
                className={inputClass(!!errors.role)}
              />
            </Field>
            <Field id="sig-phone" label="Phone number" error={errors.phone} locked={queried && !editable("phone")}>
              <PhoneInput
                id="sig-phone"
                value={values.phone}
                required
                invalid={!!errors.phone}
                disabled={!editable("phone")}
                describedBy={errors.phone ? "sig-phone-error" : undefined}
                onChange={(v) => set("phone", v)}
                onBlur={blurSave}
              />
            </Field>
            <Field id="sig-email" label="Email" error={errors.email} locked={queried && !editable("email")}>
              <input
                {...fieldA11y("sig-email", { error: errors.email, required: true })}
                type="email"
                autoComplete="email"
                value={values.email}
                disabled={!editable("email")}
                onChange={(e) => set("email", e.target.value)}
                onBlur={blurSave}
                className={inputClass(!!errors.email)}
              />
            </Field>
            <Field id="sig-dob" label="Date of birth" error={errors.dob} locked={queried && !editable("dob")}>
              <input
                {...fieldA11y("sig-dob", { error: errors.dob, required: true })}
                type="date"
                min={minDob()}
                max={maxDob()}
                value={values.dob}
                disabled={!editable("dob")}
                onChange={(e) => {
                  set("dob", e.target.value);
                  autosave.schedule(900);
                }}
                onBlur={blurSave}
                className={inputClass(!!errors.dob)}
              />
            </Field>
          </div>

          <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 border-t-[1px] border-solid border-hisa-border p-0 pt-[18px]">
            <legend className="sr-only">BVN and NIN</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                id="bvn"
                label="BVN"
                hint={savedBvn ? `Saved: ${savedBvn.replace(/\*/g, "•")}. Enter it again to re-check.` : "11 digits. Dial *565*0# to find it."}
                error={errors.bvn}
                locked={queried && !canEditField(view, "bvn")}
              >
                <input
                  {...fieldA11y("bvn", { error: errors.bvn, hint: true })}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  value={bvn}
                  disabled={!identityEditable}
                  onChange={(e) => {
                    setBvn(e.target.value.replace(/\D/g, "").slice(0, 11));
                    if (errors.bvn) setErrors((x) => ({ ...x, bvn: undefined }));
                  }}
                  className={inputClass(!!errors.bvn, "font-mono")}
                />
              </Field>
              <Field
                id="nin"
                label="NIN"
                hint={savedNin ? `Saved: ${savedNin.replace(/\*/g, "•")}. Enter it again to re-check.` : "11 digits, on the NIN slip or NIMC app."}
                error={errors.nin}
                locked={queried && !canEditField(view, "nin")}
              >
                <input
                  {...fieldA11y("nin", { error: errors.nin, hint: true })}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={11}
                  value={nin}
                  disabled={!identityEditable}
                  onChange={(e) => {
                    setNin(e.target.value.replace(/\D/g, "").slice(0, 11));
                    if (errors.nin) setErrors((x) => ({ ...x, nin: undefined }));
                  }}
                  className={inputClass(!!errors.nin, "font-mono")}
                />
              </Field>
            </div>
            {queried && identityEditable && (!canEditField(view, "bvn") || !canEditField(view, "nin")) && (
              <p className="m-0 text-[13px] text-hisa-muted">
                Both numbers are checked together. Re-enter the saved {canEditField(view, "bvn") ? "NIN" : "BVN"} unchanged.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={verifyIdentity} disabled={idBusy || !identityEditable} className={btnOutlinePrimary} aria-describedby="identity-result">
                {idBusy ? "Checking…" : bvnStatus ? "Verify again" : "Verify BVN and NIN"}
              </button>
            </div>
            <details className="text-sm text-hisa-muted">
              <summary className="cursor-pointer font-semibold text-hisa-body">Why we need this</summary>
              <p className="m-0 mt-2 leading-[1.55]">
                As a payments partner we must know who owns and controls your business (CBN KYC rules). We check the BVN and NIN
                with NIBSS and NIMC and compare the name with your signatory and the directors on your CAC record. We store the
                numbers securely and only ever show the last 4 digits. A mismatch doesn&apos;t stop you submitting: our compliance
                team reviews it.
              </p>
            </details>

            <div id="identity-result" aria-live="polite" className="flex flex-col gap-2">
              {errors.identity && <Notice tone="error">{errors.identity}</Notice>}
              {!errors.identity && bvnStatus && (
                <>
                  {match === "match" && bvnStatus === "passed" && (
                    <Notice tone="success">
                      {ninStatus === "passed" ? "BVN and NIN verified." : "BVN verified."}
                      {bvnName && (
                        <>
                          {" "}
                          Name on record: <strong>{bvnName}</strong>.
                        </>
                      )}{" "}
                      {decision?.affiliate_match ? "Matches a director on the CAC record." : "Matches the signatory."}
                    </Notice>
                  )}
                  {match === "mismatch" && (
                    <Notice tone="warning" title="Some details don't match">
                      {mismatchReasons.length > 0
                        ? `We noticed that ${mismatchReasons.join("; ")}.`
                        : "The identity records don't fully match the details you entered."}{" "}
                      {bvnName && (
                        <>
                          Name on the BVN: <strong>{bvnName}</strong>.{" "}
                        </>
                      )}
                      Check for typos. You can still continue; our compliance team will review it.
                    </Notice>
                  )}
                  {bvnStatus === "failed" && (
                    <Notice tone="error" title="BVN not found">
                      {idResult?.bvn.message ?? "BVN could not be found. Check the number."} You can still continue, but your
                      application is likely to be queried.
                    </Notice>
                  )}
                  {(bvnStatus === "pending" || bvnStatus === "error") && (
                    <Notice tone="warning" title="We couldn't check the BVN right now">
                      Your details are saved and our team will verify them during review. You can continue.
                    </Notice>
                  )}
                  {bvnStatus === "passed" && ninStatus && ninStatus !== "passed" && (
                    <Notice tone="warning">
                      {ninStatus === "failed"
                        ? "The NIN could not be found. Check the number and verify again."
                        : "We couldn't check the NIN right now; our team will review it. You can continue."}
                    </Notice>
                  )}
                </>
              )}
            </div>
          </fieldset>
        </Panel>

        <Panel
          title="Documents"
          description={
            isSandbox
              ? "Optional in the sandbox."
              : "PDF, JPG or PNG up to 5 MB each. Files upload as soon as you pick them."
          }
        >
          {requiredDocs.length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-[10px] p-0" aria-label="Required documents">
              {requiredDocs.map((d) => (
                <DocumentRow
                  key={d.type}
                  doc={d}
                  editable={canEditDocument(view, d.type)}
                  highlight={queriedDocs.includes(d.type)}
                  onChanged={async (v) => {
                    await setView(v);
                    markSaved();
                  }}
                />
              ))}
            </ul>
          )}
          {!view.business.partner_category && !isSandbox && (
            <Notice tone="info">
              The documents we need depend on your partner category.{" "}
              <Link href={routes.onboardingBusiness} className={textLink}>
                Choose a category
              </Link>{" "}
              to see them.
            </Notice>
          )}
          {optionalDocs.length > 0 && (
            <details open={requiredDocs.length === 0 || optionalDocs.some((d) => d.status !== "missing" || queriedDocs.includes(d.type))}>
              <summary className="cursor-pointer text-sm font-semibold text-hisa-body">
                {requiredDocs.length ? "Optional documents" : "Documents"} ({optionalDocs.length})
              </summary>
              <ul className="m-0 mt-[12px] flex list-none flex-col gap-[10px] p-0">
                {optionalDocs.map((d) => (
                  <DocumentRow
                    key={d.type}
                    doc={d}
                    editable={canEditDocument(view, d.type)}
                    highlight={queriedDocs.includes(d.type)}
                    onChanged={async (v) => {
                      await setView(v);
                      markSaved();
                    }}
                  />
                ))}
              </ul>
            </details>
          )}
        </Panel>

        {!queried && !view.steps.funding_account && (
          <section
            aria-labelledby="acct-h"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border-[1px] border-solid border-[#C7D5FB] bg-[#F2F6FF] px-[24px] py-[18px]"
          >
            <div className="flex min-w-0 flex-col gap-1">
              <h2 id="acct-h" className="m-0 text-base font-semibold">
                Open your funding account now
              </h2>
              <p className="m-0 text-sm text-hisa-body">
                Uses the BVN above, so it&apos;s ready the moment you&apos;re approved. You can also do this later.
              </p>
            </div>
            <label className="m-0 flex items-center gap-[10px] text-sm font-semibold text-hisa-primary-hover">
              <input
                type="checkbox"
                checked={funding}
                onChange={(e) => {
                  setFunding(e.target.checked);
                  writeFundingPreference(user?.id, e.target.checked);
                }}
                className="h-[18px] w-[18px] accent-hisa-primary"
              />
              Create it for me
            </label>
          </section>
        )}

        {missingWarn && missingWarn.length > 0 && (
          <div ref={missingRef} tabIndex={-1} className="outline-none">
            <Notice tone="warning" live title="A few things are still missing">
              <ul className="m-0 mt-1 list-disc pl-[18px]">
                {missingWarn.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <span className="mt-1 block">You can continue and finish these before you submit.</span>
            </Notice>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3 pt-1">
          {queried ? (
            <button type="button" className={btnOutlineLg} onClick={() => router.push(queriedSteps(view).includes("business") ? routes.onboardingBusiness : routes.onboardingStatus)}>
              Back
            </button>
          ) : (
            <Link href={routes.onboardingBusiness} className={btnOutlineLg}>
              Back
            </Link>
          )}
          <button type="submit" disabled={continuing} className={btnPrimaryLg}>
            {continuing ? "Saving…" : queried ? "Save and return" : missingWarn ? "Continue anyway" : "Save and continue"}
          </button>
        </div>
      </form>
    </WizardFrame>
  );
}
