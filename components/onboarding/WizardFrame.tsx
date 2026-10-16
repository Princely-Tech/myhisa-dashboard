"use client";
// Wizard page frame (mockup Business.dc.html): vertical stepper on the left
// (lg+), a top progress bar on small screens, and the step content.
import React, { useEffect, useRef } from "react";
import Link from "next/link";
import routes from "@/utils/routes";
import { QUERYABLE_FIELDS, fieldLabel } from "@/utils/onboarding";
import type { OnboardingView } from "@/utils/types";
import { focusRing } from "@/components/ui/styles";
import { CheckIcon, Notice } from "./ui";
import { useOnboarding } from "./OnboardingContext";

export type WizardStep = "business" | "identity" | "review";

interface StepDef {
  key: "account" | WizardStep | "golive";
  label: string;
  href?: string;
}

const STEPS: StepDef[] = [
  { key: "account", label: "Account" },
  { key: "business", label: "Business", href: routes.onboardingBusiness },
  { key: "identity", label: "Identity and documents", href: routes.onboardingIdentity },
  { key: "review", label: "Review", href: routes.onboardingReview },
  { key: "golive", label: "Go live" },
];

function stepDone(view: OnboardingView, key: StepDef["key"]): boolean {
  const s = view.steps;
  switch (key) {
    case "account":
      return true;
    case "business":
      return s.business && s.cac;
    case "identity":
      return s.signatory && s.identity && s.documents;
    case "review":
      return s.submitted;
    default:
      return s.approved;
  }
}

/** Steps containing something the open query unlocked. */
export function queriedSteps(view: OnboardingView): WizardStep[] {
  const out: WizardStep[] = [];
  const fieldSteps = view.editable_fields.map((f) => QUERYABLE_FIELDS.find((q) => q.value === f)?.step);
  if (fieldSteps.includes("business")) out.push("business");
  if (fieldSteps.includes("identity") || view.editable_documents.length > 0) out.push("identity");
  return out;
}

interface WizardFrameProps {
  step: WizardStep;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}

const WizardFrame = ({ step, title, description, children }: WizardFrameProps) => {
  const { view } = useOnboarding();
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus management between steps: move focus to the step heading.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  if (!view) return null;
  const queried = view.status === "queried";
  const linkable = (key: StepDef["key"]): boolean => {
    if (key === "account" || key === "golive") return false;
    if (view.status === "profile_incomplete") return true;
    if (queried) return queriedSteps(view).includes(key as WizardStep);
    return false;
  };
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const queryItems = queried
    ? [...(view.open_query?.fields ?? []), ...(view.open_query?.documents ?? [])].map(fieldLabel)
    : [];

  return (
    <div className="mx-auto box-border flex w-full max-w-[1240px] flex-wrap gap-8 px-[16px] py-[24px] sm:px-[32px] sm:py-[32px]">
      {/* Mobile: compact progress bar */}
      <nav aria-label="Onboarding progress" className="w-full lg:hidden">
        <ol className="m-0 grid list-none grid-cols-5 gap-2 p-0">
          {STEPS.map((s, i) => {
            const done = stepDone(view, s.key);
            const current = i === currentIndex;
            return (
              <li key={s.key} aria-current={current ? "step" : undefined} className="flex flex-col gap-2">
                <span className={`block h-1 rounded-[4px] ${current ? "bg-hisa-primary" : done ? "bg-[#079455]" : "bg-[#D0D5DD]"}`} />
                <span className="sr-only">
                  {s.label}
                  {done ? " (complete)" : current ? " (current)" : ""}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="m-0 mt-2 text-[13px] font-semibold text-hisa-primary" aria-hidden="true">
          Step {currentIndex + 1} of 5 · {STEPS[currentIndex].label}
        </p>
      </nav>

      {/* Desktop: vertical stepper */}
      <nav aria-label="Onboarding steps" className="hidden max-w-[260px] flex-[1_1_220px] lg:block">
        <ol className="m-0 flex list-none flex-col gap-1 p-0">
          {STEPS.map((s, i) => {
            const done = stepDone(view, s.key);
            const current = i === currentIndex;
            const badge = (
              <span
                aria-hidden="true"
                className={`box-border flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[13px] ${
                  current
                    ? "bg-hisa-primary text-white"
                    : done
                    ? "bg-[#DCFAE6] text-[#067647]"
                    : "border-[1.5px] border-solid border-[#D0D5DD] text-[#5B6474]"
                }`}
              >
                {done && !current ? <CheckIcon size={14} /> : i + 1}
              </span>
            );
            const cls = `flex items-center gap-3 rounded-[10px] px-[12px] py-[10px] text-[15px] no-underline ${
              current ? "bg-hisa-primary-soft font-semibold text-hisa-primary-hover" : done ? "text-hisa-body" : "text-[#5B6474]"
            }`;
            const label = (
              <>
                {badge}
                <span>
                  {s.label}
                  <span className="sr-only">{done ? " (complete)" : current ? " (current)" : ""}</span>
                </span>
              </>
            );
            return (
              <li key={s.key} aria-current={current ? "step" : undefined}>
                {s.href && linkable(s.key) && !current ? (
                  <Link href={s.href} className={`${cls} hover:bg-[#F2F4F7] ${focusRing}`}>
                    {label}
                  </Link>
                ) : (
                  <span className={cls}>{label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <header className="flex flex-col gap-[6px]">
          <h1 ref={headingRef} tabIndex={-1} className="m-0 font-heading text-[24px] font-bold tracking-[-0.01em] outline-none sm:text-[28px]">
            {title}
          </h1>
          {description && <p className="m-0 text-[15px] text-hisa-muted">{description}</p>}
        </header>

        {queried && (
          <Notice
            tone="warning"
            title="Fixing your application"
            action={
              <Link href={routes.onboardingStatus} className="text-sm font-semibold text-[#93370D] underline">
                Back to reply
              </Link>
            }
          >
            {view.open_query?.note && <span className="block">“{view.open_query.note}”</span>}
            {queryItems.length > 0 ? (
              <span className="block">
                Only these can be changed: <strong>{queryItems.join(", ")}</strong>. Everything else is kept.
              </span>
            ) : (
              <span className="block">Make the changes asked for, then reply from your application page.</span>
            )}
          </Notice>
        )}

        {children}
      </main>
    </div>
  );
};

export default WizardFrame;
