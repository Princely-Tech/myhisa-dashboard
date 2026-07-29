import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import constants from "./utils/constants";
import apiEndpoints from "./utils/api/apiEndpoints";
import routes from "./utils/routes";
import { User } from "./utils/types";
import { canAccessPage } from "./utils/permissions";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(apiEndpoints.tokenSetUrl);
  const publicRoutes = [routes.login, routes.register];
  if (!token && !publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.login}`
    );
  }

  const pathname = request.nextUrl.pathname;
  const isGated =
    pathname.startsWith("/admin") ||
    pathname === routes.users ||
    pathname === routes.walletReconciliation ||
    pathname === routes.telcoReconciliation;

  if (isGated) {
    const userCookie = request.cookies.get(apiEndpoints.userSetUrl);
    if (!userCookie) {
      return routeToDashboard();
    }

    let userJson: User;
    try {
      userJson = JSON.parse(userCookie.value) as User;
    } catch {
      return routeToDashboard();
    }

    if (!canAccessPage(userJson, pathname)) {
      return routeToDashboard();
    }
  }

  return NextResponse.next();
  function routeToDashboard() {
    return NextResponse.redirect(
      `${request.nextUrl.origin}${routes.dashboard}`
    );
  }
}
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
