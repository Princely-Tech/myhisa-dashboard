"use client";
// Form primitives for the onboarding v2 screens (sign-up, wizard, status),
// styled per the approved mockups. Native inputs keep labels/ids/aria simple;
// Bootstrap is loaded globally, so only arbitrary-value Tailwind utilities are
// used for borders/radii/padding (see components/ui/styles.ts).
import React from "react";
import { focusRing } from "@/components/ui/styles";

export const inputBase =
  "block h-[46px] w-full min-w-0 rounded-[10px] border-[1px] border-solid bg-white px-[14px] font-body text-[15px] text-hisa-ink placeholder:text-[#98A2B3] transition-colors focus:border-hisa-primary focus:ring-2 focus:ring-hisa-primary/30 disabled:cursor-not-allowed disabled:bg-[#F2F4F7] disabled:text-hisa-muted";

export function inputClass(invalid?: boolean, extra = ""): string {
  return `${inputBase} ${invalid ? "border-[#D92D20]" : "border-[#D0D5DD]"} ${extra}`;
}

export const btnPrimaryLg = `inline-flex h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border-0 bg-hisa-primary px-[22px] font-body text-[15px] font-semibold text-white no-underline transition-colors hover:bg-hisa-primary-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const btnOutlineLg = `inline-flex h-[48px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border-[1px] border-solid border-[#D0D5DD] bg-white px-[18px] font-body text-[15px] font-semibold text-hisa-body no-underline transition-colors hover:bg-[#F9FAFB] hover:text-hisa-ink disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const btnOutlinePrimary = `inline-flex h-[40px] items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border-[1px] border-solid border-hisa-primary bg-white px-[14px] font-body text-sm font-semibold text-hisa-primary transition-colors hover:bg-hisa-primary-soft disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`;

export const linkButton = `cursor-pointer border-0 bg-transparent p-0 font-body font-semibold text-hisa-primary no-underline hover:text-hisa-primary-hover hover:underline disabled:cursor-not-allowed disabled:text-[#98A2B3] disabled:no-underline rounded-[2px] ${focusRing}`;

/** a11y props for the control inside a <Field>. */
export function fieldA11y(id: string, opts: { hint?: React.ReactNode; error?: React.ReactNode; required?: boolean }) {
  const ids = [opts.error ? `${id}-error` : null, opts.hint ? `${id}-hint` : null].filter(Boolean).join(" ");
  return {
    id,
    "aria-describedby": ids || undefined,
    "aria-invalid": opts.error ? (true as const) : undefined,
    "aria-required": opts.required ? (true as const) : undefined,
  };
}

interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optional?: boolean;
  /** Shown next to the label when the field is locked by the editing rules. */
  locked?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Field = ({ id, label, hint, error, optional, locked, className = "", children }: FieldProps) => (
  <div className={`flex min-w-0 flex-col gap-[6px] ${className}`}>
    <label htmlFor={id} className="m-0 flex flex-wrap items-center gap-2 text-sm font-semibold text-hisa-body">
      {label}
      {optional && <span className="font-normal text-hisa-muted">(optional)</span>}
      {locked && <LockedTag />}
    </label>
    {children}
    {error && (
      <span id={`${id}-error`} className="flex items-start gap-[6px] text-[13px] text-[#B42318]">
        <AlertIcon />
        <span>{error}</span>
      </span>
    )}
    {hint && (
      <span id={`${id}-hint`} className="text-[13px] text-hisa-muted">
        {hint}
      </span>
    )}
  </div>
);

export const LockedTag = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F7] px-2 py-[1px] text-[11px] font-semibold uppercase tracking-[0.04em] text-hisa-muted">
    <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
    Locked
  </span>
);

export const CheckIcon = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const AlertIcon = ({ size = 14 }: { size?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] shrink-0">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

export const ShieldIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] shrink-0">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export type NoticeTone = "success" | "warning" | "error" | "info";

const NOTICE_TONES: Record<NoticeTone, string> = {
  success: "border-[#ABEFC6] bg-[#ECFDF3] text-[#054F31]",
  warning: "border-[#FEDF89] bg-[#FFFAEB] text-[#7A2E0E]",
  error: "border-[#FECDCA] bg-[#FEF3F2] text-[#912018]",
  info: "border-[#C7D5FB] bg-[#F2F6FF] text-[#0B2FA8]",
};

interface NoticeProps {
  tone: NoticeTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Render as a live region (role=status / alert for errors). */
  live?: boolean;
  icon?: React.ReactNode;
}

export const Notice = ({ tone, title, children, action, className = "", live, icon }: NoticeProps) => (
  <div
    role={live ? (tone === "error" ? "alert" : "status") : undefined}
    className={`flex flex-wrap items-start justify-between gap-3 rounded-[12px] border-[1px] border-solid px-[16px] py-[14px] text-[14px] leading-[1.5] ${NOTICE_TONES[tone]} ${className}`}
  >
    <div className="flex min-w-0 flex-1 items-start gap-[10px]">
      {icon ?? (tone === "success" ? <ShieldIcon /> : <AlertIcon size={18} />)}
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="m-0 font-semibold">{title}</p>}
        {children && <div className="m-0">{children}</div>}
      </div>
    </div>
    {action}
  </div>
);

interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  id?: string;
}

