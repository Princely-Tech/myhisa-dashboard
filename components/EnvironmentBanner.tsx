"use client";
// SANDBOX: environment banner, rendered once from app/layout.tsx so it sits
// above every page (auth pages and authenticated pages alike).
//
// - Sandbox builds: a slim amber "TEST MODE" bar, always.
// - Any build: a red misconfiguration bar if GET /me reports a different
//   environment than this build was made for (utils/environment.ts).
//
// It is a normal-flow block (not position:fixed), so it never overlaps the
// sidebar/hamburger; the mobile sidebar drawer (fixed, z-50) still covers it.
import React, { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { usePathname } from "next/navigation";
import apiEndpoints from "@/utils/api/apiEndpoints";
import routes from "@/utils/routes";
import { ENVIRONMENT, isSandbox, LIVE_DASHBOARD_URL } from "@/utils/environment";

const EnvironmentBanner = () => {
  const pathname = usePathname();
  // Environment the API reported, once known.
  const [apiEnvironment, setApiEnvironment] = useState<string | null>(null);

  useEffect(() => {
    // The root layout persists across client navigations, so re-run on
    // pathname changes until a check has happened (e.g. right after login).
    if (apiEnvironment !== null || !apiEndpoints.base) return;
    let token: string | null = null;
    try {
      token = localStorage.getItem(apiEndpoints.tokenSetUrl);
    } catch {
      token = null;
    }
    if (!token) return;

    let cancelled = false;
    // Plain axios rather than AxiosHandler: this check must stay silent (no
    // error toasts, no forced re-login) - the page itself handles auth errors.
    axios
      .get(apiEndpoints.base + apiEndpoints.me, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (cancelled) return;
        const bodyEnv: unknown = res.data?.environment;
        const headerEnv: unknown = res.headers?.["x-hisa-environment"];
        let reported: string | null =
          typeof bodyEnv === "string"
            ? bodyEnv
            : typeof headerEnv === "string"
            ? headerEnv
            : null;
        // A sandbox API always reports itself; silence means it isn't one.
        // (A live build against an older API without the field: no warning.)
        if (reported === null && isSandbox) reported = "live";
        setApiEnvironment(reported ?? ENVIRONMENT);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, apiEnvironment]);

  const mismatch = apiEnvironment !== null && apiEnvironment !== ENVIRONMENT;

  if (!isSandbox && !mismatch) return null;

  return (
    <div className="w-full">
      {isSandbox && (
        <div
          role="status"
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-amber-400 px-3 py-1 text-center text-[12px] font-medium leading-tight text-amber-950"
        >
          <span>
            <strong>TEST MODE — Sandbox.</strong> No real airtime, bills or money.
          </span>
          <Link href={routes.sandboxTestValues} className="underline hover:no-underline">
            Test values
          </Link>
          {LIVE_DASHBOARD_URL && (
            <a href={LIVE_DASHBOARD_URL} className="underline hover:no-underline">
              Go to live dashboard
            </a>
          )}
        </div>
      )}
      {mismatch && (
        <div
          role="alert"
          className="bg-red-600 px-3 py-1 text-center text-[12px] font-semibold leading-tight text-white"
        >
          Misconfiguration: this dashboard was built for the {ENVIRONMENT} environment
          but the API reports &quot;{apiEnvironment}&quot;. Check NEXT_PUBLIC_API_URL /
          NEXT_PUBLIC_ENVIRONMENT and rebuild.
        </div>
      )}
    </div>
  );
};

export default EnvironmentBanner;
