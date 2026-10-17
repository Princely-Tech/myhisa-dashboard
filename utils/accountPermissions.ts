// Pure account (tenant/self-service) permission-evaluation helpers - no
// browser globals, no React, so this is shared between client components
// and the Next.js edge middleware (middleware.ts). Deliberately separate
// from utils/permissions.ts, which is the unrelated internal staff/admin
// RBAC system keyed off user.rank/user.permissions - a sub-login is never
// "staff", it's a restricted credential on a business account.
import type { User } from "./types";
import routes from "./routes";

export function isSubLogin(user?: User | null): boolean {
  return !!user?.sub_login;
}

export function isApproved(user?: User | null): boolean {
  return !!user?.approved_at;
}

export function hasAccountPermission(user?: User | null, permission?: string): boolean {
  if (!user) return false;
  if (!isSubLogin(user)) return true; // primary account owner has full account power
  if (!permission) return false;
  return !!user.sub_login?.permissions?.includes(permission);
}

// Maps the pages a sub-login's access can be restricted from to the account
// permission key required to view them. Routes not present here are always
// allowed (e.g. the dashboard, AI assistant, profile) - same "default
// allow, explicit deny-list" convention as PAGE_PERMISSIONS in
// utils/permissions.ts.
export const ACCOUNT_PAGE_PERMISSIONS: Record<string, string> = {
  [routes.transactions]: "history.view",
  [routes.creditHistory]: "history.view",
  [routes.commissionCreditHistory]: "history.view",
  [routes.exportWalletLogs]: "history.view",
  [routes.commissionSummary]: "history.view",
  [routes.commissionDetails]: "history.view",
  [routes.commissionByNetwork]: "history.view",
  [routes.transactionStats]: "history.view",
  [routes.pendingTransactions]: "history.view",
  [routes.transactionLookup]: "history.view",
  // Daily report: GET me/reports/daily requires what GET /history requires.
  [routes.reports]: "history.view",

  [routes.bulkAirtimeUpload]: "bulk_airtime.manage",
  [routes.bulkAirtimeCampaigns]: "bulk_airtime.manage",

  [routes.testBeneficiaries]: "test_transactions.manage",
  [routes.testTransactions]: "test_transactions.manage",

  [routes.senderIds]: "sender_ids.manage",
  [routes.webhooks]: "webhooks.manage",

  [routes.tickets]: "tickets.manage",
};

// Pages that only the primary account owner may ever see - not grantable
// via any permission (there's no dashboard flow for real purchases yet, so
// dataPlans/electricityBillers stay primary-only alongside sub-login
// management itself, rather than referencing a "purchases.manage"
// permission that doesn't exist in the catalog).
//
// The Developers area (routes.apiKeys) is primary-only because the API key
// endpoints are PrimaryLoginOnly on the backend. It is deliberately NOT in
// APPROVAL_REQUIRED_PAGES: me/api-key, me/refresh-api-key and me/settings
// sit in main.go's emailVerified group, so a pending partner can already get
// a key and set up IPs/webhooks. Sub-logins with webhooks.manage keep using
// routes.webhooks (which redirects primary logins here).
const PRIMARY_LOGIN_ONLY_PAGES = [
  routes.subLoginManagement,
  routes.dataPlans,
  routes.electricityBillers,
  routes.apiKeys,
];

// Pages backed by an endpoint that sits behind the backend's `approved`
// middleware group (main.go) - i.e. it 403s for an account still pending
// admin approval. Kept as an explicit list rather than "everything except a
// denylist" because a few pages (webhooks, tickets, AI assistant,
// availability) deliberately work pre-approval and must stay reachable so a
// pending partner can still get help/set things up. Keep this in sync with
// main.go's `approved := emailVerified.Group("")` block.
const APPROVAL_REQUIRED_PAGES = [
  routes.transactions,
  routes.queryPlain,
  routes.creditHistory,
  routes.commissionCreditHistory,
  routes.exportWalletLogs,
  routes.pendingTransactions,
  routes.transactionLookup,
  routes.reports,
  routes.commissionSummary,
  routes.commissionDetails,
  routes.commissionByNetwork,
  routes.senderIds,
  routes.bulkAirtimeUpload,
  routes.bulkAirtimeCampaigns,
  routes.testBeneficiaries,
  routes.testTransactions,
  routes.dataPlans,
  routes.electricityBillers,
  routes.subLoginManagement,
];

export function canAccessAccountPage(user: User | null | undefined, path: string): boolean {
  // Bulk airtime's review/status pages are dynamic (/bulk-airtime/review/:id,
  // /bulk-airtime/status/:id) so they can't be listed by exact path above -
  // the whole /bulk-airtime/ tree sits behind `approved` on the backend.
  const requiresApproval =
    APPROVAL_REQUIRED_PAGES.includes(path) || path.startsWith("/bulk-airtime/");
  if (requiresApproval && !isApproved(user)) {
    return false;
  }

  if (PRIMARY_LOGIN_ONLY_PAGES.includes(path)) {
    return !isSubLogin(user);
  }

  const required = ACCOUNT_PAGE_PERMISSIONS[path];
  if (!required) {
    return true;
  }

  return hasAccountPermission(user, required);
}
