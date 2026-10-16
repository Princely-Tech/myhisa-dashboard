// Sidebar information architecture. Visibility rules are ported 1:1 from the
// previous components/SidebarTwo.tsx (and stay in line with middleware.ts,
// utils/permissions.ts and utils/accountPermissions.ts): an item is shown to
// exactly the users the old sidebar showed it to. Items that were reachable
// but not linked before (transaction stats, admin transaction stats) use the
// same rule the middleware/page already enforces.
import routes from "@/utils/routes";
import type { User } from "@/utils/types";
import { hasPermission, isSuperAdmin } from "@/utils/permissions";
import { hasAccountPermission, isApproved, isSubLogin } from "@/utils/accountPermissions";
import { isSandbox } from "@/utils/environment";

export interface NavItem {
  kind: "item";
  key: string;
  label: string;
  href: string;
  /** Extra path prefixes that should also mark this item active. */
  matchPrefixes?: string[];
}

export interface NavHeading {
  kind: "heading";
  key: string;
  label: string;
}

export type NavEntry = NavItem | NavHeading;

export interface NavGroup {
  id: string;
  title: string;
  entries: NavEntry[];
  /** Start collapsed unless it contains the active page. */
  defaultCollapsed?: boolean;
}

const item = (
  label: string,
  href: string,
  visible: boolean,
  matchPrefixes?: string[]
): NavItem | null =>
  visible ? { kind: "item", key: href, label, href, matchPrefixes } : null;

const heading = (label: string): NavHeading => ({
  kind: "heading",
  key: `heading:${label}`,
  label,
});

function compact(entries: (NavEntry | null)[]): NavEntry[] {
  const list = entries.filter((e): e is NavEntry => e !== null);
  // Drop headings that have no items before the next heading / end.
  return list.filter((entry, i) => {
    if (entry.kind !== "heading") return true;
    const next = list[i + 1];
    return !!next && next.kind === "item";
  });
}

