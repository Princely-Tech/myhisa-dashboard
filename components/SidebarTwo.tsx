"use client";
import {
  formatDateTimeYYYYMMDD,
  newSearchParams,
  updateSearchParams,
} from "@/utils/helperfunctions";
import routes, { transactionFilterStr } from "@/utils/routes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import logo from "@/app/icon.png";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import constants from "@/utils/constants";
import { User } from "@/utils/types";
import { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import apiEndpoints from "@/utils/api/apiEndpoints";
import { hasPermission, isSuperAdmin } from "@/utils/permissions";
import { hasAccountPermission, isApproved, isSubLogin } from "@/utils/accountPermissions";

const SidebarTwo = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromDate = searchParams.get(constants.searchParamsKeys.fromDate);
  useEffect(() => {
    let userGet = localStorage.getItem(apiEndpoints.userSetUrl);
    if (userGet) {
      const userJson = JSON.parse(userGet) as User;
      setUser(userJson);
    }
  }, [pathname]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (pathname == routes.login || pathname == routes.register || !user) {
    return <></>;
  }
  const currentDate = new Date();
  const date = formatDateTimeYYYYMMDD(currentDate);
  var last7DaysDate = new Date();
  last7DaysDate.setDate(currentDate.getDate() - 7);
  const last7DaysDateStr = formatDateTimeYYYYMMDD(last7DaysDate);
  var last30DaysDate = new Date();
  last30DaysDate.setDate(currentDate.getDate() - 30);
  const last30DaysDateStr = formatDateTimeYYYYMMDD(last30DaysDate);
  let currentCollapsibleActive = transactionFilterStr.all;
  if (fromDate == last7DaysDateStr) {
    currentCollapsibleActive = transactionFilterStr.lastSevenDays;
  } else if (fromDate == last30DaysDateStr) {
    currentCollapsibleActive = transactionFilterStr.lastThirtyDays;
  } else if (fromDate == date) {
    currentCollapsibleActive = transactionFilterStr.today;
  }

  return (
    // <div className="iq-card  m-0 fixed z-10">
    <div className="iq-card  m-0  z-10">
      {/* <Cancel */}
      <div className="mt-4 ">
        <Image src={logo} alt="myHisa" />
      </div>
      <div id="sidebar-scrollbar" className="overflow-auto pb-20">
        {user.sub_login && (
          <div className="px-4 py-2 text-xs text-center opacity-70">
            Logged in as {user.sub_login.name} ({user.sub_login.email})
          </div>
        )}
        <nav className="iq-sidebar-menu pb-8">
          <ul id="iq-sidebar-toggle" className="iq-menu">
            <MenuItem
              title="Dashboard"
              route={routes.dashboard}
              isActive={pathname == routes.dashboard}
              icon={<i className="las la-home iq-arrow-left"></i>}
            />

            {!isSubLogin(user) && (
              <MenuItem
                title="My Registration"
                route={routes.profile}
                isActive={pathname == routes.profile}
                icon={<i className="las la-id-card iq-arrow-left"></i>}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <CollapsibleMenuItem
                isActive={
                  pathname == routes.transactions || pathname == routes.queryPlain
                }
                title="Transactions"
                icon={<i className="las la-list iq-arrow-left"></i>}
                menuItems={[
                  {
                    title: "All",
                    route: newSearchParams({
                      pathname: routes.transactions,
                      values: [
                        {
                          key: constants.searchParamsKeys.fromDate,
                          value: null,
                        },
                        {
                          key: constants.searchParamsKeys.toDate,
                          value: null,
                        },
                      ],
                    }).pathname,
                    icon: <i className="las la-calendar-check iq-arrow-left"></i>,
                    isActive:
                      pathname == routes.transactions &&
                      currentCollapsibleActive == transactionFilterStr.all,
                  },
                  {
                    title: "Today",
                    route: newSearchParams({
                      pathname: routes.transactions,
                      values: [
                        {
                          key: constants.searchParamsKeys.fromDate,
                          value: date,
                        },
                        {
                          key: constants.searchParamsKeys.toDate,
                          value: date,
                        },
                      ],
                    }).pathname,
                    icon: <i className="las la-calendar-day iq-arrow-left"></i>,
                    isActive:
                      currentCollapsibleActive == transactionFilterStr.today,
                  },
                  {
                    title: "Last 7 days",

                    route: newSearchParams({
                      pathname: routes.transactions,
                      values: [
                        {
                          key: constants.searchParamsKeys.fromDate,
                          value: last7DaysDateStr,
                        },
                        {
                          key: constants.searchParamsKeys.toDate,
                          value: date,
                        },
                      ],
                    }).pathname,
                    isActive:
                      currentCollapsibleActive ==
                      transactionFilterStr.lastSevenDays,
                    icon: <i className="las la-calendar-week iq-arrow-left"></i>,
                  },
                  {
                    title: "Last 30 days",
                    route: newSearchParams({
                      pathname: routes.transactions,
                      values: [
                        {
                          key: constants.searchParamsKeys.fromDate,
                          value: last30DaysDateStr,
                        },
                        {
                          key: constants.searchParamsKeys.toDate,
                          value: date,
                        },
                      ],
                    }).pathname,
                    isActive:
                      currentCollapsibleActive ==
                      transactionFilterStr.lastThirtyDays,
                    icon: <i className="las la-calendar iq-arrow-left"></i>,
                  },
                  {
                    title: "Export",
                    route: routes.exportTransacton,
                    isActive: pathname == routes.exportTransacton,
                    icon: <i className="las la-file-export iq-arrow-left"></i>,
                  },
                ]}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "bulk_airtime.manage") && (
              <CollapsibleMenuItem
                isActive={
                  pathname == routes.bulkAirtimeUpload ||
                  pathname == routes.bulkAirtimeCampaigns ||
                  pathname.startsWith("/bulk-airtime/")
                }
                title="Bulk Airtime"
                icon={<i className="las la-broadcast-tower iq-arrow-left"></i>}
                menuItems={[
                  {
                    title: "Upload",
                    route: routes.bulkAirtimeUpload,
                    icon: <i className="las la-upload iq-arrow-left"></i>,
                    isActive: pathname == routes.bulkAirtimeUpload,
                  },
                  {
                    title: "Campaigns",
                    route: routes.bulkAirtimeCampaigns,
                    icon: <i className="las la-list iq-arrow-left"></i>,
                    isActive: pathname == routes.bulkAirtimeCampaigns,
                  },
                ]}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <MenuItem
                title="Credit History"
                route={routes.creditHistory}
                isActive={pathname == routes.creditHistory}
                icon={<i className="las la-history iq-arrow-left"></i>}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <MenuItem
                title="Commission Credit History"
                route={routes.commissionCreditHistory}
                isActive={pathname == routes.commissionCreditHistory}
                icon={<i className="las la-coins iq-arrow-left"></i>}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <MenuItem
                title="Export Wallet Logs"
                route={routes.exportWalletLogs}
                isActive={pathname == routes.exportWalletLogs}
                icon={<i className="las la-file-download iq-arrow-left"></i>}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <MenuItem
                title="Pending Transactions"
                route={routes.pendingTransactions}
                isActive={pathname == routes.pendingTransactions}
                icon={<i className="las la-clock iq-arrow-left"></i>}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <MenuItem
                title="Transaction Lookup"
                route={routes.transactionLookup}
                isActive={pathname == routes.transactionLookup}
                icon={<i className="las la-search iq-arrow-left"></i>}
              />
            )}

            <MenuItem
              title="Service Availability"
              route={routes.availability}
              isActive={pathname == routes.availability}
              icon={<i className="las la-server iq-arrow-left"></i>}
            />

            {isApproved(user) && hasAccountPermission(user, "history.view") && (
              <CollapsibleMenuItem
                isActive={
                  pathname == routes.commissionSummary ||
                  pathname == routes.commissionDetails ||
                  pathname == routes.commissionByNetwork
                }
                title="Commission"
                icon={<i className="las la-coins iq-arrow-left"></i>}
                menuItems={[
                  {
                    title: "Summary",
                    route: routes.commissionSummary,
                    icon: <i className="las la-chart-pie iq-arrow-left"></i>,
                    isActive: pathname == routes.commissionSummary,
                  },
                  {
                    title: "Details",
                    route: routes.commissionDetails,
                    icon: <i className="las la-list-ul iq-arrow-left"></i>,
                    isActive: pathname == routes.commissionDetails,
                  },
                  {
                    title: "By Network",
                    route: routes.commissionByNetwork,
                    icon: <i className="las la-network-wired iq-arrow-left"></i>,
                    isActive: pathname == routes.commissionByNetwork,
                  },
                ]}
              />
            )}

            {hasAccountPermission(user, "webhooks.manage") && (
              <MenuItem
                title="Webhooks"
                route={routes.webhooks}
                isActive={pathname == routes.webhooks}
                icon={<i className="las la-bell iq-arrow-left"></i>}
              />
            )}

            {isApproved(user) && hasAccountPermission(user, "sender_ids.manage") && (
              <MenuItem
                title="SMS Sender IDs"
                route={routes.senderIds}
                isActive={pathname == routes.senderIds}
                icon={<i className="las la-sms iq-arrow-left"></i>}
              />
            )}

            <MenuItem
              title="AI Assistant"
              route={routes.aiAssistant}
              isActive={pathname == routes.aiAssistant}
              icon={<i className="las la-robot iq-arrow-left"></i>}
            />

            <MenuItem
              title="Documentation"
              route={routes.documentation}
              isActive={pathname == routes.documentation}
              icon={<i className="las la-book iq-arrow-left"></i>}
            />

            {hasAccountPermission(user, "tickets.manage") && (
              <MenuItem
                title="Support Tickets"
                route={routes.tickets}
                isActive={pathname == routes.tickets}
                icon={<i className="las la-ticket-alt iq-arrow-left"></i>}
              />
            )}

            {(() => {
              const performTransactionItems = [
                {
                  title: "Beneficiaries",
                  route: routes.testBeneficiaries,
                  icon: <i className="las la-users iq-arrow-left"></i>,
                  isActive: pathname == routes.testBeneficiaries,
                  allowed: hasAccountPermission(user, "test_transactions.manage"),
                },
                {
                  title: "New Transactions",
                  route: routes.testTransactions,
                  icon: <i className="las la-bolt iq-arrow-left"></i>,
                  isActive: pathname == routes.testTransactions,
                  allowed: hasAccountPermission(user, "test_transactions.manage"),
                },
                {
                  title: "Data Plans",
                  route: routes.dataPlans,
                  icon: <i className="las la-database iq-arrow-left"></i>,
                  isActive: pathname == routes.dataPlans,
                  // No dashboard flow for real purchases yet, so this stays
                  // primary-login-only rather than a grantable permission.
                  allowed: !isSubLogin(user),
                },
                {
                  title: "Electricity Billers",
                  route: routes.electricityBillers,
                  icon: <i className="las la-bolt iq-arrow-left"></i>,
                  isActive: pathname == routes.electricityBillers,
                  allowed: !isSubLogin(user),
                },
                {
                  title: "Cable Billers",
                  route: routes.cableBillers,
                  icon: <i className="las la-tv iq-arrow-left"></i>,
                  isActive: pathname == routes.cableBillers,
                  allowed: !isSubLogin(user),
                },
              ].filter((item) => item.allowed && isApproved(user));

              if (performTransactionItems.length === 0) {
                return null;
              }

              return (
                <CollapsibleMenuItem
                  isActive={performTransactionItems.some((item) => item.isActive)}
                  title="Perform Transactions"
                  icon={<i className="las la-flask iq-arrow-left"></i>}
                  menuItems={performTransactionItems}
                />
              );
            })()}

            {hasPermission(user, "reports.view") && (
              <MenuItem
                title="Wallet Reconciliation"
                route={routes.walletReconciliation}
                isActive={pathname == routes.walletReconciliation}
                icon={<i className="las la-wallet iq-arrow-left"></i>}
              />
            )}
            {hasPermission(user, "reports.view") && (
              <MenuItem
                title="Telco Reconciliation"
                route={routes.telcoReconciliation}
                isActive={pathname == routes.telcoReconciliation}
                icon={<i className="las la-signal iq-arrow-left"></i>}
              />
            )}
            {hasPermission(user, "users.view") && (
              <MenuItem
                title="Users"
                route={routes.users}
                isActive={pathname == routes.users}
                icon={<i className="las la-users iq-arrow-left"></i>}
              />
            )}
            {isSuperAdmin(user) && (
              <MenuItem
                title="Staff Management"
                route={routes.adminStaffManagement}
                isActive={pathname == routes.adminStaffManagement}
                icon={<i className="las la-user-shield iq-arrow-left"></i>}
              />
            )}
            {isApproved(user) && !isSubLogin(user) && (
              <MenuItem
                title="Sub-Login Management"
                route={routes.subLoginManagement}
                isActive={pathname == routes.subLoginManagement}
                icon={<i className="las la-user-friends iq-arrow-left"></i>}
              />
            )}
            {(() => {
              const adminToolItems = [
                {
                  title: "User Credit History",
                  route: routes.adminUserCreditHistory,
                  icon: <i className="las la-history iq-arrow-left"></i>,
                  isActive: pathname == routes.adminUserCreditHistory,
                  permission: "wallet.view",
                },
                {
                  title: "Export Wallet Logs",
                  route: routes.adminExportWalletLogs,
                  icon: <i className="las la-file-download iq-arrow-left"></i>,
                  isActive: pathname == routes.adminExportWalletLogs,
                  permission: "wallet.view",
                },
                {
                  title: "Transactions",
                  route: routes.adminTransactions,
                  icon: <i className="las la-exchange-alt iq-arrow-left"></i>,
                  isActive: pathname == routes.adminTransactions,
                  permission: "transactions.view",
                },
                {
                  title: "Export Transactions",
                  route: routes.adminExportTransactions,
                  icon: <i className="las la-file-export iq-arrow-left"></i>,
                  isActive: pathname == routes.adminExportTransactions,
                  permission: "transactions.view",
                },
                {
                  title: "Pending Transactions",
                  route: routes.adminPendingTransactions,
                  icon: <i className="las la-clock iq-arrow-left"></i>,
                  isActive: pathname == routes.adminPendingTransactions,
                  permission: "transactions.view",
                },
                {
                  title: "Transaction Lookup",
                  route: routes.adminTransactionLookup,
                  icon: <i className="las la-search iq-arrow-left"></i>,
                  isActive: pathname == routes.adminTransactionLookup,
                  permission: "transactions.view",
                },
                {
                  title: "Commissions",
                  route: routes.adminCommissions,
                  icon: <i className="las la-coins iq-arrow-left"></i>,
                  isActive: pathname == routes.adminCommissions,
                  permission: "commission.view",
                },
                {
                  title: "Commission Daily Summary",
                  route: routes.adminCommissionDailySummary,
                  icon: <i className="las la-calendar-check iq-arrow-left"></i>,
                  isActive: pathname == routes.adminCommissionDailySummary,
                  permission: "commission.view",
                },
                {
                  title: "Commission Daily Details",
                  route: routes.adminCommissionDailyDetails,
                  icon: <i className="las la-list-alt iq-arrow-left"></i>,
                  isActive: pathname == routes.adminCommissionDailyDetails,
                  permission: "commission.view",
                },
                {
                  title: "Manage Commission Rates",
                  route: routes.adminCommissionRates,
                  icon: <i className="las la-percentage iq-arrow-left"></i>,
                  isActive: pathname == routes.adminCommissionRates,
                  permission: "commission.manage",
                },
                {
                  title: "Update Availability",
                  route: routes.adminAvailability,
                  icon: <i className="las la-server iq-arrow-left"></i>,
                  isActive: pathname == routes.adminAvailability,
                  permission: "availability.manage",
                },
                {
                  title: "Webhook Deliveries",
                  route: routes.adminWebhookDeliveries,
                  icon: <i className="las la-paper-plane iq-arrow-left"></i>,
                  isActive: pathname == routes.adminWebhookDeliveries,
                  permission: "webhooks.view",
                },
                {
                  title: "Data Bundles",
                  route: routes.adminDataBundles,
                  icon: <i className="las la-database iq-arrow-left"></i>,
                  isActive: pathname == routes.adminDataBundles,
                  permission: "data_bundles.view",
                },
                {
                  title: "Transaction Graphs",
                  route: routes.adminTransactionGraphs,
                  icon: <i className="las la-chart-line iq-arrow-left"></i>,
                  isActive: pathname == routes.adminTransactionGraphs,
                  permission: "transactions.view",
                },
                {
                  title: "Audit Logs",
                  route: routes.adminAuditLogs,
                  icon: <i className="las la-clipboard-list iq-arrow-left"></i>,
                  isActive: pathname == routes.adminAuditLogs,
                  permission: "audit_logs.view",
                },
                {
                  title: "Server Logs",
                  route: routes.adminServerLogs,
                  icon: <i className="las la-file-download iq-arrow-left"></i>,
                  isActive: pathname == routes.adminServerLogs,
                  permission: "logs.view",
                },
                {
                  title: "Support Tickets",
                  route: routes.adminTickets,
                  icon: <i className="las la-ticket-alt iq-arrow-left"></i>,
                  isActive: pathname.startsWith(routes.adminTickets),
                  permission: "tickets.manage",
                },
                {
                  title: "Notification Settings",
                  route: routes.adminSettings,
                  icon: <i className="las la-bell iq-arrow-left"></i>,
                  isActive: pathname == routes.adminSettings,
                  permission: "settings.manage",
                },
              ].filter((item) => hasPermission(user, item.permission));

              if (adminToolItems.length === 0) {
                return null;
              }

              return (
                <CollapsibleMenuItem
                  isActive={adminToolItems.some((item) => item.isActive)}
                  title="Admin Tools"
                  icon={<i className="las la-user-shield iq-arrow-left"></i>}
                  menuItems={adminToolItems}
                />
              );
            })()}


            <MenuItem
              onClick={() => {
                localStorage.clear();
                const storeUser = fetch(apiEndpoints.cookie, {
                  method: "DELETE",
                });
              }}
              title="Logout"
              route={routes.login}
              icon={<i className="las la-sign-out-alt iq-arrow-left"></i>}
            />
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default SidebarTwo;
interface MenuItemProps {
  title: string;
  route: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}
const MenuItem = ({
  title,
  route,
  icon,
  isActive = false,
  onClick,
}: MenuItemProps) => {
  return (
    <li className={`${isActive && "active"}`} onClick={onClick}>
      <Link href={route} className="iq-waves-effect">
        {icon}
        <span>{title}</span>
      </Link>
    </li>
  );
};
const CollapsibleMenuItem = ({
  title,
  isActive,
  menuItems,
  icon,
}: {
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  menuItems: MenuItemProps[];
}) => {
  const [collapse, setCollapse] = useState(!isActive);
  return (
    <li className={`${isActive && "active active-menu"}`}>
      <Link
        href="#"
        className="iq-waves-effect"
        onClick={() => setCollapse((prevValue) => !prevValue)}
      >
        <span className="ripple rippleEffect"></span>
        {icon}
        <span>{title}</span>
        <i
          className={`${collapse ? "ri-arrow-right-s-line" : "ri-arrow-down-s-line"
            } iq-arrow-right`}
        ></i>
      </Link>
      <ul className={`iq-submenu show ${collapse && "hidden"}`}>
        {menuItems.map((item, index) => (
          <MenuItem key={index} {...item} />
        ))}
      </ul>
    </li>
  );
};
