"use client";
// Debounced partial saves for the wizard steps. The page owns the form
// values; this hook diffs them against the last saved baseline, sends only
// the changed editable fields (the backend endpoints are partial updates),
// serialises requests and reports the "Saved x ago" state to the layout.
import { useCallback, useEffect, useRef } from "react";
import { ApiError, isApiError } from "@/utils/api/onboardingApi";
import type { OnboardingView } from "@/utils/types";
import { useOnboarding } from "./OnboardingContext";

type Values = Record<string, unknown>;

interface AutosaveOptions<V extends Values> {
  values: V;
  baseline: V;
  isEditable: (key: keyof V & string) => boolean;
  /** Build the request body from the changed fields; return null to skip. */
  toPayload: (changed: Partial<V>, mode: "auto" | "manual") => Record<string, unknown> | null;
  request: (payload: Record<string, unknown>) => Promise<{ data: OnboardingView }>;
  /** Called with the saved view and the values that were sent. */
  onSaved?: (view: OnboardingView, sent: Partial<V>) => void;
  onError?: (err: ApiError | null, mode: "auto" | "manual") => void;
  delay?: number;
}

function same(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i]);
  }
  return (a ?? "") === (b ?? "");
}

export function useAutosave<V extends Values>(opts: AutosaveOptions<V>) {
  const { setView, setSaving, markSaved, registerFlush } = useOnboarding();
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<boolean>>(Promise.resolve(true));

  const changedFields = useCallback((): Partial<V> => {
    const { values, baseline, isEditable } = optsRef.current;
    const out: Partial<V> = {};
    (Object.keys(values) as (keyof V & string)[]).forEach((k) => {
      if (!isEditable(k)) return;
      if (!same(values[k], baseline[k])) out[k] = values[k];
    });
    return out;
  }, []);

  const runSave = useCallback(
    (mode: "auto" | "manual"): Promise<boolean> => {
      const next = chain.current.then(async () => {
        const o = optsRef.current;
        const changed = changedFields();
        if (Object.keys(changed).length === 0) return true;
        const payload = o.toPayload(changed, mode);
        // Nothing valid to send (invalid values are caught by the step's own validation).
        if (!payload || Object.keys(payload).length === 0) return true;
        setSaving(true);
        try {
          const res = await o.request(payload);
          await setView(res.data);
          markSaved();
          optsRef.current.onSaved?.(res.data, changed);
          return true;
        } catch (err) {
          optsRef.current.onError?.(isApiError(err) ? err : null, mode);
          return false;
        } finally {
          setSaving(false);
        }
      });
      chain.current = next.catch(() => false);
      return next;
    },
    [changedFields, setSaving, setView, markSaved]
  );

  const schedule = useCallback(
    (delay?: number) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        runSave("auto");
      }, delay ?? optsRef.current.delay ?? 700);
    },
    [runSave]
  );

  const saveNow = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    return runSave("manual");
  }, [runSave]);

  // "Save and exit" flushes pending edits.
  useEffect(() => {
    registerFlush(() => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      return runSave("auto");
    });
    return () => registerFlush(null);
  }, [registerFlush, runSave]);

  // Leaving the step (stepper link, back button) still saves pending edits;
  // the layout and its context outlive the page.
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        runSave("auto");
      }
    },
    [runSave]
  );

  return { schedule, saveNow, changedFields };
}
