"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown, Skeleton } from "antd";
import type { MenuProps } from "antd";
import { MenuOutlined, SearchOutlined } from "@ant-design/icons";
import routes from "@/utils/routes";
import apiEndpoints from "@/utils/api/apiEndpoints";
import type { User } from "@/utils/types";
import { canAccessAccountPage, isApproved, isSubLogin } from "@/utils/accountPermissions";
import { formatNaira } from "@/utils/format";
import { btnPrimary, focusRing } from "@/components/ui/styles";
import { LOOKUP_SEARCH_EVENT } from "./events";


function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

/** Clears the session; awaits the httpOnly cookie removal before leaving. */
export async function logout() {
  try {
    localStorage.clear();
  } catch {
    // ignore
  }
  try {
    await fetch(apiEndpoints.cookie, { method: "DELETE" });
  } catch {
    // Network failure: the middleware will still bounce a stale cookie
    // holder once the token is rejected by the API.
  }
  // Full navigation so no in-memory session state survives.
  window.location.assign(routes.login);
}

interface TopBarProps {
  user: User;
  me: User | null;
  meLoading: boolean;
  canSeeWallet: boolean;
  navOpen: boolean;
  onOpenNav: () => void;
  onFund: () => void;
}

const TopBar = ({ user, me, meLoading, canSeeWallet, navOpen, onOpenNav, onFund }: TopBarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isMac, setIsMac] = useState(false);
  const canSearch = canAccessAccountPage(user, routes.transactionLookup);

  useEffect(() => {
    try {
      setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent));
    } catch {
      setIsMac(false);
    }
  }, []);

  // Ctrl/Cmd+K focuses the search box.
  useEffect(() => {
    if (!canSearch) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canSearch]);

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (pathname === routes.transactionLookup) {
      window.dispatchEvent(new CustomEvent<string>(LOOKUP_SEARCH_EVENT, { detail: q }));
    }
    router.push(`${routes.transactionLookup}?q=${encodeURIComponent(q)}`);
  };

  const displayName = user.sub_login?.name || user.name || user.email;
  const displayEmail = user.sub_login?.email || user.email;
  const primary = !isSubLogin(user);

  const menuItems: MenuProps["items"] = [
    {
      key: "who",
      disabled: true,
      label: (
        <div className="flex max-w-[240px] flex-col py-1">
          <span className="truncate font-semibold text-hisa-ink">{displayName}</span>
          <span className="truncate text-xs text-hisa-muted">{displayEmail}</span>
          {user.sub_login && (
            <span className="truncate text-xs text-hisa-muted">Sub-login of {user.name}</span>
          )}
        </div>
      ),
    },
    { type: "divider" },
    ...(primary
      ? [{ key: "profile", label: <Link href={routes.profile}>My registration</Link> }]
      : []),
    // Same rule as the sidebar item: primary login on an approved account.
    ...(primary && isApproved(user)
      ? [{ key: "sublogins", label: <Link href={routes.subLoginManagement}>Sub-logins</Link> }]
      : []),
    ...(primary ? [{ type: "divider" as const }] : []),
    { key: "logout", label: "Log out", danger: true },
  ];

  const balance = me?.wallet?.balance;

  return (
    <header className="sticky top-0 z-30 flex print:hidden flex-wrap items-center gap-3 border-b-[1px] border-solid border-hisa-border bg-white px-[16px] py-[12px] sm:px-[28px]">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        aria-expanded={navOpen}
        aria-controls="hisa-nav-drawer"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-[10px] border-[1px] border-solid border-[#D0D5DD] bg-white text-hisa-body lg:hidden ${focusRing}`}
      >
        <MenuOutlined aria-hidden="true" />
      </button>

      {canSearch ? (
        <form role="search" onSubmit={onSearch} className="relative order-last flex w-full sm:order-none sm:w-auto sm:max-w-[440px] sm:flex-1">
          <label htmlFor="hisa-global-search" className="sr-only">
            Look up a transaction reference
          </label>
          <SearchOutlined
            aria-hidden="true"
            className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[#98A2B3]"
          />
          <input
            ref={inputRef}
            id="hisa-global-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Look up a transaction or your reference"
            autoComplete="off"
            className={`h-[42px] w-full rounded-[10px] border-[1px] border-solid border-[#D0D5DD] bg-[#F9FAFB] pl-[36px] pr-[64px] text-sm text-hisa-ink placeholder:text-[#98A2B3] ${focusRing}`}
          />
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-[10px] top-1/2 hidden -translate-y-1/2 rounded-md border-[1px] border-solid border-[#D0D5DD] bg-white px-[6px] py-px font-mono text-xs text-hisa-muted shadow-none sm:inline-block"
          >
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </form>
      ) : (
        <div className="hidden flex-1 sm:block" />
      )}

      <div className="ml-auto flex items-center gap-3">
        {canSeeWallet && (
          <span className="hidden items-center gap-1 text-sm text-hisa-muted md:inline-flex">
            Balance{" "}
            {meLoading && balance === undefined ? (
              <Skeleton.Input active size="small" style={{ width: 90, minWidth: 90 }} />
            ) : (
              <strong className="font-mono font-medium text-hisa-ink">
                {balance === undefined ? "—" : formatNaira(balance)}
              </strong>
            )}
          </span>
        )}
        {canSeeWallet && (
          <button type="button" className={btnPrimary} onClick={onFund}>
            Fund wallet
          </button>
        )}
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: menuItems,
            onClick: ({ key }) => {
              if (key === "logout") logout();
            },
          }}
        >
          <button
            type="button"
            aria-label={`Account menu for ${displayName}`}
            className={`h-10 w-10 shrink-0 rounded-full border-0 bg-hisa-primary-soft font-heading text-sm font-bold text-hisa-primary-hover ${focusRing}`}
          >
            {initials(displayName)}
          </button>
        </Dropdown>
      </div>
    </header>
  );
};

export default TopBar;
