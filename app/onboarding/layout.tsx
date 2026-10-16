"use client";
// Onboarding v2 wizard + status page. Rendered WITHOUT the main app shell
// (AppShell treats /onboarding/* as bare): a slim header with the logo, the
// "Saved x ago" indicator and "Save and exit".
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import logo from "@/app/icon.png";
import routes from "@/utils/routes";
import { isSandbox } from "@/utils/environment";
import { readStoredUser } from "@/utils/session";
import { isApiError, onboardingApi, refreshStoredUser } from "@/utils/api/onboardingApi";
import type { OnboardingView, User } from "@/utils/types";
import { logout } from "@/components/shell/TopBar";
import { OnboardingContext, OnboardingContextValue } from "@/components/onboarding/OnboardingContext";
import { CheckIcon, Notice, Spinner, linkButton } from "@/components/onboarding/ui";
import { btnSecondary } from "@/components/ui/styles";

const WIZARD_PATHS = [routes.onboardingBusiness, routes.onboardingIdentity, routes.onboardingReview];

function relativeSaved(d: Date, now: number): string {
  const secs = Math.max(0, Math.round((now - d.getTime()) / 1000));
  if (secs < 20) return "Saved just now";
  if (secs < 90) return "Saved 1 min ago";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `Saved ${mins} min ago`;
  return `Saved at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

const SavedIndicator = ({ savedAt, saving }: { savedAt: Date | null; saving: boolean }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setNow(Date.now()), [savedAt]);
  return (
    <span aria-live="polite" className="flex items-center gap-[6px] text-sm text-hisa-muted">
      {saving ? (
        <Spinner label="Saving…" />
      ) : savedAt ? (
        <>
          <span className="text-[#079455]">
            <CheckIcon size={16} />
          </span>
          {relativeSaved(savedAt, now)}
        </>
      ) : null}
    </span>
  );
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [view, setViewState] = useState<OnboardingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [exiting, setExiting] = useState(false);
  const flushRef = useRef<(() => Promise<boolean>) | null>(null);

  const syncStoredStatus = useCallback(async (v: OnboardingView) => {
    const stored = readStoredUser();
    if (stored && stored.onboarding_status !== v.status) {
      // The middleware routes on the stored user: keep it current.
      try {
        const fresh = await refreshStoredUser();
        setUser(fresh);
      } catch {
        // Next navigation will retry.
      }
    }
  }, []);

  const setView = useCallback(
    async (v: OnboardingView) => {
      setViewState(v);
      await syncStoredStatus(v);
    },
    [syncStoredStatus]
  );

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await onboardingApi.get();
      setViewState(res.data);
      await syncStoredStatus(res.data);
      return res.data;
    } catch (err) {
      if (isApiError(err) && err.status === 412) {
        // EmailVerified middleware: "You must verify your email first."
        router.replace(`${routes.verifyEmail}?email=${encodeURIComponent(readStoredUser()?.email ?? "")}`);
        return null;
      }
      setLoadError(isApiError(err) ? err.message : "We couldn't load your application.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [router, syncStoredStatus]);

  useEffect(() => {
    setUser(readStoredUser());
    reload();
  }, [reload]);

  // Client-side guard (the middleware routes on a cookie that can be stale).
  useEffect(() => {
    if (!view) return;
    const s = view.status;
    const onWizard = WIZARD_PATHS.includes(pathname);
    if (s === "approved" || s === "suspended") {
      if (pathname !== routes.onboardingStatus) router.replace(routes.dashboard);
      return;
    }
    if (onWizard) {
      const editable = s === "profile_incomplete" || (s === "queried" && view.flow === "v2");
      if (!editable) router.replace(routes.onboardingStatus);
      return;
    }
    if (pathname === routes.onboardingStatus && s === "profile_incomplete") {
      router.replace(routes.onboarding);
    }
  }, [view, pathname, router]);

  const registerFlush = useCallback((fn: (() => Promise<boolean>) | null) => {
    flushRef.current = fn;
  }, []);

  const flush = useCallback(async () => (flushRef.current ? flushRef.current() : true), []);

  const ctx: OnboardingContextValue = useMemo(
    () => ({
      view,
      loading,
      loadError,
      user,
      setView,
      reload,
      savedAt,
      saving,
      setSaving,
      markSaved: () => setSavedAt(new Date()),
      registerFlush,
      flush,
    }),
    [view, loading, loadError, user, setView, reload, savedAt, saving, registerFlush, flush]
  );

  const onWizard = WIZARD_PATHS.includes(pathname);

  const saveAndExit = async () => {
    setExiting(true);
    const ok = await flush();
    if (!ok) {
      setExiting(false);
      return;
    }
    await logout();
  };

  useEffect(() => {
    document.title = `${isSandbox ? "[SANDBOX] " : ""}Onboarding · MyHisa`;
  }, []);

  return (
    <OnboardingContext.Provider value={ctx}>
      <div className="flex min-h-screen flex-col bg-hisa-ground font-body text-hisa-ink">
        <a
          href="#onboarding-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-[12px] focus:top-[12px] focus:z-50 focus:rounded-[8px] focus:bg-white focus:px-[12px] focus:py-2 focus:text-sm focus:font-semibold focus:text-hisa-primary focus:shadow"
        >
          Skip to content
        </a>
        <header className="flex flex-wrap items-center justify-between gap-4 border-0 border-b-[1px] border-solid border-hisa-border bg-white px-[16px] py-[14px] sm:px-[32px]">
          <Image src={logo} alt="MyHisa" className="h-8 w-auto" priority />
          <div className="flex flex-wrap items-center gap-4 text-sm text-hisa-muted">
            {onWizard ? (
              <>
                <SavedIndicator savedAt={savedAt} saving={saving} />
                <button type="button" onClick={saveAndExit} disabled={exiting} className={linkButton}>
                  {exiting ? "Saving…" : "Save and exit"}
                </button>
              </>
            ) : (
              <>
                {user && (
                  <span className="hidden sm:inline">
                    {[view?.business.trading_name || view?.business.name || user.name, user.email].filter(Boolean).join(" · ")}
                  </span>
                )}
                <button type="button" onClick={() => logout()} className={linkButton}>
                  Log out
                </button>
              </>
            )}
          </div>
        </header>

        <div id="onboarding-main" className="flex-1">
          {loading ? (
            <div className="flex justify-center p-[48px]">
              <Spinner label="Loading your application…" />
            </div>
          ) : loadError && !view ? (
            <div className="mx-auto flex max-w-[560px] flex-col gap-4 p-[32px]">
              <Notice tone="error" live title="We couldn't load your application">
                {loadError}
              </Notice>
              <button type="button" className={`${btnSecondary} self-start`} onClick={() => reload()}>
                Try again
              </button>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}
