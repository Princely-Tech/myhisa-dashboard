"use client";
import Image from "next/image";
import {
  dashboardSidebarItems,
  defaultSideBarItems,
  othersSidebarItems,
  settingSidebarItems,
} from "@/utils/raw-data";
import p2White from "@/public/images/p2-white.svg";

import logoutIcon from "@/public/images/logout-icon.svg";

import type { MenuProps } from "antd";
import { Button, Menu } from "antd";
import routes from "@/utils/routes";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { cancelIcon } from "@/utils/images";
import { CustomButton } from "../buttons";
import { stripSearchParams, toggleSidebar } from "@/utils/helperfunctions";
import { useState } from "react";
import Ripple from "../ripple/ripple";
import { CustomLink } from "../links";

type MenuItem = Required<MenuProps>["items"][number];

const Sidebar: React.FC = () => {
  const pathName = usePathname();
  const router = useRouter();
  const obj = getCurrentSidebarItems();

  const [sideBarItems, setSideBarItems] = useState(obj.sideBarItems);
  let showBackIcon = obj.showBackIcon;
  let headerTitle = obj.headerTitle;

  const divStyle = {
    cursor: "pointer",
  };

  return (
    <div
      id="sidebar"
      className="className= bg-royalBlue  hidden md:block
    fixed  z-20 md:sticky
   "
    >
      <div className=" justify-between flex flex-col h-screen pt-4 ">
        {" "}
        <div className="px-2">
          <div className="flex gap-4 justify-between">
            {" "}
            <Image src={p2White} alt="Paytegrate" className="mx-auto mb-2" />
            <CustomButton type="text" onClick={() => toggleSidebar()}>
              <Image
                src={cancelIcon}
                alt="Cancel"
                className="mx-auto md:hidden filter grayscale brightness-0 invert "
              />
            </CustomButton>
          </div>
          {sideBarItems != defaultSideBarItems && (
            <div className="pl-[10px] py-3 flex flex-col gap-7">
              {showBackIcon && (
                <div
                  className="flex gap-2"
                  onClick={() => setSideBarItems(defaultSideBarItems)}
                  style={divStyle}
                >
                  <ArrowLeftOutlined className="text-[#FFFFFF] *:" />
                  <h2 className="text-[#FFFFFF] text-[12px] font-light">
                    Main Menu
                  </h2>
                </div>
              )}{" "}
              {headerTitle && (
                <h1 className="text-[#FFFFFF] text-[20px] font-medium">
                  {headerTitle}
                </h1>
              )}
            </div>
          )}
          {sideBarItems.map((item, index) => (
            <CustomLink
              href={`${item.route}`}
              key={index}
              className={`flex gap-[16px] items-center mb-2 px-3 py-[10px] rounded-md h-[40px]   ${
                stripSearchParams(item.route) == pathName
                  ? "bg-[#23F29B] hover:opacity-[0.97] text-royalBlue font-medium"
                  : "text-white hover:opacity-[0.9] "
              }`}
            >
              {}
              <Image
                src={item.icon.src}
                alt={item.icon.alt}
                className={`${
                  !(stripSearchParams(item.route) == pathName) &&
                  "filter grayscale brightness-0 invert"
                }`}
              />
              {item?.label}
            </CustomLink>
          ))}
        </div>
        <div
          className="flex gap-3 px-8 border-t  h-[80px] items-center border-[#D0D5DD]"
          onClick={() => router.push(routes.login)}
        >
          <Image src={logoutIcon} alt="logout" />
          <p className="text-[#F97066] font-light text-[14px] ">Logout</p>
        </div>
      </div>
    </div>
  );
  function getCurrentSidebarItems() {
    let sideBarItems = othersSidebarItems;
    let showBackIcon = true;
    let headerTitle;
    if (pathName == routes.dashboard) {
      sideBarItems = dashboardSidebarItems;
      showBackIcon = false;
    } else if (
      pathName == routes.profile ||
      pathName == routes.business ||
      pathName == routes.accounts ||
      pathName == routes.team ||
      pathName == routes.integrations ||
      pathName == routes.permissions
    ) {
      sideBarItems = settingSidebarItems;
      headerTitle = "Settings";
    } else if (
      pathName == routes.credit ||
      pathName == routes.marketPlace ||
      pathName == routes.fraudProtection
    ) {
      sideBarItems = defaultSideBarItems;
    } else {
      headerTitle = "Payments";
    }
    return { sideBarItems, showBackIcon, headerTitle };
  }
};
export default Sidebar;
