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
  if (pathname == routes.login || !user) {
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
      <div id="sidebar-scrollbar" className="">
        <nav className="iq-sidebar-menu">
          <ul id="iq-sidebar-toggle" className="iq-menu">
            <MenuItem
              title="Dashboard"
              route={routes.dashboard}
              isActive={pathname == routes.dashboard}
              icon={<i className="las la-home iq-arrow-left"></i>}
            />

            <CollapsibleMenuItem
              isActive={pathname == routes.transactions}
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
                pathname == routes.summariesTotal ||
                pathname == routes.summariesChannel ||
                pathname == routes.summariesNetwork ||
                pathname == routes.summariesUser
              }
              title="Summaries"
              icon={<i className="las la-chart-bar iq-arrow-left"></i>}
              menuItems={[
                {
                  title: "Total",
                  route: updateSearchParams({
                    searchParams,
                    pathname: routes.summariesTotal,
                    values: [],
                  }).pathname,
                  icon: <i className="las la-check-square iq-arrow-left"></i>,
                  isActive: pathname == routes.summariesTotal,
                },
                {
                  title: "User",
                  route: updateSearchParams({
                    searchParams,
                    pathname: routes.summariesUser,
                    values: [],
                  }).pathname,
                  icon: <i className="las la-user iq-arrow-left"></i>,
                  isActive: pathname == routes.summariesUser,
                },
                {
                  title: "Network",
                  route: updateSearchParams({
                    searchParams,
                    pathname: routes.summariesNetwork,
                    values: [],
                  }).pathname,
                  icon: <i className="las la-network-wired iq-arrow-left"></i>,
                  isActive: pathname == routes.summariesNetwork,
                },
                {
                  title: "Channel",
                  route: updateSearchParams({
                    searchParams,
                    pathname: routes.summariesChannel,
                    values: [],
                  }).pathname,
                  icon: <i className="las la-tv iq-arrow-left"></i>,
                  isActive: pathname == routes.summariesChannel,
                },
              ]}
            />

            <MenuItem
              title="Credit History"
              route={routes.creditHistory}
              isActive={pathname == routes.creditHistory}
              icon={<i className="las la-wallet iq-arrow-left"></i>}
            />
            {user && user?.rank > 0 && (
              <MenuItem
                title="Users"
                route={routes.users}
                isActive={pathname == routes.users}
                icon={<i className="las la-users iq-arrow-left"></i>}
              />
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
