"use client";
import { Dropdown, Popover, Space, Switch } from "antd";
import { DownOutlined, MenuOutlined, SmileOutlined } from "@ant-design/icons";
import bellIcon from "@/public/images/bell.svg";
import type { MenuProps } from "antd";
import Image from "next/image";
import { BlueButton, CustomButton } from "../buttons";
import { BlueButtonLink } from "../links";
import routes from "@/utils/routes";
import Notifications from "../mainApp/Notifications";
import { toggleSidebar } from "@/utils/helperfunctions";
import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
const MainAppNavBar = ({ title }: { title: string }) => {
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <CustomButton className="text-[#E7ECFB] " block>
          <p className="text-[#000000] text-[14px] font-medium">My Account</p>
        </CustomButton>
      ),
    },
    {
      key: "2",
      label: <BlueButtonLink href={routes.login}>Logout</BlueButtonLink>,
    },
  ];
  return (
    <div className="flex justify-between py-3 px-5 border-b-2  border-[#EAECF0] items-center gap-3">
      <div className="flex gap-3 items-center">
        <CustomButton className="md:hidden" onClick={() => toggleSidebar()}>
          <div>
            <MenuOutlined />
          </div>
        </CustomButton>
        <h2 className="text-eigengrau font-medium text-[20px] ">{title}</h2>
      </div>
      <div className=" flex items-center gap-3">
        <Suspense fallback={null}>
          <SwitchToggle />
        </Suspense>
        <Popover
          placement="bottom"
          content={<Notifications />}
          className="cursor-pointer"
        >
          {" "}
          <Image src={bellIcon} alt="Notification" />
        </Popover>
        <Dropdown
          menu={{ items }}
          trigger={["click", "hover"]}
          className="cursor-pointer"
        >
          <div className="flex gap-1 items-start">
            {" "}
            <div className="bg-[#CFD9F7] h-[38px] w-[38px] flex justify-center items-center rounded-full">
              <p className="text-[#071A57] font-light text-[14px] ">UE</p>
            </div>
            <div className="hidden sm:flex ">
              {" "}
              <div>
                {" "}
                <p className="text-eigengrau font-medium text-[14px]">
                  Uche Emmanuel
                </p>
                <p className="text-[#7F7F7F] font-light text-[12px]">
                  Admin, Authoriser, Initiator
                </p>
              </div>
              <DownOutlined className="w-[10px] h-[10px] mt-2 " />
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default MainAppNavBar;
const SwitchToggle = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const mode = searchParams.get("mode");
  const router = useRouter();
  const updateMode = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode == "Test" ? "Live" : "Test");
    const newPathname = pathname + "?" + params.toString();
    router.push(newPathname);
    return;
  }, [searchParams, mode, pathname, router]);
  useEffect(() => {
    if (!mode) {
      updateMode();
    }
  }, [mode, updateMode]);
  return !mode ? null : (
    <div className="flex gap-2 items-center">
      {" "}
      <p className="font-medium text-[14px] text-eigengrau">{mode} Mode</p>
      <Switch checked={mode == "Live"} onChange={() => updateMode()} />
    </div>
  );
};
