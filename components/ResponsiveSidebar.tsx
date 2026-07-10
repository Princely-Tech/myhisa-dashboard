"use client";
import React, { useState, Suspense, useEffect } from "react";
import SidebarTwo from "./SidebarTwo";
import { usePathname } from "next/navigation";
import routes from "@/utils/routes";

const ResponsiveSidebar = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const showSidebarUI =
    pathname !== routes.login && pathname !== routes.register;
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="relative flex gap-2 overflow-hidden max-h-full max-w-full">
      {showSidebarUI && (
        <div className="">
          <button
            type="button"
            aria-label="Open sidebar"
            className="lg:hidden sticky top-4 left-4 w-fit inline-flex items-center justify-center rounded-md border border-gray-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm"
            onClick={() => setOpen(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M3.75 5.25h16.5a.75.75 0 0 0 0-1.5H3.75a.75.75 0 0 0 0 1.5Zm16.5 7.5H3.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5Zm0 9H3.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5Z" />
            </svg>
          </button>
        </div>
      )}

      {showSidebarUI && (
        <div className="hidden lg:block">
          <Suspense>
            <SidebarTwo />
          </Suspense>
        </div>
      )}

      {showSidebarUI && open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                aria-label="Close sidebar"
                className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white/90 px-2 py-1 shadow-sm"
                onClick={() => setOpen(false)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M6.225 4.811a.75.75 0 0 0-1.06 1.06L10.439 11l-5.274 5.129a.75.75 0 1 0 1.04 1.08L11.5 12.17l5.296 5.04a.75.75 0 0 0 1.046-1.074L12.56 11l5.298-5.129a.75.75 0 1 0-1.04-1.08l-5.318 5.07-5.275-5.05Z" />
                </svg>
              </button>
            </div>
            <div className="h-full overflow-y-auto">
              <Suspense>
                <SidebarTwo />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
};

export default ResponsiveSidebar;
