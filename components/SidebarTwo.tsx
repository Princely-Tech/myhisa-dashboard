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
        <nav className="iq-sidebar-menu pb-8">
          <ul id="iq-sidebar-toggle" className="iq-menu">
            <MenuItem
              title="Dashboard"
              route={routes.dashboard}
              isActive={pathname == routes.dashboard}
              icon={<i className="las la-home iq-arrow-left"></i>}
            />

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
              
            <MenuItem
              title="Credit History"
              route={routes.creditHistory}
              isActive={pathname == routes.creditHistory}
              icon={<i className="las la-history iq-arrow-left"></i>}
            />

            <MenuItem
              title="Commission Credit History"
              route={routes.commissionCreditHistory}
              isActive={pathname == routes.commissionCreditHistory}
              icon={<i className="las la-coins iq-arrow-left"></i>}
            />

            <MenuItem
              title="Export Wallet Logs"
              route={routes.exportWalletLogs}
              isActive={pathname == routes.exportWalletLogs}
              icon={<i className="las la-file-download iq-arrow-left"></i>}
            />

            <MenuItem
              title="Pending Transactions"
              route={routes.pendingTransactions}
              isActive={pathname == routes.pendingTransactions}
              icon={<i className="las la-clock iq-arrow-left"></i>}
            />

            <MenuItem
              title="Transaction Lookup"
              route={routes.transactionLookup}
              isActive={pathname == routes.transactionLookup}
              icon={<i className="las la-search iq-arrow-left"></i>}
            />

            <MenuItem
              title="Service Availability"
              route={routes.availability}
              isActive={pathname == routes.availability}
              icon={<i className="las la-server iq-arrow-left"></i>}
            />

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

              <MenuItem
              title="Service Availability"
              route={routes.availability}
              isActive={pathname == routes.availability}
              icon={<i className="las la-server iq-arrow-left"></i>}
            />

            <MenuItem
              title="Webhooks"
              route={routes.webhooks}
              isActive={pathname == routes.webhooks}
              icon={<i className="las la-bell iq-arrow-left"></i>}
            />

            <MenuItem
              title="SMS Sender IDs"
              route={routes.senderIds}
              isActive={pathname == routes.senderIds}
              icon={<i className="las la-sms iq-arrow-left"></i>}
            />

            <MenuItem
              title="AI Assistant"
              route={routes.aiAssistant}
              isActive={pathname == routes.aiAssistant}
              icon={<i className="las la-robot iq-arrow-left"></i>}
            />

            <MenuItem
              title="Support Tickets"
              route={routes.tickets}
              isActive={pathname == routes.tickets}
              icon={<i className="las la-ticket-alt iq-arrow-left"></i>}
            />

            <CollapsibleMenuItem
              isActive={
                pathname == routes.testBeneficiaries ||
                pathname == routes.testTransactions
              }
              title="Perform Transactions"
              icon={<i className="las la-flask iq-arrow-left"></i>}
              menuItems={[
                {
                  title: "Beneficiaries",
                  route: routes.testBeneficiaries,
                  icon: <i className="las la-users iq-arrow-left"></i>,
                  isActive: pathname == routes.testBeneficiaries,
                },
                {
                  title: "New Transactions",
                  route: routes.testTransactions,
                  icon: <i className="las la-bolt iq-arrow-left"></i>,
                  isActive: pathname == routes.testTransactions,
                },
                {
                  title: "Data Plans",
                  route: routes.dataPlans,
                  icon: <i className="las la-database iq-arrow-left"></i>,
                  isActive: pathname == routes.dataPlans,
                },
                {
                  title: "Electricity Billers",
                  route: routes.electricityBillers,
                  icon: <i className="las la-bolt iq-arrow-left"></i>,
                  isActive: pathname == routes.electricityBillers,
                },
              ]}
            />

            {user && user?.rank > 0 && (
              <>
              

                <MenuItem
                  title="Wallet Reconciliation"
                  route={routes.walletReconciliation}
                  isActive={pathname == routes.walletReconciliation}
                  icon={<i className="las la-wallet iq-arrow-left"></i>}
                />
                <MenuItem
                  title="Telco Reconciliation"
                  route={routes.telcoReconciliation}
                  isActive={pathname == routes.telcoReconciliation}
                  icon={<i className="las la-signal iq-arrow-left"></i>}
                />
                <MenuItem
                  title="Users"
                  route={routes.users}
                  isActive={pathname == routes.users}
                  icon={<i className="las la-users iq-arrow-left"></i>}
                />
                <CollapsibleMenuItem
                  isActive={
                    pathname == routes.adminUserCreditHistory ||
                    pathname == routes.adminTransactions ||
                    pathname == routes.adminCommissions ||
                    pathname == routes.adminPendingTransactions ||
                    pathname == routes.adminTransactionLookup ||
                    pathname == routes.adminAvailability ||
                    pathname == routes.adminWebhookDeliveries ||
                    pathname == routes.adminCommissionDailySummary ||
                    pathname == routes.adminCommissionDailyDetails ||
                    pathname == routes.adminCommissionRates ||
                    pathname == routes.adminExportWalletLogs ||
                    pathname == routes.adminDataBundles ||
                    pathname == routes.adminTransactionGraphs ||
                    pathname == routes.adminAuditLogs
                  }
                  title="Admin Tools"
                  icon={<i className="las la-user-shield iq-arrow-left"></i>}
                  menuItems={[
                    {
                      title: "User Credit History",
                      route: routes.adminUserCreditHistory,
                      icon: <i className="las la-history iq-arrow-left"></i>,
                      isActive: pathname == routes.adminUserCreditHistory,
                    },
                    {
                      title: "Export Wallet Logs",
                      route: routes.adminExportWalletLogs,
                      icon: <i className="las la-file-download iq-arrow-left"></i>,
                      isActive: pathname == routes.adminExportWalletLogs,
                    },
                    {
                      title: "Transactions",
                      route: routes.adminTransactions,
                      icon: <i className="las la-exchange-alt iq-arrow-left"></i>,
                      isActive: pathname == routes.adminTransactions,
                    },
                    {
                      title: "Pending Transactions",
                      route: routes.adminPendingTransactions,
                      icon: <i className="las la-clock iq-arrow-left"></i>,
                      isActive: pathname == routes.adminPendingTransactions,
                    },
                    {
                      title: "Transaction Lookup",
                      route: routes.adminTransactionLookup,
                      icon: <i className="las la-search iq-arrow-left"></i>,
                      isActive: pathname == routes.adminTransactionLookup,
                    },
                    {
                      title: "Commissions",
                      route: routes.adminCommissions,
                      icon: <i className="las la-coins iq-arrow-left"></i>,
                      isActive: pathname == routes.adminCommissions,
                    },
                    {
                      title: "Commission Daily Summary",
                      route: routes.adminCommissionDailySummary,
                      icon: <i className="las la-calendar-check iq-arrow-left"></i>,
                      isActive: pathname == routes.adminCommissionDailySummary,
                    },
                    {
                      title: "Commission Daily Details",
                      route: routes.adminCommissionDailyDetails,
                      icon: <i className="las la-list-alt iq-arrow-left"></i>,
                      isActive: pathname == routes.adminCommissionDailyDetails,
                    },
                    {
                      title: "Manage Commission Rates",
                      route: routes.adminCommissionRates,
                      icon: <i className="las la-percentage iq-arrow-left"></i>,
                      isActive: pathname == routes.adminCommissionRates,
                    },
                    {
                      title: "Update Availability",
                      route: routes.adminAvailability,
                      icon: <i className="las la-server iq-arrow-left"></i>,
                      isActive: pathname == routes.adminAvailability,
                    },
                    {
                      title: "Webhook Deliveries",
                      route: routes.adminWebhookDeliveries,
                      icon: <i className="las la-paper-plane iq-arrow-left"></i>,
                      isActive: pathname == routes.adminWebhookDeliveries,
                    },
                    {
                      title: "Data Bundles",
                      route: routes.adminDataBundles,
                      icon: <i className="las la-database iq-arrow-left"></i>,
                      isActive: pathname == routes.adminDataBundles,
                    },
                    {
                      title: "Transaction Graphs",
                      route: routes.adminTransactionGraphs,
                      icon: <i className="las la-chart-line iq-arrow-left"></i>,
                      isActive: pathname == routes.adminTransactionGraphs,
                    },
                    {
                      title: "Audit Logs",
                      route: routes.adminAuditLogs,
                      icon: <i className="las la-clipboard-list iq-arrow-left"></i>,
                      isActive: pathname == routes.adminAuditLogs,
                    },
                  ]}
                />
              </>
            )}


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
          className={`${
            collapse ? "ri-arrow-right-s-line" : "ri-arrow-down-s-line"
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
