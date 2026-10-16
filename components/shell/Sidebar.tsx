"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { DownOutlined } from "@ant-design/icons";
import logo from "@/app/icon.png";
import routes from "@/utils/routes";
import type { User } from "@/utils/types";
import type { NavGroup } from "./navConfig";
import { focusRing } from "@/components/ui/styles";

const COLLAPSE_STORAGE_KEY = "hisa:nav-collapsed";

function readStoredCollapsed(): Record<string, boolean> | null {
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : null;
  } catch {
    return null;
  }
}

interface SidebarProps {
  groups: NavGroup[];
  activeKey: string | null;
  user: User;
  /** Distinguishes the desktop and drawer instances (ids must be unique). */
  idPrefix: string;
}

const Sidebar = ({ groups, activeKey, user, idPrefix }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = readStoredCollapsed();
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      initial[g.id] = stored && g.id in stored ? !!stored[g.id] : !!g.defaultCollapsed;
    }
    setCollapsed(initial);
    // Only on mount / when the set of groups changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.map((g) => g.id).join("|")]);

  const groupHasActive = (g: NavGroup) =>
    g.entries.some((e) => e.kind === "item" && e.key === activeKey);

  const toggle = (id: string, currentlyCollapsed: boolean) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !currentlyCollapsed };
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable - keep in-memory state only
      }
      return next;
    });
  };

  return (
    <div className="flex h-full flex-col gap-[14px] px-[14px] pb-8 pt-[20px]">
      <Link
        href={routes.dashboard}
        className={`mx-2 mb-1 inline-flex w-fit rounded-md ${focusRing}`}
        aria-label="MyHisa dashboard home"
      >
        <Image src={logo} alt="" className="h-8 w-auto" priority />
      </Link>

      {user.sub_login && (
        <p className="m-0 rounded-[8px] bg-hisa-ground px-[10px] py-2 text-xs text-hisa-muted">
          Signed in as <strong className="text-hisa-body">{user.sub_login.name}</strong>
          <br />
          <span className="break-all">{user.sub_login.email}</span>
        </p>
      )}

      <nav aria-label="Main" className="flex flex-col gap-[14px]">
        {groups.map((group) => {
          const hasActive = groupHasActive(group);
          // A group holding the current page is always shown open.
          const isCollapsed = !hasActive && !!collapsed[group.id];
          const listId = `${idPrefix}-nav-${group.id}`;
          return (
            <div key={group.id} className="flex flex-col gap-[2px]">
              <button
                type="button"
                aria-expanded={!isCollapsed}
                aria-controls={listId}
                onClick={() => toggle(group.id, isCollapsed)}
                className={`flex w-full items-center justify-between rounded-md border-0 bg-transparent px-[10px] pb-1 pt-0 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-[#667085] hover:text-hisa-ink ${focusRing}`}
              >
                <span>{group.title}</span>
                <DownOutlined
                  aria-hidden="true"
                  className={`text-[10px] transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                />
              </button>
              {/* `hidden` class too: Tailwind's !important `flex` would beat the attribute. */}
              <ul
                id={listId}
                hidden={isCollapsed}
                className={`m-0 list-none flex-col gap-[2px] p-0 ${isCollapsed ? "hidden" : "flex"}`}
              >
                {group.entries.map((entry) => {
                  if (entry.kind === "heading") {
                    return (
                      <li
                        key={entry.key}
                        className="px-[10px] pb-[2px] pt-2 text-[11px] font-medium text-[#98A2B3]"
                      >
                        {entry.label}
                      </li>
                    );
                  }
                  const active = entry.key === activeKey;
                  return (
                    <li key={entry.key}>
                      <Link
                        href={entry.href}
                        aria-current={active ? "page" : undefined}
                        className={`block rounded-[8px] px-[10px] py-[9px] text-sm no-underline transition-colors ${focusRing} ${
                          active
                            ? "bg-hisa-primary-soft font-semibold text-hisa-primary-hover hover:text-hisa-primary-hover"
                            : "text-hisa-body hover:bg-hisa-ground hover:text-hisa-ink"
                        }`}
                      >
                        {entry.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
