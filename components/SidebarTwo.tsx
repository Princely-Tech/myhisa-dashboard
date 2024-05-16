"use client";
import { formatDateTimeYYYYMMDD } from "@/utils/helperfunctions";
import routes, { transactionFilterStr } from "@/utils/routes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import logo from "@/app/icon.png";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Image from "next/image";

const SidebarTwo = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromDate = searchParams.get("from_date");

  if (pathname == routes.login) {
    return null;
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
    <div className="iq-card  m-0">
      <div className="mt-4">
        <Image src={logo} alt="myHisa" />
      </div>
      <div id="sidebar-scrollbar">
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
                  route: routes.transactions,
                  icon: <i className="las la-calendar-check iq-arrow-left"></i>,
                  isActive:
                    pathname == routes.transactions &&
                    currentCollapsibleActive == transactionFilterStr.all,
                },
                {
                  title: "Today",
                  route: `${routes.transactions}?from_date=${date}&to_date=${date}`,
                  icon: <i className="las la-calendar-day iq-arrow-left"></i>,
                  isActive:
                    currentCollapsibleActive == transactionFilterStr.today,
                },
                {
                  title: "Last 7 days",
                  route: `${routes.transactions}?from_date=${last7DaysDateStr}&to_date=${date}`,
                  isActive:
                    currentCollapsibleActive ==
                    transactionFilterStr.lastSevenDays,
                  icon: <i className="las la-calendar-week iq-arrow-left"></i>,
                },
                {
                  title: "Last 30 days",
                  route: `${routes.transactions}?from_date=${last30DaysDateStr}&to_date=${date}`,
                  isActive:
                    currentCollapsibleActive ==
                    transactionFilterStr.lastThirtyDays,
                  icon: <i className="las la-calendar iq-arrow-left"></i>,
                },
              ]}
            />
            <MenuItem
              onClick={() => {
                localStorage.clear();
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
  const [collapse, setCollapse] = useState(false);
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
