// Pure permission-evaluation helpers - no browser globals, no React. This
// lets the same logic be shared between client components and the Next.js
// edge middleware (middleware.ts), which cannot use client-only APIs.
import type { User } from "./types";
import routes from "./routes";

export function isSuperAdmin(user?: User | null): boolean {
  return !!user && user.rank === 2;
}

export function hasPermission(user?: User | null, permission?: string): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!permission) return false;
  return !!user.permissions?.includes(permission);
}

export function hasAnyPermission(user?: User | null, permissionList?: string[]): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  if (!permissionList || permissionList.length === 0) return false;
  return permissionList.some((permission) => user.permissions?.includes(permission));
}

// Maps every admin-only page route to the permission required to view it.
// Routes not present here are not permission-gated (e.g. pages shared by
// every authenticated user, or the login/register pages).
export const PAGE_PERMISSIONS: Record<string, string> = {
  [routes.users]: "users.view",
  [routes.walletReconciliation]: "reports.view",
  [routes.telcoReconciliation]: "reports.view",
  [routes.adminUserCreditHistory]: "wallet.view",
  [routes.adminTransactions]: "transactions.view",
  [routes.adminCommissions]: "commission.view",
  [routes.adminPendingTransactions]: "transactions.view",
  [routes.adminTransactionLookup]: "transactions.view",
  [routes.adminAvailability]: "availability.manage",
  [routes.adminWebhookDeliveries]: "webhooks.view",
  [routes.adminCommissionDailySummary]: "commission.view",
  [routes.adminCommissionDailyDetails]: "commission.view",
  [routes.adminCommissionRates]: "commission.manage",
  [routes.adminExportWalletLogs]: "wallet.view",
  [routes.adminDataBundles]: "data_bundles.view",
  [routes.adminTransactionStats]: "reports.view",
  [routes.adminTransactionGraphs]: "transactions.view",
  [routes.adminAuditLogs]: "audit_logs.view",
  [routes.adminServerLogs]: "logs.view",
  [routes.adminSettings]: "settings.manage",
  [routes.adminOnboarding]: "users.view",
};

// routes.adminStaffManagement is intentionally absent from PAGE_PERMISSIONS -
// it's never granted via a permission, only super admins may ever see it.
export function canAccessPage(user: User | null | undefined, path: string): boolean {
  if (path === routes.adminStaffManagement) {
    return isSuperAdmin(user);
  }

  // routes.adminTicketDetail is a dynamic /admin/tickets/:id route, so it
  // can't be keyed exactly in PAGE_PERMISSIONS below - gate the whole
  // /admin/tickets tree (list and detail) on the one prefix check instead.
  if (path.startsWith(routes.adminTickets)) {
    return hasPermission(user, "tickets.manage");
  }

  // routes.adminOnboardingDetail is a dynamic /admin/onboarding/:userId
  // route: viewing needs users.view like the queue (decisions need
  // users.manage, enforced by the backend and the page's buttons).
  if (path.startsWith(`${routes.adminOnboarding}/`)) {
    return hasPermission(user, "users.view");
  }

  const required = PAGE_PERMISSIONS[path];
  if (!required) {
    return true;
  }

  return hasPermission(user, required);
}
