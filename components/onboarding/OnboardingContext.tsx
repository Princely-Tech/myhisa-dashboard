"use client";
import { createContext, useContext } from "react";
import type { OnboardingView, User } from "@/utils/types";

export interface OnboardingContextValue {
  /** Latest GET /me/onboarding view (null while loading). */
  view: OnboardingView | null;
  loading: boolean;
  loadError: string | null;
  /** Session user from localStorage. */
  user: User | null;
  /** Replace the view after a write; syncs the stored user if the status moved. */
  setView: (v: OnboardingView) => Promise<void>;
  reload: () => Promise<OnboardingView | null>;
  /** "Saved x ago" indicator. */
  savedAt: Date | null;
  saving: boolean;
  setSaving: (b: boolean) => void;
  markSaved: () => void;
  /** The active step registers a function that saves pending edits. */
  registerFlush: (fn: (() => Promise<boolean>) | null) => void;
  /** Save pending edits of the active step; resolves false if saving failed. */
  flush: () => Promise<boolean>;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside app/onboarding/layout.tsx");
  return ctx;
}
