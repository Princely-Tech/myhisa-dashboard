"use client";
import React, { useEffect, useRef, useState } from "react";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { focusRing } from "./styles";

/** Clipboard write with a textarea fallback for non-secure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

interface CopyButtonProps {
  value: string;
  /** What is copied, for the accessible name ("Copy Transaction ID"). */
  label: string;
  /** Visible text; icon-only when omitted. */
  children?: React.ReactNode;
  className?: string;
}

const CopyButton = ({ value, label, children, className = "" }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const onClick = async () => {
    const ok = await copyText(value);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={children ? undefined : copied ? `${label} copied` : `Copy ${label}`}
      className={`inline-flex shrink-0 items-center justify-center gap-[6px] rounded-[8px] border-[1px] border-solid border-[#D0D5DD] bg-white text-hisa-body transition-colors hover:bg-[#F9FAFB] hover:text-hisa-ink ${
        children ? "h-9 px-[12px] text-sm" : "h-8 w-8"
      } ${focusRing} ${className}`}
    >
      {copied ? <CheckOutlined aria-hidden="true" /> : <CopyOutlined aria-hidden="true" />}
      {children && <span>{copied ? "Copied" : children}</span>}
      <span className="sr-only" aria-live="polite">
        {copied ? `${label} copied` : ""}
      </span>
    </button>
  );
};

export default CopyButton;