/** White section card (mockup: 14px radius, 24px padding). */
export const Panel = ({ title, description, actions, children, className = "", id }: PanelProps) => {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`flex min-w-0 flex-col gap-[18px] rounded-[14px] border-[1px] border-solid border-hisa-border bg-white p-[20px] sm:p-[24px] ${className}`}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <h2 id={headingId} className="m-0 font-heading text-[19px] font-bold text-hisa-ink">
                {title}
              </h2>
            )}
            {description && <p className="m-0 text-sm text-hisa-muted">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
};

interface ChipGroupProps<T extends string> {
  legend: React.ReactNode;
  name: string;
  options: { value: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  disabled?: boolean;
  error?: React.ReactNode;
  hint?: React.ReactNode;
  locked?: boolean;
}

/** Multi-select chips: a fieldset of checkboxes. */
export function ChipGroup<T extends string>({ legend, name, options, value, onChange, disabled, error, hint, locked }: ChipGroupProps<T>) {
  const errId = `${name}-error`;
  const hintId = `${name}-hint`;
  return (
    <fieldset
      className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0"
      aria-describedby={[error ? errId : "", hint ? hintId : ""].filter(Boolean).join(" ") || undefined}
      disabled={disabled}
    >
      <legend className="mb-[6px] flex flex-wrap items-center gap-2 p-0 text-sm font-semibold text-hisa-body">
        {legend}
        {locked && <LockedTag />}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = value.includes(o.value);
          return (
            <label key={o.value} className={`relative m-0 inline-flex ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                id={`${name}-${o.value}`}
                type="checkbox"
                name={name}
                value={o.value}
                checked={checked}
                disabled={disabled}
                onChange={(e) =>
                  onChange(e.target.checked ? [...value, o.value] : value.filter((v) => v !== o.value))
                }
                className="peer sr-only"
              />
              <span
                className={`inline-flex h-9 items-center gap-[6px] rounded-full border-[1px] border-solid px-[14px] text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-hisa-primary peer-focus-visible:ring-offset-2 ${
                  checked
                    ? "border-hisa-primary bg-hisa-primary-soft font-semibold text-hisa-primary-hover"
                    : "border-[#D0D5DD] bg-white text-hisa-body hover:bg-[#F9FAFB]"
                } ${disabled ? "opacity-60" : ""}`}
              >
                {checked && <CheckIcon size={12} />}
                {o.label}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <span id={errId} className="flex items-start gap-[6px] text-[13px] text-[#B42318]">
          <AlertIcon />
          <span>{error}</span>
        </span>
      )}
      {hint && (
        <span id={hintId} className="text-[13px] text-hisa-muted">
          {hint}
        </span>
      )}
    </fieldset>
  );
}

interface RadioCardsProps<T extends string> {
  legend: React.ReactNode;
  name: string;
  options: { value: T; label: string; hint?: string }[];
  value: T | null | undefined;
  onChange: (v: T) => void;
  disabled?: boolean;
  error?: React.ReactNode;
  locked?: boolean;
  columns?: string;
}

/** Single choice as cards: a fieldset of radios. */
export function RadioCards<T extends string>({ legend, name, options, value, onChange, disabled, error, locked, columns = "sm:grid-cols-3" }: RadioCardsProps<T>) {
  const errId = `${name}-error`;
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0" aria-describedby={error ? errId : undefined} disabled={disabled}>
      <legend className="mb-[6px] flex flex-wrap items-center gap-2 p-0 text-sm font-semibold text-hisa-body">
        {legend}
        {locked && <LockedTag />}
      </legend>
      <div className={`grid grid-cols-1 gap-2 ${columns}`}>
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label key={o.value} className={`relative m-0 flex ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
              <input
                id={`${name}-${o.value}`}
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                disabled={disabled}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span
                className={`flex w-full flex-col gap-[2px] rounded-[10px] border-[1px] border-solid px-[14px] py-[10px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-hisa-primary peer-focus-visible:ring-offset-2 ${
                  checked ? "border-hisa-primary bg-hisa-primary-soft" : "border-[#D0D5DD] bg-white hover:bg-[#F9FAFB]"
                } ${disabled ? "opacity-60" : ""}`}
              >
                <span className={`text-sm font-semibold ${checked ? "text-hisa-primary-hover" : "text-hisa-ink"}`}>{o.label}</span>
                {o.hint && <span className="text-[13px] text-hisa-muted">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <span id={errId} className="flex items-start gap-[6px] text-[13px] text-[#B42318]">
          <AlertIcon />
          <span>{error}</span>
        </span>
      )}
    </fieldset>
  );
}

/** "+234" prefix + national number input. */
export const PhoneInput = ({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  disabled,
  describedBy,
  required,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  required?: boolean;
}) => (
  <div className="flex gap-2">
    <span
      aria-hidden="true"
      className="flex h-[46px] shrink-0 items-center rounded-[10px] border-[1px] border-solid border-[#D0D5DD] bg-[#F9FAFB] px-[12px] text-[15px] text-hisa-body"
    >
      +234
    </span>
    <input
      id={id}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="803 123 4567"
      value={value}
      disabled={disabled}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required={required || undefined}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={inputClass(invalid, "flex-1")}
    />
  </div>
);

export const Spinner = ({ label = "Loading" }: { label?: string }) => (
  <span role="status" className="inline-flex items-center gap-2 text-sm text-hisa-muted">
    <span
      aria-hidden="true"
      className="inline-block h-4 w-4 animate-spin rounded-full border-[2px] border-solid border-[#D0D5DD] border-t-hisa-primary"
    />
    <span>{label}</span>
  </span>
);
