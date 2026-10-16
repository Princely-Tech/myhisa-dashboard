"use client";
import React, { useEffect, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  /** Fired once all digits are entered (typing or paste). */
  onComplete?: (v: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  /** Accessible name for the group. */
  label: string;
}

/** Six single-digit boxes with auto-advance, backspace-to-previous and paste. */
const OtpInput = ({ value, onChange, onComplete, length = 6, disabled, invalid, describedBy, autoFocus, label }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus && !disabled) refs.current[0]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const setAt = (index: number, chars: string) => {
    const next = digits.slice();
    let i = index;
    for (const c of chars) {
      if (i >= length) break;
      next[i] = c;
      i++;
    }
    const joined = next.join("").slice(0, length);
    onChange(joined);
    const focusIndex = Math.min(i, length - 1);
    refs.current[focusIndex]?.focus();
    if (joined.length === length && !next.includes("")) onComplete?.(joined);
  };

  return (
    <div role="group" aria-label={label} aria-describedby={describedBy} className="flex gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => {
            const only = e.target.value.replace(/\D/g, "");
            if (!only) {
              const next = digits.slice();
              next[i] = "";
              onChange(next.join(""));
              return;
            }
            setAt(i, only);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i] && i > 0) {
              e.preventDefault();
              const next = digits.slice();
              next[i - 1] = "";
              onChange(next.join(""));
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft" && i > 0) {
              e.preventDefault();
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < length - 1) {
              e.preventDefault();
              refs.current[i + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
            if (!pasted) return;
            e.preventDefault();
            setAt(i, pasted);
          }}
          onFocus={(e) => e.target.select()}
          className={`h-[56px] w-full min-w-0 max-w-[56px] rounded-[10px] border-[1px] border-solid bg-white text-center font-mono text-[22px] text-hisa-ink focus:border-hisa-primary focus:ring-2 focus:ring-hisa-primary/30 disabled:bg-[#F2F4F7] ${
            invalid ? "border-[#D92D20]" : "border-[#D0D5DD]"
          }`}
        />
      ))}
    </div>
  );
};

export default OtpInput;
