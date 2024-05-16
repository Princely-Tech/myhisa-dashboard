"use client";
import React, { useState } from "react";
import {
  ContainerOutlined,
  DesktopOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Button, Menu } from "antd";
import { useRouter } from "next/navigation";
import routes from "@/utils/routes";

type MenuItem = Required<MenuProps>["items"][number];

const MyHisaSideBar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  const items: MenuItem[] = [
    {
      key: "2",
      icon: <DesktopOutlined />,
      label: "Dashboard",
      onClick: () => {
        router.push(routes.dashboard);
      },
    },
    {
      key: "sub1",
      label: "Transactions",
      icon: <ContainerOutlined />,
      children: [
        {
          key: "5",
          label: "All",
          onClick: () => {
            router.push(`${routes.transactions}`);
          },
        },
        {
          key: "6",
          label: "Today",
          onClick: () => {
            router.push(`${routes.transactions}?dateFilter=today`);
          },
        },
        {
          key: "7",
          label: "Last 7 days",
          onClick: () => {
            router.push(`${routes.transactions}?dateFilter=last-seven-days`);
          },
        },
        {
          key: "8",
          label: "Last 30 days",
          onClick: () => {
            router.push(`${routes.transactions}?dateFilter=last-thirty-days`);
          },
        },
      ],
    },
  ];
  return (
    <div className="bg-teal-500 max-w-[200px]">
      <Button
        type="primary"
        onClick={toggleCollapsed}
        style={{ marginBottom: 16 }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </Button>
      <Menu
        className="bg-transparent"
        defaultSelectedKeys={["1"]}
        defaultOpenKeys={["sub1"]}
        mode="inline"
        theme="light"
        inlineCollapsed={collapsed}
        items={items}
      />
    </div>
  );
};

export default MyHisaSideBar;