export function buildNav(user: User): NavGroup[] {
  const approved = isApproved(user);
  const primary = !isSubLogin(user);
  const canHistory = approved && hasAccountPermission(user, "history.view");
  const canBulk = approved && hasAccountPermission(user, "bulk_airtime.manage");
  const canSenderIds = approved && hasAccountPermission(user, "sender_ids.manage");
  const canTestTx = approved && hasAccountPermission(user, "test_transactions.manage");
  const canPrimaryResources = approved && primary;
  const perm = (p: string) => hasPermission(user, p);

  const groups: NavGroup[] = [
    {
      id: "overview",
      title: "Overview",
      entries: compact([
        item("Dashboard", routes.dashboard, true),
        item("Service status", routes.availability, true),
      ]),
    },
    {
      id: "wallet",
      title: "Wallet",
      entries: compact([
        item("Credit history", routes.creditHistory, canHistory),
        item("Commission credit history", routes.commissionCreditHistory, canHistory),
        item("Export wallet logs", routes.exportWalletLogs, canHistory),
      ]),
    },
    {
      id: "transactions",
      title: "Transactions",
      entries: compact([
        item("History", routes.transactions, canHistory),
        item("Pending", routes.pendingTransactions, canHistory),
        item("Lookup", routes.transactionLookup, canHistory),
        item("Stats", routes.transactionStats, canHistory),
        item("Export", routes.exportTransacton, canHistory),
      ]),
    },
    {
      id: "earnings",
      title: "Earnings",
      entries: compact([
        item("Commission summary", routes.commissionSummary, canHistory),
        item("Commission details", routes.commissionDetails, canHistory),
        item("Commission by network", routes.commissionByNetwork, canHistory),
      ]),
    },
    {
      id: "bulk",
      title: "Bulk & messaging",
      entries: compact([
        item("Bulk airtime upload", routes.bulkAirtimeUpload, canBulk),
        item("Bulk campaigns", routes.bulkAirtimeCampaigns, canBulk, [
          "/bulk-airtime/review/",
          "/bulk-airtime/status/",
        ]),
        item("Sender IDs", routes.senderIds, canSenderIds),
      ]),
    },
    {
      id: "developers",
      title: "Developers",
      entries: compact([
        // Developers area (API keys, IP whitelist, webhooks, alerts): primary
        // login only, works pre-approval like the backend endpoints. The old
        // webhooks page redirects primary logins here, so its paths (and the
        // per-webhook deliveries pages) mark this item active.
        item("API keys & webhooks", routes.apiKeys, primary, [routes.webhooks, "/webhooks/"]),
        // Sub-logins can't open the Developers area; one with webhooks.manage
        // keeps the standalone webhooks page (pre-approval, as before).
        item(
          "Webhooks",
          routes.webhooks,
          !primary && hasAccountPermission(user, "webhooks.manage"),
          ["/webhooks/"]
        ),
        heading(isSandbox ? "Test console" : "Live test console"),
        item("Test beneficiaries", routes.testBeneficiaries, canTestTx),
        item("Test transactions", routes.testTransactions, canTestTx),
        heading("Reference"),
        item("Data plans", routes.dataPlans, canPrimaryResources),
        item("Electricity billers", routes.electricityBillers, canPrimaryResources),
        item("Cable billers", routes.cableBillers, canPrimaryResources),
        item("Documentation", routes.documentation, true),
        // SANDBOX: test values page (sandbox builds only).
        item("Sandbox test values", routes.sandboxTestValues, isSandbox),
      ]),
    },
    {
      id: "account",
      title: "Account",
      entries: compact([
        item("My registration", routes.profile, primary),
        item("Sub-logins", routes.subLoginManagement, approved && primary),
      ]),
    },
    {
      id: "support",
      title: "Support",
      entries: compact([
        item("Tickets", routes.tickets, hasAccountPermission(user, "tickets.manage")),
        item("AI assistant", routes.aiAssistant, true),
      ]),
    },
    {
      id: "admin",
      title: "Admin",
      defaultCollapsed: true,
      entries: compact([
        heading("Partners & staff"),
        item("Users", routes.users, perm("users.view")),
        item("Staff management", routes.adminStaffManagement, isSuperAdmin(user)),
        item("User credit history", routes.adminUserCreditHistory, perm("wallet.view")),
        heading("Transactions ops"),
        item("Transactions", routes.adminTransactions, perm("transactions.view")),
        item("Pending transactions", routes.adminPendingTransactions, perm("transactions.view")),
        item("Transaction lookup", routes.adminTransactionLookup, perm("transactions.view")),
        item("Export transactions", routes.adminExportTransactions, perm("transactions.view")),
        heading("Commissions"),
        item("Commissions", routes.adminCommissions, perm("commission.view")),
        item("Daily summary", routes.adminCommissionDailySummary, perm("commission.view")),
        item("Daily details", routes.adminCommissionDailyDetails, perm("commission.view")),
        item("Commission rates", routes.adminCommissionRates, perm("commission.manage")),
        heading("Catalogue & availability"),
        item("Update availability", routes.adminAvailability, perm("availability.manage")),
        item("Data bundles", routes.adminDataBundles, perm("data_bundles.view")),
        heading("Reports & logs"),
        item("Wallet reconciliation", routes.walletReconciliation, perm("reports.view")),
        item("Telco reconciliation", routes.telcoReconciliation, perm("reports.view")),
        item("Transaction stats", routes.adminTransactionStats, perm("reports.view")),
        item("Transaction graphs", routes.adminTransactionGraphs, perm("transactions.view")),
        item("Export wallet logs", routes.adminExportWalletLogs, perm("wallet.view")),
        item("Webhook deliveries", routes.adminWebhookDeliveries, perm("webhooks.view")),
        item("Audit logs", routes.adminAuditLogs, perm("audit_logs.view")),
        item("Server logs", routes.adminServerLogs, perm("logs.view")),
        heading("Settings"),
        item("Support tickets", routes.adminTickets, perm("tickets.manage")),
        item("Notification settings", routes.adminSettings, perm("settings.manage")),
      ]),
    },
  ];

  return groups.filter((g) => g.entries.some((e) => e.kind === "item"));
}

function pathMatches(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) return pathname.startsWith(prefix);
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * The nav item for the current path: exact or sub-path match, longest href
 * wins (so /admin/commissions/daily-summary picks "Daily summary", not
 * "Commissions").
 */
export function findActiveItem(groups: NavGroup[], pathname: string): NavItem | null {
  let best: NavItem | null = null;
  let bestLen = -1;
  for (const group of groups) {
    for (const entry of group.entries) {
      if (entry.kind !== "item") continue;
      const candidates = [entry.href, ...(entry.matchPrefixes ?? [])];
      for (const c of candidates) {
        if (pathMatches(pathname, c) && c.length > bestLen) {
          best = entry;
          bestLen = c.length;
        }
      }
    }
  }
  return best;
}
