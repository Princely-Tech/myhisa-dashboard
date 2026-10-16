"use client";
// Stage 2: business details + CAC verification.
// PUT /me/onboarding/business (partial, autosaved) and POST /me/onboarding/verify-cac.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { ApiError, isApiError, onboardingApi } from "@/utils/api/onboardingApi";
import {
  BUSINESS_TYPES,
  INTEGRATION_METHODS,
  NIGERIAN_STATES,
  PARTNER_CATEGORIES,
  SERVICES,
  VOLUME_BANDS,
  canEditField,
} from "@/utils/onboarding";
import type { CacVerification, OnboardingView, ServiceOfInterest } from "@/utils/types";
import WizardFrame, { queriedSteps } from "@/components/onboarding/WizardFrame";
import { useOnboarding } from "@/components/onboarding/OnboardingContext";
import { useAutosave } from "@/components/onboarding/useAutosave";
import {
  ChipGroup,
  Field,
  Notice,
  Panel,
  RadioCards,
  btnOutlineLg,
  btnOutlinePrimary,
  btnPrimaryLg,
  fieldA11y,
  inputClass,
} from "@/components/onboarding/ui";

type BizValues = {
  business_type: string;
  rc_number: string;
  trading_name: string;
  partner_category: string;
  services_of_interest: string[];
  expected_volume_band: string;
  integration_method: string;
  address_line: string;
  address_state: string;
  address_lga: string;
  website: string;
};

type BizKey = keyof BizValues;

function fromView(v: OnboardingView): BizValues {
  const b = v.business;
  return {
    business_type: b.business_type ?? "",
    rc_number: b.rc_number ?? "",
    trading_name: b.trading_name ?? "",
    partner_category: b.partner_category ?? "",
    services_of_interest: b.services_of_interest ?? [],
    expected_volume_band: b.expected_volume_band ?? "",
    integration_method: b.integration_method ?? "",
    address_line: b.address_line ?? "",
    address_state: b.address_state ?? "",
    address_lga: b.address_lga ?? "",
    website: b.website ?? "",
  };
}

const REQUIRED: { key: BizKey; message: string }[] = [
  { key: "business_type", message: "Choose your business type" },
  { key: "rc_number", message: "Enter your CAC registration number" },
  { key: "partner_category", message: "Choose a partner category" },
  { key: "services_of_interest", message: "Pick at least one service" },
  { key: "expected_volume_band", message: "Choose your expected monthly volume" },
  { key: "integration_method", message: "Choose how you'll integrate" },
  { key: "address_line", message: "Enter your street address" },
  { key: "address_state", message: "Choose a state" },
];

const FOCUS_IDS: Record<BizKey, string> = {
  business_type: "business_type-RC",
  rc_number: "rc_number",
  trading_name: "trading_name",
  partner_category: "partner_category",
  services_of_interest: "services_of_interest-airtime",
  expected_volume_band: "expected_volume_band",
  integration_method: "integration_method-api",
  address_line: "address_line",
  address_state: "address_state",
  address_lga: "address_lga",
  website: "website",
};

function isBlank(v: unknown): boolean {
  return Array.isArray(v) ? v.length === 0 : !String(v ?? "").trim();
}

