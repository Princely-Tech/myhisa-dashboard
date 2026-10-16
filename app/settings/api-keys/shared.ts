"use client";
// Helpers shared by the Developers area tabs (app/settings/api-keys).
import { useCallback, useEffect, useState } from "react";
import AxiosHandler from "@/utils/api/axiosHandler";
import apiEndpoints from "@/utils/api/apiEndpoints";
import type { PartnerSettings, PartnerSettingsResponse } from "@/utils/types";

export type DevTab = "api-keys" | "ip-whitelist" | "webhooks" | "alerts";

export const DEV_TABS: DevTab[] = ["api-keys", "ip-whitelist", "webhooks", "alerts"];

export function parseDevTab(value: string | null | undefined): DevTab {
  return DEV_TABS.find((t) => t === value) ?? "api-keys";
}

/** Same limit as helper.MaxIPWhitelistEntries on the backend. */
export const MAX_IP_WHITELIST_ENTRIES = 20;

// ---------------------------------------------------------------------------
// Storage flags (never throw: private mode / blocked storage just won't persist)
// ---------------------------------------------------------------------------

export function writeFlag(key: string) {
  try {
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // storage unavailable
  }
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

/** Copies text; falls back to a hidden textarea + execCommand. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
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
    ta.style.top = "0";
    ta.style.left = "0";
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

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | undefined>;
}

/** Best message from an axios error (backend uses `message` and/or `error`). */
export function apiErrorMessage(err: unknown, field?: string, fallback = "Something went wrong. Try again."): string {
  const data = (err as { response?: { data?: ApiErrorBody | string } } | null)?.response?.data;
  if (!data || typeof data === "string") return typeof data === "string" && data ? data : fallback;
  const fieldMsg = field ? data.errors?.[field]?.[0] : undefined;
  return fieldMsg || data.message || data.error || fallback;
}

// ---------------------------------------------------------------------------
// IP / CIDR validation (mirrors net.ParseIP / net.ParseCIDR closely enough
// for instant feedback; the backend re-validates and canonicalises)
// ---------------------------------------------------------------------------

const IPV4_OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";
const IPV4_RE = new RegExp(`^${IPV4_OCTET}(\\.${IPV4_OCTET}){3}$`);

function isIPv4(v: string): boolean {
  return IPV4_RE.test(v);
}

function isIPv6(v: string): boolean {
  if (!v.includes(":") || !/^[0-9a-fA-F:.]+$/.test(v)) return false;
  try {
    // The URL parser implements the full IPv6 grammar (incl. "::" and an
    // embedded IPv4 tail) and throws on anything invalid.
    new URL(`http://[${v}]/`);
    return true;
  } catch {
    return false;
  }
}

export type IpCheck = { ok: true; value: string } | { ok: false; error: string };

export function validateIpOrCidr(raw: string): IpCheck {
  const v = raw.trim();
  if (!v) return { ok: false, error: "Enter an IP address or CIDR range." };
  const invalid: IpCheck = {
    ok: false,
    error: `"${v}" is not a valid IPv4/IPv6 address or CIDR range (e.g. 197.210.10.4 or 197.210.10.0/24).`,
  };
  const parts = v.split("/");
  if (parts.length > 2) return invalid;
  const [addr, prefix] = parts;
  const v4 = isIPv4(addr);
  const v6 = !v4 && isIPv6(addr);
  if (!v4 && !v6) return invalid;
  if (prefix !== undefined) {
    if (!/^\d{1,3}$/.test(prefix)) return invalid;
    const n = Number(prefix);
    if (n > (v4 ? 32 : 128)) return invalid;
  }
  return { ok: true, value: v6 ? v.toLowerCase() : v };
}

// ---------------------------------------------------------------------------
// GET / PUT me/settings
// ---------------------------------------------------------------------------

function normalizeSettings(d: Partial<PartnerSettings> | null | undefined): PartnerSettings {
  const threshold = Number(d?.low_balance_threshold);
  const list: unknown = d?.ip_whitelist;
  return {
    low_balance_threshold: isFinite(threshold) && threshold > 0 ? threshold : 0,
    ip_whitelist: Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [],
  };
}

export interface PartnerSettingsState {
  data: PartnerSettings | null;
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
  /**
   * PUT me/settings with only the given fields. Resolves with the saved
   * (canonicalised) settings; rejects with the axios error. Silent: callers
   * show their own messages (a 401 still forces re-login).
   */
  save: (patch: Partial<PartnerSettings>) => Promise<PartnerSettings>;
}

export function usePartnerSettings(enabled: boolean): PartnerSettingsState {
  const [data, setData] = useState<PartnerSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = (await new AxiosHandler().get({ endPoint: apiEndpoints.meSettings })) as
        | PartnerSettingsResponse
        | undefined;
      if (!res?.data) throw new Error("empty settings");
      setData(normalizeSettings(res.data));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  const save = useCallback(async (patch: Partial<PartnerSettings>) => {
    const res = (await new AxiosHandler().put({ endPoint: apiEndpoints.meSettings, body: patch })) as
      | PartnerSettingsResponse
      | undefined;
    if (!res?.data) throw new Error("empty settings response");
    const next = normalizeSettings(res.data);
    setData(next);
    return next;
  }, []);

  return { data, loading: loading || (enabled && data === null && !error), error, reload, save };
}
