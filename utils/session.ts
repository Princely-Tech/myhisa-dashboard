import apiEndpoints from "./api/apiEndpoints";
import routes from "./routes";
import type { CookieSetParams, User } from "./types";

// A 401 from the API means the token itself is no longer valid - expired,
// or the account behind it changed in a way that invalidated it (password
// reset, ban, etc). Distinct from a 403 (authenticated, just not allowed to
// do that) - a 401 means the whole session is dead, not just this one
// action, so every API client wipes the cached session and sends the user
// back to log in again instead of leaving them on a page where every
// button silently fails.
export function forceReLogin() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(apiEndpoints.tokenSetUrl);
  localStorage.removeItem(apiEndpoints.userSetUrl);
  fetch(apiEndpoints.cookie, { method: "DELETE" }).catch(() => {});

  // Small delay so a toast the caller already showed ("session expired...")
  // has a moment to paint before the full-page navigation replaces it.
  setTimeout(() => {
    window.location.href = `${routes.login}?session_expired=1`;
  }, 400);
}

// ---------------------------------------------------------------------------
// Session storage, exactly as the login/register pages have always done it:
// the token and user JSON in localStorage plus the same two cookies (set
// through the /api/cookie route, which middleware.ts reads).
// ---------------------------------------------------------------------------

const SESSION_COOKIE_MAX_AGE_MS = 31536000000;

async function setCookie(name: string, value: string) {
  const expires = new Date(Date.now() + SESSION_COOKIE_MAX_AGE_MS);
  const body: CookieSetParams = {
    cookie: `${name}=${value}; Path=/;Expires=${expires.toUTCString()}; HttpOnly; Secure; SameSite=Strict`,
  };
  await fetch(apiEndpoints.cookie, { method: "POST", body: JSON.stringify(body) });
}

/**
 * The slim user written to the `user` cookie. Browsers drop cookies over
 * ~4 KB, and the full user (wallet, KYC and onboarding fields) can get close,
 * so the cookie carries only what the edge middleware reads:
 * middleware.ts (email, email_verified_at), utils/permissions.ts
 * canAccessPage (rank, permissions), utils/accountPermissions.ts
 * canAccessAccountPage (sub_login.permissions, approved_at) and
 * utils/onboarding.ts routing (rank, onboarding_status, onboarding_flow,
 * email_verified_at). id and name are kept for identification. Client code
 * reads the FULL user from localStorage, never this cookie. Add a field here
 * before reading it from the cookie anywhere new.
 */
export type SessionUser = Pick<
  User,
  "id" | "email" | "name" | "rank" | "permissions" | "approved_at" | "email_verified_at" | "onboarding_status" | "onboarding_flow"
> & { sub_login?: { id: number; permissions: string[] } | null };

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    rank: user.rank,
    permissions: user.permissions,
    approved_at: user.approved_at ?? null,
    email_verified_at: user.email_verified_at ?? null,
    onboarding_status: user.onboarding_status ?? null,
    onboarding_flow: user.onboarding_flow ?? null,
    sub_login: user.sub_login ? { id: user.sub_login.id, permissions: user.sub_login.permissions ?? [] } : null,
  };
}

/** Persist a fresh session (login, signup): full user in localStorage, slim user in the cookie. */
export async function storeSession(token: string, user: User) {
  localStorage.setItem(apiEndpoints.tokenSetUrl, token);
  localStorage.setItem(apiEndpoints.userSetUrl, JSON.stringify(user));
  await setCookie(apiEndpoints.userSetUrl, JSON.stringify(toSessionUser(user)));
  await setCookie(apiEndpoints.tokenSetUrl, token);
}

/** Replace the stored user (full in localStorage, slim in the cookie) after a change. */
export async function storeUser(user: User) {
  localStorage.setItem(apiEndpoints.userSetUrl, JSON.stringify(user));
  await setCookie(apiEndpoints.userSetUrl, JSON.stringify(toSessionUser(user)));
}

export function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/** Clear the session without navigating (e.g. "Change email"). */
export async function clearSession() {
  try {
    localStorage.removeItem(apiEndpoints.tokenSetUrl);
    localStorage.removeItem(apiEndpoints.userSetUrl);
  } catch {
    // ignore
  }
  try {
    await fetch(apiEndpoints.cookie, { method: "DELETE" });
  } catch {
    // ignore
  }
}
