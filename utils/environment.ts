/**
 * SANDBOX: which backend environment this dashboard build targets.
 *
 * Decided at BUILD time from NEXT_PUBLIC_ENVIRONMENT (Next.js inlines every
 * NEXT_PUBLIC_* variable into the bundle when `next build` runs), so the
 * sandbox dashboard is the same codebase built and deployed separately with
 * NEXT_PUBLIC_ENVIRONMENT=sandbox and NEXT_PUBLIC_API_URL pointing at the
 * sandbox API - see docs/SANDBOX_DASHBOARD.md. Anything other than "sandbox"
 * (including unset) means "live", so live behaviour is the default.
 *
 * At runtime components/EnvironmentBanner.tsx also compares this against the
 * `environment` field of GET /me and shows a red misconfiguration warning if
 * the API disagrees with the build (e.g. a sandbox build pointed at live).
 *
 * Pure module (no browser globals) so it is safe in middleware.ts too.
 */
export type Environment = "sandbox" | "live";

export const ENVIRONMENT: Environment =
  process.env.NEXT_PUBLIC_ENVIRONMENT === "sandbox" ? "sandbox" : "live";

export const isSandbox = ENVIRONMENT === "sandbox";

// SANDBOX: URL of the live dashboard, linked from the sandbox banner. The
// link is hidden when this is unset.
export const LIVE_DASHBOARD_URL = process.env.NEXT_PUBLIC_LIVE_DASHBOARD_URL || "";

// SANDBOX: statuses the backend treats as still pending
// (models.PendingLikeStatuses in hisa_go_api) - only these can be resolved
// via POST sandbox/transactions/:ref/resolve.
export const SANDBOX_RESOLVABLE_STATUSES = ["Pending", "Processing", "TelcoError", "InternalError"];

// ONBOARDING v2: optional links shown on the sign-up / onboarding screens.
// NEXT_PUBLIC_* values are inlined at build time.
// Sandbox dashboard, linked from the live "While you wait" card (hidden when
// unset, and never shown on a sandbox build itself).
export const SANDBOX_DASHBOARD_URL = process.env.NEXT_PUBLIC_SANDBOX_DASHBOARD_URL || "";
// Terms / privacy / pricing pages. Fall back to the in-app documentation.
export const TERMS_URL = process.env.NEXT_PUBLIC_TERMS_URL || "/documentation";
export const PRIVACY_URL = process.env.NEXT_PUBLIC_PRIVACY_URL || "/documentation";
export const PRICING_URL = process.env.NEXT_PUBLIC_PRICING_URL || "/documentation";
