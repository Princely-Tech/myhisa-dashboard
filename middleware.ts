import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import constants from "./utils/constants";
import apiEndpoints from "./utils/api/apiEndpoints";
import routes from "./utils/routes";
import { User } from "./utils/types";
import { canAccessPage } from "./utils/permissions";
import { canAccessAccountPage } from "./utils/accountPermissions";

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

  const userCookie = request.cookies.get(apiEndpoints.userSetUrl);
  let userJson: User | null = null;
  if (userCookie) {
    try {
      userJson = JSON.parse(userCookie.value) as User;
    } catch {
      userJson = null;
    }
  }

  if (isGated) {
    if (!userJson) {
      return routeToDashboard();
    }

    if (!canAccessPage(userJson, pathname)) {
      return routeToDashboard();
    }
  }

  // Sub-login account-permission gating applies to ordinary self-service
  // pages outside the isGated set above, so it always runs (a primary
  // login is unaffected either way - canAccessAccountPage always allows it).
  if (userJson && !canAccessAccountPage(userJson, pathname)) {
    return routeToDashboard();
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