export default function BusinessStep() {
  const router = useRouter();
  const { view, setView, markSaved } = useOnboarding();
  const [values, setValues] = useState<BizValues>(() => (view ? fromView(view) : ({} as BizValues)));
  const [errors, setErrors] = useState<Partial<Record<BizKey | "form", string>>>({});
  const [cacBusy, setCacBusy] = useState(false);
  const [cacResult, setCacResult] = useState<CacVerification | null>(null);
  const [cacError, setCacError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const baseline = useMemo(() => (view ? fromView(view) : values), [view]); // eslint-disable-line react-hooks/exhaustive-deps
  const editable = (k: BizKey) => canEditField(view, k);
  const queried = view?.status === "queried";

  const autosave = useAutosave<BizValues>({
    values,
    baseline,
    isEditable: editable,
    toPayload: (changed, mode) => {
      const body: Record<string, unknown> = {};
      (Object.keys(changed) as BizKey[]).forEach((k) => {
        const v = changed[k];
        // Autosave skips values the backend would reject as empty; Continue validates them.
        if (mode === "auto" && ["rc_number", "address_line", "address_state", "services_of_interest"].includes(k) && isBlank(v)) return;
        body[k] = typeof v === "string" ? v.trim() : v;
      });
      return body;
    },
    request: (payload) => onboardingApi.updateBusiness(payload),
    onSaved: (v, sent) => {
      // Adopt backend normalisation (RC prefix, https://) for fields the user hasn't touched since.
      const saved = fromView(v);
      setValues((cur) => {
        const next = { ...cur };
        (Object.keys(sent) as BizKey[]).forEach((k) => {
          if (JSON.stringify(cur[k]) === JSON.stringify(sent[k])) (next as Record<string, unknown>)[k] = saved[k];
        });
        return next;
      });
      setErrors((e) => {
        const next = { ...e, form: undefined };
        (Object.keys(sent) as BizKey[]).forEach((k) => delete next[k]);
        return next;
      });
    },
    onError: (err, mode) => applyError(err, mode),
  });

  function applyError(err: ApiError | null, mode: "auto" | "manual") {
    if (!err) {
      setErrors((e) => ({ ...e, form: "Couldn't save. Check your connection; we'll try again when you continue." }));
      return;
    }
    const fe: Partial<Record<BizKey | "form", string>> = {};
    Object.keys(err.errors).forEach((k) => {
      fe[k as BizKey] = err.errors[k][0];
    });
    err.lockedFields.forEach((k) => {
      fe[k as BizKey] = "This can't be changed while your application is being reviewed.";
    });
    if (Object.keys(fe).length === 0) fe.form = err.message;
    setErrors((e) => ({ ...e, ...fe }));
    if (mode === "manual") focusFirst(fe);
  }

  function focusFirst(fe: Partial<Record<string, string>>) {
    const order = REQUIRED.map((r) => r.key).concat(["trading_name", "address_lga", "website"]);
    const first = order.find((k) => fe[k]);
    if (first) document.getElementById(FOCUS_IDS[first])?.focus();
  }

  // Re-seed the form if the application is reloaded from elsewhere (e.g. reapply).
  const seededFor = useRef(view?.status);
  useEffect(() => {
    if (view && seededFor.current !== view.status) {
      seededFor.current = view.status;
      setValues(fromView(view));
    }
  }, [view]);

  if (!view) return null;

  const set = <K extends BizKey>(k: K, v: BizValues[K], immediate = false) => {
    setValues((cur) => ({ ...cur, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    if (immediate) autosave.schedule(400);
  };
  const blurSave = () => autosave.schedule();

  // CAC card state
  const b = view.business;
  const normRc = (r: string | null | undefined) => (r ?? "").trim().toUpperCase().replace(/^(RC|BN|IT)\s*/, "");
  const cacInputsChanged = normRc(values.rc_number) !== normRc(b.rc_number);
  const typeChanged = values.business_type !== (b.business_type ?? "");
  const check = view.checks.cac;
  const checkForCurrent =
    check && typeof check.summary?.rc_number === "string" && check.summary.rc_number === b.rc_number ? check : null;
  const cacState: "none" | "stale" | "passed" | "pending" | "failed" =
    cacInputsChanged || typeChanged
      ? "stale"
      : b.cac_verified_at
      ? "passed"
      : checkForCurrent && (checkForCurrent.status === "pending" || checkForCurrent.status === "error")
      ? "pending"
      : checkForCurrent && checkForCurrent.status === "failed"
      ? "failed"
      : "none";

  const verifyCac = async () => {
    setCacError(null);
    setCacResult(null);
    const e: typeof errors = {};
    if (!values.business_type) e.business_type = "Choose your business type first";
    if (!values.rc_number.trim()) e.rc_number = "Enter your CAC registration number";
    if (Object.keys(e).length) {
      setErrors((x) => ({ ...x, ...e }));
      focusFirst(e);
      return;
    }
    setCacBusy(true);
    try {
      const res = await onboardingApi.verifyCac({ rc_number: values.rc_number.trim(), business_type: values.business_type });
      await setView(res.data);
      markSaved();
      setCacResult(res.verification);
      setValues((cur) => ({ ...cur, rc_number: res.data.business.rc_number ?? cur.rc_number, business_type: res.data.business.business_type ?? cur.business_type }));
      setErrors((x) => ({ ...x, rc_number: undefined, business_type: undefined }));
    } catch (err) {
      if (isApiError(err)) {
        const data = err.body.data as OnboardingView | undefined;
        const verification = err.body.verification as CacVerification | undefined;
        if (data) await setView(data);
        if (verification) {
          setCacResult(verification);
          setValues((cur) => ({ ...cur, rc_number: verification.rc_number || cur.rc_number }));
        } else if (err.status === 429) {
          setCacError(`Too many CAC lookups. Try again in ${Math.ceil((err.retryAfterSeconds ?? 3600) / 60)} minutes.`);
        } else if (err.status === 422) {
          setErrors((x) => ({ ...x, rc_number: err.field("rc_number"), business_type: err.field("business_type") }));
        } else if (err.lockedFields.length) {
          setCacError("Your CAC details can't be changed while your application is being reviewed.");
        } else {
          setCacError(err.message);
        }
      } else {
        setCacError("We couldn't reach CAC right now; you can continue and we'll check again.");
      }
    }
    setCacBusy(false);
  };

  const onContinue = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const fe: Partial<Record<BizKey, string>> = {};
    REQUIRED.forEach(({ key, message }) => {
      if (isBlank(values[key])) fe[key] = message;
    });
    if (Object.keys(fe).length) {
      setErrors((e) => ({ ...e, ...fe }));
      focusFirst(fe);
      return;
    }
    setContinuing(true);
    const ok = await autosave.saveNow();
    setContinuing(false);
    if (!ok) return;
    if (queried) {
      router.push(queriedSteps(view).includes("identity") ? routes.onboardingIdentity : routes.onboardingStatus);
    } else {
      router.push(routes.onboardingIdentity);
    }
  };

  const typeHint = BUSINESS_TYPES.find((t) => t.value === values.business_type)?.hint ?? "Your registration number from the CAC certificate";
  const cacMessage = cacResult?.message ?? (typeof checkForCurrent?.summary?.message === "string" ? checkForCurrent.summary.message : undefined);

  return (
    <WizardFrame
      step="business"
      title="Your business"
      description="We verify your registration with the Corporate Affairs Commission, so most applications need no follow-up."
    >
      {isSandbox && (
        <Notice tone="info" title="Sandbox">
          CAC lookups are simulated: any number with at least 4 digits is found, and numbers ending in 0000 are not.
        </Notice>
      )}
      {errors.form && (
        <Notice tone="error" live>
          {errors.form}
        </Notice>
      )}

      <form ref={formRef} noValidate onSubmit={onContinue} className="flex flex-col gap-5">
        <Panel title="Registration" description="Must match your CAC certificate.">
          <RadioCards
              legend="Business type"
              name="business_type"
              options={BUSINESS_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              value={values.business_type || null}
              onChange={(v) => set("business_type", v, true)}
              disabled={!editable("business_type")}
              locked={queried && !editable("business_type")}
              error={errors.business_type}
            />

          <div className="flex flex-wrap items-end gap-3">
            <Field
              id="rc_number"
              label="CAC registration number"
              hint={typeHint}
              error={errors.rc_number}
              locked={queried && !editable("rc_number")}
              className="flex-[1_1_240px]"
            >
              <input
                {...fieldA11y("rc_number", { hint: typeHint, error: errors.rc_number, required: true })}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={values.rc_number}
                disabled={!editable("rc_number")}
                onChange={(e) => set("rc_number", e.target.value.toUpperCase())}
                onBlur={blurSave}
                className={inputClass(!!errors.rc_number, "font-mono")}
              />
            </Field>
            <button
              type="button"
              onClick={verifyCac}
              disabled={cacBusy || !editable("rc_number")}
              className={`${btnOutlinePrimary} mb-[22px] h-[46px]`}
              aria-describedby="cac-result"
            >
              {cacBusy ? "Checking CAC…" : cacState === "passed" ? "Verify again" : "Verify"}
            </button>
          </div>

          <div id="cac-result" aria-live="polite" className="flex flex-col gap-2">
            {cacError && <Notice tone="warning">{cacError}</Notice>}
            {!cacError && cacState === "passed" && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[12px] border-[1px] border-solid border-[#ABEFC6] bg-[#ECFDF3] px-[18px] py-[16px]">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#067647]">Verified with CAC</span>
                  <span className="font-heading text-[18px] font-bold text-hisa-ink">{b.cac_registered_name}</span>
                  <span className="text-sm text-hisa-muted">
                    <span className="font-mono">{b.rc_number}</span>
                    {(cacResult?.company_status || (checkForCurrent?.summary?.status as string | undefined)) &&
                      ` · ${cacResult?.company_status || (checkForCurrent?.summary?.status as string)}`}
                    {b.cac_registered_address && ` · ${b.cac_registered_address}`}
                  </span>
                </div>
              </div>
            )}
            {!cacError && cacState === "pending" && (
              <Notice tone="warning" title="We couldn't reach CAC right now">
                You can continue and we&apos;ll check again. Your number is saved and our team will confirm it during review.
              </Notice>
            )}
            {!cacError && cacState === "failed" && (
              <Notice tone="error" title="We couldn't verify this number">
                {cacMessage || "No CAC record was found for this number and business type."} Check the number and business type, then
                verify again.
              </Notice>
            )}
            {!cacError && cacState === "stale" && editable("rc_number") && (
              <p className="m-0 text-[13px] text-hisa-muted">Press Verify to check this number with CAC.</p>
            )}
          </div>

          <Field
            id="trading_name"
            label="Trading name"
            optional
            hint="The name your customers know you by, if different."
            error={errors.trading_name}
            locked={queried && !editable("trading_name")}
          >
            <input
              {...fieldA11y("trading_name", { hint: true, error: errors.trading_name })}
              type="text"
              autoComplete="organization"
              value={values.trading_name}
              disabled={!editable("trading_name")}
              onChange={(e) => set("trading_name", e.target.value)}
              onBlur={blurSave}
              className={inputClass(!!errors.trading_name)}
            />
          </Field>
        </Panel>

        <Panel title="What you'll use MyHisa for" description="This helps us set the right limits and pricing.">
          <Field id="partner_category" label="Partner category" error={errors.partner_category} locked={queried && !editable("partner_category")}>
            <select
              {...fieldA11y("partner_category", { error: errors.partner_category, required: true })}
              value={values.partner_category}
              disabled={!editable("partner_category")}
              onChange={(e) => set("partner_category", e.target.value, true)}
              className={inputClass(!!errors.partner_category)}
            >
              <option value="">Select a category</option>
              {PARTNER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <ChipGroup<ServiceOfInterest>
              legend="Services of interest"
              name="services_of_interest"
              options={SERVICES}
              value={values.services_of_interest as ServiceOfInterest[]}
              onChange={(next) => set("services_of_interest", next, true)}
              disabled={!editable("services_of_interest")}
              locked={queried && !editable("services_of_interest")}
              error={errors.services_of_interest}
              hint="Pick all that apply. You can add more later."
            />

          <Field
            id="expected_volume_band"
            label="Expected monthly volume"
            error={errors.expected_volume_band}
            locked={queried && !editable("expected_volume_band")}
          >
            <select
              {...fieldA11y("expected_volume_band", { error: errors.expected_volume_band, required: true })}
              value={values.expected_volume_band}
              disabled={!editable("expected_volume_band")}
              onChange={(e) => set("expected_volume_band", e.target.value, true)}
              className={inputClass(!!errors.expected_volume_band)}
            >
              <option value="">Select a range</option>
              {VOLUME_BANDS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
          </Field>

          <RadioCards
            legend="How will you integrate?"
            name="integration_method"
            options={INTEGRATION_METHODS}
            value={values.integration_method || null}
            onChange={(v) => set("integration_method", v, true)}
            disabled={!editable("integration_method")}
            locked={queried && !editable("integration_method")}
            error={errors.integration_method}
          />
        </Panel>

        <Panel title="Business address" description="Where your business operates. We may ask for proof of address.">
          <Field id="address_line" label="Street address" error={errors.address_line} locked={queried && !editable("address_line")}>
            <input
              {...fieldA11y("address_line", { error: errors.address_line, required: true })}
              type="text"
              autoComplete="street-address"
              value={values.address_line}
              disabled={!editable("address_line")}
              onChange={(e) => set("address_line", e.target.value)}
              onBlur={blurSave}
              className={inputClass(!!errors.address_line)}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="address_state" label="State" error={errors.address_state} locked={queried && !editable("address_state")}>
              <select
                {...fieldA11y("address_state", { error: errors.address_state, required: true })}
                value={values.address_state}
                disabled={!editable("address_state")}
                onChange={(e) => set("address_state", e.target.value, true)}
                className={inputClass(!!errors.address_state)}
              >
                <option value="">Select a state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                {values.address_state && !NIGERIAN_STATES.includes(values.address_state) && (
                  <option value={values.address_state}>{values.address_state}</option>
                )}
              </select>
            </Field>
            <Field id="address_lga" label="LGA" optional error={errors.address_lga} locked={queried && !editable("address_lga")}>
              <input
                {...fieldA11y("address_lga", { error: errors.address_lga })}
                type="text"
                autoComplete="address-level2"
                value={values.address_lga}
                disabled={!editable("address_lga")}
                onChange={(e) => set("address_lga", e.target.value)}
                onBlur={blurSave}
                className={inputClass(!!errors.address_lga)}
              />
            </Field>
          </div>
          <Field id="website" label="Website" optional hint="e.g. acme.ng" error={errors.website} locked={queried && !editable("website")}>
            <input
              {...fieldA11y("website", { hint: true, error: errors.website })}
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              value={values.website}
              disabled={!editable("website")}
              onChange={(e) => set("website", e.target.value)}
              onBlur={blurSave}
              className={inputClass(!!errors.website)}
            />
          </Field>
        </Panel>

        <div className="flex flex-wrap justify-between gap-3 pt-1">
          {queried ? (
            <button type="button" className={btnOutlineLg} onClick={() => router.push(routes.onboardingStatus)}>
              Back to application
            </button>
          ) : (
            <span />
          )}
          <button type="submit" disabled={continuing} className={btnPrimaryLg}>
            {continuing ? "Saving…" : queried ? "Save changes" : "Save and continue"}
          </button>
        </div>
      </form>
    </WizardFrame>
  );
}
