"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import routes from "@/utils/routes";
import apiEndpoints from "@/utils/api/apiEndpoints";
import AxiosHandler from "@/utils/api/axiosHandler";
import type { User } from "@/utils/types";
import { hasAccountPermission, isApproved } from "@/utils/accountPermissions";
import { isSandbox } from "@/utils/environment";
import { buildNav, findActiveItem } from "./navConfig";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import FundWalletModal from "./FundWalletModal";
import { ShellContext, ShellContextValue } from "./ShellContext";
import { focusRing } from "@/components/ui/styles";

// Never shelled (same as the old ResponsiveSidebar/SidebarTwo for login and
// register; verify-email is only reachable by an unverified session, which
// the middleware keeps off every other page, so a nav there is useless).
const BARE_ROUTES = [routes.login, routes.register, routes.verifyEmail];
// Public pages: shelled only when a session user exists (as before, when
// SidebarTwo rendered nothing without a stored user).
const PUBLIC_ROUTES = [routes.documentation, routes.sandboxTestValues];

const BASE_TITLE = `${isSandbox ? "[SANDBOX] " : ""}Hisa:Send Airtime and Data`;

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(apiEndpoints.userSetUrl);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname() ?? "";
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [meLoading, setMeLoading] = useState(false);
  const [meError, setMeError] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [fundOpen, setFundOpen] = useState(false);
  const meInFlight = useRef(false);

  // Re-read on navigation, like SidebarTwo did (login/logout change it).
  useEffect(() => {
    setUser(readStoredUser());
    setMounted(true);
    setNavOpen(false);
  }, [pathname]);

  const isBare = BARE_ROUTES.includes(pathname);
  const shelled =
    !isBare && (mounted ? !!user : !PUBLIC_ROUTES.includes(pathname));

  const refreshMe = useCallback(async () => {
    if (meInFlight.current) return;
    meInFlight.current = true;
    setMeLoading(true);
    try {
      // No message API: background refreshes stay silent, but a 401 still
      // triggers AxiosHandler's forced re-login.
      const res = await new AxiosHandler().get({ endPoint: apiEndpoints.me });
      setMe((res?.data as User) ?? null);
      setMeError(false);
    } catch {
      setMeError(true);
    } finally {
      meInFlight.current = false;
      setMeLoading(false);
    }
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!shelled || userId === undefined) return;
    refreshMe();
    // Balance chip stays fresh when the tab regains focus.
    const onFocus = () => refreshMe();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [shelled, userId, refreshMe]);

  const groups = useMemo(() => (user ? buildNav(user) : []), [user]);
  const active = useMemo(() => findActiveItem(groups, pathname), [groups, pathname]);

  // Per-page document title from the active nav item.
  useEffect(() => {
    if (!shelled) return;
    document.title = active ? `${isSandbox ? "[SANDBOX] " : ""}${active.label} · MyHisa` : BASE_TITLE;
  }, [shelled, active]);

  // Wallet balance/funding needs history.view on an approved account (the
  // same gate the old dashboard used for its history/stats widgets).
  const canSeeWallet = !!user && isApproved(user) && hasAccountPermission(user, "history.view");

  const ctx: ShellContextValue = useMemo(
    () => ({
      user,
      me,
      meLoading,
      meError,
      refreshMe,
      openFundWallet: () => setFundOpen(true),
    }),
    [user, me, meLoading, meError, refreshMe]
  );

  // `children` keeps the same position in the tree whether or not the
  // chrome renders, so toggling the shell never remounts the page.
  return (
    <ShellContext.Provider value={ctx}>
      <div className={shelled ? "flex min-h-screen bg-hisa-ground font-body tracking-normal text-hisa-ink" : ""}>
        {shelled && (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-[12px] focus:top-[12px] focus:z-50 focus:rounded-[8px] focus:bg-white focus:px-[12px] focus:py-2 focus:text-sm focus:font-semibold focus:text-hisa-primary focus:shadow"
          >
            Skip to content
          </a>
        )}
        {shelled && (
          <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 overflow-y-auto border-r-[1px] border-solid border-hisa-border bg-white lg:block">
            {user && <Sidebar groups={groups} activeKey={active?.key ?? null} user={user} idPrefix="desktop" />}
          </aside>
        )}
        <div className={shelled ? "flex min-w-0 flex-1 flex-col" : ""}>
          {shelled && user && (
            <TopBar
              user={user}
              me={me}
              meLoading={meLoading}
              canSeeWallet={canSeeWallet}
              navOpen={navOpen}
              onOpenNav={() => setNavOpen(true)}
              onFund={() => setFundOpen(true)}
            />
          )}
          <div id="main-content" className={shelled ? "min-w-0 flex-1" : ""}>
            {children}
          </div>
        </div>
      </div>

      {shelled && user && (
        <>
          <Drawer
            open={navOpen}
            onClose={() => setNavOpen(false)}
            placement="left"
            size={288}
            title={null}
            closable={false}
            styles={{ body: { padding: 0 } }}
            rootClassName="lg:hidden"
          >
            <div id="hisa-nav-drawer" className="relative">
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className={`absolute right-[12px] top-[16px] inline-flex h-9 w-9 items-center justify-center rounded-[8px] border-[1px] border-solid border-[#D0D5DD] bg-white text-hisa-body ${focusRing}`}
              >
                <CloseOutlined aria-hidden="true" />
              </button>
              <Sidebar groups={groups} activeKey={active?.key ?? null} user={user} idPrefix="drawer" />
            </div>
          </Drawer>
          <FundWalletModal
            open={fundOpen}
            onClose={() => setFundOpen(false)}
            user={user}
            me={me}
            meLoading={meLoading}
            onAccountGenerated={refreshMe}
          />
        </>
      )}
    </ShellContext.Provider>
  );
};

export default AppShell;
