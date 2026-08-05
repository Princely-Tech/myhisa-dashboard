import apiEndpoints from "./api/apiEndpoints";
import routes from "./routes";

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
