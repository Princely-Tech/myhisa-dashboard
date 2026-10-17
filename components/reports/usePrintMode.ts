"use client";
import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";

/**
 * True while the page is being printed (Download PDF button or Ctrl/Cmd+P).
 *
 * Charts switch from ResponsiveContainer (which measures the screen layout
 * and would keep the on-screen width on paper) to fixed A4 widths while this
 * is true. beforeprint/afterprint updates are flushed synchronously so the
 * print snapshot already has the print layout.
 */
export function usePrintMode(): { printing: boolean; print: () => void } {
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    const on = () => flushSync(() => setPrinting(true));
    const off = () => setPrinting(false);
    window.addEventListener("beforeprint", on);
    window.addEventListener("afterprint", off);
    // Safari fires the media query change rather than before/afterprint.
    const mql = typeof window.matchMedia === "function" ? window.matchMedia("print") : null;
    const onMql = (e: MediaQueryListEvent) => (e.matches ? on() : off());
    mql?.addEventListener?.("change", onMql);
    return () => {
      window.removeEventListener("beforeprint", on);
      window.removeEventListener("afterprint", off);
      mql?.removeEventListener?.("change", onMql);
    };
  }, []);

  const print = useCallback(() => {
    flushSync(() => setPrinting(true));
    // Two frames: let the fixed-width charts lay out before the snapshot.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        // afterprint (or the print media query change) resets `printing`.
        window.print();
      })
    );
  }, []);

  return { printing, print };
}
