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
const PRIMARY_LOGIN_ONLY_PAGES = [routes.subLoginManagement, routes.dataPlans, routes.electricityBillers];

export function canAccessAccountPage(user: User | null | undefined, path: string): boolean {
  if (PRIMARY_LOGIN_ONLY_PAGES.includes(path)) {
    return !isSubLogin(user);
  }

  const required = ACCOUNT_PAGE_PERMISSIONS[path];
  if (!required) {
    return true;
  }

  return hasAccountPermission(user, required);
}
